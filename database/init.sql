-- Script de criação inicial do banco de dados classificacao_social
CREATE TABLE IF NOT EXISTS d_usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    data_nascimento DATE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    codigo_reset_senha VARCHAR(10),
    expira_reset_senha TIMESTAMP
);

CREATE TABLE IF NOT EXISTS obras (
    id SERIAL PRIMARY KEY,
    codigo_obra VARCHAR(50) UNIQUE NOT NULL,
    nome_obra VARCHAR(100) NOT NULL,
    cidade VARCHAR(100),
    centro_custo VARCHAR(50),
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS projetos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS programas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS classificacoes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS publicos_alvo (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classificacao_contas (
    id SERIAL PRIMARY KEY,
    codigo_acao INTEGER NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    orcado_nao_orcado_id INTEGER NOT NULL REFERENCES d_orcado_nao_orcado(id),
    status BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    numero_nf VARCHAR(50) NOT NULL,
    fornecedor VARCHAR(100),
    cnpj VARCHAR(20),
    valor NUMERIC(15,2),
    data_emissao DATE,
    obra_id INTEGER REFERENCES obras(id),
    action_code INTEGER,
    classificacao_conta_id INTEGER REFERENCES classificacao_contas(id),
    orcado_nao_orcado_id INTEGER REFERENCES d_orcado_nao_orcado(id),
    programa_id INTEGER REFERENCES programas(id),
    instituicao_id INTEGER REFERENCES instituicoes_sociais(id),
    projeto_id INTEGER REFERENCES projetos(id),
    classificacao_att_id INTEGER REFERENCES classificacoes(id),
    publico_alvo_id INTEGER REFERENCES publicos_alvo(id),
    status VARCHAR(20),
    origem_importacao VARCHAR(50),
    observacao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classificacoes_nf (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INTEGER REFERENCES notas_fiscais(id),
    projeto_id INTEGER REFERENCES projetos(id),
    programa_id INTEGER REFERENCES programas(id),
    classificacao_id INTEGER REFERENCES classificacoes(id),
    obra_id INTEGER REFERENCES obras(id),
    data_classificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES d_usuarios(id)
);

CREATE TABLE IF NOT EXISTS importacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES d_usuarios(id),
    data_importacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    arquivo VARCHAR(255),
    status VARCHAR(20),
    log TEXT
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES d_usuarios(id),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acao VARCHAR(100),
    alteracao TEXT,
    ip VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS alertas (
    id SERIAL PRIMARY KEY,
    nota_fiscal_id INTEGER REFERENCES notas_fiscais(id),
    tipo VARCHAR(50),
    mensagem TEXT,
    status VARCHAR(20),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responsavel_id INTEGER REFERENCES d_usuarios(id)
);
