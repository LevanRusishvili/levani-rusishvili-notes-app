import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthCard from "./AuthCard";

interface Props {
  mode: "login" | "register";
}

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage({ mode }: Props) {
  const { login, register } = useAuth();
  const isRegister = mode === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Email can’t be empty.";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address.";

    if (!password) next.password = "Password can’t be empty.";
    else if (isRegister && password.length < 8)
      next.password = "Password must be at least 8 characters.";

    setErrors(next);
    if (next.email || next.password) {
      document
        .getElementById(next.email ? "auth-email" : "auth-password")
        ?.focus();
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      if (isRegister) await register(email.trim(), password);
      else await login(email.trim(), password);
      // on success the user state changes and App shows the notes
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={isRegister ? "Create your account" : "Welcome back"}
      subtitle={
        isRegister
          ? "Sign up to start taking notes."
          : "Log in to see your notes."
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="auth-email"
            className="mb-1 block text-sm font-medium"
          >
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email)
                setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="email@example.com"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
            className="field"
          />
          {errors.email && (
            <p
              id="auth-email-error"
              role="alert"
              className="mt-1 text-sm text-danger"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1 block text-sm font-medium"
          >
            Password
          </label>
          <input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            aria-invalid={errors.password ? "true" : undefined}
            aria-describedby={
              errors.password
                ? "auth-password-error"
                : isRegister
                  ? "auth-password-hint"
                  : undefined
            }
            className="field"
          />
          {errors.password ? (
            <p
              id="auth-password-error"
              role="alert"
              className="mt-1 text-sm text-danger"
            >
              {errors.password}
            </p>
          ) : (
            isRegister && (
              <p id="auth-password-hint" className="mt-1 text-xs text-muted">
                At least 8 characters.
              </p>
            )
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted hover:text-fg">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="accent-accent"
              />
              Show password
            </label>
            {!isRegister && (
              <Link
                to="/forgot-password"
                className="text-sm text-accent underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
        </div>

        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-danger px-3 py-2 text-sm text-danger"
          >
            {serverError}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? "Please wait…" : isRegister ? "Sign up" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isRegister ? "Already have an account? " : "No account yet? "}
        <Link
          to={isRegister ? "/login" : "/register"}
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {isRegister ? "Log in" : "Sign up"}
        </Link>
      </p>
    </AuthCard>
  );
}
