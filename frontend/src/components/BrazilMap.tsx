import React, { useState } from 'react';

const BRAZIL_PATH = 'M145 95L155 85L170 80L185 75L200 70L220 68L240 65L260 60L280 55L300 50L320 48L340 50L350 55L360 60L370 65L380 70L390 75L400 80L410 85L420 90L430 95L440 100L450 110L460 120L465 130L470 140L475 150L480 160L485 170L490 180L495 190L500 200L505 210L510 220L515 230L520 240L525 250L530 260L535 270L540 280L545 290L550 300L555 310L560 320L565 330L570 340L575 350L580 360L585 370L590 380L595 390L600 400L605 410L610 420L615 430L620 440L625 450L630 460L635 470L640 480L645 490L650 500L655 510L660 520L665 530L670 540L675 550L680 560L685 570L690 580L695 590L700 600L705 610L710 620L715 630L720 640L725 650L730 660L735 670L740 680L745 690L750 700L755 710L760 720L765 730L770 740L775 750L780 760L785 770L790 780L795 790L800 800L0 800L0 0L145 95Z';

interface EstadoCoord {
  sigla: string;
  nome: string;
  x: number;
  y: number;
}

const ESTADOS: EstadoCoord[] = [
  { sigla: 'AC', nome: 'Acre', x: 180, y: 420 },
  { sigla: 'AL', nome: 'Alagoas', x: 460, y: 440 },
  { sigla: 'AM', nome: 'Amazonas', x: 220, y: 280 },
  { sigla: 'AP', nome: 'Amapá', x: 380, y: 120 },
  { sigla: 'BA', nome: 'Bahia', x: 500, y: 380 },
  { sigla: 'CE', nome: 'Ceará', x: 490, y: 250 },
  { sigla: 'DF', nome: 'Distrito Federal', x: 420, y: 520 },
  { sigla: 'ES', nome: 'Espírito Santo', x: 540, y: 540 },
  { sigla: 'GO', nome: 'Goiás', x: 380, y: 520 },
  { sigla: 'MA', nome: 'Maranhão', x: 420, y: 220 },
  { sigla: 'MG', nome: 'Minas Gerais', x: 480, y: 560 },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', x: 320, y: 580 },
  { sigla: 'MT', nome: 'Mato Grosso', x: 300, y: 420 },
  { sigla: 'PA', nome: 'Pará', x: 340, y: 200 },
  { sigla: 'PB', nome: 'Paraíba', x: 510, y: 300 },
  { sigla: 'PE', nome: 'Pernambuco', x: 500, y: 340 },
  { sigla: 'PI', nome: 'Piauí', x: 440, y: 300 },
  { sigla: 'PR', nome: 'Paraná', x: 440, y: 670 },
  { sigla: 'RJ', nome: 'Rio de Janeiro', x: 540, y: 610 },
  { sigla: 'RN', nome: 'Rio Grande do Norte', x: 520, y: 270 },
  { sigla: 'RO', nome: 'Rondônia', x: 220, y: 460 },
  { sigla: 'RR', nome: 'Roraima', x: 290, y: 120 },
  { sigla: 'RS', nome: 'Rio Grande do Sul', x: 420, y: 740 },
  { sigla: 'SC', nome: 'Santa Catarina', x: 440, y: 700 },
  { sigla: 'SE', nome: 'Sergipe', x: 490, y: 420 },
  { sigla: 'SP', nome: 'São Paulo', x: 510, y: 630 },
  { sigla: 'TO', nome: 'Tocantins', x: 390, y: 350 },
];

type BrazilMapProps = {
  distribuicaoPorEstado?: Array<{ name: string; value: number }>;
  valoresPorEstado?: Array<{ name: string; value: number }>;
  formatCurrency: (value: number) => string;
};

const BrazilMap: React.FC<BrazilMapProps> = ({ distribuicaoPorEstado = [], valoresPorEstado = [], formatCurrency }) => {
  const [tooltip, setTooltip] = useState<{ sigla: string; x: number; y: number } | null>(null);
  const [hoveredSigla, setHoveredSigla] = useState<string | null>(null);

  const valorMap = new Map<string, number>();
  valoresPorEstado.forEach((item) => valorMap.set(item.name, item.value));

  const quantidadeMap = new Map<string, number>();
  distribuicaoPorEstado.forEach((item) => quantidadeMap.set(item.name, item.value));

  const maxValor = Math.max(...Array.from(valorMap.values()), 1);

  const estadosComDados = ESTADOS.filter((e) => (valorMap.get(e.sigla) || 0) > 0);

  return (
    <div className="relative w-full" style={{ height: 440 }}>
      <svg viewBox="0 0 700 800" className="h-full w-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <defs>
          <filter id="mapShadow">
            <feDropShadow dx={0} dy={0} stdDeviation={1} floodColor="#94a3b8" floodOpacity={0.3} />
          </filter>
        </defs>

        <path d={BRAZIL_PATH} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1} filter="url(#mapShadow)" />

        {estadosComDados.map((estado) => {
          const valor = valorMap.get(estado.sigla) || 0;
          const quantidade = quantidadeMap.get(estado.sigla) || 0;
          const radius = Math.max(8, Math.sqrt(valor / maxValor) * 35);
          const isHovered = hoveredSigla === estado.sigla;

          return (
            <g key={estado.sigla}>
              <circle
                cx={estado.x}
                cy={estado.y}
                r={isHovered ? radius + 3 : radius}
                fill={isHovered ? 'rgba(14, 165, 233, 0.7)' : 'rgba(14, 165, 233, 0.5)'}
                stroke={isHovered ? 'rgba(14, 165, 233, 1)' : 'rgba(14, 165, 233, 0.8)'}
                strokeWidth={isHovered ? 3 : 2}
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => {
                  setHoveredSigla(estado.sigla);
                  setTooltip({ sigla: estado.sigla, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => {
                  setHoveredSigla(null);
                  setTooltip(null);
                }}
                onMouseMove={(e) => {
                  setTooltip({ sigla: estado.sigla, x: e.clientX, y: e.clientY });
                }}
              />
              <text
                x={estado.x}
                y={estado.y - radius - 5}
                textAnchor="middle"
                fill="#1e293b"
                fontSize={10}
                fontWeight={600}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {estado.sigla}
              </text>
              {isHovered && (
                <text
                  x={estado.x}
                  y={estado.y + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={10}
                  fontWeight={700}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {formatCurrency(valor)}
                </text>
              )}
            </g>
          );
        })}

        {estadosComDados.length === 0 && (
          <text x={350} y={400} textAnchor="middle" fill="#94a3b8" fontSize={14}>
            Nenhum dado disponível
          </text>
        )}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{ left: tooltip.x + 12, top: tooltip.y - 44 }}
        >
          <p className="font-semibold text-gray-900 dark:text-white">
            {ESTADOS.find((e) => e.sigla === tooltip.sigla)?.nome || tooltip.sigla} ({tooltip.sigla})
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Total investido: {formatCurrency(valorMap.get(tooltip.sigla) || 0)}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            NFs: {(quantidadeMap.get(tooltip.sigla) || 0).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
};

export default BrazilMap;
