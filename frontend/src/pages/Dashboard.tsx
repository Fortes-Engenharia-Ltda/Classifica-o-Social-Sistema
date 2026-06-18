import React, { useMemo, useState } from 'react';
import { useDashboardMetricas, useDashboardAlertas } from '@/hooks/useDashboard';
import { StatCard } from '@/components/DashboardComponents';
import { Alerta } from '@/types';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardFilters = {
  programa: string[];
  classificacao: string[];
  orcadoNaoOrcado: string[];
  obraId: string[];
  projeto: string[];
  dataInicio: string;
  dataFim: string;
};

const createDefaultFilters = (): DashboardFilters => ({
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

type ChartItem = {
  name: string;
  value: number;
};

type CombinedChartItem = {
  name: string;
  value: number;
  quantidade: number;
  valorMonetario: number;
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

  const toggleValue = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(values.filter((item) => item !== value));
      setQuery('');
      return;
    }

    onChange([...values, value]);
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
  const actionClass = mini
    ? 'px-1.5 py-1 text-[11px]'
    : compact
      ? 'px-2 py-1.5 text-xs'
      : 'px-3 py-2 text-sm';

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
        className={`w-full rounded-lg border border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${inputClass}`}
      />

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange([]);
                setQuery('');
              }}
              className={`w-full text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${actionClass}`}
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
              className={`w-full text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${actionClass}`}
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
              className={`flex w-full items-center gap-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${optionClass}`}
            >
              <span
                className={`inline-flex items-center justify-center rounded border ${checkClass} ${
                  selectedSet.has(item.value)
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-400 text-transparent dark:border-gray-500'
                }`}
              >
                ✓
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {filteredOptions.length === 0 && (
            <div className={`${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} text-gray-500 dark:text-gray-400`}>Nenhuma opção encontrada</div>
          )}
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>(() => createDefaultFilters());
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
  const {
    sidebarOpen,
    dashboardSideFilterExpanded,
    toggleDashboardSideFilterExpanded,
  } = useUIStore();

  const { data: metricas, isLoading: metricsLoading } = useDashboardMetricas(filters);
  const { data: alertas, isLoading: alertasLoading } = useDashboardAlertas();
  const [metricMode, setMetricMode] = useState<'quantidade' | 'valor'>('quantidade');

  const formatCurrency = (value: number) => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`;

  const metricasData = metricas?.data || {};
  const alertasData = alertas?.data?.alertas || [];
  const filtrosDisponiveis = metricasData.filtrosDisponiveis || {};
  const obrasDisponiveis = filtrosDisponiveis.obras || [];

  const programaOptions: SearchableOption[] = (filtrosDisponiveis.programas || []).map((item: string) => ({
    value: item,
    label: item,
  }));
  const classificacaoOptions: SearchableOption[] = (filtrosDisponiveis.classificacoes || []).map((item: string) => ({
    value: item,
    label: item,
  }));
  const orcadoOptions: SearchableOption[] = (filtrosDisponiveis.orcadoNaoOrcado || []).map((item: string) => ({
    value: item,
    label: item,
  }));
  const projetoOptions: SearchableOption[] = (filtrosDisponiveis.projetos || []).map((item: string) => ({
    value: item,
    label: item,
  }));
  const obraOptions: SearchableOption[] = obrasDisponiveis.map((obra: { id: number; nome: string }) => ({
    value: String(obra.id),
    label: obra.nome,
  }));

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

  const distribuicaoPrograma = metricasData.distribuicaoPorPrograma || [];
  const distribuicaoClassificacao = metricasData.distribuicaoPorClassificacao || [];
  const distribuicaoOrcado = metricasData.distribuicaoPorOrcado || [];
  const distribuicaoLocalizacao = metricasData.distribuicaoPorLocalizacao || [];
  const nfPorObra = metricasData.nfPorObra || [];
  const valoresPorPrograma = metricasData.valoresPorPrograma || [];
  const valoresPorClassificacao = metricasData.valoresPorClassificacao || [];
  const valoresPorObra = metricasData.valoresPorObra || [];
  const valoresPorOrcado = metricasData.valoresPorOrcado || [];
  const valoresPorLocalizacao = metricasData.valoresPorLocalizacao || [];
  const curvaMensal = metricasData.curvaPrevistoRealizadoMensalProjetos || {
    competencias: [],
    series: [],
    totalProjetos: 0,
    projetosExibidos: 0,
    metodologia: '',
  };

  const curvaMensalRows = useMemo(() => {
    return (curvaMensal.competencias || []).map((competencia: string, index: number) => {
      const row: Record<string, number | string> = { competencia };

      (curvaMensal.series || []).forEach((serie: { projeto: string; previsto: number[]; realizado: number[] }, serieIndex: number) => {
        row[`previsto_${serieIndex}`] = Number(serie.previsto?.[index] || 0);
        row[`realizado_${serieIndex}`] = Number(serie.realizado?.[index] || 0);
      });

      return row;
    });
  }, [curvaMensal]);

  const linePalette = ['#1d4ed8', '#0f766e', '#c2410c', '#7c3aed', '#be123c', '#0369a1'];

  const buildCombinedChartData = (
    countData: ChartItem[],
    monetaryData: ChartItem[],
    mode: 'quantidade' | 'valor',
  ): CombinedChartItem[] => {
    const qtyMap = new Map<string, number>();
    const valueMap = new Map<string, number>();

    countData.forEach((item) => {
      qtyMap.set(String(item.name || ''), Number(item.value || 0));
    });

    monetaryData.forEach((item) => {
      valueMap.set(String(item.name || ''), Number(item.value || 0));
    });

    const names = Array.from(new Set([...qtyMap.keys(), ...valueMap.keys()]));

    return names.map((name) => {
      const quantidade = Number(qtyMap.get(name) || 0);
      const valorMonetario = Number(valueMap.get(name) || 0);
      return {
        name,
        quantidade,
        valorMonetario,
        value: mode === 'valor' ? valorMonetario : quantidade,
      };
    });
  };

  const programaChartData = useMemo(
    () => buildCombinedChartData(distribuicaoPrograma, valoresPorPrograma, metricMode),
    [distribuicaoPrograma, valoresPorPrograma, metricMode],
  );
  const classificacaoChartData = useMemo(
    () => buildCombinedChartData(distribuicaoClassificacao, valoresPorClassificacao, metricMode),
    [distribuicaoClassificacao, valoresPorClassificacao, metricMode],
  );
  const obraChartData = useMemo(
    () => buildCombinedChartData(nfPorObra, valoresPorObra, metricMode),
    [nfPorObra, valoresPorObra, metricMode],
  );
  const orcadoChartData = useMemo(
    () => buildCombinedChartData(distribuicaoOrcado, valoresPorOrcado, 'quantidade'),
    [distribuicaoOrcado, valoresPorOrcado],
  );
  const localizacaoChartData = useMemo(
    () => buildCombinedChartData(distribuicaoLocalizacao, valoresPorLocalizacao, 'quantidade'),
    [distribuicaoLocalizacao, valoresPorLocalizacao],
  );
  const regiaoChartData = useMemo(
    () => (metricasData.distribuicaoPorRegiao || []).slice().sort((a: any, b: any) => b.value - a.value),
    [metricasData.distribuicaoPorRegiao],
  );

  const renderBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const raw = payload[0]?.payload || {};
    const quantidade = Number(raw.quantidade || 0);
    const valorMonetario = Number(raw.valorMonetario || 0);

    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="font-semibold text-gray-900 dark:text-white">{String(label || raw.name || '')}</p>
        <p className="text-gray-700 dark:text-gray-200">Quantidade: {quantidade.toLocaleString('pt-BR')}</p>
        <p className="text-gray-700 dark:text-gray-200">Valor Monetário: {formatCurrency(valorMonetario)}</p>
      </div>
    );
  };

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

  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const limparFiltros = () => {
    setFilters(createDefaultFilters());
  };

  const useVerticalFilterLayout = sidebarOpen;
  const dashboardCompactMode = useVerticalFilterLayout && dashboardSideFilterExpanded;

  const isInitialLoading = (metricsLoading || alertasLoading) && !metricas && !alertas;

  if (isInitialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className={useVerticalFilterLayout ? 'transition-all duration-300 lg:-ml-6 lg:-mt-6 lg:flex lg:items-start lg:gap-0' : 'transition-all duration-300'}>
      {useVerticalFilterLayout ? (
        <aside
          className={`sticky top-0 z-30 hidden h-[calc(100vh-64px)] shrink-0 lg:block ${
            dashboardSideFilterExpanded ? 'w-64 xl:w-72' : 'w-14 xl:w-16'
          }`}
        >
          <div
            className="relative h-full w-full overflow-hidden border-r border-slate-200/80 bg-white/95 transition-all duration-300 dark:border-slate-700/80 dark:bg-slate-950/95"
          >
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
                      value={filters.dataInicio || ''}
                      onChange={(e) => updateFilter('dataInicio', e.target.value)}
                      className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      aria-label="Data de início"
                    />
                    <input
                      type="date"
                      value={filters.dataFim || ''}
                      onChange={(e) => updateFilter('dataFim', e.target.value)}
                      className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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

      <div className={`min-w-0 flex-1 ${dashboardCompactMode ? 'dashboard-content-compact' : ''}`}>
        <div className={`${useVerticalFilterLayout ? 'lg:hidden ' : ''}sticky top-0 z-30`}>
          <div className="-mx-6 -mt-6 mb-8 border-b border-gray-200/80 bg-gray-50/95 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-900/95">
            <div className="px-3 pb-2 pt-1 lg:hidden">
              <div className="rounded-lg border border-gray-200 bg-white/95 p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800/95">
                <div className="mb-1.5 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersExpanded((value) => !value)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-600 dark:text-gray-200"
                  >
                    Filtros {selectedFiltersCount ? `(${selectedFiltersCount})` : ''}
                    {mobileFiltersExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-700 dark:border-gray-600 dark:text-gray-200"
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
                      className="h-7 w-full rounded-lg border border-gray-300 bg-white px-1.5 text-[11px] text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      aria-label="Data de início"
                    />
                    <input
                      type="date"
                      value={filters.dataFim}
                      onChange={(e) => updateFilter('dataFim', e.target.value)}
                      className="h-7 w-full rounded-lg border border-gray-300 bg-white px-1.5 text-[11px] text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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

            <div className="hidden px-4 pb-2 pt-2 lg:block">
              <div className="bg-transparent p-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Filtros do Dashboard</h2>
                  <div className="inline-flex w-fit items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200">
                    Intervalo selecionado: {periodoSelecionadoLabel}
                  </div>
                </div>

                <div className="grid grid-cols-8 items-end gap-2">
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Data início</label>
                    <input
                      type="date"
                      value={filters.dataInicio}
                      onChange={(e) => updateFilter('dataInicio', e.target.value)}
                      className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      aria-label="Data de início"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Data fim</label>
                    <input
                      type="date"
                      value={filters.dataFim}
                      onChange={(e) => updateFilter('dataFim', e.target.value)}
                      className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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

                  <div className="min-w-0">
                    <label className="mb-1 block text-xs font-medium text-transparent">.</label>
                    <button
                      onClick={limparFiltros}
                      className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-gray-300 px-2 text-xs text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <X size={12} />
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {useVerticalFilterLayout && !dashboardSideFilterExpanded ? (
          <div className="sticky top-2 z-20 mb-3 hidden lg:block">
            <div className="inline-flex w-full items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200 xl:w-fit">
              Período filtrado: {periodoSelecionadoLabel}
            </div>
          </div>
        ) : null}

        <div className="mb-3 mt-3 flex items-center justify-between">
          <h1 className={`${dashboardCompactMode ? 'text-2xl sm:text-3xl xl:text-4xl' : 'text-3xl xl:text-4xl'} font-bold text-gray-900 dark:text-white`}>
            Dashboard
          </h1>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          <StatCard label="NFs Pendentes para Analisar" value={metricasData.nfPendentes || 0} icon="📋" color="border-red-500" compact={dashboardCompactMode} />
          <StatCard label="NFs Classificadas" value={metricasData.nfClassificadas || 0} icon="✅" color="border-blue-500" compact={dashboardCompactMode} />
          <StatCard label="Valor Orçado" value={formatCurrency(metricasData.totalValorOrcado || 0)} icon="💼" color="border-emerald-500" compact={dashboardCompactMode} />
          <StatCard label="Valor Não Orçado" value={formatCurrency(metricasData.totalValorNaoOrcado || 0)} icon="🧾" color="border-amber-500" compact={dashboardCompactMode} />
          <StatCard label="Valor Previsto Projetos" value={formatCurrency(metricasData.valorPrevistoProjetos || 0)} icon="📈" color="border-purple-500" compact={dashboardCompactMode} />
          <StatCard label="Instituições" value={metricasData.totalInstituicoes || 0} icon="🏢" color="border-indigo-500" compact={dashboardCompactMode} />
          <StatCard label="Obras Ativas" value={metricasData.obrasAtivas || 0} icon="🏗️" color="border-cyan-500" compact={dashboardCompactMode} />
          <StatCard label="Valor Total de NFs" value={formatCurrency(metricasData.totalValor || 0)} icon="💰" color="border-blue-500" compact={dashboardCompactMode} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Curva Previsto x Realizado por Projeto (Mês/Ano)</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Exibindo {curvaMensal.projetosExibidos || 0} de {curvaMensal.totalProjetos || 0} projetos com maior volume financeiro.</p>
              {curvaMensal.metodologia && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{curvaMensal.metodologia}</p>}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={curvaMensalRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competencia" />
                <YAxis />
                <Tooltip formatter={(value: number | string) => formatCurrency(Number(value || 0))} labelFormatter={(label) => `Competência: ${label}`} />
                <Legend />
                {(curvaMensal.series || []).map((serie: { projeto: string; previsto: number[]; realizado: number[] }, index: number) => (
                  <React.Fragment key={serie.projeto}>
                    <Line type="monotone" dataKey={`previsto_${index}`} stroke={linePalette[index % linePalette.length]} strokeWidth={2} strokeDasharray="6 3" name={`${serie.projeto} - Previsto`} dot={false} />
                    <Line type="monotone" dataKey={`realizado_${index}`} stroke={linePalette[index % linePalette.length]} strokeWidth={2} name={`${serie.projeto} - Realizado`} dot={false} />
                  </React.Fragment>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Distribuição Orçado x Não Orçado</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={orcadoChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={renderBarTooltip} />
                <Legend />
                <Bar dataKey="value" fill="#0284c7" name={metricMode === 'valor' ? 'Valor (R$)' : 'Quantidade NFs'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Classificação por Região Geográfica</h3>
            {regiaoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={regiaoChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} labelFormatter={(label) => `Região: ${label}`} />
                  <Legend />
                  <Bar dataKey="value" fill="#0891b2" name="Quantidade NFs" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-gray-400">Nenhum dado de região disponível</div>
            )}
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quantidade por Localização</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={localizacaoChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={renderBarTooltip} />
                <Legend />
                <Bar dataKey="value" fill="#0ea5e9" name={metricMode === 'valor' ? 'Valor (R$)' : 'Quantidade NFs'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{metricMode === 'valor' ? 'Valor de NFs por Programa' : 'NFs por Programa'}</h3>
              <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                <button type="button" onClick={() => setMetricMode('quantidade')} className={`px-3 py-1 text-xs ${metricMode === 'quantidade' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>Quantidade</button>
                <button type="button" onClick={() => setMetricMode('valor')} className={`px-3 py-1 text-xs ${metricMode === 'valor' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>Valor (R$)</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={renderBarTooltip} />
                <Legend />
                <Bar dataKey="value" fill="#7c3aed" name={metricMode === 'valor' ? 'Valor (R$)' : 'Quantidade NFs'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{metricMode === 'valor' ? 'Valor de NFs por Classificação' : 'NFs por Classificação'}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classificacaoChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={renderBarTooltip} />
                <Legend />
                <Bar dataKey="value" fill="#0ea5e9" name={metricMode === 'valor' ? 'Valor (R$)' : 'Quantidade NFs'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{metricMode === 'valor' ? 'Valor de NFs por Obra' : 'NFs por Obra'}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={obraChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={renderBarTooltip} />
                <Legend />
                <Bar dataKey="value" fill="#f59e0b" name={metricMode === 'valor' ? 'Valor (R$)' : 'Quantidade NFs'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Alertas Ativos ({alertasData.length})</h3>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {alertasData.length > 0 ? (
                alertasData.slice(0, 10).map((alerta: Alerta) => (
                  <div key={alerta.id} className="rounded border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-100">{alerta.tipo}</p>
                    <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-200">{alerta.mensagem}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum alerta ativo</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
