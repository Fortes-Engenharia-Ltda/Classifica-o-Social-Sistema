import React, { useEffect, useState } from 'react';
import { InstituicaoService } from '@/services/InstituicaoService';
import { useAuthStore } from '@/store/authStore';

interface CadastroInstituicaoCompletoFormProps {
  onSuccess?: () => void;
  token?: string;
  dadosIniciais?: Record<string, unknown>;
}

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

const inputClassName =
  'w-full rounded-xl border border-slate-300 px-3 py-2 bg-white dark:bg-slate-800 dark:border-slate-700';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, helperText, className, ...props }) => (
  <label className="space-y-2">
    <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <input {...props} className={`${inputClassName} ${className ?? ''}`.trim()} />
    {helperText ? <span className="block text-xs text-slate-500 dark:text-slate-400">{helperText}</span> : null}
  </label>
);

const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, helperText, className, ...props }) => (
  <label className="space-y-2">
    <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <textarea {...props} className={`${inputClassName} min-h-[96px] ${className ?? ''}`.trim()} />
    {helperText ? <span className="block text-xs text-slate-500 dark:text-slate-400">{helperText}</span> : null}
  </label>
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helperText?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, helperText, className, children, ...props }) => (
  <label className="space-y-2">
    <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    <select {...props} className={`${inputClassName} ${className ?? ''}`.trim()}>
      {children}
    </select>
    {helperText ? <span className="block text-xs text-slate-500 dark:text-slate-400">{helperText}</span> : null}
  </label>
);

const formatCep = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatCnpj = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatCpf = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatRg = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
};

const formatPhone = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const applyResponsavelMask = (name: string, value: string): string => {
  if (name === 'cpf') return formatCpf(value);
  if (name === 'rg') return formatRg(value);
  if (name === 'contato' || name === 'contato2' || name === 'contato3') return formatPhone(value);
  return value;
};

