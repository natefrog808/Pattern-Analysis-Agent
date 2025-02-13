// packages/advanced-agent/src/image-processor/security/index.ts

import { rateLimit } from 'express-rate-limit';
import { sanitizeHtml } from 'sanitize-html';
import { verify } from 'jsonwebtoken';

export class SecurityManager {
  private rateLimiter: any;

  constructor(private config: {
    maxRequests: number;
    windowMs: number;
    jwtSecret: string;
  }) {
    this.rateLimiter = rateLimit({
      windowMs: config.windowMs,
      max: config.maxRequests
    });
  }

  validateToken(token: string): boolean {
    try {
      verify(token, this.config.jwtSecret);
      return true;
    } catch {
      return false;
    }
  }

  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return sanitizeHtml(input);
    }
    if (typeof input === 'object') {
      return Object.keys(input).reduce((acc, key) => ({
        ...acc,
        [key]: this.sanitizeInput(input[key])
      }), {});
    }
    return input;
  }

  checkRateLimit(req: any): Promise<boolean> {
    return new Promise((resolve) => {
      this.rateLimiter(req, {}, () => resolve(true));
    });
  }
}
