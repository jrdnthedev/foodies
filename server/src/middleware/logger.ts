import express from 'express';

export const logger = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';

  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`);

  next();
};
