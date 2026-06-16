import { ProgramaRepository } from '../repositories/ProgramaRepository';
import { CreateProgramaDTO, UpdateProgramaDTO } from '../dtos/ProgramaDTO';

export class ProgramaService {
  private programaRepository = new ProgramaRepository();

  private gerarCodigoAutomatico(): string {
    const sufixoAleatorio = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `PRG-${Date.now()}-${sufixoAleatorio}`;
  }

  async create(data: CreateProgramaDTO) {
    const payload: CreateProgramaDTO = {
      ...data,
      codigo: data.codigo?.trim() || this.gerarCodigoAutomatico(),
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
