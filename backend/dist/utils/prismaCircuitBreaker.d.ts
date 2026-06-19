export declare function shouldTryPrismaNow(): boolean;
export declare function markPrismaUnavailable(error: unknown): void;
export declare function runWithPrismaFallback<T>(prismaAction: () => Promise<T>, fallbackAction: () => Promise<T>): Promise<T>;
//# sourceMappingURL=prismaCircuitBreaker.d.ts.map