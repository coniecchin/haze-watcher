/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';

const FORECAST_ENDPOINT = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast';

export interface AreaForecast {
  area: string;
  forecast: string;
  latitude?: number;
  longitude?: number;
}

export interface TwoHrForecastPayload {
  success: boolean;
  source: string;
  validPeriod: {
    start: string;
    end: string;
    text: string;
  };
  timestamp: string;
  updateTimestamp: string;
  summary: {
    dominantCondition: string;
    rainDetected: boolean;
    rainAreas: string[];
    clearAreas: string[];
  };
  forecasts: AreaForecast[];
  areaMetadata: Array<{
    name: string;
    label_location: {
      latitude: number;
      longitude: number;
    };
  }>;
}

export default async function twoHrForecastHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

  try {
    const upstreamRes = await fetch(FORECAST_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SGAirPulse-Serverless/1.0',
      },
    });

    if (!upstreamRes.ok) {
      throw new Error(`data.gov.sg returned status ${upstreamRes.status}`);
    }

    const json = await upstreamRes.json();
    const data = json?.data;
    const item = data?.items?.[0];
    const areaMeta = data?.area_metadata || [];
    const forecasts: Array<{ area: string; forecast: string }> = item?.forecasts || [];

    // Build coord map
    const coordMap = new Map<string, { latitude: number; longitude: number }>();
    areaMeta.forEach((m: { name: string; label_location: { latitude: number; longitude: number } }) => {
      coordMap.set(m.name, m.label_location);
    });

    const enrichedForecasts: AreaForecast[] = forecasts.map((f) => {
      const loc = coordMap.get(f.area);
      return {
        area: f.area,
        forecast: f.forecast,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
      };
    });

    // Detect precipitation and dominant weather (impacts haze clearing / rain washout)
    const rainConditions = ['Rain', 'Showers', 'Thundery Showers', 'Light Rain', 'Moderate Rain', 'Heavy Rain'];
    const rainAreas: string[] = [];
    const clearAreas: string[] = [];
    const conditionCounts: Record<string, number> = {};

    enrichedForecasts.forEach((f) => {
      conditionCounts[f.forecast] = (conditionCounts[f.forecast] || 0) + 1;
      const isRain = rainConditions.some((rc) => f.forecast.toLowerCase().includes(rc.toLowerCase()));
      if (isRain) {
        rainAreas.push(f.area);
      } else {
        clearAreas.push(f.area);
      }
    });

    // Determine dominant condition
    let dominant = 'Cloudy';
    let maxCount = 0;
    for (const [cond, count] of Object.entries(conditionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = cond;
      }
    }

    const payload: TwoHrForecastPayload = {
      success: true,
      source: 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
      validPeriod: item?.valid_period || {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        text: 'Next 2 Hours',
      },
      timestamp: item?.timestamp || new Date().toISOString(),
      updateTimestamp: item?.update_timestamp || new Date().toISOString(),
      summary: {
        dominantCondition: dominant,
        rainDetected: rainAreas.length > 0,
        rainAreas,
        clearAreas,
      },
      forecasts: enrichedForecasts,
      areaMetadata: areaMeta,
    };

    return res.status(200).json(payload);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown upstream error';
    return res.status(502).json({
      success: false,
      error: 'Failed to retrieve live 2-hour forecast from data.gov.sg',
      details: errorMsg,
      timestamp: new Date().toISOString(),
    });
  }
}
