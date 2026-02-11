import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import {
  createDocument,
  getDocument,
  listDocuments,
  shareDocument,
  updateDocument
} from "./api/documents";

function Header(): JSX.Element {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-900">RelayDocs</h1>
        <Link className="text-sm font-medium text-sky-700 hover:text-sky-800" to="/documents">
          Documents
        </Link>
      </div>
    </header>
  );
}

function DocumentsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments
  });

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: async () => {
      setTitle("");
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  });

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create Document</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate({ title, content });
          }}
        >
          <label className="block text-sm font-medium text-slate-700" htmlFor="doc-title">
            Title
          </label>
          <input
            id="doc-title"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <label className="block text-sm font-medium text-slate-700" htmlFor="doc-content">
            Content
          </label>
          <textarea
            id="doc-content"
            className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
          <button
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
          {createMutation.error instanceof Error ? (
            <p className="text-sm text-rose-700">{createMutation.error.message}</p>
          ) : null}
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        {documentsQuery.isLoading ? <p className="mt-3 text-sm text-slate-600">Loading...</p> : null}
        {documentsQuery.error instanceof Error ? (
          <p className="mt-3 text-sm text-rose-700">{documentsQuery.error.message}</p>
        ) : null}
        <ul className="mt-3 space-y-3">
          {documentsQuery.data?.map((document) => (
            <li key={document.id} className="rounded-md border border-slate-200 px-3 py-2">
              <Link
                className="font-medium text-sky-700 hover:text-sky-800"
                to={`/documents/${document.id}`}
              >
                {document.title}
              </Link>
              <p className="text-xs text-slate-500">Owner: {document.ownerUserId}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DocumentDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const documentId = useMemo(() => id ?? "", [id]);
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [shareUserId, setShareUserId] = useState("");
  const [shareRole, setShareRole] = useState<"viewer" | "editor">("viewer");

  const documentQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => getDocument(documentId),
    enabled: documentId.length > 0
  });

  const updateMutation = useMutation({
    mutationFn: async (value: string) => updateDocument(documentId, { content: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  });

  const shareMutation = useMutation({
    mutationFn: async () => shareDocument(documentId, { userId: shareUserId, role: shareRole }),
    onSuccess: async () => {
      setShareUserId("");
      await queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    }
  });

  if (!documentId) {
    return <Navigate to="/documents" replace />;
  }

  if (documentQuery.isLoading) {
    return <section className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-slate-600">Loading...</section>;
  }

  if (documentQuery.error instanceof Error) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 py-6">
        <p className="text-sm text-rose-700">{documentQuery.error.message}</p>
        <Link className="mt-3 inline-block text-sm text-sky-700" to="/documents">
          Back to documents
        </Link>
      </section>
    );
  }

  const document = documentQuery.data;
  if (!document) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 py-6">
        <p className="text-sm text-slate-700">Document unavailable.</p>
        <Link className="mt-3 inline-block text-sm text-sky-700" to="/documents">
          Back to documents
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{document.title}</h2>
        <p className="mt-2 text-xs text-slate-500">Owner: {document.ownerUserId}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{document.content}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Update Content</h3>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate(content);
          }}
        >
          <textarea
            className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
          <button className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white" type="submit">
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
          {updateMutation.error instanceof Error ? (
            <p className="text-sm text-rose-700">{updateMutation.error.message}</p>
          ) : null}
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Share Document</h3>
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            shareMutation.mutate();
          }}
        >
          <label className="text-sm font-medium text-slate-700" htmlFor="share-user">
            User ID
          </label>
          <input
            id="share-user"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={shareUserId}
            onChange={(event) => setShareUserId(event.target.value)}
            required
          />
          <label className="text-sm font-medium text-slate-700" htmlFor="share-role">
            Role
          </label>
          <select
            id="share-role"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={shareRole}
            onChange={(event) => setShareRole(event.target.value as "viewer" | "editor")}
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
          </select>
          <button className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white" type="submit">
            {shareMutation.isPending ? "Sharing..." : "Share"}
          </button>
        </form>
        {shareMutation.error instanceof Error ? (
          <p className="mt-2 text-sm text-rose-700">{shareMutation.error.message}</p>
        ) : null}

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-800">Current Access</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {Object.entries(document.sharedWith).map(([userId, role]) => (
              <li key={userId}>
                {userId}: {role}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link className="text-sm text-sky-700 hover:text-sky-800" to="/documents">
        Back to documents
      </Link>
    </section>
  );
}

function NotFoundPage(): JSX.Element {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-6">
      <h2 className="text-lg font-semibold text-slate-900">404</h2>
      <p className="mt-2 text-sm text-slate-700">Page not found.</p>
      <Link className="mt-3 inline-block text-sm text-sky-700" to="/documents">
        Go to documents
      </Link>
    </section>
  );
}

export function App(): JSX.Element {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
}
