export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export const successResponse = <T>(
  message: string = 'Operação realizada com sucesso',
  data?: T,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (
  message: string = 'Erro ao processar requisição',
  errors?: Record<string, string[]>,
): ApiResponse<null> => ({
  success: false,
  message,
  errors,
});

export const paginationResponse = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) => ({
  data,
  pagination: {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  },
});
