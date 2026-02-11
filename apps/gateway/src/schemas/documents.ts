import { z } from "zod";

export const createDocumentBodySchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(100_000)
});

export const updateDocumentBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(100_000).optional()
}).refine((value) => value.title !== undefined || value.content !== undefined, {
  message: "At least one field must be provided"
});

export const shareDocumentBodySchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["viewer", "editor"])
});

export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
export type ShareDocumentBody = z.infer<typeof shareDocumentBodySchema>;

export type DocumentRole = "owner" | "editor" | "viewer";

export interface DocumentRecord {
  id: string;
  ownerUserId: string;
  title: string;
  content: string;
  sharedWith: Record<string, Exclude<DocumentRole, "owner">>;
  createdAt: string;
  updatedAt: string;
}