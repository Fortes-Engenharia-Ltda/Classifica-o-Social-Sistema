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
export declare const emptyCamposObrigatorios: () => CamposObrigatoriosClassificacao;
export declare const parseNotaFiscalMetadata: (observacao?: string | null) => NotaFiscalMetadata;
export declare const encodeNotaFiscalMetadata: (metadata: NotaFiscalMetadata) => string;
export declare const hasPendenciaClassificacao: (metadata: NotaFiscalMetadata) => boolean;
//# sourceMappingURL=notaFiscalMetadata.d.ts.map