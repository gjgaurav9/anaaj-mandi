import type { z } from 'zod';

export class ValidationError extends Error {
  readonly code = 'validation_error';
  readonly status = 400;
  readonly details: unknown;
  constructor(message: string, details: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/** Parses `data` against `schema` or throws a `ValidationError` with field-level details. */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    throw new ValidationError('Request validation failed', details);
  }
  return result.data;
}
