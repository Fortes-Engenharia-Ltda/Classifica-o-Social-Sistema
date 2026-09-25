import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClassificacaoService } from '@/services';
import { DataTable } from '@/components/DataTable';
import { Classificacao } from '@/types';
import { Plus, X } from 'lucide-react';

export const Classificacoes: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'nome'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
  });

  const { data, refetch } = useQuery({
    queryKey: ['classificacoes', page, pageSize, search, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const response = await ClassificacaoService.getAll(page, pageSize, {
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      return response.data;
    },
  });

  const abrirNovo = () => {
    setEditId(null);
    setErro('');
    setFormData({ nome: '', categoria: '' });
    setShowModal(true);
  };

  const abrirEditar = (classificacao: Classificacao) => {
    setEditId(classificacao.id);
    setErro('');
    setFormData({
      nome: classificacao.nome,
      categoria: classificacao.categoria || '',
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (classificacao: Classificacao) => {
    try {
      await ClassificacaoService.update(classificacao.id, { status: !classificacao.status });
      refetch();
    } catch {
      setErro('Erro ao alterar status da classificação');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await ClassificacaoService.update(editId, formData);
      } else {
        await ClassificacaoService.create(formData);
      }
      setFormData({ nome: '', categoria: '' });
      setShowModal(false);
      setEditId(null);
      setErro('');
      refetch();
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao salvar classificação');
    }
  };

  const columns = [
    { key: 'id' as const, label: 'ID', sortable: true },
    { key: 'nome' as const, label: 'Nome', sortable: true },
    { key: 'categoria' as const, label: 'Categoria' },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: boolean, row: Classificacao) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(row)}
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            value
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
          }`}
        >
          {value ? 'Ativo' : 'Inativo'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Classificações</h1>
        <button
          onClick={abrirNovo}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          <span>Nova Classificação</span>
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome, código ou categoria"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
            setPage(1);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="all">Status: Todos</option>
          <option value="active">Status: Ativos</option>
          <option value="inactive">Status: Inativos</option>
        </select>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editId ? 'Editar Classificação' : 'Nova Classificação'}</h2>
              <button type="button" onClick={() => { setShowModal(false); setEditId(null); setErro(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {erro && (
                <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {erro}
                </div>
              )}
              <input
                type="text"
                placeholder="Nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditId(null);
                    setErro('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable<Classificacao>
        columns={columns}
        data={data?.classificacoes || []}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onEdit={abrirEditar}
        searchable={false}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(nextSortBy, nextSortOrder) => {
          if (nextSortBy === 'id' || nextSortBy === 'nome') {
            setSortBy(nextSortBy);
            setSortOrder(nextSortOrder);
            setPage(1);
          }
        }}
      />
    </div>
  );
};
