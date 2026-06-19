"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldTryPrismaNow = shouldTryPrismaNow;
exports.markPrismaUnavailable = markPrismaUnavailable;
exports.runWithPrismaFallback = runWithPrismaFallback;
const DB_RETRY_COOLDOWN_MS = 30000;
let skipPrismaUntil = 0;
function isFallbackEnabled() {
    return process.env.DB_FALLBACK_ENABLED === 'true';
}
function isDatabaseUnavailableError(error) {
    const message = error?.message ||
        error?.toString?.() ||
        '';
    return (message.includes("Can't reach database server") ||
        message.includes('ECONNREFUSED') ||
        message.includes('db:5432') ||
        message.includes('P1001'));
}
function shouldTryPrismaNow() {
    return Date.now() >= skipPrismaUntil;
}
function markPrismaUnavailable(error) {
    if (isDatabaseUnavailableError(error)) {
        skipPrismaUntil = Date.now() + DB_RETRY_COOLDOWN_MS;
    }
}
async function runWithPrismaFallback(prismaAction, fallbackAction) {
    if (!isFallbackEnabled()) {
        return prismaAction();
    }
    if (!shouldTryPrismaNow()) {
        return fallbackAction();
    }
    try {
        return await prismaAction();
    }
    catch (error) {
        markPrismaUnavailable(error);
        return fallbackAction();
    }
}
//# sourceMappingURL=prismaCircuitBreaker.js.map