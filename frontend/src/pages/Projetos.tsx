import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, CalendarRange, LayoutGrid, Table, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ProjetoService } from '@/services';
import { InstituicaoService } from '@/services/InstituicaoService';
import { Projeto, ImpactoMensalProjeto, ParticipanteProjeto } from '@/types';
import api from '@/services/api';

interface DistribuicaoItem {
  competencia: string;
  valor: number;
}

interface DistribuicaoEditavelItem {
  competencia: string;
  valor: string;
}

type SortOrder = 'asc' | 'desc';
type ProjetoTableSortKey =
  | 'nome'
  | 'descricao'
  | 'valorMonetarioPrevisto'
  | 'valorMonetarioRealizado'
  | 'impactadas'
  | 'periodo'
  | 'status';

const formatDateToInput = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const formatDateToPtBr = (value?: string | null): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('pt-BR');
};

const parseCurrency = (value: string): number => {
  if (!value) {
    return 0;
  }
  return Number.parseFloat(value.replace(',', '.')) || 0;
};

const formatCurrencyInput = (value: number): string => value.toFixed(2).replace('.', ',');

const sanitizeCurrencyInput = (value: string): string => {
  let cleaned = value.replace(/[^0-9,]/g, '');
  const firstComma = cleaned.indexOf(',');

  if (firstComma >= 0) {
    cleaned = `${cleaned.slice(0, firstComma + 1)}${cleaned.slice(firstComma + 1).replace(/,/g, '')}`;
  }

  return cleaned;
};

const buildDistribuicao = (valorTotal: number, dataInicio: string, dataFim: string): DistribuicaoItem[] => {
  if (!valorTotal || !dataInicio || !dataFim || dataInicio > dataFim) {
    return [];
  }

  const [inicioAno, inicioMes] = dataInicio.split('-').map(Number);
  const [fimAno, fimMes] = dataFim.split('-').map(Number);

  const quantidadeMeses = (fimAno - inicioAno) * 12 + (fimMes - inicioMes) + 1;
  if (quantidadeMeses <= 0) {
    return [];
  }

  const totalCentavos = Math.round(valorTotal * 100);
  const baseCentavos = Math.floor(totalCentavos / quantidadeMeses);
  const restoCentavos = totalCentavos - baseCentavos * quantidadeMeses;

  const itens: DistribuicaoItem[] = [];

  for (let i = 0; i < quantidadeMeses; i += 1) {
    const mesAbsoluto = (inicioMes - 1) + i;
    const ano = inicioAno + Math.floor(mesAbsoluto / 12);
    const mes = (mesAbsoluto % 12) + 1;
    const valorMes = (baseCentavos + (i < restoCentavos ? 1 : 0)) / 100;

    itens.push({
      competencia: `${String(mes).padStart(2, '0')}/${ano}`,
      valor: valorMes,
    });
  }

  return itens;
};

