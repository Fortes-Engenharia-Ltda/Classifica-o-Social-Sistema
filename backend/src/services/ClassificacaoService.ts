import { ClassificacaoRepository } from '../repositories/ClassificacaoRepository';
import { CreateClassificacaoDTO, UpdateClassificacaoDTO } from '../dtos/ClassificacaoDTO';

export class ClassificacaoService {
  private classificacaoRepository = new ClassificacaoRepository();

  async create(data: CreateClassificacaoDTO) {
    return this.classificacaoRepository.create(data);
  }

  async findById(id: number) {
    return this.classificacaoRepository.findById(id);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy: 'id' | 'nome' | 'codigo' | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.classificacaoRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
  }

  async update(id: number, data: UpdateClassificacaoDTO) {
    return this.classificacaoRepository.update(id, data);
  }

  async delete(id: number) {
    return this.classificacaoRepository.delete(id);
  }
}
