/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Server, Copy, Check, Terminal, Code2, Globe } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sampleServerlessCode = `// serverless-handler.ts (Cloud Run / AWS Lambda / Cloudflare Worker)
// Scheduled cron: every 15 minutes
import webpush from 'web-push';

const NEA_PSI_URL = 'https://api.data.gov.sg/v1/environment/psi';

export async function checkAirQualityAndPush() {
  const res = await fetch(NEA_PSI_URL);
  const data = await res.json();
  const readings = data.items[0]?.readings;

  const westPsi = readings?.psi_twenty_four_hourly?.west || 0;
  const nationalPsi = readings?.psi_twenty_four_hourly?.national || 0;

  // Hazardous threshold check
  if (westPsi >= 300 || nationalPsi >= 300) {
    const payload = JSON.stringify({
      title: 'CRITICAL: Hazardous Air Quality in Singapore',
      body: \`West PSI has reached \${westPsi}. NEA advises staying indoors.\`,
      tag: 'haze-emergency',
      timestamp: new Date().toISOString()
    });

    // Send push to registered subscribers stored in database (e.g. Firestore / PostgreSQL)
    // await sendWebPushToSubscribers(payload);
  }
}`;

  const sampleWebhookPayload = `{
  "event": "AIR_QUALITY_THRESHOLD_BREACH",
  "region": "west",
  "metric": "psi_twenty_four_hourly",
  "value": 318,
  "category": "hazardous",
  "timestamp": "2026-10-15T12:00:00Z",
  "advisory": {
    "action": "stay_indoors",
    "n95_required": true
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Serverless Backend Integration Guide
              </h2>
              <p className="text-xs text-slate-400">
                Specifications for connecting your serverless cron & Web Push notification backend
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Architecture Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200 mb-1">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>1. NEA Open Data</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Cron worker queries <code>api.data.gov.sg/v1/environment/psi</code> every 15 minutes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200 mb-1">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>2. Threshold Evaluation</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Checks regional 24-hr PSI and 1-hr PM2.5 against hazardous thresholds (≥ 300, ≥ 200).
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200 mb-1">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>3. Web Push Broadcast</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Dispatches encrypted payload to user push subscriptions via standard Web Push protocol (VAPID).
              </p>
            </div>
          </div>

          {/* Sample Serverless Handler */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Sample Serverless Worker Function (Node.js / TypeScript)
              </span>
              <button
                onClick={() => handleCopy(sampleServerlessCode, 'code')}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
              >
                {copiedSection === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'code' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto">
              {sampleServerlessCode}
            </pre>
          </div>

          {/* Webhook JSON Contract */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Target Webhook Payload Schema
              </span>
              <button
                onClick={() => handleCopy(sampleWebhookPayload, 'payload')}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
              >
                {copiedSection === 'payload' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'payload' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300/90 overflow-x-auto">
              {sampleWebhookPayload}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
