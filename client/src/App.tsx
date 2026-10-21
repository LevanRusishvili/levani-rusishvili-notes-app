import { useMemo } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import NotesView from "./components/NotesView";
import ResetPasswordPage from "./components/ResetPasswordPage";
import SettingsPanel from "./components/SettingsPanel";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./hooks/useAuth";
import { useNotes } from "./hooks/useNotes";
import { useTheme } from "./hooks/useTheme";

// Only rendered when logged in, so notes are fetched after login
// and thrown away on logout.
function NotesApp({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const { notes, tags, loading, error, add, update, remove } = useNotes();

  const counts = useMemo(
    () => ({
      all: notes.filter((n) => !n.isArchived).length,
      archived: notes.filter((n) => n.isArchived).length,
    }),
    [notes],
  );

  const viewProps = {
    notes,
    loading,
    error,
    onCreate: add,
    onUpdate: update,
    onDelete: remove,
  };

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg md:flex-row">
      <Sidebar tags={tags} counts={counts} />

      <main className="min-h-0 min-w-0 flex-1">
        <Routes>
          <Route path="/" element={<NotesView view="all" {...viewProps} />} />
          <Route
            path="/archived"
            element={<NotesView view="archived" {...viewProps} />}
          />
          <Route
            path="/tags/:tag"
            element={<NotesView view="tag" {...viewProps} />}
          />
          <Route path="/settings" element={<SettingsPanel {...theme} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const theme = useTheme(); // one place for the theme, also applied on the login pages

  // The reset link must work even if someone is logged in in this browser
  if (pathname === "/reset-password") return <ResetPasswordPage />;

  if (loading) {
    return (
      <div role="status" className="grid h-dvh place-items-center text-muted">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <NotesApp theme={theme} />;
}
