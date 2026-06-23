import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Link2, Pencil, Trash2, X } from 'lucide-react';
import { CadastroInstituicaoCompletoForm } from '@/components/CadastroInstituicaoCompletoForm';
import { InstituicaoService, type LinkValidadeUnidade } from '@/services/InstituicaoService';
import { ObraService } from '@/services';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { Obra } from '@/types';

type AbaInterna = 'cadastro' | 'tabela' | 'revisao';
type UnidadeValidade = LinkValidadeUnidade;
type TipoResponsavelEdicao = 'responsaveis' | 'responsaveisTecnicos';
type SortOrder = 'asc' | 'desc';
type TabelaInstituicoesSortKey =
  | 'instituicao'
  | 'responsavel'
  | 'cnpj'
  | 'numero'
  | 'complemento'
  | 'cidadeUf'
  | 'dataInicio'
  | 'dataFim'
  | 'status';
type RevisaoSortKey = 'instituicao' | 'cnpj' | 'cidadeUf' | 'dataCadastro' | 'revisor' | 'status';
type TableWidthKey = 'tabela' | 'revisao';

interface ResponsavelInfo {
  representante?: string | null;
  cpf?: string | null;
  rg?: string | null;
  orgaoExpedidor?: string | null;
  cargo?: string | null;
  mandato?: string | null;
  endereco?: string | null;
  contato?: string | null;
  contato2?: string | null;
  contato3?: string | null;
  email?: string | null;
}

const CAMPOS_RESPONSAVEL_EDICAO: Array<{ campo: keyof ResponsavelInfo; label: string; type?: 'text' | 'email' }> = [
  { campo: 'representante', label: 'Nome' },
  { campo: 'cpf', label: 'CPF' },
  { campo: 'rg', label: 'RG' },
  { campo: 'orgaoExpedidor', label: 'Órgão expedidor' },
  { campo: 'cargo', label: 'Cargo' },
  { campo: 'mandato', label: 'Mandato' },
  { campo: 'endereco', label: 'Endereço' },
  { campo: 'contato', label: 'Contato principal' },
  { campo: 'contato2', label: 'Contato 2' },
  { campo: 'contato3', label: 'Contato 3' },
  { campo: 'email', label: 'Email', type: 'email' },
];

const criarResponsavelVazio = (): ResponsavelInfo => ({
  representante: '',
  cpf: '',
  rg: '',
  orgaoExpedidor: '',
  cargo: '',
  mandato: '',
  endereco: '',
  contato: '',
  contato2: '',
  contato3: '',
  email: '',
});

const temAlgumValor = (obj?: Record<string, unknown> | null): boolean => {
  if (!obj) {
    return false;
  }

  return Object.values(obj).some((value) => String(value ?? '').trim().length > 0);
};

const validadeLimites: Record<UnidadeValidade, { min: number; max: number }> = {
  MINUTOS: { min: 1, max: 43200 },
  HORAS: { min: 1, max: 720 },
  DIAS: { min: 1, max: 30 },
};

const validadeOpcoes: Array<{ value: UnidadeValidade; label: string }> = [
  { value: 'MINUTOS', label: 'Minutos' },
  { value: 'HORAS', label: 'Horas' },
  { value: 'DIAS', label: 'Dias' },
];

const clampValidade = (value: number, unidade: UnidadeValidade): number => {
  const { min, max } = validadeLimites[unidade];
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
};

interface InstituicaoItem {
  id: number;
  instituicao: string;
  statusRevisao?: string;
  liberadoAdmin?: boolean;
  responsavel?: string | null;
  cnpj?: string | null;
  numero?: string | null;
  complemento?: string | null;
  cidade?: string | null;
  estado?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  dataCriacao?: string;
}

interface InstituicaoParaRevisao {
  id: number;
  instituicao: string;
  liberadoAdmin?: boolean;
  responsavel?: string | null;
  cnpj?: string | null;
  revisorEmail?: string | null;
  revisorNome?: string | null;
  dataRevisao?: string | null;
  motivoRejeicao?: string | null;
  valorMonetarioPrevisto?: number | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  prazoPagamento?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  descricao?: string | null;
  historicoFinalidadeOsc?: string | null;
  principaisAcoesProponente?: string | null;
  publicoAlvoProponente?: string | null;
  regiaoAlcanceBairros?: string | null;
  infraestruturaProponente?: string | null;
  termoAnexo?: string | null;
  statusRevisao: string;
  observacoesRevisao?: string | null;
  dataCriacao: string;
  responsaveis?: ResponsavelInfo[];
  responsaveisTecnicos?: ResponsavelInfo[];
}

interface ContratoInstituicao {
  id: number;
  numeroContrato: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  termoAnexo?: string | null;
  obraIds: number[];
  publicoAlvoId?: number | null;
  statusAtividade?: 'ATIVO' | 'INATIVO';
  obrasAtendidas?: Array<{ id: number; nome?: string; codigo?: string }>;
}

