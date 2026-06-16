import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NotaFiscalService } from '@/services/NotaFiscalService';
import { InstituicaoService } from '@/services/InstituicaoService';
import { NotaFiscal } from '@/types';
import { ClassificacaoService, ObraService, ProgramaService, ProjetoService } from '@/services';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckSquare, ChevronDown, ChevronUp, Download, FileSpreadsheet, Plus, Save, Square, Trash2, Upload, X } from 'lucide-react';

type SortOrder = 'asc' | 'desc';
type NotaFiscalSortKey =
  | 'codDocumento'
  | 'razaoSocial'
  | 'periodo'
  | 'localizacao'
  | 'actionCode'
  | 'valor'
  | 'unidadeNegocio'
  | 'orcadoNaoOrcado'
  | 'programa'
  | 'instituicao'
  | 'projeto'
  | 'classificacaoProjetoAtt'
  | 'status'
  | 'pendencia';

type NotaFiscalDashboardFilters = {
  programa: string[];
  classificacao: string[];
  orcadoNaoOrcado: string[];
  obraId: string[];
  projeto: string[];
  dataInicio: string;
  dataFim: string;
};

const createDefaultFilters = (): NotaFiscalDashboardFilters => ({
  programa: [],
  classificacao: [],
  orcadoNaoOrcado: [],
  obraId: [],
  projeto: [],
  dataInicio: '',
  dataFim: '',
});

type SearchableOption = {
  value: string;
  label: string;
};

type SearchableFilterFieldProps = {
  label: string;
  placeholder: string;
  values: string[];
  options: SearchableOption[];
  onChange: (values: string[]) => void;
  clearLabel?: string;
  selectAllLabel?: string;
  compact?: boolean;
  mini?: boolean;
};

type ClassificacaoForm = {
  orcadoNaoOrcado: string;
  programa: string;
  instituicao: string;
  projeto: string;
  classificacaoProjetoAtt: string;
  historico: string;
  unidadeNegocio: string;
  dataPagamento: string;
  razaoSocial: string;
  valor: string;
  codDocumento: string;
  observacoes: string;
  publicoAlvo: string;
  classe: string;
  classificacaoConta: string;
};

type InlineEditFields = {
  unidadeNegocio: string;
  orcadoNaoOrcado: string;
  programa: string;
  instituicao: string;
  projeto: string;
  classificacaoProjetoAtt: string;
  classe: string;
  classificacaoConta: string;
};

const formatDateLabel = (raw?: string): string => {
  if (!raw) {
    return '';
  }

  const [year, month, day] = raw.split('-');
  if (!year || !month || !day) {
    return raw;
  }

  return `${day}/${month}/${year}`;
};

