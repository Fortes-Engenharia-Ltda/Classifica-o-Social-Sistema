import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProgramaService } from '@/services';
import { DataTable } from '@/components/DataTable';
import { Programa } from '@/types';
import { Plus, X } from 'lucide-react';

export const Programas: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'nome'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });
  const [erro, setErro] = useState('');

  const { data, refetch } = useQuery({
    queryKey: ['programas', page, pageSize, search, sortBy, sortOrder],
    queryFn: async () => {
      const response = await ProgramaService.getAll(page, pageSize, {
        search,
        sortBy,
        sortOrder,
      });
      return response.data;
    },
  });

  const abrirNovo = () => {
    setEditId(null);
    setErro('');
    setFormData({ nome: '', descricao: '' });
    setShowModal(true);
  };

  const abrirEditar = (programa: Programa) => {
    setEditId(programa.id);
    setErro('');
    setFormData({
      nome: programa.nome,
      descricao: programa.descricao || '',
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (programa: Programa) => {
    try {
      await ProgramaService.update(programa.id, { status: !programa.status });
      refetch();
    } catch (error) {
      setErro('Erro ao alterar status do programa');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await ProgramaService.update(editId, formData);
      } else {
        await ProgramaService.create(formData);
      }
      setFormData({ nome: '', descricao: '' });
      setShowModal(false);
      setEditId(null);
      setErro('');
      refetch();
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao salvar programa');
    }
  };

  const columns = [
    { key: 'id' as const, label: 'ID', sortable: true },
    { key: 'nome' as const, label: 'Nome', sortable: true },
    { key: 'descricao' as const, label: 'Descrição' },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: boolean, row: Programa) => (
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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Programas</h1>
        <button
          onClick={abrirNovo}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          <span>Novo Programa</span>
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Pesquisar programa por nome, código ou descrição"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editId ? 'Editar Programa' : 'Novo Programa'}</h2>
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
              <textarea
                placeholder="Descrição"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
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

      <DataTable<Programa>
        columns={columns}
        data={data?.programas || []}
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
