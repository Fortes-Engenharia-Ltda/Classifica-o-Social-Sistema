import { Request, Response } from 'express';
import { ObraService } from '../services/ObraService';
import { successResponse, errorResponse } from '../utils/response';

const obraService = new ObraService();

export class ObraController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const obra = await obraService.create(req.body);
      res.status(201).json(successResponse('Obra criada com sucesso', obra));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const obra = await obraService.findById(parseInt(req.params.id));
      if (!obra) {
        res.status(404).json(errorResponse('Obra não encontrada'));
        return;
      }
      res.status(200).json(successResponse('Obra encontrada', obra));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = String(req.query.search || '').trim();
      const statusParam = String(req.query.status || 'all').toLowerCase();
      const sortByParam = String(req.query.sortBy || 'dataCriacao');
      const sortOrderParam = String(req.query.sortOrder || 'desc').toLowerCase();
      const status: 'all' | 'active' | 'inactive' =
        statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';

      const sortBy:
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
        | 'dataCriacao' =
        sortByParam === 'id' ||
        sortByParam === 'codigoObra' ||
        sortByParam === 'nomeObra' ||
        sortByParam === 'status' ||
        sortByParam === 'projeto' ||
        sortByParam === 'idCentroCusto' ||
        sortByParam === 'centroCusto' ||
        sortByParam === 'idUN' ||
        sortByParam === 'un' ||
        sortByParam === 'local' ||
        sortByParam === 'cliente' ||
        sortByParam === 'gerente' ||
        sortByParam === 'gestor' ||
        sortByParam === 'dataCriacao'
          ? sortByParam
          : 'dataCriacao';

      const sortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc';

      const result = await obraService.findAll(page, pageSize, search, status, sortBy, sortOrder);
      res.status(200).json(
        successResponse('Obras listadas com sucesso', {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
          filters: {
            search,
            status,
            sortBy,
            sortOrder,
          },
        }),
      );
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async syncDProjetos(_req: Request, res: Response): Promise<void> {
    try {
      const resultado = await obraService.syncFromDProjetos();
      res.status(200).json(successResponse('Tabela dProjetos sincronizada com sucesso', resultado));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const obra = await obraService.update(parseInt(req.params.id), req.body);
      res.status(200).json(successResponse('Obra atualizada com sucesso', obra));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await obraService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
}
