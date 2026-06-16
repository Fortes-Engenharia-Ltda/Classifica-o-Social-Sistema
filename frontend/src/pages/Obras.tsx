import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ObraService } from '@/services';
import { DataTable } from '@/components/DataTable';
import { Obra } from '@/types';
import { Plus } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm';

const origemDProjetos = {
  label: 'dbo.dProjetos',
  descricao: 'Importação exclusiva da tabela dProjetos do SQL Server FortesDW.',
  endpoint: '/obras/sync/dprojetos',
  autoSyncOnOpen: true,
};

const formVazio = {
  codigoObra: '',
  nomeObra: '',
  cidade: '',
  centroCusto: '',
  idCentroCusto: '',
  idUN: '',
  un: '',
  descricao: '',
  projeto: '',
  local: '',
  cliente: '',
  gerente: '',
  gestor: '',
};

const obrasPrefsStorageKey = 'obras:tablePrefs:v1';

const defaultVisibleColumns: Record<string, boolean> = {
  codigoObra: true,
  nomeObra: true,
  status: true,
  projeto: true,
  idCentroCusto: true,
  centroCusto: true,
  idUN: true,
  un: true,
  local: true,
  cliente: true,
  gerente: true,
  gestor: true,
};

type ObrasTablePrefs = {
  pageSize?: number;
  statusFilter?: 'all' | 'active' | 'inactive';
  visibleColumns?: Record<string, boolean>;
};

