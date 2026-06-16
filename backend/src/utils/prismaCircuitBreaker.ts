const DB_RETRY_COOLDOWN_MS = 30000;

let skipPrismaUntil = 0;

function isFallbackEnabled(): boolean {
  return process.env.DB_FALLBACK_ENABLED === 'true';
}

function isDatabaseUnavailableError(error: unknown): boolean {
  const message =
    (error as { message?: string })?.message ||
    (error as { toString?: () => string })?.toString?.() ||
    '';

  return (
    message.includes("Can't reach database server") ||
    message.includes('ECONNREFUSED') ||
    message.includes('db:5432') ||
    message.includes('P1001')
  );
}

export function shouldTryPrismaNow(): boolean {
  return Date.now() >= skipPrismaUntil;
}

export function markPrismaUnavailable(error: unknown): void {
  if (isDatabaseUnavailableError(error)) {
    skipPrismaUntil = Date.now() + DB_RETRY_COOLDOWN_MS;
  }
}

export async function runWithPrismaFallback<T>(
  prismaAction: () => Promise<T>,
  fallbackAction: () => Promise<T>,
): Promise<T> {
  if (!isFallbackEnabled()) {
    return prismaAction();
  }

  if (!shouldTryPrismaNow()) {
    return fallbackAction();
  }

  try {
    return await prismaAction();
  } catch (error) {
    markPrismaUnavailable(error);
    return fallbackAction();
  }
}
