type RateLimitRecord = {
  hits: number[];
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const bucket = new Map<string, RateLimitRecord>();

function pruneExpired(hits: number[], now: number, windowMs: number): number[] {
  const lowerBound = now - windowMs;
  return hits.filter((timestamp) => timestamp > lowerBound);
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: RateLimitOptions): RateLimitResult {
  const record = bucket.get(key) ?? { hits: [] };
  record.hits = pruneExpired(record.hits, now, windowMs);

  if (record.hits.length >= limit) {
    const oldest = Math.min(...record.hits);
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    bucket.set(key, record);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  record.hits.push(now);
  bucket.set(key, record);

  return {
    allowed: true,
    remaining: Math.max(0, limit - record.hits.length),
    retryAfterSeconds: 0,
  };
}

export function clearRateLimitBucket(): void {
  bucket.clear();
}
