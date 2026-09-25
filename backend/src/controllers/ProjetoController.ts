import path from 'path';
import fs from 'fs/promises';
import { Request, Response } from 'express';
import { ProjetoService } from '../services/ProjetoService';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../config/database';
import { runWithPrismaFallback } from '../utils/prismaCircuitBreaker';

const projetoService = new ProjetoService();

export class ProjetoController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const projeto = await projetoService.create(req.body);
      res.status(201).json(successResponse('Projeto criado com sucesso', projeto));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async uploadImagem(req: Request, res: Response): Promise<void> {
    try {
      const arquivo = (req as any).file as Express.Multer.File | undefined;
      if (!arquivo) {
        res.status(400).json(errorResponse('Nenhum arquivo enviado'));
        return;
      }
      const urlImagem = `/uploads/projetos-imagens/${arquivo.filename}`;
      res.status(200).json(successResponse('Imagem enviada com sucesso', { url: urlImagem }));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const projeto = await projetoService.findById(parseInt(req.params.id));
      if (!projeto) {
        res.status(404).json(errorResponse('Projeto não encontrado'));
        return;
      }
      res.status(200).json(successResponse('Projeto encontrado', projeto));
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

      const result = await projetoService.findAll(page, pageSize, search, status, sortBy, sortOrder);
      res.status(200).json(
        successResponse('Projetos listados com sucesso', {
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
      const projeto = await projetoService.update(parseInt(req.params.id), req.body);
      res.status(200).json(successResponse('Projeto atualizado com sucesso', projeto));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await projetoService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async listarInstituicoesPorProjeto(req: Request, res: Response): Promise<void> {
    try {
      const projetoId = parseInt(req.params.id, 10);
      if (!Number.isFinite(projetoId)) {
        res.status(400).json(errorResponse('Projeto inválido'));
        return;
      }

      const contratosPath = path.resolve(process.cwd(), 'data', 'instituicoes-contratos-fallback.json');
      const instituicoesPath = path.resolve(process.cwd(), 'data', 'instituicoes-cadastros-fallback.json');

      let contratos: any[] = [];
      try {
        const raw = await fs.readFile(contratosPath, 'utf8');
        contratos = JSON.parse(raw);
      } catch { contratos = []; }

      const contratosDoProjeto = contratos.filter((c: any) => Number(c.projetoId) === projetoId);

      if (contratosDoProjeto.length === 0) {
        res.status(200).json(successResponse('Nenhuma instituição encontrada', []));
        return;
      }

      const instituicaoIds = [...new Set(
        contratosDoProjeto
          .map((c: any) => Number(c.instituicaoIdReferencia))
          .filter((id: number) => id > 0),
      )];

      let instituicoesDb: any[] = [];
      try {
        instituicoesDb = await runWithPrismaFallback(
          () => prisma.instituicaoSocial.findMany({
            where: { id: { in: instituicaoIds } },
            select: { id: true, instituicao: true, liberadoAdmin: true },
          }),
          async () => [],
        );
      } catch { instituicoesDb = []; }

      let instituicoesFallback: any[] = [];
      try {
        const raw = await fs.readFile(instituicoesPath, 'utf8');
        instituicoesFallback = JSON.parse(raw);
      } catch { instituicoesFallback = []; }

      const hoje = new Date();

      const resultado = instituicaoIds.map((id: number) => {
        const contratosDaInst = contratosDoProjeto.filter(
          (c: any) => Number(c.instituicaoIdReferencia) === id,
        );

        const contratoAtivo = contratosDaInst.find((c: any) => {
          const fim = c.dataFim ? new Date(c.dataFim) : null;
          return fim && fim >= hoje;
        });

        const dbItem = instituicoesDb.find((i: any) => i.id === id);
        const fbItem = instituicoesFallback.find(
          (i: any) => Number(i.instituicaoIdReferencia) === id || Number(i.id) === id,
        );

        return {
          instituicaoId: id,
          nomeInstituicao: dbItem?.instituicao
            || fbItem?.nomeFantasia
            || fbItem?.nome
            || `Instituição #${id}`,
          status: dbItem?.liberadoAdmin ? 'APROVADO' : fbItem?.statusRevisao || 'ATIVO',
          contratoAtivo: !!contratoAtivo,
          quantidadeContratos: contratosDaInst.length,
        };
      });

      res.status(200).json(successResponse('Instituições listadas com sucesso', resultado));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
}
