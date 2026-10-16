/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  endpoints: {
    twoHrForecast: string;
    psi: string;
  };
  upstream: {
    dataGovSg: 'reachable' | 'unreachable' | 'unknown';
  };
}

export default async function healthHandler(req: Request, res: Response) {
  let dataGovSgStatus: 'reachable' | 'unreachable' | 'unknown' = 'unknown';

  try {
    const probe = await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast', {
      method: 'HEAD',
      headers: { 'User-Agent': 'SGAirPulse-HealthCheck/1.0' },
    });
    dataGovSgStatus = probe.ok ? 'reachable' : 'unreachable';
  } catch {
    dataGovSgStatus = 'unreachable';
  }

  const payload: HealthCheckResponse = {
    status: dataGovSgStatus === 'reachable' ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      twoHrForecast: '/api/two-hr-forecast',
      psi: '/api/psi',
    },
    upstream: {
      dataGovSg: dataGovSgStatus,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(payload.status === 'healthy' ? 200 : 503).json(payload);
}
