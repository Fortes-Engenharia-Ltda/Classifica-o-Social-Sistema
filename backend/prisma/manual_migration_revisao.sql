-- Migração: campos de revisão e correção de tipo do prazo_pagamento
-- Execute no banco PostgreSQL antes de reiniciar o backend

-- 1. Corrigir coluna prazo_pagamento de DATE para VARCHAR (se ainda for DATE)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instituicoes_sociais'
      AND column_name = 'prazo_pagamento'
      AND data_type = 'date'
  ) THEN
    ALTER TABLE instituicoes_sociais
      ALTER COLUMN prazo_pagamento TYPE VARCHAR(50) USING prazo_pagamento::TEXT;
    RAISE NOTICE 'prazo_pagamento alterado para VARCHAR(50)';
  END IF;
END $$;

-- 2. Adicionar coluna status_revisao
ALTER TABLE instituicoes_sociais
  ADD COLUMN IF NOT EXISTS status_revisao VARCHAR(30) NOT NULL DEFAULT 'PENDENTE';

-- 3. Adicionar coluna observacoes_revisao
ALTER TABLE instituicoes_sociais
  ADD COLUMN IF NOT EXISTS observacoes_revisao TEXT;

-- 4. Índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_inst_status_revisao ON instituicoes_sociais(status_revisao);
