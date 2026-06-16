import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CadastroInstituicaoCompletoForm } from '@/components/CadastroInstituicaoCompletoForm';

type EstadoToken = 'verificando' | 'valido' | 'invalido' | 'expirado' | 'ausente' | 'enviado';

export const CadastrosInstituicoes: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [estado, setEstado] = useState<EstadoToken>('verificando');
  const [validoAte, setValidoAte] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [dadosInstituicao, setDadosInstituicao] = useState<Record<string, unknown> | null>(null);

  const formatarTempoRestante = (totalSegundos: number): string => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    return [horas, minutos, segundos]
      .map((valor) => String(valor).padStart(2, '0'))
      .join(':');
  };

  useEffect(() => {
    if (!token) {
      setEstado('ausente');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL ?? '';

    fetch(`${apiUrl}/token-cadastro/validar?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json();
        if (res.ok) {
          setValidoAte(body?.data?.validoAte ?? null);
          setExpiresAt(body?.data?.expiresAt ?? null);
          setSegundosRestantes(
            typeof body?.data?.segundosRestantes === 'number' ? body.data.segundosRestantes : null,
          );
          if (body?.data?.instituicao) {
            setDadosInstituicao(body.data.instituicao);
          }
          setEstado('valido');
        } else if (res.status === 409) {
          setEstado('enviado');
        } else if (res.status === 410) {
          setEstado('expirado');
        } else {
          setEstado('invalido');
        }
      })
      .catch(() => setEstado('invalido'));
  }, [token]);

  useEffect(() => {
    if (estado !== 'valido' || !expiresAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const restante = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (restante <= 0) {
        setSegundosRestantes(0);
        setEstado('expirado');
        window.clearInterval(intervalId);
        return;
      }

      setSegundosRestantes(restante);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [estado, expiresAt]);

  if (estado === 'verificando') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500 dark:text-slate-400">
        Verificando link de acesso...
      </div>
    );
  }

  if (estado === 'ausente') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Link inválido</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Este formulário só pode ser acessado por meio de um link gerado pela Fortes Engenharia.
          Entre em contato para solicitar seu link de acesso.
        </p>
      </div>
    );
  }

  if (estado === 'expirado') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-xl font-semibold text-red-600 dark:text-red-400">Link expirado</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Link expirado. Entre em contato com a Fortes Engenharia para solicitar um novo link.
        </p>
      </div>
    );
  }

  if (estado === 'invalido') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-xl font-semibold text-red-600 dark:text-red-400">Link não reconhecido</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          O link informado não foi encontrado. Verifique se copiou corretamente ou solicite um novo link.
        </p>
      </div>
    );
  }

  if (estado === 'enviado') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-xl font-semibold text-green-600 dark:text-green-400">Informações enviadas</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Informações enviadas com sucesso. Aguarde a validação da equipe Fortes Engenharia.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-4">
      {validoAte && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Link válido até {validoAte}.
        </p>
      )}
      {estado === 'valido' && typeof segundosRestantes === 'number' && segundosRestantes > 0 ? (
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          Tempo restante para concluir o cadastro: {formatarTempoRestante(segundosRestantes)}
        </p>
      ) : null}
      {dadosInstituicao && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          Os dados abaixo foram pré-preenchidos com as informações já cadastradas. Revise e atualize o que for necessário.
        </div>
      )}
      <CadastroInstituicaoCompletoForm token={token} dadosIniciais={dadosInstituicao ?? undefined} onSuccess={() => setEstado('enviado')} />
    </div>
  );
};
