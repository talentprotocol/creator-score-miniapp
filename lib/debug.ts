// Debug utilities for structured logging

export function dlog(
  scope: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  return;
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    scope: `[${scope}]`,
    message,
    ...meta,
  };

  console.log(JSON.stringify(logData, null, 2));
}

export function dlogClient(
  scope: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    scope: `[${scope}]`,
    message,
    ...meta,
  };

  console.log(JSON.stringify(logData, null, 2));
}

export class DTimer {
  private scope: string;
  private key: string;
  private startTime: number;

  constructor(scope: string, key: string) {
    this.scope = scope;
    this.key = key;
    this.startTime = Date.now();
  }

  end(): number {
    const duration = Date.now() - this.startTime;
    dlog(this.scope, `${this.key} completed`, { duration_ms: duration });
    return duration;
  }
}

export function dtimer(scope: string, key: string): DTimer {
  dlog(scope, `${key} started`);
  return new DTimer(scope, key);
}
