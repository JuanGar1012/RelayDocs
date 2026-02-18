import type {
  CreateDocumentBody,
  DocumentRecord,
  ShareDocumentBody,
  UpdateDocumentBody
} from "../schemas/documents.js";
import type { LoginBody, SignupBody } from "../schemas/auth.js";
import { getRequestId } from "../context/requestContext.js";

interface ErrorBody {
  message?: string;
}

export class DownstreamServiceError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface DocumentServiceClient {
  signup(body: SignupBody): Promise<{ userId: string }>;
  login(body: LoginBody): Promise<{ userId: string }>;
  listDocuments(userId: string): Promise<DocumentRecord[]>;
  createDocument(userId: string, body: CreateDocumentBody): Promise<DocumentRecord>;
  getDocument(userId: string, id: string): Promise<DocumentRecord>;
  updateDocument(userId: string, id: string, body: UpdateDocumentBody): Promise<DocumentRecord>;
  shareDocument(userId: string, id: string, body: ShareDocumentBody): Promise<DocumentRecord>;
}

interface SingleDocumentApiResponse {
  document: DocumentRecord;
}

interface ListDocumentApiResponse {
  documents: DocumentRecord[];
}

interface AuthUserApiResponse {
  user: {
    userId: string;
  };
}

function parseErrorBody(value: unknown): ErrorBody {
  if (typeof value === "object" && value !== null && "message" in value) {
    const maybeMessage = (value as { message?: unknown }).message;

    if (typeof maybeMessage === "string") {
      return { message: maybeMessage };
    }
  }

  return {};
}

export function createHttpDocumentServiceClient(baseUrl: string): DocumentServiceClient {
  async function request<T>(path: string, userId: string | null, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(init?.headers as Record<string, string> | undefined)
    };

    if (userId) {
      headers["x-user-id"] = userId;
    }

    const requestId = getRequestId();
    if (requestId) {
      headers["x-request-id"] = requestId;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers
    });

    const responseBody = (await response.json().catch((): null => null)) as unknown;

    if (!response.ok) {
      const parsedError = parseErrorBody(responseBody);
      throw new DownstreamServiceError(response.status, parsedError.message ?? "Downstream request failed");
    }

    return responseBody as T;
  }

  return {
    async signup(body: SignupBody): Promise<{ userId: string }> {
      const response = await request<AuthUserApiResponse>("/api/v1/auth/signup", null, {
        method: "POST",
        body: JSON.stringify(body)
      });

      return { userId: response.user.userId };
    },
    async login(body: LoginBody): Promise<{ userId: string }> {
      const response = await request<AuthUserApiResponse>("/api/v1/auth/login", null, {
        method: "POST",
        body: JSON.stringify(body)
      });

      return { userId: response.user.userId };
    },
    async listDocuments(userId: string): Promise<DocumentRecord[]> {
      const response = await request<ListDocumentApiResponse>("/api/v1/documents", userId);
      return response.documents;
    },
    async createDocument(userId: string, body: CreateDocumentBody): Promise<DocumentRecord> {
      const response = await request<SingleDocumentApiResponse>("/api/v1/documents", userId, {
        method: "POST",
        body: JSON.stringify(body)
      });

      return response.document;
    },
    async getDocument(userId: string, id: string): Promise<DocumentRecord> {
      const response = await request<SingleDocumentApiResponse>(`/api/v1/documents/${id}`, userId);
      return response.document;
    },
    async updateDocument(userId: string, id: string, body: UpdateDocumentBody): Promise<DocumentRecord> {
      const response = await request<SingleDocumentApiResponse>(`/api/v1/documents/${id}`, userId, {
        method: "PATCH",
        body: JSON.stringify(body)
      });

      return response.document;
    },
    async shareDocument(userId: string, id: string, body: ShareDocumentBody): Promise<DocumentRecord> {
      const response = await request<SingleDocumentApiResponse>(`/api/v1/documents/${id}/share`, userId, {
        method: "POST",
        body: JSON.stringify({
          userId: body.userId,
          role: body.role.toUpperCase()
        })
      });

      return response.document;
    }
  };
}
