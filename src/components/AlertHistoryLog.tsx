/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertLogItem } from '../types/airQuality';
import { PSI_BANDS } from '../utils/psiStandards';
import { History, ShieldAlert, AlertTriangle, Check, Trash2, Download } from 'lucide-react';

interface AlertHistoryLogProps {
  logs: AlertLogItem[];
  onAcknowledge: (id: string) => void;
  onClearLogs: () => void;
}

export const AlertHistoryLog: React.FC<AlertHistoryLogProps> = ({
  logs,
  onAcknowledge,
  onClearLogs,
}) => {
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sg-airpulse-alerts-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
            Threshold Breach Audit Log
          </h3>
          <span className="text-xs font-mono text-slate-400">
            ({logs.length} event{logs.length === 1 ? '' : 's'})
          </span>
        </div>

        {logs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No threshold breaches recorded during this monitoring session. System status nominal.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {logs.map((item) => {
            const band = PSI_BANDS[item.category] || PSI_BANDS.unhealthy;
            const isHazardous = item.category === 'hazardous';

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                  item.acknowledged
                    ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    : isHazardous
                    ? 'bg-rose-950/30 border-rose-500/40'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isHazardous
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isHazardous ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${band.accentColor}25`,
                          color: band.accentColor,
                        }}
                      >
                        {band.label}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{item.timestamp}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {item.region.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-0.5">
                      {item.message}
                    </p>
                  </div>
                </div>

                {!item.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(item.id)}
                    className="self-end sm:self-center flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Check className="w-3 h-3 text-cyan-400" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
