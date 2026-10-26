import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export type RequestPart = 'body' | 'query' | 'params';

export interface MultiPartValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Flexible validation middleware.
 * Supports validating a single request part:
 *   validateRequest(schema, 'body')
 * Or multiple request parts in one middleware:
 *   validateRequest({ params: idParamSchema, query: paginationQuerySchema, body: updateSchema })
 */
export function validateRequest(
  schemaOrConfig: ZodSchema | MultiPartValidationSchemas,
  part: RequestPart = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Check if configuration object was passed (has body, query, or params keys)
    if (
      typeof schemaOrConfig === 'object' &&
      schemaOrConfig !== null &&
      !('_def' in schemaOrConfig)
    ) {
      const parts: RequestPart[] = ['params', 'query', 'body'];

      for (const p of parts) {
        const schema = schemaOrConfig[p];
        if (schema) {
          const result = schema.safeParse(req[p]);
          if (!result.success) {
            next(result.error);
            return;
          }
          (req as unknown as Record<string, unknown>)[p] = result.data;
        }
      }

      next();
      return;
    }

    // Single schema mode
    const result = schemaOrConfig.safeParse(req[part]);

    if (!result.success) {
      next(result.error);
      return;
    }

    (req as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };
}