const loadObrasPrefs = (): ObrasTablePrefs => {
  try {
    const raw = localStorage.getItem(obrasPrefsStorageKey);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as ObrasTablePrefs;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const Obras: React.FC = () => {
  const savedPrefs = loadObrasPrefs();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    [25, 50, 100, 250, 500].includes(Number(savedPrefs.pageSize)) ? Number(savedPrefs.pageSize) : 50,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    savedPrefs.statusFilter === 'active' || savedPrefs.statusFilter === 'inactive' ? savedPrefs.statusFilter : 'all',
  );
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ ...formVazio });
  const [erro, setErro] = useState('');
  const [syncCarregando, setSyncCarregando] = useState(false);
  const [syncMensagem, setSyncMensagem] = useState('');
  const [syncInicialExecutada, setSyncInicialExecutada] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    ...defaultVisibleColumns,
    ...(savedPrefs.visibleColumns || {}),
  });

  const { data, refetch } = useQuery({
    queryKey: ['obras', page, pageSize, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await ObraService.getAll(page, pageSize, {
        search: searchTerm,
        status: statusFilter,
      });
      return response?.data ?? response;
    },
  });

  const payload = (data as any)?.obras ? data : (data as any)?.data;
  const obras = payload?.obras || [];
  const total = payload?.total || 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      await ObraService.create(formData);
      setFormData({ ...formVazio });
      setShowModal(false);
      refetch();
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao criar obra');
    }
  };

  const handleSyncDProjetos = async () => {
    setSyncCarregando(true);
    setSyncMensagem('');
    try {
      const response = await ObraService.syncDProjetos();
      const dados = response?.data || {};
      setSyncMensagem(
        `Sincronização concluída: ${dados.totalSincronizadas || 0} de ${dados.totalLidas || 0} registros processados.`,
      );
      await refetch();
    } catch (error: any) {
      setSyncMensagem(error?.response?.data?.message || 'Falha ao sincronizar dProjetos');
    } finally {
      setSyncCarregando(false);
    }
  };

  useEffect(() => {
    if (syncInicialExecutada) {
      return;
    }

    setSyncInicialExecutada(true);
    if (origemDProjetos.autoSyncOnOpen) {
      void handleSyncDProjetos();
    }
  }, [syncInicialExecutada]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  useEffect(() => {
    const prefs: ObrasTablePrefs = {
      pageSize,
      statusFilter,
      visibleColumns,
    };
    localStorage.setItem(obrasPrefsStorageKey, JSON.stringify(prefs));
  }, [pageSize, statusFilter, visibleColumns]);

  const columnsDisponiveis = [
    {
      key: 'codigoObra' as const,
      label: 'Código',
      width: '130px',
      minWidth: '120px',
      cellClassName: 'truncate',
    },
    {
      key: 'nomeObra' as const,
      label: 'Nome',
      width: '230px',
      minWidth: '200px',
      cellClassName: 'truncate',
    },
    {
      key: 'status' as const,
      label: 'Status',
      width: '110px',
      minWidth: '100px',
      render: (value: boolean) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            value
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          {value ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'projeto' as const,
      label: 'Projeto',
      width: '200px',
      minWidth: '180px',
      cellClassName: 'truncate',
      render: (value: string | null | undefined) => value || '-',
    },
    {
      key: 'idCentroCusto' as const,
      label: 'ID CC',
      width: '120px',
      minWidth: '110px',
      cellClassName: 'truncate',
    },
    {
      key: 'centroCusto' as const,
      label: 'CC',
      width: '120px',
      minWidth: '110px',
      cellClassName: 'truncate',
    },
    {
      key: 'idUN' as const,
      label: 'ID UN',
      width: '110px',
      minWidth: '100px',
      cellClassName: 'truncate',
    },
    {
      key: 'un' as const,
      label: 'UN',
      width: '130px',
      minWidth: '120px',
      cellClassName: 'truncate',
    },
    {
      key: 'local' as const,
      label: 'Local',
      width: '170px',
      minWidth: '150px',
      cellClassName: 'truncate',
      render: (value: string | null | undefined) => value || '-',
    },
    {
      key: 'cliente' as const,
      label: 'Cliente',
      width: '170px',
      minWidth: '150px',
      cellClassName: 'truncate',
      render: (value: string | null | undefined) => value || '-',
    },
    {
      key: 'gerente' as const,
      label: 'Gerente',
      width: '150px',
      minWidth: '130px',
      cellClassName: 'truncate',
      render: (value: string | null | undefined) => value || '-',
    },
    {
      key: 'gestor' as const,
      label: 'Gestor',
      width: '150px',
      minWidth: '130px',
      cellClassName: 'truncate',
      render: (value: string | null | undefined) => value || '-',
    },
  ];

  const colunasVisiveis = columnsDisponiveis.filter((coluna) => visibleColumns[String(coluna.key)] !== false);

  const alternarColuna = (key: string) => {
    const visiveisCount = Object.values(visibleColumns).filter(Boolean).length;
    const atualmenteVisivel = visibleColumns[key] !== false;

    if (atualmenteVisivel && visiveisCount === 1) {
      return;
    }

    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !atualmenteVisivel,
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Obras</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncDProjetos}
            disabled={syncCarregando}
            className="bg-slate-700 hover:bg-slate-800 disabled:opacity-70 text-white px-4 py-2 rounded-lg"
          >
            {syncCarregando ? 'Sincronizando...' : 'Sincronizar dProjetos'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus size={20} />
            <span>Nova Obra</span>
          </button>
        </div>
      </div>

      {syncMensagem && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {syncMensagem}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
        <div className="font-semibold">Fonte configurada: {origemDProjetos.label}</div>
        <div>{origemDProjetos.descricao}</div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className={inputCls}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Registros por página</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={inputCls}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center">
          Total carregado da tabela: <strong className="ml-1">{total}</strong>
        </div>
      </div>

      <div className="mb-4 relative inline-block">
        <button
          type="button"
          onClick={() => setShowColumnSelector((prev) => !prev)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          Escolher colunas
        </button>

        {showColumnSelector && (
          <div className="absolute z-20 mt-2 w-72 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3">
            <div className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
              Marque as colunas que deseja exibir
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {columnsDisponiveis.map((coluna) => {
                const key = String(coluna.key);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key] !== false}
                      onChange={() => alternarColuna(key)}
                      className="rounded border-gray-300"
                    />
                    <span>{coluna.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const todasVisiveis = Object.fromEntries(
                    columnsDisponiveis.map((coluna) => [String(coluna.key), true]),
                  );
                  setVisibleColumns(todasVisiveis);
                }}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                Mostrar todas
              </button>
              <button
                type="button"
                onClick={() => setShowColumnSelector(false)}
                className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nova Obra</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-sm font-medium">Código da obra *</span>
                  <input type="text" placeholder="Ex.: OBR-001" value={formData.codigoObra} onChange={(e) => setFormData({ ...formData, codigoObra: e.target.value })} className={inputCls} required />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Nome da obra *</span>
                  <input type="text" placeholder="Nome descritivo" value={formData.nomeObra} onChange={(e) => setFormData({ ...formData, nomeObra: e.target.value })} className={inputCls} required />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Projeto</span>
                  <input type="text" placeholder="Nome do projeto" value={formData.projeto} onChange={(e) => setFormData({ ...formData, projeto: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">ID Centro de Custo</span>
                  <input type="text" placeholder="idCentroCusto" value={formData.idCentroCusto} onChange={(e) => setFormData({ ...formData, idCentroCusto: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Centro de Custo</span>
                  <input type="text" placeholder="Código CC" value={formData.centroCusto} onChange={(e) => setFormData({ ...formData, centroCusto: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">ID Unidade de Negócio</span>
                  <input type="text" placeholder="idUN" value={formData.idUN} onChange={(e) => setFormData({ ...formData, idUN: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Unidade de Negócio (UN)</span>
                  <input type="text" placeholder="Nome da UN" value={formData.un} onChange={(e) => setFormData({ ...formData, un: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Local</span>
                  <input type="text" placeholder="Cidade/estado ou local da obra" value={formData.local} onChange={(e) => setFormData({ ...formData, local: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Cidade</span>
                  <input type="text" placeholder="Cidade" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Cliente</span>
                  <input type="text" placeholder="Nome do cliente" value={formData.cliente} onChange={(e) => setFormData({ ...formData, cliente: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Gerente</span>
                  <input type="text" placeholder="Nome do gerente" value={formData.gerente} onChange={(e) => setFormData({ ...formData, gerente: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Gestor</span>
                  <input type="text" placeholder="Nome do gestor" value={formData.gestor} onChange={(e) => setFormData({ ...formData, gestor: e.target.value })} className={inputCls} />
                </label>
                <label className="sm:col-span-2 space-y-1">
                  <span className="text-sm font-medium">Descrição</span>
                  <textarea rows={3} placeholder="Descrição da obra" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className={`${inputCls} min-h-[72px]`} />
                </label>
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setErro(''); }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable<Obra>
        columns={colunasVisiveis}
        data={obras}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onSearch={setSearchTerm}
        storageKey="obras"
      />
    </div>
  );
};
