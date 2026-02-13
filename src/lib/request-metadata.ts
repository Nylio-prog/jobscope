const IP_HEADER_CANDIDATES = ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for', 'fly-client-ip'];

function sanitizeToken(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 160);
}

export function getRequestIp(request: Request): string | undefined {
  for (const headerName of IP_HEADER_CANDIDATES) {
    const value = request.headers.get(headerName);
    if (!value) {
      continue;
    }

    const primary = value.split(',')[0];
    const sanitized = sanitizeToken(primary);
    if (sanitized) {
      return sanitized;
    }
  }

  return undefined;
}

export function getRequestUserAgent(request: Request): string | undefined {
  return sanitizeToken(request.headers.get('user-agent'));
}

export function buildClientFingerprint(request: Request): string {
  return [getRequestIp(request) ?? 'unknown-ip', getRequestUserAgent(request) ?? 'unknown-ua'].join(
    '|',
  );
}
