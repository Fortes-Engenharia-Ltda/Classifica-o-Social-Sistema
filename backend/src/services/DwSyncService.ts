import fs from 'fs';
import path from 'path';
import { config } from '../config';
import logger from '../config/logger';
import { NotaFiscalService } from './NotaFiscalService';

export type DwSyncOrigem = 'AGENDADA' | 'MANUAL';

export interface DwSyncResultado {
  totalLinhas: number;
  importadas: number;
  ignoradas: number;
}

export interface DwSyncExecucao {
  origem: DwSyncOrigem;
  iniciadaEm: string;
  finalizadaEm: string;
  sucesso: boolean;
  resultado?: DwSyncResultado;
  erro?: string;
}

export interface DwSyncStatus {
  emExecucao: boolean;
  execucaoAtual: { origem: DwSyncOrigem; iniciadaEm: string } | null;
  ultimaExecucao: DwSyncExecucao | null;
  ultimaSincronizacaoComSucesso: DwSyncExecucao | null;
  intervaloMinutos: number;
  proximaExecucaoEm: string | null;
}

const INTERVALO_MINUTOS = 10;
const ATRASO_INICIAL_MS = 60 * 1000;

// Fica no mesmo diretorio dos uploads para sobreviver a redeploys quando houver volume montado.
const STATUS_PATH = path.resolve(config.uploads.dir, 'dw-sync-status.json');

class DwSyncService {
  private notaFiscalService = new NotaFiscalService();
  private execucaoAtual: { origem: DwSyncOrigem; iniciadaEm: string } | null = null;
  private ultimaExecucao: DwSyncExecucao | null = null;
  private ultimaSincronizacaoComSucesso: DwSyncExecucao | null = null;
  private proximaExecucaoEm: Date | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.carregarStatus();
  }

  iniciarAgendamento(): void {
    if (this.timer) return;

    this.proximaExecucaoEm = new Date(Date.now() + ATRASO_INICIAL_MS);
    setTimeout(() => {
      this.dispararAgendada();
      this.timer = setInterval(() => this.dispararAgendada(), INTERVALO_MINUTOS * 60 * 1000);
    }, ATRASO_INICIAL_MS);

    logger.info(`Sincronizacao DW agendada a cada ${INTERVALO_MINUTOS} minutos`);
  }

  /** Inicia a sincronizacao sem aguardar. Retorna false se ja houver uma em andamento. */
  disparar(origem: DwSyncOrigem): boolean {
    if (this.execucaoAtual) return false;

    this.executar(origem).catch(() => undefined);
    return true;
  }

  getStatus(): DwSyncStatus {
    return {
      emExecucao: this.execucaoAtual !== null,
      execucaoAtual: this.execucaoAtual,
      ultimaExecucao: this.ultimaExecucao,
      ultimaSincronizacaoComSucesso: this.ultimaSincronizacaoComSucesso,
      intervaloMinutos: INTERVALO_MINUTOS,
      proximaExecucaoEm: this.proximaExecucaoEm?.toISOString() ?? null,
    };
  }

  private dispararAgendada(): void {
    this.proximaExecucaoEm = new Date(Date.now() + INTERVALO_MINUTOS * 60 * 1000);
    if (!this.disparar('AGENDADA')) {
      logger.info('Sincronizacao DW agendada ignorada: ja existe uma em andamento');
    }
  }

  private async executar(origem: DwSyncOrigem): Promise<void> {
    const iniciadaEm = new Date().toISOString();
    this.execucaoAtual = { origem, iniciadaEm };
    logger.info('Sincronizacao DW iniciada', { origem });

    try {
      const resultado = (await this.notaFiscalService.sincronizarDW()) as DwSyncResultado;
      const execucao: DwSyncExecucao = {
        origem,
        iniciadaEm,
        finalizadaEm: new Date().toISOString(),
        sucesso: true,
        resultado,
      };
      this.ultimaExecucao = execucao;
      this.ultimaSincronizacaoComSucesso = execucao;
      logger.info('Sincronizacao DW concluida', { origem, resultado });
    } catch (error: any) {
      this.ultimaExecucao = {
        origem,
        iniciadaEm,
        finalizadaEm: new Date().toISOString(),
        sucesso: false,
        erro: error?.message || 'Erro desconhecido',
      };
      logger.error('Erro na sincronizacao DW', { origem, error: error?.message, stack: error?.stack });
    } finally {
      this.execucaoAtual = null;
      this.salvarStatus();
    }
  }

  private carregarStatus(): void {
    try {
      if (!fs.existsSync(STATUS_PATH)) return;
      const salvo = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
      this.ultimaExecucao = salvo.ultimaExecucao ?? null;
      this.ultimaSincronizacaoComSucesso = salvo.ultimaSincronizacaoComSucesso ?? null;
    } catch (error: any) {
      logger.warn('Nao foi possivel ler o status da sincronizacao DW', { error: error?.message });
    }
  }

  private salvarStatus(): void {
    try {
      fs.mkdirSync(path.dirname(STATUS_PATH), { recursive: true });
      fs.writeFileSync(
        STATUS_PATH,
        JSON.stringify(
          {
            ultimaExecucao: this.ultimaExecucao,
            ultimaSincronizacaoComSucesso: this.ultimaSincronizacaoComSucesso,
          },
          null,
          2,
        ),
      );
    } catch (error: any) {
      logger.warn('Nao foi possivel salvar o status da sincronizacao DW', { error: error?.message });
    }
  }
}

export const dwSyncService = new DwSyncService();
