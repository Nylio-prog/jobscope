type TelemetryLevel = 'info' | 'warn' | 'error';

type TelemetryPayload = Record<string, unknown>;

function emit(level: TelemetryLevel, event: string, payload: TelemetryPayload = {}) {
  const logger =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;

  logger(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      event,
      ...payload,
    }),
  );
}

export function logInfo(event: string, payload?: TelemetryPayload) {
  emit('info', event, payload);
}

export function logWarn(event: string, payload?: TelemetryPayload) {
  emit('warn', event, payload);
}

export function logError(event: string, payload?: TelemetryPayload) {
  emit('error', event, payload);
}
