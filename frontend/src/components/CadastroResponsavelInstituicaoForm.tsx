import React, { useState } from 'react';
import { InstituicaoService } from '@/services/InstituicaoService';

interface InstituicaoOption {
  id: number;
  instituicao: string;
}

interface CadastroResponsavelInstituicaoFormProps {
  instituicoes: InstituicaoOption[];
  onSuccess?: () => void;
}

export const CadastroResponsavelInstituicaoForm: React.FC<CadastroResponsavelInstituicaoFormProps> = ({ instituicoes, onSuccess }) => {
  const [form, setForm] = useState({
    instituicaoId: '',
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
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await InstituicaoService.cadastrarResponsavelInstituicao(form);
      setEnviado(true);
      setForm({
        instituicaoId: '',
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
      onSuccess?.();
    } catch (err) {
      alert('Erro ao cadastrar responsável da instituição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Responsável da Instituição</h2>

      <select
        name="instituicaoId"
        value={form.instituicaoId}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700"
      >
        <option value="">Selecione uma instituição (opcional)</option>
        {instituicoes.map((inst) => (
          <option key={inst.id} value={inst.id}>
            {inst.instituicao}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="representante" value={form.representante} onChange={handleChange} placeholder="Representante" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" required />
        <input name="cpf" value={form.cpf} onChange={handleChange} placeholder="CPF" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="rg" value={form.rg} onChange={handleChange} placeholder="RG" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="orgaoExpedidor" value={form.orgaoExpedidor} onChange={handleChange} placeholder="Órgão Expedidor" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Cargo" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="mandato" value={form.mandato} onChange={handleChange} placeholder="Mandato Vigente" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Endereço" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="contato" value={form.contato} onChange={handleChange} placeholder="Contato" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="contato2" value={form.contato2} onChange={handleChange} placeholder="Contato 2" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="contato3" value={form.contato3} onChange={handleChange} placeholder="Contato 3" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700" />
      </div>

      <button type="submit" disabled={loading} className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-70">
        {loading ? 'Salvando...' : 'Cadastrar responsável'}
      </button>

      {enviado && <p className="text-green-600 text-sm">Responsável cadastrado com sucesso.</p>}
    </form>
  );
}
