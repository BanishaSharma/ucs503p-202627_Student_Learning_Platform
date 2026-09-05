import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Higher-order async handler wrapper for Express routes.
 * Catches any rejected promises and forwards them to the centralized error middleware.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
