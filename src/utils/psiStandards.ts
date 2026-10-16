/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PsiCategory, Pm25Band, HealthAdvice } from '../types/airQuality';

export interface PsiBandInfo {
  category: PsiCategory;
  label: string;
  min: number;
  max: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  summary: string;
}

export const PSI_BANDS: Record<PsiCategory, PsiBandInfo> = {
  good: {
    category: 'good',
    label: 'Good',
    min: 0,
    max: 50,
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    accentColor: '#10b981',
    summary: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
  },
  moderate: {
    category: 'moderate',
    label: 'Moderate',
    min: 51,
    max: 100,
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    accentColor: '#0ea5e9',
    summary: 'Air quality is acceptable. Very few people hypersensitive to air pollutants may have slight symptoms.',
  },
  unhealthy: {
    category: 'unhealthy',
    label: 'Unhealthy',
    min: 101,
    max: 200,
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    accentColor: '#f59e0b',
    summary: 'Aggravation of symptoms in persons with heart or lung disease. General public may notice irritation.',
  },
  very_unhealthy: {
    category: 'very_unhealthy',
    label: 'Very Unhealthy',
    min: 201,
    max: 300,
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    accentColor: '#f97316',
    summary: 'Significant aggravation of symptoms; general public may experience reduced endurance in activities.',
  },
  hazardous: {
    category: 'hazardous',
    label: 'Hazardous',
    min: 301,
    max: 500,
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    accentColor: '#f43f5e',
    summary: 'Early onset of specific diseases and serious irritation symptoms. Everyone should stay indoors.',
  },
};

export function getPsiCategory(psi: number): PsiCategory {
  if (psi <= 50) return 'good';
  if (psi <= 100) return 'moderate';
  if (psi <= 200) return 'unhealthy';
  if (psi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

export function getPm25Band(pm25: number): {
  band: Pm25Band;
  label: string;
  description: string;
  textColor: string;
  color: string;
} {
  if (pm25 <= 55) {
    return {
      band: 'normal',
      label: 'Band I (Normal)',
      description: '0 – 55 µg/m³',
      textColor: 'text-emerald-400',
      color: '#10b981',
    };
  }
  if (pm25 <= 150) {
    return {
      band: 'elevated',
      label: 'Band II (Elevated)',
      description: '56 – 150 µg/m³',
      textColor: 'text-amber-400',
      color: '#f59e0b',
    };
  }
  if (pm25 <= 250) {
    return {
      band: 'high',
      label: 'Band III (High)',
      description: '151 – 250 µg/m³',
      textColor: 'text-orange-400',
      color: '#f97316',
    };
  }
  return {
    band: 'very_high',
    label: 'Band IV (Very High)',
    description: '> 250 µg/m³',
    textColor: 'text-rose-400',
    color: '#f43f5e',
  };
}

export function getHealthAdvisories(psi: number): HealthAdvice {
  if (psi <= 50) {
    return {
      healthy: 'Normal outdoor activities may be carried out normally without restriction.',
      vulnerable: 'Normal outdoor activities. Enjoy the clean air.',
      chronic: 'Normal outdoor activities. Ensure medications are on hand as usual.',
      n95Recommendation: 'N95 masks are not required for general outdoor or indoor activities.',
    };
  }
  if (psi <= 100) {
    return {
      healthy: 'Normal outdoor activities can proceed without restriction.',
      vulnerable: 'Normal outdoor activities. Hypersensitive individuals should monitor breathing comfort.',
      chronic: 'Normal outdoor activities. Continue taking regular medications.',
      n95Recommendation: 'N95 masks are not required.',
    };
  }
  if (psi <= 200) {
    return {
      healthy: 'Reduce prolonged or strenuous outdoor physical exertion.',
      vulnerable: 'Minimize prolonged or strenuous outdoor physical exertion. Stay in well-ventilated or air-conditioned rooms.',
      chronic: 'Avoid prolonged or strenuous outdoor physical exertion. Seek medical help if breathing discomfort worsens.',
      n95Recommendation: 'Healthy individuals do not need N95 masks for brief outdoor excursions. Vulnerable groups may consider N95 if outdoors for prolonged periods.',
    };
  }
  if (psi <= 300) {
    return {
      healthy: 'Avoid prolonged or strenuous outdoor physical exertion. Minimize non-essential outdoor trips.',
      vulnerable: 'Avoid all outdoor activities. Keep doors and windows closed. Run air cleaners with HEPA filters.',
      chronic: 'Stay indoors and keep activity levels low. Those with asthma or heart conditions must remain in air-conditioned environments.',
      n95Recommendation: 'Wear an N95 mask if you must go outdoors for extended periods. Note that N95 masks increase breathing resistance; vulnerable individuals should consult a doctor if experiencing discomfort.',
    };
  }
  // Hazardous > 300
  return {
    healthy: 'Avoid all outdoor physical activity. Stay indoors with windows and doors securely closed.',
    vulnerable: 'Strict indoor confinement. Avoid any outdoor exposure. Run HEPA air purifiers at high setting.',
    chronic: 'Strict indoor confinement. Seek emergency medical attention immediately if experiencing acute chest tightness, wheezing, or arrhythmia.',
    n95Recommendation: 'Mandatory N95 mask usage for any unavoidable outdoor movement. Change masks if damaged or soiled.',
  };
}
