'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { ClayButton } from '../ui/ClayButton';
import { Bell, Database, Download, Trash2, CheckCircle2, HardDrive, ShieldAlert, Send } from 'lucide-react';

export function NotificationStorageSettings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserPush, setBrowserPush] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [anomalyWarnings, setAnomalyWarnings] = useState(true);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const historyData = localStorage.getItem('satquery_history_db');
    if (historyData) {
      try {
        const parsed = JSON.parse(historyData);
        setHistoryCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch (e) {
        console.error(e);
      }
    }

    const savedConfig = localStorage.getItem('satquery_alert_settings');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (typeof parsed.emailAlerts === 'boolean') setEmailAlerts(parsed.emailAlerts);
        if (typeof parsed.browserPush === 'boolean') setBrowserPush(parsed.browserPush);
        if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl);
        if (typeof parsed.anomalyWarnings === 'boolean') setAnomalyWarnings(parsed.anomalyWarnings);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = () => {
    const config = {
      emailAlerts,
      browserPush,
      webhookUrl,
      anomalyWarnings
    };
    localStorage.setItem('satquery_alert_settings', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear cached telemetry files and mission observation preview tiles?')) {
      sessionStorage.clear();
      setCleared(true);
      setTimeout(() => setCleared(false), 2500);
    }
  };

  const handleExportAll = () => {
    const historyData = localStorage.getItem('satquery_history_db') || '[]';
    const blob = new Blob([historyData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satquery_mission_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Alert & Webhook Notifications */}
      <GlassCard className="clay-card border-white/5 p-6 space-y-5 select-none text-left">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bell size={16} className="text-amber-400" />
              Mission Telemetry & Pipeline Webhooks
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Automated downstream alerts, incident webhooks, and critical anomaly dispatch.</p>
          </div>
          {saved && (
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} /> SAVED
            </span>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:bg-black/60 transition-colors">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Email Dispatch on Pipeline Completion</span>
              <span className="text-[11px] text-zinc-400 block">Deliver full synthesized intelligence summary to your operator email.</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded accent-teal-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:bg-black/60 transition-colors">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Browser Audio & Desktop Push Notifications</span>
              <span className="text-[11px] text-zinc-400 block">Audible chime when multi-modal neural fusion finishes processing.</span>
            </div>
            <input
              type="checkbox"
              checked={browserPush}
              onChange={(e) => setBrowserPush(e.target.checked)}
              className="h-4 w-4 rounded accent-teal-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:bg-black/60 transition-colors">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Critical Change & Anomaly Alarms</span>
              <span className="text-[11px] text-zinc-400 block">Prioritize urgent alerts if bi-temporal shift exceeds +25% delta.</span>
            </div>
            <input
              type="checkbox"
              checked={anomalyWarnings}
              onChange={(e) => setAnomalyWarnings(e.target.checked)}
              className="h-4 w-4 rounded accent-teal-500 cursor-pointer"
            />
          </label>

          {/* Webhook URL */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <label className="font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
              Automated Downstream Webhook (HTTP POST)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://your-gis-server.org/api/webhooks/earth-observation"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 rounded-xl bg-black/40 border border-white/10 p-2.5 text-zinc-100 placeholder:text-zinc-500 font-mono text-xs outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <ClayButton variant="orange" onClick={handleSave} className="px-5 py-2.5 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5">
            <Send size={14} />
            <span>Save Notification Rules</span>
          </ClayButton>
        </div>
      </GlassCard>

      {/* Storage & Local Data Management */}
      <GlassCard className="clay-card border-white/5 p-6 space-y-4 select-none text-left">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database size={16} className="text-emerald-400" />
              Ground Station Storage & History Cache
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Manage local IndexedDB storage, export mission logs, and purge temporary raster buffers.</p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-full text-zinc-300">
            {historyCount} Missions Logged
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-white block">Export Complete Mission Database</span>
            <p className="text-[11px] text-zinc-400">Download your full history records and neural traces as JSON archive.</p>
            <ClayButton variant="secondary" onClick={handleExportAll} className="px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 font-bold">
              <Download size={14} />
              <span>Export Archive (.json)</span>
            </ClayButton>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-white block">Purge Temporary Cache</span>
            <p className="text-[11px] text-zinc-400">Clear cached image rasters and reset temporary session state.</p>
            <button
              type="button"
              onClick={handleClearCache}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>{cleared ? 'Cache Purged!' : 'Clear Cache Buffer'}</span>
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
