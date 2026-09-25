const DB_RETRY_COOLDOWN_MS = 30000;
const PRISMA_TIMEOUT_MS = 10000;
const DB_FALLBACK_ENABLED = process.env.DB_FALLBACK_ENABLED === 'false' ? false : true;

let skipPrismaUntil = 0;

function isDatabaseUnavailableError(error: unknown): boolean {
  const message =
    (error as { message?: string })?.message ||
    (error as { toString?: () => string })?.toString?.() ||
    '';

  return (
    message.includes("Can't reach database server") ||
    message.includes('ECONNREFUSED') ||
    message.includes('db:5432') ||
    message.includes('P1001') ||
    message.includes('Prisma query timed out')
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

async function withTimeout<T>(action: () => Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Prisma query timed out')), ms);
  });
  try {
    const result = await Promise.race([action(), timeout]);
    clearTimeout(timer!);
    return result;
  } catch (error) {
    clearTimeout(timer!);
    throw error;
  }
}

export async function runWithPrismaFallback<T>(
  prismaAction: () => Promise<T>,
  fallbackAction: () => Promise<T>,
): Promise<T> {
  if (!DB_FALLBACK_ENABLED) {
    return prismaAction();
  }

  if (!shouldTryPrismaNow()) {
    return fallbackAction();
  }

  try {
    return await withTimeout(prismaAction, PRISMA_TIMEOUT_MS);
  } catch (error) {
    markPrismaUnavailable(error);
    return fallbackAction();
  }
}
