export interface CamposObrigatoriosClassificacao {
  orcadoNaoOrcado: string | null;
  programa: string | null;
  instituicao: string | null;
  projeto: string | null;
  classificacaoProjetoAtt: string | null;
}

export interface CamposOpcionaisClassificacao {
  indiceImportacao?: string | null;
  historico?: string | null;
  unidadeNegocio?: string | null;
  dataPagamento?: string | null;
  razaoSocial?: string | null;
  valor?: number | null;
  codDocumento?: string | null;
  observacoes?: string | null;
  publicoAlvo?: string | null;
}


export interface NotaFiscalMetadata {
  camposObrigatorios: CamposObrigatoriosClassificacao;
  camposOpcionais: CamposOpcionaisClassificacao;
  textoObservacao?: string | null;
}

const META_PREFIX = '__META__';

export const emptyCamposObrigatorios = (): CamposObrigatoriosClassificacao => ({
  orcadoNaoOrcado: null,
  programa: null,
  instituicao: null,
  projeto: null,
  classificacaoProjetoAtt: null,
});

export const parseNotaFiscalMetadata = (observacao?: string | null): NotaFiscalMetadata => {
  if (!observacao) {
    return {
      camposObrigatorios: emptyCamposObrigatorios(),
      camposOpcionais: {},
      textoObservacao: null,
    };
  }

  if (!observacao.startsWith(META_PREFIX)) {
    return {
      camposObrigatorios: emptyCamposObrigatorios(),
      camposOpcionais: { observacoes: observacao },
      textoObservacao: observacao,
    };
  }

  try {
    const parsed = JSON.parse(observacao.slice(META_PREFIX.length)) as Partial<NotaFiscalMetadata>;
    return {
      camposObrigatorios: {
        ...emptyCamposObrigatorios(),
        ...(parsed.camposObrigatorios || {}),
      },
      camposOpcionais: parsed.camposOpcionais || {},
      textoObservacao: parsed.textoObservacao || null,
    };
  } catch {
    return {
      camposObrigatorios: emptyCamposObrigatorios(),
      camposOpcionais: { observacoes: observacao },
      textoObservacao: observacao,
    };
  }
};

export const encodeNotaFiscalMetadata = (metadata: NotaFiscalMetadata): string => {
  return `${META_PREFIX}${JSON.stringify(metadata)}`;
};

export const hasPendenciaClassificacao = (metadata: NotaFiscalMetadata): boolean => {
  const obrigatorios = metadata.camposObrigatorios;
  return (
    !obrigatorios.orcadoNaoOrcado ||
    !obrigatorios.programa ||
    !obrigatorios.instituicao ||
    !obrigatorios.projeto ||
    !obrigatorios.classificacaoProjetoAtt
  );
};
