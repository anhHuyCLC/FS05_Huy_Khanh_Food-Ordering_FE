import type { AuthResponse, User } from "../types/auth";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object");

const unwrapData = (payload: unknown): unknown => {
  if (isRecord(payload) && "data" in payload && payload.data) {
    return payload.data;
  }

  return payload;
};

const looksLikeUser = (payload: unknown): payload is User =>
  isRecord(payload) &&
  typeof payload.id === "string" &&
  typeof payload.email === "string" &&
  Array.isArray(payload.roles) &&
  Array.isArray(payload.permissions);

export const normalizeUser = (payload: unknown): User => {
  const unwrapped = unwrapData(payload);

  if (looksLikeUser(unwrapped)) {
    return unwrapped;
  }

  if (isRecord(unwrapped) && "user" in unwrapped) {
    return normalizeUser(unwrapped.user);
  }

  return unwrapped as User;
};

export const normalizeAuthResponse = (payload: unknown): AuthResponse => {
  const auth = unwrapData(payload) as AuthResponse & { user: unknown };

  return {
    ...auth,
    user: normalizeUser(auth.user),
  };
};