type ModalExclusaoState =
  | {
    tipo: 'contrato';
    instituicaoId: number;
    contratoId: number;
    descricao: string;
  }
  | {
    tipo: 'instituicao';
    instituicaoId: number;
    descricao: string;
  };

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDENTE: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  APROVADO: { label: 'Aprovado', cls: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  REJEITADO: { label: 'Rejeitado', cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  AJUSTES_SOLICITADOS: { label: 'Ajustes solicitados', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { label, cls } = statusMap[status] ?? { label: status, cls: 'bg-slate-100 text-slate-800' };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

const buildArquivoUrl = (caminho?: string | null): string => {
  if (!caminho) return '';
  if (caminho.startsWith('http://') || caminho.startsWith('https://')) return caminho;
  const apiBase = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (!apiBase) return caminho;
  const arquivosBase = apiBase.replace(/\/api$/i, '');
  return `${arquivosBase}${caminho.startsWith('/') ? caminho : `/${caminho}`}`;
};

const parseDataVigencia = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const texto = String(value).trim();
  const dataIsoSemHorario = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dataIsoSemHorario) {
    const [, ano, mes, dia] = dataIsoSemHorario;
    const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dataIsoComHorario = texto.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (dataIsoComHorario) {
    const [, ano, mes, dia] = dataIsoComHorario;
    const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dataBr) {
    const [, dia, mes, ano] = dataBr;
    const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(texto);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatarDataLocalPtBr = (value?: string | null): string => {
  const date = parseDataVigencia(value);
  if (!date) {
    return '-';
  }

  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

const isInstituicaoAtiva = (item: Pick<InstituicaoItem, 'liberadoAdmin' | 'dataFim'>): boolean => {
  const dataFim = parseDataVigencia(item.dataFim);
  if (!dataFim) {
    return true;
  }

  dataFim.setHours(23, 59, 59, 999);
  return dataFim.getTime() >= Date.now();
};

const isContratoAtivo = (item: Pick<ContratoInstituicao, 'dataInicio' | 'dataFim'>): boolean => {
  const dataInicio = parseDataVigencia(item.dataInicio);
  const dataFim = parseDataVigencia(item.dataFim);
  if (!dataInicio || !dataFim) {
    return false;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  dataInicio.setHours(0, 0, 0, 0);
  dataFim.setHours(23, 59, 59, 999);
  return dataInicio.getTime() <= hoje.getTime() && dataFim.getTime() >= hoje.getTime();
};

interface ValidadeLinkControlProps {
  valor: number;
  unidade: UnidadeValidade;
  onValorChange: (value: number) => void;
  onUnidadeChange: (value: UnidadeValidade) => void;
  label?: string;
  compact?: boolean;
}

const ValidadeLinkControl: React.FC<ValidadeLinkControlProps> = ({
  valor,
  unidade,
  onValorChange,
  onUnidadeChange,
  label,
  compact = false,
}) => {
  const [valorDigitado, setValorDigitado] = useState(String(valor));

  useEffect(() => {
    setValorDigitado(String(valor));
  }, [valor, unidade]);

  const confirmarValor = (valorBruto: string, unidadeAtual: UnidadeValidade) => {
    const valorNormalizado = clampValidade(Number(valorBruto || validadeLimites[unidadeAtual].min), unidadeAtual);
    setValorDigitado(String(valorNormalizado));
    onValorChange(valorNormalizado);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60'}`}>
      {label ? (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      ) : null}
      <input
        type="number"
        min={validadeLimites[unidade].min}
        max={validadeLimites[unidade].max}
        value={valorDigitado}
        onChange={(e) => setValorDigitado(e.target.value)}
        onBlur={(e) => confirmarValor(e.target.value, unidade)}
        className={`rounded-lg border border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${compact ? 'w-20 px-2 py-1.5 text-xs' : 'w-24 px-3 py-2 text-sm'}`}
      />
      <select
        value={unidade}
        onChange={(e) => {
          const nextUnit = e.target.value as UnidadeValidade;
          onUnidadeChange(nextUnit);
          confirmarValor(valorDigitado, nextUnit);
        }}
        className={`rounded-lg border border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
      >
        {validadeOpcoes.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
        ))}
      </select>
    </div>
  );
};

export const Instituicoes: React.FC = () => {
  const marcadorAjuste = '[AJUSTE]';
  const isCadastroAjuste = (item: Pick<InstituicaoParaRevisao, 'observacoesRevisao'>): boolean =>
    String(item.observacoesRevisao || '').includes(marcadorAjuste);

  const [abaInterna, setAbaInterna] = useState<AbaInterna>('cadastro');
  const [instituicoes, setInstituicoes] = useState<InstituicaoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [termo, setTermo] = useState('');
  const [filtroInstituicao, setFiltroInstituicao] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('');
  const [filtroCnpj, setFiltroCnpj] = useState('');
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroComplemento, setFiltroComplemento] = useState('');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroStatusAtivo, setFiltroStatusAtivo] = useState<'ATIVO' | 'INATIVO' | ''>('');
  const [dataInicioDe, setDataInicioDe] = useState('');
  const [dataFimAte, setDataFimAte] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { usuario } = useAuthStore();

  const [tokenGerado, setTokenGerado] = useState<string | null>(null);
  const [tokenValidoAte, setTokenValidoAte] = useState<string | null>(null);
  const [validadeTokenValor, setValidadeTokenValor] = useState<number>(72);
  const [validadeTokenUnidade, setValidadeTokenUnidade] = useState<UnidadeValidade>('HORAS');
  const [gerandoToken, setGerandoToken] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [validadeRevisaoValor, setValidadeRevisaoValor] = useState<number>(72);
  const [validadeRevisaoUnidade, setValidadeRevisaoUnidade] = useState<UnidadeValidade>('HORAS');
  const [linkRevisaoValidoAte, setLinkRevisaoValidoAte] = useState<string | null>(null);

  const podeGerarToken =
    usuario?.perfil === 'ADMIN' ||
    usuario?.perfil === 'ANALYST' ||
    usuario?.perfil === 'MASTER' ||
    usuario?.perfil === 'MANAGER';
  const podeEditarInstituicao = usuario?.perfil === 'ADMIN' || usuario?.perfil === 'MANAGER';
  const podeExcluirInstituicao =
    usuario?.perfil === 'ADMIN' || usuario?.perfil === 'MANAGER' || usuario?.perfil === 'MASTER';
  const podeEditarContrato = usuario?.perfil === 'ADMIN' || usuario?.perfil === 'MASTER';
  const podeRevisarInstituicao =
    usuario?.perfil === 'ADMIN' ||
    usuario?.perfil === 'ANALYST' ||
    usuario?.perfil === 'MASTER' ||
    usuario?.perfil === 'MANAGER';

  const urlCadastro = tokenGerado
    ? `${window.location.origin}/cadastros?token=${tokenGerado}`
    : '';

  const gerarToken = async () => {
    try {
      setGerandoToken(true);
      const response = await api.post('/token-cadastro/gerar', {
        validadeValor: validadeTokenValor,
        validadeUnidade: validadeTokenUnidade,
      });
      const token: string = response.data?.data?.token ?? '';
      setTokenGerado(token);
      setTokenValidoAte(response.data?.data?.validoAte ?? null);
      setCopiado(false);
    } catch {
      alert('Não foi possível gerar o link. Verifique suas permissões.');
    } finally {
      setGerandoToken(false);
    }
  };

  const copiarUrl = async () => {
    if (!urlCadastro) return;
    await navigator.clipboard.writeText(urlCadastro);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const getStatusAtividade = (item: Pick<InstituicaoItem, 'liberadoAdmin' | 'dataFim'>): 'ATIVO' | 'INATIVO' =>
    isInstituicaoAtiva(item) ? 'ATIVO' : 'INATIVO';

  const [pendentes, setPendentes] = useState<InstituicaoParaRevisao[]>([]);
  const [loadingRevisao, setLoadingRevisao] = useState(false);
  const [filtroStatusRevisao, setFiltroStatusRevisao] = useState('');
  const [mostrarFiltrosRevisao, setMostrarFiltrosRevisao] = useState(false);
  const [termoRevisao, setTermoRevisao] = useState('');
  const [filtroInstituicaoRevisao, setFiltroInstituicaoRevisao] = useState('');
  const [filtroResponsavelRevisao, setFiltroResponsavelRevisao] = useState('');
  const [filtroCnpjRevisao, setFiltroCnpjRevisao] = useState('');
  const [filtroCidadeRevisao, setFiltroCidadeRevisao] = useState('');
  const [filtroEstadoRevisao, setFiltroEstadoRevisao] = useState('');
  const [dataCadastroDeRevisao, setDataCadastroDeRevisao] = useState('');
  const [dataCadastroAteRevisao, setDataCadastroAteRevisao] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [cadastroSelecionado, setCadastroSelecionado] = useState<InstituicaoParaRevisao | null>(null);
  const [reabrindoRevisao, setReabrindoRevisao] = useState(false);
  const [enviadoLinkRevisao, setEnviadoLinkRevisao] = useState(false);
  const [linkRevisaoGerado, setLinkRevisaoGerado] = useState('');
  const [mostrarModalLink, setMostrarModalLink] = useState(false);
  const [modalInstId, setModalInstId] = useState<number | null>(null);
  const [modalTipo, setModalTipo] = useState<'REJEITADO' | 'AJUSTES_SOLICITADOS'>('REJEITADO');
  const [modalObservacao, setModalObservacao] = useState('');
  const [processandoRevisao, setProcessandoRevisao] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cadastroEditado, setCadastroEditado] = useState<Partial<InstituicaoParaRevisao> | null>(null);
  const [salvandoAlteracoes, setSalvandoAlteracoes] = useState(false);
  const [modalContratosAberto, setModalContratosAberto] = useState(false);
  const [instituicaoContratosSelecionada, setInstituicaoContratosSelecionada] = useState<InstituicaoItem | null>(null);
  const [contratosInstituicao, setContratosInstituicao] = useState<ContratoInstituicao[]>([]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [salvandoContrato, setSalvandoContrato] = useState(false);
  const [cadastroMultiploContratos, setCadastroMultiploContratos] = useState(false);
  const [obrasDisponiveis, setObrasDisponiveis] = useState<Obra[]>([]);
  const [loadingObrasContrato, setLoadingObrasContrato] = useState(false);
  const [modalExclusao, setModalExclusao] = useState<ModalExclusaoState | null>(null);
  const [excluindoItem, setExcluindoItem] = useState(false);
  const [sortTabelaKey, setSortTabelaKey] = useState<TabelaInstituicoesSortKey>('instituicao');
  const [sortTabelaOrder, setSortTabelaOrder] = useState<SortOrder>('asc');
  const [sortRevisaoKey, setSortRevisaoKey] = useState<RevisaoSortKey>('dataCadastro');
  const [sortRevisaoOrder, setSortRevisaoOrder] = useState<SortOrder>('desc');
  const [tableColumnWidths, setTableColumnWidths] = useState<Record<TableWidthKey, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem('instituicoes:columnWidths');
      if (!saved) {
        return { tabela: {}, revisao: {} };
      }

      const parsed = JSON.parse(saved);
      return {
        tabela: parsed?.tabela && typeof parsed.tabela === 'object' ? parsed.tabela : {},
        revisao: parsed?.revisao && typeof parsed.revisao === 'object' ? parsed.revisao : {},
      };
    } catch {
      return { tabela: {}, revisao: {} };
    }
  });
  const resizingRef = useRef<{
    table: TableWidthKey;
    key: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);
  const [publicosAlvo, setPublicosAlvo] = useState<Array<{ id: number; nome: string }>>([]);
  const [projetos, setProjetos] = useState<Array<{ id: number; nome: string; publicoAlvo?: string | null }>>([]);

  const [novoContrato, setNovoContrato] = useState({
    id: null as number | null,
    numeroContrato: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    obraIds: [] as number[],
    contratoFile: null as File | null,
    termoAnexo: '' as string,
    publicoAlvoId: '' as string | number,
    projetoId: '' as string | number,
  });

  const abrirModalDetalhes = (item: InstituicaoParaRevisao) => {
    setCadastroSelecionado(item);
    setModalDetalhesAberto(true);
  };

  const fecharModalDetalhes = () => {
    setModalDetalhesAberto(false);
    setCadastroSelecionado(null);
    setModoEdicao(false);
    setCadastroEditado(null);
  };

  const carregarContratosInstituicao = async (instituicaoId: number) => {
    setLoadingContratos(true);
    try {
      const response = await InstituicaoService.listarContratosInstituicao(instituicaoId);
      setContratosInstituicao(response.data?.data?.contratos ?? []);
    } catch {
      setContratosInstituicao([]);
    } finally {
      setLoadingContratos(false);
    }
  };

  const carregarObrasContrato = async () => {
    setLoadingObrasContrato(true);
    try {
      const response = await ObraService.getAll(1, 500);
      const obras = response?.data?.obras ?? [];
      setObrasDisponiveis(obras);
    } catch {
      setObrasDisponiveis([]);
    } finally {
      setLoadingObrasContrato(false);
    }
  };

  const abrirModalContratos = async (instituicao: InstituicaoItem) => {
    setInstituicaoContratosSelecionada(instituicao);
    setModalContratosAberto(true);
    setNovoContrato({
      id: null,
      numeroContrato: '',
      descricao: '',
      dataInicio: '',
      dataFim: '',
      obraIds: [],
      contratoFile: null,
      termoAnexo: '',
      publicoAlvoId: '',
      projetoId: '',
    });
    setCadastroMultiploContratos(false);

    await Promise.all([
      carregarContratosInstituicao(instituicao.id),
      carregarObrasContrato(),
    ]);
  };

  const fecharModalContratos = () => {
    setModalContratosAberto(false);
    setInstituicaoContratosSelecionada(null);
    setContratosInstituicao([]);
  };

  const toggleObraContrato = (obraId: number) => {
    setNovoContrato((prev) => {
      const exists = prev.obraIds.includes(obraId);
      return {
        ...prev,
        obraIds: exists
          ? prev.obraIds.filter((id) => id !== obraId)
          : [...prev.obraIds, obraId],
      };
    });
  };

  const iniciarEdicaoContrato = (contrato: ContratoInstituicao) => {
    if (!podeEditarContrato) {
      return;
    }

    setNovoContrato({
      id: contrato.id,
      numeroContrato: contrato.numeroContrato || '',
      descricao: contrato.descricao || '',
      dataInicio: contrato.dataInicio ? String(contrato.dataInicio).slice(0, 10) : '',
      dataFim: contrato.dataFim ? String(contrato.dataFim).slice(0, 10) : '',
      obraIds: Array.isArray(contrato.obraIds) ? [...contrato.obraIds] : [],
      contratoFile: null,
      termoAnexo: contrato.termoAnexo || '',
      publicoAlvoId: (contrato as any).publicoAlvoId ?? '',
      projetoId: (contrato as any).projetoId ?? '',
    });
  };

  const cancelarEdicaoContrato = () => {
    setNovoContrato({
      id: null,
      numeroContrato: '',
      descricao: '',
      dataInicio: '',
      dataFim: '',
      obraIds: [],
      contratoFile: null,
      termoAnexo: '',
      publicoAlvoId: '',
      projetoId: '',
    });
  };

  const salvarNovoContrato = async () => {
    if (!instituicaoContratosSelecionada) {
      return;
    }

    const emEdicao = novoContrato.id !== null;

    if (!novoContrato.numeroContrato || !novoContrato.descricao || !novoContrato.dataInicio || !novoContrato.dataFim || novoContrato.obraIds.length === 0) {
      alert('Preencha número, descrição, datas, obra(s) e anexe o termo.');
      return;
    }

    if (!novoContrato.contratoFile && !novoContrato.termoAnexo) {
      alert('Anexe o termo para continuar.');
      return;
    }

    if (novoContrato.dataInicio > novoContrato.dataFim) {
      alert('Data início não pode ser maior que data fim.');
      return;
    }

    setSalvandoContrato(true);
    try {
      const formData = new FormData();
      formData.append('payload', JSON.stringify({
        numeroContrato: novoContrato.numeroContrato,
        descricao: novoContrato.descricao,
        dataInicio: novoContrato.dataInicio,
        dataFim: novoContrato.dataFim,
        obraIds: novoContrato.obraIds,
        termoAnexo: novoContrato.termoAnexo || undefined,
        publicoAlvoId: novoContrato.publicoAlvoId || null,
        projetoId: novoContrato.projetoId || null,
      }));

      if (novoContrato.contratoFile) {
        formData.append('contratoFile', novoContrato.contratoFile);
      }

      if (emEdicao && novoContrato.id) {
        if (!podeEditarContrato) {
          alert('Somente ADMIN e MASTER podem editar contratos.');
          return;
        }
        await InstituicaoService.atualizarContratoInstituicao(
          instituicaoContratosSelecionada.id,
          novoContrato.id,
          formData,
        );
      } else {
        await InstituicaoService.cadastrarContratoInstituicao(instituicaoContratosSelecionada.id, formData);
      }

      if (emEdicao || !cadastroMultiploContratos) {
        cancelarEdicaoContrato();
      } else {
        setNovoContrato((prev) => ({
          ...prev,
          id: null,
          numeroContrato: '',
          descricao: '',
          contratoFile: null,
          termoAnexo: '',
          publicoAlvoId: '',
          projetoId: '',
        }));
      }

      await Promise.all([
        carregarContratosInstituicao(instituicaoContratosSelecionada.id),
        carregarInstituicoes(),
      ]);

      alert(emEdicao ? 'Termo atualizado com sucesso!' : 'Termo cadastrado com sucesso!');
    } catch (error: any) {
      alert(`Erro ao salvar termo: ${error.response?.data?.message || error.message}`);
    } finally {
      setSalvandoContrato(false);
    }
  };

  const renderContratoCard = (contrato: ContratoInstituicao, ativo: boolean) => (
    <div key={contrato.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-900 dark:text-white">Termo {contrato.numeroContrato}</p>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          ativo
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>
      <p className="text-slate-700 dark:text-slate-200 mb-1">{contrato.descricao}</p>
      <p className="text-slate-600 dark:text-slate-300 mb-1">
        Vigência: {formatarDataLocalPtBr(contrato.dataInicio)} até {formatarDataLocalPtBr(contrato.dataFim)}
      </p>
      <p className="text-slate-600 dark:text-slate-300 mb-1">
        Público-alvo: {publicosAlvo.find((pa) => pa.id === contrato.publicoAlvoId)?.nome || '-'}
      </p>
      <p className="text-slate-600 dark:text-slate-300 mb-1">
        Projeto: {projetos.find((p) => p.id === (contrato as any).projetoId)?.nome || '-'}
      </p>
      <p className="text-slate-600 dark:text-slate-300 mb-2">
        Obras: {(contrato.obrasAtendidas && contrato.obrasAtendidas.length > 0)
          ? contrato.obrasAtendidas.map((obra) => obra.nome || obra.codigo || `#${obra.id}`).join(', ')
          : '-'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {contrato.termoAnexo ? (
          <a
            href={buildArquivoUrl(contrato.termoAnexo)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Visualizar
          </a>
        ) : null}
        {podeEditarContrato ? (
          <button
            type="button"
            onClick={() => iniciarEdicaoContrato(contrato)}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
          >
            <Pencil size={12} />
            Editar
          </button>
        ) : null}
        {podeEditarContrato ? (
          <button
            type="button"
            onClick={() => excluirContrato(contrato)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            <Trash2 size={12} />
            Excluir
          </button>
        ) : null}
      </div>
    </div>
  );

  const excluirContrato = async (contrato: ContratoInstituicao) => {
    if (!instituicaoContratosSelecionada) {
      return;
    }

    if (!podeEditarContrato) {
      alert('Somente ADMIN e MASTER podem excluir termos.');
      return;
    }

    setModalExclusao({
      tipo: 'contrato',
      instituicaoId: instituicaoContratosSelecionada.id,
      contratoId: contrato.id,
      descricao: `Deseja excluir o termo ${contrato.numeroContrato}? Esta ação não pode ser desfeita.`,
    });
  };

  const iniciarEdicao = () => {
    if (cadastroSelecionado) {
      const responsavelInstituicao = cadastroSelecionado.responsaveis?.[0]
        ? { ...criarResponsavelVazio(), ...cadastroSelecionado.responsaveis[0] }
        : criarResponsavelVazio();
      const responsavelTecnico = cadastroSelecionado.responsaveisTecnicos?.[0]
        ? { ...criarResponsavelVazio(), ...cadastroSelecionado.responsaveisTecnicos[0] }
        : criarResponsavelVazio();

      setModoEdicao(true);
      setCadastroEditado({
        ...cadastroSelecionado,
        responsaveis: [responsavelInstituicao],
        responsaveisTecnicos: [responsavelTecnico],
      });
    }
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setCadastroEditado(null);
  };

  const atualizarCampoEdicao = (campo: string, valor: any) => {
    setCadastroEditado((prev) => prev ? { ...prev, [campo]: valor } : null);
  };

  const atualizarCampoResponsavelEdicao = (
    tipo: TipoResponsavelEdicao,
    campo: keyof ResponsavelInfo,
    valor: string,
  ) => {
    setCadastroEditado((prev) => {
      if (!prev) {
        return prev;
      }

      const atual = prev[tipo]?.[0] ?? criarResponsavelVazio();
      return {
        ...prev,
        [tipo]: [{ ...atual, [campo]: valor }],
      };
    });
  };

  const getResponsavelEdicao = (tipo: TipoResponsavelEdicao): ResponsavelInfo => {
    return (cadastroEditado?.[tipo]?.[0] ?? criarResponsavelVazio()) as ResponsavelInfo;
  };

  const renderCamposResponsavelEdicao = (tipo: TipoResponsavelEdicao) => {
    const responsavel = getResponsavelEdicao(tipo);

    return (
      <div className="grid grid-cols-1 gap-2 text-sm">
        {CAMPOS_RESPONSAVEL_EDICAO.map(({ campo, label, type }) => (
          <label key={`${tipo}-${String(campo)}`} className="space-y-1">
            <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
            <input
              type={type ?? 'text'}
              value={responsavel[campo] ?? ''}
              onChange={(e) => atualizarCampoResponsavelEdicao(tipo, campo, e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        ))}
      </div>
    );
  };

  const salvarAlteracoes = async () => {
    if (!cadastroSelecionado || !cadastroEditado) return;
    setSalvandoAlteracoes(true);
    try {
      const responsavelInstituicaoEditado = cadastroEditado.responsaveis?.[0] ?? null;
      const responsavelTecnicoEditado = cadastroEditado.responsaveisTecnicos?.[0] ?? null;

      const dados = {
        instituicao: cadastroEditado.instituicao,
        responsavel: cadastroEditado.responsavel,
        cnpj: cadastroEditado.cnpj,
        cep: cadastroEditado.cep,
        logradouro: cadastroEditado.logradouro,
        numero: cadastroEditado.numero,
        complemento: cadastroEditado.complemento,
        bairro: cadastroEditado.bairro,
        cidade: cadastroEditado.cidade,
        estado: cadastroEditado.estado,
        prazoPagamento: cadastroEditado.prazoPagamento,
        descricao: cadastroEditado.descricao,
        historicoFinalidadeOsc: cadastroEditado.historicoFinalidadeOsc,
        principaisAcoesProponente: cadastroEditado.principaisAcoesProponente,
        publicoAlvoProponente: cadastroEditado.publicoAlvoProponente,
        regiaoAlcanceBairros: cadastroEditado.regiaoAlcanceBairros,
        infraestruturaProponente: cadastroEditado.infraestruturaProponente,
        ...(temAlgumValor(responsavelInstituicaoEditado as Record<string, unknown>)
          ? { responsavelInstituicao: responsavelInstituicaoEditado }
          : {}),
        ...(temAlgumValor(responsavelTecnicoEditado as Record<string, unknown>)
          ? { responsavelTecnico: responsavelTecnicoEditado }
          : {}),
        ...(usuario?.perfil === 'ADMIN' && { valorMonetarioPrevisto: cadastroEditado.valorMonetarioPrevisto }),
      };
      const response = await InstituicaoService.atualizarInstituicao(cadastroSelecionado.id, dados);
      const dadosPersistidos = response.data?.data ?? {};
      const updated = {
        ...cadastroSelecionado,
        ...dados,
        ...dadosPersistidos,
        responsaveis: dadosPersistidos.responsaveis
          ?? (temAlgumValor(responsavelInstituicaoEditado as Record<string, unknown>)
            ? [responsavelInstituicaoEditado]
            : cadastroSelecionado.responsaveis),
        responsaveisTecnicos: dadosPersistidos.responsaveisTecnicos
          ?? (temAlgumValor(responsavelTecnicoEditado as Record<string, unknown>)
            ? [responsavelTecnicoEditado]
            : cadastroSelecionado.responsaveisTecnicos),
      } as InstituicaoParaRevisao;
      setCadastroSelecionado(updated);

      setInstituicoes((prev) => prev.map((item) => (
        item.id === cadastroSelecionado.id ? { ...item, ...updated } : item
      )));
      setPendentes((prev) => prev.map((item) => (
        item.id === cadastroSelecionado.id ? { ...item, ...updated } : item
      )));

      setModoEdicao(false);
      setCadastroEditado(null);

      await Promise.all([
        carregarInstituicoes(),
        podeGerarToken ? carregarParaRevisao(filtroStatusRevisao || undefined) : Promise.resolve(),
      ]);

      alert('Alterações salvas com sucesso!');
    } catch (error: any) {
      alert(`Erro ao salvar alterações: ${error.response?.data?.message || error.message}`);
    } finally {
      setSalvandoAlteracoes(false);
    }
  };

  const reabrirRevisao = async (id: number) => {
    if (!confirm('Deseja reabrir o processo de revisão desta instituição?')) return;
    setReabrindoRevisao(true);
    try {
      await InstituicaoService.reabrirRevisao(id);
      fecharModalDetalhes();
      carregarParaRevisao(filtroStatusRevisao || undefined);
    } catch (error) {
      alert('Erro ao reabrir processo de revisão');
    } finally {
      setReabrindoRevisao(false);
    }
  };

  const excluirInstituicao = async (item: InstituicaoItem) => {
    setModalExclusao({
      tipo: 'instituicao',
      instituicaoId: item.id,
      descricao: `Deseja realmente excluir a instituição ${item.instituicao}? Esta ação não poderá ser desfeita.`,
    });
  };

  const fecharModalExclusao = () => {
    if (excluindoItem) {
      return;
    }

    setModalExclusao(null);
  };

  const confirmarExclusao = async () => {
    if (!modalExclusao) {
      return;
    }

    setExcluindoItem(true);
    try {
      if (modalExclusao.tipo === 'contrato') {
        await InstituicaoService.excluirContratoInstituicao(modalExclusao.instituicaoId, modalExclusao.contratoId);

        if (novoContrato.id === modalExclusao.contratoId) {
          cancelarEdicaoContrato();
        }

        await Promise.all([
          carregarContratosInstituicao(modalExclusao.instituicaoId),
          carregarInstituicoes(),
        ]);

        alert('Termo excluído com sucesso!');
      } else {
        await InstituicaoService.excluirInstituicao(modalExclusao.instituicaoId);
        if (cadastroSelecionado?.id === modalExclusao.instituicaoId) {
          fecharModalDetalhes();
        }

        await carregarInstituicoes();
        alert('Instituição excluída com sucesso!');
      }

      setModalExclusao(null);
    } catch (error: any) {
      const mensagem = error.response?.data?.message || error.message;
      if (modalExclusao.tipo === 'contrato') {
        alert(`Erro ao excluir termo: ${mensagem}`);
      } else {
        alert(`Erro ao excluir instituição: ${mensagem}`);
      }
    } finally {
      setExcluindoItem(false);
    }
  };

  const fecharModalLink = () => {
    setMostrarModalLink(false);
    setLinkRevisaoGerado('');
    setLinkRevisaoValidoAte(null);
  };

  const gerarLinkRevisaoComValidade = async (id: number) => {
    setEnviadoLinkRevisao(true);
    try {
      const response = await InstituicaoService.gerarLinkRevisao(id, {
        validadeValor: validadeRevisaoValor,
        validadeUnidade: validadeRevisaoUnidade,
      });
      let url = response.data?.data?.url || '';
      url = url.replace(/(https?:\/\/[^/]+)\/cadastros/, '$1/#/cadastros');
      setLinkRevisaoGerado(url);
      setLinkRevisaoValidoAte(response.data?.data?.validoAte ?? null);
      setMostrarModalLink(true);
      return response;
    } finally {
      setEnviadoLinkRevisao(false);
    }
  };

  const reenviarLinkRevisao = async (id: number) => {
    try {
      await gerarLinkRevisaoComValidade(id);
    } catch (error) {
      alert('Erro ao gerar link de revisão');
    }
  };

  const copiarLinkRevisao = async () => {
    if (linkRevisaoGerado) {
      await navigator.clipboard.writeText(linkRevisaoGerado);
      alert('Link copiado para a área de transferência!');
    }
  };

  const carregarParaRevisao = async (status?: string) => {
    setLoadingRevisao(true);
    try {
      const statusConsulta = (status ?? filtroStatusRevisao) || undefined;
      const response = await InstituicaoService.listarParaRevisao(statusConsulta, {
        termo: termoRevisao,
        instituicao: filtroInstituicaoRevisao,
        responsavel: filtroResponsavelRevisao,
        cnpj: filtroCnpjRevisao,
        cidade: filtroCidadeRevisao,
        estado: filtroEstadoRevisao,
        dataCadastroDe: dataCadastroDeRevisao,
        dataCadastroAte: dataCadastroAteRevisao,
      });
      setPendentes(response.data?.data?.instituicoes ?? []);
    } catch {
      setPendentes([]);
    } finally {
      setLoadingRevisao(false);
    }
  };

  const aprovarInstituicao = async (id: number, isAjuste = false) => {
    const mensagemConfirmacao = isAjuste
      ? 'Confirmar aprovação dos ajustes desta instituição?'
      : 'Confirmar aprovação desta instituição?';
    if (!confirm(mensagemConfirmacao)) return;
    try {
      await InstituicaoService.revisarInstituicao(id, 'APROVADO', undefined);
      carregarParaRevisao(filtroStatusRevisao || undefined);
    } catch (error: any) {
      alert(`Erro ao processar revisão: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    }
  };

  const abrirModal = (id: number, tipo: 'REJEITADO' | 'AJUSTES_SOLICITADOS') => {
    setModalInstId(id);
    setModalTipo(tipo);
    setModalObservacao('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setModalInstId(null);
    setModalObservacao('');
  };

  const confirmarModal = async () => {
    if (!modalInstId) return;
    if (!modalObservacao.trim()) {
      alert('Informe a observação antes de confirmar.');
      return;
    }
    setProcessandoRevisao(true);
    try {
      const response = await InstituicaoService.revisarInstituicao(modalInstId, modalTipo, modalObservacao.trim());
      const cadastroAtualizado = response.data?.data ?? null;
      let falhaAoGerarLink = false;

      if (cadastroAtualizado) {
        setCadastroSelecionado((prev) => (
          prev && prev.id === modalInstId ? { ...prev, ...cadastroAtualizado } : prev
        ));
        setInstituicoes((prev) => prev.map((item) => (
          item.id === modalInstId ? { ...item, ...cadastroAtualizado } : item
        )));
        setPendentes((prev) => prev.map((item) => (
          item.id === modalInstId ? { ...item, ...cadastroAtualizado } : item
        )));
      }

      fecharModal();
      if (modalTipo === 'AJUSTES_SOLICITADOS') {
        try {
          await gerarLinkRevisaoComValidade(modalInstId);
        } catch {
          falhaAoGerarLink = true;
        }
      }

      await Promise.all([
        carregarParaRevisao(filtroStatusRevisao || undefined),
        carregarInstituicoes(),
      ]);

      if (falhaAoGerarLink) {
        alert('Status atualizado com sucesso, mas houve erro ao gerar o link de ajuste.');
      }
    } catch {
      alert('Erro ao processar revisão.');
    } finally {
      setProcessandoRevisao(false);
    }
  };

  const carregarInstituicoes = async () => {
    setLoading(true);
    try {
      const response = await InstituicaoService.listarInstituicoes({
        termo,
        instituicao: filtroInstituicao,
        responsavel: filtroResponsavel,
        cnpj: filtroCnpj,
        numero: filtroNumero,
        complemento: filtroComplemento,
        cidade: filtroCidade,
        estado: filtroEstado,
        statusAtivo: filtroStatusAtivo,
        dataInicioDe,
        dataFimAte,
        page,
        pageSize,
      });

      const payload = response.data?.data;
      setInstituicoes(payload?.instituicoes ?? []);
      setTotal(payload?.total ?? 0);
    } catch {
      setInstituicoes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarInstituicoes();
  }, [page]);

  useEffect(() => {
    localStorage.setItem('instituicoes:columnWidths', JSON.stringify(tableColumnWidths));
  }, [tableColumnWidths]);

  useEffect(() => {
    api.get('/admin-cadastros/publicos-alvo').then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setPublicosAlvo(data.filter((item: any) => item.status));
    }).catch(() => {});
    api.get('/projetos?pageSize=999').then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setProjetos(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const getColumnWidth = (table: TableWidthKey, key: string): string | undefined => {
    const width = tableColumnWidths[table]?.[key];
    return width ? `${width}px` : undefined;
  };

  const handleResizeStart = (
    event: React.MouseEvent,
    table: TableWidthKey,
    key: string,
    defaultWidth: number,
    minWidth: number = 90,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const currentWidth = tableColumnWidths[table]?.[key] ?? defaultWidth;

    resizingRef.current = {
      table,
      key,
      startX: event.clientX,
      startWidth: currentWidth,
      minWidth,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const current = resizingRef.current;
      if (!current) {
        return;
      }

      const deltaX = moveEvent.clientX - current.startX;
      const nextWidth = Math.max(current.minWidth, Math.round(current.startWidth + deltaX));

      setTableColumnWidths((prev) => ({
        ...prev,
        [current.table]: {
          ...(prev[current.table] || {}),
          [current.key]: nextWidth,
        },
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSortTabela = (key: TabelaInstituicoesSortKey) => {
    if (sortTabelaKey === key) {
      setSortTabelaOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortTabelaKey(key);
    setSortTabelaOrder('asc');
  };

  const handleSortRevisao = (key: RevisaoSortKey) => {
    if (sortRevisaoKey === key) {
      setSortRevisaoOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortRevisaoKey(key);
    setSortRevisaoOrder('asc');
  };

  const compareValues = (a: string | number, b: string | number, order: SortOrder): number => {
    const direction = order === 'asc' ? 1 : -1;

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * direction;
    }

    return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base', numeric: true }) * direction;
  };

  const getInstituicaoSortValue = (item: InstituicaoItem, key: TabelaInstituicoesSortKey): string | number => {
    switch (key) {
      case 'instituicao':
        return item.instituicao || '';
      case 'responsavel':
        return item.responsavel || '';
      case 'cnpj':
        return item.cnpj || '';
      case 'numero':
        return item.numero || '';
      case 'complemento':
        return item.complemento || '';
      case 'cidadeUf':
        return `${item.cidade || ''}/${item.estado || ''}`;
      case 'dataInicio':
        return parseDataVigencia(item.dataInicio)?.getTime() ?? 0;
      case 'dataFim':
        return parseDataVigencia(item.dataFim)?.getTime() ?? 0;
      case 'status':
        return getStatusAtividade(item);
      default:
        return '';
    }
  };

  const getRevisaoSortValue = (item: InstituicaoParaRevisao, key: RevisaoSortKey): string | number => {
    switch (key) {
      case 'instituicao':
        return item.instituicao || '';
      case 'cnpj':
        return item.cnpj || '';
      case 'cidadeUf':
        return `${item.cidade || ''}/${item.estado || ''}`;
      case 'dataCadastro':
        return parseDataVigencia(item.dataCriacao)?.getTime() ?? 0;
      case 'revisor':
        return item.revisorNome || item.revisorEmail || '';
      case 'status':
        return item.statusRevisao || '';
      default:
        return '';
    }
  };

  const instituicoesOrdenadas = useMemo(() => {
    const lista = [...instituicoes];
    lista.sort((a, b) => compareValues(getInstituicaoSortValue(a, sortTabelaKey), getInstituicaoSortValue(b, sortTabelaKey), sortTabelaOrder));
    return lista;
  }, [instituicoes, sortTabelaKey, sortTabelaOrder]);

  const pendentesOrdenados = useMemo(() => {
    const lista = [...pendentes];
    lista.sort((a, b) => compareValues(getRevisaoSortValue(a, sortRevisaoKey), getRevisaoSortValue(b, sortRevisaoKey), sortRevisaoOrder));
    return lista;
  }, [pendentes, sortRevisaoKey, sortRevisaoOrder]);

  const renderSortIcon = (active: boolean, order: SortOrder) => {
    if (!active) {
      return <ArrowUpDown size={14} className="opacity-60" />;
    }

    return order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const aplicarFiltros = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await carregarInstituicoes();
  };

  const aplicarFiltrosRevisao = async (e: React.FormEvent) => {
    e.preventDefault();
    await carregarParaRevisao();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Instituições</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cadastro e consulta da base de instituições sociais.</p>
      </div>
      {podeGerarToken && (
        <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Link de acesso ao cadastro para instituições</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Gere um link temporário com tempo limite de cadastro.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ValidadeLinkControl
                label="Expira em"
                valor={validadeTokenValor}
                unidade={validadeTokenUnidade}
                onValorChange={setValidadeTokenValor}
                onUnidadeChange={setValidadeTokenUnidade}
                compact
              />
              <button
                onClick={gerarToken}
                disabled={gerandoToken}
                className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {gerandoToken ? 'Gerando...' : 'Gerar link'}
              </button>
            </div>
          </div>
          {urlCadastro && (
            <>
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                {tokenValidoAte ? `Válido até: ${tokenValidoAte}` : null}
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <code className="flex-1 break-all rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                  {urlCadastro}
                </code>
                <button
                  onClick={copiarUrl}
                  className="shrink-0 px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-900 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setAbaInterna('cadastro')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            abaInterna === 'cadastro'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
          }`}
        >
          Cadastro
        </button>
        <button
          onClick={() => setAbaInterna('tabela')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            abaInterna === 'tabela'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
          }`}
        >
          Tabela de Instituições
        </button>        {podeGerarToken && (
          <button
            onClick={() => { setAbaInterna('revisao'); carregarParaRevisao(filtroStatusRevisao || undefined); }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              abaInterna === 'revisao'
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
            }`}
          >
            Revisão
          </button>
        )}      </div>

      {abaInterna === 'cadastro' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <CadastroInstituicaoCompletoForm onSuccess={carregarInstituicoes} />
        </section>
      )}

      {abaInterna === 'tabela' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Use os filtros apenas quando precisar.</p>
            <button
              type="button"
              onClick={() => setMostrarFiltros((prev) => !prev)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {mostrarFiltros ? 'Fechar filtros' : 'Abrir filtros'}
            </button>
          </div>

          {mostrarFiltros && (
            <form onSubmit={aplicarFiltros} className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Busca geral"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700 md:col-span-2"
              />
              <input
                value={filtroInstituicao}
                onChange={(e) => setFiltroInstituicao(e.target.value)}
                placeholder="Instituição"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroResponsavel}
                onChange={(e) => setFiltroResponsavel(e.target.value)}
                placeholder="Responsável"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroCnpj}
                onChange={(e) => setFiltroCnpj(e.target.value)}
                placeholder="CNPJ"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroNumero}
                onChange={(e) => setFiltroNumero(e.target.value)}
                placeholder="Número"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroComplemento}
                onChange={(e) => setFiltroComplemento(e.target.value)}
                placeholder="Complemento"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroCidade}
                onChange={(e) => setFiltroCidade(e.target.value)}
                placeholder="Cidade"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                placeholder="UF"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <select
                value={filtroStatusAtivo}
                onChange={(e) => setFiltroStatusAtivo(e.target.value as 'ATIVO' | 'INATIVO' | '')}
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">Status: todos</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Data início</span>
                <input
                  type="date"
                  value={dataInicioDe}
                  onChange={(e) => setDataInicioDe(e.target.value)}
                  title="Data início"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Data fim</span>
                <input
                  type="date"
                  value={dataFimAte}
                  onChange={(e) => setDataFimAte(e.target.value)}
                  title="Data fim"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </label>
              <button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 md:col-span-4 md:w-fit">
                Aplicar filtros
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-[1280px]" style={{ width: 'max-content' }}>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-sm text-slate-600 dark:text-slate-300">
                  <th style={{ width: getColumnWidth('tabela', 'instituicao') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('instituicao')} className="inline-flex items-center gap-1 pr-2">
                      Instituição {renderSortIcon(sortTabelaKey === 'instituicao', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Instituição" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'instituicao', 220)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'responsavel') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('responsavel')} className="inline-flex items-center gap-1 pr-2">
                      Responsável {renderSortIcon(sortTabelaKey === 'responsavel', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Responsável" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'responsavel', 180)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'cnpj') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('cnpj')} className="inline-flex items-center gap-1 pr-2">
                      CNPJ {renderSortIcon(sortTabelaKey === 'cnpj', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna CNPJ" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'cnpj', 150)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'numero') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('numero')} className="inline-flex items-center gap-1 pr-2">
                      Número {renderSortIcon(sortTabelaKey === 'numero', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Número" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'numero', 110)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'complemento') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('complemento')} className="inline-flex items-center gap-1 pr-2">
                      Complemento {renderSortIcon(sortTabelaKey === 'complemento', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Complemento" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'complemento', 150)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'cidadeUf') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('cidadeUf')} className="inline-flex items-center gap-1 pr-2">
                      Cidade/UF {renderSortIcon(sortTabelaKey === 'cidadeUf', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Cidade/UF" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'cidadeUf', 150)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'dataInicio') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('dataInicio')} className="inline-flex items-center gap-1 pr-2">
                      Data Início {renderSortIcon(sortTabelaKey === 'dataInicio', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Data Início" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'dataInicio', 130)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'dataFim') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('dataFim')} className="inline-flex items-center gap-1 pr-2">
                      Data Fim {renderSortIcon(sortTabelaKey === 'dataFim', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Data Fim" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'dataFim', 130)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('tabela', 'status') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortTabela('status')} className="inline-flex items-center gap-1 pr-2">
                      Status {renderSortIcon(sortTabelaKey === 'status', sortTabelaOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Status" onMouseDown={(e) => handleResizeStart(e, 'tabela', 'status', 100)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-5 text-sm text-slate-500">Carregando instituições...</td>
                  </tr>
                ) : instituicoes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-5 text-sm text-slate-500">Nenhum registro encontrado com os filtros informados.</td>
                  </tr>
                ) : (
                  instituicoesOrdenadas.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 text-sm">
                      <td className="px-3 py-2">{item.instituicao}</td>
                      <td className="px-3 py-2">{item.responsavel || '-'}</td>
                      <td className="px-3 py-2">{item.cnpj || '-'}</td>
                      <td className="px-3 py-2">{item.numero || '-'}</td>
                      <td className="px-3 py-2">{item.complemento || '-'}</td>
                      <td className="px-3 py-2">{item.cidade || '-'}{item.estado ? `/${item.estado}` : ''}</td>
                      <td className="px-3 py-2">{formatarDataLocalPtBr(item.dataInicio)}</td>
                      <td className="px-3 py-2">{formatarDataLocalPtBr(item.dataFim)}</td>
                      <td className="px-3 py-2">
                        {getStatusAtividade(item) === 'ATIVO' ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirModalDetalhes(item as unknown as InstituicaoParaRevisao)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Ver cadastro
                          </button>
                          <button
                            onClick={() => abrirModalContratos(item)}
                            className="rounded-lg border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                          >
                            Termos
                          </button>
                          {podeExcluirInstituicao && (
                            <button
                              onClick={() => excluirInstituicao(item)}
                              className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>
              Total: {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
              >
                Anterior
              </button>
              <span>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {abaInterna === 'revisao' && podeGerarToken && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { valor: '', label: 'Todos' },
              { valor: 'PENDENTE', label: 'Pendentes' },
              { valor: 'APROVADO', label: 'Aprovados' },
              { valor: 'REJEITADO', label: 'Rejeitados' },
              { valor: 'AJUSTES_SOLICITADOS', label: 'Ajustes solicitados' },
            ].map(({ valor, label }) => (
              <button
                key={valor}
                onClick={() => { setFiltroStatusRevisao(valor); carregarParaRevisao(valor || undefined); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filtroStatusRevisao === valor
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Filtros da revisão por cadastro.</p>
            <button
              type="button"
              onClick={() => setMostrarFiltrosRevisao((prev) => !prev)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {mostrarFiltrosRevisao ? 'Fechar filtros' : 'Abrir filtros'}
            </button>
          </div>

          {mostrarFiltrosRevisao && (
            <form onSubmit={aplicarFiltrosRevisao} className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={termoRevisao}
                onChange={(e) => setTermoRevisao(e.target.value)}
                placeholder="Busca geral"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700 md:col-span-2"
              />
              <input
                value={filtroInstituicaoRevisao}
                onChange={(e) => setFiltroInstituicaoRevisao(e.target.value)}
                placeholder="Instituição"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroResponsavelRevisao}
                onChange={(e) => setFiltroResponsavelRevisao(e.target.value)}
                placeholder="Responsável"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroCnpjRevisao}
                onChange={(e) => setFiltroCnpjRevisao(e.target.value)}
                placeholder="CNPJ"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroCidadeRevisao}
                onChange={(e) => setFiltroCidadeRevisao(e.target.value)}
                placeholder="Cidade"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                value={filtroEstadoRevisao}
                onChange={(e) => setFiltroEstadoRevisao(e.target.value)}
                placeholder="UF"
                className="rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
              />
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Cadastro de</span>
                <input
                  type="date"
                  value={dataCadastroDeRevisao}
                  onChange={(e) => setDataCadastroDeRevisao(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Cadastro até</span>
                <input
                  type="date"
                  value={dataCadastroAteRevisao}
                  onChange={(e) => setDataCadastroAteRevisao(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
                />
              </label>
              <button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 md:col-span-4 md:w-fit">
                Aplicar filtros
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-[900px]" style={{ width: 'max-content' }}>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-sm text-slate-600 dark:text-slate-300">
                  <th style={{ width: getColumnWidth('revisao', 'instituicao') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortRevisao('instituicao')} className="inline-flex items-center gap-1 pr-2">
                      Instituição {renderSortIcon(sortRevisaoKey === 'instituicao', sortRevisaoOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Instituição revisão" onMouseDown={(e) => handleResizeStart(e, 'revisao', 'instituicao', 220)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('revisao', 'cnpj') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortRevisao('cnpj')} className="inline-flex items-center gap-1 pr-2">
                      CNPJ {renderSortIcon(sortRevisaoKey === 'cnpj', sortRevisaoOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna CNPJ revisão" onMouseDown={(e) => handleResizeStart(e, 'revisao', 'cnpj', 150)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('revisao', 'cidadeUf') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortRevisao('cidadeUf')} className="inline-flex items-center gap-1 pr-2">
                      Cidade/UF {renderSortIcon(sortRevisaoKey === 'cidadeUf', sortRevisaoOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Cidade/UF revisão" onMouseDown={(e) => handleResizeStart(e, 'revisao', 'cidadeUf', 150)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('revisao', 'dataCadastro') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortRevisao('dataCadastro')} className="inline-flex items-center gap-1 pr-2">
                      Data Cadastro {renderSortIcon(sortRevisaoKey === 'dataCadastro', sortRevisaoOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Data Cadastro revisão" onMouseDown={(e) => handleResizeStart(e, 'revisao', 'dataCadastro', 130)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('revisao', 'revisor') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortRevisao('revisor')} className="inline-flex items-center gap-1 pr-2">
                      Revisor {renderSortIcon(sortRevisaoKey === 'revisor', sortRevisaoOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Revisor revisão" onMouseDown={(e) => handleResizeStart(e, 'revisao', 'revisor', 180)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('revisao', 'status') }} className="relative px-3 py-2">
                    <button type="button" onClick={() => handleSortRevisao('status')} className="inline-flex items-center gap-1 pr-2">
                      Status {renderSortIcon(sortRevisaoKey === 'status', sortRevisaoOrder)}
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Status revisão" onMouseDown={(e) => handleResizeStart(e, 'revisao', 'status', 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loadingRevisao ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-5 text-sm text-slate-500">Carregando...</td>
                  </tr>
                ) : pendentes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-5 text-sm text-slate-500">Nenhum cadastro encontrado.</td>
                  </tr>
                ) : (
                  pendentesOrdenados.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 text-sm">
                      <td className="px-3 py-2 font-medium">{item.instituicao}</td>
                      <td className="px-3 py-2">{item.cnpj || '-'}</td>
                      <td className="px-3 py-2">{item.cidade || '-'}{item.estado ? `/${item.estado}` : ''}</td>
                      <td className="px-3 py-2">{new Date(item.dataCriacao).toLocaleDateString('pt-BR')}</td>
                      <td className="px-3 py-2 text-xs">{item.revisorNome || '-'} {item.dataRevisao ? `(${new Date(item.dataRevisao).toLocaleDateString('pt-BR')})` : ''}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.statusRevisao} />
                          {item.statusRevisao === 'PENDENTE' && isCadastroAjuste(item) && (
                            <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Ajustes
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {item.statusRevisao === 'PENDENTE' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => abrirModalDetalhes(item)}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Ver cadastro
                            </button>
                            <button
                              onClick={() => aprovarInstituicao(item.id, isCadastroAjuste(item))}
                              className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              {isCadastroAjuste(item) ? 'Aprovar ajustes' : 'Aprovar'}
                            </button>
                            <button
                              onClick={() => abrirModal(item.id, 'AJUSTES_SOLICITADOS')}
                              className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600"
                            >
                              Solicitar ajustes
                            </button>
                            <button
                              onClick={() => abrirModal(item.id, 'REJEITADO')}
                              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Rejeitar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => abrirModalDetalhes(item)}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Ver cadastro
                            </button>
                            <span className="text-xs text-slate-400 italic">
                              {(item.observacoesRevisao || '').replace(marcadorAjuste, '').trim() || '—'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalDetalhesAberto && cadastroSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={fecharModalDetalhes}>
          <div
            className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Cadastro Completo da Instituição</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {modoEdicao ? 'Edite as informações e clique em Salvar alterações.' : 'Confira todas as informações antes de aprovar, rejeitar ou solicitar ajustes.'}
                </p>
              </div>
              <button
                onClick={fecharModalDetalhes}
                title="Fechar"
                aria-label="Fechar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-6 flex w-full flex-col gap-2 md:items-end">
              <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
                {!modoEdicao && (
                  <div className="flex w-full flex-col gap-2 md:w-auto md:max-w-[760px] md:flex-row md:flex-wrap md:items-end md:justify-end">
                    {podeGerarToken ? (
                      <div className="w-full md:w-auto">
                        <ValidadeLinkControl
                          label="Expira em"
                          valor={validadeRevisaoValor}
                          unidade={validadeRevisaoUnidade}
                          onValorChange={setValidadeRevisaoValor}
                          onUnidadeChange={setValidadeRevisaoUnidade}
                          compact
                        />
                      </div>
                    ) : null}

                    {cadastroSelecionado.statusRevisao === 'APROVADO' && podeRevisarInstituicao ? (
                      <button
                        onClick={() => abrirModal(cadastroSelecionado.id, 'AJUSTES_SOLICITADOS')}
                        className="h-10 w-full rounded-lg bg-amber-500 px-3 text-sm font-medium text-white hover:bg-amber-600 md:w-auto"
                      >
                        Solicitar ajustes
                      </button>
                    ) : null}

                    {podeGerarToken ? (
                      <button
                        onClick={() => reenviarLinkRevisao(cadastroSelecionado.id)}
                        disabled={enviadoLinkRevisao}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60 md:w-auto"
                      >
                        <Link2 size={16} />
                        {enviadoLinkRevisao ? 'Gerando...' : 'Reenviar link para ajustes'}
                      </button>
                    ) : null}

                    {podeEditarInstituicao ? (
                      <button
                        onClick={iniciarEdicao}
                        title="Editar instituição"
                        aria-label="Editar instituição"
                        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-500 px-3 text-white hover:bg-blue-600 md:w-10 md:px-0"
                      >
                        <Pencil size={18} />
                      </button>
                    ) : null}

                    {cadastroSelecionado.statusRevisao !== 'APROVADO' && podeRevisarInstituicao ? (
                      <button
                        onClick={() => reabrirRevisao(cadastroSelecionado.id)}
                        disabled={reabrindoRevisao}
                        className="h-10 w-full rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 md:w-auto"
                      >
                        {reabrindoRevisao ? 'Reabrindo...' : 'Reabrir'}
                      </button>
                    ) : null}
                  </div>
                )}
                {modoEdicao && (
                  <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                    <button
                      onClick={salvarAlteracoes}
                      disabled={salvandoAlteracoes}
                      className="w-full rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 md:w-auto"
                    >
                      {salvandoAlteracoes ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                    <button
                      onClick={cancelarEdicao}
                      className="w-full rounded-lg bg-slate-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600 md:w-auto"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
              {isCadastroAjuste(cadastroSelecionado) && (
                <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  Este cadastro é um reenvio de ajustes da instituição e requer nova aprovação.
                </div>
              )}
              {modoEdicao ? (
                <>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Instituição</label>
                    <input
                      type="text"
                      value={cadastroEditado?.instituicao || ''}
                      onChange={(e) => atualizarCampoEdicao('instituicao', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Responsável principal</label>
                    <input
                      type="text"
                      value={cadastroEditado?.responsavel || ''}
                      onChange={(e) => atualizarCampoEdicao('responsavel', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">CNPJ</label>
                    <input
                      type="text"
                      value={cadastroEditado?.cnpj || ''}
                      onChange={(e) => atualizarCampoEdicao('cnpj', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  {usuario?.perfil === 'ADMIN' && (
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-200">Valor monetário de termo</label>
                      <input
                        type="number"
                        value={cadastroEditado?.valorMonetarioPrevisto ?? ''}
                        onChange={(e) => atualizarCampoEdicao('valorMonetarioPrevisto', e.target.value !== '' ? parseFloat(e.target.value) : null)}
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">CEP</label>
                    <input
                      type="text"
                      value={cadastroEditado?.cep || ''}
                      onChange={(e) => atualizarCampoEdicao('cep', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Logradouro</label>
                    <input
                      type="text"
                      value={cadastroEditado?.logradouro || ''}
                      onChange={(e) => atualizarCampoEdicao('logradouro', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Número</label>
                    <input
                      type="text"
                      value={cadastroEditado?.numero || ''}
                      onChange={(e) => atualizarCampoEdicao('numero', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Complemento</label>
                    <input
                      type="text"
                      value={cadastroEditado?.complemento || ''}
                      onChange={(e) => atualizarCampoEdicao('complemento', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Bairro</label>
                    <input
                      type="text"
                      value={cadastroEditado?.bairro || ''}
                      onChange={(e) => atualizarCampoEdicao('bairro', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Cidade</label>
                    <input
                      type="text"
                      value={cadastroEditado?.cidade || ''}
                      onChange={(e) => atualizarCampoEdicao('cidade', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Estado</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={cadastroEditado?.estado || ''}
                      onChange={(e) => atualizarCampoEdicao('estado', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Dia do pagamento</label>
                    <input
                      type="text"
                      value={cadastroEditado?.prazoPagamento || ''}
                      onChange={(e) => atualizarCampoEdicao('prazoPagamento', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Descrição</label>
                    <textarea
                      value={cadastroEditado?.descricao || ''}
                      onChange={(e) => atualizarCampoEdicao('descricao', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Histórico e finalidade da OSC</label>
                    <textarea
                      value={cadastroEditado?.historicoFinalidadeOsc || ''}
                      onChange={(e) => atualizarCampoEdicao('historicoFinalidadeOsc', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Principais ações desenvolvidas</label>
                    <textarea
                      value={cadastroEditado?.principaisAcoesProponente || ''}
                      onChange={(e) => atualizarCampoEdicao('principaisAcoesProponente', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Público-alvo</label>
                    <textarea
                      value={cadastroEditado?.publicoAlvoProponente || ''}
                      onChange={(e) => atualizarCampoEdicao('publicoAlvoProponente', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Região de alcance (bairros)</label>
                    <textarea
                      value={cadastroEditado?.regiaoAlcanceBairros || ''}
                      onChange={(e) => atualizarCampoEdicao('regiaoAlcanceBairros', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 min-h-[80px]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200">Infraestrutura do proponente</label>
                    <textarea
                      value={cadastroEditado?.infraestruturaProponente || ''}
                      onChange={(e) => atualizarCampoEdicao('infraestruturaProponente', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded dark:bg-slate-800 dark:border-slate-700 min-h-[80px]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div><span className="font-semibold">Instituição:</span> {cadastroSelecionado.instituicao}</div>
                  <div><span className="font-semibold">Responsável principal:</span> {cadastroSelecionado.responsavel || '-'}</div>
                  <div><span className="font-semibold">CNPJ:</span> {cadastroSelecionado.cnpj || '-'}</div>
                  {cadastroSelecionado.valorMonetarioPrevisto && (
                    <div><span className="font-semibold">Valor monetário de termo:</span> R$ {cadastroSelecionado.valorMonetarioPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  )}
                  {cadastroSelecionado.revisorNome && (
                    <div><span className="font-semibold">Revisor:</span> {cadastroSelecionado.revisorNome}</div>
                  )}
                  {cadastroSelecionado.dataRevisao && (
                    <div><span className="font-semibold">Data revisão:</span> {new Date(cadastroSelecionado.dataRevisao).toLocaleDateString('pt-BR')}</div>
                  )}
                  {cadastroSelecionado.motivoRejeicao && (
                    <div className="md:col-span-2"><span className="font-semibold">Motivo da rejeição:</span> {cadastroSelecionado.motivoRejeicao}</div>
                  )}
                  <div><span className="font-semibold">CEP:</span> {cadastroSelecionado.cep || '-'}</div>
                  <div><span className="font-semibold">Logradouro:</span> {cadastroSelecionado.logradouro || '-'}</div>
                  <div><span className="font-semibold">Número:</span> {cadastroSelecionado.numero || '-'}</div>
                  <div><span className="font-semibold">Complemento:</span> {cadastroSelecionado.complemento || '-'}</div>
                  <div><span className="font-semibold">Bairro:</span> {cadastroSelecionado.bairro || '-'}</div>
                  <div><span className="font-semibold">Cidade/UF:</span> {cadastroSelecionado.cidade || '-'}{cadastroSelecionado.estado ? `/${cadastroSelecionado.estado}` : ''}</div>
                  <div><span className="font-semibold">Dia do pagamento:</span> {cadastroSelecionado.prazoPagamento || '-'}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Descrição:</span> {cadastroSelecionado.descricao || '-'}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Histórico e finalidade da OSC:</span> {cadastroSelecionado.historicoFinalidadeOsc || '-'}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Principais ações desenvolvidas:</span> {cadastroSelecionado.principaisAcoesProponente || '-'}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Público-alvo:</span> {cadastroSelecionado.publicoAlvoProponente || '-'}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Região de alcance (bairros):</span> {cadastroSelecionado.regiaoAlcanceBairros || '-'}</div>
                  <div className="md:col-span-2"><span className="font-semibold">Infraestrutura do proponente:</span> {cadastroSelecionado.infraestruturaProponente || '-'}</div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Responsável da Instituição</h4>
                {modoEdicao ? renderCamposResponsavelEdicao('responsaveis') : (() => {
                  const ri = cadastroSelecionado.responsaveis?.[0];
                  if (!ri) return <p className="text-sm text-slate-500">Não informado.</p>;
                  return (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">Nome:</span> {ri.representante || '-'}</p>
                      <p><span className="font-semibold">CPF:</span> {ri.cpf || '-'}</p>
                      <p><span className="font-semibold">RG:</span> {ri.rg || '-'}</p>
                      <p><span className="font-semibold">Órgão expedidor:</span> {ri.orgaoExpedidor || '-'}</p>
                      <p><span className="font-semibold">Cargo:</span> {ri.cargo || '-'}</p>
                      <p><span className="font-semibold">Mandato:</span> {ri.mandato || '-'}</p>
                      <p><span className="font-semibold">Endereço:</span> {ri.endereco || '-'}</p>
                      <p><span className="font-semibold">Contato principal:</span> {ri.contato || '-'}</p>
                      <p><span className="font-semibold">Contato 2:</span> {ri.contato2 || '-'}</p>
                      <p><span className="font-semibold">Contato 3:</span> {ri.contato3 || '-'}</p>
                      <p><span className="font-semibold">Email:</span> {ri.email || '-'}</p>
                    </div>
                  );
                })()}
              </section>

              <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Responsável Técnico</h4>
                {modoEdicao ? renderCamposResponsavelEdicao('responsaveisTecnicos') : (() => {
                  const rt = cadastroSelecionado.responsaveisTecnicos?.[0];
                  if (!rt) return <p className="text-sm text-slate-500">Não informado.</p>;
                  return (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">Nome:</span> {rt.representante || '-'}</p>
                      <p><span className="font-semibold">CPF:</span> {rt.cpf || '-'}</p>
                      <p><span className="font-semibold">RG:</span> {rt.rg || '-'}</p>
                      <p><span className="font-semibold">Órgão expedidor:</span> {rt.orgaoExpedidor || '-'}</p>
                      <p><span className="font-semibold">Cargo:</span> {rt.cargo || '-'}</p>
                      <p><span className="font-semibold">Mandato:</span> {rt.mandato || '-'}</p>
                      <p><span className="font-semibold">Endereço:</span> {rt.endereco || '-'}</p>
                      <p><span className="font-semibold">Contato principal:</span> {rt.contato || '-'}</p>
                      <p><span className="font-semibold">Contato 2:</span> {rt.contato2 || '-'}</p>
                      <p><span className="font-semibold">Contato 3:</span> {rt.contato3 || '-'}</p>
                      <p><span className="font-semibold">Email:</span> {rt.email || '-'}</p>
                    </div>
                  );
                })()}
              </section>
            </div>
          </div>
        </div>
      )}

      {modalContratosAberto && instituicaoContratosSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={fecharModalContratos}>
          <div
            className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Termos da Instituição</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{instituicaoContratosSelecionada.instituicao}</p>
              </div>
              <button
                onClick={fecharModalContratos}
                title="Fechar"
                aria-label="Fechar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                {novoContrato.id ? `Editando termo ${novoContrato.numeroContrato}` : 'Anexar novo termo'}
              </h4>
              <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
                As datas de início e fim da vigência e do termo com a empresa são as mesmas.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Número do termo</span>
                  <input
                    type="text"
                    value={novoContrato.numeroContrato}
                    onChange={(e) => setNovoContrato((prev) => ({ ...prev, numeroContrato: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Anexo do termo</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setNovoContrato((prev) => ({ ...prev, contratoFile: e.target.files?.[0] ?? null }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  {novoContrato.id && !novoContrato.contratoFile && novoContrato.termoAnexo ? (
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">Mantendo anexo atual.</span>
                  ) : null}
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Data início (vigência/empresa)</span>
                  <input
                    type="date"
                    value={novoContrato.dataInicio}
                    onChange={(e) => setNovoContrato((prev) => ({ ...prev, dataInicio: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Data fim (vigência/empresa)</span>
                  <input
                    type="date"
                    value={novoContrato.dataFim}
                    onChange={(e) => setNovoContrato((prev) => ({ ...prev, dataFim: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <label className="md:col-span-2 space-y-1">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Descrição</span>
                  <textarea
                    value={novoContrato.descricao}
                    onChange={(e) => setNovoContrato((prev) => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Público-alvo</span>
                  <div className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    {publicosAlvo.find((pa) => String(pa.id) === String(novoContrato.publicoAlvoId))?.nome || '-'}
                  </div>
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Projeto que atende</span>
                  <select
                    value={novoContrato.projetoId}
                    onChange={(e) => {
                      const projetoId = e.target.value;
                      const projeto = projetos.find((p) => String(p.id) === String(projetoId));
                      let paId = '';
                      if (projeto && projeto.publicoAlvo) {
                        const pa = publicosAlvo.find((pa) => pa.nome === projeto.publicoAlvo);
                        if (pa) paId = String(pa.id);
                      }
                      setNovoContrato((prev) => ({ ...prev, projetoId, publicoAlvoId: paId }));
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">Selecione...</option>
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </label>
                <div className="md:col-span-2 space-y-2">
                  <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">Obra(s) atendida(s)</span>
                  {loadingObrasContrato ? (
                    <p className="text-sm text-slate-500">Carregando obras...</p>
                  ) : obrasDisponiveis.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma obra disponível.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                      {obrasDisponiveis.map((obra) => (
                        <label key={obra.id} className="flex items-center gap-2 py-1 text-sm text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={novoContrato.obraIds.includes(obra.id)}
                            onChange={() => toggleObraContrato(obra.id)}
                          />
                          <span>{obra.codigoObra ? `${obra.codigoObra} - ` : ''}{obra.nomeObra}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {!novoContrato.id ? (
                <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={cadastroMultiploContratos}
                    onChange={(e) => setCadastroMultiploContratos(e.target.checked)}
                  />
                  Cadastro múltiplo: após salvar, manter datas e obras para incluir vários termos.
                </label>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                {novoContrato.id ? (
                  <button
                    onClick={cancelarEdicaoContrato}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancelar edição
                  </button>
                ) : null}
                <button
                  onClick={salvarNovoContrato}
                  disabled={salvandoContrato}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {salvandoContrato ? 'Salvando...' : novoContrato.id ? 'Salvar alterações' : 'Salvar contrato'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Termos cadastrados</h4>
              {loadingContratos ? (
                <p className="text-sm text-slate-500">Carregando Termos...</p>
              ) : contratosInstituicao.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum termo cadastrado para esta instituição.</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Termos ativos</h5>
                    <div className="space-y-3">
                      {contratosInstituicao
                        .filter((contrato) => (contrato.statusAtividade ? contrato.statusAtividade === 'ATIVO' : isContratoAtivo(contrato)))
                        .map((contrato) => renderContratoCard(contrato, true))}
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Histórico de termos inativos</h5>
                    {contratosInstituicao.filter((contrato) => (contrato.statusAtividade ? contrato.statusAtividade === 'INATIVO' : !isContratoAtivo(contrato))).length === 0 ? (
                      <p className="text-sm text-slate-500">Nenhum termo inativo no histórico.</p>
                    ) : (
                      <div className="space-y-3">
                        {contratosInstituicao
                          .filter((contrato) => (contrato.statusAtividade ? contrato.statusAtividade === 'INATIVO' : !isContratoAtivo(contrato)))
                          .map((contrato) => renderContratoCard(contrato, false))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={fecharModalExclusao}>
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Confirmar exclusão</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{modalExclusao.descricao}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={fecharModalExclusao}
                disabled={excluindoItem}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                disabled={excluindoItem}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {excluindoItem ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}



      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={fecharModal}>
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {modalTipo === 'REJEITADO' ? 'Rejeitar Instituição' : 'Solicitar Ajustes'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {modalTipo === 'REJEITADO'
                ? 'Informe o motivo da rejeição. Esta informação ficará registrada.'
                : 'Descreva os ajustes necessários para que a instituição corrija o cadastro.'}
            </p>
            <textarea
              value={modalObservacao}
              onChange={(e) => setModalObservacao(e.target.value)}
              placeholder="Observações..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-sm resize-none mb-4"
            />
            {modalTipo === 'AJUSTES_SOLICITADOS' ? (
              <div className="mb-4">
                <ValidadeLinkControl
                  label="Validade do link de ajuste"
                  valor={validadeRevisaoValor}
                  unidade={validadeRevisaoUnidade}
                  onValorChange={setValidadeRevisaoValor}
                  onUnidadeChange={setValidadeRevisaoUnidade}
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                onClick={fecharModal}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarModal}
                disabled={processandoRevisao}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 ${
                  modalTipo === 'REJEITADO' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {processandoRevisao ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalLink && linkRevisaoGerado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={fecharModalLink}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Link de Revisão Gerado</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Compartilhe este link para que o fornecedor possa revisar e atualizar os dados:</p>
            {linkRevisaoValidoAte ? (
              <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">Válido até {linkRevisaoValidoAte}</p>
            ) : null}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4 break-all">
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300 word-break">{linkRevisaoGerado}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copiarLinkRevisao}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Copiar Link
              </button>
              <button
                onClick={fecharModalLink}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
