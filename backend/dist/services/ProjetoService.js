"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjetoService = void 0;
const ProjetoRepository_1 = require("../repositories/ProjetoRepository");
class ProjetoService {
    constructor() {
        this.projetoRepository = new ProjetoRepository_1.ProjetoRepository();
    }
    async create(data) {
        return this.projetoRepository.create(data);
    }
    async findById(id) {
        return this.projetoRepository.findById(id);
    }
    async findAll(page = 1, pageSize = 10, search = '', status = 'all', sortBy = 'dataCriacao', sortOrder = 'desc') {
        return this.projetoRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
    }
    async update(id, data) {
        return this.projetoRepository.update(id, data);
    }
    async delete(id) {
        return this.projetoRepository.delete(id);
    }
}
exports.ProjetoService = ProjetoService;
//# sourceMappingURL=ProjetoService.js.map