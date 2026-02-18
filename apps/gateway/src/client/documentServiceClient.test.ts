import { afterEach, describe, expect, it, vi } from "vitest";
import { runWithRequestContext } from "../context/requestContext.js";
import {
  createHttpDocumentServiceClient,
  DownstreamServiceError
} from "./documentServiceClient.js";

describe("documentServiceClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards x-user-id header for downstream requests", async () => {
    let capturedRequestInit: RequestInit | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      void input;
      capturedRequestInit = init;
      return new Response(JSON.stringify({ documents: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpDocumentServiceClient("http://document-service:8081");
    await runWithRequestContext("req-123", async () => {
      await client.listDocuments("u-123");
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedRequestInit?.headers).toMatchObject({
      "x-user-id": "u-123",
      "x-request-id": "req-123",
      "content-type": "application/json"
    });
  });

  it("maps share roles to upstream enum casing", async () => {
    let capturedRequestInit: RequestInit | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      void input;
      capturedRequestInit = init;
      return new Response(
        JSON.stringify({
          document: {
            id: "1",
            ownerUserId: "owner",
            title: "Doc",
            content: "Body",
            sharedWith: { "target-user": "viewer" },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
          }
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpDocumentServiceClient("http://document-service:8081");
    await client.shareDocument("owner", "1", { userId: "target-user", role: "viewer" });

    expect(capturedRequestInit?.method).toBe("POST");
    expect(capturedRequestInit?.body).toBe(JSON.stringify({ userId: "target-user", role: "VIEWER" }));
  });

  it("propagates downstream message for 4xx/5xx responses", async () => {
    const fetchMock = vi.fn(async (): Promise<Response> => {
      return new Response(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" }
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpDocumentServiceClient("http://document-service:8081");

    await expect(client.getDocument("u-123", "11")).rejects.toEqual(
      expect.objectContaining<Partial<DownstreamServiceError>>({
        statusCode: 403,
        message: "Forbidden"
      })
    );
  });

  it("falls back to a default downstream error message for non-json responses", async () => {
    const fetchMock = vi.fn(async (): Promise<Response> => {
      return new Response("bad gateway", { status: 502 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpDocumentServiceClient("http://document-service:8081");

    await expect(client.listDocuments("u-123")).rejects.toEqual(
      expect.objectContaining<Partial<DownstreamServiceError>>({
        statusCode: 502,
        message: "Downstream request failed"
      })
    );
  });
});
