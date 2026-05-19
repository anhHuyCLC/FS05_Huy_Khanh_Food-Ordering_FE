export const PERMISSIONS = {
  ADMIN_MANAGEMENT: {
    READ: "AM:READ",
    CREATE: "AM:CREATE",
    UPDATE: "AM:UPDATE",
    DELETE: "AM:DELETE",
  },
  USER_MANAGEMENT: {
    READ: "UM:READ",
    CREATE: "UM:CREATE",
    UPDATE: "UM:UPDATE",
    DELETE: "UM:DELETE",
  },
  CHAT: {
    READ: "CHAT:READ",
    CREATE: "CHAT:CREATE",
    UPDATE: "CHAT:UPDATE",
    DELETE: "CHAT:DELETE",
  },
} as const;

export const ROLES = {
  ADMIN: "ADMIN",
} as const;
