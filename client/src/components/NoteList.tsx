import type { Note } from "../types";
import { formatDate } from "../utils/format";

interface Props {
  notes: Note[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function NoteList({ notes, selectedId, onSelect }: Props) {
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {notes.map((note, index) => {
        const selected = note.id === selectedId;
        return (
          <li
            key={note.id}
            className="animate-rise"
            style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
          >
            <button
              type="button"
              onClick={() => onSelect(note.id)}
              aria-current={selected ? "true" : undefined}
              className={`block w-full cursor-pointer rounded-xl border p-3.5 text-left transition-all hover:-translate-y-px hover:shadow-sm ${
                selected
                  ? "border-accent/40 bg-accent-soft"
                  : "border-transparent hover:border-line hover:bg-surface"
              }`}
            >
              <span className="block truncate font-semibold">{note.title}</span>
              <span className="mt-1 line-clamp-2 text-sm text-muted">
                {note.content}
              </span>
              {note.tags.length > 0 && (
                <span className="mt-2.5 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </span>
              )}
              <span className="mt-2.5 block text-xs text-muted">
                {formatDate(note.lastEdited)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
