/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AirQualityData,
  RegionKey,
  AlertRule,
  AlertLogItem,
} from './types/airQuality';
import {
  fetchLiveAirQualityData,
  buildSyntheticData,
  SimulationScenario,
} from './services/airQualityService';
import { notificationService } from './services/notificationService';
import { PSI_BANDS, getPsiCategory } from './utils/psiStandards';

// Components
import { InteractiveMap } from './components/InteractiveMap';
import { HazardAlertBanner } from './components/HazardAlertBanner';
import { RegionalCardsGrid } from './components/RegionalCardsGrid';
import { HealthAdvisoryPanel } from './components/HealthAdvisoryPanel';
import { PollutantBreakdown } from './components/PollutantBreakdown';
import { HistoricalTrendChart } from './components/HistoricalTrendChart';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { AlertHistoryLog } from './components/AlertHistoryLog';

import {
  Bell,
  RefreshCw,
  Wind,
  Thermometer,
  Droplets,
  Server,
  Volume2,
  VolumeX,
  Compass,
  Flame,
  CheckCircle2,
} from 'lucide-react';

// Default starter alert rules according to NEA Singapore health threshold standards
const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'rule-hazardous',
    name: 'Hazardous Air Quality Emergency',
    region: 'all',
    metric: 'psi',
    threshold: 300,
    enabled: true,
    soundEnabled: true,
    browserNotification: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-very-unhealthy',
    name: 'Very Unhealthy Smoke Warning',
    region: 'all',
    metric: 'psi',
    threshold: 200,
    enabled: true,
    soundEnabled: true,
    browserNotification: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-pm25-elevated',
    name: 'High 1-Hr PM2.5 Particulate Spike',
    region: 'all',
    metric: 'pm25',
    threshold: 150,
    enabled: true,
    soundEnabled: true,
    browserNotification: true,
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [data, setData] = useState<AirQualityData>(() => buildSyntheticData('LIVE'));
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('national');
  const [activeMetric, setActiveMetric] = useState<'psi' | 'pm25'>('psi');
  const [scenario, setScenario] = useState<SimulationScenario>('LIVE');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Modals state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Persistence for rules and logs
  const [rules, setRules] = useState<AlertRule[]>(() => {
    try {
      const saved = localStorage.getItem('sg_airpulse_rules');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_RULES;
  });

  const [logs, setLogs] = useState<AlertLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('sg_airpulse_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const lastAlertTimestampsRef = useRef<Record<string, number>>({});

  // Fetch / update data
  const loadData = useCallback(async (currentScenario: SimulationScenario) => {
    setIsLoading(true);
    try {
      const freshData = await fetchLiveAirQualityData(currentScenario);
      setData(freshData);
      setLastRefreshed(new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Evaluate alert rules against fresh readings
      const { breachedItems, updatedTimestamps } = notificationService.evaluateRules(
        rules,
        freshData,
        lastAlertTimestampsRef.current
      );

      lastAlertTimestampsRef.current = updatedTimestamps;

      if (breachedItems.length > 0) {
        setLogs((prev) => {
          const combined = [...breachedItems, ...prev].slice(0, 50);
          try {
            localStorage.setItem('sg_airpulse_logs', JSON.stringify(combined));
          } catch {
            // Ignore
          }
          return combined;
        });
      }
    } catch (err) {
      console.error('Failed to load air quality data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [rules]);

  // Initial load
  useEffect(() => {
    loadData(scenario);
  }, [loadData, scenario]);

  // Automatic background polling interval (every 60 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(scenario);
    }, 60000);
    return () => clearInterval(timer);
  }, [loadData, scenario]);

  const handleSaveRules = (newRules: AlertRule[]) => {
    setRules(newRules);
    try {
      localStorage.setItem('sg_airpulse_rules', JSON.stringify(newRules));
    } catch {
      // Ignore
    }
  };

  const handleAcknowledgeLog = (id: string) => {
    setLogs((prev) => {
      const updated = prev.map((l) => (l.id === id ? { ...l, acknowledged: true } : l));
      try {
        localStorage.setItem('sg_airpulse_logs', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleClearLogs = () => {
    setLogs([]);
    try {
      localStorage.removeItem('sg_airpulse_logs');
    } catch {
      // Ignore
    }
  };

  const handleToggleMute = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    notificationService.setSoundMuted(next);
  };

  const nationalBand = PSI_BANDS[getPsiCategory(data.nationalPsi)];
  const highestReading = data.readings[data.highestRegion];
  const activeUnacknowledgedAlerts = logs.filter((l) => !l.acknowledged).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Universal Top Bar Contract: 3 Zones: Brand - Nav Links - 1 Action */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-10 py-3.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
          <span>SG AirPulse</span>
        </a>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#overview" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Overview
          </a>
          <a href="#map" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Regional Map
          </a>
          <a href="#advisories" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Advisories
          </a>
          <a href="#pollutants" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Pollutants
          </a>
          <a href="#audit-log" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Audit Log
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Push</span>
            {activeUnacknowledgedAlerts > 0 && (
              <span className="bg-rose-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                {activeUnacknowledgedAlerts}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hazardous / Elevated Air Quality Warning Banner */}
        <HazardAlertBanner
          data={data}
          onOpenAdvisory={() => {
            const el = document.getElementById('advisories');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenAlertSettings={() => setIsAlertModalOpen(true)}
        />

        {/* Hero Telemetry & National Snapshot Strip */}
        <section id="overview" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:p-6 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: National Headline & Status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Republic of Singapore National Air Telemetry</span>
                <span>·</span>
                <span className="text-slate-500">{data.source}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Live Pollutant Standards Index (PSI)
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Continuous 24-hour rolling averages and 1-hour PM2.5 concentrations from National Environment Agency monitoring stations.
              </p>
            </div>

            {/* Right: Quick actions & Simulation Status */}
            <div className="flex flex-wrap items-center gap-3">
              {scenario !== 'LIVE' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulating: {scenario}</span>
                </div>
              )}

              <button
                onClick={() => setIsBackendModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="View Serverless Backend Integration Guide"
              >
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Backend Bridge</span>
              </button>

              <button
                onClick={handleToggleMute}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title={isSoundMuted ? 'Audio Alerts Muted' : 'Audio Alerts Active'}
              >
                {isSoundMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
              </button>

              <button
                onClick={() => loadData(scenario)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>

          {/* 4-Zone KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
            {/* KPI 1: National 24-hr PSI */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Singapore Overall PSI
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="text-3xl font-bold font-mono tabular-nums"
                  style={{ color: nationalBand.accentColor }}
                >
                  {data.nationalPsi}
                </span>
                <span className={`text-xs font-semibold ${nationalBand.textColor}`}>
                  {nationalBand.label}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                24-hr rolling benchmark
              </div>
            </div>

            {/* KPI 2: National 1-hr PM2.5 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                1-Hr PM2.5 (Fine Dust)
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold font-mono text-white tabular-nums">
                  {data.nationalPm25}
                </span>
                <span className="text-xs font-mono text-slate-400">µg/m³</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {data.nationalPm25 <= 55 ? 'Band I · Normal range' : 'Elevated concentration'}
              </div>
            </div>

            {/* KPI 3: Peak Region Reading */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Highest Regional PSI
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
                  {highestReading?.psi24Hourly ?? '--'}
                </span>
                <span className="text-xs font-semibold text-slate-300 truncate">
                  {highestReading?.name.replace(' Region', '') ?? 'West'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                Station: {highestReading?.stationName.replace(' Station', '')}
              </div>
            </div>

            {/* KPI 4: Surface Wind & Monsoon */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Surface Wind Vector
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Wind className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="text-lg font-bold font-mono text-slate-200 truncate">
                  {data.windDirectionDegrees}° ({data.windSpeedKmh} km/h)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                {data.windDirectionText}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Singapore Air Quality Map */}
        <section id="map" className="space-y-3">
          <InteractiveMap
            data={data}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => setSelectedRegion(reg)}
            activeMetric={activeMetric}
            onChangeMetric={(m) => setActiveMetric(m)}
          />
        </section>

        {/* Section 3: 5 Regions + National Cards Grid */}
        <section>
          <RegionalCardsGrid
            data={data}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => setSelectedRegion(reg)}
          />
        </section>

        {/* Section 4: 24-Hour Trend Chart */}
        <section>
          <HistoricalTrendChart data={data} selectedRegion={selectedRegion} />
        </section>

        {/* Section 5: Multi-Pollutant Concentration Matrix */}
        <section id="pollutants">
          <PollutantBreakdown data={data} selectedRegion={selectedRegion} />
        </section>

        {/* Section 6: Official MOH / NEA Health Advisory */}
        <section id="advisories">
          <HealthAdvisoryPanel data={data} selectedRegion={selectedRegion} />
        </section>

        {/* Section 7: Audit Log */}
        <section id="audit-log">
          <AlertHistoryLog
            logs={logs}
            onAcknowledge={handleAcknowledgeLog}
            onClearLogs={handleClearLogs}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-400">SG AirPulse</span> · Singapore Real-Time Air Quality & Hazardous Alert Monitoring System
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono">Last Sync: {lastRefreshed || data.updateTimestamp}</span>
            <span>·</span>
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-mono underline"
            >
              Serverless Setup Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        rules={rules}
        onSaveRules={handleSaveRules}
        currentScenario={scenario}
        onSelectScenario={(s) => {
          setScenario(s);
          loadData(s);
        }}
        isMuted={isSoundMuted}
        onToggleMute={handleToggleMute}
      />

      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </div>
  );
}
