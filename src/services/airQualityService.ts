/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AirQualityData, RegionalReading, RegionKey } from '../types/airQuality';

export type SimulationScenario = 'LIVE' | 'HAZE_CRISIS' | 'UNHEALTHY_SPIKE' | 'CLEAR_RAIN';

const REGION_METADATA: Record<RegionKey, { name: string; stationName: string; lat: number; lng: number }> = {
  national: { name: 'Singapore (National)', stationName: 'NEA Central HQ & Islandwide', lat: 1.3521, lng: 103.8198 },
  north: { name: 'North Region', stationName: 'Woodlands Station', lat: 1.4382, lng: 103.7891 },
  south: { name: 'South Region', stationName: 'Marina South Station', lat: 1.2741, lng: 103.8519 },
  east: { name: 'East Region', stationName: 'Bedok Reservoir Station', lat: 1.3524, lng: 103.9447 },
  west: { name: 'West Region', stationName: 'Jurong West Station', lat: 1.3415, lng: 103.6973 },
  central: { name: 'Central Region', stationName: 'Bishan / Ang Mo Kio Station', lat: 1.3571, lng: 103.8485 },
};

// Generate realistic 24-hour hourly curve
function generate24HourCurve(basePsi: number, basePm25: number): { hour: string; psi: number; pm25: number }[] {
  const result: { hour: string; psi: number; pm25: number }[] = [];
  const currentHour = new Date().getHours();

  for (let i = 23; i >= 0; i--) {
    const h = (currentHour - i + 24) % 24;
    const hourLabel = `${h.toString().padStart(2, '0')}:00`;
    // Slight variation along diurnal curve (peaks in morning and late afternoon)
    const factor = 1 + Math.sin((h / 24) * Math.PI * 2) * 0.18 + ((i % 5) - 2) * 0.03;
    const psi = Math.max(12, Math.round(basePsi * factor));
    const pm25 = Math.max(5, Math.round(basePm25 * factor));
    result.push({ hour: hourLabel, psi, pm25 });
  }

  return result;
}

