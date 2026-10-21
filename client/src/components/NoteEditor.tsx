import { useRef, useState, type FormEvent } from "react";
import type { Note, NoteInput } from "../types";
import { formatDate } from "../utils/format";
import ConfirmDialog from "./ConfirmDialog";
import {
  ArchiveIcon,
  ChevronLeftIcon,
  HashIcon,
  TrashIcon,
  UndoIcon,
} from "./icons";

interface Props {
  note: Note | null; // null = creating a new note
  onSave: (input: NoteInput) => Promise<void>;
  onToggleArchive?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

interface FieldErrors {
  title?: string;
  content?: string;
}

const parseTags = (value: string) => [
  ...new Set(
    value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  ),
];

const messageOf = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

export default function NoteEditor({
  note,
  onSave,
  onToggleArchive,
  onDelete,
  onClose,
}: Props) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const next: FieldErrors = {};
    if (!title.trim()) next.title = "Title can’t be empty.";
    if (!content.trim()) next.content = "Content can’t be empty.";
    setErrors(next);

    if (next.title) return titleRef.current?.focus();
    if (next.content) return contentRef.current?.focus();

    setSaving(true);
    setServerError(null);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tags: parseTags(tags),
      });
    } catch (err) {
      setServerError(messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  const run = async (action?: () => Promise<void>) => {
    if (!action) return;
    setServerError(null);
    try {
      await action();
    } catch (err) {
      setServerError(messageOf(err));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="animate-rise mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pt-4 md:px-8 md:pt-6"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost -ml-3 lg:hidden"
        >
          <ChevronLeftIcon />
          Back
        </button>
        <div className="ml-auto flex gap-1">
          {note && onToggleArchive && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => run(onToggleArchive)}
            >
              {note.isArchived ? <UndoIcon /> : <ArchiveIcon />}
              {note.isArchived ? "Restore" : "Archive"}
            </button>
          )}
          {note && onDelete && (
            <button
              type="button"
              className="btn btn-ghost-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              <TrashIcon />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="-mx-3 mt-4">
        <label htmlFor="note-title" className="sr-only">
          Title
        </label>
        <input
          id="note-title"
          ref={titleRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title)
              setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="Untitled note"
          aria-invalid={errors.title ? "true" : undefined}
          aria-describedby={errors.title ? "note-title-error" : undefined}
          className="field-plain text-2xl font-bold tracking-tight md:text-3xl"
        />
        {errors.title && (
          <p
            id="note-title-error"
            role="alert"
            className="mt-1 px-3 text-sm text-danger"
          >
            {errors.title}
          </p>
        )}
      </div>

      <div className="mt-2 grid grid-cols-[6.5rem_1fr] items-start gap-x-2 gap-y-2 border-b border-line pb-4 text-sm">
        <label
          htmlFor="note-tags"
          className="flex items-center gap-2 py-1.5 text-muted"
        >
          <HashIcon className="size-4" />
          Tags
        </label>
        <div className="-ml-3">
          <input
            id="note-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags, separated by commas"
            className="field-plain py-1.5"
          />
        </div>

        {note && (
          <>
            <span className="py-1.5 text-muted">Last edited</span>
            <span className="py-1.5">{formatDate(note.lastEdited)}</span>
          </>
        )}
      </div>

      <div className="-mx-3 mt-4 flex flex-1 flex-col">
        <label htmlFor="note-content" className="sr-only">
          Content
        </label>
        <textarea
          id="note-content"
          ref={contentRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content)
              setErrors((prev) => ({ ...prev, content: undefined }));
          }}
          placeholder="Start writing…"
          aria-invalid={errors.content ? "true" : undefined}
          aria-describedby={errors.content ? "note-content-error" : undefined}
          className="field-plain min-h-64 flex-1 resize-none leading-relaxed"
        />
        {errors.content && (
          <p
            id="note-content-error"
            role="alert"
            className="mt-1 px-3 text-sm text-danger"
          >
            {errors.content}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger"
        >
          {serverError}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 mt-4 flex gap-2 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save note"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete note"
        message="Are you sure you want to permanently delete this note? This action cannot be undone."
        confirmLabel="Delete note"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          void run(onDelete);
        }}
      />
    </form>
  );
}
