import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import AuthCard from "./AuthCard";

interface FieldErrors {
  password?: string;
  confirm?: string;
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { logout } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const found: FieldErrors = {};
    if (!password) found.password = "Enter a new password.";
    else if (password.length < 8)
      found.password = "Password must be at least 8 characters.";
    if (password && confirm !== password)
      found.confirm = "Passwords do not match.";
    setErrors(found);

    if (found.password || found.confirm) {
      document
        .getElementById(found.password ? "reset-password" : "reset-confirm")
        ?.focus();
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
      // the server ended all sessions, so make this browser forget its login too
      logout().catch(() => {});
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthCard
        title="Reset link problem"
        subtitle="This link is missing its token."
      >
        <Link to="/forgot-password" className="btn btn-primary w-full">
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        subtitle="You can now log in with your new password."
      >
        <p
          role="status"
          className="mb-4 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        >
          Your password was changed and you were logged out on all devices.
        </p>
        <Link to="/login" className="btn btn-primary w-full">
          Go to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick a password with at least 8 characters."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="reset-password"
            className="mb-1 block text-sm font-medium"
          >
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            aria-invalid={errors.password ? "true" : undefined}
            aria-describedby={
              errors.password ? "reset-password-error" : undefined
            }
            className="field"
          />
          {errors.password && (
            <p
              id="reset-password-error"
              role="alert"
              className="mt-1 text-sm text-danger"
            >
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="reset-confirm"
            className="mb-1 block text-sm font-medium"
          >
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm)
                setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            aria-invalid={errors.confirm ? "true" : undefined}
            aria-describedby={
              errors.confirm ? "reset-confirm-error" : undefined
            }
            className="field"
          />
          {errors.confirm && (
            <p
              id="reset-confirm-error"
              role="alert"
              className="mt-1 text-sm text-danger"
            >
              {errors.confirm}
            </p>
          )}
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-danger px-3 py-2 text-sm text-danger"
          >
            <p>{serverError}</p>
            <Link
              to="/forgot-password"
              className="mt-1 inline-block font-medium underline underline-offset-2"
            >
              Request a new link
            </Link>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Reset password"}
        </button>
      </form>
    </AuthCard>
  );
}
