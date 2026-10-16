/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AirQualityData, RegionKey } from '../types/airQuality';
import { getPsiCategory, getHealthAdvisories, PSI_BANDS } from '../utils/psiStandards';
import { HeartPulse, Users, Baby, Activity, Info, ShieldCheck } from 'lucide-react';

interface HealthAdvisoryPanelProps {
  data: AirQualityData;
  selectedRegion: RegionKey;
}

export const HealthAdvisoryPanel: React.FC<HealthAdvisoryPanelProps> = ({
  data,
  selectedRegion,
}) => {
  const currentReading = data.readings[selectedRegion] || data.readings.national;
  const psi = currentReading.psi24Hourly;
  const category = getPsiCategory(psi);
  const band = PSI_BANDS[category];
  const advice = getHealthAdvisories(psi);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
              MOH & NEA Singapore Health Advisory
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Official guidelines calibrated to current reading in {currentReading.name} (PSI {psi})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-md border"
            style={{
              backgroundColor: `${band.accentColor}18`,
              borderColor: `${band.accentColor}40`,
              color: band.accentColor,
            }}
          >
            Air Status: {band.label} (PSI {psi})
          </span>
        </div>
      </div>

      {/* 3-Column Demographic Advisory Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Group 1: Healthy Individuals */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Healthy Persons
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {advice.healthy}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            {psi <= 100
              ? 'Status: Normal outdoor activities unrestricted'
              : psi <= 200
              ? 'Status: Limit heavy jogging / cycling'
              : 'Status: Cease strenuous outdoor endurance training'}
          </div>
        </div>

        {/* Group 2: Elderly, Pregnant Women, Children */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <Baby className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Elderly & Children
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {advice.vulnerable}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            {psi <= 100
              ? 'Status: Standard daily routine safe'
              : psi <= 200
              ? 'Status: Keep outdoor play brief'
              : 'Status: Strict indoor stay recommended'}
          </div>
        </div>

        {/* Group 3: Persons with Chronic Lung / Heart Disease */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-rose-400">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Chronic Heart / Lung
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {advice.chronic}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            {psi <= 100
              ? 'Status: Medication routine standard'
              : psi <= 200
              ? 'Status: Keep reliever inhaler accessible'
              : 'Status: Immediate medical care if symptomatic'}
          </div>
        </div>
      </div>

      {/* N95 Mask Guideline Callout */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-slate-200">
            N95 Mask Guidance (Singapore Ministry of Health)
          </div>
          <p className="text-slate-400 leading-relaxed">
            {advice.n95Recommendation} Standard surgical and paper masks do not protect against fine PM2.5 haze particles. If wearing an N95 respirator, ensure an airtight facial seal.
          </p>
        </div>
      </div>
    </div>
  );
};
