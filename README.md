# SG AirPulse · Singapore Live PSI & Hazardous Air Quality Alert System

Real-time Singapore PSI & $\text{PM}_{2.5}$ air quality tracking application built for Singapore residents and commuters. Tracks live NEA monitoring station feeds across all 5 official regions (North, South, East, West, Central), visualizes wind dispersion and smoke plumes on an interactive vector map, and delivers instant browser push alerts and audio sirens when air quality breaches hazardous thresholds.

![SG AirPulse Preview](https://img.shields.io/badge/Air%20Quality-Live%20PSI%20%26%20PM2.5-06b6d4?style=for-the-badge)
![Singapore NEA](https://img.shields.io/badge/Data%20Source-Data.gov.sg%20NEA-10b981?style=for-the-badge)
![Push Notifications](https://img.shields.io/badge/Alerts-Web%20Push%20%2B%20Audio-f43f5e?style=for-the-badge)

---

## 🌟 Key Features

### 1. Live NEA Singapore Air Quality Telemetry
- **Official Open Data**: Fetches continuous 24-hour rolling averages and 1-hour $\text{PM}_{2.5}$ concentrations directly from Singapore's open data API (`api.data.gov.sg/v1/environment/psi` and `/pm25`).
- **5 Geographic Regions**: Real-time readings across **North** (Woodlands), **South** (Marina South), **East** (Bedok Reservoir), **West** (Jurong West), and **Central** (Bishan / Ang Mo Kio), plus the National Islandwide average.
- **Multi-Pollutant Matrix**: Tracks fine particulate matter ($\text{PM}_{2.5}$), coarse dust ($\text{PM}_{10}$), ground-level ozone ($\text{O}_3$), nitrogen dioxide ($\text{NO}_2$), sulphur dioxide ($\text{SO}_2$), and carbon monoxide ($\text{CO}$) against Singapore environmental limits.
- **24-Hour Trajectory Line Chart**: Interactive SVG graph showing hourly trends with official NEA threshold reference lines (Good 50, Unhealthy 100, Very Unhealthy 200, Hazardous 300).

### 2. Interactive Singapore Air Quality Map
- **Accurate Coastline & Island Geometry**: Precision SVG contours for Pulau Ujong (Main Island), Tuas Industrial basin, Woodlands border, Sentosa, Jurong Island, Pulau Tekong, and Pulau Ubin.
- **Animated Wind Stream Canvas**: Live particle vectors simulating surface wind direction and velocity (e.g. Southwest Monsoon haze transport vs. Northeast sea breeze).
- **Layer & Metric Toggles**: Switch between 24-hr PSI choropleth, 1-hr $\text{PM}_{2.5}$ concentrations, monitoring stations, and wind dispersion streams.
- **Click-to-Focus Drilldown**: Click any region to sync the telemetry console, view 24-hr historical curves, and inspect sub-pollutant gauges.

### 3. Hazardous Alert System & Web Push Notifications
- **Web Push API**: Browser push notifications dispatching alerts when air quality enters Unhealthy, Very Unhealthy, or Hazardous levels.
- **Synthesized Audio Warning Sirens**: Zero-dependency Web Audio API oscillator delivering dual-tone chimes and triple-pulse emergency sirens for hazardous thresholds.
- **Custom Alert Rules Builder**: Configurable triggers with region selectors, metric toggles ($\text{PSI}$ or $\text{PM}_{2.5}$), threshold sliders, sound toggles, and push toggles.
- **Haze Emergency Simulation Lab**: Instant preset triggers (*PSI 318 Hazardous Crisis*, *Unhealthy Smoke Plume*, *Tropical Rain Clearing*, *Official Live Feed*) to verify alert sirens and push delivery on demand.
- **Audit Log**: Timestamped breach events with acknowledgment controls, JSON export, and clear log features.

### 4. Official MOH & NEA Health Advisories
- **3 Demographic Tiers**: Health guidance calibrated to the current peak reading for:
  1. Healthy individuals
  2. Elderly, pregnant women, and children
  3. Individuals with chronic lung or heart disease
- **N95 Respirator Guidance**: Proper airtight seal instructions, when masks are necessary, and medical caveats.

### 5. Serverless Backend Ready
- Includes an in-app **Serverless Backend Bridge** drawer detailing cron scheduling (e.g., AWS Lambda, Cloud Run, Cloudflare Workers), Web Push VAPID key setup, and webhook JSON schemas for background push notifications.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Data Source**: Singapore National Environment Agency (data.gov.sg)
- **Audio**: Web Audio API (Synthesized oscillators)
- **Notifications**: Web Notifications API

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/coniecchin/haze-watcher.git
cd haze-watcher

# Install dependencies
npm install

# Run the local development server
npm run dev
```

Visit `http://localhost:3000` (or the port specified by Vite) in your browser.

### Building for Production

```bash
npm run build
```

---

## 📄 License

Apache-2.0
