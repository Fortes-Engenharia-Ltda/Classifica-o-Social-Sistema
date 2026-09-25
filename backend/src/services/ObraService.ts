import { ObraRepository } from '../repositories/ObraRepository';
import { CreateObraDTO, UpdateObraDTO } from '../dtos/ObraDTO';
import { SqlServerDProjetosService, DProjetoRow } from './SqlServerDProjetosService';

export class ObraService {
  private obraRepository = new ObraRepository();
  private sqlServerDProjetosService = new SqlServerDProjetosService();

  private construirCodigo(row: DProjetoRow, index: number): string {
    const codigoBase = (row.idCentroCusto || row.projeto || '').trim();
    if (codigoBase) {
      return codigoBase;
    }

    const fallbackProjeto = (row.projeto || 'SEM-PROJETO').trim().replace(/\s+/g, '-').toUpperCase();
    return `${fallbackProjeto}-${index + 1}`;
  }

  async create(data: CreateObraDTO) {
    // Validar se código já existe
    const existe = await this.obraRepository.findByCodigo(data.codigoObra);
    if (existe) {
      throw new Error('Código de obra já cadastrado');
    }

    return this.obraRepository.create(data);
  }

  async findById(id: number) {
    return this.obraRepository.findById(id);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy:
      | 'id'
      | 'codigoObra'
      | 'nomeObra'
      | 'status'
      | 'projeto'
      | 'idCentroCusto'
      | 'centroCusto'
      | 'idUN'
      | 'un'
      | 'local'
      | 'cliente'
      | 'gerente'
      | 'gestor'
      | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.obraRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
  }

  async syncFromDProjetos() {
    const rows = await this.sqlServerDProjetosService.buscarDProjetos();

    let processadas = 0;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const codigoObra = this.construirCodigo(row, i);
      const nomeObra = (row.projeto || row.descricao || codigoObra).trim();
      const statusAtivo = row.ativo === 0 ? false : true;

      await this.obraRepository.upsertByCodigo({
        codigoObra,
        nomeObra,
        cidade: undefined,
        centroCusto: row.idCentroCusto || undefined,
        status: statusAtivo,
        idCentroCusto: row.idCentroCusto || undefined,
        idUN: row.idUN || undefined,
        un: row.un || undefined,
        descricao: row.descricao || undefined,
        projeto: row.projeto || undefined,
        local: row.local || undefined,
        cliente: row.cliente || undefined,
        gerente: row.gerente || undefined,
        gestor: row.gestor || undefined,
      });

      processadas += 1;
    }

    return {
      totalLidas: rows.length,
      totalSincronizadas: processadas,
    };
  }

  async update(id: number, data: UpdateObraDTO) {
    return this.obraRepository.update(id, data);
  }

  async delete(id: number) {
    return this.obraRepository.delete(id);
  }
}
