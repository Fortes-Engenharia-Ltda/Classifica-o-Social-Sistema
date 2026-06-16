import prisma from '../config/database';
import { hashPassword } from '../utils/auth';
import logger from '../config/logger';

async function seed() {
  try {
    logger.info('Iniciando seed do banco de dados...');

    // Criar usuários
    const usuarioMaster = await prisma.usuario.create({
      data: {
        nome: 'Master',
        email: 'master@classificacao.com',
        senha: await hashPassword('master123'),
        perfil: 'MASTER',
        status: true,
      },
    });

    const usuarioAdmin = await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@classificacao.com',
        senha: await hashPassword('admin123'),
        perfil: 'ADMIN',
        status: true,
      },
    });

    const usuarioAnalista = await prisma.usuario.create({
      data: {
        nome: 'Analista',
        email: 'analista@classificacao.com',
        senha: await hashPassword('analista123'),
        perfil: 'ANALYST',
        status: true,
      },
    });

    const usuarioGestor = await prisma.usuario.create({
      data: {
        nome: 'Gestor',
        email: 'gestor@classificacao.com',
        senha: await hashPassword('gestor123'),
        perfil: 'MANAGER',
        status: true,
      },
    });

    void usuarioMaster;
    void usuarioAdmin;
    void usuarioAnalista;
    void usuarioGestor;

    logger.info('Usuários criados com sucesso');

    // Criar opções de Orçado/Não Orçado
    await Promise.all([
      prisma.orcadoNaoOrcado.upsert({
        where: { nome: 'Orçado' },
        update: { status: true },
        create: {
          codigo: 'ORCADO',
          nome: 'Orçado',
          status: true,
        },
      }),
      prisma.orcadoNaoOrcado.upsert({
        where: { nome: 'Não Orçado' },
        update: { status: true },
        create: {
          codigo: 'NAO_ORCADO',
          nome: 'Não Orçado',
          status: true,
        },
      }),
    ]);

    logger.info('Opções de Orçado/Não Orçado criadas com sucesso');

    // Criar obras
    const obras = await Promise.all([
      prisma.obra.create({
        data: {
          codigoObra: 'OBR-001',
          nomeObra: 'Construção Prédio A',
          cidade: 'São Paulo',
          centroCusto: 'CC-001',
          status: true,
        },
      }),
      prisma.obra.create({
        data: {
          codigoObra: 'OBR-002',
          nomeObra: 'Reforma Prédio B',
          cidade: 'Rio de Janeiro',
          centroCusto: 'CC-002',
          status: true,
        },
      }),
      prisma.obra.create({
        data: {
          codigoObra: 'OBR-003',
          nomeObra: 'Ampliação Prédio C',
          cidade: 'Belo Horizonte',
          centroCusto: 'CC-003',
          status: true,
        },
      }),
    ]);

    logger.info('Obras criadas com sucesso');

    // Criar projetos
    const projetos = await Promise.all([
      prisma.projeto.create({
        data: {
          codigo: 'PROJ-001',
          nome: 'Projeto Estrutura',
          descricao: 'Projeto de estrutura da obra',
          status: true,
        },
      }),
      prisma.projeto.create({
        data: {
          codigo: 'PROJ-002',
          nome: 'Projeto Acabamento',
          descricao: 'Projeto de acabamento da obra',
          status: true,
        },
      }),
    ]);

    logger.info('Projetos criados com sucesso');

    // Criar programas
    const programas = await Promise.all([
      prisma.programa.create({
        data: {
          codigo: 'PROG-001',
          nome: 'Programa Social A',
          descricao: 'Programa de responsabilidade social',
          status: true,
        },
      }),
      prisma.programa.create({
        data: {
          codigo: 'PROG-002',
          nome: 'Programa Social B',
          descricao: 'Programa ambiental',
          status: true,
        },
      }),
    ]);

    logger.info('Programas criados com sucesso');

    // Criar classificações
    const classificacoes = await Promise.all([
      prisma.classificacao.create({
        data: {
          codigo: 'CLASS-001',
          nome: 'Material de Construção',
          categoria: 'Materiais',
          status: true,
        },
      }),
      prisma.classificacao.create({
        data: {
          codigo: 'CLASS-002',
          nome: 'Serviços Terceirizados',
          categoria: 'Serviços',
          status: true,
        },
      }),
      prisma.classificacao.create({
        data: {
          codigo: 'CLASS-003',
          nome: 'Recursos Humanos',
          categoria: 'RH',
          status: true,
        },
      }),
    ]);

    logger.info('Classificações criadas com sucesso');

    // Criar notas fiscais
    await Promise.all([
      prisma.notaFiscal.create({
        data: {
          numeroNF: 'NF-001-2024',
          fornecedor: 'Fornecedor A',
          cnpj: '12.345.678/0001-90',
          valor: 5000.0,
          dataEmissao: new Date('2024-01-15'),
          obraId: obras[0].id,
          status: 'PENDENTE',
          origemImportacao: 'MANUAL',
          observacao: 'Nota fiscal de teste',
        },
      }),
      prisma.notaFiscal.create({
        data: {
          numeroNF: 'NF-002-2024',
          fornecedor: 'Fornecedor B',
          cnpj: '98.765.432/0001-10',
          valor: 10000.0,
          dataEmissao: new Date('2024-02-20'),
          obraId: obras[1].id,
          status: 'CLASSIFICADA',
          origemImportacao: 'MEGA',
          observacao: 'Importada do sistema Mega',
        },
      }),
      prisma.notaFiscal.create({
        data: {
          numeroNF: 'NF-003-2024',
          fornecedor: 'Fornecedor C',
          cnpj: '55.555.555/0001-55',
          valor: 7500.0,
          dataEmissao: new Date('2024-03-10'),
          obraId: obras[2].id,
          status: 'PENDENTE',
          origemImportacao: 'SOX',
          observacao: 'Importada do sistema SOX',
        },
      }),
    ]);

    logger.info('Notas Fiscais criadas com sucesso');

    logger.info('Seed executado com sucesso!');
  } catch (error) {
    logger.error(`Erro ao executar seed: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
