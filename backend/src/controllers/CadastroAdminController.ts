import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';

type OrcadoNaoOrcadoItem = {
  id: number;
  codigo: string | null;
  nome: string;
  status: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
};

type ClassificacaoContaItem = {
  id: number;
  codigoAcao: number;
  nome: string;
  orcadoNaoOrcadoId: number;
  orcadoNaoOrcadoNome: string;
  status: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
};

const mapOrcadoNaoOrcado = (item: {
  id: number;
  codigo: string | null;
  nome: string;
  status: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}): OrcadoNaoOrcadoItem => ({
  id: item.id,
  codigo: item.codigo,
  nome: item.nome,
  status: item.status,
  dataCriacao: item.dataCriacao.toISOString(),
  dataAtualizacao: item.dataAtualizacao.toISOString(),
});

const mapClassificacaoConta = (item: {
  id: number;
  codigoAcao: number;
  nome: string;
  orcadoNaoOrcadoId: number;
  status: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
  orcadoNaoOrcado: {
    nome: string;
  };
}): ClassificacaoContaItem => ({
  id: item.id,
  codigoAcao: item.codigoAcao,
  nome: item.nome,
  orcadoNaoOrcadoId: item.orcadoNaoOrcadoId,
  orcadoNaoOrcadoNome: item.orcadoNaoOrcado?.nome || '',
  status: item.status,
  dataCriacao: item.dataCriacao.toISOString(),
  dataAtualizacao: item.dataAtualizacao.toISOString(),
});

// Exemplo de CRUD para tabelas administrativas
export class CadastroAdminController {
  // dOrçadoNãoOrçado
  async listarOrcadoNaoOrcado(req: Request, res: Response) {
    try {
      const itens = await prisma.orcadoNaoOrcado.findMany({
        orderBy: [{ status: 'desc' }, { nome: 'asc' }],
      });

      res.json(itens.map(mapOrcadoNaoOrcado));
    } catch (error) {
      logger.error(
        `Erro ao listar Orçado/Não Orçado: ${
          error instanceof Error ? error.stack || error.message : JSON.stringify(error)
        }`,
      );
      res.status(500).json({ message: 'Erro ao listar Orçado/Não Orçado' });
    }
  }

  async criarOrcadoNaoOrcado(req: Request, res: Response) {
    try {
      const nome = String(req.body?.nome || '').trim();
      const codigoRaw = req.body?.codigo;
      const statusRaw = req.body?.status;

      if (!nome) {
        res.status(400).json({ message: 'Nome é obrigatório' });
        return;
      }

      const codigo = typeof codigoRaw === 'string' ? codigoRaw.trim() : undefined;
      if (codigo !== undefined && !codigo) {
        res.status(400).json({ message: 'Código não pode ser vazio' });
        return;
      }

      const status = typeof statusRaw === 'boolean' ? statusRaw : true;

      const duplicadoNome = await prisma.orcadoNaoOrcado.findFirst({
        where: { nome: { equals: nome, mode: 'insensitive' } },
      });
      if (duplicadoNome) {
        res.status(409).json({ message: 'Já existe um item com esse nome' });
        return;
      }

      if (codigo) {
        const duplicadoCodigo = await prisma.orcadoNaoOrcado.findFirst({
          where: { codigo: { equals: codigo, mode: 'insensitive' } },
        });
        if (duplicadoCodigo) {
          res.status(409).json({ message: 'Já existe um item com esse código' });
          return;
        }
      }

      const novoItem = await prisma.orcadoNaoOrcado.create({
        data: {
          nome,
          codigo: codigo || null,
          status,
        },
      });

      res.status(201).json(mapOrcadoNaoOrcado(novoItem));
    } catch (error) {
      logger.error(
        `Erro ao criar Orçado/Não Orçado: ${
          error instanceof Error ? error.stack || error.message : JSON.stringify(error)
        }`,
      );
      res.status(500).json({ message: 'Erro ao criar Orçado/Não Orçado' });
    }
  }

  async atualizarOrcadoNaoOrcado(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        res.status(400).json({ message: 'ID inválido' });
        return;
      }

      const nomeRecebido = req.body?.nome;
      const statusRecebido = req.body?.status;
      const codigoInformado = Object.prototype.hasOwnProperty.call(req.body || {}, 'codigo');
      const codigoRecebido = req.body?.codigo;