const SearchableFilterField: React.FC<SearchableFilterFieldProps> = ({
  label,
  placeholder,
  values,
  options,
  onChange,
  clearLabel = 'Limpar seleção',
  selectAllLabel = 'Selecionar todos',
  compact = false,
  mini = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(values), [values]);

  const selectedLabels = useMemo(
    () => options.filter((item) => selectedSet.has(item.value)).map((item) => item.label),
    [options, selectedSet],
  );

  const selectedSummary = useMemo(() => {
    if (selectedLabels.length === 0) {
      return '';
    }

    if (selectedLabels.length === 1) {
      return selectedLabels[0];
    }

    return `${selectedLabels.length} selecionados`;
  }, [selectedLabels]);

  const toggleValue = (currentValue: string) => {
    if (selectedSet.has(currentValue)) {
      onChange(values.filter((item) => item !== currentValue));
      setQuery('');
      return;
    }

    onChange([...values, currentValue]);
    setQuery('');
  };

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return options;
    }

    return options.filter((item) => item.label.toLowerCase().includes(term));
  }, [options, query]);

  const labelClass = mini ? 'mb-0.5 text-[11px]' : compact ? 'mb-1 text-xs' : 'mb-2 text-sm';
  const inputClass = mini ? 'h-7 px-1.5 text-[11px]' : compact ? 'h-8 px-2 text-xs' : 'px-3 py-2 text-sm';
  const optionClass = mini ? 'px-1.5 py-1 text-[11px]' : compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm';
  const checkClass = mini ? 'h-3.5 w-3.5 text-[10px]' : compact ? 'h-3.5 w-3.5 text-[10px]' : 'h-4 w-4 text-xs';
  const actionClass = mini ? 'px-1.5 py-1 text-[11px]' : compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div className="relative min-w-0">
      <label className={`${labelClass} block font-medium text-gray-700 dark:text-gray-300`}>{label}</label>
      <input
        type="text"
        value={isOpen ? query : selectedSummary}
        onFocus={() => {
          setIsOpen(true);
          setQuery('');
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setIsOpen(false);
            setQuery('');
          }, 120);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const normalized = query.trim().toLowerCase();
            const exact = options.find((item) => item.label.toLowerCase() === normalized);
            if (exact) {
              toggleValue(exact.value);
              setQuery('');
            }
          }

          if (e.key === 'Escape') {
            setIsOpen(false);
            setQuery('');
          }
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-300 bg-white text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white ${inputClass}`}
      />

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
          <div className="flex flex-col border-b border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange([]);
                setQuery('');
              }}
              className={`w-full text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 ${actionClass}`}
            >
              {clearLabel}
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(Array.from(new Set(options.map((item) => item.value))));
                setQuery('');
              }}
              className={`w-full text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 ${actionClass}`}
            >
              {selectAllLabel}
            </button>
          </div>

          {filteredOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleValue(item.value);
              }}
              className={`flex w-full items-center gap-2 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 ${optionClass}`}
            >
              <span
                className={`inline-flex items-center justify-center rounded border ${checkClass} ${
                  selectedSet.has(item.value)
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-slate-400 text-transparent dark:border-slate-500'
                }`}
              >
                ✓
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {filteredOptions.length === 0 && (
            <div className={`${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} text-slate-500 dark:text-slate-400`}>Nenhuma opção encontrada</div>
          )}
        </div>
      )}
    </div>
  );
};

const emptyClassificacaoForm: ClassificacaoForm = {
  orcadoNaoOrcado: '',
  programa: '',
  instituicao: '',
  projeto: '',
  classificacaoProjetoAtt: '',
  historico: '',
  unidadeNegocio: '',
  dataPagamento: '',
  razaoSocial: '',
  valor: '',
  codDocumento: '',
  observacoes: '',
  publicoAlvo: '',
  classe: '',
  classificacaoConta: '',
};

export const NotasFiscais: React.FC = () => {
  const { usuario } = useAuthStore();
  const {
    sidebarOpen,
    dashboardSideFilterExpanded,
    toggleDashboardSideFilterExpanded,
  } = useUIStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOption, setPageSizeOption] = useState('10');
  const [customPageSize, setCustomPageSize] = useState('10');
  const [filters, setFilters] = useState<NotaFiscalDashboardFilters>(() => createDefaultFilters());
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showClassificarModal, setShowClassificarModal] = useState(false);
  const [classificarEmLote, setClassificarEmLote] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [classificacaoForm, setClassificacaoForm] = useState<ClassificacaoForm>(emptyClassificacaoForm);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [inlineEditFieldsByRow, setInlineEditFieldsByRow] = useState<Record<number, InlineEditFields>>({});
  const [sortBy, setSortBy] = useState<NotaFiscalSortKey>('codDocumento');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('notas-fiscais:columnWidths');
      if (!saved) {
        return {};
      }

      const parsed = JSON.parse(saved) as Record<string, number>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    numeroNF: '',
    fornecedor: '',
    cnpj: '',
    valor: 0,
    dataEmissao: '',
    obraId: 1,
    actionCode: 10,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notas-fiscais', page, pageSize, filters],
    queryFn: async () => {
      const response = await NotaFiscalService.getAll(page, pageSize, filters);
      return response.data;
    },
  });

  const { data: obrasAtivasData } = useQuery({
    queryKey: ['obras-ativas-para-nf'],
    queryFn: async () => {
      const response = await ObraService.getAll(1, 100000, { status: 'active' });
      return response.data;
    },
  });

  const { data: projetosAtivosData } = useQuery({
    queryKey: ['projetos-ativos-para-nf'],
    queryFn: async () => {
      const response = await ProjetoService.getAll(1, 100000, {
        status: 'active',
        sortBy: 'nome',
        sortOrder: 'asc',
      });
      return response.data;
    },
  });

  const { data: programasAtivosData } = useQuery({
    queryKey: ['programas-ativos-para-nf'],
    queryFn: async () => {
      const response = await ProgramaService.getAll(1, 100000, {
        status: 'active',
        sortBy: 'nome',
        sortOrder: 'asc',
      });
      return response.data;
    },
  });

  const { data: classificacoesAtivasData } = useQuery({
    queryKey: ['classificacoes-ativas-para-nf'],
    queryFn: async () => {
      const response = await ClassificacaoService.getAll(1, 100000, {
        status: 'active',
        sortBy: 'nome',
        sortOrder: 'asc',
      });
      return response.data;
    },
  });

  const { data: instituicoesAtivasData } = useQuery({
    queryKey: ['instituicoes-ativas-para-nf'],
    queryFn: async () => {
      const response = await InstituicaoService.listarInstituicoes({
        statusAtivo: 'ATIVO',
        page: 1,
        pageSize: 100000,
      });
      return response.data?.data;
    },
  });

  const obrasAtivas = obrasAtivasData?.obras || [];
  const projetosAtivos = projetosAtivosData?.projetos || [];
  const programasAtivos = programasAtivosData?.programas || [];
  const classificacoesAtivas = classificacoesAtivasData?.classificacoes || [];
  const instituicoesAtivas = instituicoesAtivasData?.instituicoes || [];

  const nomesProgramasAtivos: string[] = Array.from(
    new Set<string>(
      programasAtivos
        .map((item: any) => String(item?.nome || '').trim())
        .filter(Boolean),
    ),
  );
  const nomesProjetosAtivos: string[] = Array.from(
    new Set<string>(
      projetosAtivos
        .map((item: any) => String(item?.nome || '').trim())
        .filter(Boolean),
    ),
  );
  const nomesClassificacoesAtivas: string[] = Array.from(
    new Set<string>(
      classificacoesAtivas
        .map((item: any) => String(item?.nome || '').trim())
        .filter(Boolean),
    ),
  );
  const nomesInstituicoesAtivas: string[] = Array.from(
    new Set<string>(
      instituicoesAtivas
        .map((item: any) => String(item?.instituicao || '').trim())
        .filter(Boolean),
    ),
  );
  const nomesUnidadesNegocio: string[] = Array.from(
    new Set<string>(
      obrasAtivas
        .map((item: any) => String(item?.un || item?.idUN || item?.nome || item?.nomeObra || '').trim())
        .filter(Boolean),
    ),
  );

  const obrasMapById = useMemo(
    () => new Map<number, any>(obrasAtivas.map((obra: any) => [Number(obra.id), obra])),
    [obrasAtivas],
  );

  const programaOptions: SearchableOption[] = useMemo(
    () => nomesProgramasAtivos.map((item) => ({ value: item, label: item })),
    [nomesProgramasAtivos],
  );

  const classificacaoOptions: SearchableOption[] = useMemo(
    () => nomesClassificacoesAtivas.map((item) => ({ value: item, label: item })),
    [nomesClassificacoesAtivas],
  );

  const orcadoOptions: SearchableOption[] = useMemo(
    () => [
      { value: 'ORCADO', label: 'Orçado' },
      { value: 'NAO_ORCADO', label: 'Não Orçado' },
    ],
    [],
  );

  const obraOptions: SearchableOption[] = useMemo(
    () =>
      obrasAtivas.map((obra: any) => ({
        value: String(obra.id),
        label: `${obra.codigo || obra.id} - ${obra.nome || 'Sem nome'}`,
      })),
    [obrasAtivas],
  );

  const projetoOptions: SearchableOption[] = useMemo(
    () => nomesProjetosAtivos.map((item) => ({ value: item, label: item })),
    [nomesProjetosAtivos],
  );

  const periodoSelecionadoLabel = useMemo(() => {
    const inicio = formatDateLabel(filters.dataInicio);
    const fim = formatDateLabel(filters.dataFim);

    if (inicio && fim) {
      return `${inicio} até ${fim}`;
    }

    if (inicio) {
      return `A partir de ${inicio}`;
    }

    if (fim) {
      return `Até ${fim}`;
    }

    return 'Todo o período';
  }, [filters.dataInicio, filters.dataFim]);

  const selectedFiltersCount = useMemo(
    () =>
      filters.programa.length +
      filters.classificacao.length +
      filters.orcadoNaoOrcado.length +
      filters.obraId.length +
      filters.projeto.length +
      (filters.dataInicio ? 1 : 0) +
      (filters.dataFim ? 1 : 0),
    [filters],
  );

  const updateFilter = <K extends keyof NotaFiscalDashboardFilters>(
    key: K,
    value: NotaFiscalDashboardFilters[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const limparFiltros = () => {
    setFilters(createDefaultFilters());
    setPage(1);
  };

  const useVerticalFilterLayout = sidebarOpen;

  const buildSelectableOptions = (options: string[], currentValue?: string | null) => {
    const current = String(currentValue || '').trim();
    if (!current) {
      return options;
    }

    return options.includes(current) ? options : [current, ...options];
  };

  const findObraByUnidadeNegocio = (unidadeNegocio?: string | null) => {
    const target = String(unidadeNegocio || '').trim().toLowerCase();
    if (!target) {
      return null;
    }

    return obrasAtivas.find((obra: any) => {
      const candidates = [
        obra?.un,
        obra?.idUN,
        obra?.nome,
        obra?.nomeObra,
        obra?.codigo,
        obra?.codigoObra,
      ]
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean);

      return candidates.includes(target);
    }) || null;
  };

  const getInlineFieldsFromNota = (nf: NotaFiscal): InlineEditFields => ({
    unidadeNegocio: String(nf.camposClassificacao?.unidadeNegocio || '').trim(),
    orcadoNaoOrcado: String(nf.camposClassificacao?.orcadoNaoOrcado || '').trim(),
    programa: String(nf.camposClassificacao?.programa || '').trim(),
    instituicao: String(nf.camposClassificacao?.instituicao || '').trim(),
    projeto: String(nf.camposClassificacao?.projeto || '').trim(),
    classificacaoProjetoAtt: String(nf.camposClassificacao?.classificacaoProjetoAtt || '').trim(),
    classe: String(nf.camposClassificacao?.classe ?? '').trim(),
    classificacaoConta: String(nf.camposClassificacao?.classificacaoConta ?? '').trim(),
  });

  const getInlineFieldsForRow = (nf: NotaFiscal): InlineEditFields => {
    return inlineEditFieldsByRow[nf.id] || getInlineFieldsFromNota(nf);
  };

  const updateInlineFieldForRow = (
    nf: NotaFiscal,
    key: keyof InlineEditFields,
    value: string,
  ) => {
    setInlineEditFieldsByRow((prev) => {
      const current = prev[nf.id] || getInlineFieldsFromNota(nf);
      return {
        ...prev,
        [nf.id]: {
          ...current,
          [key]: value,
        },
      };
    });
  };

  const resetInlineFieldsForRow = (nf: NotaFiscal) => {
    setInlineEditFieldsByRow((prev) => ({
      ...prev,
      [nf.id]: getInlineFieldsFromNota(nf),
    }));
  };

  const getLocalizacaoLinha = (nf: NotaFiscal) => {
    if (inlineEditMode) {
      const rowFields = getInlineFieldsForRow(nf);
      const obraSelecionada = findObraByUnidadeNegocio(rowFields.unidadeNegocio);
      if (obraSelecionada?.local) {
        return obraSelecionada.local;
      }

      if (obraSelecionada?.nome || obraSelecionada?.nomeObra) {
        return obraSelecionada?.nome || obraSelecionada?.nomeObra;
      }
    }

    return nf.localizacao
      || (obrasMapById.get(Number(nf.obraId))?.local
      || obrasMapById.get(Number(nf.obraId))?.nome
      || obrasMapById.get(Number(nf.obraId))?.nomeObra
      || '-');
  };

  useEffect(() => {
    if (!obrasAtivas.length) return;

    const existeSelecionada = obrasAtivas.some((obra: any) => obra.id === formData.obraId);
    if (!existeSelecionada) {
      setFormData((prev) => ({ ...prev, obraId: obrasAtivas[0].id }));
    }
  }, [obrasAtivas, formData.obraId]);

  const notas: NotaFiscal[] = data?.notasFiscais || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isMaster = usuario?.perfil === 'MASTER';

  useEffect(() => {
    localStorage.setItem('notas-fiscais:columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const notasFiltradas = useMemo(() => notas, [notas]);

  const allVisibleSelected = useMemo(
    () => notasFiltradas.length > 0 && notasFiltradas.every((nota) => selectedIds.includes(nota.id)),
    [notasFiltradas, selectedIds],
  );

  const compareValues = (a: string | number, b: string | number, order: SortOrder) => {
    const direction = order === 'asc' ? 1 : -1;

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * direction;
    }

    return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base', numeric: true }) * direction;
  };

  const getSortValue = (nf: NotaFiscal, key: NotaFiscalSortKey): string | number => {
    const obra = obrasMapById.get(Number(nf.obraId));
    const localizacao = nf.localizacao
      || String(obra?.local || '').trim()
      || String(obra?.nome || obra?.nomeObra || '').trim();

    switch (key) {
      case 'codDocumento':
        return nf.camposClassificacao?.codDocumento || '';
      case 'razaoSocial':
        return nf.camposClassificacao?.razaoSocial || nf.fornecedor || '';
      case 'periodo':
        return nf.periodo || String(nf.dataEmissao || '');
      case 'localizacao':
        return localizacao || '';
      case 'actionCode':
        return Number(nf.actionCode || 0);
      case 'valor':
        return Number(nf.valor || 0);
      case 'unidadeNegocio':
        return nf.camposClassificacao?.unidadeNegocio || '';
      case 'orcadoNaoOrcado':
        return nf.camposClassificacao?.orcadoNaoOrcado || '';
      case 'programa':
        return nf.camposClassificacao?.programa || '';
      case 'instituicao':
        return nf.camposClassificacao?.instituicao || '';
      case 'projeto':
        return nf.camposClassificacao?.projeto || '';
      case 'classificacaoProjetoAtt':
        return nf.camposClassificacao?.classificacaoProjetoAtt || '';
      case 'status':
        return nf.status || '';
      case 'pendencia':
        return nf.pendenteClassificacao ? 'PENDENTE' : 'COMPLETA';
      default:
        return '';
    }
  };

  const notasOrdenadas = useMemo(() => {
    const lista = [...notasFiltradas];
    lista.sort((a, b) => compareValues(getSortValue(a, sortBy), getSortValue(b, sortBy), sortOrder));
    return lista;
  }, [notasFiltradas, sortBy, sortOrder, obrasMapById]);

  const resolveActionCodeLabel = (actionCode?: number | null) => {
    if (actionCode === 10) {
      return '10 - Accounts Payable';
    }

    if (actionCode === 70) {
      return '70 - Reimbursement';
    }

    return '-';
  };

  const toggleSort = (key: NotaFiscalSortKey) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(key);
    setSortOrder('asc');
  };

  const renderSortIcon = (key: NotaFiscalSortKey) => {
    if (sortBy !== key) {
      return <ArrowUpDown size={14} className="opacity-60" />;
    }

    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const getColumnWidth = (key: string): string | undefined => {
    const width = columnWidths[key];
    return width ? `${width}px` : undefined;
  };

  const handleResizeStart = (
    event: React.MouseEvent,
    key: string,
    defaultWidth: number,
    minWidth: number = 100,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const currentWidth = columnWidths[key] ?? defaultWidth;

    resizingRef.current = {
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

      setColumnWidths((prev) => ({
        ...prev,
        [current.key]: nextWidth,
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await NotaFiscalService.create(formData);
      setFormData({
        numeroNF: '',
        fornecedor: '',
        cnpj: '',
        valor: 0,
        dataEmissao: '',
        obraId: 1,
        actionCode: 10,
      });
      setShowModal(false);
      refetch();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao criar NF:', error);
      alert('Não foi possível criar a NF.');
    }
  };

  const openClassificacao = (nota?: NotaFiscal) => {
    setClassificarEmLote(!nota);
    setNotaSelecionada(nota || null);

    const base = nota?.camposClassificacao;
    setClassificacaoForm({
      orcadoNaoOrcado: base?.orcadoNaoOrcado || '',
      programa: base?.programa || '',
      instituicao: base?.instituicao || '',
      projeto: base?.projeto || '',
      classificacaoProjetoAtt: base?.classificacaoProjetoAtt || '',
      historico: base?.historico || '',
      unidadeNegocio: base?.unidadeNegocio || '',
      dataPagamento: base?.dataPagamento?.slice(0, 10) || '',
      razaoSocial: base?.razaoSocial || nota?.fornecedor || '',
      valor: base?.valor != null ? String(base.valor) : nota?.valor != null ? String(nota.valor) : '',
      codDocumento: base?.codDocumento || '',
      observacoes: base?.observacoes || nota?.observacao || '',
      publicoAlvo: base?.publicoAlvo || '',
      classe: base?.classe || '',
      classificacaoConta: base?.classificacaoConta || '',
    });

    setShowClassificarModal(true);
  };

  const handleSaveClassificacao = async (e: React.FormEvent) => {
    e.preventDefault();

    const camposClassificacaoCompletos = {
      orcadoNaoOrcado: classificacaoForm.orcadoNaoOrcado || null,
      programa: classificacaoForm.programa || null,
      instituicao: classificacaoForm.instituicao || null,
      projeto: classificacaoForm.projeto || null,
      classificacaoProjetoAtt: classificacaoForm.classificacaoProjetoAtt || null,
      historico: classificacaoForm.historico || null,
      unidadeNegocio: classificacaoForm.unidadeNegocio || null,
      dataPagamento: classificacaoForm.dataPagamento || null,
      razaoSocial: classificacaoForm.razaoSocial || null,
      valor: classificacaoForm.valor ? Number(classificacaoForm.valor) : null,
      codDocumento: classificacaoForm.codDocumento || null,
      observacoes: classificacaoForm.observacoes || null,
      publicoAlvo: classificacaoForm.publicoAlvo || null,
      classe: classificacaoForm.classe || null,
      classificacaoConta: classificacaoForm.classificacaoConta || null,
    };

    const camposClassificacaoParciais = Object.fromEntries(
      Object.entries({
        orcadoNaoOrcado: classificacaoForm.orcadoNaoOrcado,
        programa: classificacaoForm.programa,
        instituicao: classificacaoForm.instituicao,
        projeto: classificacaoForm.projeto,
        classificacaoProjetoAtt: classificacaoForm.classificacaoProjetoAtt,
        historico: classificacaoForm.historico,
        unidadeNegocio: classificacaoForm.unidadeNegocio,
        dataPagamento: classificacaoForm.dataPagamento,
        razaoSocial: classificacaoForm.razaoSocial,
        valor: classificacaoForm.valor,
        codDocumento: classificacaoForm.codDocumento,
        observacoes: classificacaoForm.observacoes,
      }).filter(([_, value]) => String(value ?? '').trim().length > 0),
    );

    if (camposClassificacaoParciais.valor !== undefined) {
      (camposClassificacaoParciais as any).valor = Number(camposClassificacaoParciais.valor);
    }

    try {
      if (classificarEmLote) {
        if (!selectedIds.length) {
          alert('Selecione pelo menos uma NF para classificar em lote.');
          return;
        }

        if (!Object.keys(camposClassificacaoParciais).length) {
          alert('Preencha ao menos um campo para editar as NFs selecionadas.');
          return;
        }

        await NotaFiscalService.classificarLote({
          notasFiscaisIds: selectedIds,
          camposClassificacao: camposClassificacaoParciais,
        });
      } else if (notaSelecionada) {
        await NotaFiscalService.update(notaSelecionada.id, {
          camposClassificacao: camposClassificacaoCompletos,
        });
      }

      setShowClassificarModal(false);
      setClassificacaoForm(emptyClassificacaoForm);
      setNotaSelecionada(null);
      setSelectedIds([]);
      refetch();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao classificar NF:', error);
      alert('Falha ao salvar classificação.');
    }
  };

  const startInlineEdit = () => {
    const initialState: Record<number, InlineEditFields> = {};
    notasOrdenadas.forEach((nf) => {
      initialState[nf.id] = getInlineFieldsFromNota(nf);
    });
    setInlineEditFieldsByRow(initialState);
    setInlineEditMode(true);
  };

  const cancelInlineEdit = () => {
    setInlineEditMode(false);
    setInlineEditFieldsByRow({});
  };

  const getInlineRowPayload = (nf: NotaFiscal, rowFields: InlineEditFields) => {
    const camposClassificacaoParciais = Object.fromEntries(
      Object.entries({
        unidadeNegocio: rowFields.unidadeNegocio,
        orcadoNaoOrcado: rowFields.orcadoNaoOrcado,
        programa: rowFields.programa,
        instituicao: rowFields.instituicao,
        projeto: rowFields.projeto,
        classificacaoProjetoAtt: rowFields.classificacaoProjetoAtt,
        classe: rowFields.classe,
        classificacaoConta: rowFields.classificacaoConta,
      }).filter(([_, value]) => String(value ?? '').trim().length > 0),
    );

    const payload: any = {
      camposClassificacao: camposClassificacaoParciais,
    };

    const obraSelecionada = findObraByUnidadeNegocio(rowFields.unidadeNegocio);
    if (obraSelecionada?.id) {
      payload.obraId = Number(obraSelecionada.id);
    }

    return payload;
  };

  const hasInlineRowChanges = (nf: NotaFiscal, rowFields: InlineEditFields) => {
    const base = getInlineFieldsFromNota(nf);
    return (
      String(base.unidadeNegocio || '').trim() !== String(rowFields.unidadeNegocio || '').trim()
      || String(base.orcadoNaoOrcado || '').trim() !== String(rowFields.orcadoNaoOrcado || '').trim()
      || String(base.programa || '').trim() !== String(rowFields.programa || '').trim()
      || String(base.instituicao || '').trim() !== String(rowFields.instituicao || '').trim()
      || String(base.projeto || '').trim() !== String(rowFields.projeto || '').trim()
      || String(base.classificacaoProjetoAtt || '').trim()
        !== String(rowFields.classificacaoProjetoAtt || '').trim()
      || String(base.classe ?? '').trim() !== String(rowFields.classe ?? '').trim()
      || String(base.classificacaoConta ?? '').trim() !== String(rowFields.classificacaoConta ?? '').trim()
    );
  };

  const saveInlineEdit = async (nf: NotaFiscal, options?: { skipRefetch?: boolean; skipEmptyAlert?: boolean }) => {
    const rowFields = getInlineFieldsForRow(nf);

    const payload = getInlineRowPayload(nf, rowFields);
    const camposClassificacaoParciais = payload.camposClassificacao || {};

    if (!Object.keys(camposClassificacaoParciais).length) {
      if (!options?.skipEmptyAlert) {
        alert('Preencha ao menos um campo para editar esta linha.');
      }
      return false;
    }

    try {
      await NotaFiscalService.update(nf.id, payload);
      if (!options?.skipRefetch) {
        refetch();
      }
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao salvar edição rápida da NF:', error);
      alert('Não foi possível salvar a edição desta NF.');
      return false;
    }
  };

  const finishInlineEditWithSave = async () => {
    const changedRows = notasOrdenadas.filter((nf) => hasInlineRowChanges(nf, getInlineFieldsForRow(nf)));

    if (!changedRows.length) {
      cancelInlineEdit();
      return;
    }

    let falhas = 0;

    try {
      for (const nf of changedRows) {
        // Salva em sequência para reduzir conflitos de atualização concorrente.
        const ok = await saveInlineEdit(nf, { skipRefetch: true, skipEmptyAlert: true });
        if (!ok) {
          falhas += 1;
        }
      }

      if (falhas > 0) {
        alert(`Não foi possível salvar ${falhas} linha(s). Corrija e tente novamente.`);
        return;
      }

      await refetch();
      cancelInlineEdit();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao encerrar e salvar edição das linhas:', error);
      alert('Não foi possível salvar todas as linhas ao encerrar a edição.');
    }
  };

  const beginInlineEditRow = (nf: NotaFiscal) => {
    if (!inlineEditMode) {
      startInlineEdit();
      return;
    }

    resetInlineFieldsForRow(nf);
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const response = await NotaFiscalService.importarExcel(file);
      alert(
        `Importação concluída (modelo padrão). Total: ${response.data.totalLinhas}, importadas: ${response.data.importadas}, ignoradas: ${response.data.ignoradas}`,
      );
      refetch();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro na importação:', error);
      alert('Não foi possível importar o Excel. Verifique o formato da planilha.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await NotaFiscalService.baixarTemplateExcel();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'modelo-notas-fiscais.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao baixar modelo Excel:', error);
      alert('Não foi possível baixar o modelo de Excel.');
    }
  };

  const applyCustomPageSize = () => {
    const parsed = Number(customPageSize);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert('Informe um valor válido para quantidade de linhas.');
      return;
    }

    const limitado = Math.min(10000, Math.max(1, Math.floor(parsed)));
    setPageSize(limitado);
    setPage(1);
  };

  const handleExportExcel = async () => {
    try {
      const blob = await NotaFiscalService.exportarExcel(filters);

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'notas-fiscais-exportacao.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao exportar Excel:', error);
      alert('Não foi possível exportar o Excel.');
    }
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !notasOrdenadas.some((nota) => nota.id === id)));
      return;
    }

    setSelectedIds((prev) => {
      const ids = new Set(prev);
      notasOrdenadas.forEach((nota) => ids.add(nota.id));
      return Array.from(ids);
    });
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleDeleteSelecionadas = async () => {
    if (!isMaster) {
      alert('Apenas o perfil MASTER pode excluir NFs.');
      return;
    }

    if (!selectedIds.length) {
      alert('Selecione ao menos uma NF para excluir.');
      return;
    }

    const confirmou = window.confirm(
      `Tem certeza que deseja excluir ${selectedIds.length} NF(s) selecionada(s)? Esta ação não pode ser desfeita.`,
    );
    if (!confirmou) {
      return;
    }

    try {
      await NotaFiscalService.deleteLote(selectedIds);
      setSelectedIds([]);
      refetch();
      alert('NF(s) selecionada(s) excluída(s) com sucesso.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao excluir NFs selecionadas:', error);
      alert('Não foi possível excluir as NFs selecionadas.');
    }
  };

  const handleDeleteAll = async () => {
    if (!isMaster) {
      alert('Apenas o perfil MASTER pode excluir todas as NFs.');
      return;
    }

    const confirmou = window.confirm(
      'Tem certeza que deseja excluir TODAS as NFs? Esta ação não pode ser desfeita.',
    );
    if (!confirmou) {
      return;
    }

    try {
      await NotaFiscalService.deleteAll();
      setSelectedIds([]);
      setPage(1);
      refetch();
      alert('Todas as NFs foram excluídas com sucesso.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao excluir todas as NFs:', error);
      alert('Não foi possível excluir todas as NFs.');
    }
  };

  return (
    <div className={useVerticalFilterLayout ? 'transition-all duration-300 lg:-ml-6 lg:-mt-6 lg:flex lg:items-start lg:gap-0' : 'transition-all duration-300'}>
        {useVerticalFilterLayout ? (
          <aside
            className={`sticky top-0 z-40 hidden h-[calc(100vh-64px)] shrink-0 lg:block ${
              dashboardSideFilterExpanded ? 'w-64 xl:w-72' : 'w-14 xl:w-16'
            }`}
          >
            <div className="relative h-full w-full overflow-hidden border-r border-slate-200/80 bg-white/95 transition-all duration-300 dark:border-slate-700/80 dark:bg-slate-950/95">
              <div className="relative flex h-full flex-col p-2 sm:p-3">
                <button
                  type="button"
                  onClick={toggleDashboardSideFilterExpanded}
                  className={`flex w-full items-center rounded-lg border border-slate-300 bg-white/80 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700 ${dashboardSideFilterExpanded ? 'justify-start gap-2 px-3 py-2' : 'h-full justify-center px-1'}`}
                  title={dashboardSideFilterExpanded ? 'Recolher barra de filtros' : 'Expandir barra de filtros'}
                >
                  {dashboardSideFilterExpanded ? (
                    <>
                      <X size={16} />
                      <span className="text-xs font-medium">Recolher filtros</span>
                    </>
                  ) : (
                    <span className="rotate-90 text-xs font-semibold tracking-[0.4em]">FILTRO</span>
                  )}
                </button>

                {dashboardSideFilterExpanded ? (
                  <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
                    <div className="sticky top-0 z-10 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] font-medium text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200">
                      Período: {periodoSelecionadoLabel}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="date"
                        value={filters.dataInicio}
                        onChange={(e) => updateFilter('dataInicio', e.target.value)}
                        className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        aria-label="Data de início"
                      />
                      <input
                        type="date"
                        value={filters.dataFim}
                        onChange={(e) => updateFilter('dataFim', e.target.value)}
                        className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        aria-label="Data de fim"
                      />
                    </div>

                    <SearchableFilterField
                      label="Programa"
                      placeholder="Clique e digite para buscar"
                      values={filters.programa}
                      options={programaOptions}
                      onChange={(values) => updateFilter('programa', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Classificação"
                      placeholder="Clique e digite para buscar"
                      values={filters.classificacao}
                      options={classificacaoOptions}
                      onChange={(values) => updateFilter('classificacao', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Orçado / Não Orçado"
                      placeholder="Clique e digite para buscar"
                      values={filters.orcadoNaoOrcado}
                      options={orcadoOptions}
                      onChange={(values) => updateFilter('orcadoNaoOrcado', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Obra"
                      placeholder="Clique e digite para buscar"
                      values={filters.obraId}
                      options={obraOptions}
                      onChange={(values) => updateFilter('obraId', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Projeto"
                      placeholder="Clique e digite para buscar"
                      values={filters.projeto}
                      options={projetoOptions}
                      onChange={(values) => updateFilter('projeto', values)}
                      compact
                    />

                    <button
                      onClick={limparFiltros}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <X size={14} />
                      Limpar filtros
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}

        <div className="notas-page min-w-0 flex-1">
          <div className={`sticky top-0 ${useVerticalFilterLayout ? 'z-20' : 'z-30'}`}>
            <div className="-mx-6 mb-4 border-b border-slate-200/80 bg-slate-50/95 px-6 pb-4 pt-3 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="px-3 pb-2 pt-1 lg:hidden">
                  <div className="rounded-lg border border-slate-200 bg-white/95 p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800/95">
                    <div className="mb-1.5 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMobileFiltersExpanded((value) => !value)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      >
                        Filtros {selectedFiltersCount ? `(${selectedFiltersCount})` : ''}
                        {mobileFiltersExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <button
                        type="button"
                        onClick={limparFiltros}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      >
                        <X size={12} />
                        Limpar
                      </button>
                    </div>

                    <p className="mb-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">Período: {periodoSelecionadoLabel}</p>

                    {mobileFiltersExpanded ? (
                      <div className="grid grid-cols-1 gap-1.5 pb-1 sm:grid-cols-2">
                        <input
                          type="date"
                          value={filters.dataInicio}
                          onChange={(e) => updateFilter('dataInicio', e.target.value)}
                          className="h-7 w-full rounded-lg border border-slate-300 bg-white px-1.5 text-[11px] text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          aria-label="Data de início"
                        />
                        <input
                          type="date"
                          value={filters.dataFim}
                          onChange={(e) => updateFilter('dataFim', e.target.value)}
                          className="h-7 w-full rounded-lg border border-slate-300 bg-white px-1.5 text-[11px] text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          aria-label="Data de fim"
                        />

                        <SearchableFilterField
                          label="Programa"
                          placeholder="Buscar programa"
                          values={filters.programa}
                          options={programaOptions}
                          onChange={(values) => updateFilter('programa', values)}
                          mini
                        />

                        <SearchableFilterField
                          label="Classificação"
                          placeholder="Buscar classificação"
                          values={filters.classificacao}
                          options={classificacaoOptions}
                          onChange={(values) => updateFilter('classificacao', values)}
                          mini
                        />

                        <SearchableFilterField
                          label="Orçado / Não Orçado"
                          placeholder="Buscar opção"
                          values={filters.orcadoNaoOrcado}
                          options={orcadoOptions}
                          onChange={(values) => updateFilter('orcadoNaoOrcado', values)}
                          mini
                        />

                        <SearchableFilterField
                          label="Obra"
                          placeholder="Buscar obra"
                          values={filters.obraId}
                          options={obraOptions}
                          onChange={(values) => updateFilter('obraId', values)}
                          mini
                        />

                        <SearchableFilterField
                          label="Projeto"
                          placeholder="Buscar projeto"
                          values={filters.projeto}
                          options={projetoOptions}
                          onChange={(values) => updateFilter('projeto', values)}
                          mini
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={`${useVerticalFilterLayout ? 'hidden' : 'hidden lg:block'} mb-3`}>
                  <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Filtros de Notas Fiscais {selectedFiltersCount ? `(${selectedFiltersCount})` : ''}
                    </h2>
                    <div className="inline-flex w-fit items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200">
                      Intervalo selecionado: {periodoSelecionadoLabel}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 xl:grid-cols-8">
                    <div className="min-w-0">
                      <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Data início</label>
                      <input
                        type="date"
                        value={filters.dataInicio}
                        onChange={(e) => updateFilter('dataInicio', e.target.value)}
                        className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        aria-label="Data de início"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Data fim</label>
                      <input
                        type="date"
                        value={filters.dataFim}
                        onChange={(e) => updateFilter('dataFim', e.target.value)}
                        className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        aria-label="Data de fim"
                      />
                    </div>

                    <SearchableFilterField
                      label="Programa"
                      placeholder="Buscar"
                      values={filters.programa}
                      options={programaOptions}
                      onChange={(values) => updateFilter('programa', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Classificação"
                      placeholder="Buscar"
                      values={filters.classificacao}
                      options={classificacaoOptions}
                      onChange={(values) => updateFilter('classificacao', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Orçado / Não Orçado"
                      placeholder="Buscar"
                      values={filters.orcadoNaoOrcado}
                      options={orcadoOptions}
                      onChange={(values) => updateFilter('orcadoNaoOrcado', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Obra"
                      placeholder="Buscar"
                      values={filters.obraId}
                      options={obraOptions}
                      onChange={(values) => updateFilter('obraId', values)}
                      compact
                    />

                    <SearchableFilterField
                      label="Projeto"
                      placeholder="Buscar"
                      values={filters.projeto}
                      options={projetoOptions}
                      onChange={(values) => updateFilter('projeto', values)}
                      compact
                    />

                    <button
                      onClick={limparFiltros}
                      className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <X size={13} />
                      Limpar filtros
                    </button>
                  </div>
                </div>

                <div className="nf-actions-mobile mb-3 grid grid-cols-1 gap-2 lg:hidden">
                  <button
                    onClick={() => openClassificacao()}
                    className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary-500 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
                  >
                    <FileSpreadsheet size={16} />
                    Classificar selecionadas ({selectedIds.length})
                  </button>
                  {isMaster ? (
                    <>
                      <button
                        onClick={handleDeleteSelecionadas}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={16} />
                        Excluir selecionadas ({selectedIds.length})
                      </button>
                      <button
                        onClick={handleDeleteAll}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        <Trash2 size={16} />
                        Excluir todas as NFs
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="nf-actions-desktop hidden flex-wrap items-center justify-end gap-2 lg:flex">
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-600">
                    <span>Linhas:</span>
                    <select
                      value={pageSizeOption}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPageSizeOption(value);

                        if (value === 'custom') {
                          return;
                        }

                        const next = Number(value);
                        setPageSize(next);
                        setCustomPageSize(String(next));
                        setPage(1);
                      }}
                      className="rounded border border-slate-300 px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="100">100</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    {pageSizeOption === 'custom' && (
                      <>
                        <input
                          type="number"
                          min={1}
                          value={customPageSize}
                          onChange={(e) => setCustomPageSize(e.target.value)}
                          className="w-20 rounded border border-slate-300 px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                        />
                        <button
                          type="button"
                          onClick={applyCustomPageSize}
                          className="rounded border border-primary-500 px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/20"
                        >
                          Aplicar
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={toggleSelectAllVisible}
                    className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-50 lg:w-auto dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    <span className="hidden xl:inline">Selecionar todas desta página</span>
                    <span className="xl:hidden">Selecionar página</span>
                  </button>

                  {inlineEditMode ? (
                    <>
                      <button
                        onClick={finishInlineEditWithSave}
                        className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-50 lg:w-auto dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <span className="hidden xl:inline">Encerrar edição das linhas</span>
                        <span className="xl:hidden">Encerrar edição</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startInlineEdit}
                      className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-500 px-2 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 lg:w-auto dark:text-indigo-300"
                    >
                      <span className="hidden xl:inline">Editar Coluna (Todas)</span>
                      <span className="xl:hidden">Editar coluna</span>
                    </button>
                  )}

                  <button
                    onClick={() => openClassificacao()}
                    className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-primary-500 px-2 py-1.5 text-xs text-primary-700 hover:bg-primary-50 lg:w-auto dark:text-primary-300 dark:hover:bg-primary-900/20"
                  >
                    <FileSpreadsheet size={14} />
                    <span className="hidden xl:inline">Classificar selecionadas ({selectedIds.length})</span>
                    <span className="xl:hidden">Classificar ({selectedIds.length})</span>
                  </button>
                  {isMaster && (
                    <>
                      <button
                        onClick={handleDeleteSelecionadas}
                        className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-red-500 px-2 py-1.5 text-xs text-red-700 hover:bg-red-50 lg:w-auto dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                        <span className="hidden xl:inline">Excluir selecionadas ({selectedIds.length})</span>
                        <span className="xl:hidden">Excl. selecionadas ({selectedIds.length})</span>
                      </button>
                      <button
                        onClick={handleDeleteAll}
                        className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-red-600 px-2 py-1.5 text-xs text-white hover:bg-red-700 lg:w-auto"
                      >
                        <Trash2 size={14} />
                        <span className="hidden xl:inline">Excluir todas as NFs</span>
                        <span className="xl:hidden">Excl. todas NFs</span>
                      </button>
                    </>
                  )}
                </div>

                {selectedFiltersCount > 0 && (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Exibindo {notasOrdenadas.length} resultado(s) nesta página
                    {selectedFiltersCount > 0 ? ` | Filtros ativos: ${selectedFiltersCount}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl dark:text-white">Notas Fiscais</h1>
            <div className="nf-toolbar-actions flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 sm:w-auto"
              >
                <Upload size={18} />
                Importar Excel
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-500 bg-sky-500 px-4 py-2 text-white hover:bg-sky-600 sm:w-auto"
              >
                <Download size={18} />
                Baixar Modelo Excel
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-500 bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600 sm:w-auto"
              >
                <Download size={18} />
                Exportar Excel
              </button>
              <button
                onClick={() => {
                  setFormData({
                    numeroNF: '',
                    fornecedor: '',
                    cnpj: '',
                    valor: 0,
                    dataEmissao: '',
                    obraId: obrasAtivas[0]?.id || 1,
                    actionCode: 10,
                  });
                  setShowModal(true);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 sm:w-auto"
              >
                <Plus size={18} />
                Nova NF
              </button>
            </div>
          </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nova Nota Fiscal</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                placeholder="Número NF"
                value={formData.numeroNF}
                onChange={(e) => setFormData({ ...formData, numeroNF: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="number"
                placeholder="Valor"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value || '0') })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
              <input
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
              <select
                value={formData.obraId}
                onChange={(e) => setFormData({ ...formData, obraId: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              >
                {obrasAtivas.map((obra: any) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.codigo || obra.codigoObra || obra.id} - {obra.nome || obra.nomeObra}
                  </option>
                ))}
              </select>

              <select
                value={formData.actionCode}
                onChange={(e) => setFormData({ ...formData, actionCode: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value={10}>10 - Accounts Payable</option>
                <option value={70}>70 - Reimbursement</option>
              </select>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 rounded-lg bg-primary-600 py-2 text-white hover:bg-primary-700">
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg bg-slate-200 py-2 text-slate-800 hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClassificarModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
          <div className="mx-auto w-full max-w-4xl rounded-xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {classificarEmLote ? `Classificação em lote (${selectedIds.length} NFs)` : `Classificar NF ${notaSelecionada?.numeroNF}`}
              </h2>
              <button type="button" onClick={() => setShowClassificarModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveClassificacao} className="space-y-4">
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Preencha os campos obrigatórios para tirar a NF da pendência no dashboard.
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <select
                  value={classificacaoForm.orcadoNaoOrcado}
                  onChange={(e) => setClassificacaoForm({ ...classificacaoForm, orcadoNaoOrcado: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Orçado/Não Orçado *</option>
                  <option value="ORCADO">Orçado</option>
                  <option value="NAO_ORCADO">Não Orçado</option>
                </select>
                <select
                  value={classificacaoForm.programa}
                  onChange={(e) => setClassificacaoForm({ ...classificacaoForm, programa: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Programa *</option>
                  {nomesProgramasAtivos.map((nome) => (
                    <option key={nome} value={nome}>
                      {nome}
                    </option>
                  ))}
                </select>
                <select
                  value={classificacaoForm.instituicao}
                  onChange={(e) => setClassificacaoForm({ ...classificacaoForm, instituicao: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Instituição *</option>
                  {nomesInstituicoesAtivas.map((nome) => (
                    <option key={nome} value={nome}>
                      {nome}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-1">
                  <select
                    value={classificacaoForm.projeto}
                    onChange={(e) => {
                      const projeto = e.target.value;
                      const proj = projetosAtivos.find((p: any) => p.nome === projeto);
                      setClassificacaoForm((prev) => ({
                        ...prev,
                        projeto,
                        publicoAlvo: proj?.publicoAlvo || '',
                      }));
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Projeto *</option>
                    {nomesProjetosAtivos.map((nome) => (
                      <option key={nome} value={nome}>
                        {nome}
                      </option>
                    ))}
                  </select>
                  {classificacaoForm.publicoAlvo && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Público-alvo: {classificacaoForm.publicoAlvo}</span>
                  )}
                </div>
                <select
                  value={classificacaoForm.classificacaoProjetoAtt}
                  onChange={(e) =>
                    setClassificacaoForm({ ...classificacaoForm, classificacaoProjetoAtt: e.target.value })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Classificação do Projeto ATT *</option>
                  {nomesClassificacoesAtivas.map((nome) => (
                    <option key={nome} value={nome}>
                      {nome}
                    </option>
                  ))}
                </select>
                <input
                  value={classificacaoForm.classe}
                  onChange={(e) => setClassificacaoForm({ ...classificacaoForm, classe: e.target.value })}
                  placeholder="Classe"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <input
                  value={classificacaoForm.classificacaoConta}
                  onChange={(e) => setClassificacaoForm({ ...classificacaoForm, classificacaoConta: e.target.value })}
                  placeholder="Classificação Conta"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Campos opcionais editáveis
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <input
                    placeholder="Histórico"
                    value={classificacaoForm.historico}
                    onChange={(e) => setClassificacaoForm({ ...classificacaoForm, historico: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <select
                    value={classificacaoForm.unidadeNegocio}
                    onChange={(e) => setClassificacaoForm({ ...classificacaoForm, unidadeNegocio: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Unidade de Negócio</option>
                    {buildSelectableOptions(nomesUnidadesNegocio, classificacaoForm.unidadeNegocio).map((nome) => (
                      <option key={nome} value={nome}>
                        {nome}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={classificacaoForm.dataPagamento}
                    onChange={(e) => setClassificacaoForm({ ...classificacaoForm, dataPagamento: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Razão Social"
                    value={classificacaoForm.razaoSocial}
                    onChange={(e) => setClassificacaoForm({ ...classificacaoForm, razaoSocial: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Valor"
                    value={classificacaoForm.valor}
                    onChange={(e) => setClassificacaoForm({ ...classificacaoForm, valor: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Cód. Documento"
                    value={classificacaoForm.codDocumento}
                    onChange={(e) => setClassificacaoForm({ ...classificacaoForm, codDocumento: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <textarea
                  placeholder="Observações"
                  value={classificacaoForm.observacoes}
                  onChange={(e) => setClassificacaoForm({ ...classificacaoForm, observacoes: e.target.value })}
                  className="mt-3 h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassificarModal(false)}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                >
                  <Save size={16} />
                  Salvar Classificação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center">Carregando...</div>
      ) : (
        <div className="notas-table-shell overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="notas-table" style={{ width: 'max-content' }}>
            <thead className="bg-slate-50 dark:bg-slate-900/40">
              <tr>
                <th style={{ width: getColumnWidth('select') }} className="relative px-3 py-3 text-left">
                  <button onClick={toggleSelectAllVisible} className="nf-table-select-btn">
                    {allVisibleSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <button type="button" aria-label="Redimensionar coluna Seleção" onMouseDown={(e) => handleResizeStart(e, 'select', 54, 54)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('codDocumento') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('codDocumento')} className="inline-flex items-center gap-1 pr-2">Cód. Documento {renderSortIcon('codDocumento')}</button>
                  <button type="button" aria-label="Redimensionar coluna Cód. Documento" onMouseDown={(e) => handleResizeStart(e, 'codDocumento', 170)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('razaoSocial') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('razaoSocial')} className="inline-flex items-center gap-1 pr-2">Razão Social {renderSortIcon('razaoSocial')}</button>
                  <button type="button" aria-label="Redimensionar coluna Razão Social" onMouseDown={(e) => handleResizeStart(e, 'razaoSocial', 210)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('valor') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('valor')} className="inline-flex items-center gap-1 pr-2">Valor {renderSortIcon('valor')}</button>
                  <button type="button" aria-label="Redimensionar coluna Valor" onMouseDown={(e) => handleResizeStart(e, 'valor', 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('periodo') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('periodo')} className="inline-flex items-center gap-1 pr-2">Período {renderSortIcon('periodo')}</button>
                  <button type="button" aria-label="Redimensionar coluna Período" onMouseDown={(e) => handleResizeStart(e, 'periodo', 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('localizacao') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('localizacao')} className="inline-flex items-center gap-1 pr-2">Localização {renderSortIcon('localizacao')}</button>
                  <button type="button" aria-label="Redimensionar coluna Localização" onMouseDown={(e) => handleResizeStart(e, 'localizacao', 170)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('actionCode') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('actionCode')} className="inline-flex items-center gap-1 pr-2">Código de Ação {renderSortIcon('actionCode')}</button>
                  <button type="button" aria-label="Redimensionar coluna Código de Ação" onMouseDown={(e) => handleResizeStart(e, 'actionCode', 190)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('unidadeNegocio') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('unidadeNegocio')} className="inline-flex items-center gap-1 pr-2">Unidade de Negócio {renderSortIcon('unidadeNegocio')}</button>
                  <button type="button" aria-label="Redimensionar coluna Unidade de Negócio" onMouseDown={(e) => handleResizeStart(e, 'unidadeNegocio', 180)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('orcadoNaoOrcado') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('orcadoNaoOrcado')} className="inline-flex items-center gap-1 pr-2">Orçado/Não Orçado {renderSortIcon('orcadoNaoOrcado')}</button>
                  <button type="button" aria-label="Redimensionar coluna Orçado/Não Orçado" onMouseDown={(e) => handleResizeStart(e, 'orcadoNaoOrcado', 180)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('programa') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('programa')} className="inline-flex items-center gap-1 pr-2">Programa {renderSortIcon('programa')}</button>
                  <button type="button" aria-label="Redimensionar coluna Programa" onMouseDown={(e) => handleResizeStart(e, 'programa', 170)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('instituicao') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('instituicao')} className="inline-flex items-center gap-1 pr-2">Instituição {renderSortIcon('instituicao')}</button>
                  <button type="button" aria-label="Redimensionar coluna Instituição" onMouseDown={(e) => handleResizeStart(e, 'instituicao', 190)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('projeto') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('projeto')} className="inline-flex items-center gap-1 pr-2">Projeto {renderSortIcon('projeto')}</button>
                  <button type="button" aria-label="Redimensionar coluna Projeto" onMouseDown={(e) => handleResizeStart(e, 'projeto', 170)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('classificacaoProjetoAtt') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('classificacaoProjetoAtt')} className="inline-flex items-center gap-1 pr-2">Classificação ATT {renderSortIcon('classificacaoProjetoAtt')}</button>
                  <button type="button" aria-label="Redimensionar coluna Classificação ATT" onMouseDown={(e) => handleResizeStart(e, 'classificacaoProjetoAtt', 190)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('publicoAlvo') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" className="inline-flex items-center gap-1 pr-2">Público Alvo</button>
                  <button type="button" aria-label="Redimensionar coluna Público Alvo" onMouseDown={(e) => handleResizeStart(e, 'publicoAlvo', 160)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('classe') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" className="inline-flex items-center gap-1 pr-2">Classe</button>
                  <button type="button" aria-label="Redimensionar coluna Classe" onMouseDown={(e) => handleResizeStart(e, 'classe', 140)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('classificacaoConta') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" className="inline-flex items-center gap-1 pr-2">Classificação Conta</button>
                  <button type="button" aria-label="Redimensionar coluna Classificação Conta" onMouseDown={(e) => handleResizeStart(e, 'classificacaoConta', 160)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('status') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 pr-2">Status {renderSortIcon('status')}</button>
                  <button type="button" aria-label="Redimensionar coluna Status" onMouseDown={(e) => handleResizeStart(e, 'status', 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('pendencia') }} className="relative px-3 py-3 text-left font-semibold">
                  <button type="button" onClick={() => toggleSort('pendencia')} className="inline-flex items-center gap-1 pr-2">Pendência {renderSortIcon('pendencia')}</button>
                  <button type="button" aria-label="Redimensionar coluna Pendência" onMouseDown={(e) => handleResizeStart(e, 'pendencia', 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
                <th style={{ width: getColumnWidth('acoes') }} className="relative px-3 py-3 text-left font-semibold">Ações
                  <button type="button" aria-label="Redimensionar coluna Ações" onMouseDown={(e) => handleResizeStart(e, 'acoes', 120, 100)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                </th>
              </tr>
            </thead>
            <tbody>
              {notasOrdenadas.map((nf) => (
                <tr key={nf.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/40">
                  <td className="px-3 py-3">
                    <button onClick={() => toggleRow(nf.id)} className="nf-table-select-btn">
                      {selectedIds.includes(nf.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-3 py-3">{nf.camposClassificacao?.codDocumento || '-'}</td>
                  <td className="px-3 py-3">{nf.camposClassificacao?.razaoSocial || nf.fornecedor || '-'}</td>
                  <td className="px-3 py-3">R$ {Number(nf.valor || 0).toFixed(2)}</td>
                  <td className="px-3 py-3">{nf.periodo || (nf.dataEmissao ? new Date(nf.dataEmissao).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '-')}</td>
                  <td className="px-3 py-3">{getLocalizacaoLinha(nf)}</td>
                  <td className="px-3 py-3">{resolveActionCodeLabel(nf.actionCode)}</td>
                  <td className="px-3 py-3">
                    {inlineEditMode ? (
                      <select
                        value={getInlineFieldsForRow(nf).unidadeNegocio}
                        onChange={(e) => updateInlineFieldForRow(nf, 'unidadeNegocio', e.target.value)}
                        className="nf-inline-select w-44 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="">Selecione</option>
                        {buildSelectableOptions(nomesUnidadesNegocio, getInlineFieldsForRow(nf).unidadeNegocio).map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      nf.camposClassificacao?.unidadeNegocio || '-'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {inlineEditMode ? (
                      <select
                        value={getInlineFieldsForRow(nf).orcadoNaoOrcado}
                        onChange={(e) => updateInlineFieldForRow(nf, 'orcadoNaoOrcado', e.target.value)}
                        className="nf-inline-select w-44 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="">Selecione</option>
                        <option value="ORCADO">Orçado</option>
                        <option value="NAO_ORCADO">Não Orçado</option>
                      </select>
                    ) : (
                      nf.camposClassificacao?.orcadoNaoOrcado || '-'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {inlineEditMode ? (
                      <select
                        value={getInlineFieldsForRow(nf).programa}
                        onChange={(e) => updateInlineFieldForRow(nf, 'programa', e.target.value)}
                        className="nf-inline-select w-44 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="">Selecione</option>
                        {nomesProgramasAtivos.map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      nf.camposClassificacao?.programa || '-'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {inlineEditMode ? (
                      <select
                        value={getInlineFieldsForRow(nf).instituicao}
                        onChange={(e) => updateInlineFieldForRow(nf, 'instituicao', e.target.value)}
                        className="nf-inline-select w-48 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="">Selecione</option>
                        {nomesInstituicoesAtivas.map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      nf.camposClassificacao?.instituicao || '-'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {inlineEditMode ? (
                      <select
                        value={getInlineFieldsForRow(nf).projeto}
                        onChange={(e) => {
                          const projeto = e.target.value;
                          const proj = projetosAtivos.find((p: any) => p.nome === projeto);
                          updateInlineFieldForRow(nf, 'projeto', projeto);
                        }}
                        className="nf-inline-select w-44 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="">Selecione</option>
                        {nomesProjetosAtivos.map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      nf.camposClassificacao?.projeto || '-'
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {inlineEditMode ? (
                      <select
                        value={getInlineFieldsForRow(nf).classificacaoProjetoAtt}
                        onChange={(e) => updateInlineFieldForRow(nf, 'classificacaoProjetoAtt', e.target.value)}
                        className="nf-inline-select w-48 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="">Selecione</option>
                        {nomesClassificacoesAtivas.map((nome) => (
                          <option key={nome} value={nome}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      nf.camposClassificacao?.classificacaoProjetoAtt || '-'
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {nf.camposClassificacao?.publicoAlvo || '-'}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {inlineEditMode ? (
                      <input
                        value={getInlineFieldsForRow(nf).classe}
                        onChange={(e) => updateInlineFieldForRow(nf, 'classe', e.target.value)}
                        className="w-36 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      nf.camposClassificacao?.classe || '-'
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {inlineEditMode ? (
                      <input
                        value={getInlineFieldsForRow(nf).classificacaoConta}
                        onChange={(e) => updateInlineFieldForRow(nf, 'classificacaoConta', e.target.value)}
                        className="w-36 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      nf.camposClassificacao?.classificacaoConta || '-'
                    )}
                  </td>
                  <td className="px-3 py-3">{nf.status}</td>
                  <td className="px-3 py-3">
                    {nf.pendenteClassificacao ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[0.82em] font-semibold text-amber-700">Pendente</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[0.82em] font-semibold text-emerald-700">Completa</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {!inlineEditMode ? (
                        <button
                          onClick={() => beginInlineEditRow(nf)}
                          className="nf-table-action-btn rounded-lg border border-indigo-500 px-3 py-1 text-[0.82em] font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300"
                        >
                          Editar linha
                        </button>
                      ) : null}
                      {inlineEditMode ? (
                        <>
                          <button
                            onClick={() => saveInlineEdit(nf)}
                            className="nf-table-action-btn rounded-lg border border-emerald-500 px-3 py-1 text-[0.82em] font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300"
                          >
                            Salvar linha
                          </button>
                          <button
                            onClick={() => resetInlineFieldsForRow(nf)}
                            className="nf-table-action-btn rounded-lg border border-slate-300 px-3 py-1 text-[0.82em] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                          >
                            Limpar alterações
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={() => openClassificacao(nf)}
                        className="nf-table-action-btn rounded-lg border border-primary-500 px-3 py-1 text-[0.82em] font-medium text-primary-700 hover:bg-primary-50 dark:text-primary-300"
                      >
                        Classificar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm dark:border-slate-700">
            <span>
              Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} de {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="nf-table-footer-btn rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
              >
                Anterior
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="nf-table-footer-btn rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
  );
};
