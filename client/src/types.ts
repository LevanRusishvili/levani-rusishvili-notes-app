export interface User {
  id: number;
  email: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  lastEdited: string;
}

// What the editor form produces
export interface NoteInput {
  title: string;
  content: string;
  tags: string[];
}

// What can be sent to PUT /api/notes/:id
export type NoteChanges = Partial<
  Pick<Note, "title" | "content" | "tags" | "isArchived">
>;

export type ColorTheme = "light" | "dark" | "system";
export type FontTheme = "sans" | "serif" | "mono";
