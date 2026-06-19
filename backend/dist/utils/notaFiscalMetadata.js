"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPendenciaClassificacao = exports.encodeNotaFiscalMetadata = exports.parseNotaFiscalMetadata = exports.emptyCamposObrigatorios = void 0;
const META_PREFIX = '__META__';
const emptyCamposObrigatorios = () => ({
    orcadoNaoOrcado: null,
    programa: null,
    instituicao: null,
    projeto: null,
    classificacaoProjetoAtt: null,
});
exports.emptyCamposObrigatorios = emptyCamposObrigatorios;
const parseNotaFiscalMetadata = (observacao) => {
    if (!observacao) {
        return {
            camposObrigatorios: (0, exports.emptyCamposObrigatorios)(),
            camposOpcionais: {},
            textoObservacao: null,
        };
    }
    if (!observacao.startsWith(META_PREFIX)) {
        return {
            camposObrigatorios: (0, exports.emptyCamposObrigatorios)(),
            camposOpcionais: { observacoes: observacao },
            textoObservacao: observacao,
        };
    }
    try {
        const parsed = JSON.parse(observacao.slice(META_PREFIX.length));
        return {
            camposObrigatorios: {
                ...(0, exports.emptyCamposObrigatorios)(),
                ...(parsed.camposObrigatorios || {}),
            },
            camposOpcionais: parsed.camposOpcionais || {},
            textoObservacao: parsed.textoObservacao || null,
        };
    }
    catch {
        return {
            camposObrigatorios: (0, exports.emptyCamposObrigatorios)(),
            camposOpcionais: { observacoes: observacao },
            textoObservacao: observacao,
        };
    }
};
exports.parseNotaFiscalMetadata = parseNotaFiscalMetadata;
const encodeNotaFiscalMetadata = (metadata) => {
    return `${META_PREFIX}${JSON.stringify(metadata)}`;
};
exports.encodeNotaFiscalMetadata = encodeNotaFiscalMetadata;
const hasPendenciaClassificacao = (metadata) => {
    const obrigatorios = metadata.camposObrigatorios;
    return (!obrigatorios.orcadoNaoOrcado ||
        !obrigatorios.programa ||
        !obrigatorios.instituicao ||
        !obrigatorios.projeto ||
        !obrigatorios.classificacaoProjetoAtt);
};
exports.hasPendenciaClassificacao = hasPendenciaClassificacao;
//# sourceMappingURL=notaFiscalMetadata.js.map