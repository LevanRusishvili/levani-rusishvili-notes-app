import { useCallback, useEffect, useMemo, useState } from "react";
import { createNote, deleteNote, getNotes, updateNote } from "../api/notes";
import type { Note, NoteChanges, NoteInput } from "../types";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getNotes()
      .then((data) => {
        if (!cancelled) setNotes(data);
      })
      .catch(() => {
        if (!cancelled)
          setError("Could not load notes. Is the server running on port 4000?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (input: NoteInput) => {
    const created = await createNote(input);
    setNotes((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: number, changes: NoteChanges) => {
    const updated = await updateNote(id, changes);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Tags used by notes that are not archived, sorted alphabetically
  const tags = useMemo(
    () =>
      [
        ...new Set(notes.filter((n) => !n.isArchived).flatMap((n) => n.tags)),
      ].sort((a, b) => a.localeCompare(b)),
    [notes],
  );

  return { notes, tags, loading, error, add, update, remove };
}
