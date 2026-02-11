export interface DocumentRecord {
  id: string | number;
  ownerUserId: string;
  title: string;
  content: string;
  sharedWith: Record<string, "viewer" | "editor">;
  createdAt: string;
  updatedAt: string;
}

export interface ListDocumentsResponse {
  documents: DocumentRecord[];
}

export interface SingleDocumentResponse {
  document: DocumentRecord;
}

export interface CreateDocumentBody {
  title: string;
  content: string;
}

export interface UpdateDocumentBody {
  title?: string;
  content?: string;
}

export interface ShareDocumentBody {
  userId: string;
  role: "viewer" | "editor";
}