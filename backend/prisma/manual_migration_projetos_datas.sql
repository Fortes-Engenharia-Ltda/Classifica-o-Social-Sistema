-- Adiciona periodo do projeto para planejamento financeiro
ALTER TABLE projetos
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_fim DATE;
