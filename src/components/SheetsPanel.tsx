/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Copy, Check, FileSpreadsheet, Settings, HelpCircle, RefreshCw, Send } from 'lucide-react';
import { getGoogleAppsScriptTemplate } from '../data';

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
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'status' | 'code' | 'help'>('status');

  const spreadsheetId = '1jHxBbN5zacD9hBClTHTiimRk2cVCCxlYOXHg9OBFU9w';
  const spreadsheetLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const appsScriptCode = getGoogleAppsScriptTemplate(spreadsheetId);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  return (
    <div className="cyber-panel p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col h-full text-white">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-white" />
          <h2 className="font-display font-semibold text-sm tracking-wide uppercase">Google Sheets Sync Engine</h2>
        </div>
        <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
          {(['status', 'code', 'help'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-[10px] font-display font-medium uppercase transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white text-[#0a0f18] font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab === 'status' ? 'Status Logs' : tab === 'code' ? 'Code.gs' : 'Panduan'}
            </button>
          ))}
        </div>
      </div>

      {/* View Switcher Content */}
      <div className="flex-1 flex flex-col overflow-y-auto max-h-[360px] pr-1.5 custom-scrollbar">
        {/* TAB 1: STATUS LOGS */}
        {activeTab === 'status' && (
          <div className="space-y-3 flex flex-col h-full justify-between">
            <div>
              {/* Database Link Badge */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-xs font-display font-semibold text-white/90">Nama Spreadsheet</h4>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate max-w-xs">Script Properties (Sheet: History)</p>
                </div>
                <a
                  href={spreadsheetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-[#0a0f18] font-sans font-bold text-[10px] rounded-lg transition-all text-center self-start sm:self-center"
                >
                  Buka Spreadsheet ↗️
                </a>
              </div>

              {/* URL Set Input */}
              <div className="space-y-1.5 mb-4">
                <label className="text-[10px] font-mono tracking-wider text-white/50 block">APPS SCRIPT WEB APP URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={appScriptUrl}
                    onChange={(e) => onUpdateUrl(e.target.value)}
                    className="flex-1 bg-[#0a0f18]/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all font-mono"
                  />
                  <button 
                    onClick={onManualSync}
                    className="p-1 px-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all text-white/80"
                    title="Cek Sinkronisasi"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9px] text-white/40 font-sans italic mt-1">
                  {appScriptUrl ? '✅ Terkoneksi dengan Web App Apps Script' : '⚠️ Modus Simulasi. Kaitkan Google Apps Web URL untuk menyimpan live ke Google Sheets Anda.'}
                </p>
              </div>

              {/* Logs Table */}
              <h3 className="text-[10px] tracking-wider text-white/50 font-mono uppercase mb-2">Riwayat Aksi (Action Logs)</h3>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/30 font-display border border-white/5 rounded-xl bg-white/2">
                  Belum ada antenna lock terekam. Sejajarkan sinyal dan tekan 'Kunci Sinyal'!
                </div>
              ) : (
                <div className="border border-white/5 rounded-xl overflow-hidden bg-white/2">
                  <div className="max-h-[140px] overflow-y-auto">
                    <table className="w-full text-[10px] text-left font-mono">
                      <thead className="bg-[#0f172a] text-white/50 border-b border-white/5">
                        <tr>
                          <th className="px-3 py-1.5 font-bold">Waktu</th>
                          <th className="px-2 py-1.5 font-bold">Mux Target</th>
                          <th className="px-2 py-1.5 font-bold">Jarak</th>
                          <th className="px-2 py-1.5 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {logs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-white/2">
                            <td className="px-3 py-1.5 whitespace-nowrap text-white/50 text-[9px]">
                              {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-2 py-1.5 font-semibold truncate max-w-[90px]">{log.targetMux}</td>
                            <td className="px-2 py-1.5 text-white/70">{log.distance.toFixed(1)} km</td>
                            <td className="px-2 py-1.5">
                              {log.synchronized ? (
                                <span className="text-emerald-400 font-bold text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-400/20">Sheet</span>
                              ) : (
                                <span className="text-orange-300 font-bold text-[9px] bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-400/20">Lokal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            {logs.length > 0 && (
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={onClearLogs}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded text-[10px] font-mono transition-all uppercase"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COPY CODE.GS */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span className="text-[10px] font-mono text-white/60">FILE: Code.gs (Google Apps Script)</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-[10px] font-sans font-bold bg-white text-[#0a0f18] px-2.5 py-1 rounded hover:bg-gray-100 transition-all select-none"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-[#05070c] border border-white/5 rounded-xl p-3 max-h-[220px] overflow-auto select-all">
              <pre className="text-[10px] font-mono text-white/70 leading-relaxed whitespace-pre font-medium p-0">
                {appsScriptCode}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: HELP GUIDE */}
        {activeTab === 'help' && (
          <div className="space-y-3 font-display text-xs text-white/80 leading-relaxed">
            <div className="border-l-2 border-white/30 pl-3 space-y-1 py-1 bg-white/2 rounded-r-lg">
              <h4 className="font-bold text-white mb-1 uppercase font-mono text-[10px] text-glow">
                ⚙️ Langkah 1: Atur Script Properties
              </h4>
              <p>1. Buka spreadsheet Anda melalui tombol di tab status.</p>
              <p>2. Pergi ke tab menu <b>Extensions</b> &gt; <b>Apps Script</b>.</p>
              <p>3. Di samping kiri editor, klik lambang <b>Gear (Settings)</b> ⚙️.</p>
              <p>4. Cari opsi <b>Script Properties</b> paling bawah.</p>
              <p>5. Tambahkan properti baru:</p>
              <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-[10px] text-white/90 my-2 space-y-1">
                <p>💡 <span className="font-bold text-white">Property (Name):</span> <code className="bg-white/10 px-1 rounded select-all">GEMINI_API_KEY</code></p>
                <p>🔑 <span className="font-bold text-white">Value:</span> <code className="bg-white/10 px-1 rounded select-all">AIzaSyBm7Uk22LB8v4A8yAjf2hvJcxLXGlq43qw</code></p>
              </div>
              <p>6. Klik <b>Save script properties</b>.</p>
            </div>

            <div className="border-l-2 border-white/30 pl-3 space-y-1 py-1 bg-white/2 rounded-r-lg">
              <h4 className="font-bold text-white mb-1 uppercase font-mono text-[10px] text-glow">
                🛰️ Langkah 2: Deploy Web App ke Cloud
              </h4>
              <p>1. Di bagian kanan atas editor Apps Script, tekan tombol <b>Deploy</b> &gt; <b>New deployment</b>.</p>
              <p>2. Klik ikon gir (Select type) lalu pilih <b>Web app</b>.</p>
              <p>3. Isikan bagian konfigurasi:</p>
              <ul className="list-disc pl-5 my-1 font-mono text-[11px] text-white/90">
                <li>Execute as: <strong className="text-white">Me (email Anda)</strong></li>
                <li>Who has access: <strong className="text-white">Anyone</strong></li>
              </ul>
              <p>4. Tekan tombol kancing biru <b>Deploy</b>.</p>
              <p>5. Copy **Web App URL** yang didapatkan, lalu paste di tab status aplikasi ini.</p>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-[10px] font-sans flex items-start gap-2 text-emerald-300">
              <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Semua aksi lock Anda akan langsung terkirim secara wireless ke Google Sheet secara real-time!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
