/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertRule, RegionKey } from '../types/airQuality';
import { notificationService } from '../services/notificationService';
import { SimulationScenario } from '../services/airQualityService';
import {
  X,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CloudRain,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: AlertRule[];
  onSaveRules: (rules: AlertRule[]) => void;
  currentScenario: SimulationScenario;
  onSelectScenario: (scenario: SimulationScenario) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  currentScenario,
  onSelectScenario,
  isMuted,
  onToggleMute,
}) => {
  const [localRules, setLocalRules] = useState<AlertRule[]>(rules);
  const [permStatus, setPermStatus] = useState<NotificationPermission>(notificationService.getPermissionStatus());
  const [testSent, setTestSent] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'simulation'>('rules');

  // New rule form state
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleRegion, setNewRuleRegion] = useState<RegionKey | 'all'>('all');
  const [newRuleMetric, setNewRuleMetric] = useState<'psi' | 'pm25'>('psi');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(100);
  const [newRuleSound, setNewRuleSound] = useState<boolean>(true);
  const [newRulePush, setNewRulePush] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermStatus(res);
  };

  const handleTestNotification = () => {
    notificationService.playAlertSound(false);
    const sent = notificationService.showBrowserNotification('SG AirPulse Test Alert', {
      body: 'Browser push notifications are working properly! You will be alerted when air quality breaches safety thresholds.',
      tag: 'test-notification',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  const handleToggleRule = (id: string) => {
    const updated = localRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setLocalRules(updated);
    onSaveRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = localRules.filter((r) => r.id !== id);
    setLocalRules(updated);
    onSaveRules(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const created: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim() || `${newRuleRegion === 'all' ? 'All SG' : newRuleRegion.toUpperCase()} ${newRuleMetric.toUpperCase()} ≥ ${newRuleThreshold}`,
      region: newRuleRegion,
      metric: newRuleMetric,
      threshold: Number(newRuleThreshold),
      enabled: true,
      soundEnabled: newRuleSound,
      browserNotification: newRulePush,
      createdAt: new Date().toISOString(),
    };

    const updated = [...localRules, created];
    setLocalRules(updated);
    onSaveRules(updated);

    // Reset inputs
    setNewRuleName('');
    setNewRuleThreshold(newRuleMetric === 'psi' ? 100 : 55);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Alert Rules & Push Notification Center
              </h2>
              <p className="text-xs text-slate-400">
                Configure threshold triggers, browser alerts, and haze emergency testing
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

        {/* Modal Tabs */}
        <div className="flex items-center gap-4 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Alert Rules ({localRules.length})
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`pb-2.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors ${
              activeTab === 'simulation'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Haze Simulation Lab
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'rules' && (
            <>
              {/* Web Push Permission Banner */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        permStatus === 'granted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : permStatus === 'denied'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Browser Push Notifications
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {permStatus === 'granted'
                          ? 'Push notifications are authorized in this browser.'
                          : permStatus === 'denied'
                          ? 'Push notifications are blocked in your browser site permissions.'
                          : 'Authorize push notifications to receive background hazardous air quality alerts.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {permStatus !== 'granted' && (
                      <button
                        onClick={handleRequestPermission}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                      >
                        Enable Push
                      </button>
                    )}

                    <button
                      onClick={handleTestNotification}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      {testSent ? 'Alert Dispatched!' : 'Test Alert Now'}
                    </button>

                    <button
                      onClick={onToggleMute}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isMuted
                          ? 'bg-slate-800 border-slate-700 text-rose-400'
                          : 'bg-slate-800 border-slate-700 text-cyan-400'
                      }`}
                      title={isMuted ? 'Unmute Audio Siren' : 'Mute Audio Siren'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Rules List */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Configured Threshold Rules
                </div>

                <div className="space-y-2">
                  {localRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                        rule.enabled
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            rule.enabled
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'bg-slate-800 border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            {rule.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Region: {rule.region.toUpperCase()} · Metric:{' '}
                            {rule.metric.toUpperCase()} ≥ {rule.threshold}
                            {rule.metric === 'pm25' ? ' µg/m³' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400">
                          {rule.soundEnabled && 'Audio · '}
                          {rule.browserNotification && 'Push'}
                        </span>

                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Rule Form */}
              <form
                onSubmit={handleAddRule}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Add Custom Alert Rule
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Target Region
                    </label>
                    <select
                      value={newRuleRegion}
                      onChange={(e) => setNewRuleRegion(e.target.value as RegionKey | 'all')}
                      className="w-full text-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
                    >
                      <option value="all">All Singapore</option>
                      <option value="west">West Region</option>
                      <option value="central">Central Region</option>
                      <option value="south">South Region</option>
                      <option value="north">North Region</option>
                      <option value="east">East Region</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Metric
                    </label>
                    <select
                      value={newRuleMetric}
                      onChange={(e) => {
                        const m = e.target.value as 'psi' | 'pm25';
                        setNewRuleMetric(m);
                        setNewRuleThreshold(m === 'psi' ? 100 : 55);
                      }}
                      className="w-full text-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
                    >
                      <option value="psi">24-Hr PSI</option>
                      <option value="pm25">1-Hr PM2.5</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Threshold: <strong className="text-cyan-300 font-mono">{newRuleThreshold} {newRuleMetric === 'pm25' ? 'µg/m³' : ''}</strong>
                    </label>
                    <input
                      type="range"
                      min={newRuleMetric === 'psi' ? 40 : 25}
                      max={newRuleMetric === 'psi' ? 350 : 250}
                      step={5}
                      value={newRuleThreshold}
                      onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                      className="w-full accent-cyan-400 mt-2"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRuleSound}
                        onChange={(e) => setNewRuleSound(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span>Sound Warning</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRulePush}
                        onChange={(e) => setNewRulePush(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span>Web Notification</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Alert Rule</span>
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Air Quality Simulation Engine
                </div>
                <p className="text-xs text-slate-400">
                  Because Singapore live air quality is frequently in the Good/Moderate band, use these realistic scenario presets to test your alerts, audio alarms, push notifications, and map heatmaps.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Scenario 1: Hazardous Crisis */}
                <button
                  onClick={() => {
                    onSelectScenario('HAZE_CRISIS');
                    notificationService.playAlertSound(true);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    currentScenario === 'HAZE_CRISIS'
                      ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase">
                      <Flame className="w-4 h-4" />
                      <span>Haze Crisis (Hazardous)</span>
                    </div>
                    {currentScenario === 'HAZE_CRISIS' && (
                      <span className="text-[10px] font-mono bg-rose-500 text-white px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-rose-400">
                    PSI 318 · PM2.5 215 µg/m³
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Severe transboundary smoke episode affecting West and Central Singapore. Triggers emergency sirens and hazardous notifications.
                  </p>
                </button>

                {/* Scenario 2: Unhealthy Spike */}
                <button
                  onClick={() => {
                    onSelectScenario('UNHEALTHY_SPIKE');
                    notificationService.playAlertSound(false);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    currentScenario === 'UNHEALTHY_SPIKE'
                      ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Unhealthy Smoke Plume</span>
                    </div>
                    {currentScenario === 'UNHEALTHY_SPIKE' && (
                      <span className="text-[10px] font-mono bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    PSI 162 · PM2.5 92 µg/m³
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Elevated smoke plume crossing Singapore Strait into Jurong and Marina South.
                  </p>
                </button>

                {/* Scenario 3: Tropical Rain Clean */}
                <button
                  onClick={() => onSelectScenario('CLEAR_RAIN')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    currentScenario === 'CLEAR_RAIN'
                      ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase">
                      <CloudRain className="w-4 h-4" />
                      <span>Tropical Rain Clearing</span>
                    </div>
                    {currentScenario === 'CLEAR_RAIN' && (
                      <span className="text-[10px] font-mono bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    PSI 28 · PM2.5 11 µg/m³
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Clean post-downpour conditions across the island with cool sea breeze.
                  </p>
                </button>

                {/* Scenario 4: Official Live Feed */}
                <button
                  onClick={() => onSelectScenario('LIVE')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    currentScenario === 'LIVE'
                      ? 'bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase">
                      <Radio className="w-4 h-4" />
                      <span>Official NEA Live Feed</span>
                    </div>
                    {currentScenario === 'LIVE' && (
                      <span className="text-[10px] font-mono bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    Real-time Data.gov.sg
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Fetches real-time readings from Singapore GovTech NEA API endpoints.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <span className="text-xs text-slate-500 font-mono">
            {rules.filter((r) => r.enabled).length} alert trigger(s) active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