      const nome = typeof nomeRecebido === 'string' ? nomeRecebido.trim() : undefined;
      const status = typeof statusRecebido === 'boolean' ? statusRecebido : undefined;

      let codigo: string | null | undefined;
      if (codigoInformado) {
        if (codigoRecebido === null) {
          codigo = null;
        } else if (typeof codigoRecebido === 'string') {
          const codigoTrim = codigoRecebido.trim();
          codigo = codigoTrim || null;
        } else {
          res.status(400).json({ message: 'Código inválido' });
          return;
        }
      }

      if (nome === undefined && status === undefined && !codigoInformado) {
        res.status(400).json({ message: 'Informe ao menos nome, código ou status para atualizar' });
        return;
      }

      if (nome !== undefined && !nome) {
        res.status(400).json({ message: 'Nome não pode ser vazio' });
        return;
      }

      const existente = await prisma.orcadoNaoOrcado.findUnique({ where: { id } });
      if (!existente) {
        res.status(404).json({ message: 'Registro não encontrado' });
        return;
      }

      if (nome !== undefined) {
        const duplicadoNome = await prisma.orcadoNaoOrcado.findFirst({
          where: {
            id: { not: id },
            nome: { equals: nome, mode: 'insensitive' },
          },
        });
        if (duplicadoNome) {
          res.status(409).json({ message: 'Já existe um item com esse nome' });
          return;
        }
      }

      if (codigoInformado && codigo) {
        const duplicadoCodigo = await prisma.orcadoNaoOrcado.findFirst({
          where: {
            id: { not: id },
            codigo: { equals: codigo, mode: 'insensitive' },
          },
        });
        if (duplicadoCodigo) {
          res.status(409).json({ message: 'Já existe um item com esse código' });
          return;
        }
      }

