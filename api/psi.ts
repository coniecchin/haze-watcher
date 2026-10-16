/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';

const PSI_V2_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';
const PSI_V1_FALLBACK_URL = 'https://api.data.gov.sg/v1/environment/psi';

export default async function psiHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  try {
    // Attempt v2 real-time endpoint first
    const response = await fetch(PSI_V2_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SGAirPulse-Serverless/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        success: true,
        source: 'api-open.data.gov.sg/v2',
        data: data.data || data,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Fallback to v1 endpoint if v2 has transient issues
    const fallbackRes = await fetch(PSI_V1_FALLBACK_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SGAirPulse-Serverless/1.0',
      },
    });

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      return res.status(200).json({
        success: true,
        source: 'api.data.gov.sg/v1',
        data: fallbackData,
        fetchedAt: new Date().toISOString(),
      });
    }

    throw new Error(`Upstream returned ${response.status}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown upstream error';
    return res.status(502).json({
      success: false,
      error: 'Failed to retrieve live PSI data from data.gov.sg',
      details: errorMsg,
      timestamp: new Date().toISOString(),
    });
  }
}
