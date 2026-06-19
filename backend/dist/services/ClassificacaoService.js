"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassificacaoService = void 0;
const ClassificacaoRepository_1 = require("../repositories/ClassificacaoRepository");
class ClassificacaoService {
    constructor() {
        this.classificacaoRepository = new ClassificacaoRepository_1.ClassificacaoRepository();
    }
    async create(data) {
        return this.classificacaoRepository.create(data);
    }
    async findById(id) {
        return this.classificacaoRepository.findById(id);
    }
    async findAll(page = 1, pageSize = 10, search = '', status = 'all', sortBy = 'dataCriacao', sortOrder = 'desc') {
        return this.classificacaoRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
    }
    async update(id, data) {
        return this.classificacaoRepository.update(id, data);
    }
    async delete(id) {
        return this.classificacaoRepository.delete(id);
    }
}
exports.ClassificacaoService = ClassificacaoService;
//# sourceMappingURL=ClassificacaoService.js.map