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
    <div className="cyber-panel p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col h-full text-white min-h-[340px]">
      {/* Title & Spreadsheet Quick Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-display font-semibold text-sm tracking-wide uppercase">Riwayat Aksi (Action Logs)</h2>
            <p className="text-[9px] text-emerald-400/80 font-mono tracking-wider mt-0.5">Google Sheets Cloud Sync Aktif</p>
          </div>
        </div>
        <a
          href={spreadsheetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-sans font-bold text-[10px] rounded-lg transition-all"
        >
          <span>Buka Spreadsheet</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Logs Table Content */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        <div className="flex-1 overflow-y-auto max-h-[220px] pr-1.5 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-xs text-white/30 font-display border border-white/5 rounded-xl bg-white/2 flex flex-col items-center justify-center gap-2 min-h-[160px]">
              <span className="text-2xl mt-1">📡</span>
              <span>Belum ada lock MUX terekam. Sejajarkan sinyal dan tekan 'Kunci Sinyal'!</span>
            </div>
          ) : (
            <div className="border border-white/5 rounded-xl overflow-hidden bg-white/2">
              <table className="w-full text-[10px] text-left font-mono">
                <thead className="bg-[#0f172a] text-white/50 border-b border-white/5 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-bold">Waktu</th>
                    <th className="px-2 py-2 font-bold">Mux Target</th>
                    <th className="px-2 py-2 font-bold">Jarak</th>
                    <th className="px-2 py-2 font-bold">Sudut</th>
                    <th className="px-2 py-2 font-bold text-right pr-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-white/2">
                      <td className="px-3 py-2 whitespace-nowrap text-white/50 text-[9px]">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-2 py-2 font-semibold truncate max-w-[110px]" title={log.targetMux}>
                        {log.targetMux}
                      </td>
                      <td className="px-2 py-2 text-white/70 whitespace-nowrap">
                        {log.distance.toFixed(1)} km
                      </td>
                      <td className="px-2 py-2 text-emerald-300">
                        {log.bearing}°
                      </td>
                      <td className="px-2 py-2 text-right pr-3 whitespace-nowrap">
                        <span className="text-emerald-400 font-bold text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
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
          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5">
            <button
              onClick={onManualSync}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-[10px] font-mono transition-all border border-white/5"
              title="Periksa koneksi sync dengan Apps Script"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Koneksi Sync</span>
            </button>
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-mono transition-all border border-red-500/15"
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
