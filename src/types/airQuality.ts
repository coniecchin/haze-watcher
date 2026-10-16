/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RegionKey = 'national' | 'north' | 'south' | 'east' | 'west' | 'central';

export type PsiCategory = 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export type Pm25Band = 'normal' | 'elevated' | 'high' | 'very_high';

export interface RegionalReading {
  region: RegionKey;
  name: string;
  stationName: string;
  stationCoordinates: {
    latitude: number;
    longitude: number;
  };
  psi24Hourly: number;
  pm25OneHourly: number;
  pm25TwentyFourHourly: number;
  pm10TwentyFourHourly: number;
  so2TwentyFourHourly: number;
  coEightHourMax: number;
  o3EightHourMax: number;
  no2OneHourMax: number;
  trend: 'rising' | 'steady' | 'falling';
  historical24h: { hour: string; psi: number; pm25: number }[];
}

export interface TwoHrWeatherForecast {
  validPeriod: {
    start: string;
    end: string;
    text: string;
  };
  dominantCondition: string;
  rainDetected: boolean;
  rainAreas: string[];
  clearAreas: string[];
  forecasts: Array<{
    area: string;
    forecast: string;
  }>;
}

export interface AirQualityData {
  timestamp: string; // ISO string
  updateTimestamp: string; // formatted
  source: string;
  status: 'live' | 'simulated';
  monsoonSeason: string;
  windSpeedKmh: number;
  windDirectionDegrees: number; // 0-360
  windDirectionText: string;
  temperatureCelsius: number;
  humidityPercent: number;
  readings: Record<RegionKey, RegionalReading>;
  nationalPsi: number;
  nationalPm25: number;
  dominantPollutant: string;
  highestRegion: RegionKey;
  twoHrForecast?: TwoHrWeatherForecast;
}

export interface AlertRule {
  id: string;
  name: string;
  region: 'all' | RegionKey;
  metric: 'psi' | 'pm25';
  threshold: number;
  enabled: boolean;
  soundEnabled: boolean;
  browserNotification: boolean;
  createdAt: string;
}

export interface AlertLogItem {
  id: string;
  timestamp: string;
  region: RegionKey | 'all';
  metric: 'psi' | 'pm25';
  value: number;
  threshold: number;
  category: PsiCategory;
  message: string;
  acknowledged: boolean;
}

export interface HealthAdvice {
  healthy: string;
  vulnerable: string; // elderly, pregnant, children
  chronic: string; // heart/lung conditions
  n95Recommendation: string;
}
