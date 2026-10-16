/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertRule, AlertLogItem, AirQualityData, RegionKey } from '../types/airQuality';
import { getPsiCategory } from '../utils/psiStandards';

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private soundMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on user interaction to abide by browser autoplay policies
  }

  public setSoundMuted(muted: boolean) {
    this.soundMuted = muted;
  }

  public isSoundMuted(): boolean {
    return this.soundMuted;
  }

  public getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  private initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playAlertSound(isHazardous: boolean = false) {
    if (this.soundMuted) return;

    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (isHazardous) {
        // High urgency triple pulsing alert for Hazardous thresholds
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6
        osc.frequency.setValueAtTime(880, now + 0.24);
        osc.frequency.setValueAtTime(1396.91, now + 0.36); // F6

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.36);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.7);
      } else {
        // Crisp dual-tone chime for elevated/unhealthy alerts
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.15); // B5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {
      // Audio autoplay policy or device without audio
    }
  }

  public showBrowserNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      data?: unknown;
    }
  ): boolean {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: options.body,
          tag: options.tag || 'sg-airpulse-alert',
          lang: 'en',
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public evaluateRules(
    rules: AlertRule[],
    data: AirQualityData,
    lastAlertTimestamps: Record<string, number> = {}
  ): { breachedItems: AlertLogItem[]; updatedTimestamps: Record<string, number> } {
    const breachedItems: AlertLogItem[] = [];
    const updatedTimestamps = { ...lastAlertTimestamps };
    const now = Date.now();
    const COOLDOWN_MS = 60 * 1000; // 1-minute alert cooldown to avoid repeated spam

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const targetRegions: RegionKey[] =
        rule.region === 'all'
          ? (['national', 'north', 'south', 'east', 'west', 'central'] as RegionKey[])
          : [rule.region];

      for (const regKey of targetRegions) {
        const reading = data.readings[regKey];
        if (!reading) continue;

        const val = rule.metric === 'psi' ? reading.psi24Hourly : reading.pm25OneHourly;
        const isBreached = val >= rule.threshold;

        if (isBreached) {
          const ruleKey = `${rule.id}_${regKey}`;
          const lastFired = updatedTimestamps[ruleKey] || 0;

          if (now - lastFired > COOLDOWN_MS) {
            updatedTimestamps[ruleKey] = now;
            const category = getPsiCategory(rule.metric === 'psi' ? val : Math.round(val * 1.5));
            const regionName = reading.name;
            const metricLabel = rule.metric === 'psi' ? '24-hr PSI' : '1-hr PM2.5';
            const unit = rule.metric === 'psi' ? '' : ' µg/m³';

            const message = `${regionName} exceeded threshold: ${metricLabel} reached ${val}${unit} (Alert trigger: ≥ ${rule.threshold}${unit})`;

            const item: AlertLogItem = {
              id: `alert-${now}-${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toLocaleTimeString('en-SG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              region: regKey,
              metric: rule.metric,
              value: val,
              threshold: rule.threshold,
              category,
              message,
              acknowledged: false,
            };

            breachedItems.push(item);

            // Execute notifications
            if (rule.soundEnabled) {
              this.playAlertSound(val >= 300 || category === 'hazardous');
            }

            if (rule.browserNotification && Notification.permission === 'granted') {
              this.showBrowserNotification(`Air Quality Alert: ${regionName}`, {
                body: message,
                tag: `airpulse-${regKey}`,
              });
            }
          }
        }
      }
    }

    return { breachedItems, updatedTimestamps };
  }
}

export const notificationService = new NotificationService();
