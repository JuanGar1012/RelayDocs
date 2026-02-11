import type {
  CreateDocumentBody,
  DocumentRecord,
  ListDocumentsResponse,
  ShareDocumentBody,
  SingleDocumentResponse,
  UpdateDocumentBody
} from "../types/documents";

const BASE_URL = import.meta.env.VITE_GATEWAY_BASE_URL ?? "http://localhost:8080";
const DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN ?? "dev-token-u1";

interface ErrorPayload {
  message?: string;
}

function parseErrorPayload(value: unknown): ErrorPayload {
  if (typeof value === "object" && value !== null && "message" in value) {
    const message = (value as { message?: unknown }).message;

    if (typeof message === "string") {
      return { message };
    }
  }

  return {};
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${DEV_TOKEN}`,
      ...init?.headers
    }
  });

  const body = (await response.json().catch((): null => null)) as unknown;

  if (!response.ok) {
    const errorPayload = parseErrorPayload(body);
    throw new Error(errorPayload.message ?? "Request failed");
  }

  return body as T;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const payload = await requestJson<ListDocumentsResponse>("/api/v1/documents");
  return payload.documents;
}

export async function createDocument(input: CreateDocumentBody): Promise<DocumentRecord> {
  const payload = await requestJson<SingleDocumentResponse>("/api/v1/documents", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return payload.document;
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  const payload = await requestJson<SingleDocumentResponse>(`/api/v1/documents/${id}`);
  return payload.document;
}

export async function updateDocument(id: string, input: UpdateDocumentBody): Promise<DocumentRecord> {
  const payload = await requestJson<SingleDocumentResponse>(`/api/v1/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });

  return payload.document;
}

export async function shareDocument(id: string, input: ShareDocumentBody): Promise<DocumentRecord> {
  const payload = await requestJson<SingleDocumentResponse>(`/api/v1/documents/${id}/share`, {
    method: "POST",
    body: JSON.stringify(input)
  });

  return payload.document;
}