/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AirQualityData } from '../types/airQuality';
import { PSI_BANDS, getPsiCategory } from '../utils/psiStandards';
import { AlertOctagon, AlertTriangle, ShieldAlert, ArrowRight, BellRing } from 'lucide-react';

interface HazardAlertBannerProps {
  data: AirQualityData;
  onOpenAdvisory: () => void;
  onOpenAlertSettings: () => void;
}

export const HazardAlertBanner: React.FC<HazardAlertBannerProps> = ({
  data,
  onOpenAdvisory,
  onOpenAlertSettings,
}) => {
  // Find highest regional PSI
  let maxPsi = 0;
  let maxRegionName = '';
  let affectedCount = 0;

  (['west', 'north', 'central', 'south', 'east'] as const).forEach((reg) => {
    const r = data.readings[reg];
    if (r.psi24Hourly > maxPsi) {
      maxPsi = r.psi24Hourly;
      maxRegionName = r.name;
    }
    if (r.psi24Hourly > 100) {
      affectedCount++;
    }
  });

  const cat = getPsiCategory(maxPsi);

  // Only display if air quality reaches unhealthy (101+), very unhealthy (201+), or hazardous (301+)
  if (cat === 'good' || cat === 'moderate') {
    return null;
  }

  const band = PSI_BANDS[cat];
  const isHazardous = cat === 'hazardous';
  const isVeryUnhealthy = cat === 'very_unhealthy';

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all shadow-xl backdrop-blur-md ${
        isHazardous
          ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/30'
          : isVeryUnhealthy
          ? 'bg-orange-950/40 border-orange-500/50 shadow-orange-950/30'
          : 'bg-amber-950/40 border-amber-500/50 shadow-amber-950/30'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              isHazardous
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : isVeryUnhealthy
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
          >
            {isHazardous ? (
              <ShieldAlert className="w-6 h-6" />
            ) : isVeryUnhealthy ? (
              <AlertOctagon className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isHazardous
                    ? 'bg-rose-500 text-white'
                    : isVeryUnhealthy
                    ? 'bg-orange-500 text-slate-950'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {band.label} Air Quality Alert
              </span>
              <span className="text-xs text-slate-300">
                Peak: <strong className="font-mono text-white">PSI {maxPsi}</strong> ({maxRegionName})
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">{affectedCount} region(s) elevated</span>
            </div>

            <p className="mt-1 text-sm text-slate-200">
              {isHazardous
                ? 'CRITICAL THRESHOLD BREACHED: Everyone should stay indoors, keep windows closed, and run HEPA air cleaners. N95 masks recommended for essential outdoor movement.'
                : isVeryUnhealthy
                ? 'Elevated smoke haze: Elderly, pregnant women, and children should avoid outdoor activity. Healthy individuals should reduce prolonged outdoor exertion.'
                : 'Air pollution elevated: Persons with chronic lung or heart disease should reduce strenuous outdoor exertion.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={onOpenAdvisory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>Health Advisory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenAlertSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Manage Alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
