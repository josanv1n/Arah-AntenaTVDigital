/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileSpreadsheet, RefreshCw, Trash2, ExternalLink } from 'lucide-react';

interface SheetLog {
  timestamp: string;
  action: string;
  userLocation: string;
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
  onClearLogs,
  onManualSync,
}: SheetsPanelProps) {
  const spreadsheetId = '1jHxBbN5zacD9hBClTHTiimRk2cVCCxlYOXHg9OBFU9w';
  const spreadsheetLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-slate-200/80 shadow-lg flex flex-col h-full text-slate-800 min-h-[340px]">
      {/* Title & Spreadsheet Quick Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <h2 className="font-display font-extrabold text-sm tracking-wide uppercase text-slate-800">Riwayat Aksi (Action Logs)</h2>
            <p className="text-[9px] text-emerald-600 font-mono tracking-wider font-bold mt-0.5">Google Sheets Cloud Sync Aktif</p>
          </div>
        </div>
      </div>

      {/* Logs Table Content */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        <div className="flex-1 overflow-y-auto max-h-[220px] pr-1.5 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 font-display border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-2 min-h-[160px]">
              <span className="text-2xl mt-1">📡</span>
              <span>Belum ada lock MUX terekam. Sejajarkan sinyal dan tekan 'Kunci Sinyal'!</span>
            </div>
          ) : (
            <div className="border border-slate-200/60 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-[10px] text-left font-mono">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-bold">Waktu</th>
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
                      <td className="px-2 py-2 font-bold truncate max-w-[110px] text-slate-800" title={log.targetMux}>
                        {log.targetMux}
                      </td>
                      <td className="px-2 py-2 text-slate-600 whitespace-nowrap">
                        {log.distance.toFixed(1)} km
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
        {logs.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100">
            <button
              onClick={onManualSync}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 rounded-lg text-[10px] font-mono font-bold transition-all border border-slate-200"
              title="Periksa koneksi sync dengan Apps Script"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Koneksi Sync</span>
            </button>
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg text-[10px] font-mono font-bold transition-all border border-red-200"
            >
              <Trash2 className="w-3 h-3" />
              <span>Kosongkan Log</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
