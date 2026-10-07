import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "KEY_MISSING"
  | "UPSTREAM_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class HttpError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(
  code: ErrorCode,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function handle(
  fn: (req: Request) => Promise<NextResponse | Response>
) {
  return async (req: Request): Promise<NextResponse | Response> => {
    try {
      return await fn(req);
    } catch (error) {
      if (error instanceof HttpError) {
        return fail(error.code, error.message, error.status, error.details);
      }
      if (error instanceof ZodError) {
        return fail("VALIDATION", "Invalid input parameters", 422, error.issues);
      }
      console.error("[API Error]", error);
      return fail(
        "INTERNAL_ERROR",
        "An unexpected error occurred. Please try again.",
        500
      );
    }
  };
}
