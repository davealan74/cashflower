export type ApiErrorKind = 'payment' | 'rate' | 'auth' | 'network' | 'other';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status: number | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }

  static fromStatus(status: number, body = ''): ApiError {
    if (status === 402)
      return new ApiError(
        'payment',
        'Your pollen is exhausted (or this key hit its budget). Top up or wait for the hourly grant at enter.pollinations.ai.',
        status,
      );
    if (status === 429)
      return new ApiError(
        'rate',
        'Rate limited. Cashflower never auto-retries — wait a moment, then regenerate.',
        status,
      );
    if (status === 401 || status === 403)
      return new ApiError('auth', 'This key was rejected. Reconnect your Pollinations account.', status);
    return new ApiError('other', `Pollinations returned ${status}${body ? `: ${body.slice(0, 140)}` : ''}`, status);
  }
}