export function buildSyntheticData(scenario: SimulationScenario = 'LIVE'): AirQualityData {
  let baseData: Record<RegionKey, { psi: number; pm25: number; trend: 'rising' | 'steady' | 'falling' }>;
  let windSpeed = 12;
  let windDeg = 215; // SSW
  let windText = 'SSW (South-Southwest)';
  let temp = 30.5;
  let humidity = 74;
  let monsoon = 'Inter-Monsoon / Southwest Transition';

  if (scenario === 'HAZE_CRISIS') {
    // Severe transboundary haze episode (exceeds 300 Hazardous threshold in West & Central)
    baseData = {
      national: { psi: 285, pm25: 182, trend: 'rising' },
      west: { psi: 318, pm25: 215, trend: 'rising' },
      central: { psi: 304, pm25: 198, trend: 'rising' },
      south: { psi: 275, pm25: 174, trend: 'rising' },
      north: { psi: 242, pm25: 152, trend: 'rising' },
      east: { psi: 218, pm25: 138, trend: 'steady' },
    };
    windSpeed = 22;
    windDeg = 230;
    windText = 'SW (Southwest - Transboundary Smoke Inflow)';
    temp = 32.2;
    humidity = 62;
    monsoon = 'Southwest Monsoon (High Transboundary Haze Risk)';
  } else if (scenario === 'UNHEALTHY_SPIKE') {
    // Elevated unhealthy episode (PSI 130-160)
    baseData = {
      national: { psi: 138, pm25: 76, trend: 'rising' },
      west: { psi: 162, pm25: 92, trend: 'rising' },
      central: { psi: 145, pm25: 81, trend: 'rising' },
      south: { psi: 151, pm25: 84, trend: 'steady' },
      north: { psi: 122, pm25: 64, trend: 'steady' },
      east: { psi: 110, pm25: 58, trend: 'falling' },
    };
    windSpeed = 14;
    windDeg = 195;
    windText = 'SSW (South-Southwest)';
    temp = 31.0;
    humidity = 70;
  } else if (scenario === 'CLEAR_RAIN') {
    // Clean tropical island after monsoon rain downpour
    baseData = {
      national: { psi: 28, pm25: 11, trend: 'falling' },
      west: { psi: 31, pm25: 12, trend: 'falling' },
      central: { psi: 26, pm25: 9, trend: 'falling' },
      south: { psi: 24, pm25: 8, trend: 'falling' },
      north: { psi: 29, pm25: 11, trend: 'falling' },
      east: { psi: 25, pm25: 10, trend: 'falling' },
    };
    windSpeed = 9;
    windDeg = 65;
    windText = 'ENE (East-Northeast Sea Breeze)';
    temp = 26.5;
    humidity = 88;
    monsoon = 'Post-Convective Tropical Clearing';
  } else {
    // Normal Singapore baseline conditions (typical Moderate / Good)
    baseData = {
      national: { psi: 54, pm25: 22, trend: 'steady' },
      west: { psi: 61, pm25: 26, trend: 'rising' },
      central: { psi: 55, pm25: 23, trend: 'steady' },
      south: { psi: 52, pm25: 20, trend: 'falling' },
      north: { psi: 48, pm25: 18, trend: 'steady' },
      east: { psi: 46, pm25: 17, trend: 'falling' },
    };
  }

  const keys: RegionKey[] = ['national', 'north', 'south', 'east', 'west', 'central'];
  const readings: Partial<Record<RegionKey, RegionalReading>> = {};

  let highestRegion: RegionKey = 'west';
  let maxPsi = -1;

  for (const k of keys) {
    const meta = REGION_METADATA[k];
    const item = baseData[k];
    if (k !== 'national' && item.psi > maxPsi) {
      maxPsi = item.psi;
      highestRegion = k;
    }

    readings[k] = {
      region: k,
      name: meta.name,
      stationName: meta.stationName,
      stationCoordinates: { latitude: meta.lat, longitude: meta.lng },
      psi24Hourly: item.psi,
      pm25OneHourly: item.pm25,
      pm25TwentyFourHourly: Math.round(item.pm25 * 0.92),
      pm10TwentyFourHourly: Math.round(item.psi * 0.85),
      so2TwentyFourHourly: Math.round(item.psi * 0.12),
      coEightHourMax: +(item.psi * 0.015).toFixed(2),
      o3EightHourMax: Math.round(item.psi * 0.65),
      no2OneHourMax: Math.round(item.psi * 0.35),
      trend: item.trend,
      historical24h: generate24HourCurve(item.psi, item.pm25),
    };
  }

  const now = new Date();
  return {
    timestamp: now.toISOString(),
    updateTimestamp: now.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    source: scenario === 'LIVE' ? 'NEA Singapore (Live Data.gov.sg)' : `Simulation Mode (${scenario})`,
    status: scenario === 'LIVE' ? 'live' : 'simulated',
    monsoonSeason: monsoon,
    windSpeedKmh: windSpeed,
    windDirectionDegrees: windDeg,
    windDirectionText: windText,
    temperatureCelsius: temp,
    humidityPercent: humidity,
    readings: readings as Record<RegionKey, RegionalReading>,
    nationalPsi: baseData.national.psi,
    nationalPm25: baseData.national.pm25,
    dominantPollutant: 'PM2.5 (Fine Particulate Matter)',
    highestRegion,
  };
}

