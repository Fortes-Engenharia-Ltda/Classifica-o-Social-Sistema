-- Migration: Adicionar campo valor_monetario_previsto à tabela instituicoes_sociais
-- Data: 2026-05-18

ALTER TABLE public.instituicoes_sociais 
  ADD COLUMN IF NOT EXISTS valor_monetario_previsto DECIMAL(15, 2);

-- Criar índice para melhorar queries
CREATE INDEX IF NOT EXISTS idx_instituicoes_sociais_valor_monetario ON public.instituicoes_sociais(valor_monetario_previsto);

-- Comentário de documentação (opcional)
COMMENT ON COLUMN public.instituicoes_sociais.valor_monetario_previsto IS 'Valor monetário previsto para a instituição (em reais)';
