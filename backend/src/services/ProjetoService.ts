import { ProjetoRepository } from '../repositories/ProjetoRepository';
import { CreateProjetoDTO, UpdateProjetoDTO } from '../dtos/ProjetoDTO';

export class ProjetoService {
  private projetoRepository = new ProjetoRepository();

  async create(data: CreateProjetoDTO) {
    return this.projetoRepository.create(data);
  }

  async findById(id: number) {
    return this.projetoRepository.findById(id);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy: 'id' | 'nome' | 'codigo' | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.projetoRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
  }

  async update(id: number, data: UpdateProjetoDTO) {
    return this.projetoRepository.update(id, data);
  }

  async delete(id: number) {
    return this.projetoRepository.delete(id);
  }
}
