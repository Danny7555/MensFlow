export type HttpError = Error & {
  status?: number;
  locked?: boolean;
  securityQuestion?: string | null;
};

export function httpError(message: string, status = 400, extras: Partial<HttpError> = {}): HttpError {
  return Object.assign(new Error(message), { status, ...extras });
}

