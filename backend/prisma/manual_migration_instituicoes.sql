CREATE TABLE IF NOT EXISTS instituicoes_sociais (
  id SERIAL PRIMARY KEY,
  instituicao VARCHAR(150) NOT NULL,
  responsavel VARCHAR(120),
  cep VARCHAR(20),
  logradouro VARCHAR(180),
  numero VARCHAR(20),
  complemento VARCHAR(120),
  bairro VARCHAR(120),
  cidade VARCHAR(120),
  estado VARCHAR(10),
  cnpj VARCHAR(20),
  prazo_pagamento DATE,
  data_inicio DATE,
  data_fim DATE,
  descricao TEXT,
  liberado_admin BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS instituicoes_sociais
  ADD COLUMN IF NOT EXISTS numero VARCHAR(20);

ALTER TABLE IF EXISTS instituicoes_sociais
  ADD COLUMN IF NOT EXISTS complemento VARCHAR(120);

ALTER TABLE IF EXISTS instituicoes_sociais
  ALTER COLUMN prazo_pagamento TYPE DATE
  USING CASE
    WHEN prazo_pagamento IS NULL THEN NULL
    WHEN prazo_pagamento::text ~ '^\d{4}-\d{2}-\d{2}$' THEN prazo_pagamento::text::date
    ELSE NULL
  END;

CREATE INDEX IF NOT EXISTS idx_instituicoes_sociais_instituicao ON instituicoes_sociais(instituicao);
CREATE INDEX IF NOT EXISTS idx_instituicoes_sociais_cidade ON instituicoes_sociais(cidade);
CREATE INDEX IF NOT EXISTS idx_instituicoes_sociais_data_inicio ON instituicoes_sociais(data_inicio);

CREATE TABLE IF NOT EXISTS responsaveis_instituicao (
  id SERIAL PRIMARY KEY,
  instituicao_id INTEGER REFERENCES instituicoes_sociais(id) ON DELETE SET NULL,
  representante VARCHAR(120) NOT NULL,
  cpf VARCHAR(20),
  rg VARCHAR(30),
  orgao_expedidor VARCHAR(50),
  cargo VARCHAR(80),
  mandato VARCHAR(80),
  endereco VARCHAR(180),
  contato VARCHAR(30),
  contato2 VARCHAR(30),
  contato3 VARCHAR(30),
  email VARCHAR(120),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_responsaveis_instituicao_instituicao_id ON responsaveis_instituicao(instituicao_id);

CREATE TABLE IF NOT EXISTS responsaveis_tecnicos (
  id SERIAL PRIMARY KEY,
  instituicao_id INTEGER REFERENCES instituicoes_sociais(id) ON DELETE SET NULL,
  representante VARCHAR(120) NOT NULL,
  cpf VARCHAR(20),
  rg VARCHAR(30),
  orgao_expedidor VARCHAR(50),
  cargo VARCHAR(80),
  mandato VARCHAR(80),
  endereco VARCHAR(180),
  contato VARCHAR(30),
  contato2 VARCHAR(30),
  contato3 VARCHAR(30),
  email VARCHAR(120),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_responsaveis_tecnicos_instituicao_id ON responsaveis_tecnicos(instituicao_id);
