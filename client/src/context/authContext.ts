import { createContext } from "react";
import type { User } from "../types";

export interface AuthContextValue {
  user: User | null;
  loading: boolean; // true while we check if there is already a session
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
