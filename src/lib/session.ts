// src/lib/session.ts
import crypto from "crypto";

interface Session {
  id: string;
  discordId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const sessionStore = new Map<string, Session>();

export function createSession(data: Omit<Session, "id">) {
  const id = crypto.randomUUID();
  sessionStore.set(id, { id, ...data });
  return id;
}

export function getSession(id: string) {
  return sessionStore.get(id);
}

export function deleteSession(id: string) {
  sessionStore.delete(id);
}
