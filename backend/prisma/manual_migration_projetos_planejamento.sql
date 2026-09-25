-- Campos de periodo, impacto mensal e participantes do projeto
ALTER TABLE projetos
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_fim DATE,
  ADD COLUMN IF NOT EXISTS impacto_mensal JSONB,
  ADD COLUMN IF NOT EXISTS participantes_projeto JSONB;
