import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';
import { Programas } from '@/pages/Programas';
import { Classificacoes } from '@/pages/Classificacoes';
import { Obras } from '@/pages/Obras';

type Aba = 'orcado-nao-orcado' | 'classificacao-contas' | 'classificacao' | 'programas-sociais' | 'obras' | 'publicos-alvo';

interface Registro {
  id: number;
  codigo?: string;
  nome?: string;
  status?: boolean;
}

interface OrcadoNaoOrcadoRegistro {
  id: number;
  nome: string;
  status: boolean;
}

interface ClassificacaoContaRegistro {
  id: number;
  codigoAcao: number;
  nome: string;
  orcadoNaoOrcadoId: number;
  orcadoNaoOrcadoNome: string;
  status: boolean;
}

const labels: Record<Aba, string> = {
  'orcado-nao-orcado': 'Orçado/Não Orçado',
  'classificacao-contas': 'Classificação de Contas',
  classificacao: 'Classificação',
  'programas-sociais': 'Programas Sociais',
  obras: 'Obras',
  'publicos-alvo': 'Públicos Alvo',
};

type SortKey = 'id' | 'nome' | 'status';

export const AdminCadastros: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('orcado-nao-orcado');
  const [searchOrcado, setSearchOrcado] = useState('');
  const [showNovoOrcadoModal, setShowNovoOrcadoModal] = useState(false);
  const [nome, setNome] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [erroCadastro, setErroCadastro] = useState('');
  const [itens, setItens] = useState<Registro[]>([]);
  const [contas, setContas] = useState<ClassificacaoContaRegistro[]>([]);
  const [orcadoOptions, setOrcadoOptions] = useState<OrcadoNaoOrcadoRegistro[]>([]);
  const [showContaModal, setShowContaModal] = useState(false);
  const [contaEditId, setContaEditId] = useState<number | null>(null);
  const [contaCodigoAcao, setContaCodigoAcao] = useState('');
  const [contaNome, setContaNome] = useState('');
  const [contaOrcadoId, setContaOrcadoId] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('admin-cadastros:orcado-nao-orcado:columnWidths');
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

  const carregar = async () => {
    if (abaAtiva !== 'orcado-nao-orcado' && abaAtiva !== 'classificacao-contas' && abaAtiva !== 'publicos-alvo') {
      setItens([]);
      setContas([]);
      return;
    }

    try {
      if (abaAtiva === 'orcado-nao-orcado') {
        const response = await api.get('/admin-cadastros/orcado-nao-orcado');
        const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
        setItens(data);
      }

      if (abaAtiva === 'publicos-alvo') {
        const response = await api.get('/admin-cadastros/publicos-alvo');
        const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
        setItens(data);
      }

      if (abaAtiva === 'classificacao-contas') {
        const [resContas, resOrcado] = await Promise.all([
          api.get('/admin-cadastros/classificacao-contas'),
          api.get('/admin-cadastros/orcado-nao-orcado'),
        ]);

        const contasData = Array.isArray(resContas.data) ? resContas.data : resContas.data?.data ?? [];
        const orcadoData = Array.isArray(resOrcado.data) ? resOrcado.data : resOrcado.data?.data ?? [];

        setContas(contasData);
        setOrcadoOptions(orcadoData.filter((item: OrcadoNaoOrcadoRegistro) => item.status));
      }
    } catch {
      setItens([]);
      setContas([]);
    }
  };

  useEffect(() => {
    carregar();
  }, [abaAtiva]);

  const itensFiltrados = useMemo(() => {
    const term = searchOrcado.trim().toLowerCase();
    if (!term) {
      return itens;
    }

    return itens.filter((item) => {
      const statusTexto = typeof item.status === 'boolean' ? (item.status ? 'ativo' : 'inativo') : '';
      return (
        String(item.id).toLowerCase().includes(term) ||
        String(item.nome || '')
          .toLowerCase()
          .includes(term) ||
        statusTexto.includes(term)
      );
    });
  }, [itens, searchOrcado]);

  const contasFiltradas = useMemo(() => {
    const term = searchOrcado.trim().toLowerCase();
    if (!term) {
      return contas;
    }

    return contas.filter((item) => {
      const statusTexto = item.status ? 'ativo' : 'inativo';
      return (
        String(item.id).toLowerCase().includes(term)
        || String(item.codigoAcao || '').toLowerCase().includes(term)
        || String(item.nome || '').toLowerCase().includes(term)
        || String(item.orcadoNaoOrcadoNome || '').toLowerCase().includes(term)
        || statusTexto.includes(term)
      );
    });
  }, [contas, searchOrcado]);

  const itensOrdenados = useMemo(() => {
    const normalize = (value: unknown) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return [...itensFiltrados].sort((a, b) => {
      if (sortBy === 'id') {
        const av = Number(a.id || 0);
        const bv = Number(b.id || 0);
        return sortOrder === 'asc' ? av - bv : bv - av;
      }

      if (sortBy === 'status') {
        const av = a.status ? 1 : 0;
        const bv = b.status ? 1 : 0;
        return sortOrder === 'asc' ? av - bv : bv - av;
      }

      const av = normalize(a[sortBy]);
      const bv = normalize(b[sortBy]);
      const compare = av.localeCompare(bv, 'pt-BR', { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [itensFiltrados, sortBy, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(key);
    setSortOrder('asc');
  };

  const sortIcon = (key: SortKey) => {
    if (sortBy !== key) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  useEffect(() => {
    localStorage.setItem('admin-cadastros:orcado-nao-orcado:columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const getColumnWidth = (key: 'id' | 'nome' | 'status' | 'acoes'): string | undefined => {
    const width = columnWidths[key];
    return width ? `${width}px` : undefined;
  };

  const handleResizeStart = (
    event: React.MouseEvent,
    key: 'id' | 'nome' | 'status' | 'acoes',
    defaultWidth: number,
    minWidth: number = 90,
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

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (abaAtiva !== 'orcado-nao-orcado' && abaAtiva !== 'publicos-alvo') {
      return;
    }

    const nomeNormalizado = nome.trim();

    if (!nomeNormalizado) {
      setErroCadastro('Nome é obrigatório');
      return;
    }

    try {
      if (editId) {
        await api.put(`/admin-cadastros/${abaAtiva}/${editId}`, { nome: nomeNormalizado });
      } else {
        await api.post(`/admin-cadastros/${abaAtiva}`, { nome: nomeNormalizado });
      }
    } catch (error: any) {
      setErroCadastro(error?.response?.data?.message || 'Erro ao cadastrar item');
      return;
    }

    setNome('');
    setEditId(null);
    setErroCadastro('');
    setShowNovoOrcadoModal(false);
    await carregar();
  };

  const salvarConta = async (e: React.FormEvent) => {
    e.preventDefault();

    const codigoAcao = Number(contaCodigoAcao);
    const nomeNormalizado = contaNome.trim();
    const orcadoId = Number(contaOrcadoId);

    if (!Number.isFinite(codigoAcao) || codigoAcao <= 0) {
      setErroCadastro('Código da ação inválido');
      return;
    }

    if (!nomeNormalizado) {
      setErroCadastro('Nome é obrigatório');
      return;
    }

    if (!Number.isFinite(orcadoId) || orcadoId <= 0) {
      setErroCadastro('Selecione um Orçado/Não Orçado');
      return;
    }

    try {
      if (contaEditId) {
        await api.put(`/admin-cadastros/classificacao-contas/${contaEditId}`, {
          codigoAcao,
          nome: nomeNormalizado,
          orcadoNaoOrcadoId: orcadoId,
        });
      } else {
        await api.post('/admin-cadastros/classificacao-contas', {
          codigoAcao,
          nome: nomeNormalizado,
          orcadoNaoOrcadoId: orcadoId,
        });
      }
    } catch (error: any) {
      setErroCadastro(error?.response?.data?.message || 'Erro ao salvar classificação de conta');
      return;
    }

    setShowContaModal(false);
    setContaEditId(null);
    setContaCodigoAcao('');
    setContaNome('');
    setContaOrcadoId('');
    setErroCadastro('');
    await carregar();
  };

  const abrirEdicao = (item: Registro) => {
    setEditId(item.id);
    setNome(item.nome || '');
    setErroCadastro('');
    setShowNovoOrcadoModal(true);
  };

  const toggleStatus = async (item: Registro) => {
    if (!item.id) return;

    try {
      await api.put(`/admin-cadastros/${abaAtiva}/${item.id}`, {
        status: !(item.status ?? true),
      });
      await carregar();
    } catch (error: any) {
      setErroCadastro(error?.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const abrirEdicaoConta = (item: ClassificacaoContaRegistro) => {
    setContaEditId(item.id);
    setContaCodigoAcao(String(item.codigoAcao || ''));
    setContaNome(item.nome || '');
    setContaOrcadoId(String(item.orcadoNaoOrcadoId || ''));
    setErroCadastro('');
    setShowContaModal(true);
  };

  const toggleStatusConta = async (item: ClassificacaoContaRegistro) => {
    if (!item.id) return;

    try {
      await api.put(`/admin-cadastros/classificacao-contas/${item.id}`, {
        status: !item.status,
      });
      await carregar();
    } catch (error: any) {
      setErroCadastro(error?.response?.data?.message || 'Erro ao alterar status');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Administração de Cadastros</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(labels) as Aba[]).map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`px-4 py-2 rounded-lg border transition ${
              abaAtiva === aba
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
            }`}
          >
            {labels[aba]}
          </button>
        ))}
      </div>

      {abaAtiva === 'programas-sociais' && <Programas />}
      {abaAtiva === 'classificacao' && <Classificacoes />}
      {abaAtiva === 'obras' && <Obras />}

      {abaAtiva === 'classificacao-contas' ? (
        <>
          <div className="mb-4">
            <input
              value={searchOrcado}
              onChange={(e) => setSearchOrcado(e.target.value)}
              placeholder="Pesquisar por código da ação, nome, Orçado/Não Orçado ou status"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
            />
          </div>

          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowContaModal(true);
                setContaEditId(null);
                setContaCodigoAcao('');
                setContaNome('');
                setContaOrcadoId('');
                setErroCadastro('');
              }}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              Nova Classificação de Conta
            </button>
          </div>

          {showContaModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {contaEditId ? 'Editar Classificação de Conta' : 'Nova Classificação de Conta'}
                  </h2>
                  <button type="button" onClick={() => setShowContaModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={salvarConta} className="space-y-3">
                  {erroCadastro && (
                    <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
                      {erroCadastro}
                    </div>
                  )}

                  <input
                    type="number"
                    min={1}
                    value={contaCodigoAcao}
                    onChange={(e) => setContaCodigoAcao(e.target.value)}
                    placeholder="Código da ação"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
                    required
                  />

                  <input
                    value={contaNome}
                    onChange={(e) => setContaNome(e.target.value)}
                    placeholder="Nome da classificação de conta"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
                    required
                  />

                  <select
                    value={contaOrcadoId}
                    onChange={(e) => setContaOrcadoId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
                    required
                  >
                    <option value="">Selecione Orçado/Não Orçado</option>
                    {orcadoOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContaModal(false);
                        setContaEditId(null);
                        setContaCodigoAcao('');
                        setContaNome('');
                        setContaOrcadoId('');
                        setErroCadastro('');
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">Classificação de Contas</div>
            {contasFiltradas.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Nenhum registro encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Código da Ação</th>
                      <th className="px-4 py-3 text-left font-semibold">Nome</th>
                      <th className="px-4 py-3 text-left font-semibold">Orçado/Não Orçado</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {contasFiltradas.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">{item.id}</td>
                        <td className="px-4 py-3">{item.codigoAcao}</td>
                        <td className="px-4 py-3">{item.nome}</td>
                        <td className="px-4 py-3">{item.orcadoNaoOrcadoNome}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleStatusConta(item)}
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              item.status
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
                            }`}
                          >
                            {item.status ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoConta(item)}
                            className="rounded-lg border border-blue-500 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {abaAtiva !== 'orcado-nao-orcado' && abaAtiva !== 'publicos-alvo' ? null : (
        <>
          <div className="mb-4">
            <input
              value={searchOrcado}
              onChange={(e) => setSearchOrcado(e.target.value)}
              placeholder="Pesquisar por ID, nome ou status"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
            />
          </div>

          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowNovoOrcadoModal(true);
                setEditId(null);
                setNome('');
                setErroCadastro('');
              }}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              {abaAtiva === 'publicos-alvo' ? 'Novo Público Alvo' : 'Novo Orçado/Não Orçado'}
            </button>
          </div>

          {showNovoOrcadoModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {abaAtiva === 'publicos-alvo'
                      ? (editId ? 'Editar Público Alvo' : 'Novo Público Alvo')
                      : (editId ? 'Editar Orçado/Não Orçado' : 'Novo Orçado/Não Orçado')}
                  </h2>
                  <button type="button" onClick={() => { setShowNovoOrcadoModal(false); setEditId(null); setErroCadastro(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={criar} className="space-y-3">
                  {erroCadastro && (
                    <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
                      {erroCadastro}
                    </div>
                  )}

                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800"
                    required
                  />

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNovoOrcadoModal(false);
                        setEditId(null);
                        setErroCadastro('');
                        setNome('');
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">{labels[abaAtiva]}</div>
            {itensOrdenados.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Nenhum registro encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[720px] text-sm" style={{ width: 'max-content' }}>
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th style={{ width: getColumnWidth('id') }} className="relative px-4 py-3 text-left font-semibold">
                        <button type="button" onClick={() => handleSort('id')} className="inline-flex items-center gap-1">
                          ID <span className="text-xs text-gray-500">{sortIcon('id')}</span>
                        </button>
                        <button
                          type="button"
                          aria-label="Redimensionar coluna ID"
                          onMouseDown={(e) => handleResizeStart(e, 'id', 90, 70)}
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50"
                        />
                      </th>
                      <th style={{ width: getColumnWidth('nome') }} className="relative px-4 py-3 text-left font-semibold">
                        <button type="button" onClick={() => handleSort('nome')} className="inline-flex items-center gap-1">
                          Nome <span className="text-xs text-gray-500">{sortIcon('nome')}</span>
                        </button>
                        <button
                          type="button"
                          aria-label="Redimensionar coluna Nome"
                          onMouseDown={(e) => handleResizeStart(e, 'nome', 260, 140)}
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50"
                        />
                      </th>
                      <th style={{ width: getColumnWidth('status') }} className="relative px-4 py-3 text-left font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('status')}
                          className="inline-flex items-center gap-1"
                        >
                          Status <span className="text-xs text-gray-500">{sortIcon('status')}</span>
                        </button>
                        <button
                          type="button"
                          aria-label="Redimensionar coluna Status"
                          onMouseDown={(e) => handleResizeStart(e, 'status', 130, 100)}
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50"
                        />
                      </th>
                      <th style={{ width: getColumnWidth('acoes') }} className="relative px-4 py-3 text-left font-semibold">
                        Ações
                        <button
                          type="button"
                          aria-label="Redimensionar coluna Ações"
                          onMouseDown={(e) => handleResizeStart(e, 'acoes', 120, 100)}
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {itensOrdenados.map((item) => (
                      <tr key={item.id}>
                        <td style={{ width: getColumnWidth('id') }} className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.id}</td>
                        <td style={{ width: getColumnWidth('nome') }} className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.nome || '-'}</td>
                        <td style={{ width: getColumnWidth('status') }} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                          {typeof item.status === 'boolean' ? (
                            <button
                              type="button"
                              onClick={() => toggleStatus(item)}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                item.status
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
                              }`}
                            >
                              {item.status ? 'Ativo' : 'Inativo'}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ width: getColumnWidth('acoes') }} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(item)}
                            className="rounded-lg border border-blue-500 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};
