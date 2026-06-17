-- Seed inicial baseado em backend/src/database/seed.ts
-- Rode depois de aplicar supabase_init.sql

INSERT INTO "d_usuarios" ("nome", "email", "senha", "perfil", "status", "data_criacao", "data_atualizacao") VALUES
('Master', 'master@classificacao.com', '$2a$10$JkEM.uQit4dKOr5xntl1J.l6ubYSdgUIV5Dw3a3eN7tVumaQP4XKK', 'MASTER', true, NOW(), NOW()),
('Administrador', 'admin@classificacao.com', '$2a$10$//adkZrp39pzeyZRAdme3O2rVOmJGuX0eqbO7/dMqjL7JQeUI0MAm', 'ADMIN', true, NOW(), NOW()),
('Analista', 'analista@classificacao.com', '$2a$10$4wmSv.NbL8zXghZqRFBSCu4GQlL5DP3l3qaZmgzBgBcd94xvnoO7m', 'ANALYST', true, NOW(), NOW()),
('Gestor', 'gestor@classificacao.com', '$2a$10$fZ5jmjZ/FiB8EhMplRkYe.wNJnq7AveUr.0MynCRpMgT.eaZmlSSC', 'MANAGER', true, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "d_orcado_nao_orcado" ("codigo", "nome", "status", "data_criacao", "data_atualizacao") VALUES
('ORCADO', 'Orçado', true, NOW(), NOW()),
('NAO_ORCADO', 'Não Orçado', true, NOW(), NOW())
ON CONFLICT ("nome") DO NOTHING;

INSERT INTO "obras" ("codigo_obra", "nome_obra", "cidade", "centro_custo", "status", "data_criacao", "data_atualizacao") VALUES
('OBR-001', 'Construção Prédio A', 'São Paulo', 'CC-001', true, NOW(), NOW()),
('OBR-002', 'Reforma Prédio B', 'Rio de Janeiro', 'CC-002', true, NOW(), NOW()),
('OBR-003', 'Ampliação Prédio C', 'Belo Horizonte', 'CC-003', true, NOW(), NOW())
ON CONFLICT ("codigo_obra") DO NOTHING;

INSERT INTO "projetos" ("codigo", "nome", "descricao", "status", "data_criacao", "data_atualizacao") VALUES
('PROJ-001', 'Projeto Estrutura', 'Projeto de estrutura da obra', true, NOW(), NOW()),
('PROJ-002', 'Projeto Acabamento', 'Projeto de acabamento da obra', true, NOW(), NOW())
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "programas" ("codigo", "nome", "descricao", "status", "data_criacao", "data_atualizacao") VALUES
('PROG-001', 'Programa Social A', 'Programa de responsabilidade social', true, NOW(), NOW()),
('PROG-002', 'Programa Social B', 'Programa ambiental', true, NOW(), NOW())
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "classificacoes" ("codigo", "nome", "categoria", "status", "data_criacao", "data_atualizacao") VALUES
('CLASS-001', 'Material de Construção', 'Materiais', true, NOW(), NOW()),
('CLASS-002', 'Serviços Terceirizados', 'Serviços', true, NOW(), NOW()),
('CLASS-003', 'Recursos Humanos', 'RH', true, NOW(), NOW())
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "notas_fiscais" ("numero_nf", "fornecedor", "cnpj", "valor", "data_emissao", "obra_id", "action_code", "classificacao_conta_id", "orcado_nao_orcado_id", "programa_id", "instituicao_id", "projeto_id", "classificacao_att_id", "publico_alvo_id", "status", "origem_importacao", "observacao", "data_criacao", "data_atualizacao")
SELECT 'NF-001-2024', 'Fornecedor A', '12.345.678/0001-90', 5000.00, DATE '2024-01-15', o.id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDENTE', 'MANUAL', 'Nota fiscal de teste', NOW(), NOW()
FROM "obras" o WHERE o."codigo_obra" = 'OBR-001'
ON CONFLICT DO NOTHING;

INSERT INTO "notas_fiscais" ("numero_nf", "fornecedor", "cnpj", "valor", "data_emissao", "obra_id", "action_code", "classificacao_conta_id", "orcado_nao_orcado_id", "programa_id", "instituicao_id", "projeto_id", "classificacao_att_id", "publico_alvo_id", "status", "origem_importacao", "observacao", "data_criacao", "data_atualizacao")
SELECT 'NF-002-2024', 'Fornecedor B', '98.765.432/0001-10', 10000.00, DATE '2024-02-20', o.id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CLASSIFICADA', 'MEGA', 'Importada do sistema Mega', NOW(), NOW()
FROM "obras" o WHERE o."codigo_obra" = 'OBR-002'
ON CONFLICT DO NOTHING;

INSERT INTO "notas_fiscais" ("numero_nf", "fornecedor", "cnpj", "valor", "data_emissao", "obra_id", "action_code", "classificacao_conta_id", "orcado_nao_orcado_id", "programa_id", "instituicao_id", "projeto_id", "classificacao_att_id", "publico_alvo_id", "status", "origem_importacao", "observacao", "data_criacao", "data_atualizacao")
SELECT 'NF-003-2024', 'Fornecedor C', '55.555.555/0001-55', 7500.00, DATE '2024-03-10', o.id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDENTE', 'SOX', 'Importada do sistema SOX', NOW(), NOW()
FROM "obras" o WHERE o."codigo_obra" = 'OBR-003'
ON CONFLICT DO NOTHING;