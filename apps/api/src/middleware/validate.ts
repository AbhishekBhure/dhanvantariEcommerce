import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type ValidateTarget = "body" | "query" | "params";

/**
 * Zod request validation middleware.
 * Parses and assigns validated data back to req[target].
 */
export function validate(schema: ZodSchema, target: ValidateTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(result.error);
    }
    // Assign parsed data (handles coercion, defaults, etc.)
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
