import type { User } from "../types";
import { request } from "./http";

const BASE_URL = "/api/auth";
export const getMe = () => request<User>(`${BASE_URL}/me`);

export const register = (email: string, password: string) =>
  request<User>(`${BASE_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const login = (email: string, password: string) =>
  request<User>(`${BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const logout = () =>
  request<void>(`${BASE_URL}/logout`, { method: "POST" });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<void>(`${BASE_URL}/password`, {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const forgotPassword = (email: string) =>
  request<void>(`${BASE_URL}/forgot`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, newPassword: string) =>
  request<void>(`${BASE_URL}/reset`, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