export const CadastroInstituicaoCompletoForm: React.FC<CadastroInstituicaoCompletoFormProps> = ({ onSuccess, token, dadosIniciais }) => {
  const { usuario } = useAuthStore();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const formVazio = {
    instituicao: '',
    responsavel: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cnpj: '',
    valorMonetarioPrevisto: '',
    prazoPagamento: '',
    descricao: '',
    historicoFinalidadeOsc: '',
    principaisAcoesProponente: '',
    publicoAlvoProponente: '',
    regiaoAlcanceBairros: '',
    infraestruturaProponente: '',
    responsavelInstituicao: {
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
    },
    responsavelTecnico: {
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
    },
  };

  const [form, setForm] = useState({ ...formVazio });
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cepResponsavelInstituicao, setCepResponsavelInstituicao] = useState('');
  const [cepResponsavelTecnico, setCepResponsavelTecnico] = useState('');
  const [loadingCepRI, setLoadingCepRI] = useState(false);
  const [loadingCepRT, setLoadingCepRT] = useState(false);
  const [cepMessageRI, setCepMessageRI] = useState('');
  const [cepMessageRT, setCepMessageRT] = useState('');

  useEffect(() => {
    if (!dadosIniciais) return;
    const d = dadosIniciais as Record<string, unknown>;
    const ri = (d.responsaveis as Record<string, unknown>[] | undefined)?.[0] ?? {};
    const rt = (d.responsaveisTecnicos as Record<string, unknown>[] | undefined)?.[0] ?? {};
    const str = (v: unknown) => (v != null ? String(v) : '');
    const dateStr = (v: unknown) => {
      if (!v) return '';
      const s = String(v);
      return s.length >= 10 ? s.slice(0, 10) : s;
    };
    setForm({
      instituicao: str(d.instituicao),
      responsavel: str(d.responsavel),
      cep: str(d.cep),
      logradouro: str(d.logradouro),
      numero: str(d.numero),
      complemento: str(d.complemento),
      bairro: str(d.bairro),
      cidade: str(d.cidade),
      estado: str(d.estado),
      cnpj: str(d.cnpj),
      valorMonetarioPrevisto: '',
      prazoPagamento: str(d.prazoPagamento),
      descricao: str(d.descricao),
      historicoFinalidadeOsc: str(d.historicoFinalidadeOsc),
      principaisAcoesProponente: str(d.principaisAcoesProponente),
      publicoAlvoProponente: str(d.publicoAlvoProponente),
      regiaoAlcanceBairros: str(d.regiaoAlcanceBairros),
      infraestruturaProponente: str(d.infraestruturaProponente),
      responsavelInstituicao: {
        representante: str(ri.representante),
        cpf: str(ri.cpf),
        rg: str(ri.rg),
        orgaoExpedidor: str(ri.orgaoExpedidor),
        cargo: str(ri.cargo),
        mandato: str(ri.mandato),
        endereco: str(ri.endereco),
        contato: str(ri.contato),
        contato2: str(ri.contato2),
        contato3: str(ri.contato3),
        email: str(ri.email),
      },
      responsavelTecnico: {
        representante: str(rt.representante),
        cpf: str(rt.cpf),
        rg: str(rt.rg),
        orgaoExpedidor: str(rt.orgaoExpedidor),
        cargo: str(rt.cargo),
        mandato: str(rt.mandato),
        endereco: str(rt.endereco),
        contato: str(rt.contato),
        contato2: str(rt.contato2),
        contato3: str(rt.contato3),
        email: str(rt.email),
      },
    });
  }, [dadosIniciais]);

  const handleInstituicaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === 'cnpj' ? formatCnpj(value) : value,
    }));
  };

  const handleResponsavelInstituicaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const maskedValue = applyResponsavelMask(name, value);
    setForm((prev) => ({
      ...prev,
      responsavelInstituicao: {
        ...prev.responsavelInstituicao,
        [name]: maskedValue,
      },
      responsavel: name === 'representante' ? value : prev.responsavel,
    }));
  };

  const handleResponsavelTecnicoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      responsavelTecnico: {
        ...prev.responsavelTecnico,
        [name]: applyResponsavelMask(name, value),
      },
    }));
  };

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
        setCepMessage('CEP não encontrado. Você pode editar os campos manualmente.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));
      setCepMessage('');
    } catch {
      setCepMessage('Não foi possível consultar o CEP agora. Preencha manualmente se necessário.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setForm((prev) => ({ ...prev, cep: formatted }));

    if (onlyDigits(formatted).length === 8) {
      await buscarEnderecoPorCep(formatted);
    } else {
      setCepMessage('');
    }
  };

  const buscarEnderecoResponsavel = async (
    cepDigitado: string,
    tipo: 'responsavelInstituicao' | 'responsavelTecnico',
  ) => {
    const cepDigits = onlyDigits(cepDigitado);
    if (cepDigits.length !== 8) return;

    const setLoadingFn = tipo === 'responsavelInstituicao' ? setLoadingCepRI : setLoadingCepRT;
    const setMsgFn = tipo === 'responsavelInstituicao' ? setCepMessageRI : setCepMessageRT;

    try {
      setLoadingFn(true);
      setMsgFn('');
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setMsgFn('CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }

      const partes = [data.logradouro, data.bairro, data.localidade].filter(Boolean);
      const enderecoFormatado = partes.join(', ') + (data.uf ? ` - ${data.uf}` : '');

      setForm((prev) => ({
        ...prev,
        [tipo]: {
          ...prev[tipo],
          endereco: enderecoFormatado,
        },
      }));
    } catch {
      setMsgFn('Não foi possível consultar o CEP agora. Preencha manualmente se necessário.');
    } finally {
      setLoadingFn(false);
    }
  };

  const handleCepResponsavelInstituicaoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCepResponsavelInstituicao(formatted);
    if (onlyDigits(formatted).length === 8) {
      await buscarEnderecoResponsavel(formatted, 'responsavelInstituicao');
    } else {
      setCepMessageRI('');
    }
  };

  const handleCepResponsavelTecnicoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCepResponsavelTecnico(formatted);
    if (onlyDigits(formatted).length === 8) {
      await buscarEnderecoResponsavel(formatted, 'responsavelTecnico');
    } else {
      setCepMessageRT('');
    }
  };

  const resetForm = () => {
    setForm({
      instituicao: '',
      responsavel: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cnpj: '',
      valorMonetarioPrevisto: '',
      prazoPagamento: '',
      descricao: '',
      historicoFinalidadeOsc: '',
      principaisAcoesProponente: '',
      publicoAlvoProponente: '',
      regiaoAlcanceBairros: '',
      infraestruturaProponente: '',
      responsavelInstituicao: {
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
      },
      responsavelTecnico: {
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
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSucesso('');

    try {
      setLoading(true);
      const payload = {
        ...form,
        ...(token ? { token } : {}),
      };

      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));

      await InstituicaoService.cadastrarInstituicaoCompleta(formData);
      setSucesso('Cadastro completo da instituição realizado com sucesso.');
      setCepMessage('');
      setCepResponsavelInstituicao('');
      setCepResponsavelTecnico('');
      setCepMessageRI('');
      setCepMessageRT('');
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Erro ao cadastrar instituição completa';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cadastro Completo da Instituição</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Um único formulário com dados da instituição, responsável da instituição e responsável técnico.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Instituição</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="instituicao"
            value={form.instituicao}
            onChange={handleInstituicaoChange}
            label="Nome da instituição"
            placeholder="Digite o nome da instituição"
            required
          />
          <InputField
            name="cnpj"
            value={form.cnpj}
            onChange={handleInstituicaoChange}
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            helperText="A pontuação é aplicada automaticamente durante a digitação."
            required
          />
          {isAdmin && !token && (
            <InputField
              name="valorMonetarioPrevisto"
              type="number"
              value={form.valorMonetarioPrevisto}
              onChange={handleInstituicaoChange}
              label="Valor monetário de contrato (R$)"
              placeholder="0,00"
              step="0.01"
              min="0"
            />
          )}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">CEP da instituição</span>
            <div className="space-y-1">
              <input name="cep" value={form.cep} onChange={handleCepChange} onBlur={() => buscarEnderecoPorCep(form.cep)} placeholder="00000-000" className={inputClassName} required />
            </div>
            {loadingCep && <p className="text-xs text-slate-500">Consultando CEP...</p>}
          </div>
          <InputField
            name="logradouro"
            value={form.logradouro}
            onChange={handleInstituicaoChange}
            label="Rua / logradouro"
            placeholder="Rua, avenida ou travessa"
            required
          />
          <InputField
            name="numero"
            value={form.numero}
            onChange={handleInstituicaoChange}
            label="Número"
            placeholder="Número do endereço"
            required
          />
          <InputField
            name="complemento"
            value={form.complemento}
            onChange={handleInstituicaoChange}
            label="Complemento"
            placeholder="Sala, bloco, andar, referência"
            required
          />
          <InputField
            name="bairro"
            value={form.bairro}
            onChange={handleInstituicaoChange}
            label="Bairro"
            placeholder="Bairro da instituição"
            required
          />
          <InputField
            name="cidade"
            value={form.cidade}
            onChange={handleInstituicaoChange}
            label="Cidade"
            placeholder="Cidade da instituição"
            required
          />
          <InputField
            name="estado"
            value={form.estado}
            onChange={handleInstituicaoChange}
            label="Estado (UF)"
            placeholder="UF"
            required
          />
          <SelectField
            name="prazoPagamento"
            value={form.prazoPagamento}
            onChange={handleInstituicaoChange}
            label="Dia do pagamento"
            helperText="Informe o dia do mês em que o pagamento é realizado (ex.: Dia 15)."
            required
          >
            <option value="">Selecione o dia</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
              <option key={dia} value={String(dia)}>{dia}</option>
            ))}
          </SelectField>
        </div>
        {cepMessage && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{cepMessage}</p>}
        <div className="mt-4">
          <TextAreaField
            name="descricao"
            value={form.descricao}
            onChange={handleInstituicaoChange}
            label="Descrição da instituição"
            placeholder="Descreva a instituição, atuação e observações relevantes"
            required
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextAreaField
            name="historicoFinalidadeOsc"
            value={form.historicoFinalidadeOsc}
            onChange={handleInstituicaoChange}
            label="Histórico e finalidade da OSC"
            placeholder="Descreva o histórico da organização e sua finalidade institucional"
            required
          />
          <TextAreaField
            name="principaisAcoesProponente"
            value={form.principaisAcoesProponente}
            onChange={handleInstituicaoChange}
            label="Principais ações desenvolvidas pelo proponente"
            placeholder="Liste as principais ações e atividades executadas"
            required
          />
          <TextAreaField
            name="publicoAlvoProponente"
            value={form.publicoAlvoProponente}
            onChange={handleInstituicaoChange}
            label="Público-alvo de atendimento da proponente"
            placeholder="Informe quem é atendido pela instituição"
            required
          />
          <TextAreaField
            name="regiaoAlcanceBairros"
            value={form.regiaoAlcanceBairros}
            onChange={handleInstituicaoChange}
            label="Região de alcance das ações (bairros)"
            placeholder="Ex.: Centro, Jardim Fortaleza, Vila Nova"
            required
          />
          <TextAreaField
            name="infraestruturaProponente"
            value={form.infraestruturaProponente}
            onChange={handleInstituicaoChange}
            label="Infraestrutura do proponente"
            placeholder="Descreva espaços, equipamentos e estrutura disponível"
            required
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Responsável da Instituição</h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          O nome informado em representante será usado automaticamente como responsável principal da instituição.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField name="representante" value={form.responsavelInstituicao.representante} onChange={handleResponsavelInstituicaoChange} label="Representante da instituição" placeholder="Nome do responsável" required />
          <InputField name="cpf" value={form.responsavelInstituicao.cpf} onChange={handleResponsavelInstituicaoChange} label="CPF" placeholder="000.000.000-00" helperText="Pontuação aplicada automaticamente." required />
          <InputField name="rg" value={form.responsavelInstituicao.rg} onChange={handleResponsavelInstituicaoChange} label="RG" placeholder="00.000.000-0" helperText="Pontuação aplicada automaticamente." required />
          <InputField name="orgaoExpedidor" value={form.responsavelInstituicao.orgaoExpedidor} onChange={handleResponsavelInstituicaoChange} label="Órgão expedidor" placeholder="Órgão emissor do RG" required />
          <InputField name="cargo" value={form.responsavelInstituicao.cargo} onChange={handleResponsavelInstituicaoChange} label="Cargo" placeholder="Cargo na instituição" required />
          <InputField name="mandato" value={form.responsavelInstituicao.mandato} onChange={handleResponsavelInstituicaoChange} label="Mandato vigente" placeholder="Período ou vigência do mandato" required />
          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">CEP do responsável</span>
            <input value={cepResponsavelInstituicao} onChange={handleCepResponsavelInstituicaoChange} onBlur={() => buscarEnderecoResponsavel(cepResponsavelInstituicao, 'responsavelInstituicao')} placeholder="00000-000" className={inputClassName} />
            {loadingCepRI && <p className="text-xs text-slate-500">Consultando CEP...</p>}
            {cepMessageRI && <p className="text-xs text-slate-600 dark:text-slate-300">{cepMessageRI}</p>}
          </div>
          <InputField name="endereco" value={form.responsavelInstituicao.endereco} onChange={handleResponsavelInstituicaoChange} label="Endereço" placeholder="Preenchido automaticamente pelo CEP" required />
          <InputField name="contato" value={form.responsavelInstituicao.contato} onChange={handleResponsavelInstituicaoChange} label="Contato principal" placeholder="(00) 00000-0000" helperText="Pontuação aplicada automaticamente." required />
          <InputField name="contato2" value={form.responsavelInstituicao.contato2} onChange={handleResponsavelInstituicaoChange} label="Contato secundário" placeholder="(00) 00000-0000" helperText="Opcional. Pontuação aplicada automaticamente." />
          <InputField name="contato3" value={form.responsavelInstituicao.contato3} onChange={handleResponsavelInstituicaoChange} label="Contato adicional" placeholder="(00) 00000-0000" helperText="Opcional. Pontuação aplicada automaticamente." />
          <InputField name="email" value={form.responsavelInstituicao.email} onChange={handleResponsavelInstituicaoChange} label="Email" placeholder="Email do responsável" required />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Responsável Técnico</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField name="representante" value={form.responsavelTecnico.representante} onChange={handleResponsavelTecnicoChange} label="Representante técnico" placeholder="Nome do responsável técnico" required />
          <InputField name="cpf" value={form.responsavelTecnico.cpf} onChange={handleResponsavelTecnicoChange} label="CPF" placeholder="000.000.000-00" helperText="Pontuação aplicada automaticamente." required />
          <InputField name="rg" value={form.responsavelTecnico.rg} onChange={handleResponsavelTecnicoChange} label="RG" placeholder="00.000.000-0" helperText="Pontuação aplicada automaticamente." required />
          <InputField name="orgaoExpedidor" value={form.responsavelTecnico.orgaoExpedidor} onChange={handleResponsavelTecnicoChange} label="Órgão expedidor" placeholder="Órgão emissor do RG" required />
          <InputField name="cargo" value={form.responsavelTecnico.cargo} onChange={handleResponsavelTecnicoChange} label="Cargo" placeholder="Cargo técnico na instituição" required />
          <InputField name="mandato" value={form.responsavelTecnico.mandato} onChange={handleResponsavelTecnicoChange} label="Mandato vigente" placeholder="Período ou vigência do mandato" required />
          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">CEP do responsável técnico</span>
            <input value={cepResponsavelTecnico} onChange={handleCepResponsavelTecnicoChange} onBlur={() => buscarEnderecoResponsavel(cepResponsavelTecnico, 'responsavelTecnico')} placeholder="00000-000" className={inputClassName} />
            {loadingCepRT && <p className="text-xs text-slate-500">Consultando CEP...</p>}
            {cepMessageRT && <p className="text-xs text-slate-600 dark:text-slate-300">{cepMessageRT}</p>}
          </div>
          <InputField name="endereco" value={form.responsavelTecnico.endereco} onChange={handleResponsavelTecnicoChange} label="Endereço" placeholder="Preenchido automaticamente pelo CEP" required />
          <InputField name="contato" value={form.responsavelTecnico.contato} onChange={handleResponsavelTecnicoChange} label="Contato principal" placeholder="(00) 00000-0000" helperText="Pontuação aplicada automaticamente." required />
          <InputField name="contato2" value={form.responsavelTecnico.contato2} onChange={handleResponsavelTecnicoChange} label="Contato secundário" placeholder="(00) 00000-0000" helperText="Opcional. Pontuação aplicada automaticamente." />
          <InputField name="contato3" value={form.responsavelTecnico.contato3} onChange={handleResponsavelTecnicoChange} label="Contato adicional" placeholder="(00) 00000-0000" helperText="Opcional. Pontuação aplicada automaticamente." />
          <InputField name="email" value={form.responsavelTecnico.email} onChange={handleResponsavelTecnicoChange} label="Email" placeholder="Email do responsável técnico" required />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="rounded-xl bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-70">
          {loading ? 'Salvando...' : 'Cadastrar instituição'}
        </button>
        {sucesso && <p className="text-sm text-green-600">{sucesso}</p>}
      </div>
    </form>
  );
};