      const atualizado = await prisma.orcadoNaoOrcado.update({
        where: { id },
        data: {
          ...(nome !== undefined ? { nome } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(codigoInformado ? { codigo } : {}),
        },
      });

      res.status(200).json(mapOrcadoNaoOrcado(atualizado));
    } catch (error) {
      logger.error(
        `Erro ao atualizar Orçado/Não Orçado: ${
          error instanceof Error ? error.stack || error.message : JSON.stringify(error)
        }`,
      );
      res.status(500).json({ message: 'Erro ao atualizar Orçado/Não Orçado' });
    }
  }

  // dClassificaçõesSociais
  async listarClassificacoes(req: Request, res: Response) {
    res.json([]);
  }
  async criarClassificacao(req: Request, res: Response) {
    res.status(201).json({});
  }

  // Classificação de Contas
  async listarClassificacaoContas(req: Request, res: Response) {
    try {
      const itens = await (prisma as any).classificacaoConta.findMany({
        orderBy: [{ status: 'desc' }, { codigoAcao: 'asc' }],
        include: {
          orcadoNaoOrcado: {
            select: { nome: true },
          },
        },
      });

      res.json(itens.map(mapClassificacaoConta));
    } catch (error) {
      logger.error(
        `Erro ao listar Classificação de Contas: ${
          error instanceof Error ? error.stack || error.message : JSON.stringify(error)
        }`,
      );
      res.status(500).json({ message: 'Erro ao listar Classificação de Contas' });
    }
  }

  async criarClassificacaoConta(req: Request, res: Response) {
    try {
      const codigoAcao = Number(req.body?.codigoAcao);
      const nome = String(req.body?.nome || '').trim();
      const orcadoNaoOrcadoId = Number(req.body?.orcadoNaoOrcadoId);
      const status = typeof req.body?.status === 'boolean' ? req.body.status : true;

      if (!Number.isFinite(codigoAcao) || codigoAcao <= 0) {
        res.status(400).json({ message: 'Código da ação inválido' });
        return;
      }

      if (!nome) {
        res.status(400).json({ message: 'Nome é obrigatório' });
        return;
      }

      if (!Number.isFinite(orcadoNaoOrcadoId) || orcadoNaoOrcadoId <= 0) {
        res.status(400).json({ message: 'Orçado/Não Orçado é obrigatório' });
        return;
      }

      const orcado = await prisma.orcadoNaoOrcado.findUnique({ where: { id: orcadoNaoOrcadoId } });
      if (!orcado) {
        res.status(404).json({ message: 'Registro Orçado/Não Orçado não encontrado' });
        return;
      }

      const duplicadoAcao = await (prisma as any).classificacaoConta.findFirst({
        where: { codigoAcao },
      });
      if (duplicadoAcao) {
        res.status(409).json({ message: 'Já existe Classificação de Conta para esse código de ação' });
        return;
      }

      const novo = await (prisma as any).classificacaoConta.create({
        data: {
          codigoAcao,
          nome,
          orcadoNaoOrcadoId,
          status,
        },
        include: {
          orcadoNaoOrcado: { select: { nome: true } },
        },
      });

      res.status(201).json(mapClassificacaoConta(novo));
    } catch (error) {
      logger.error(
        `Erro ao criar Classificação de Contas: ${
          error instanceof Error ? error.stack || error.message : JSON.stringify(error)
        }`,
      );
      res.status(500).json({ message: 'Erro ao criar Classificação de Contas' });
    }
  }

  async atualizarClassificacaoConta(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        res.status(400).json({ message: 'ID inválido' });
        return;
      }

      const codigoAcaoRecebido = req.body?.codigoAcao;
      const nomeRecebido = req.body?.nome;
      const orcadoNaoOrcadoIdRecebido = req.body?.orcadoNaoOrcadoId;
      const statusRecebido = req.body?.status;

      const codigoAcao = codigoAcaoRecebido !== undefined ? Number(codigoAcaoRecebido) : undefined;
      const nome = typeof nomeRecebido === 'string' ? nomeRecebido.trim() : undefined;
      const orcadoNaoOrcadoId =
        orcadoNaoOrcadoIdRecebido !== undefined ? Number(orcadoNaoOrcadoIdRecebido) : undefined;
      const status = typeof statusRecebido === 'boolean' ? statusRecebido : undefined;

      if (
        codigoAcao === undefined
        && nome === undefined
        && orcadoNaoOrcadoId === undefined
        && status === undefined
      ) {
        res.status(400).json({ message: 'Informe ao menos um campo para atualizar' });
        return;
      }

      if (codigoAcao !== undefined && (!Number.isFinite(codigoAcao) || codigoAcao <= 0)) {
        res.status(400).json({ message: 'Código da ação inválido' });
        return;
      }

      if (nome !== undefined && !nome) {
        res.status(400).json({ message: 'Nome não pode ser vazio' });
        return;
      }

      if (orcadoNaoOrcadoId !== undefined && (!Number.isFinite(orcadoNaoOrcadoId) || orcadoNaoOrcadoId <= 0)) {
        res.status(400).json({ message: 'Orçado/Não Orçado inválido' });
        return;
      }

      const existente = await (prisma as any).classificacaoConta.findUnique({ where: { id } });
      if (!existente) {
        res.status(404).json({ message: 'Registro não encontrado' });
        return;
      }

      if (codigoAcao !== undefined) {
        const duplicado = await (prisma as any).classificacaoConta.findFirst({
          where: {
            id: { not: id },
            codigoAcao,
          },
        });
        if (duplicado) {
          res.status(409).json({ message: 'Já existe Classificação de Conta para esse código de ação' });
          return;
        }
      }

      if (orcadoNaoOrcadoId !== undefined) {
        const orcado = await prisma.orcadoNaoOrcado.findUnique({ where: { id: orcadoNaoOrcadoId } });
        if (!orcado) {
          res.status(404).json({ message: 'Registro Orçado/Não Orçado não encontrado' });
          return;
        }
      }

      const atualizado = await (prisma as any).classificacaoConta.update({
        where: { id },
        data: {
          ...(codigoAcao !== undefined ? { codigoAcao } : {}),
          ...(nome !== undefined ? { nome } : {}),
          ...(orcadoNaoOrcadoId !== undefined ? { orcadoNaoOrcadoId } : {}),
          ...(status !== undefined ? { status } : {}),
        },
        include: {
          orcadoNaoOrcado: { select: { nome: true } },
        },
      });

      res.status(200).json(mapClassificacaoConta(atualizado));
    } catch (error) {
      logger.error(
        `Erro ao atualizar Classificação de Contas: ${
          error instanceof Error ? error.stack || error.message : JSON.stringify(error)
        }`,
      );
      res.status(500).json({ message: 'Erro ao atualizar Classificação de Contas' });
    }
  }

  // dProgramasSociais
  async listarProgramas(req: Request, res: Response) {
    res.json([]);
  }
  async criarPrograma(req: Request, res: Response) {
    res.status(201).json({});
  }
}
