"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationResponse = exports.errorResponse = exports.successResponse = void 0;
const successResponse = (message = 'Operação realizada com sucesso', data) => ({
    success: true,
    message,
    data,
});
exports.successResponse = successResponse;
const errorResponse = (message = 'Erro ao processar requisição', errors) => ({
    success: false,
    message,
    errors,
});
exports.errorResponse = errorResponse;
const paginationResponse = (data, total, page, pageSize) => ({
    data,
    pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    },
});
exports.paginationResponse = paginationResponse;
//# sourceMappingURL=response.js.map