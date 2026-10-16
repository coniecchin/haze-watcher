/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AirQualityData, RegionKey } from '../types/airQuality';
import { PSI_BANDS, getPsiCategory, getPm25Band } from '../utils/psiStandards';
import { Layers, Wind, Radio, ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';

interface InteractiveMapProps {
  data: AirQualityData;
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
  activeMetric: 'psi' | 'pm25';
  onChangeMetric: (metric: 'psi' | 'pm25') => void;
}

// Geographic SVG Path geometry for Singapore's 5 NEA regions (Coordinates scaled to 1000x600 viewBox)
// Accurately mirrors Singapore coastline, Tuas/Jurong in West, Woodlands/Sembawang in North,
// Bishan/AMK Central, Bedok/Changi in East, Marina Bay/Sentosa in South.
const REGION_PATHS: Record<Exclude<RegionKey, 'national'>, { path: string; labelX: number; labelY: number; stationX: number; stationY: number }> = {
  west: {
    // West: Tuas peninsula, Jurong West, Boon Lay, Clementi, Choa Chu Kang up to Kranji border
    path: `M 80,410 L 110,430 L 150,440 L 220,430 L 260,390 L 320,380 L 350,350 L 370,300 L 350,260 L 320,240 L 280,230 L 250,200 L 230,190 L 200,210 L 180,240 L 150,260 L 120,290 L 90,340 L 70,380 Z`,
    labelX: 220,
    labelY: 310,
    stationX: 210,
    stationY: 330,
  },
  north: {
    // North: Sungei Buloh, Kranji, Woodlands, Sembawang, Yishun, Seletar
    path: `M 280,230 L 320,240 L 350,260 L 370,250 L 410,210 L 460,180 L 510,165 L 560,175 L 590,200 L 580,235 L 540,255 L 480,265 L 420,270 L 370,300 L 350,260 Z`,
    labelX: 440,
    labelY: 220,
    stationX: 430,
    stationY: 200,
  },
  central: {
    // Central: Bukit Timah, Bishan, Ang Mo Kio, Toa Payoh, Novena, MacRitchie
    path: `M 370,300 L 420,270 L 480,265 L 540,255 L 560,285 L 540,335 L 500,365 L 450,385 L 390,385 L 350,350 Z`,
    labelX: 450,
    labelY: 320,
    stationX: 455,
    stationY: 335,
  },
  south: {
    // South: Queenstown, Telok Blangah, Marina Bay, Downtown Core, Tanjong Pagar
    path: `M 320,380 L 390,385 L 450,385 L 500,365 L 540,390 L 560,425 L 530,455 L 470,455 L 410,445 L 350,425 L 300,415 Z`,
    labelX: 450,
    labelY: 425,
    stationX: 475,
    stationY: 435,
  },
  east: {
    // East: Paya Lebar, Bedok, Tampines, Pasir Ris, Changi Airport
    path: `M 540,255 L 580,235 L 630,225 L 700,240 L 780,260 L 850,290 L 820,340 L 760,370 L 680,395 L 600,410 L 560,425 L 540,390 L 500,365 L 540,335 L 560,285 Z`,
    labelX: 680,
    labelY: 320,
    stationX: 700,
    stationY: 340,
  },
};

// Singapore Offshore Islands geometry
const ISLAND_PATHS = [
  // Sentosa
  { name: 'Sentosa', d: 'M 420,470 L 470,465 L 490,480 L 440,490 Z', region: 'south' },
  // Jurong Island
  { name: 'Jurong Island', d: 'M 190,455 L 260,445 L 285,475 L 230,495 L 180,480 Z', region: 'west' },
  // Pulau Tekong
  { name: 'Pulau Tekong', d: 'M 830,210 L 880,215 L 900,255 L 850,270 L 820,240 Z', region: 'east' },
  // Pulau Ubin
  { name: 'Pulau Ubin', d: 'M 710,195 L 770,190 L 780,215 L 720,220 Z', region: 'east' },
  // Semakau / Southern Islands
  { name: 'Semakau', d: 'M 360,515 L 395,505 L 410,525 L 370,535 Z', region: 'south' },
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  data,
  selectedRegion,
  onSelectRegion,
  activeMetric,
  onChangeMetric,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<RegionKey | null>(null);
  const [showWindOverlay, setShowWindOverlay] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute metric color for a region
  const getRegionFillColor = (regionKey: RegionKey): string => {
    const reading = data.readings[regionKey];
    if (!reading) return '#1e293b';

    if (activeMetric === 'psi') {
      const cat = getPsiCategory(reading.psi24Hourly);
      const band = PSI_BANDS[cat];
      return band.accentColor;
    } else {
      const pmBand = getPm25Band(reading.pm25OneHourly);
      return pmBand.color;
    }
  };

  // Animated Wind Vector Particles simulation on canvas
  useEffect(() => {
    if (!showWindOverlay) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = 1000;
    const height = 600;

    canvas.width = width;
    canvas.height = height;

    // Convert wind direction degrees to velocity vectors
    const angleRad = (data.windDirectionDegrees * Math.PI) / 180;
    // Meteorological degrees: angle from which wind is blowing; particles blow in opposite direction
    const vx = Math.sin(angleRad) * (data.windSpeedKmh * 0.12);
    const vy = -Math.cos(angleRad) * (data.windSpeedKmh * 0.12);

    const particleCount = 75;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 20,
      opacity: 0.2 + Math.random() * 0.5,
      speedMultiplier: 0.8 + Math.random() * 0.6,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += vx * p.speedMultiplier;
        p.y += vy * p.speedMultiplier;

        // Wrap around borders
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - vx * 4, p.y - vy * 4);
        ctx.strokeStyle = data.nationalPsi > 150 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arrow head or particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = data.nationalPsi > 150 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(125, 211, 252, 0.7)';
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [showWindOverlay, data.windDirectionDegrees, data.windSpeedKmh, data.nationalPsi]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const activeInspectRegion = hoveredRegion || (selectedRegion !== 'national' ? selectedRegion : null);
  const activeInspectReading = activeInspectRegion ? data.readings[activeInspectRegion] : null;

  return (
    <div className="relative w-full rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Top Map Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Singapore Air Quality Map
          </span>
          <span className="text-xs text-slate-500">·</span>
          <div className="flex items-center gap-1.5 p-0.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onChangeMetric('psi')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeMetric === 'psi'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              24-Hr PSI
            </button>
            <button
              onClick={() => onChangeMetric('pm25')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeMetric === 'pm25'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1-Hr PM2.5
            </button>
          </div>
        </div>

        {/* Layer Toggles & Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWindOverlay(!showWindOverlay)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showWindOverlay
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle wind particles and haze drift vector"
          >
            <Wind className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wind Stream</span>
          </button>

          <button
            onClick={() => setShowStations(!showStations)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showStations
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle NEA monitoring stations"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stations</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
            className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
            className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas Container */}
      <div
        className="relative w-full h-[440px] md:h-[500px] cursor-grab active:cursor-grabbing select-none overflow-hidden bg-radial from-slate-900 to-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Subtle coordinate grid lines for aerospace precision */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #64748b 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Wind Particle Canvas Overlay */}
        {showWindOverlay && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: '50% 50%',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          />
        )}

        {/* SVG Map of Singapore */}
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Water and background glows */}
            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="waterGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* Surrounding Coast / Johor Strait water indicators */}
          <text x="380" y="80" fill="#334155" fontSize="11" fontFamily="JetBrains Mono" letterSpacing="3">
            JOHOR STRAIT (MALAYSIA)
          </text>
          <text x="390" y="565" fill="#334155" fontSize="11" fontFamily="JetBrains Mono" letterSpacing="3">
            SINGAPORE STRAIT
          </text>

          {/* Offshore Islands */}
          <g className="offshore-islands">
            {ISLAND_PATHS.map((isl) => {
              const regKey = isl.region as RegionKey;
              const isSelected = selectedRegion === regKey;
              const isHovered = hoveredRegion === regKey;
              const fillColor = getRegionFillColor(regKey);

              return (
                <path
                  key={isl.name}
                  d={isl.d}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.22}
                  stroke={isSelected ? '#38bdf8' : fillColor}
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all duration-200 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRegion(regKey);
                  }}
                  onMouseEnter={() => setHoveredRegion(regKey)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              );
            })}
          </g>

          {/* 5 Main NEA Regions */}
          {(['west', 'north', 'central', 'south', 'east'] as const).map((regionKey) => {
            const config = REGION_PATHS[regionKey];
            const reading = data.readings[regionKey];
            const isSelected = selectedRegion === regionKey;
            const isHovered = hoveredRegion === regionKey;
            const fillColor = getRegionFillColor(regionKey);
            const value = activeMetric === 'psi' ? reading.psi24Hourly : reading.pm25OneHourly;
            const unit = activeMetric === 'psi' ? '' : ' µg/m³';

            return (
              <g
                key={regionKey}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRegion(regionKey);
                }}
                onMouseEnter={() => setHoveredRegion(regionKey)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                {/* Region boundary polygon */}
                <path
                  d={config.path}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.5 : isHovered ? 0.38 : 0.22}
                  stroke={isSelected ? '#38bdf8' : isHovered ? '#7dd3fc' : fillColor}
                  strokeWidth={isSelected ? 3 : isHovered ? 2.2 : 1.5}
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                />

                {/* Region Centroid Badge & Metric */}
                <g transform={`translate(${config.labelX}, ${config.labelY})`}>
                  <rect
                    x="-60"
                    y="-22"
                    width="120"
                    height="44"
                    rx="8"
                    fill="#090d16"
                    fillOpacity="0.88"
                    stroke={isSelected ? '#38bdf8' : isHovered ? '#7dd3fc' : '#334155'}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />

                  {/* Region Name */}
                  <text
                    x="0"
                    y="-5"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="Plus Jakarta Sans"
                  >
                    {regionKey.toUpperCase()}
                  </text>

                  {/* Main Metric Value */}
                  <text
                    x="0"
                    y="14"
                    textAnchor="middle"
                    fill={fillColor}
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                    className="tabular-nums"
                  >
                    {activeMetric === 'psi' ? `PSI ${value}` : `${value}${unit}`}
                  </text>
                </g>

                {/* Station Pin */}
                {showStations && (
                  <g
                    transform={`translate(${config.stationX}, ${config.stationY})`}
                    className="pointer-events-none"
                  >
                    {/* Radar pulse for active/hazardous readings */}
                    {reading.psi24Hourly > 100 && (
                      <circle
                        r="16"
                        fill="none"
                        stroke={fillColor}
                        strokeWidth="1.2"
                        opacity="0.4"
                        className="animate-ping"
                      />
                    )}
                    <circle r="6" fill="#090d16" stroke={fillColor} strokeWidth="2.5" />
                    <circle r="2.5" fill={fillColor} />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Live Hover/Selected Floating Telemetry Card in top-left */}
        {activeInspectReading && (
          <div className="absolute top-4 left-4 z-20 w-72 rounded-xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  {activeInspectReading.name}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {activeInspectReading.stationName}
                </div>
              </div>
              <button
                onClick={() => onSelectRegion('national')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline"
              >
                Reset to All SG
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2.5">
              <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase">24-Hr PSI</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className="text-2xl font-bold font-mono tabular-nums"
                    style={{ color: getRegionFillColor(activeInspectReading.region) }}
                  >
                    {activeInspectReading.psi24Hourly}
                  </span>
                  <span className="text-[11px] uppercase font-semibold text-slate-400">
                    {getPsiCategory(activeInspectReading.psi24Hourly)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase">1-Hr PM2.5</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                    {activeInspectReading.pm25OneHourly}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">µg/m³</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-400">PM10 (24-hr):</span>
                <span>{activeInspectReading.pm10TwentyFourHourly} µg/m³</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-400">O3 Ozone (8-hr):</span>
                <span>{activeInspectReading.o3EightHourMax} µg/m³</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-400">SO2 (24-hr):</span>
                <span>{activeInspectReading.so2TwentyFourHourly} µg/m³</span>
              </div>
            </div>

            {activeInspectReading.psi24Hourly > 100 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Elevated threshold in effect</span>
              </div>
            )}
          </div>
        )}

        {/* Map Legend Overlay in bottom-right */}
        <div className="absolute bottom-4 right-4 z-20 rounded-xl border border-slate-800 bg-slate-950/85 p-3 text-xs backdrop-blur-md">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {activeMetric === 'psi' ? 'PSI Scale (NEA Singapore)' : '1-Hr PM2.5 Scale (µg/m³)'}
          </div>
          {activeMetric === 'psi' ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-300 text-[11px]">0-50</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                <span className="text-slate-300 text-[11px]">51-100</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-300 text-[11px]">101-200</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                <span className="text-slate-300 text-[11px]">201-300</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-slate-300 text-[11px]">&gt;300</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-300 text-[11px]">Normal (0-55)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-300 text-[11px]">Elevated (56-150)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                <span className="text-slate-300 text-[11px]">High (151-250)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-slate-300 text-[11px]">V.High (&gt;250)</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Wind Vector Readout in bottom-left */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-400 font-mono backdrop-blur-md">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <span>Surface Wind: {data.windDirectionText} @ {data.windSpeedKmh} km/h</span>
        </div>
      </div>
    </div>
  );
};
