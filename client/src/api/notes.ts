import type { Note, NoteChanges, NoteInput } from "../types";
import { request } from "./http";

const BASE_URL = "/api/notes";
export const getNotes = () => request<Note[]>(BASE_URL);

export const createNote = (input: NoteInput) =>
  request<Note>(BASE_URL, { method: "POST", body: JSON.stringify(input) });

export const updateNote = (id: number, changes: NoteChanges) =>
  request<Note>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(changes),
  });

export const deleteNote = (id: number) =>
  request<void>(`${BASE_URL}/${id}`, { method: "DELETE" });
