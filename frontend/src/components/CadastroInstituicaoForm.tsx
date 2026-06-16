import React, { useState } from 'react';
import { InstituicaoService } from '@/services/InstituicaoService';

interface CadastroInstituicaoFormProps {
  onSuccess?: () => void;
}

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

const formatCep = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const CadastroInstituicaoForm: React.FC<CadastroInstituicaoFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState({
    instituicao: '',
    responsavel: '',
    cep: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    estado: '',
    cnpj: '',
    prazoPagamento: '',
    descricao: '',
    historicoFinalidadeOsc: '',
    principaisAcoesProponente: '',
    publicoAlvoProponente: '',
    regiaoAlcanceBairros: '',
    infraestruturaProponente: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState('');
  const [enviado, setEnviado] = useState(false);

  const buscarEnderecoPorCep = async (cepDigitado: string) => {
    const cepDigits = onlyDigits(cepDigitado);

    if (cepDigits.length !== 8) {
      return;
    }

    try {
      setLoadingCep(true);
      setCepMessage('');

      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setCepMessage('CEP não encontrado. Você pode preencher os campos manualmente.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));

      setCepMessage('Endereço preenchido automaticamente. Você pode editar os campos.');
    } catch {
      setCepMessage('Não foi possível consultar o CEP agora. Preencha manualmente se necessário.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setForm((prev) => ({ ...prev, cep: formatted }));

    const cepDigits = onlyDigits(formatted);
    if (cepDigits.length === 8) {
      await buscarEnderecoPorCep(cepDigits);
    } else {
      setCepMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('payload', JSON.stringify(form));

      await InstituicaoService.cadastrarInstituicao(formData);
      setEnviado(true);
      setCepMessage('');
      setForm({
        instituicao: '',
        responsavel: '',
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: '',
        cnpj: '',
        prazoPagamento: '',
        descricao: '',
        historicoFinalidadeOsc: '',
        principaisAcoesProponente: '',
        publicoAlvoProponente: '',
        regiaoAlcanceBairros: '',
        infraestruturaProponente: '',
      });
      onSuccess?.();
    } catch {
      alert('Erro ao cadastrar instituição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cadastro de Instituição Social</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="instituicao" value={form.instituicao} onChange={handleChange} placeholder="Instituição" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" required />
        <input name="responsavel" value={form.responsavel} onChange={handleChange} placeholder="Responsável" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" required />
        <div className="space-y-1">
          <input
            name="cep"
            value={form.cep}
            onChange={handleCepChange}
            onBlur={() => buscarEnderecoPorCep(form.cep)}
            placeholder="CEP"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
          />
          {loadingCep && <p className="text-xs text-slate-500">Consultando CEP...</p>}
        </div>
        <input name="logradouro" value={form.logradouro} onChange={handleChange} placeholder="Logradouro" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="bairro" value={form.bairro} onChange={handleChange} placeholder="Bairro" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="cidade" value={form.cidade} onChange={handleChange} placeholder="Cidade" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="estado" value={form.estado} onChange={handleChange} placeholder="Estado" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="cnpj" value={form.cnpj} onChange={handleChange} placeholder="CNPJ" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="prazoPagamento" value={form.prazoPagamento} onChange={handleChange} placeholder="Prazo Pagamento" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
      </div>

      {cepMessage && <p className="text-xs text-slate-600 dark:text-slate-300">{cepMessage}</p>}

      <textarea name="descricao" value={form.descricao} onChange={handleChange} placeholder="Descrição" className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[96px] bg-white dark:bg-slate-800 dark:border-slate-700" required />
      <textarea name="historicoFinalidadeOsc" value={form.historicoFinalidadeOsc} onChange={handleChange} placeholder="Histórico e finalidade da OSC" className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[96px] bg-white dark:bg-slate-800 dark:border-slate-700" required />
      <textarea name="principaisAcoesProponente" value={form.principaisAcoesProponente} onChange={handleChange} placeholder="Principais ações desenvolvidas pelo proponente" className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[96px] bg-white dark:bg-slate-800 dark:border-slate-700" required />
      <textarea name="publicoAlvoProponente" value={form.publicoAlvoProponente} onChange={handleChange} placeholder="Público-alvo de atendimento da proponente" className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[96px] bg-white dark:bg-slate-800 dark:border-slate-700" required />
      <textarea name="regiaoAlcanceBairros" value={form.regiaoAlcanceBairros} onChange={handleChange} placeholder="Região de alcance das ações (bairros)" className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[96px] bg-white dark:bg-slate-800 dark:border-slate-700" required />
      <textarea name="infraestruturaProponente" value={form.infraestruturaProponente} onChange={handleChange} placeholder="Infraestrutura do proponente" className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[96px] bg-white dark:bg-slate-800 dark:border-slate-700" required />
      <button type="submit" disabled={loading} className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-70">
        {loading ? 'Salvando...' : 'Cadastrar instituição'}
      </button>

      {enviado && <p className="text-green-600 text-sm">Instituição cadastrada com sucesso.</p>}
    </form>
  );
};
