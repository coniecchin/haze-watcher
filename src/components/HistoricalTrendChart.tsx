/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AirQualityData, RegionKey } from '../types/airQuality';
import { LineChart, Clock } from 'lucide-react';

interface HistoricalTrendChartProps {
  data: AirQualityData;
  selectedRegion: RegionKey;
}

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({
  data,
  selectedRegion,
}) => {
  const [chartMode, setChartMode] = useState<'psi' | 'pm25'>('psi');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const reading = data.readings[selectedRegion] || data.readings.national;
  const history = reading.historical24h || [];

  const width = 800;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max scale logic
  const maxValue = chartMode === 'psi'
    ? Math.max(120, ...history.map((d) => d.psi), 320)
    : Math.max(80, ...history.map((d) => d.pm25), 200);

  const scaleY = (val: number) => {
    return paddingTop + chartHeight - (val / maxValue) * chartHeight;
  };

  const scaleX = (idx: number) => {
    if (history.length <= 1) return paddingLeft;
    return paddingLeft + (idx / (history.length - 1)) * chartWidth;
  };

  // Generate SVG path points
  const points = history.map((d, idx) => ({
    x: scaleX(idx),
    y: scaleY(chartMode === 'psi' ? d.psi : d.pm25),
    item: d,
  }));

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`
    : '';

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
              24-Hour Air Quality Trajectory
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly progression for {reading.name} ({reading.stationName})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg border border-slate-700">
            <button
              onClick={() => setChartMode('psi')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartMode === 'psi'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              24-Hr PSI
            </button>
            <button
              onClick={() => setChartMode('pm25')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartMode === 'pm25'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1-Hr PM2.5
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[550px]"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Reference Thresholds */}
          {chartMode === 'psi' ? (
            <>
              {/* 50 Good */}
              <line
                x1={paddingLeft}
                y1={scaleY(50)}
                x2={width - paddingRight}
                y2={scaleY(50)}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.4"
              />
              <text x={paddingLeft - 8} y={scaleY(50) + 3} fill="#10b981" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                50 (Good)
              </text>

              {/* 100 Moderate ceiling / Unhealthy start */}
              <line
                x1={paddingLeft}
                y1={scaleY(100)}
                x2={width - paddingRight}
                y2={scaleY(100)}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.4"
              />
              <text x={paddingLeft - 8} y={scaleY(100) + 3} fill="#f59e0b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                100 (Unhealthy)
              </text>

              {/* 200 Very Unhealthy */}
              <line
                x1={paddingLeft}
                y1={scaleY(200)}
                x2={width - paddingRight}
                y2={scaleY(200)}
                stroke="#f97316"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.4"
              />
              <text x={paddingLeft - 8} y={scaleY(200) + 3} fill="#f97316" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                200 (V.Unhealthy)
              </text>

              {/* 300 Hazardous */}
              <line
                x1={paddingLeft}
                y1={scaleY(300)}
                x2={width - paddingRight}
                y2={scaleY(300)}
                stroke="#f43f5e"
                strokeDasharray="4 2"
                strokeWidth="1.2"
                opacity="0.6"
              />
              <text x={paddingLeft - 8} y={scaleY(300) + 3} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                300 (Hazardous)
              </text>
            </>
          ) : (
            <>
              {/* PM2.5 55 Normal */}
              <line
                x1={paddingLeft}
                y1={scaleY(55)}
                x2={width - paddingRight}
                y2={scaleY(55)}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.5"
              />
              <text x={paddingLeft - 8} y={scaleY(55) + 3} fill="#10b981" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                55 (Normal)
              </text>

              {/* PM2.5 150 Elevated */}
              <line
                x1={paddingLeft}
                y1={scaleY(150)}
                x2={width - paddingRight}
                y2={scaleY(150)}
                stroke="#f97316"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity="0.5"
              />
              <text x={paddingLeft - 8} y={scaleY(150) + 3} fill="#f97316" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                150 (High)
              </text>
            </>
          )}

          {/* Bottom baseline axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaD} fill="url(#curveGradient)" />

          {/* Main Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis Time Labels */}
          {history.map((d, idx) => {
            if (idx % 3 !== 0 && idx !== history.length - 1) return null;
            const x = scaleX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {d.hour}
              </text>
            );
          })}

          {/* Interactive hover points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === idx ? 5 : 3}
              fill={hoverIndex === idx ? '#38bdf8' : '#0891b2'}
              stroke="#0f172a"
              strokeWidth="1.5"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}

          {/* Hover Crosshair and Value Tag */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Hover readout HUD */}
        {hoveredPoint && (
          <div
            className="absolute top-2 pointer-events-none rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-1.5 shadow-xl backdrop-blur-sm text-xs font-mono"
            style={{
              left: Math.min(Math.max(20, hoveredPoint.x - 60), width - 150),
            }}
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Clock className="w-3 h-3" />
              <span>{hoveredPoint.item.hour}</span>
            </div>
            <div className="text-cyan-300 font-bold mt-0.5">
              {chartMode === 'psi' ? `PSI: ${hoveredPoint.item.psi}` : `PM2.5: ${hoveredPoint.item.pm25} µg/m³`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