export const Projetos: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [showDistribuicaoModal, setShowDistribuicaoModal] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [instituicoesPorProjeto, setInstituicoesPorProjeto] = useState<any[]>([]);
  const [publicosAlvo, setPublicosAlvo] = useState<Array<{ id: number; nome: string }>>([]);
  const [deletingProjetoId, setDeletingProjetoId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<ProjetoTableSortKey>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('projetos:tabela:columnWidths');
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
  const [expandedDescricaoProjetos, setExpandedDescricaoProjetos] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [distribuicaoEditavel, setDistribuicaoEditavel] = useState<DistribuicaoEditavelItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [tipoImagem, setTipoImagem] = useState<'url' | 'arquivo'>('url');
  const [uploadArquivo, setUploadArquivo] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    publicoAlvo: '',
    instituicaoId: '',
    dataInicio: '',
    dataFim: '',
    pessoasCadastradas: '',
    quantidadePessoasCadastradas: 0,
    valorMonetarioPrevisto: '',
    valorMonetarioRealizado: 0,
    imagem: '',
    status: true,
    impactoMensal: [] as ImpactoMensalProjeto[],
    participantesProjeto: [] as ParticipanteProjeto[],
  });
  const [editId, setEditId] = useState<number | null>(null);

  const handleEdit = (projeto: Projeto) => {
    setFormData({
      nome: projeto.nome,
      descricao: projeto.descricao || '',
      publicoAlvo: projeto.publicoAlvo || '',
      instituicaoId: projeto.instituicaoId ? String(projeto.instituicaoId) : '',
      dataInicio: formatDateToInput(projeto.dataInicio),
      dataFim: formatDateToInput(projeto.dataFim),
      pessoasCadastradas: projeto.pessoasCadastradas || '',
      quantidadePessoasCadastradas: projeto.quantidadePessoasCadastradas || 0,
      valorMonetarioPrevisto: projeto.valorMonetarioPrevisto?.toString().replace('.', ',') || '',
      valorMonetarioRealizado: projeto.valorMonetarioRealizado || 0,
      imagem: projeto.imagem || '',
      status: projeto.status,
      impactoMensal: projeto.impactoMensal || [],
      participantesProjeto: projeto.participantesProjeto || [],
    });
    // Se a imagem salva é de upload (caminho relativo) ou URL externa
    if (projeto.imagem && !projeto.imagem.startsWith('http')) {
      setTipoImagem('arquivo');
      setUploadPreview(projeto.imagem);
      setUploadArquivo(null);
    } else {
      setTipoImagem('url');
      setUploadArquivo(null);
      setUploadPreview('');
    }
    setEditId(projeto.id);
    setShowModal(true);
  };

  const handleToggleStatus = async (projeto: Projeto) => {
    try {
      await ProjetoService.update(projeto.id, { status: !projeto.status });
      refetch();
    } catch (error) {
      alert('Erro ao alterar status do projeto');
    }
  };

  const handleDelete = async (projeto: Projeto) => {
    const confirmou = window.confirm(
      `Deseja realmente excluir o projeto ${projeto.nome}? Esta ação não poderá ser desfeita.`,
    );

    if (!confirmou) {
      return;
    }

    setDeletingProjetoId(projeto.id);
    try {
      await ProjetoService.delete(projeto.id);

      if (selectedProjeto?.id === projeto.id) {
        setShowViewModal(false);
        setSelectedProjeto(null);
      }

      if (editId === projeto.id) {
        setShowModal(false);
        setEditId(null);
      }

      await refetch();
      alert('Projeto excluído com sucesso');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Erro ao excluir projeto';
      alert(errorMsg);
    } finally {
      setDeletingProjetoId(null);
    }
  };

  const handleView = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setShowViewModal(true);
    ProjetoService.listarInstituicoesPorProjeto(projeto.id).then((res) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];
      setInstituicoesPorProjeto(data);
    }).catch(() => setInstituicoesPorProjeto([]));
  };

  const imagemProjetoSelecionado = selectedProjeto?.imagem
    ? selectedProjeto.imagem.startsWith('http')
      ? selectedProjeto.imagem
      : `${import.meta.env.VITE_API_URL || ''}${selectedProjeto.imagem}`
    : '';

  const impactoMensalProjetoSelecionado = selectedProjeto?.impactoMensal || [];
  const totalPessoasDiretas = impactoMensalProjetoSelecionado.reduce(
    (acc, item) => acc + Number(item.pessoasDiretas || 0),
    0,
  );
  const totalPessoasIndiretas = impactoMensalProjetoSelecionado.reduce(
    (acc, item) => acc + Number(item.pessoasIndiretas || 0),
    0,
  );
  const totalPessoasImpactadas = totalPessoasDiretas + totalPessoasIndiretas;

  const { data, refetch } = useQuery({
    queryKey: ['projetos', page, pageSize],
    queryFn: async () => {
      const response = await ProjetoService.getAll(page, pageSize);
      return response.data;
    },
  });

  const { data: instituicoesAtivasData } = useQuery({
    queryKey: ['instituicoes-ativas-projetos'],
    queryFn: async () => {
      const response = await InstituicaoService.listarInstituicoes({
        statusAtivo: 'ATIVO',
        page: 1,
        pageSize: 100000,
      });
      return response.data?.data?.instituicoes || [];
    },
  });

  const instituicoesAtivas = instituicoesAtivasData || [];

  useEffect(() => {
    localStorage.setItem('projetos:tabela:columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    api.get('/admin-cadastros/publicos-alvo').then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setPublicosAlvo(data.filter((item: any) => item.status));
    }).catch(() => {});
  }, []);

  const compareValues = (a: string | number, b: string | number, order: SortOrder): number => {
    const direction = order === 'asc' ? 1 : -1;

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * direction;
    }

    return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base', numeric: true }) * direction;
  };

  const getSortValue = (item: Projeto, key: ProjetoTableSortKey): string | number => {
    switch (key) {
      case 'nome':
        return item.nome || '';
      case 'descricao':
        return item.descricao || '';
      case 'valorMonetarioPrevisto':
        return Number(item.valorMonetarioPrevisto ?? 0);
      case 'valorMonetarioRealizado':
        return Number(item.valorMonetarioRealizado ?? 0);
      case 'impactadas': {
        const total = (item.impactoMensal || []).reduce(
          (acc, impacto) => acc + Number(impacto.pessoasDiretas || 0) + Number(impacto.pessoasIndiretas || 0),
          0,
        );
        return total > 0 ? total : Number(item.quantidadePessoasCadastradas || 0);
      }
      case 'periodo':
        return new Date(item.dataInicio || 0).getTime() || 0;
      case 'status':
        return item.status ? 1 : 0;
      default:
        return '';
    }
  };

  const projetosTabelaOrdenados = useMemo(() => {
    const lista = [...(data?.projetos || [])];
    lista.sort((a: Projeto, b: Projeto) => compareValues(getSortValue(a, sortBy), getSortValue(b, sortBy), sortOrder));
    return lista;
  }, [data?.projetos, sortBy, sortOrder]);

  const handleSort = (key: ProjetoTableSortKey) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(key);
    setSortOrder('asc');
  };

  const sortIcon = (key: ProjetoTableSortKey) => {
    if (sortBy !== key) {
      return '↕';
    }

    return sortOrder === 'asc' ? '↑' : '↓';
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.dataInicio && formData.dataFim && formData.dataInicio > formData.dataFim) {
      setErrorMessage('A data de início não pode ser maior que a data de fim.');
      return;
    }

    try {
      let imagemFinal = formData.imagem;

      // Se o usuário selecionou um arquivo, faz upload primeiro
      if (tipoImagem === 'arquivo' && uploadArquivo) {
        setEnviandoImagem(true);
        try {
          const resultado = await ProjetoService.uploadImagem(uploadArquivo);
          imagemFinal = resultado.url;
        } finally {
          setEnviandoImagem(false);
        }
      } else if (tipoImagem === 'arquivo' && !uploadArquivo && uploadPreview) {
        // Mantém o caminho do arquivo já enviado anteriormente
        imagemFinal = formData.imagem;
      }

      const { valorMonetarioRealizado, ...dadosParaEnviar } = formData;
      const dadosAEnviar = {
        ...dadosParaEnviar,
        publicoAlvo: (dadosParaEnviar.publicoAlvo || '').trim() || null,
        instituicaoId: dadosParaEnviar.instituicaoId ? Number(dadosParaEnviar.instituicaoId) : null,
        dataInicio: dadosParaEnviar.dataInicio || null,
        dataFim: dadosParaEnviar.dataFim || null,
        impactoMensal: dadosParaEnviar.impactoMensal,
        participantesProjeto: dadosParaEnviar.participantesProjeto,
        valorMonetarioPrevisto: parseCurrency(dadosParaEnviar.valorMonetarioPrevisto),
        imagem: imagemFinal || null,
      };

      if (editId) {
        await ProjetoService.update(editId, dadosAEnviar);
      } else {
        await ProjetoService.create(dadosAEnviar);
      }
      setFormData({
        nome: '',
        descricao: '',
        publicoAlvo: '',
        instituicaoId: '',
        dataInicio: '',
        dataFim: '',
        pessoasCadastradas: '',
        quantidadePessoasCadastradas: 0,
        valorMonetarioPrevisto: '',
        valorMonetarioRealizado: 0,
        imagem: '',
        status: true,
        impactoMensal: [],
        participantesProjeto: [],
      });
      setTipoImagem('url');
      setUploadArquivo(null);
      setUploadPreview('');
      setEditId(null);
      setShowModal(false);
      refetch();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Erro ao salvar projeto';
      setErrorMessage(errorMsg);
      console.error('Erro ao salvar projeto:', error);
    }
  };

  const distribuicaoPreview = useMemo(
    () => buildDistribuicao(parseCurrency(formData.valorMonetarioPrevisto), formData.dataInicio, formData.dataFim),
    [formData.valorMonetarioPrevisto, formData.dataInicio, formData.dataFim],
  );

  const totalDistribuido = useMemo(
    () => distribuicaoEditavel.reduce((acc, item) => acc + parseCurrency(item.valor), 0),
    [distribuicaoEditavel],
  );

  const valorPrevistoAtual = useMemo(
    () => parseCurrency(formData.valorMonetarioPrevisto),
    [formData.valorMonetarioPrevisto],
  );

  const diferencaDistribuicao = useMemo(
    () => valorPrevistoAtual - totalDistribuido,
    [valorPrevistoAtual, totalDistribuido],
  );

  const abrirModalDistribuicao = () => {
    setDistribuicaoEditavel(
      distribuicaoPreview.map((item) => ({
        competencia: item.competencia,
        valor: formatCurrencyInput(item.valor),
      })),
    );
    setShowDistribuicaoModal(true);
  };

  const atualizarValorDistribuido = (index: number, valorDigitado: string) => {
    const valorSanitizado = sanitizeCurrencyInput(valorDigitado);
    setDistribuicaoEditavel((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              valor: valorSanitizado,
            }
          : item,
      ),
    );
  };

  const aplicarTotalDistribuidoNoPrevisto = () => {
    setFormData((prev) => ({
      ...prev,
      valorMonetarioPrevisto: formatCurrencyInput(totalDistribuido),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Projetos</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm font-semibold inline-flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-semibold inline-flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Table size={16} />
              Tabela
            </button>
          </div>

          <button
            onClick={() => {
              setEditId(null);
              setErrorMessage('');
              setFormData({
                nome: '',
                descricao: '',
                publicoAlvo: '',
                instituicaoId: '',
                dataInicio: '',
                dataFim: '',
                pessoasCadastradas: '',
                quantidadePessoasCadastradas: 0,
                valorMonetarioPrevisto: '',
                valorMonetarioRealizado: 0,
                imagem: '',
                status: true,
                impactoMensal: [],
                participantesProjeto: [],
              });
              setTipoImagem('url');
              setUploadArquivo(null);
              setUploadPreview('');
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus size={20} />
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editId ? 'Editar Projeto' : 'Novo Projeto'}</h2>
              <button type="button" onClick={() => { setShowModal(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem do Projeto <span className="text-xs text-gray-500">(opcional)</span>
                </label>
                {/* Toggle URL / Arquivo */}
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 mb-3 overflow-hidden w-fit">
                  <button
                    type="button"
                    onClick={() => { setTipoImagem('url'); setUploadArquivo(null); setUploadPreview(''); }}
                    className={`px-4 py-1.5 text-xs font-semibold transition ${tipoImagem === 'url' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    Link (URL)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoImagem('arquivo'); setFormData(prev => ({ ...prev, imagem: '' })); }}
                    className={`px-4 py-1.5 text-xs font-semibold transition ${tipoImagem === 'arquivo' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    Arquivo
                  </button>
                </div>

                {tipoImagem === 'url' ? (
                  <>
                    <input
                      type="url"
                      value={formData.imagem}
                      onChange={(e) => setFormData({ ...formData, imagem: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                    {formData.imagem && (
                      <img
                        src={formData.imagem}
                        alt="Preview"
                        className="mt-2 h-20 w-full rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setUploadArquivo(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setUploadPreview('');
                        }
                      }}
                      className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP ou GIF — máx. 5 MB</p>
                    {(uploadPreview) && (
                      <img
                        src={uploadPreview.startsWith('data:') ? uploadPreview : `${import.meta.env.VITE_API_URL || ''}/uploads${uploadPreview.replace('/uploads', '')}`}
                        alt="Preview"
                        className="mt-2 h-20 w-full rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Público Alvo
                </label>
                <select
                  value={formData.publicoAlvo}
                  onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {publicosAlvo.map((pa) => (
                    <option key={pa.id} value={pa.nome}>{pa.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instituição Vinculada
                </label>
                <select
                  value={formData.instituicaoId}
                  onChange={(e) => setFormData({ ...formData, instituicaoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione</option>
                  {instituicoesAtivas.map((instituicao: any) => (
                    <option key={instituicao.id} value={instituicao.id}>
                      {instituicao.instituicao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Pessoas Cadastradas - Campo texto simples */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pessoas Cadastradas
                  <span className="text-xs text-gray-500 ml-1">(separar por vírgula)</span>
                </label>
                <input
                  type="text"
                  value={formData.pessoasCadastradas}
                  onChange={(e) => setFormData({ ...formData, pessoasCadastradas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: João Silva, Maria Santos, Pedro Costa"
                />
              </div>

              {/* Quantidade de Pessoas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantidade de Pessoas Cadastradas
                </label>
                <input
                  type="text"
                  value={formData.quantidadePessoasCadastradas || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, quantidadePessoasCadastradas: value ? parseInt(value) : 0 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              {/* Quanto Previsto - Campo texto para melhor UX */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quanto Previsto
                  <span className="text-xs text-gray-500 ml-1">(R$)</span>
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 mr-2">R$</span>
                  <input
                    type="text"
                    value={formData.valorMonetarioPrevisto}
                    onChange={(e) => {
                      // Permite apenas números e uma vírgula/ponto
                      let value = e.target.value.replace(/[^0-9,.-]/g, '');
                      value = value.replace('.', ',');
                      setFormData({ ...formData, valorMonetarioPrevisto: value });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="0,00"
                  />
                </div>
                <button
                  type="button"
                  onClick={abrirModalDistribuicao}
                  className="mt-2 inline-flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <CalendarRange size={16} />
                  <span>Distribuir ao longo do período</span>
                </button>
                {distribuicaoEditavel.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                    Valor distribuído atual: R$ {totalDistribuido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* Quanto Realizado - ReadOnly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quanto Realizado
                  <span className="text-xs text-gray-500 ml-1">(R$) - Calculado automaticamente</span>
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 mr-2">R$</span>
                  <input
                    type="text"
                    value="0,00"
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-400 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Este valor é calculado automaticamente a partir das Notas Fiscais classificadas para este projeto.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Pessoas impactadas mês a mês</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        impactoMensal: [
                          ...prev.impactoMensal,
                          { competencia: '', pessoasDiretas: 0, pessoasIndiretas: 0 },
                        ],
                      }))
                    }
                    className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    + Adicionar mês
                  </button>
                </div>
                {formData.impactoMensal.length === 0 && (
                  <p className="text-xs text-gray-500">Nenhum mês cadastrado.</p>
                )}
                {formData.impactoMensal.map((item, index) => (
                  <div key={`impacto-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Competência</label>
                      <input
                        type="month"
                        value={item.competencia}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            impactoMensal: prev.impactoMensal.map((m, i) =>
                              i === index ? { ...m, competencia: e.target.value } : m,
                            ),
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Diretas</label>
                      <input
                        type="number"
                        min={0}
                        value={item.pessoasDiretas}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            impactoMensal: prev.impactoMensal.map((m, i) =>
                              i === index ? { ...m, pessoasDiretas: Number(e.target.value || 0) } : m,
                            ),
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Indiretas</label>
                      <input
                        type="number"
                        min={0}
                        value={item.pessoasIndiretas}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            impactoMensal: prev.impactoMensal.map((m, i) =>
                              i === index ? { ...m, pessoasIndiretas: Number(e.target.value || 0) } : m,
                            ),
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          impactoMensal: prev.impactoMensal.filter((_, i) => i !== index),
                        }))
                      }
                      className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Participantes do projeto</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        participantesProjeto: [
                          ...prev.participantesProjeto,
                          { nome: '', email: '', setorCentroCusto: '' },
                        ],
                      }))
                    }
                    className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    + Adicionar participante
                  </button>
                </div>
                {formData.participantesProjeto.length === 0 && (
                  <p className="text-xs text-gray-500">Nenhum participante cadastrado.</p>
                )}
                {formData.participantesProjeto.map((item, index) => (
                  <div key={`participante-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Nome</label>
                      <input
                        type="text"
                        value={item.nome}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            participantesProjeto: prev.participantesProjeto.map((p, i) =>
                              i === index ? { ...p, nome: e.target.value } : p,
                            ),
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={item.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            participantesProjeto: prev.participantesProjeto.map((p, i) =>
                              i === index ? { ...p, email: e.target.value } : p,
                            ),
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Setor/Centro de custo</label>
                      <input
                        type="text"
                        value={item.setorCentroCusto}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            participantesProjeto: prev.participantesProjeto.map((p, i) =>
                              i === index ? { ...p, setorCentroCusto: e.target.value } : p,
                            ),
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          participantesProjeto: prev.participantesProjeto.filter((_, i) => i !== index),
                        }))
                      }
                      className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={enviandoImagem}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 font-medium disabled:opacity-60"
                >
                  {enviandoImagem ? 'Enviando imagem...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setErrorMessage('');
                    setShowDistribuicaoModal(false);
                    setTipoImagem('url');
                    setUploadArquivo(null);
                    setUploadPreview('');
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDistribuicaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Distribuição do Valor Previsto</h3>
              <button type="button" onClick={() => setShowDistribuicaoModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Defina data de início, data de fim e valor previsto para ver a distribuição mensal.
            </p>

            {distribuicaoPreview.length === 0 ? (
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                Preencha valor previsto, data de início e data de fim válidos para gerar a distribuição.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  Total previsto: <strong>R$ {valorPrevistoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  Total distribuído: <strong>R$ {totalDistribuido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div className={`text-sm ${diferencaDistribuicao === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                  Diferença (previsto - distribuído):{' '}
                  <strong>
                    R$ {diferencaDistribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y dark:divide-gray-700">
                  {distribuicaoEditavel.map((item, index) => (
                    <div key={item.competencia} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{item.competencia}</span>
                      <div className="flex items-center space-x-2">
                        <span>R$</span>
                        <input
                          type="text"
                          value={item.valor}
                          onChange={(e) => atualizarValorDistribuido(index, e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={aplicarTotalDistribuidoNoPrevisto}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Usar total distribuído no previsto
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDistribuicaoModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedProjeto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProjeto.nome}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Código: {selectedProjeto.codigo}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    selectedProjeto.status
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {selectedProjeto.status ? 'Ativo' : 'Inativo'}
                </span>
                <button type="button" onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
            </div>

            {imagemProjetoSelecionado && (
              <button
                type="button"
                onClick={() => setShowImageLightbox(true)}
                className="mb-4 block w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                title="Clique para ampliar"
              >
                <img
                  src={imagemProjetoSelecionado}
                  alt={selectedProjeto.nome}
                  className="h-auto max-h-[45vh] w-full object-contain bg-gray-50 dark:bg-gray-900"
                />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Data de Início</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDateToPtBr(selectedProjeto.dataInicio)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Data de Fim</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDateToPtBr(selectedProjeto.dataFim)}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
                <p className="text-xs text-blue-500 dark:text-blue-300">Quanto Previsto</p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-200">
                  R$ {Number(selectedProjeto.valorMonetarioPrevisto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3">
                <p className="text-xs text-emerald-500 dark:text-emerald-300">Quanto Realizado</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-200">
                  R$ {Number(selectedProjeto.valorMonetarioRealizado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Descrição</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {selectedProjeto.descricao || 'Sem descrição cadastrada para este projeto.'}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Público Alvo e Instituição</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Público Alvo:</strong> {selectedProjeto.publicoAlvo || 'Não informado'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Instituição:</strong> {selectedProjeto.instituicaoNome || 'Sem instituição vinculada'}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Instituições que nos atendem neste projeto</p>
              {instituicoesPorProjeto.length > 0 ? (
                <div className="space-y-2">
                  {instituicoesPorProjeto.map((inst) => (
                    <div
                      key={inst.instituicaoId}
                      className="rounded-md bg-gray-50 dark:bg-gray-700/40 p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {inst.nomeInstituicao}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {inst.quantidadeContratos} termo(s) vinculado(s)
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${inst.contratoAtivo
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
                        {inst.contratoAtivo ? 'Com contrato ativo' : 'Sem contrato ativo'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Nenhuma instituição vinculada a este projeto via termo de contrato.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Participantes</p>
              {selectedProjeto.participantesProjeto && selectedProjeto.participantesProjeto.length > 0 ? (
                <div className="space-y-2">
                  {selectedProjeto.participantesProjeto.map((participante, index) => (
                    <div
                      key={`${participante.email || participante.nome}-${index}`}
                      className="rounded-md bg-gray-50 dark:bg-gray-700/40 p-3"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{participante.nome || 'Sem nome'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{participante.email || 'Sem e-mail'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Setor/Centro de custo: {participante.setorCentroCusto || 'Não informado'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Nenhum participante cadastrado.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Pessoas impactadas</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-3">
                  <p className="text-xs text-indigo-500 dark:text-indigo-300">Total Impactadas</p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-200">{totalPessoasImpactadas}</p>
                </div>
                <div className="rounded-lg bg-sky-50 dark:bg-sky-900/30 p-3">
                  <p className="text-xs text-sky-500 dark:text-sky-300">Total Diretas</p>
                  <p className="text-lg font-bold text-sky-700 dark:text-sky-200">{totalPessoasDiretas}</p>
                </div>
                <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/30 p-3">
                  <p className="text-xs text-cyan-500 dark:text-cyan-300">Total Indiretas</p>
                  <p className="text-lg font-bold text-cyan-700 dark:text-cyan-200">{totalPessoasIndiretas}</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Detalhamento mensal</p>
              {impactoMensalProjetoSelecionado.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y dark:divide-gray-700">
                  {impactoMensalProjetoSelecionado.map((item, index) => {
                    const totalMensal = Number(item.pessoasDiretas || 0) + Number(item.pessoasIndiretas || 0);
                    return (
                      <div key={`${item.competencia || 'sem-competencia'}-${index}`} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                        <span className="text-gray-700 dark:text-gray-200">{item.competencia || 'Sem competência'}</span>
                        <span className="text-gray-600 dark:text-gray-300 text-xs">
                          Diretas: <strong>{item.pessoasDiretas || 0}</strong> | Indiretas: <strong>{item.pessoasIndiretas || 0}</strong> | Total mês: <strong>{totalMensal}</strong>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Sem dados mensais de impacto cadastrados.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setShowImageLightbox(false);
                  setSelectedProjeto(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageLightbox && imagemProjetoSelecionado && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setShowImageLightbox(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-1.5 rounded bg-white/20 text-white hover:bg-white/30"
            onClick={() => setShowImageLightbox(false)}
          >
            <X size={20} />
          </button>
          <img
            src={imagemProjetoSelecionado}
            alt={selectedProjeto?.nome || 'Imagem do projeto'}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {viewMode === 'cards' ? (
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(data?.projetos || []).map((item: Projeto) => {
          const descricaoProjeto = item.descricao?.trim() || '';
          const descricaoExpandida = Boolean(expandedDescricaoProjetos[item.id]);
          const mostrarBotaoDescricao = descricaoProjeto.length > 160;
          const totalPessoasImpactadasCard = (item.impactoMensal || []).reduce(
            (acc, impacto) => acc + Number(impacto.pessoasDiretas || 0) + Number(impacto.pessoasIndiretas || 0),
            0,
          );
          const pessoasImpactadasExibicao =
            totalPessoasImpactadasCard > 0 ? totalPessoasImpactadasCard : Number(item.quantidadePessoasCadastradas || 0);

          return (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
            {/* Foto */}
            {item.imagem ? (
              <img
                src={
                  item.imagem.startsWith('http')
                    ? item.imagem
                    : `${import.meta.env.VITE_API_URL || ''}${item.imagem}`
                }
                alt={item.nome}
                className="h-36 w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.warn(`[Projeto] Falha ao carregar imagem: ${target.src}`);
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement | null;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`h-36 w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 ${item.imagem ? 'hidden' : 'flex'}`}
            >
              <svg className="h-14 w-14 text-primary-400 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8M8 16h5" />
              </svg>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
              {/* Título + status */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold leading-snug text-gray-900 dark:text-white line-clamp-2">{item.nome}</h3>
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.status
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {item.status ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Descrição */}
              <div>
                <p
                  className={`text-xs text-gray-500 dark:text-gray-400 ${descricaoExpandida ? 'line-clamp-none' : 'line-clamp-2 min-h-[2.5rem]'}`}
                >
                  {descricaoProjeto || <span className="italic">Sem descrição</span>}
                </p>
                {mostrarBotaoDescricao && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDescricaoProjetos((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                    className="mt-1 text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    {descricaoExpandida ? 'Exibir menos' : 'Exibir mais'}
                  </button>
                )}
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 gap-2">
                <div className="rounded-xl bg-blue-50 px-3 py-2 dark:bg-blue-900/30">
                  <p className="text-xs text-blue-500 dark:text-blue-300">Estimativa</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-200 leading-tight">
                    R$ {Number(item.valorMonetarioPrevisto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-900/30">
                  <p className="text-xs text-emerald-500 dark:text-emerald-300">Realizado</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-200 leading-tight">
                    R$ {Number(item.valorMonetarioRealizado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-900/30">
                  <p className="text-xs text-indigo-500 dark:text-indigo-300">Pessoas Impactadas</p>
                  <p className="text-sm font-bold text-indigo-700 dark:text-indigo-200 leading-tight">
                    {pessoasImpactadasExibicao.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300">
                <p><strong>Público Alvo:</strong> {item.publicoAlvo || 'Não informado'}</p>
                <p><strong>Instituição:</strong> {item.instituicaoNome || 'Não vinculada'}</p>
              </div>

              {/* Datas */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <CalendarRange size={13} className="shrink-0" />
                <span>{formatDateToPtBr(item.dataInicio)}</span>
                <span className="text-gray-300 dark:text-gray-600">→</span>
                <span>{formatDateToPtBr(item.dataFim)}</span>
              </div>

              {/* Ações */}
              <div className="mt-auto flex gap-2 pt-1">
                <button
                  onClick={() => handleView(item)}
                  className="flex-1 rounded-lg border border-gray-300 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Exibir
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 rounded-lg border border-blue-300 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggleStatus(item)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                    item.status
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                  }`}
                >
                  {item.status ? 'Inativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={deletingProjetoId === item.id}
                  className="flex-1 rounded-lg border border-red-300 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  {deletingProjetoId === item.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
            </div>
          );
        })}
      </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" style={{ width: 'max-content' }}>
              <thead className="bg-gray-50 dark:bg-gray-700/40">
                <tr>
                  <th style={{ width: getColumnWidth('projeto') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <button type="button" onClick={() => handleSort('nome')} className="inline-flex items-center gap-1 pr-2">
                      Projeto <span className="text-xs text-gray-500">{sortIcon('nome')}</span>
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Projeto" onMouseDown={(e) => handleResizeStart(e, 'projeto', 220, 140)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('descricao') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <button type="button" onClick={() => handleSort('descricao')} className="inline-flex items-center gap-1 pr-2">
                      Descrição <span className="text-xs text-gray-500">{sortIcon('descricao')}</span>
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Descrição" onMouseDown={(e) => handleResizeStart(e, 'descricao', 280, 180)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('publicoAlvo') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Público Alvo / Instituição
                    <button type="button" aria-label="Redimensionar coluna Público Alvo" onMouseDown={(e) => handleResizeStart(e, 'publicoAlvo', 230, 180)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('estimativa') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <button type="button" onClick={() => handleSort('valorMonetarioPrevisto')} className="inline-flex items-center gap-1 pr-2">
                      Estimativa <span className="text-xs text-gray-500">{sortIcon('valorMonetarioPrevisto')}</span>
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Estimativa" onMouseDown={(e) => handleResizeStart(e, 'estimativa', 140, 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('realizado') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <button type="button" onClick={() => handleSort('valorMonetarioRealizado')} className="inline-flex items-center gap-1 pr-2">
                      Realizado <span className="text-xs text-gray-500">{sortIcon('valorMonetarioRealizado')}</span>
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Realizado" onMouseDown={(e) => handleResizeStart(e, 'realizado', 140, 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('impactadas') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <button type="button" onClick={() => handleSort('impactadas')} className="inline-flex items-center gap-1 pr-2">
                      Impactadas <span className="text-xs text-gray-500">{sortIcon('impactadas')}</span>
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Impactadas" onMouseDown={(e) => handleResizeStart(e, 'impactadas', 120, 100)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('periodo') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <button type="button" onClick={() => handleSort('periodo')} className="inline-flex items-center gap-1 pr-2">
                      Período <span className="text-xs text-gray-500">{sortIcon('periodo')}</span>
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Período" onMouseDown={(e) => handleResizeStart(e, 'periodo', 160, 120)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('status') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <button type="button" onClick={() => handleSort('status')} className="inline-flex items-center gap-1 pr-2">
                      Status <span className="text-xs text-gray-500">{sortIcon('status')}</span>
                    </button>
                    <button type="button" aria-label="Redimensionar coluna Status" onMouseDown={(e) => handleResizeStart(e, 'status', 110, 90)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                  <th style={{ width: getColumnWidth('acoes') }} className="relative px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    Ações
                    <button type="button" aria-label="Redimensionar coluna Ações" onMouseDown={(e) => handleResizeStart(e, 'acoes', 260, 220)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200/70 dark:hover:bg-blue-700/50" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {projetosTabelaOrdenados.map((item: Projeto) => {
                  const totalPessoasImpactadasTabela = (item.impactoMensal || []).reduce(
                    (acc, impacto) => acc + Number(impacto.pessoasDiretas || 0) + Number(impacto.pessoasIndiretas || 0),
                    0,
                  );
                  const pessoasImpactadasTabela =
                    totalPessoasImpactadasTabela > 0 ? totalPessoasImpactadasTabela : Number(item.quantidadePessoasCadastradas || 0);

                  return (
                    <tr key={`table-${item.id}`} className="border-t border-gray-200 dark:border-gray-700 align-top">
                      <td style={{ width: getColumnWidth('projeto') }} className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.codigo}</p>
                      </td>
                      <td style={{ width: getColumnWidth('descricao') }} className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs">
                        <p className="line-clamp-3">{item.descricao || 'Sem descrição'}</p>
                      </td>
                      <td style={{ width: getColumnWidth('publicoAlvo') }} className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <p className="font-medium">{item.publicoAlvo || 'Não informado'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.instituicaoNome || 'Sem instituição vinculada'}</p>
                      </td>
                      <td style={{ width: getColumnWidth('estimativa') }} className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        R$ {Number(item.valorMonetarioPrevisto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ width: getColumnWidth('realizado') }} className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        R$ {Number(item.valorMonetarioRealizado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ width: getColumnWidth('impactadas') }} className="px-4 py-3 text-gray-700 dark:text-gray-200">{pessoasImpactadasTabela.toLocaleString('pt-BR')}</td>
                      <td style={{ width: getColumnWidth('periodo') }} className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDateToPtBr(item.dataInicio)} → {formatDateToPtBr(item.dataFim)}
                      </td>
                      <td style={{ width: getColumnWidth('status') }} className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.status
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {item.status ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ width: getColumnWidth('acoes') }} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(item)}
                            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            Exibir
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                              item.status
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                            }`}
                          >
                            {item.status ? 'Inativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingProjetoId === item.id}
                            className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                          >
                            {deletingProjetoId === item.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
