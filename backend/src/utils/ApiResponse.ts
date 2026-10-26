import type { Response } from 'express';

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IApiResponseEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pagination?: IPaginationMeta;
    [key: string]: unknown;
  };
}

/**
 * Standardized API response builder.
 * Guarantees a consistent JSON contract across all endpoints.
 */
export class ApiResponse {
  /**
   * Send a standard 200 (or custom status) successful response.
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Operation successful',
    statusCode = 200,
    meta?: Record<string, unknown>
  ): Response {
    const payload: IApiResponseEnvelope<T> = {
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    };
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a 201 Created response.
   */
  static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully',
    meta?: Record<string, unknown>
  ): Response {
    return this.success(res, data, message, 201, meta);
  }

  /**
   * Send a 200 OK paginated response with standardized pagination metadata.
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: IPaginationMeta,
    message = 'Resources retrieved successfully',
    extraMeta?: Record<string, unknown>
  ): Response {
    const payload: IApiResponseEnvelope<T[]> = {
      success: true,
      message,
      data,
      meta: {
        pagination,
        ...(extraMeta ?? {}),
      },
    };
    return res.status(200).json(payload);
  }

  /**
   * Send a 204 No Content response.
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
