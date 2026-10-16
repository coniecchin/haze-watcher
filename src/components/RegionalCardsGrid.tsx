/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AirQualityData, RegionKey } from '../types/airQuality';
import { PSI_BANDS, getPsiCategory, getPm25Band } from '../utils/psiStandards';
import { TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react';

interface RegionalCardsGridProps {
  data: AirQualityData;
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
}

export const RegionalCardsGrid: React.FC<RegionalCardsGridProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
}) => {
  const regions: RegionKey[] = ['national', 'north', 'south', 'east', 'west', 'central'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
          Regional Air Quality Telemetry
        </h2>
        <span className="text-xs text-slate-500">
          Click any card to inspect & sync map
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {regions.map((regKey) => {
          const reading = data.readings[regKey];
          if (!reading) return null;

          const isSelected = selectedRegion === regKey;
          const isNational = regKey === 'national';
          const cat = getPsiCategory(reading.psi24Hourly);
          const band = PSI_BANDS[cat];
          const pmBand = getPm25Band(reading.pm25OneHourly);

          return (
            <button
              key={regKey}
              onClick={() => onSelectRegion(regKey)}
              className={`relative flex flex-col text-left p-3.5 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-950/20'
                  : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              {/* Card Header: Region name & trend */}
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {isNational ? 'Islandwide' : reading.name.replace(' Region', '')}
                </span>

                <div className="flex items-center text-slate-400">
                  {reading.trend === 'rising' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  ) : reading.trend === 'falling' ? (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Station Label */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-2 truncate">
                <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                <span className="truncate">{isNational ? 'All SG Average' : reading.stationName.replace(' Station', '')}</span>
              </div>

              {/* 24-Hr PSI Big Metric */}
              <div className="mt-auto pt-2 border-t border-slate-800/60 w-full">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  24-Hr PSI
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span
                    className="text-2xl font-bold font-mono tabular-nums"
                    style={{ color: band.accentColor }}
                  >
                    {reading.psi24Hourly}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${band.textColor}`}
                  >
                    {band.label}
                  </span>
                </div>
              </div>

              {/* 1-Hr PM2.5 Mini Metric */}
              <div className="mt-2 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">1-hr PM2.5:</span>
                <span className="text-slate-200 font-semibold tabular-nums">
                  {reading.pm25OneHourly} <span className="text-[10px] text-slate-400">µg/m³</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