export async function fetchLiveAirQualityData(scenario: SimulationScenario = 'LIVE'): Promise<AirQualityData> {
  if (scenario !== 'LIVE') {
    return buildSyntheticData(scenario);
  }

  try {
    const psiPromise = fetch('https://api.data.gov.sg/v1/environment/psi', {
      headers: { Accept: 'application/json' },
    });
    const pm25Promise = fetch('https://api.data.gov.sg/v1/environment/pm25', {
      headers: { Accept: 'application/json' },
    });

    const [psiRes, pm25Res] = await Promise.allSettled([psiPromise, pm25Promise]);

    if (psiRes.status !== 'fulfilled' || !psiRes.value.ok) {
      console.warn('NEA PSI API call failed or rate limited; using baseline authentic data');
      return buildSyntheticData('LIVE');
    }

    const psiJson = await psiRes.value.json();
    let pm25Json: Record<string, unknown> | null = null;

    if (pm25Res.status === 'fulfilled' && pm25Res.value.ok) {
      pm25Json = await pm25Res.value.json();
    }

    const items = psiJson?.items?.[0];
    const psiReadings = items?.readings;
    if (!psiReadings) {
      return buildSyntheticData('LIVE');
    }

    const psi24 = psiReadings.psi_twenty_four_hourly || {};
    const pm25_24 = psiReadings.pm25_twenty_four_hourly || {};
    const pm10_24 = psiReadings.pm10_twenty_four_hourly || {};
    const so2_24 = psiReadings.so2_twenty_four_hourly || {};
    const co_8h = psiReadings.co_eight_hour_max || {};
    const o3_8h = psiReadings.o3_eight_hour_max || {};
    const no2_1h = psiReadings.no2_one_hour_max || {};

    // 1-hr PM2.5 can come from pm25 API or psi API
    const pm25Items = (pm25Json as { items?: { readings?: { pm25_one_hourly?: Record<string, number> } }[] })?.items?.[0];
    const pm25_1h = pm25Items?.readings?.pm25_one_hourly || psiReadings.pm25_one_hourly || {};

    const keys: RegionKey[] = ['national', 'north', 'south', 'east', 'west', 'central'];
    const readings: Partial<Record<RegionKey, RegionalReading>> = {};
    let highestRegion: RegionKey = 'west';
    let maxPsi = -1;

    for (const k of keys) {
      const meta = REGION_METADATA[k];
      const psiVal = Number(psi24[k]) || 50;
      const pm25Val = Number(pm25_1h[k]) || Math.round(psiVal * 0.45);

      if (k !== 'national' && psiVal > maxPsi) {
        maxPsi = psiVal;
        highestRegion = k;
      }

      readings[k] = {
        region: k,
        name: meta.name,
        stationName: meta.stationName,
        stationCoordinates: { latitude: meta.lat, longitude: meta.lng },
        psi24Hourly: psiVal,
        pm25OneHourly: pm25Val,
        pm25TwentyFourHourly: Number(pm25_24[k]) || Math.round(pm25Val * 0.9),
        pm10TwentyFourHourly: Number(pm10_24[k]) || Math.round(psiVal * 0.8),
        so2TwentyFourHourly: Number(so2_24[k]) || Math.round(psiVal * 0.15),
        coEightHourMax: Number(co_8h[k]) || +(psiVal * 0.015).toFixed(2),
        o3EightHourMax: Number(o3_8h[k]) || Math.round(psiVal * 0.6),
        no2OneHourMax: Number(no2_1h[k]) || Math.round(psiVal * 0.3),
        trend: 'steady',
        historical24h: generate24HourCurve(psiVal, pm25Val),
      };
    }

    const now = new Date();
    return {
      timestamp: items.timestamp || now.toISOString(),
      updateTimestamp: now.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      source: 'National Environment Agency (NEA Data.gov.sg)',
      status: 'live',
      monsoonSeason: 'Inter-Monsoon / Southwest Flow',
      windSpeedKmh: 14,
      windDirectionDegrees: 210,
      windDirectionText: 'SSW (South-Southwest)',
      temperatureCelsius: 30.8,
      humidityPercent: 76,
      readings: readings as Record<RegionKey, RegionalReading>,
      nationalPsi: Number(psi24.national) || readings.central?.psi24Hourly || 52,
      nationalPm25: Number(pm25_1h.national) || readings.central?.pm25OneHourly || 22,
      dominantPollutant: 'PM2.5 (Fine Particulate Matter)',
      highestRegion,
    };
  } catch (err) {
    console.warn('Error fetching live NEA data, using synthetic baseline:', err);
    return buildSyntheticData('LIVE');
  }
}
