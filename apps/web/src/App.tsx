import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { clearAuthSession, readAuthSession, saveAuthSession, type AuthSession } from "./auth/session";
import { login, signup } from "./api/auth";
import {
  createDocument,
  getDocument,
  listDocuments,
  shareDocument,
  updateDocument
} from "./api/documents";

interface HeaderProps {
  session: AuthSession;
  onLogout: () => void;
}

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

type AuthMode = "signup" | "login";

type ForbiddenContext = "view" | "edit" | "share";

function toFriendlyErrorMessage(error: unknown, context: ForbiddenContext): string {
  const fallback = "Something went wrong. Please try again.";

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (message !== "Forbidden") {
    return message.length > 0 ? message : fallback;
  }

  if (context === "edit") {
    return "You do not have access to edit this document.";
  }

  if (context === "share") {
    return "You do not have access to manage sharing for this document.";
  }

  return "You do not have access to view this document.";
}

function Header({ session, onLogout }: HeaderProps): JSX.Element {
  return (
    <header className="border-b border-blue-200/70 bg-white/75 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <h1 className="bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-xl font-semibold text-transparent">
          RelayDocs
        </h1>
        <div className="flex items-center gap-4">
          <span className="rounded-md border border-blue-200 bg-white/80 px-2 py-1 text-xs font-medium text-blue-900">
            Signed in as {session.userId}
          </span>
          <Link className="interactive-focus rounded-sm text-sm font-medium text-blue-700 transition hover:text-blue-900" to="/documents">
            Documents
          </Link>
          <button
            className="btn-animated btn-secondary interactive-focus rounded-md px-3 py-1 text-sm font-medium"
            onClick={onLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function LoginPage({ onLogin }: LoginPageProps): JSX.Element {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mx-auto flex min-h-[75vh] w-full max-w-5xl items-center px-6 py-10">
      <div className="glass-card w-full max-w-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold text-blue-950">Sign in to RelayDocs</h2>
        <p className="mt-2 text-sm text-slate-700">
          Create an account or log in with your username and password.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className={`interactive-focus rounded-md px-3 py-2 text-sm font-medium ${mode === "login" ? "btn-animated btn-primary text-white" : "border border-blue-200 bg-white text-blue-800"}`}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            type="button"
          >
            Login
          </button>
          <button
            className={`interactive-focus rounded-md px-3 py-2 text-sm font-medium ${mode === "signup" ? "btn-animated btn-primary text-white" : "border border-blue-200 bg-white text-blue-800"}`}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();

            try {
              setIsSubmitting(true);
              setError(null);
              const trimmedUsername = username.trim();
              const nextSession = mode === "signup"
                ? await signup(trimmedUsername, password)
                : await login(trimmedUsername, password);

              const session: AuthSession = {
                token: nextSession.token,
                userId: nextSession.userId
              };
              saveAuthSession(session);
              onLogin(session);
              navigate("/documents", { replace: true });
            } catch (loginError: unknown) {
              setError(loginError instanceof Error ? loginError.message : "Failed to sign in");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="login-username">
              Username
            </label>
            <input
              id="login-username"
              className="interactive-focus mt-1 w-full rounded-md border border-blue-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
              value={username}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="interactive-focus mt-1 w-full rounded-md border border-blue-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
              type="password"
              value={password}
            />
          </div>
          <button className="btn-animated btn-primary interactive-focus rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting..." : mode === "signup" ? "Create account" : "Login"}
          </button>
          {error ? <p className="text-sm text-rose-700" role="alert">{error}</p> : null}
        </form>
      </div>
    </section>
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
    <section className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6" aria-busy={documentsQuery.isLoading || createMutation.isPending}>
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-blue-950">Create Document</h2>
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
            className="interactive-focus w-full rounded-md border border-blue-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <label className="block text-sm font-medium text-slate-700" htmlFor="doc-content">
            Content
          </label>
          <textarea
            id="doc-content"
            className="interactive-focus min-h-28 w-full rounded-md border border-blue-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
          <button
            className="btn-animated btn-primary interactive-focus rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
            disabled={createMutation.isPending || title.trim().length === 0 || content.trim().length === 0}
            type="submit"
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
          {createMutation.error instanceof Error ? (
            <p className="text-sm text-rose-700" role="alert">{createMutation.error.message}</p>
          ) : null}
        </form>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-blue-950">Documents</h2>
        {documentsQuery.isLoading ? <p className="mt-3 text-sm text-slate-600" role="status">Loading...</p> : null}
        {documentsQuery.error instanceof Error ? (
          <p className="mt-3 text-sm text-rose-700" role="alert">{documentsQuery.error.message}</p>
        ) : null}
        {documentsQuery.data && documentsQuery.data.length === 0 ? (
          <p className="mt-3 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-3 text-sm text-blue-900">
            No documents yet. Create your first document above.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {documentsQuery.data?.map((document) => (
              <li key={document.id} className="rounded-md border border-blue-100 bg-white/70 px-3 py-2">
                <Link
                  className="interactive-focus rounded-sm font-medium text-blue-700 transition hover:text-blue-900"
                  to={`/documents/${document.id}`}
                >
                  {document.title}
                </Link>
                <p className="text-xs text-slate-500">Owner: {document.ownerUserId}</p>
              </li>
            ))}
          </ul>
        )}
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
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);
  const [activeRoleUpdateUserId, setActiveRoleUpdateUserId] = useState<string | null>(null);

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
    mutationFn: async (input: { userId: string; role: "viewer" | "editor" }) =>
      shareDocument(documentId, { userId: input.userId, role: input.role }),
    onSuccess: async () => {
      setShareUserId("");
      setRoleUpdateError(null);
      setActiveRoleUpdateUserId(null);
      await queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    }
  });

  if (!documentId) {
    return <Navigate to="/documents" replace />;
  }

  if (documentQuery.isLoading) {
    return <section className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-slate-600" role="status">Loading...</section>;
  }

  if (documentQuery.error instanceof Error) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 py-6">
        <p className="text-sm text-rose-700" role="alert">
          {toFriendlyErrorMessage(documentQuery.error, "view")}
        </p>
        <Link className="interactive-focus mt-3 inline-block rounded-sm text-sm text-sky-700" to="/documents">
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
        <Link className="interactive-focus mt-3 inline-block rounded-sm text-sm text-sky-700" to="/documents">
          Back to documents
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6" aria-busy={documentQuery.isFetching || updateMutation.isPending || shareMutation.isPending}>
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-blue-950">{document.title}</h2>
        <p className="mt-2 text-xs text-slate-500">Owner: {document.ownerUserId}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{document.content}</p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-blue-950">Update Content</h3>
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate(content);
          }}
        >
          <label className="block text-sm font-medium text-slate-700" htmlFor="update-content">
            New content
          </label>
          <textarea
            id="update-content"
            className="interactive-focus min-h-28 w-full rounded-md border border-blue-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={document.content}
            required
          />
          <button className="btn-animated btn-primary interactive-focus rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70" disabled={updateMutation.isPending || content.trim().length === 0} type="submit">
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
          {updateMutation.error instanceof Error ? (
            <p className="text-sm text-rose-700" role="alert">
              {toFriendlyErrorMessage(updateMutation.error, "edit")}
            </p>
          ) : null}
        </form>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-blue-950">Share Document</h3>
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setRoleUpdateError(null);
            setActiveRoleUpdateUserId(null);
            shareMutation.mutate({ userId: shareUserId, role: shareRole });
          }}
        >
          <label className="text-sm font-medium text-slate-700" htmlFor="share-user">
            User ID
          </label>
          <input
            id="share-user"
            className="interactive-focus rounded-md border border-blue-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={shareUserId}
            onChange={(event) => setShareUserId(event.target.value)}
            required
          />
          <label className="text-sm font-medium text-slate-700" htmlFor="share-role">
            Role
          </label>
          <select
            id="share-role"
            className="interactive-focus rounded-md border border-blue-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={shareRole}
            onChange={(event) => setShareRole(event.target.value as "viewer" | "editor")}
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
          </select>
          <button className="btn-animated btn-secondary interactive-focus rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70" disabled={shareMutation.isPending || shareUserId.trim().length === 0} type="submit">
            {shareMutation.isPending ? "Sharing..." : "Share"}
          </button>
        </form>
        {shareMutation.error instanceof Error ? (
          <p className="mt-2 text-sm text-rose-700" role="alert">
            {toFriendlyErrorMessage(shareMutation.error, "share")}
          </p>
        ) : null}
        {roleUpdateError ? (
          <p className="mt-2 text-sm text-rose-700" role="alert">{roleUpdateError}</p>
        ) : null}

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-800">Current Access</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {Object.entries(document.sharedWith).map(([userId, role]) => (
              <li key={userId} className="flex flex-wrap items-center gap-2">
                <span className="min-w-28 font-medium">{userId}</span>
                <select
                  aria-label={`Role for ${userId}`}
                  className="interactive-focus rounded-md border border-blue-200 bg-white/90 px-2 py-1 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  defaultValue={role}
                  disabled={shareMutation.isPending && activeRoleUpdateUserId === userId}
                  onChange={(event) => {
                    const nextRole = event.target.value as "viewer" | "editor";

                    if (nextRole === role) {
                      return;
                    }

                    setRoleUpdateError(null);
                    setActiveRoleUpdateUserId(userId);
                    shareMutation.mutate(
                      { userId, role: nextRole },
                      {
                        onError: (mutationError: unknown) => {
                          setRoleUpdateError(toFriendlyErrorMessage(mutationError, "share"));
                          setActiveRoleUpdateUserId(null);
                          event.target.value = role;
                        },
                        onSettled: () => {
                          setActiveRoleUpdateUserId(null);
                        }
                      }
                    );
                  }}
                >
                  <option value="viewer">viewer</option>
                  <option value="editor">editor</option>
                </select>
                {shareMutation.isPending && activeRoleUpdateUserId === userId ? (
                  <span className="text-xs text-slate-500">Updating...</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link className="interactive-focus rounded-sm text-sm font-medium text-blue-700 transition hover:text-blue-900" to="/documents">
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
      <Link className="interactive-focus mt-3 inline-block rounded-sm text-sm text-blue-700 hover:text-blue-900" to="/documents">
        Go to documents
      </Link>
    </section>
  );
}

function ProtectedRoute({ isAuthenticated, children }: { isAuthenticated: boolean; children: JSX.Element }): JSX.Element {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function App(): JSX.Element {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());

  function handleLogin(nextSession: AuthSession): void {
    setSession(nextSession);
    queryClient.clear();
  }

  function handleLogout(): void {
    clearAuthSession();
    setSession(null);
    queryClient.clear();
  }

  return (
    <main className="app-shell">
      {session ? <Header session={session} onLogout={handleLogout} /> : null}
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate replace to="/documents" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/documents"
          element={(
            <ProtectedRoute isAuthenticated={session !== null}>
              <DocumentsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/documents/:id"
          element={(
            <ProtectedRoute isAuthenticated={session !== null}>
              <DocumentDetailPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/" element={<Navigate to={session ? "/documents" : "/login"} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
}
