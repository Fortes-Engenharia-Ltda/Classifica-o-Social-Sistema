import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const BRAZIL_TOPOJSON = 'https://cdn.jsdelivr.net/npm/topojson-atlas@0.2/countries/bra-2.json';

const ESTADO_COORDS: Record<string, [number, number]> = {
  AC: [-67.808, -9.974],
  AL: [-36.782, -9.571],
  AM: [-64.0, -4.0],
  AP: [-52.0, 1.0],
  BA: [-42.0, -13.0],
  CE: [-39.5, -5.0],
  DF: [-47.93, -15.78],
  ES: [-40.5, -19.5],
  GO: [-49.5, -16.0],
  MA: [-45.0, -6.0],
  MG: [-44.5, -18.5],
  MS: [-55.0, -20.0],
  MT: [-56.0, -13.0],
  PA: [-53.0, -4.0],
  PB: [-36.5, -7.0],
  PE: [-37.5, -8.5],
  PI: [-42.5, -7.0],
  PR: [-51.5, -25.0],
  RJ: [-43.0, -22.5],
  RN: [-36.5, -5.8],
  RO: [-63.0, -11.0],
  RR: [-61.0, 2.0],
  RS: [-53.0, -30.5],
  SC: [-50.5, -27.0],
  SE: [-37.5, -10.5],
  SP: [-48.0, -23.5],
  TO: [-48.5, -10.0],
};

const ESTADO_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
};

type EstadoData = {
  sigla: string;
  quantidade: number;
  valor: number;
};

type BrazilMapProps = {
  distribuicaoPorEstado?: Array<{ name: string; value: number }>;
  valoresPorEstado?: Array<{ name: string; value: number }>;
  formatCurrency: (value: number) => string;
};

const BrazilMap: React.FC<BrazilMapProps> = ({ distribuicaoPorEstado = [], valoresPorEstado = [], formatCurrency }) => {
  const [tooltip, setTooltip] = useState<{ sigla: string; x: number; y: number } | null>(null);
  const [hoveredSigla, setHoveredSigla] = useState<string | null>(null);

  const valorMap = new Map<string, number>();
  valoresPorEstado.forEach((item) => {
    valorMap.set(item.name, item.value);
  });

  const quantidadeMap = new Map<string, number>();
  distribuicaoPorEstado.forEach((item) => {
    quantidadeMap.set(item.name, item.value);
  });

  const maxValor = Math.max(...Array.from(valorMap.values()), 1);

  const estadosData: EstadoData[] = Object.keys(ESTADO_COORDS).map((sigla) => ({
    sigla,
    quantidade: quantidadeMap.get(sigla) || 0,
    valor: valorMap.get(sigla) || 0,
  }));

  const estadosComDados = estadosData.filter((e) => e.valor > 0);

  return (
    <div className="relative w-full" style={{ height: 400 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-55, -14],
          scale: 650,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup maxZoom={4} minZoom={1}>
          <Geographies geography={BRAZIL_TOPOJSON}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const geoUf = geo.properties?.iso || '';
                const isHovered = hoveredSigla === geoUf;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHovered ? '#e2e8f0' : '#f1f5f9'}
                    stroke="#cbd5e1"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#e2e8f0', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {estadosComDados.map((estado) => {
            const coords = ESTADO_COORDS[estado.sigla];
            if (!coords) return null;

            const radius = Math.max(6, Math.sqrt(estado.valor / maxValor) * 30);

            return (
              <Marker key={estado.sigla} coordinates={coords}>
                <circle
                  r={radius}
                  fill="rgba(6, 182, 212, 0.6)"
                  stroke="rgba(6, 182, 212, 0.9)"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e: React.MouseEvent) => {
                    setHoveredSigla(estado.sigla);
                    setTooltip({ sigla: estado.sigla, x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredSigla(null);
                    setTooltip(null);
                  }}
                  onMouseMove={(e: React.MouseEvent) => {
                    setTooltip({ sigla: estado.sigla, x: e.clientX, y: e.clientY });
                  }}
                />
                <text
                  textAnchor="middle"
                  y={-radius - 6}
                  style={{ fontSize: 9, fontWeight: 600, fill: '#1e293b', pointerEvents: 'none' }}
                >
                  {estado.sigla}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-semibold text-gray-900 dark:text-white">
            {ESTADO_NAMES[tooltip.sigla] || tooltip.sigla} ({tooltip.sigla})
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
