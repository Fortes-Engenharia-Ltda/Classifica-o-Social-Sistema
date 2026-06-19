import { ProgramaRepository } from '../repositories/ProgramaRepository';
import { CreateProgramaDTO, UpdateProgramaDTO } from '../dtos/ProgramaDTO';

export class ProgramaService {
  private programaRepository = new ProgramaRepository();

  async create(data: CreateProgramaDTO) {
    const payload = {
      ...data,
      codigo: data.codigo?.trim(),
    };

    return this.programaRepository.create(payload);
  }

  async findById(id: number) {
    return this.programaRepository.findById(id);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy: 'id' | 'nome' | 'codigo' | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.programaRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
  }

  async update(id: number, data: UpdateProgramaDTO) {
    return this.programaRepository.update(id, data);
  }

  async delete(id: number) {
    return this.programaRepository.delete(id);
  }
}
