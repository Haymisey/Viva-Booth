import { authClient } from "./auth-client";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Typed API fetch wrapper with standard error parsing and automatic 401 sign-out.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      try {
        await authClient.signOut();
      } catch {
        /* ignore */
      }
      const current = window.location.pathname;
      if (!current.startsWith("/auth/")) {
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(current)}`;
      }
    }
    throw new ApiError("Authentication required", "UNAUTHENTICATED", 401);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null as T;
  }

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!res.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `HTTP request failed with status ${res.status}`;
    let details: unknown = undefined;

    if (isJson) {
      try {
        const body = await res.json();
        if (body.error) {
          errorCode = body.error.code || errorCode;
          errorMessage = body.error.message || errorMessage;
          details = body.error.details;
        } else if (body.message) {
          errorMessage = body.message;
        }
      } catch {
        /* use defaults */
      }
    }

    throw new ApiError(errorMessage, errorCode, res.status, details);
  }

  if (isJson) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}
