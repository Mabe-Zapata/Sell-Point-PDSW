import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';

export interface CookieConfig {
  name: string;
  path: string;
  maxAge: number;
  rememberMeMaxAge: number;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  domain?: string;
}

@Injectable()
export class CookieService {
  private readonly config: CookieConfig;

  constructor(configService: ConfigService) {
    this.config = configService.get<CookieConfig>('cookie') as CookieConfig;
  }

  setRefreshTokenCookie(res: Response, token: string, rememberMe: boolean): void {
    const maxAgeSeconds = rememberMe ? this.config.rememberMeMaxAge : this.config.maxAge;
    // Express `res.cookie({ maxAge })` is documented in MILLISECONDS, but our
    // config block exposes SECONDS (matches the spec: 604800 = 7 days,
    // 2592000 = 30 days). Convert before handing to Express.
    const options: Record<string, unknown> = {
      httpOnly: true,
      sameSite: this.config.sameSite,
      path: this.config.path,
      maxAge: maxAgeSeconds * 1000,
    };
    if (this.config.secure) {
      options.secure = true;
    }
    if (this.config.domain) {
      options.domain = this.config.domain;
    }
    res.cookie(this.config.name, token, options);
  }

  clearRefreshTokenCookie(res: Response): void {
    const options: Record<string, unknown> = {
      httpOnly: true,
      sameSite: this.config.sameSite,
      path: this.config.path,
      maxAge: 0,
    };
    if (this.config.secure) {
      options.secure = true;
    }
    if (this.config.domain) {
      options.domain = this.config.domain;
    }
    res.clearCookie(this.config.name, options);
  }

  readRefreshTokenCookie(req: Request): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    if (!cookies) return undefined;
    return cookies[this.config.name];
  }
}
