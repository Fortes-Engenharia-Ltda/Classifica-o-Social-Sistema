"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDate = exports.isValidCNPJ = exports.isValidEmail = void 0;
// Validações de email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
// Validações de CNPJ
const isValidCNPJ = (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) {
        return false;
    }
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
        return false;
    }
    return true;
};
exports.isValidCNPJ = isValidCNPJ;
// Validações de data
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};
exports.isValidDate = isValidDate;
//# sourceMappingURL=validators.js.map