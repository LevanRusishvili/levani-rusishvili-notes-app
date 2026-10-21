import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import AuthCard from "./AuthCard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return setError("Email can’t be empty.");
    if (!EMAIL_RE.test(email.trim()))
      return setError("Enter a valid email address.");

    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send you a link to reset it."
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            If an account exists for <strong>{email.trim()}</strong>, a reset
            link has been sent. The link works once and expires in 1 hour.
          </p>
          {import.meta.env.DEV && (
            <p className="text-sm text-muted">
              Development mode: no real email is sent. Look for the link in the
              terminal where the server is running.
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="forgot-email"
              className="mb-1 block text-sm font-medium"
            >
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="email@example.com"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "forgot-email-error" : undefined}
              className="field"
            />
            {error && (
              <p
                id="forgot-email-error"
                role="alert"
                className="mt-1 text-sm text-danger"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? "Please wait…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link
          to="/login"
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}
