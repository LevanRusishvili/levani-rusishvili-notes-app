import { useMemo, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { Note, NoteChanges, NoteInput } from "../types";
import {
  ArchiveIcon,
  HashIcon,
  NotesIcon,
  PlusIcon,
  SearchIcon,
} from "./icons";
import NoteEditor from "./NoteEditor";
import NoteList from "./NoteList";
import SearchBar from "./SearchBar";

interface Props {
  view: "all" | "archived" | "tag";
  notes: Note[];
  loading: boolean;
  error: string | null;
  onCreate: (input: NoteInput) => Promise<Note>;
  onUpdate: (id: number, changes: NoteChanges) => Promise<Note>;
  onDelete: (id: number) => Promise<void>;
}

function EmptyState({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="animate-rise mt-6 flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-8 text-center text-sm text-muted">
      <span className="grid size-11 place-items-center rounded-full bg-bg text-accent">
        {icon}
      </span>
      <p className="max-w-60">{children}</p>
    </div>
  );
}

export default function NotesView({
  view,
  notes,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const { tag } = useParams<{ tag: string }>();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const selected = params.get("note"); // 'new' | note id | null

  // Merge changes into the URL query string (null removes a key)
  const updateParams = (
    changes: Record<string, string | null>,
    replace = false,
  ) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace },
    );
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => (view === "archived" ? n.isArchived : !n.isArchived))
      .filter(
        (n) => view !== "tag" || (tag !== undefined && n.tags.includes(tag)),
      )
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.lastEdited.localeCompare(a.lastEdited));
  }, [notes, view, tag, query]);

  const creating = selected === "new";
  const selectedNote = creating
    ? null
    : (notes.find((n) => String(n.id) === selected) ?? null);
  const hasSelection = creating || selectedNote !== null;

  const heading =
    view === "archived"
      ? "Archived Notes"
      : view === "tag"
        ? `Notes Tagged: ${tag}`
        : "All Notes";

  const subtitle = loading
    ? ""
    : `${visible.length} ${visible.length === 1 ? "note" : "notes"}${query.trim() ? ` matching “${query.trim()}”` : ""}`;

  const closeEditor = () => updateParams({ note: null });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className={`flex-wrap items-end justify-between gap-3 px-4 py-4 md:px-8 ${hasSelection ? "hidden lg:flex" : "flex"}`}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="min-h-5 text-sm text-muted" aria-live="polite">
            {subtitle}
          </p>
        </div>
        <SearchBar
          value={query}
          onChange={(value) => updateParams({ q: value }, true)}
        />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] border-line max-lg:border-t lg:border-t lg:grid-cols-[22rem_1fr]">
        <section
          aria-label="Notes"
          className={`min-h-0 overflow-y-auto p-3 lg:block lg:border-r lg:border-line ${hasSelection ? "hidden" : "block"}`}
        >
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => updateParams({ note: "new" })}
          >
            <PlusIcon />
            Create new note
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}

          {loading && (
            <p className="mt-4 px-1 text-sm text-muted">Loading notes…</p>
          )}

          {!loading &&
            !error &&
            visible.length === 0 &&
            (query ? (
              <EmptyState icon={<SearchIcon />}>
                No notes match “{query}”. Try a different title, tag or word.
              </EmptyState>
            ) : view === "archived" ? (
              <EmptyState icon={<ArchiveIcon />}>
                No notes have been archived yet. Archived notes show up here.
              </EmptyState>
            ) : view === "tag" ? (
              <EmptyState icon={<HashIcon />}>
                No notes are tagged “{tag}”.
              </EmptyState>
            ) : (
              <EmptyState icon={<NotesIcon />}>
                You don’t have any notes yet. Create one to get started.
              </EmptyState>
            ))}

          <NoteList
            notes={visible}
            selectedId={selectedNote?.id ?? null}
            onSelect={(id) => updateParams({ note: String(id) })}
          />
        </section>

        <section
          aria-label="Note editor"
          className={`min-h-0 overflow-y-auto lg:block ${hasSelection ? "block" : "hidden"}`}
        >
          {hasSelection ? (
            <NoteEditor
              key={selectedNote?.id ?? "new"}
              note={selectedNote}
              onClose={closeEditor}
              onSave={async (input) => {
                if (selectedNote) {
                  await onUpdate(selectedNote.id, input);
                } else {
                  const created = await onCreate(input);
                  updateParams({ note: String(created.id) });
                }
              }}
              onToggleArchive={
                selectedNote
                  ? async () => {
                      await onUpdate(selectedNote.id, {
                        isArchived: !selectedNote.isArchived,
                      });
                      closeEditor();
                    }
                  : undefined
              }
              onDelete={
                selectedNote
                  ? async () => {
                      await onDelete(selectedNote.id);
                      closeEditor();
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid h-full place-items-center p-8">
              <div className="flex max-w-xs flex-col items-center gap-3 text-center text-muted">
                <span className="grid size-14 place-items-center rounded-2xl bg-surface text-accent">
                  <NotesIcon width="26" height="26" />
                </span>
                <p>Select a note from the list, or create a new one.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
