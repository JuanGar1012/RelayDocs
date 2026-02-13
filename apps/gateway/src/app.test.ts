import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import {
  type DocumentServiceClient,
  DownstreamServiceError
} from "./client/documentServiceClient.js";
import type { DocumentRecord } from "./schemas/documents.js";

function authHeader(userId: string): { authorization: string } {
  return {
    authorization: `Bearer dev-token-${userId}`
  };
}

function createMockDocumentClient(): DocumentServiceClient {
  const documents: DocumentRecord[] = [];
  const users = new Map<string, string>();
  let nextId = 1;

  function getDocumentOrThrow(id: string): DocumentRecord {
    const document = documents.find((candidate) => String(candidate.id) === id);

    if (!document) {
      throw new DownstreamServiceError(404, "Document not found");
    }

    return document;
  }

  return {
    async signup(body): Promise<{ userId: string }> {
      if (users.has(body.username)) {
        throw new DownstreamServiceError(400, "Username already exists");
      }

      users.set(body.username, body.password);
      return { userId: body.username };
    },
    async login(body): Promise<{ userId: string }> {
      const existingPassword = users.get(body.username);

      if (!existingPassword || existingPassword !== body.password) {
        throw new DownstreamServiceError(401, "Invalid credentials");
      }

      return { userId: body.username };
    },
    async listDocuments(userId: string): Promise<DocumentRecord[]> {
      return documents.filter((document) => {
        return document.ownerUserId === userId || document.sharedWith[userId] !== undefined;
      });
    },
    async createDocument(userId: string, body): Promise<DocumentRecord> {
      const now = new Date().toISOString();
      const created: DocumentRecord = {
        id: String(nextId++),
        ownerUserId: userId,
        title: body.title,
        content: body.content,
        sharedWith: {},
        createdAt: now,
        updatedAt: now
      };

      documents.push(created);
      return created;
    },
    async getDocument(userId: string, id: string): Promise<DocumentRecord> {
      const document = getDocumentOrThrow(id);

      if (document.ownerUserId !== userId && document.sharedWith[userId] === undefined) {
        throw new DownstreamServiceError(403, "Forbidden");
      }

      return document;
    },
    async updateDocument(userId: string, id: string, body): Promise<DocumentRecord> {
      const document = getDocumentOrThrow(id);
      const role = document.sharedWith[userId];

      if (document.ownerUserId !== userId && role !== "editor") {
        throw new DownstreamServiceError(403, "Forbidden");
      }

      const updated: DocumentRecord = {
        ...document,
        title: body.title ?? document.title,
        content: body.content ?? document.content,
        updatedAt: new Date().toISOString()
      };

      const index = documents.findIndex((candidate) => candidate.id === document.id);
      documents[index] = updated;
      return updated;
    },
    async shareDocument(userId: string, id: string, body): Promise<DocumentRecord> {
      const document = getDocumentOrThrow(id);

      if (document.ownerUserId !== userId) {
        throw new DownstreamServiceError(403, "Forbidden");
      }

      const updated: DocumentRecord = {
        ...document,
        sharedWith: {
          ...document.sharedWith,
          [body.userId]: body.role
        },
        updatedAt: new Date().toISOString()
      };

      const index = documents.findIndex((candidate) => candidate.id === document.id);
      documents[index] = updated;
      return updated;
    }
  };
}

let app = createApp({ documentServiceClient: createMockDocumentClient() });

describe("gateway", () => {
  beforeEach(() => {
    app = createApp({ documentServiceClient: createMockDocumentClient() });
  });

  it("returns health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ service: "gateway", status: "ok" });
  });

  it("creates and reads document for owner", async () => {
    const createResponse = await request(app)
      .post("/api/v1/documents")
      .set(authHeader("u1"))
      .send({ title: "Doc A", content: "Body A" });

    expect(createResponse.status).toBe(201);

    const id = createResponse.body.document.id as string;

    const fetchResponse = await request(app)
      .get(`/api/v1/documents/${id}`)
      .set(authHeader("u1"));

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.document.title).toBe("Doc A");
  });

  it("enforces authorization", async () => {
    const createResponse = await request(app)
      .post("/api/v1/documents")
      .set(authHeader("owner"))
      .send({ title: "Secret", content: "Classified" });

    const id = createResponse.body.document.id as string;

    const forbiddenRead = await request(app)
      .get(`/api/v1/documents/${id}`)
      .set(authHeader("other-user"));

    expect(forbiddenRead.status).toBe(403);

    const shareResponse = await request(app)
      .post(`/api/v1/documents/${id}/share`)
      .set(authHeader("owner"))
      .send({ userId: "other-user", role: "viewer" });

    expect(shareResponse.status).toBe(200);

    const allowedRead = await request(app)
      .get(`/api/v1/documents/${id}`)
      .set(authHeader("other-user"));

    expect(allowedRead.status).toBe(200);

    const forbiddenEdit = await request(app)
      .patch(`/api/v1/documents/${id}`)
      .set(authHeader("other-user"))
      .send({ content: "Updated" });

    expect(forbiddenEdit.status).toBe(403);
  });

  it("rejects unauthenticated access", async () => {
    const response = await request(app).get("/api/v1/documents");
    expect(response.status).toBe(401);
  });

  it("rejects invalid document ids at the gateway boundary", async () => {
    const response = await request(app)
      .get("/api/v1/documents/not-a-number")
      .set(authHeader("u1"));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid request");
  });

  it("signs up and logs in a user", async () => {
    const signupResponse = await request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "new-user", password: "password123" });

    expect(signupResponse.status).toBe(201);
    expect(typeof signupResponse.body.token).toBe("string");
    expect(signupResponse.body.userId).toBe("new-user");

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "new-user", password: "password123" });

    expect(loginResponse.status).toBe(200);
    expect(typeof loginResponse.body.token).toBe("string");
    expect(loginResponse.body.userId).toBe("new-user");
  });
});
