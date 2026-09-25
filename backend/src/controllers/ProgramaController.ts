import { Request, Response } from 'express';
import { ProgramaService } from '../services/ProgramaService';
import { successResponse, errorResponse } from '../utils/response';

const programaService = new ProgramaService();

export class ProgramaController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const programa = await programaService.create(req.body);
      res.status(201).json(successResponse('Programa criado com sucesso', programa));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const programa = await programaService.findById(parseInt(req.params.id));
      if (!programa) {
        res.status(404).json(errorResponse('Programa não encontrado'));
        return;
      }
      res.status(200).json(successResponse('Programa encontrado', programa));
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
      const sortBy: 'id' | 'nome' | 'codigo' | 'dataCriacao' =
        sortByParam === 'id' || sortByParam === 'nome' || sortByParam === 'codigo' || sortByParam === 'dataCriacao'
          ? sortByParam
          : 'dataCriacao';
      const sortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc';

      const result = await programaService.findAll(page, pageSize, search, status, sortBy, sortOrder);
      res.status(200).json(
        successResponse('Programas listados com sucesso', {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
          filters: { search, status, sortBy, sortOrder },
        }),
      );
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const programa = await programaService.update(parseInt(req.params.id), req.body);
      res.status(200).json(successResponse('Programa atualizado com sucesso', programa));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await programaService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
}
