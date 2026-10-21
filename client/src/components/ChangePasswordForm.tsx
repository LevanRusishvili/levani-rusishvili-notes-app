import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

interface FieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

export default function ChangePasswordForm() {
  const { changePassword } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const clear = (field: keyof FieldErrors) => {
    setSuccess(false);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setServerError(null);

    const found: FieldErrors = {};
    if (!current) found.current = "Enter your current password.";
    if (!next) found.next = "Enter a new password.";
    else if (next.length < 8)
      found.next = "Password must be at least 8 characters.";
    else if (next === current) found.next = "New password must be different.";
    if (next && confirm !== next) found.confirm = "Passwords do not match.";
    setErrors(found);

    const firstInvalid = found.current
      ? "pw-current"
      : found.next
        ? "pw-new"
        : found.confirm
          ? "pw-confirm"
          : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  };

  const fields: {
    id: string;
    label: string;
    key: keyof FieldErrors;
    value: string;
    set: (v: string) => void;
    autoComplete: string;
  }[] = [
    {
      id: "pw-current",
      label: "Current password",
      key: "current",
      value: current,
      set: setCurrent,
      autoComplete: "current-password",
    },
    {
      id: "pw-new",
      label: "New password",
      key: "next",
      value: next,
      set: setNext,
      autoComplete: "new-password",
    },
    {
      id: "pw-confirm",
      label: "Confirm new password",
      key: "confirm",
      value: confirm,
      set: setConfirm,
      autoComplete: "new-password",
    },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="text-sm text-muted">
          You will stay logged in here. Other devices are logged out.
        </p>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="mb-1 block text-sm font-medium">
            {field.label}
          </label>
          <input
            id={field.id}
            type="password"
            autoComplete={field.autoComplete}
            value={field.value}
            onChange={(e) => {
              field.set(e.target.value);
              clear(field.key);
            }}
            aria-invalid={errors[field.key] ? "true" : undefined}
            aria-describedby={
              errors[field.key] ? `${field.id}-error` : undefined
            }
            className="field"
          />
          {errors[field.key] && (
            <p
              id={`${field.id}-error`}
              role="alert"
              className="mt-1 text-sm text-danger"
            >
              {errors[field.key]}
            </p>
          )}
        </div>
      ))}

      {serverError && (
        <p
          role="alert"
          className="rounded-lg border border-danger px-3 py-2 text-sm text-danger"
        >
          {serverError}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
        >
          Password changed. Other devices were logged out.
        </p>
      )}

      <button type="submit" className="btn btn-primary w-fit" disabled={saving}>
        {saving ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
