import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '@/services';

export const useDashboardMetricas = (filters?: {
  programa?: string[];
  classificacao?: string[];
  orcadoNaoOrcado?: string[];
  obraId?: string[];
  projeto?: string[];
  dataInicio?: string;
  dataFim?: string;
}) => {
  return useQuery({
    queryKey: ['dashboard', 'metricas', filters],
    queryFn: async () => {
      const response = await DashboardService.getMetricas(filters);
      return response;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useDashboardAlertas = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'alertas', page, pageSize],
    queryFn: async () => {
      const response = await DashboardService.getAlertas(page, pageSize);
      return response;
    },
  });
};
