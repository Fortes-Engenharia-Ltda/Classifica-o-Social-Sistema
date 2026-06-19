export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}
export declare const successResponse: <T>(message?: string, data?: T) => ApiResponse<T>;
export declare const errorResponse: (message?: string, errors?: Record<string, string[]>) => ApiResponse<null>;
export declare const paginationResponse: <T>(data: T[], total: number, page: number, pageSize: number) => {
    data: T[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
};
//# sourceMappingURL=response.d.ts.map