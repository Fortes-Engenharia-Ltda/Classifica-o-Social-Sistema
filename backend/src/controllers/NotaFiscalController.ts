import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { NotaFiscalService } from '../services/NotaFiscalService';
import { ListarNotasFiscaisFiltersDTO } from '../dtos/NotaFiscalDTO';
import { successResponse, errorResponse } from '../utils/response';

const notaFiscalService = new NotaFiscalService();

export class NotaFiscalController {
  private parseStringListFilter(raw: unknown): string[] {
    if (raw == null) {
      return [];
    }

    const parts = Array.isArray(raw)
      ? raw.flatMap((item) => String(item || '').split(','))
      : String(raw || '').split(',');

    return parts.map((item) => item.trim()).filter(Boolean);
  }

  private parseNumberListFilter(raw: unknown): number[] {
    const values = this.parseStringListFilter(raw)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));

    return Array.from(new Set(values));
  }

  private buildFilters(query: Request['query']): ListarNotasFiscaisFiltersDTO {
    const statusValues = this.parseStringListFilter(query.status);
    const dataInicio = String(query.dataInicio || '').trim();
    const dataFim = String(query.dataFim || '').trim();

    return {
      status: statusValues[0] || undefined,
      obraId: this.parseNumberListFilter(query.obraId),
      programa: this.parseStringListFilter(query.programa),
      classificacao: this.parseStringListFilter(query.classificacao),
      orcadoNaoOrcado: this.parseStringListFilter(query.orcadoNaoOrcado),
      projeto: this.parseStringListFilter(query.projeto),
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    };
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const notaFiscal = await notaFiscalService.create(req.body);
      res.status(201).json(successResponse('Nota Fiscal criada com sucesso', notaFiscal));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const notaFiscal = await notaFiscalService.findById(parseInt(req.params.id));
      if (!notaFiscal) {
        res.status(404).json(errorResponse('Nota Fiscal não encontrada'));
        return;
      }
      res.status(200).json(successResponse('Nota Fiscal encontrada', notaFiscal));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const filters = this.buildFilters(req.query);

      const result = await notaFiscalService.findAll(page, pageSize, filters);
      res.status(200).json(
        successResponse('Notas Fiscais listadas com sucesso', {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        }),
      );
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const notaFiscal = await notaFiscalService.update(parseInt(req.params.id), req.body);
      res.status(200).json(successResponse('Nota Fiscal atualizada com sucesso', notaFiscal));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await notaFiscalService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async deleteLote(req: Request, res: Response): Promise<void> {
    try {
      const ids = req.body?.notasFiscaisIds;
      if (!Array.isArray(ids) || !ids.length) {
        res.status(400).json(errorResponse('Informe ao menos uma NF para exclusão em lote'));
        return;
      }

      const count = await notaFiscalService.deleteLote({ notasFiscaisIds: ids.map((id: any) => Number(id)) });
      res.status(200).json(successResponse('Notas Fiscais excluídas com sucesso', { totalExcluidas: count }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      const count = await notaFiscalService.deleteAll();
      res.status(200).json(successResponse('Todas as Notas Fiscais foram excluídas com sucesso', { totalExcluidas: count }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async classificar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Usuário não autenticado'));
        return;
      }

      const classificacao = await notaFiscalService.classificarNF(
        {
          ...req.body,
          notaFiscalId: parseInt(req.params.id),
        },
        req.user.id,
      );
      res.status(201).json(successResponse('Nota Fiscal classificada com sucesso', classificacao));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async classificarLote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Usuário não autenticado'));
        return;
      }

      const result = await notaFiscalService.classificarLote(req.body, req.user.id);
      res.status(201).json(successResponse('Notas Fiscais classificadas em lote com sucesso', result));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async importarExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file?.buffer) {
        res.status(400).json(errorResponse('Arquivo Excel não enviado'));
        return;
      }

      const result = await notaFiscalService.importarExcel(file.buffer);
      res.status(201).json(successResponse('Planilha importada com sucesso', result));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async baixarTemplateExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const fileBuffer = await notaFiscalService.gerarTemplateExcel();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="modelo-notas-fiscais.xlsx"');
      res.status(200).send(fileBuffer);
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message || 'Erro ao gerar template Excel'));
    }
  }

  async exportarExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = this.buildFilters(req.query);

      const fileBuffer = await notaFiscalService.exportarExcel(1000, filters);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="notas-fiscais-exportacao.xlsx"');
      res.status(200).send(fileBuffer);
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message || 'Erro ao exportar Excel'));
    }
  }
}
