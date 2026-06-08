/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FileSpreadsheet, RefreshCw, Settings, Check, ExternalLink } from 'lucide-react';

interface SheetLog {
  timestamp: string;
  action: string;
  userLocation: string;
  kota?: string;
  address?: string;
  targetMux: string;
  distance: number;
  bearing: number;
  synchronized: boolean;
}

interface SheetsPanelProps {
  appScriptUrl: string;
  onUpdateUrl: (url: string) => void;
  logs: SheetLog[];
  onClearLogs: () => void;
  onManualSync: () => void;
}

export default function SheetsPanel({
  appScriptUrl,
  onUpdateUrl,
  logs,
  onManualSync,
}: SheetsPanelProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(appScriptUrl);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateUrl(tempUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-slate-200/80 shadow-lg flex flex-col h-full text-slate-800 min-h-[340px]">
      {/* Title & Spreadsheet Quick Link */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <h2 className="font-display font-extrabold text-sm tracking-wide uppercase text-slate-800">Riwayat Aksi (Action Logs)</h2>
            <p className="text-[9px] text-emerald-600 font-mono tracking-wider font-bold mt-0.5">Google Sheets Cloud Sync Aktif</p>
          </div>
        </div>
        
        {/* Toggle Settings Gear */}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            showConfig 
              ? 'bg-slate-100 border-slate-200 text-slate-950' 
              : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'
          }`}
          title="Atur URL Google Apps Script"
        >
          <Settings className={`w-4 h-4 ${showConfig ? 'rotate-45' : ''} transition-transform duration-300`} />
        </button>
      </div>

      {/* Collapsible Config Input */}
      {showConfig && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] animate-fadeIn transition-all">
          <div className="font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>⚙️ KONFIGURASI WEB APP URL:</span>
            <a 
              href="https://docs.google.com/spreadsheets/d/1jHxBbN5zacD9hBClTHTiimRk2cVCCxlYOXHg9OBFU9w/edit" 
              target="_blank" 
              referrerPolicy="no-referrer"
              className="text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              Buka Spreadsheet <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <p className="text-slate-500 mb-2 leading-relaxed">
            Agar data otomatis tercatat ke Spreadsheet Anda, tempel URL Web App dari menu <strong>Deploy &gt; New Deployment (Web App)</strong> di Apps Script Anda:
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-2.5 py-1.5 text-[10px] font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono font-bold transition-all cursor-pointer shadow-sm"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Logs Table Content */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        <div className="flex-1 overflow-y-auto max-h-[220px] pr-1.5 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 font-display border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-2 min-h-[160px]">
              <span className="text-2xl mt-1">📡</span>
              <span>Belum ada stasiun terpilih. Klik stasiun TV di samping untuk mencatat secara otomatis!</span>
            </div>
          ) : (
            <div className="border border-slate-200/60 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-[10px] text-left font-mono">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-bold">Waktu</th>
                    <th className="px-2 py-2 font-bold">Kota</th>
                    <th className="px-2 py-2 font-bold">Peta</th>
                    <th className="px-2 py-2 font-bold">Mux Target</th>
                    <th className="px-2 py-2 font-bold">Jarak</th>
                    <th className="px-2 py-2 font-bold">Sudut</th>
                    <th className="px-2 py-2 font-bold text-right pr-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 whitespace-nowrap text-slate-400 text-[9px]">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-2 py-2 text-indigo-600 truncate max-w-[130px]" title={log.address || log.kota || '-'}>
                        <div className="font-bold">{log.kota || '-'}</div>
                        {log.address && (
                          <div className="text-[8px] font-normal text-slate-400 truncate max-w-[120px]" title={log.address}>
                            {log.address}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {log.userLocation && log.userLocation !== '-' ? (
                          <a
                            href={log.userLocation.startsWith('http') ? log.userLocation : `http://maps.google.com/?q=${encodeURIComponent(log.userLocation)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-rose-600 hover:text-rose-800 font-bold hover:underline bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50 transition-colors"
                            title="Buka lokasi koordinat di Google Maps"
                          >
                            <span>📍 Peta</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 font-bold truncate max-w-[110px] text-slate-800" title={log.targetMux}>
                        {log.targetMux}
                      </td>
                      <td className="px-2 py-2 text-slate-600 whitespace-nowrap">
                        {typeof log.distance === 'number' ? `${log.distance.toFixed(1)} km` : log.distance}
                      </td>
                      <td className="px-2 py-2 text-emerald-600 font-bold">
                        {log.bearing}°
                      </td>
                      <td className="px-2 py-2 text-right pr-3 whitespace-nowrap">
                        <span className="text-emerald-700 font-bold text-[9px] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shadow-sm">
                          Sheet OK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Controls for History logs */}
        <div className="flex items-center justify-end mt-4 pt-3.5 border-t border-slate-100">
          <button
            onClick={onManualSync}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white hover:text-white rounded-lg text-[10px] font-mono font-bold transition-all border border-slate-950 shadow-sm cursor-pointer"
            title="Tarik data terbaru dari Google Sheets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
