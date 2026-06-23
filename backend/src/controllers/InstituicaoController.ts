import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../config/database';
import { successResponse, errorResponse } from '../utils/response';
import { consumirTokenCadastro, validarTokenCadastro, gerarTokenParaInstituicao } from './TokenCadastroController';
import { AuthenticatedRequest } from '../middlewares/auth';
import { EmailService } from '../services/EmailService';
import logger from '../config/logger';
import { runWithPrismaFallback } from '../utils/prismaCircuitBreaker';

const emailService = new EmailService();

const hasValue = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
};

export class InstituicaoController {
  async criarInstituicaoCompleta(req: Request, res: Response): Promise<void> {
    try {
      const arquivoTermo = (req as any).file as Express.Multer.File | undefined;
      const bodyComPayload =
        typeof (req.body as any)?.payload === 'string'
          ? JSON.parse((req.body as any).payload)
          : req.body;

      const termoAnexoUpload = arquivoTermo
        ? `/uploads/instituicoes-termos/${arquivoTermo.filename}`
        : undefined;

      const {
        instituicao,
        responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cnpj,
        prazoPagamento,
        descricao,
        historicoFinalidadeOsc,
        principaisAcoesProponente,
        publicoAlvoProponente,
        regiaoAlcanceBairros,
        infraestruturaProponente,
        termoAnexo: termoAnexoBody,
        responsavelInstituicao,
        responsavelTecnico,
        token,
      } = bodyComPayload;

      const termoAnexo = termoAnexoUpload ?? termoAnexoBody;

      const tokenNormalizado = typeof token === 'string' ? token.trim() : '';
      let validacaoToken: ReturnType<typeof validarTokenCadastro> | null = null;
      if (tokenNormalizado) {
        validacaoToken = validarTokenCadastro(tokenNormalizado);
        if (!validacaoToken.ok) {
          res.status(validacaoToken.status).json(errorResponse(validacaoToken.message));
          return;
        }
      }

      const camposInstituicaoObrigatorios = {
        instituicao,
        cep,
        logradouro,
        numero,
        bairro,
        cidade,
        estado,
        cnpj,
        prazoPagamento,
        descricao,
        historicoFinalidadeOsc,
        principaisAcoesProponente,
        publicoAlvoProponente,
        regiaoAlcanceBairros,
        infraestruturaProponente,
      };

      const camposResponsavelInstituicaoObrigatorios = {
        representante: responsavelInstituicao?.representante,
        cpf: responsavelInstituicao?.cpf,
        rg: responsavelInstituicao?.rg,
        orgaoExpedidor: responsavelInstituicao?.orgaoExpedidor,
        cargo: responsavelInstituicao?.cargo,
        mandato: responsavelInstituicao?.mandato,
        endereco: responsavelInstituicao?.endereco,
        contato: responsavelInstituicao?.contato,
        email: responsavelInstituicao?.email,
      };

      const camposResponsavelTecnicoObrigatorios = {
        representante: responsavelTecnico?.representante,
        cpf: responsavelTecnico?.cpf,
        rg: responsavelTecnico?.rg,
        orgaoExpedidor: responsavelTecnico?.orgaoExpedidor,
        cargo: responsavelTecnico?.cargo,
        mandato: responsavelTecnico?.mandato,
        endereco: responsavelTecnico?.endereco,
        contato: responsavelTecnico?.contato,
        email: responsavelTecnico?.email,
      };

      if (!Object.values(camposInstituicaoObrigatorios).every(hasValue)) {
        res.status(400).json(errorResponse('Todos os campos da instituição são obrigatórios'));
        return;
      }

      if (!Object.values(camposResponsavelInstituicaoObrigatorios).every(hasValue)) {
        res.status(400).json(errorResponse('Todos os campos do responsável da instituição são obrigatórios'));
        return;
      }

      if (!Object.values(camposResponsavelTecnicoObrigatorios).every(hasValue)) {
        res.status(400).json(errorResponse('Todos os campos do responsável técnico são obrigatórios'));
        return;
      }

      const instituicaoIdRevisao = tokenNormalizado && validacaoToken && validacaoToken.ok
        ? validacaoToken.entry.instituicaoId
        : undefined;

      const payloadFallback = {
        instituicao,
        responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cnpj,
        prazoPagamento,
        dataInicio: null,
        dataFim: null,
        descricao,
        historicoFinalidadeOsc,
        principaisAcoesProponente,
        publicoAlvoProponente,
        regiaoAlcanceBairros,
        infraestruturaProponente,
        termoAnexo,
        responsavelInstituicao,
        responsavelTecnico,
        instituicaoIdRevisao,
      };

      const resultado = await runWithPrismaFallback(async () => prisma.$transaction(async (tx) => {
        if (instituicaoIdRevisao) {
          const instituicaoExistente = await tx.instituicaoSocial.findUnique({
            where: { id: instituicaoIdRevisao },
            include: {
              responsaveis: { take: 1, orderBy: { id: 'asc' } },
              responsaveisTecnicos: { take: 1, orderBy: { id: 'asc' } },
            },
          });

          if (!instituicaoExistente) {
            throw new Error('Instituição do link de revisão não encontrada');
          }

          const instituicaoAtualizada = await tx.instituicaoSocial.update({
            where: { id: instituicaoIdRevisao },
            data: {
              instituicao,
              responsavel: responsavelInstituicao.representante || responsavel,
              cep,
              logradouro,
              numero,
              complemento,
              bairro,
              cidade,
              estado,
              cnpj,
              prazoPagamento: prazoPagamento ? String(prazoPagamento) : null,
              descricao,
              historicoFinalidadeOsc,
              principaisAcoesProponente,
              publicoAlvoProponente,
              regiaoAlcanceBairros,
              infraestruturaProponente,
              termoAnexo,
              statusRevisao: 'PENDENTE',
              observacoesRevisao: '[AJUSTE] Ajustes enviados pela instituição',
              revisorEmail: null,
              revisorNome: null,
              dataRevisao: null,
              motivoRejeicao: null,
            },
          });

          const responsavelInstituicaoExistente = instituicaoExistente.responsaveis?.[0];
          const registroResponsavelInstituicao = responsavelInstituicaoExistente
            ? await tx.responsavelInstituicao.update({
                where: { id: responsavelInstituicaoExistente.id },
                data: {
                  representante: responsavelInstituicao.representante,
                  cpf: responsavelInstituicao.cpf,
                  rg: responsavelInstituicao.rg,
                  orgaoExpedidor: responsavelInstituicao.orgaoExpedidor,
                  cargo: responsavelInstituicao.cargo,
                  mandato: responsavelInstituicao.mandato,
                  endereco: responsavelInstituicao.endereco,
                  contato: responsavelInstituicao.contato,
                  contato2: responsavelInstituicao.contato2,
                  contato3: responsavelInstituicao.contato3,
                  email: responsavelInstituicao.email,
                },
              })
            : await tx.responsavelInstituicao.create({
                data: {
                  instituicaoId: instituicaoIdRevisao,
                  representante: responsavelInstituicao.representante,
                  cpf: responsavelInstituicao.cpf,
                  rg: responsavelInstituicao.rg,
                  orgaoExpedidor: responsavelInstituicao.orgaoExpedidor,
                  cargo: responsavelInstituicao.cargo,
                  mandato: responsavelInstituicao.mandato,
                  endereco: responsavelInstituicao.endereco,
                  contato: responsavelInstituicao.contato,
                  contato2: responsavelInstituicao.contato2,
                  contato3: responsavelInstituicao.contato3,
                  email: responsavelInstituicao.email,
                },
              });

          const responsavelTecnicoExistente = instituicaoExistente.responsaveisTecnicos?.[0];
          const registroResponsavelTecnico = responsavelTecnicoExistente
            ? await tx.responsavelTecnico.update({
                where: { id: responsavelTecnicoExistente.id },
                data: {
                  representante: responsavelTecnico.representante,
                  cpf: responsavelTecnico.cpf,
                  rg: responsavelTecnico.rg,
                  orgaoExpedidor: responsavelTecnico.orgaoExpedidor,
                  cargo: responsavelTecnico.cargo,
                  mandato: responsavelTecnico.mandato,
                  endereco: responsavelTecnico.endereco,
                  contato: responsavelTecnico.contato,
                  contato2: responsavelTecnico.contato2,
                  contato3: responsavelTecnico.contato3,
                  email: responsavelTecnico.email,
                },
              })
            : await tx.responsavelTecnico.create({
                data: {
                  instituicaoId: instituicaoIdRevisao,
                  representante: responsavelTecnico.representante,
                  cpf: responsavelTecnico.cpf,
                  rg: responsavelTecnico.rg,
                  orgaoExpedidor: responsavelTecnico.orgaoExpedidor,
                  cargo: responsavelTecnico.cargo,
                  mandato: responsavelTecnico.mandato,
                  endereco: responsavelTecnico.endereco,
                  contato: responsavelTecnico.contato,
                  contato2: responsavelTecnico.contato2,
                  contato3: responsavelTecnico.contato3,
                  email: responsavelTecnico.email,
                },
              });

          return {
            instituicao: instituicaoAtualizada,
            responsavelInstituicao: registroResponsavelInstituicao,
            responsavelTecnico: registroResponsavelTecnico,
            tipoSubmissao: 'AJUSTE',
          };
        }

        const novaInstituicao = await tx.instituicaoSocial.create({
          data: {
            instituicao,
            responsavel: responsavelInstituicao.representante || responsavel,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cnpj,
            prazoPagamento: prazoPagamento ? String(prazoPagamento) : null,
            descricao,
            historicoFinalidadeOsc,
            principaisAcoesProponente,
            publicoAlvoProponente,
            regiaoAlcanceBairros,
            infraestruturaProponente,
            termoAnexo,
          },
        });

        const registroResponsavelInstituicao = await tx.responsavelInstituicao.create({
          data: {
            instituicaoId: novaInstituicao.id,
            representante: responsavelInstituicao.representante,
            cpf: responsavelInstituicao.cpf,
            rg: responsavelInstituicao.rg,
            orgaoExpedidor: responsavelInstituicao.orgaoExpedidor,
            cargo: responsavelInstituicao.cargo,
            mandato: responsavelInstituicao.mandato,
            endereco: responsavelInstituicao.endereco,
            contato: responsavelInstituicao.contato,
            contato2: responsavelInstituicao.contato2,
            contato3: responsavelInstituicao.contato3,
            email: responsavelInstituicao.email,
          },
        });

        const registroResponsavelTecnico = await tx.responsavelTecnico.create({
          data: {
            instituicaoId: novaInstituicao.id,
            representante: responsavelTecnico.representante,
            cpf: responsavelTecnico.cpf,
            rg: responsavelTecnico.rg,
            orgaoExpedidor: responsavelTecnico.orgaoExpedidor,
            cargo: responsavelTecnico.cargo,
            mandato: responsavelTecnico.mandato,
            endereco: responsavelTecnico.endereco,
            contato: responsavelTecnico.contato,
            contato2: responsavelTecnico.contato2,
            contato3: responsavelTecnico.contato3,
            email: responsavelTecnico.email,
          },
        });

        return {
          instituicao: novaInstituicao,
          responsavelInstituicao: registroResponsavelInstituicao,
          responsavelTecnico: registroResponsavelTecnico,
          tipoSubmissao: 'NOVO_CADASTRO',
        };
      }), async () => this.criarInstituicaoCompletaFallback(payloadFallback));

      if (tokenNormalizado) {
        const consumido = consumirTokenCadastro(tokenNormalizado);
        if (!consumido) {
          res.status(409).json(errorResponse('Token já utilizado'));
          return;
        }
      }

      // Enviar email para o responsável da instituição (não bloqueia resposta em ambiente local)
      try {
        await emailService.enviarNotificacaoStatusInstituicao(
          responsavelInstituicao.email,
          responsavelInstituicao.representante,
          instituicao,
          'PENDENTE',
        );
      } catch (emailError) {
        logger.warn(`Falha ao enviar email de notificação de instituição: ${String(emailError)}`);
      }

      const mensagemSucesso = resultado.tipoSubmissao === 'AJUSTE'
        ? 'Ajustes da instituição enviados com sucesso e aguardando aprovação'
        : 'Cadastro completo da instituição realizado com sucesso';

      res.status(201).json(successResponse(mensagemSucesso, resultado));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async criarInstituicao(req: Request, res: Response): Promise<void> {
    try {
      const arquivoTermo = (req as any).file as Express.Multer.File | undefined;
      const bodyComPayload =
        typeof (req.body as any)?.payload === 'string'
          ? JSON.parse((req.body as any).payload)
          : req.body;

      const termoAnexoUpload = arquivoTermo
        ? `/uploads/instituicoes-termos/${arquivoTermo.filename}`
        : undefined;

      const {
        instituicao,
        responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cnpj,
        prazoPagamento,
        descricao,
        historicoFinalidadeOsc,
        principaisAcoesProponente,
        publicoAlvoProponente,
        regiaoAlcanceBairros,
        infraestruturaProponente,
        termoAnexo: termoAnexoBody,
      } = bodyComPayload;

      const termoAnexo = termoAnexoUpload ?? termoAnexoBody;

      const camposObrigatorios = {
        instituicao,
        responsavel,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cnpj,
        prazoPagamento,
        descricao,
        historicoFinalidadeOsc,
        principaisAcoesProponente,
        publicoAlvoProponente,
        regiaoAlcanceBairros,
        infraestruturaProponente,
      };

      if (!Object.values(camposObrigatorios).every(hasValue)) {
        res.status(400).json(errorResponse('Todos os campos da instituição são obrigatórios'));
        return;
      }

      const novaInstituicao = await prisma.instituicaoSocial.create({
        data: {
          instituicao,
          responsavel,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cnpj,
          prazoPagamento: prazoPagamento ? String(prazoPagamento) : null,
          dataInicio: null,
          dataFim: null,
          descricao,
          historicoFinalidadeOsc,
          principaisAcoesProponente,
          publicoAlvoProponente,
          regiaoAlcanceBairros,
          infraestruturaProponente,
          termoAnexo,
        },
      });

      res.status(201).json(successResponse('Instituição cadastrada com sucesso', novaInstituicao));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async listarInstituicoes(req: Request, res: Response): Promise<void> {
    try {
      const termo = String(req.query.termo || '').trim();
      const instituicao = String(req.query.instituicao || '').trim();
      const responsavel = String(req.query.responsavel || '').trim();
      const cnpj = String(req.query.cnpj || '').trim();
      const numero = String(req.query.numero || '').trim();
      const complemento = String(req.query.complemento || '').trim();
      const cidade = String(req.query.cidade || '').trim();
      const estado = String(req.query.estado || '').trim();
      const statusAtivo = String(req.query.statusAtivo || '').trim().toUpperCase();
      const dataInicioDe = String(req.query.dataInicioDe || '').trim();
      const dataInicioAte = String(req.query.dataInicioAte || '').trim();
      const dataFimDe = String(req.query.dataFimDe || '').trim();
      const dataFimAte = String(req.query.dataFimAte || '').trim();
      const page = parseInt(String(req.query.page || '1'), 10);
      const pageSize = parseInt(String(req.query.pageSize || '10'), 10);

      const where: any = {};

      if (instituicao) {
        where.instituicao = { contains: instituicao, mode: 'insensitive' };
      }

      if (responsavel) {
        where.responsavel = { contains: responsavel, mode: 'insensitive' };
      }

      if (cnpj) {
        where.cnpj = { contains: cnpj, mode: 'insensitive' };
      }

      if (numero) {
        where.numero = { contains: numero, mode: 'insensitive' };
      }

      if (complemento) {
        where.complemento = { contains: complemento, mode: 'insensitive' };
      }

      if (cidade) {
        where.cidade = { contains: cidade, mode: 'insensitive' };
      }

      if (estado) {
        where.estado = { contains: estado, mode: 'insensitive' };
      }

      if (termo) {
        where.OR = [
          { instituicao: { contains: termo, mode: 'insensitive' } },
          { numero: { contains: termo, mode: 'insensitive' } },
          { complemento: { contains: termo, mode: 'insensitive' } },
          { estado: { contains: termo, mode: 'insensitive' } },
          { cidade: { contains: termo, mode: 'insensitive' } },
          { cnpj: { contains: termo, mode: 'insensitive' } },
          { responsavel: { contains: termo, mode: 'insensitive' } },
          { historicoFinalidadeOsc: { contains: termo, mode: 'insensitive' } },
          { principaisAcoesProponente: { contains: termo, mode: 'insensitive' } },
          { publicoAlvoProponente: { contains: termo, mode: 'insensitive' } },
          { regiaoAlcanceBairros: { contains: termo, mode: 'insensitive' } },
          { infraestruturaProponente: { contains: termo, mode: 'insensitive' } },
        ];
      }

      if (dataInicioDe || dataInicioAte) {
        where.dataInicio = {};
        if (dataInicioDe) {
          where.dataInicio.gte = new Date(dataInicioDe);
        }
        if (dataInicioAte) {
          where.dataInicio.lte = new Date(dataInicioAte);
        }
      }

      if (dataFimDe || dataFimAte) {
        where.dataFim = {};
        if (dataFimDe) {
          where.dataFim.gte = new Date(dataFimDe);
        }
        if (dataFimAte) {
          where.dataFim.lte = new Date(dataFimAte);
        }
      }

      const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);

      const fallbackInstituicoes = (await this.readInstituicoesFallback())
        .map((item) => this.normalizeFallbackInstituicao(item))
        .filter((item) => this.matchesInstituicaoListFilters(item, {
          termo,
          instituicao,
          responsavel,
          cnpj,
          numero,
          complemento,
          cidade,
          estado,
          statusAtivo,
          dataInicioDe,
          dataInicioAte,
          dataFimDe,
          dataFimAte,
        }));

      const instituicoesDb = await runWithPrismaFallback(
        () => prisma.instituicaoSocial.findMany({
          where,
          orderBy: { dataCriacao: 'desc' },
          include: {
            responsaveis: true,
            responsaveisTecnicos: true,
          },
        }),
        async () => [],
      );

      const instituicoesDbFiltradas = instituicoesDb.filter((item) => this.matchesInstituicaoListFilters(item, {
        termo,
        instituicao,
        responsavel,
        cnpj,
        numero,
        complemento,
        cidade,
        estado,
        statusAtivo,
        dataInicioDe,
        dataInicioAte,
        dataFimDe,
        dataFimAte,
      }));

      const idsOrigemFallback = new Set(
        fallbackInstituicoes
          .map((item) => Number(item?.instituicaoIdOrigem))
          .filter((value) => Number.isFinite(value) && value > 0),
      );

      const instituicoesDbSemDuplicidade = instituicoesDbFiltradas.filter(
        (item) => !idsOrigemFallback.has(Number(item?.id)),
      );

      const instituicoesCombinadas = this.sortInstituicoesPorDataCriacao([
        ...instituicoesDbSemDuplicidade,
        ...fallbackInstituicoes,
      ]);
      const total = instituicoesCombinadas.length;
      const instituicoes = instituicoesCombinadas.slice(skip, skip + Math.max(pageSize, 1));

      res.status(200).json(
        successResponse('Instituições listadas com sucesso', {
          instituicoes,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / Math.max(pageSize, 1)),
        }),
      );
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async criarResponsavelInstituicao(req: Request, res: Response): Promise<void> {
    try {
      const {
        instituicaoId,
        representante,
        cpf,
        rg,
        orgaoExpedidor,
        cargo,
        mandato,
        endereco,
        contato,
        contato2,
        contato3,
        email,
      } = req.body;

      if (!representante) {
        res.status(400).json(errorResponse('Representante é obrigatório'));
        return;
      }

      const registro = await prisma.responsavelInstituicao.create({
        data: {
          instituicaoId: instituicaoId ? Number(instituicaoId) : null,
          representante,
          cpf,
          rg,
          orgaoExpedidor,
          cargo,
          mandato,
          endereco,
          contato,
          contato2,
          contato3,
          email,
        },
      });

      res.status(201).json(successResponse('Responsável da instituição cadastrado com sucesso', registro));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async criarResponsavelTecnico(req: Request, res: Response): Promise<void> {
    try {
      const {
        instituicaoId,
        representante,
        cpf,
        rg,
        orgaoExpedidor,
        cargo,
        mandato,
        endereco,
        contato,
        contato2,
        contato3,
        email,
      } = req.body;

      if (!representante) {
        res.status(400).json(errorResponse('Representante técnico é obrigatório'));
        return;
      }

      const registro = await prisma.responsavelTecnico.create({
        data: {
          instituicaoId: instituicaoId ? Number(instituicaoId) : null,
          representante,
          cpf,
          rg,
          orgaoExpedidor,
          cargo,
          mandato,
          endereco,
          contato,
          contato2,
          contato3,
          email,
        },
      });

      res.status(201).json(successResponse('Responsável técnico cadastrado com sucesso', registro));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async listarParaRevisao(req: Request, res: Response): Promise<void> {
    try {
      const statusFiltro = String(req.query.status || '').trim();
      const termo = String(req.query.termo || '').trim();
      const instituicao = String(req.query.instituicao || '').trim();
      const responsavel = String(req.query.responsavel || '').trim();
      const cnpj = String(req.query.cnpj || '').trim();
      const cidade = String(req.query.cidade || '').trim();
      const estado = String(req.query.estado || '').trim();
      const dataCadastroDe = String(req.query.dataCadastroDe || '').trim();
      const dataCadastroAte = String(req.query.dataCadastroAte || '').trim();

      const where: any = {};

      if (statusFiltro) {
        where.statusRevisao = statusFiltro;
      }

      if (instituicao) {
        where.instituicao = { contains: instituicao, mode: 'insensitive' };
      }

      if (responsavel) {
        where.responsavel = { contains: responsavel, mode: 'insensitive' };
      }

      if (cnpj) {
        where.cnpj = { contains: cnpj, mode: 'insensitive' };
      }

      if (cidade) {
        where.cidade = { contains: cidade, mode: 'insensitive' };
      }

      if (estado) {
        where.estado = { contains: estado, mode: 'insensitive' };
      }

      if (termo) {
        where.OR = [
          { instituicao: { contains: termo, mode: 'insensitive' } },
          { responsavel: { contains: termo, mode: 'insensitive' } },
          { cnpj: { contains: termo, mode: 'insensitive' } },
          { cidade: { contains: termo, mode: 'insensitive' } },
          { estado: { contains: termo, mode: 'insensitive' } },
          { historicoFinalidadeOsc: { contains: termo, mode: 'insensitive' } },
          { principaisAcoesProponente: { contains: termo, mode: 'insensitive' } },
          { publicoAlvoProponente: { contains: termo, mode: 'insensitive' } },
          { regiaoAlcanceBairros: { contains: termo, mode: 'insensitive' } },
          { infraestruturaProponente: { contains: termo, mode: 'insensitive' } },
        ];
      }

      if (dataCadastroDe || dataCadastroAte) {
        where.dataCriacao = {};
        if (dataCadastroDe) {
          where.dataCriacao.gte = new Date(dataCadastroDe);
        }
        if (dataCadastroAte) {
          const dataFim = new Date(dataCadastroAte);
          dataFim.setHours(23, 59, 59, 999);
          where.dataCriacao.lte = dataFim;
        }
      }

      const fallbackInstituicoes = (await this.readInstituicoesFallback())
        .map((item) => this.normalizeFallbackInstituicao(item))
        .filter((item) => this.matchesInstituicaoReviewFilters(item, {
          statusFiltro,
          termo,
          instituicao,
          responsavel,
          cnpj,
          cidade,
          estado,
          dataCadastroDe,
          dataCadastroAte,
        }));

      const instituicoesDb = await runWithPrismaFallback(
        () => prisma.instituicaoSocial.findMany({
          where,
          orderBy: { dataCriacao: 'desc' },
          include: {
            responsaveis: { take: 1 },
            responsaveisTecnicos: { take: 1 },
          },
        }),
        async () => [],
      );

      const idsOrigemFallback = new Set(
        fallbackInstituicoes
          .map((item) => Number(item?.instituicaoIdOrigem))
          .filter((value) => Number.isFinite(value) && value > 0),
      );

      const instituicoesDbSemDuplicidade = instituicoesDb.filter(
        (item) => !idsOrigemFallback.has(Number(item?.id)),
      );

      const instituicoes = this.sortInstituicoesPorDataCriacao([
        ...instituicoesDbSemDuplicidade,
        ...fallbackInstituicoes,
      ]);

      res.status(200).json(successResponse('Cadastros listados com sucesso', { instituicoes }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async revisarInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, observacoes } = req.body;
      const revisorEmail = req.user?.email || 'sistema';
      const revisorNome = req.user?.nome || 'Sistema';

      const statusValidos = ['APROVADO', 'REJEITADO', 'AJUSTES_SOLICITADOS'];
      if (!statusValidos.includes(status)) {
        res.status(400).json(errorResponse('Status de revisão inválido'));
        return;
      }

      const fallbackItens = await this.readInstituicoesFallback();
      const fallbackIndexByRequestId = this.findFallbackItemIndexByRequestId(fallbackItens, id);
      const fallbackIndexBySourceId = id > 0 ? this.findFallbackItemIndexBySourceId(fallbackItens, id) : -1;
      const fallbackIndex = fallbackIndexByRequestId >= 0 ? fallbackIndexByRequestId : fallbackIndexBySourceId;

      const mensagens: Record<string, string> = {
        APROVADO: 'Instituição aprovada com sucesso',
        REJEITADO: 'Instituição rejeitada',
        AJUSTES_SOLICITADOS: 'Ajustes solicitados à instituição',
      };

      if (fallbackIndex >= 0) {
        const liberadoAdminAtual = Boolean(fallbackItens[fallbackIndex]?.liberadoAdmin);
        fallbackItens[fallbackIndex] = {
          ...fallbackItens[fallbackIndex],
          statusRevisao: status,
          liberadoAdmin: this.resolveLiberadoAdmin(status, liberadoAdminAtual),
          observacoesRevisao: observacoes || null,
          revisorEmail,
          revisorNome,
          dataRevisao: new Date().toISOString(),
          motivoRejeicao: status === 'REJEITADO' ? observacoes || null : null,
          dataAtualizacao: new Date().toISOString(),
        };

        await this.writeInstituicoesFallback(fallbackItens);

        const instituicaoFallback = this.normalizeFallbackInstituicao(fallbackItens[fallbackIndex]);
        const responsavelFallback = instituicaoFallback.responsaveis?.[0] as any;
        const linkAjustesFallback = status === 'AJUSTES_SOLICITADOS'
          ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/cadastros?token=${gerarTokenParaInstituicao(
              Number(instituicaoFallback.id),
              revisorEmail || revisorNome || 'sistema',
            ).token}`
          : undefined;
        if (responsavelFallback?.email) {
          try {
            await emailService.enviarNotificacaoStatusInstituicao(
              responsavelFallback.email,
              responsavelFallback.representante,
              instituicaoFallback.instituicao,
              status as 'APROVADO' | 'REJEITADO' | 'AJUSTES_SOLICITADOS' | 'PENDENTE',
              observacoes,
              linkAjustesFallback,
            );
          } catch (emailError) {
            logger.error(`Erro ao enviar email de revisão: ${emailError}`);
          }
        }

        res.status(200).json(successResponse(mensagens[status], instituicaoFallback));
        return;
      }

      // Buscar a instituição para obter dados do responsável
      const instAtual = await runWithPrismaFallback(
        () => prisma.instituicaoSocial.findUnique({
          where: { id },
          include: { responsaveis: { take: 1 } },
        }),
        async () => null,
      );

      if (!instAtual) {
        res.status(404).json(errorResponse('Instituição não encontrada'));
        return;
      }

      const instituicao = await prisma.instituicaoSocial.update({
        where: { id },
        data: {
          statusRevisao: status,
          liberadoAdmin: this.resolveLiberadoAdmin(status, Boolean(instAtual.liberadoAdmin)),
          observacoesRevisao: observacoes || null,
          revisorEmail,
          revisorNome,
          dataRevisao: new Date(),
          motivoRejeicao: status === 'REJEITADO' ? observacoes || null : null,
        },
      });

      // Enviar email para responsável da instituição
      const responsavel = instAtual.responsaveis?.[0] as any;
      const linkAjustes = status === 'AJUSTES_SOLICITADOS'
        ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/cadastros?token=${gerarTokenParaInstituicao(
            instituicao.id,
            revisorEmail || revisorNome || 'sistema',
          ).token}`
        : undefined;
      if (responsavel?.email) {
        try {
          await emailService.enviarNotificacaoStatusInstituicao(
            responsavel.email,
            responsavel.representante,
            instAtual.instituicao,
            status as 'APROVADO' | 'REJEITADO' | 'AJUSTES_SOLICITADOS' | 'PENDENTE',
            observacoes,
            linkAjustes,
          );
        } catch (emailError) {
          logger.error(`Erro ao enviar email de revisão: ${emailError}`);
        }
      }

      res.status(200).json(successResponse(mensagens[status], instituicao));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async reabrirRevisaoInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      const fallbackItens = await this.readInstituicoesFallback();
      const fallbackIndex = this.findFallbackItemIndexByRequestId(fallbackItens, id);

      if (fallbackIndex >= 0) {
        fallbackItens[fallbackIndex] = {
          ...fallbackItens[fallbackIndex],
          statusRevisao: 'PENDENTE',
          observacoesRevisao: null,
          revisorEmail: null,
          revisorNome: null,
          dataRevisao: null,
          motivoRejeicao: null,
          dataAtualizacao: new Date().toISOString(),
        };

        await this.writeInstituicoesFallback(fallbackItens);

        res.status(200).json(
          successResponse('Processo de revisão reabertu com sucesso', this.normalizeFallbackInstituicao(fallbackItens[fallbackIndex])),
        );
        return;
      }

      const instituicao = await prisma.instituicaoSocial.update({
        where: { id },
        data: {
          statusRevisao: 'PENDENTE',
          observacoesRevisao: null,
          revisorEmail: null,
          revisorNome: null,
          dataRevisao: null,
          motivoRejeicao: null,
        },
      });

      res.status(200).json(successResponse('Processo de revisão reabertu com sucesso', instituicao));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async atualizarInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const {
        instituicao,
        responsavel,
        cnpj,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        prazoPagamento,
        descricao,
        valorMonetarioPrevisto,
        historicoFinalidadeOsc,
        principaisAcoesProponente,
        publicoAlvoProponente,
        regiaoAlcanceBairros,
        infraestruturaProponente,
        termoAnexo,
        responsavelInstituicao,
        responsavelTecnico,
      } = req.body;

      const dadosAtualizacao: any = {};

      if (instituicao !== undefined) dadosAtualizacao.instituicao = instituicao;
      if (responsavel !== undefined) dadosAtualizacao.responsavel = responsavel;
      if (cnpj !== undefined) dadosAtualizacao.cnpj = cnpj;
      if (cep !== undefined) dadosAtualizacao.cep = cep;
      if (logradouro !== undefined) dadosAtualizacao.logradouro = logradouro;
      if (numero !== undefined) dadosAtualizacao.numero = numero;
      if (complemento !== undefined) dadosAtualizacao.complemento = complemento;
      if (bairro !== undefined) dadosAtualizacao.bairro = bairro;
      if (cidade !== undefined) dadosAtualizacao.cidade = cidade;
      if (estado !== undefined) dadosAtualizacao.estado = estado;
      if (prazoPagamento !== undefined) dadosAtualizacao.prazoPagamento = prazoPagamento;
      if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
      if (historicoFinalidadeOsc !== undefined) dadosAtualizacao.historicoFinalidadeOsc = historicoFinalidadeOsc;
      if (principaisAcoesProponente !== undefined) dadosAtualizacao.principaisAcoesProponente = principaisAcoesProponente;
      if (publicoAlvoProponente !== undefined) dadosAtualizacao.publicoAlvoProponente = publicoAlvoProponente;
      if (regiaoAlcanceBairros !== undefined) dadosAtualizacao.regiaoAlcanceBairros = regiaoAlcanceBairros;
      if (infraestruturaProponente !== undefined) dadosAtualizacao.infraestruturaProponente = infraestruturaProponente;
      if (termoAnexo !== undefined) dadosAtualizacao.termoAnexo = termoAnexo;
      if (valorMonetarioPrevisto !== undefined) {
        if (valorMonetarioPrevisto === null || valorMonetarioPrevisto === '') {
          dadosAtualizacao.valorMonetarioPrevisto = null;
        } else {
          const valorNumerico = typeof valorMonetarioPrevisto === 'number'
            ? valorMonetarioPrevisto
            : parseFloat(String(valorMonetarioPrevisto));
          dadosAtualizacao.valorMonetarioPrevisto = Number.isNaN(valorNumerico) ? null : valorNumerico;
        }
      }

      const dadosResponsavelInstituicao = this.prepararDadosResponsavelParaAtualizacao(responsavelInstituicao);
      const dadosResponsavelTecnico = this.prepararDadosResponsavelParaAtualizacao(responsavelTecnico);

      if (dadosResponsavelInstituicao?.representante !== undefined && dadosAtualizacao.responsavel === undefined) {
        dadosAtualizacao.responsavel = dadosResponsavelInstituicao.representante;
      }

      const fallbackItens = await this.readInstituicoesFallback();
      const fallbackIndex = this.findFallbackItemIndexByRequestId(fallbackItens, id);

      if (fallbackIndex >= 0) {
        const itemAtual = fallbackItens[fallbackIndex];
        const idInterno = Number(itemAtual?.id) || null;
        const responsavelInstituicaoAtual = itemAtual?.responsavelInstituicao ?? itemAtual?.responsaveis?.[0] ?? {
          id: idInterno,
          instituicaoId: idInterno,
        };
        const responsavelTecnicoAtual = itemAtual?.responsavelTecnico ?? itemAtual?.responsaveisTecnicos?.[0] ?? {
          id: idInterno,
          instituicaoId: idInterno,
        };

        const dadosAtualizacaoFallback = {
          ...dadosAtualizacao,
          dataAtualizacao: new Date().toISOString(),
          ...(dadosResponsavelInstituicao
            ? {
                responsavelInstituicao: {
                  ...responsavelInstituicaoAtual,
                  ...dadosResponsavelInstituicao,
                },
              }
            : {}),
          ...(dadosResponsavelTecnico
            ? {
                responsavelTecnico: {
                  ...responsavelTecnicoAtual,
                  ...dadosResponsavelTecnico,
                },
              }
            : {}),
          ...(dadosAtualizacao.responsavel === undefined && dadosResponsavelInstituicao?.representante !== undefined
            ? { responsavel: dadosResponsavelInstituicao.representante }
            : {}),
        };

        fallbackItens[fallbackIndex] = {
          ...itemAtual,
          ...dadosAtualizacaoFallback,
        };

        await this.writeInstituicoesFallback(fallbackItens);

        res.status(200).json(
          successResponse('Instituição atualizada com sucesso', this.normalizeFallbackInstituicao(fallbackItens[fallbackIndex])),
        );
        return;
      }

      const instituicaoExistente = await prisma.instituicaoSocial.findUnique({
        where: { id },
        include: {
          responsaveis: { take: 1 },
          responsaveisTecnicos: { take: 1 },
        },
      });

      if (!instituicaoExistente) {
        res.status(404).json(errorResponse('Instituição não encontrada'));
        return;
      }

      const instituicaoAtualizada = await prisma.$transaction(async (tx) => {
        if (Object.keys(dadosAtualizacao).length > 0) {
          await tx.instituicaoSocial.update({
            where: { id },
            data: dadosAtualizacao,
          });
        }

        if (dadosResponsavelInstituicao) {
          const responsavelInstituicaoExistente = instituicaoExistente.responsaveis?.[0];

          if (responsavelInstituicaoExistente) {
            await tx.responsavelInstituicao.update({
              where: { id: responsavelInstituicaoExistente.id },
              data: dadosResponsavelInstituicao,
            });
          } else {
            const representanteResponsavelInstituicao = dadosResponsavelInstituicao.representante;
            if (hasValue(representanteResponsavelInstituicao)) {
              await tx.responsavelInstituicao.create({
                data: {
                  instituicaoId: id,
                  ...dadosResponsavelInstituicao,
                  representante: String(representanteResponsavelInstituicao),
                },
              });
            }
          }
        }

        if (dadosResponsavelTecnico) {
          const responsavelTecnicoExistente = instituicaoExistente.responsaveisTecnicos?.[0];

          if (responsavelTecnicoExistente) {
            await tx.responsavelTecnico.update({
              where: { id: responsavelTecnicoExistente.id },
              data: dadosResponsavelTecnico,
            });
          } else {
            const representanteResponsavelTecnico = dadosResponsavelTecnico.representante;
            if (hasValue(representanteResponsavelTecnico)) {
              await tx.responsavelTecnico.create({
                data: {
                  instituicaoId: id,
                  ...dadosResponsavelTecnico,
                  representante: String(representanteResponsavelTecnico),
                },
              });
            }
          }
        }

        const instituicaoComRelacionamentos = await tx.instituicaoSocial.findUnique({
          where: { id },
          include: {
            responsaveis: { take: 1 },
            responsaveisTecnicos: { take: 1 },
          },
        });

        if (!instituicaoComRelacionamentos) {
          throw new Error('Instituição não encontrada após atualização');
        }

        return instituicaoComRelacionamentos;
      });

      res.status(200).json(successResponse('Instituição atualizada com sucesso', instituicaoAtualizada));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async excluirInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      const fallbackItens = await this.readInstituicoesFallback();
      const fallbackIndex = this.findFallbackItemIndexByRequestId(fallbackItens, id);

      if (fallbackIndex >= 0) {
        fallbackItens.splice(fallbackIndex, 1);
        await this.writeInstituicoesFallback(fallbackItens);

        res.status(200).json(successResponse('Instituição excluída com sucesso'));
        return;
      }

      const instituicao = await prisma.instituicaoSocial.findUnique({ where: { id } });
      if (!instituicao) {
        res.status(404).json(errorResponse('Instituição não encontrada'));
        return;
      }

      await prisma.instituicaoSocial.delete({ where: { id } });

      res.status(200).json(successResponse('Instituição excluída com sucesso'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async gerarLinkRevisao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      const fallbackItens = await this.readInstituicoesFallback();
      const fallbackIndex = this.findFallbackItemIndexByRequestId(fallbackItens, id);
      const instituicaoFallback = fallbackIndex >= 0
        ? this.normalizeFallbackInstituicao(fallbackItens[fallbackIndex])
        : null;

      const instituicaoDb = id > 0
        ? await runWithPrismaFallback(
            () => prisma.instituicaoSocial.findUnique({ where: { id } }),
            async () => null,
          )
        : null;

      const instituicao = instituicaoFallback ?? instituicaoDb;
      if (!instituicao) {
        res.status(404).json(errorResponse('Instituição não encontrada'));
        return;
      }

      // Gerar token associado à instituição e registrar no store
      const tokenPayload = gerarTokenParaInstituicao(
        instituicaoFallback ? instituicaoFallback.id : id,
        req.user?.email ?? 'sistema',
        req.body ?? {},
      );
      const { token, expiry, validadeValor, validadeUnidade, validadeEmMinutos } = tokenPayload;
      
      const urlRevisao = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/cadastros?token=${token}`;
      
      res.status(200).json(successResponse('Link de revisão gerado com sucesso', {
        url: urlRevisao,
        token,
        expiry,
        expiresAt: expiry.toISOString(),
        validadeHoras: Number((validadeEmMinutos / 60).toFixed(2)),
        validadeValor,
        validadeUnidade,
        validadeEmMinutos,
        validoAte: expiry.toLocaleString('pt-BR'),
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async listarContratosInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instituicaoId = parseInt(req.params.id, 10);
      if (!Number.isFinite(instituicaoId)) {
        res.status(400).json(errorResponse('Instituição inválida'));
        return;
      }

      const contratos = await this.getContratosRelacionadosInstituicao(instituicaoId);
      const obraIds = Array.from(new Set(contratos.flatMap((item) => Array.isArray(item?.obraIds) ? item.obraIds : [])));

      const obras = obraIds.length > 0
        ? await runWithPrismaFallback(
            () => prisma.obra.findMany({
              where: { id: { in: obraIds } },
              select: { id: true, codigoObra: true, nomeObra: true },
            }),
            async () => [],
          )
        : [];

      const obrasMap = new Map(obras.map((obra) => [obra.id, obra]));
      const contratosNormalizados = contratos.map((contrato) => {
        const obrasAtendidas = (contrato.obraIds ?? [])
          .map((obraId: number) => obrasMap.get(obraId))
          .filter(Boolean)
          .map((obra: any) => ({
            id: obra.id,
            nome: obra.nomeObra,
            codigo: obra.codigoObra,
          }));

        return {
          ...contrato,
          statusAtividade: this.getStatusAtividadeContrato(contrato),
          obrasAtendidas,
        };
      });

      res.status(200).json(successResponse('Contratos listados com sucesso', { contratos: contratosNormalizados }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  async criarContratoInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instituicaoId = parseInt(req.params.id, 10);
      if (!Number.isFinite(instituicaoId)) {
        res.status(400).json(errorResponse('Instituição inválida'));
        return;
      }

      const arquivoContrato = (req as any).file as Express.Multer.File | undefined;
      const bodyComPayload =
        typeof (req.body as any)?.payload === 'string'
          ? JSON.parse((req.body as any).payload)
          : req.body;

      const numeroContrato = String(bodyComPayload?.numeroContrato || '').trim();
      const descricao = String(bodyComPayload?.descricao || '').trim();
      const dataInicio = String(bodyComPayload?.dataInicio || '').trim();
      const dataFim = String(bodyComPayload?.dataFim || '').trim();
      const publicoAlvoId = bodyComPayload?.publicoAlvoId
        ? Number(bodyComPayload.publicoAlvoId)
        : null;
      const projetoId = bodyComPayload?.projetoId
        ? Number(bodyComPayload.projetoId)
        : null;

      const obraIdsBruto = Array.isArray(bodyComPayload?.obraIds)
        ? bodyComPayload.obraIds
        : typeof bodyComPayload?.obraIds === 'string'
          ? JSON.parse(bodyComPayload.obraIds || '[]')
          : [];

      const obraIds = Array.from(new Set(
        (obraIdsBruto as unknown[])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0),
      ));

      const termoAnexo = arquivoContrato
        ? `/uploads/instituicoes-contratos/${arquivoContrato.filename}`
        : String(bodyComPayload?.termoAnexo || '').trim();

      if (!numeroContrato || !descricao || !dataInicio || !dataFim || !termoAnexo || obraIds.length === 0) {
        res.status(400).json(errorResponse('Número do contrato, descrição, datas, obras e anexo são obrigatórios'));
        return;
      }

      const dataInicioDate = this.parseDate(dataInicio);
      const dataFimDate = this.parseDate(dataFim);
      if (!dataInicioDate || !dataFimDate) {
        res.status(400).json(errorResponse('Datas do contrato inválidas'));
        return;
      }

      if (dataInicioDate.getTime() > dataFimDate.getTime()) {
        res.status(400).json(errorResponse('Data início não pode ser maior que data fim'));
        return;
      }

      const fallbackItens = await this.readInstituicoesFallback();
      const fallbackIndexByRequestId = this.findFallbackItemIndexByRequestId(fallbackItens, instituicaoId);
      const fallbackIndexBySourceId = instituicaoId > 0 ? this.findFallbackItemIndexBySourceId(fallbackItens, instituicaoId) : -1;
      const fallbackIndex = fallbackIndexByRequestId >= 0 ? fallbackIndexByRequestId : fallbackIndexBySourceId;
      const fallbackItem = fallbackIndex >= 0 ? fallbackItens[fallbackIndex] : null;

      const instituicaoIdOrigem = fallbackItem
        ? (Number(fallbackItem?.instituicaoIdOrigem) > 0 ? Number(fallbackItem?.instituicaoIdOrigem) : null)
        : (instituicaoId > 0 ? instituicaoId : null);

      if (!fallbackItem && instituicaoId > 0) {
        const instituicaoDb = await runWithPrismaFallback(
          () => prisma.instituicaoSocial.findUnique({ where: { id: instituicaoId }, select: { id: true } }),
          async () => null,
        );

        if (!instituicaoDb) {
          res.status(404).json(errorResponse('Instituição não encontrada'));
          return;
        }
      }

      const contratos = await this.readContratosFallback();
      const nextContratoId = contratos.length > 0
        ? Math.max(...contratos.map((item) => Number(item?.id) || 0)) + 1
        : 1;

      const novoContrato = {
        id: nextContratoId,
        instituicaoIdReferencia: instituicaoId,
        instituicaoIdOrigem,
        numeroContrato,
        descricao,
        dataInicio,
        dataFim,
        termoAnexo,
        obraIds,
        publicoAlvoId,
        projetoId,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
      };

      contratos.push(novoContrato);
      await this.writeContratosFallback(contratos);

      const contratosRelacionados = await this.getContratosRelacionadosInstituicao(instituicaoId);
      const periodoVigencia = this.resolvePeriodoVigenciaInstituicaoPorContratos(contratosRelacionados);

      if (instituicaoIdOrigem && periodoVigencia) {
        await runWithPrismaFallback(
          () => prisma.instituicaoSocial.update({
            where: { id: instituicaoIdOrigem },
            data: {
              dataInicio: periodoVigencia.dataInicio ? this.parseDate(periodoVigencia.dataInicio) : null,
              dataFim: periodoVigencia.dataFim ? this.parseDate(periodoVigencia.dataFim) : null,
            },
          }),
          async () => null,
        );
      }

      if (periodoVigencia) {
        const fallbackItensAtualizar = await this.readInstituicoesFallback();
        let alterouFallback = false;
        for (let i = 0; i < fallbackItensAtualizar.length; i += 1) {
          const item = fallbackItensAtualizar[i];
          const idPublico = this.getFallbackPublicId(item);
          const sourceId = Number(item?.instituicaoIdOrigem);
          const vinculaMesmoRegistro =
            idPublico === instituicaoId
            || (instituicaoId > 0 && sourceId === instituicaoId)
            || (instituicaoIdOrigem && sourceId === instituicaoIdOrigem);

          if (!vinculaMesmoRegistro) {
            continue;
          }

          fallbackItensAtualizar[i] = {
            ...item,
            dataInicio: periodoVigencia.dataInicio,
            dataFim: periodoVigencia.dataFim,
            dataAtualizacao: new Date().toISOString(),
          };
          alterouFallback = true;
        }

        if (alterouFallback) {
          await this.writeInstituicoesFallback(fallbackItensAtualizar);
        }
      }

      res.status(201).json(successResponse('Contrato cadastrado com sucesso', {
        ...novoContrato,
        statusAtividade: this.getStatusAtividadeContrato(novoContrato),
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async atualizarContratoInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instituicaoId = parseInt(req.params.id, 10);
      const contratoId = parseInt(req.params.contratoId, 10);
      if (!Number.isFinite(instituicaoId) || !Number.isFinite(contratoId)) {
        res.status(400).json(errorResponse('Instituição ou contrato inválido'));
        return;
      }

      const arquivoContrato = (req as any).file as Express.Multer.File | undefined;
      const bodyComPayload =
        typeof (req.body as any)?.payload === 'string'
          ? JSON.parse((req.body as any).payload)
          : req.body;

      const numeroContrato = String(bodyComPayload?.numeroContrato || '').trim();
      const descricao = String(bodyComPayload?.descricao || '').trim();
      const dataInicio = String(bodyComPayload?.dataInicio || '').trim();
      const dataFim = String(bodyComPayload?.dataFim || '').trim();
      const publicoAlvoId = bodyComPayload?.publicoAlvoId
        ? Number(bodyComPayload.publicoAlvoId)
        : null;
      const projetoId = bodyComPayload?.projetoId
        ? Number(bodyComPayload.projetoId)
        : null;

      const obraIdsBruto = Array.isArray(bodyComPayload?.obraIds)
        ? bodyComPayload.obraIds
        : typeof bodyComPayload?.obraIds === 'string'
          ? JSON.parse(bodyComPayload.obraIds || '[]')
          : [];

      const obraIds = Array.from(new Set(
        (obraIdsBruto as unknown[])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0),
      ));

      const contratos = await this.readContratosFallback();
      const contratoIndex = contratos.findIndex((item) => Number(item?.id) === contratoId);
      if (contratoIndex < 0) {
        res.status(404).json(errorResponse('Contrato não encontrado'));
        return;
      }

      const contratoAtual = contratos[contratoIndex];
      const contratoRelacionado = (await this.getContratosRelacionadosInstituicao(instituicaoId))
        .some((item) => Number(item?.id) === contratoId);

      if (!contratoRelacionado) {
        res.status(404).json(errorResponse('Contrato não pertence à instituição informada'));
        return;
      }

      const termoAnexo = arquivoContrato
        ? `/uploads/instituicoes-contratos/${arquivoContrato.filename}`
        : String(bodyComPayload?.termoAnexo || contratoAtual?.termoAnexo || '').trim();

      if (!numeroContrato || !descricao || !dataInicio || !dataFim || !termoAnexo || obraIds.length === 0) {
        res.status(400).json(errorResponse('Número do contrato, descrição, datas, obras e anexo são obrigatórios'));
        return;
      }

      const dataInicioDate = this.parseDate(dataInicio);
      const dataFimDate = this.parseDate(dataFim);
      if (!dataInicioDate || !dataFimDate) {
        res.status(400).json(errorResponse('Datas do contrato inválidas'));
        return;
      }

      if (dataInicioDate.getTime() > dataFimDate.getTime()) {
        res.status(400).json(errorResponse('Data início não pode ser maior que data fim'));
        return;
      }

      const contratoAtualizado = {
        ...contratoAtual,
        numeroContrato,
        descricao,
        dataInicio,
        dataFim,
        termoAnexo,
        obraIds,
        publicoAlvoId,
        projetoId,
        dataAtualizacao: new Date().toISOString(),
      };

      contratos[contratoIndex] = contratoAtualizado;
      await this.writeContratosFallback(contratos);

      const contratosRelacionados = await this.getContratosRelacionadosInstituicao(instituicaoId);
      const periodoVigencia = this.resolvePeriodoVigenciaInstituicaoPorContratos(contratosRelacionados);
      const instituicaoIdOrigem = Number(contratoAtualizado?.instituicaoIdOrigem) > 0
        ? Number(contratoAtualizado?.instituicaoIdOrigem)
        : (instituicaoId > 0 ? instituicaoId : null);

      if (instituicaoIdOrigem && periodoVigencia) {
        await runWithPrismaFallback(
          () => prisma.instituicaoSocial.update({
            where: { id: instituicaoIdOrigem },
            data: {
              dataInicio: periodoVigencia.dataInicio ? this.parseDate(periodoVigencia.dataInicio) : null,
              dataFim: periodoVigencia.dataFim ? this.parseDate(periodoVigencia.dataFim) : null,
            },
          }),
          async () => null,
        );
      }

      if (periodoVigencia) {
        const fallbackItensAtualizar = await this.readInstituicoesFallback();
        let alterouFallback = false;
        for (let i = 0; i < fallbackItensAtualizar.length; i += 1) {
          const item = fallbackItensAtualizar[i];
          const idPublico = this.getFallbackPublicId(item);
          const sourceId = Number(item?.instituicaoIdOrigem);
          const vinculaMesmoRegistro =
            idPublico === instituicaoId
            || (instituicaoId > 0 && sourceId === instituicaoId)
            || (instituicaoIdOrigem && sourceId === instituicaoIdOrigem);

          if (!vinculaMesmoRegistro) {
            continue;
          }

          fallbackItensAtualizar[i] = {
            ...item,
            dataInicio: periodoVigencia.dataInicio,
            dataFim: periodoVigencia.dataFim,
            dataAtualizacao: new Date().toISOString(),
          };
          alterouFallback = true;
        }

        if (alterouFallback) {
          await this.writeInstituicoesFallback(fallbackItensAtualizar);
        }
      }

      res.status(200).json(successResponse('Contrato atualizado com sucesso', {
        ...contratoAtualizado,
        statusAtividade: this.getStatusAtividadeContrato(contratoAtualizado),
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  async excluirContratoInstituicao(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instituicaoId = parseInt(req.params.id, 10);
      const contratoId = parseInt(req.params.contratoId, 10);
      if (!Number.isFinite(instituicaoId) || !Number.isFinite(contratoId)) {
        res.status(400).json(errorResponse('Instituição ou contrato inválido'));
        return;
      }

      const contratos = await this.readContratosFallback();
      const contratoIndex = contratos.findIndex((item) => Number(item?.id) === contratoId);
      if (contratoIndex < 0) {
        res.status(404).json(errorResponse('Contrato não encontrado'));
        return;
      }

      const contratoAtual = contratos[contratoIndex];
      const contratoRelacionado = (await this.getContratosRelacionadosInstituicao(instituicaoId))
        .some((item) => Number(item?.id) === contratoId);

      if (!contratoRelacionado) {
        res.status(404).json(errorResponse('Contrato não pertence à instituição informada'));
        return;
      }

      const contratoExcluido = contratos.splice(contratoIndex, 1)[0];
      await this.writeContratosFallback(contratos);

      const contratosRelacionados = await this.getContratosRelacionadosInstituicao(instituicaoId);
      const periodoVigencia = this.resolvePeriodoVigenciaInstituicaoPorContratos(contratosRelacionados);
      const instituicaoIdOrigem = Number(contratoAtual?.instituicaoIdOrigem) > 0
        ? Number(contratoAtual?.instituicaoIdOrigem)
        : (instituicaoId > 0 ? instituicaoId : null);

      if (instituicaoIdOrigem) {
        await runWithPrismaFallback(
          () => prisma.instituicaoSocial.update({
            where: { id: instituicaoIdOrigem },
            data: {
              dataInicio: periodoVigencia?.dataInicio ? this.parseDate(periodoVigencia.dataInicio) : null,
              dataFim: periodoVigencia?.dataFim ? this.parseDate(periodoVigencia.dataFim) : null,
            },
          }),
          async () => null,
        );
      }

      const fallbackItensAtualizar = await this.readInstituicoesFallback();
      let alterouFallback = false;
      for (let i = 0; i < fallbackItensAtualizar.length; i += 1) {
        const item = fallbackItensAtualizar[i];
        const idPublico = this.getFallbackPublicId(item);
        const sourceId = Number(item?.instituicaoIdOrigem);
        const vinculaMesmoRegistro =
          idPublico === instituicaoId
          || (instituicaoId > 0 && sourceId === instituicaoId)
          || (instituicaoIdOrigem && sourceId === instituicaoIdOrigem);

        if (!vinculaMesmoRegistro) {
          continue;
        }

        fallbackItensAtualizar[i] = {
          ...item,
          dataInicio: periodoVigencia?.dataInicio ?? null,
          dataFim: periodoVigencia?.dataFim ?? null,
          dataAtualizacao: new Date().toISOString(),
        };
        alterouFallback = true;
      }

      if (alterouFallback) {
        await this.writeInstituicoesFallback(fallbackItensAtualizar);
      }

      res.status(200).json(successResponse('Contrato excluído com sucesso', {
        id: contratoExcluido?.id,
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  private fallbackFilePath = path.resolve(process.cwd(), 'data', 'instituicoes-cadastros-fallback.json');
  private contratosFallbackFilePath = path.resolve(process.cwd(), 'data', 'instituicoes-contratos-fallback.json');

  private async criarInstituicaoCompletaFallback(payload: any): Promise<any> {
    const itens = await this.readInstituicoesFallback();
    const instituicaoIdRevisao = Number(payload.instituicaoIdRevisao);
    const fallbackIndex = Number.isFinite(instituicaoIdRevisao)
      ? (instituicaoIdRevisao < 0
          ? this.findFallbackItemIndexByRequestId(itens, instituicaoIdRevisao)
          : this.findFallbackItemIndexBySourceId(itens, instituicaoIdRevisao))
      : -1;
    const registroAtual = fallbackIndex >= 0 ? itens[fallbackIndex] : null;
    const nextId = this.getNextFallbackInternalId(itens);
    const agoraIso = new Date().toISOString();
    const idInterno = registroAtual ? Number(registroAtual.id) : nextId;
    const fallbackPublicId = registroAtual
      ? this.getFallbackPublicId(registroAtual)
      : this.getNextFallbackPublicId(itens);

    const base = {
      id: idInterno,
      fallbackPublicId,
      instituicaoIdOrigem: Number.isFinite(instituicaoIdRevisao) && instituicaoIdRevisao > 0
        ? instituicaoIdRevisao
        : registroAtual?.instituicaoIdOrigem ?? null,
      liberadoAdmin: registroAtual?.liberadoAdmin ?? false,
      instituicao: payload.instituicao,
      responsavel: payload.responsavelInstituicao?.representante || payload.responsavel || null,
      cep: payload.cep,
      logradouro: payload.logradouro,
      numero: payload.numero,
      complemento: payload.complemento || null,
      bairro: payload.bairro,
      cidade: payload.cidade,
      estado: payload.estado,
      cnpj: payload.cnpj,
      prazoPagamento: payload.prazoPagamento ? String(payload.prazoPagamento) : null,
      dataInicio: registroAtual?.dataInicio ?? null,
      dataFim: registroAtual?.dataFim ?? null,
      descricao: payload.descricao,
      historicoFinalidadeOsc: payload.historicoFinalidadeOsc,
      principaisAcoesProponente: payload.principaisAcoesProponente,
      publicoAlvoProponente: payload.publicoAlvoProponente,
      regiaoAlcanceBairros: payload.regiaoAlcanceBairros,
      infraestruturaProponente: payload.infraestruturaProponente,
      termoAnexo: payload.termoAnexo,
      statusRevisao: 'PENDENTE',
      observacoesRevisao: Number.isFinite(instituicaoIdRevisao) ? '[AJUSTE] Ajustes enviados pela instituição' : null,
      dataCriacao: registroAtual?.dataCriacao || agoraIso,
      dataAtualizacao: agoraIso,
      fallback: true,
    };

    const responsavelInstituicao = {
      id: registroAtual?.responsavelInstituicao?.id ?? idInterno,
      instituicaoId: idInterno,
      ...payload.responsavelInstituicao,
    };

    const responsavelTecnico = {
      id: registroAtual?.responsavelTecnico?.id ?? idInterno,
      instituicaoId: idInterno,
      ...payload.responsavelTecnico,
    };

    if (fallbackIndex >= 0) {
      itens[fallbackIndex] = {
        ...itens[fallbackIndex],
        ...base,
        responsavelInstituicao,
        responsavelTecnico,
      };
    } else {
      itens.push({
        ...base,
        responsavelInstituicao,
        responsavelTecnico,
      });
    }

    await this.writeInstituicoesFallback(itens);

    return {
      instituicao: this.normalizeFallbackInstituicao({
        ...base,
        responsavelInstituicao,
        responsavelTecnico,
      }),
      responsavelInstituicao,
      responsavelTecnico,
      tipoSubmissao: Number.isFinite(instituicaoIdRevisao) ? 'AJUSTE' : 'NOVO_CADASTRO',
    };
  }

  private getFallbackPublicId(item: any): number {
    const fallbackPublicId = Number(item?.fallbackPublicId);
    if (Number.isFinite(fallbackPublicId) && fallbackPublicId < 0) {
      return fallbackPublicId;
    }

    const id = Number(item?.id);
    if (Number.isFinite(id) && id < 0) {
      return id;
    }

    const safeId = Number.isFinite(id) && id !== 0 ? Math.abs(id) : Date.now();
    return -1000000 - safeId;
  }

  private getNextFallbackInternalId(itens: any[]): number {
    const ids = itens
      .map((item) => Number(item?.id))
      .filter((value) => Number.isFinite(value) && value > 0);

    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  private getNextFallbackPublicId(itens: any[]): number {
    const ids = itens
      .map((item) => this.getFallbackPublicId(item))
      .filter((value) => Number.isFinite(value) && value < 0);

    return ids.length > 0 ? Math.min(...ids) - 1 : -1000001;
  }

  private findFallbackItemIndexByRequestId(itens: any[], requestId: number): number {
    return itens.findIndex((item) => this.getFallbackPublicId(item) === requestId);
  }

  private findFallbackItemIndexBySourceId(itens: any[], sourceId: number): number {
    return itens.findIndex((item) => Number(item?.instituicaoIdOrigem) === sourceId);
  }

  private normalizeFallbackInstituicao(item: any): any {
    const responsavelInstituicao = item?.responsavelInstituicao ?? item?.responsaveis?.[0] ?? null;
    const responsavelTecnico = item?.responsavelTecnico ?? item?.responsaveisTecnicos?.[0] ?? null;
    const fallbackPublicId = this.getFallbackPublicId(item);

    return {
      ...item,
      id: fallbackPublicId,
      fallback: true,
      fallbackPublicId,
      liberadoAdmin: Boolean(item?.liberadoAdmin),
      responsavel: item?.responsavel ?? responsavelInstituicao?.representante ?? null,
      responsaveis: responsavelInstituicao ? [responsavelInstituicao] : [],
      responsaveisTecnicos: responsavelTecnico ? [responsavelTecnico] : [],
    };
  }

  private prepararDadosResponsavelParaAtualizacao(payload: any): Record<string, string | null> | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const campos = [
      'representante',
      'cpf',
      'rg',
      'orgaoExpedidor',
      'cargo',
      'mandato',
      'endereco',
      'contato',
      'contato2',
      'contato3',
      'email',
    ];

    const dados: Record<string, string | null> = {};

    for (const campo of campos) {
      if (!(campo in payload)) {
        continue;
      }

      const valor = payload[campo];
      if (valor === undefined) {
        continue;
      }

      if (campo === 'representante') {
        if (valor === null) {
          continue;
        }

        dados[campo] = String(valor).trim();
        continue;
      }

      if (valor === null) {
        dados[campo] = null;
        continue;
      }

      const valorNormalizado = String(valor).trim();
      dados[campo] = valorNormalizado.length > 0 ? valorNormalizado : null;
    }

    return Object.keys(dados).length > 0 ? dados : null;
  }

  private includesIgnoreCase(value: unknown, query: string): boolean {
    if (!query) {
      return true;
    }

    return String(value ?? '').toLowerCase().includes(query.toLowerCase());
  }

  private matchesAnyField(query: string, values: unknown[]): boolean {
    if (!query) {
      return true;
    }

    return values.some((value) => this.includesIgnoreCase(value, query));
  }

  private parseDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const valorTexto = String(value).trim();

    const dataIsoSemHorario = valorTexto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dataIsoSemHorario) {
      const [, ano, mes, dia] = dataIsoSemHorario;
      const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const dataBr = valorTexto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dataBr) {
      const [, dia, mes, ano] = dataBr;
      const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(valorTexto);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDateToLocalISO(date: Date): string {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private isDateWithinRange(value: unknown, start?: string, end?: string, useEndOfDay = false): boolean {
    const date = this.parseDate(value);
    if (!date) {
      return !start && !end;
    }

    if (start) {
      const startDate = new Date(start);
      if (!Number.isNaN(startDate.getTime()) && date < startDate) {
        return false;
      }
    }

    if (end) {
      const endDate = new Date(end);
      if (!Number.isNaN(endDate.getTime())) {
        if (useEndOfDay) {
          endDate.setHours(23, 59, 59, 999);
        }

        if (date > endDate) {
          return false;
        }
      }
    }

    return true;
  }

  private matchesInstituicaoListFilters(item: any, filtros: Record<string, string>): boolean {
    const responsavel = item?.responsavel ?? item?.responsaveis?.[0]?.representante ?? '';

    if (!this.includesIgnoreCase(item?.instituicao, filtros.instituicao)) return false;
    if (!this.includesIgnoreCase(responsavel, filtros.responsavel)) return false;
    if (!this.includesIgnoreCase(item?.cnpj, filtros.cnpj)) return false;
    if (!this.includesIgnoreCase(item?.numero, filtros.numero)) return false;
    if (!this.includesIgnoreCase(item?.complemento, filtros.complemento)) return false;
    if (!this.includesIgnoreCase(item?.cidade, filtros.cidade)) return false;
    if (!this.includesIgnoreCase(item?.estado, filtros.estado)) return false;

    const ativo = this.isInstituicaoAtiva(item);
    if (filtros.statusAtivo === 'ATIVO' && !ativo) return false;
    if (filtros.statusAtivo === 'INATIVO' && ativo) return false;

    if (!this.isDateWithinRange(item?.dataInicio, filtros.dataInicioDe, filtros.dataInicioAte)) return false;
    if (!this.isDateWithinRange(item?.dataFim, filtros.dataFimDe, filtros.dataFimAte)) return false;

    return this.matchesAnyField(filtros.termo, [
      item?.instituicao,
      item?.numero,
      item?.complemento,
      item?.estado,
      item?.cidade,
      item?.cnpj,
      responsavel,
      item?.historicoFinalidadeOsc,
      item?.principaisAcoesProponente,
      item?.publicoAlvoProponente,
      item?.regiaoAlcanceBairros,
      item?.infraestruturaProponente,
    ]);
  }

  private matchesInstituicaoReviewFilters(item: any, filtros: Record<string, string>): boolean {
    const responsavel = item?.responsavel ?? item?.responsaveis?.[0]?.representante ?? '';

    if (filtros.statusFiltro && item?.statusRevisao !== filtros.statusFiltro) return false;
    if (!this.includesIgnoreCase(item?.instituicao, filtros.instituicao)) return false;
    if (!this.includesIgnoreCase(responsavel, filtros.responsavel)) return false;
    if (!this.includesIgnoreCase(item?.cnpj, filtros.cnpj)) return false;
    if (!this.includesIgnoreCase(item?.cidade, filtros.cidade)) return false;
    if (!this.includesIgnoreCase(item?.estado, filtros.estado)) return false;
    if (!this.isDateWithinRange(item?.dataCriacao, filtros.dataCadastroDe, filtros.dataCadastroAte, true)) return false;

    return this.matchesAnyField(filtros.termo, [
      item?.instituicao,
      responsavel,
      item?.cnpj,
      item?.cidade,
      item?.estado,
      item?.historicoFinalidadeOsc,
      item?.principaisAcoesProponente,
      item?.publicoAlvoProponente,
      item?.regiaoAlcanceBairros,
      item?.infraestruturaProponente,
    ]);
  }

  private sortInstituicoesPorDataCriacao<T extends { dataCriacao?: unknown }>(itens: T[]): T[] {
    return [...itens].sort((a, b) => {
      const dataA = this.parseDate(a.dataCriacao)?.getTime() ?? 0;
      const dataB = this.parseDate(b.dataCriacao)?.getTime() ?? 0;
      return dataB - dataA;
    });
  }

  private isInstituicaoAtiva(item: any): boolean {
    const dataFim = this.parseDate(item?.dataFim);
    if (!dataFim) {
      return true;
    }

    dataFim.setHours(23, 59, 59, 999);
    return dataFim.getTime() >= Date.now();
  }

  private getStatusAtividadeContrato(contrato: any): 'ATIVO' | 'INATIVO' {
    const dataInicio = this.parseDate(contrato?.dataInicio);
    const dataFim = this.parseDate(contrato?.dataFim);
    if (!dataInicio || !dataFim) {
      return 'INATIVO';
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    return inicio.getTime() <= hoje.getTime() && fim.getTime() >= hoje.getTime() ? 'ATIVO' : 'INATIVO';
  }

  private resolvePeriodoVigenciaInstituicaoPorContratos(contratos: any[]): { dataInicio: string; dataFim: string } | null {
    if (!contratos.length) {
      return null;
    }

    const contratosComDatas = contratos
      .map((item) => ({
        ...item,
        _dataInicio: this.parseDate(item?.dataInicio),
        _dataFim: this.parseDate(item?.dataFim),
      }))
      .filter((item) => item._dataInicio && item._dataFim);

    if (!contratosComDatas.length) {
      return null;
    }

    const contratosAtivos = contratosComDatas.filter((item) => this.getStatusAtividadeContrato(item) === 'ATIVO');
    const baseInicio = contratosAtivos.length > 0 ? contratosAtivos : contratosComDatas;

    const primeiraDataInicio = baseInicio
      .map((item) => item._dataInicio as Date)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const ultimaDataFim = contratosComDatas
      .map((item) => item._dataFim as Date)
      .sort((a, b) => a.getTime() - b.getTime())[contratosComDatas.length - 1];

    return {
      dataInicio: this.formatDateToLocalISO(primeiraDataInicio),
      dataFim: this.formatDateToLocalISO(ultimaDataFim),
    };
  }

  private async getContratosRelacionadosInstituicao(instituicaoId: number): Promise<any[]> {
    const fallbackItens = await this.readInstituicoesFallback();
    const fallbackIndexByRequestId = this.findFallbackItemIndexByRequestId(fallbackItens, instituicaoId);
    const fallbackIndexBySourceId = instituicaoId > 0 ? this.findFallbackItemIndexBySourceId(fallbackItens, instituicaoId) : -1;
    const fallbackIndex = fallbackIndexByRequestId >= 0 ? fallbackIndexByRequestId : fallbackIndexBySourceId;
    const fallbackItem = fallbackIndex >= 0 ? fallbackItens[fallbackIndex] : null;

    const instituicaoIdOrigem = fallbackItem
      ? (Number(fallbackItem?.instituicaoIdOrigem) > 0 ? Number(fallbackItem?.instituicaoIdOrigem) : null)
      : (instituicaoId > 0 ? instituicaoId : null);

    const contratos = await this.readContratosFallback();
    return contratos
      .filter((item) => {
        const referencia = Number(item?.instituicaoIdReferencia);
        const origem = Number(item?.instituicaoIdOrigem);

        if (referencia === instituicaoId) {
          return true;
        }

        if (instituicaoId > 0 && origem === instituicaoId) {
          return true;
        }

        if (instituicaoId < 0 && instituicaoIdOrigem && origem === instituicaoIdOrigem) {
          return true;
        }

        return false;
      })
      .sort((a, b) => {
        const dataA = this.parseDate(a?.dataInicio)?.getTime() ?? 0;
        const dataB = this.parseDate(b?.dataInicio)?.getTime() ?? 0;
        return dataB - dataA;
      });
  }

  private resolveLiberadoAdmin(status: string, liberadoAtual: boolean): boolean {
    if (status === 'APROVADO') {
      return true;
    }

    if (status === 'REJEITADO') {
      return false;
    }

    return liberadoAtual;
  }

  private async readInstituicoesFallback(): Promise<any[]> {
    try {
      const raw = await fs.readFile(this.fallbackFilePath, 'utf8');
      return JSON.parse(raw) as any[];
    } catch {
      await fs.mkdir(path.dirname(this.fallbackFilePath), { recursive: true });
      await fs.writeFile(this.fallbackFilePath, '[]', 'utf8');
      return [];
    }
  }

  private async writeInstituicoesFallback(data: any[]): Promise<void> {
    await fs.mkdir(path.dirname(this.fallbackFilePath), { recursive: true });
    await fs.writeFile(this.fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  }

  private async readContratosFallback(): Promise<any[]> {
    try {
      const raw = await fs.readFile(this.contratosFallbackFilePath, 'utf8');
      return JSON.parse(raw) as any[];
    } catch {
      await fs.mkdir(path.dirname(this.contratosFallbackFilePath), { recursive: true });
      await fs.writeFile(this.contratosFallbackFilePath, '[]', 'utf8');
      return [];
    }
  }

  private async writeContratosFallback(data: any[]): Promise<void> {
    await fs.mkdir(path.dirname(this.contratosFallbackFilePath), { recursive: true });
    await fs.writeFile(this.contratosFallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
