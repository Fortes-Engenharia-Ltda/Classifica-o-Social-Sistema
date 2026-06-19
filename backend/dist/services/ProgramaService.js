"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramaService = void 0;
const ProgramaRepository_1 = require("../repositories/ProgramaRepository");
class ProgramaService {
    constructor() {
        this.programaRepository = new ProgramaRepository_1.ProgramaRepository();
    }
    async create(data) {
        const payload = {
            ...data,
            codigo: data.codigo?.trim(),
        };
        return this.programaRepository.create(payload);
    }
    async findById(id) {
        return this.programaRepository.findById(id);
    }
    async findAll(page = 1, pageSize = 10, search = '', status = 'all', sortBy = 'dataCriacao', sortOrder = 'desc') {
        return this.programaRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
    }
    async update(id, data) {
        return this.programaRepository.update(id, data);
    }
    async delete(id) {
        return this.programaRepository.delete(id);
    }
}
exports.ProgramaService = ProgramaService;
//# sourceMappingURL=ProgramaService.js.map