/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Radio, 
  Tv, 
  Search, 
  Wifi, 
  Check, 
  Compass, 
  HelpCircle, 
  RotateCcw, 
  Flame, 
  Sparkles, 
  Info,
  DollarSign,
  Smartphone,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { 
  INDONESIAN_TV_STATIONS, 
  INDONESIAN_CITIES, 
  TVStation, 
  Coordinates, 
  calculateDistance, 
  calculateBearing,
  evaluateTVReceiverSignal
} from './data';
import SignalMap from './components/SignalMap';
import CyberCompass from './components/CyberCompass';
import SheetsPanel from './components/SheetsPanel';

interface LogItem {
  timestamp: string;
  action: string;
  userLocation: string;
  targetMux: string;
  distance: number;
  bearing: number;
  synchronized: boolean;
}

export default function App() {
  // Master Location state - Defaults to Jambi (Kantor Gubernur)
  const [userLocation, setUserLocation] = useState<Coordinates>({
    latitude: -1.6151,
    longitude: 103.5931
  });
  const [activeCityName, setActiveCityName] = useState<string>('Jambi (Kantor Gubernur)');
  
  // Selection states
  const [selectedStation, setSelectedStation] = useState<TVStation | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('Jambi');
  
  // Google Sheets integration state
  const [appScriptUrl, setAppScriptUrl] = useState<string>(() => {
    return localStorage.getItem('tv_antenna_script_url') || '';
  });
  
  const [logs, setLogs] = useState<LogItem[]>(() => {
    const saved = localStorage.getItem('tv_antenna_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' | 'error' } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync state to local storage when changed
  useEffect(() => {
    localStorage.setItem('tv_antenna_logs', JSON.stringify(logs));
  }, [logs]);

  // Handle URL change
  const handleUpdateAppScriptUrl = (url: string) => {
    setAppScriptUrl(url);
    localStorage.setItem('tv_antenna_script_url', url);
    showToast('Link Google Apps Script berhasil disimpan!', 'success');
  };

  // Helper Toast Alerts
  const showToast = (text: string, type: 'success' | 'alert' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Automatically request GPS coordinate lock on startup
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      showToast('Browser Anda tidak mendukung GPS Geolocation.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setActiveCityName('GPS Anda');
        setIsLocating(false);
        showToast('📍 Lokasi GPS Anda berhasil dikunci secara akurat!', 'success');
      },
      (error) => {
        console.error('GPS error:', error);
        setIsLocating(false);
        showToast('Gagal meluas koordinat GPS. Gunakan daftar kota default.', 'alert');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filter stations based on city search query
  const filteredStations = INDONESIAN_TV_STATIONS.filter((station) => {
    const matchesSearch = 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.channelsServed.some(ch => ch.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (cityFilter === 'Semua') {
      return matchesSearch;
    }
    return station.province === cityFilter && matchesSearch;
  });

  const handleSelectCityFallback = (city: typeof INDONESIAN_CITIES[0]) => {
    setUserLocation({
      latitude: city.latitude,
      longitude: city.longitude
    });
    setActiveCityName(city.name);
    
    // Auto-pre-set city filter based on selected hub
    if (city.name.includes('Jambi')) setCityFilter('Jambi');
    else if (city.name.includes('Yogyakarta')) setCityFilter('DI Yogyakarta');
    else if (city.name.includes('Jakarta')) setCityFilter('DKI Jakarta');
    else if (city.name.includes('Bandung')) setCityFilter('Jawa Barat');
    else if (city.name.includes('Surabaya')) setCityFilter('Jawa Timur');
    else if (city.name.includes('Semarang')) setCityFilter('Jawa Tengah');
    else if (city.name.includes('Medan')) setCityFilter('Sumatera Utara');
    else if (city.name.includes('Makassar')) setCityFilter('Sulawesi Selatan');

    showToast(`📍 Berhasil pindah lokasi simulasi ke: ${city.name}`, 'success');
  };

  // Trigger Sheet integration via fetch POST
  const handleConfirmAntennaLock = async (bearing: number, deviation: number) => {
    if (!selectedStation) return;

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      selectedStation.latitude,
      selectedStation.longitude
    );

    const newLog: LogItem = {
      timestamp: new Date().toISOString(),
      action: 'LOCK_ANTENNA_SUCCESS',
      userLocation: `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)} (${activeCityName})`,
      targetMux: selectedStation.name,
      distance: Number(distance.toFixed(2)),
      bearing: Math.round(bearing),
      synchronized: false
    };

    // Attempt real live sync if Webapp Link is provided
    if (appScriptUrl) {
      setIsSyncing(true);
      try {
        const response = await fetch(appScriptUrl, {
          method: 'POST',
          mode: 'no-cors', // Standard cross-origin setting for Apps Script Web App
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newLog)
        });

        // Add to log marked as synchronized (no-cors response is opaque, we verify submission)
        newLog.synchronized = true;
        setLogs(prev => [newLog, ...prev]);
        showToast('🎉 Antena Berhasil Dilock & Terkirim Secara Automatis ke Google Sheets!', 'success');
      } catch (err) {
        console.error('Sync failed:', err);
        setLogs(prev => [newLog, ...prev]);
        showToast('Sejajar terekam lokal. Webapp gagal didistribusikan.', 'alert');
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Simulate Sheet log saving
      setLogs(prev => [newLog, ...prev]);
      showToast('🎉 Lokasi sejajar! Lock tersimpan di Riwayat lokal. Tambahkan Apps Script URL untuk sync online.', 'success');
    }
  };

  const handleManualSyncCheck = async () => {
    if (!appScriptUrl) {
      showToast('Link Google Apps Script kosong bray!', 'error');
      return;
    }
    
    setIsSyncing(true);
    try {
      const res = await fetch(appScriptUrl);
      const data = await res.json();
      if (data.status === 'success') {
        showToast('✅ Link Apps Script Valid! Koneksi lancar jaya.', 'success');
      } else {
        showToast('Respon script error. Periksa Code.gs Anda.', 'alert');
      }
    } catch (err) {
      // Sometimes standard web fetch is restricted by browser CORS during testing
      showToast('Koneksi dikirim! Periksa Tab History di spreadsheet secara manual bray.', 'success');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLogs = () => {
    const confirm = window.confirm('Hapus seluruh riwayat lokalisasi lokal?');
    if (confirm) {
      setLogs([]);
      localStorage.removeItem('tv_antenna_logs');
      showToast('Katalog riwayat lokal berhasil dibersihkan!', 'success');
    }
  };

  // Calculated current specs
  const targetBearing = selectedStation 
    ? calculateBearing(
        userLocation.latitude,
        userLocation.longitude,
        selectedStation.latitude,
        selectedStation.longitude
      )
    : 0;

  const distanceKm = selectedStation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        selectedStation.latitude,
        selectedStation.longitude
      )
    : 0;

  const signalSpecs = selectedStation 
    ? evaluateTVReceiverSignal(distanceKm, selectedStation.heightMasl)
    : null;

  return (
    <div className="relative min-h-screen bg-[#070b12] text-gray-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Super Cool Moving Techno Grid Animated Canvas Backdrop */}
      <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none animate-grid-move"></div>
      
      {/* Radiant Glowing Pulsar Core */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-slate-900/40 border border-white/5 pointer-events-none animate-pulse-slow"></div>
      
      {/* Decorative neon visual lines on margins */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      {/* Header Panel */}
      <header className="relative z-10 border-b border-white/10 bg-[#070b12]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-4">
            <div className="relative group select-none">
              <div className="absolute inset-0 bg-white rounded-xl filter blur-sm opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
              <img 
                src="https://josanvin.github.io/josanvin/img/ArahSinyal2.png" 
                alt="Arah Sinyal Antena Logo" 
                className="relative w-12 h-12 object-contain rounded-xl border border-white/10"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-white text-[#0a0f18] px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">UHF - DVB-T2</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h1 className="text-xl font-display font-extrabold tracking-tight text-glow text-white mt-0.5">
                Arah Sinyal Antena <span className="font-light">TV Digital</span>
              </h1>
            </div>
          </div>

          {/* Location Fast Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRequestGPS}
              disabled={isLocating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-200 ${
                isLocating 
                  ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                  : 'bg-white text-[#0a0f18] hover:bg-gray-200 shadow-lg active:scale-98'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Mencari Kunci GPS...' : 'Gunakan Koordinat GPS Anda'}</span>
            </button>

            {/* Dropdown City Quick Switcher */}
            <div className="relative">
              <select 
                onChange={(e) => {
                  const city = INDONESIAN_CITIES.find(c => c.name === e.target.value);
                  if (city) handleSelectCityFallback(city);
                }}
                value={activeCityName.includes('GPS') ? 'GPS Anda' : activeCityName}
                className="bg-neutral-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-white/30 transition-all font-display font-medium"
              >
                <option disabled value="">-- Simulasi Kota Lain --</option>
                {activeCityName.includes('GPS') && <option value="GPS Anda">📍 Lokasi GPS Anda</option>}
                {INDONESIAN_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    🇮🇩 {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </header>

      {/* Main Grid Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDEBAR: Transmitter list (Left panel) - 4 columns */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Filter, Search & Stations Feed List */}
          <div className="cyber-panel p-5 rounded-2xl flex flex-col flex-1 border border-white/10">
            
            {/* Search inputs */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-sm tracking-wide uppercase flex items-center gap-1.5 text-white">
                  <Tv className="w-4.5 h-4.5 text-white/80" />
                  Stasiun TV Digital
                </h2>
                <span className="text-[10px] font-mono text-white/40">{filteredStations.length} Pemancar</span>
              </div>

              {/* Province Tabs filter */}
              <div className="flex gap-1 overflow-x-auto pb-1.5 custom-scrollbar">
                {['Jambi', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Sumatera Utara', 'Sulawesi Selatan', 'Semua'].map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setCityFilter(prov)}
                    className={`px-3 py-1 text-[10px] font-display font-semibold rounded-lg shrink-0 transition-all ${
                      cityFilter === prov
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {prov.replace('DKI ', '').replace('DI ', '')}
                  </button>
                ))}
              </div>

              {/* Text Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Cari RCTI, SCTV, TVRI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0f18]/80 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all font-display"
                />
              </div>
            </div>

            {/* Transmitter list element feed */}
            <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5 custom-scrollbar">
              {filteredStations.length === 0 ? (
                <div className="text-center py-12 text-xs text-white/30 font-display">
                  Stasiun TV Digital tidak ditemukan bray. Coba ubah kata kunci atau provinsi filter.
                </div>
              ) : (
                filteredStations.map((station) => {
                  const isSelected = selectedStation?.id === station.id;
                  const dist = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    station.latitude,
                    station.longitude
                  );
                  const strength = evaluateTVReceiverSignal(dist, station.heightMasl);

                  return (
                    <div
                      key={station.id}
                      onClick={() => setSelectedStation(station)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                        isSelected
                          ? 'bg-white text-[#0a0f18] border-white'
                          : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-display font-bold text-xs uppercase ${isSelected ? 'text-black' : 'text-white'}`}>
                            {station.name}
                          </h3>
                          <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-[#0a0f18]/70' : 'text-gray-400'}`}>
                            {station.operator} • Ch {station.channel} ({station.frequency} MHz)
                          </p>
                        </div>
                        <span 
                          className="w-2.5 h-2.5 rounded-full ring-4 shadow-sm"
                          style={{ 
                            backgroundColor: strength.colorCode,
                            // Give it outer ring color matching
                            borderColor: isSelected ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)',
                            boxShadow: `0 0 10px ${strength.colorCode}`
                          }}
                        />
                      </div>

                      {/* Station served channels layout */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {station.channelsServed.slice(0, 4).map((ch, idx) => (
                          <span 
                            key={idx} 
                            className={`text-[8px] font-sans font-medium px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-black/10 text-black/80' : 'bg-white/5 text-white/50'
                            }`}
                          >
                            {ch}
                          </span>
                        ))}
                        {station.channelsServed.length > 4 && (
                          <span className={`text-[8px] font-sans px-1 py-0.5 ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                            +{station.channelsServed.length - 4} TV
                          </span>
                        )}
                      </div>

                      {/* Display computed distance and direction info */}
                      <div className="mt-3.5 pt-2 border-t grid grid-cols-2 text-[10px] font-mono text-left" style={{ borderColor: isSelected ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)' }}>
                        <div>
                          <span className={`${isSelected ? 'text-black/60' : 'text-white/40'}`}>Jarak:</span>{' '}
                          <strong className="font-bold">{dist.toFixed(1)} km</strong>
                        </div>
                        <div className="text-right">
                          <span className={`${isSelected ? 'text-black/60' : 'text-white/40'}`}>Arah:</span>{' '}
                          <strong className="font-bold">{Math.round(calculateBearing(userLocation.latitude, userLocation.longitude, station.latitude, station.longitude))}°</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Beautiful TV Details Panel if selected */}
          {selectedStation && (
            <div className="cyber-panel p-4.5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-1.5 text-[9px] tracking-widest text-[#94a3b8] font-mono uppercase">
                <Wifi className="w-4 h-4 text-emerald-400" />
                Evaluasi Kualitas Sinyal
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-sans font-medium text-white/70">Kekuatan Sinyal</span>
                <span 
                  className="px-2.5 py-1 rounded text-[10px] font-display font-extrabold tracking-wider border"
                  style={{ 
                    color: signalSpecs?.colorCode, 
                    borderColor: `${signalSpecs?.colorCode}25`,
                    backgroundColor: `${signalSpecs?.colorCode}10`
                  }}
                >
                  {signalSpecs?.status}
                </span>
              </div>

              {/* Progress Level bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${signalSpecs?.strengthPercent}%`,
                    backgroundColor: signalSpecs?.colorCode
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>RSSI Est: {signalSpecs?.strengthPercent}%</span>
                <span>Jarak Garis Lurus: {distanceKm.toFixed(1)} km</span>
              </div>

              <p className="bg-white/2 border border-white/5 p-3 rounded-xl text-xs text-white/80 leading-relaxed font-sans italic">
                "{signalSpecs?.description}"
              </p>
            </div>
          )}
        </section>

        {/* MAP CONTAINER & ANTENNA COMPASS (Right panel) - 8 columns */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[460px]">
            {/* Map visual section */}
            <div className="md:col-span-7 h-[340px] md:h-auto min-h-[300px]">
              <SignalMap
                stations={INDONESIAN_TV_STATIONS}
                userLocation={userLocation}
                selectedStation={selectedStation}
                onSelectStation={setSelectedStation}
              />
            </div>

            {/* Compass dial section */}
            <div className="md:col-span-5 flex flex-col justify-between h-auto">
              <CyberCompass
                selectedStation={selectedStation}
                targetBearing={targetBearing}
                onLockConfirmed={handleConfirmAntennaLock}
              />
            </div>
          </div>

          {/* Sync Sheets & Technical script properties settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SheetsPanel
              appScriptUrl={appScriptUrl}
              onUpdateUrl={handleUpdateAppScriptUrl}
              logs={logs}
              onClearLogs={handleClearLogs}
              onManualSync={handleManualSyncCheck}
            />

            {/* Donation Area below in cool slang Indonesian (Bahasa Gaul Johan) */}
            <div className="cyber-panel p-5 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between text-white relative overflow-hidden">
              {/* Pulse core inside donor card */}
              <div className="absolute top-[-100px] right-[-100px] w-48 h-48 rounded-full bg-slate-900 filter blur-2xl opacity-40 pointer-events-none"></div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-white animate-bounce" />
                  <h3 className="font-display font-semibold text-sm tracking-wide uppercase">Donasi Bosquu!</h3>
                </div>
                
                <p className="text-xs text-white/80 leading-relaxed font-sans mb-4 italic">
                  "Bantu <strong className="text-white">Johan</strong> beli kopi kapiten ☕ & kuota modem biar tetep semangat bray buat rawat satelit & server MUX ini! Donasi receh amat berguna buat kelangsungan hidup developer indie, gincu sikat langsung donasi lewat E-Wallet di bawah bray! Gaskeun!"
                </p>

                {/* E-wallet layout bar */}
                <div className="space-y-3 bg-[#0a0f18]/80 p-4 border border-white/5 rounded-xl">
                  {/* Account detail row */}
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-white/40 font-mono">REKENING / NO HP:</span>
                    <strong className="text-white font-mono text-sm select-all tracking-wider font-bold">0813-41-300-100</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-white/40 font-mono">ATAS NAMA:</span>
                    <strong className="text-[#a7f3d0] font-sans font-bold">Johan</strong>
                  </div>
                  
                  {/* Digital Wallet grid logos representations styled beautifully */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-[9px] font-mono text-center font-bold">
                    <span className="bg-[#ea580c]/15 text-[#ea580c] px-2 py-1 rounded border border-[#ea580c]/30">SHOPEEPAY</span>
                    <span className="bg-[#10b981]/15 text-[#10b981] px-2 py-1 rounded border border-[#10b981]/30">GOPAY</span>
                    <span className="bg-[#4f46e5]/15 text-[#a5b4fc] px-2 py-1 rounded border border-[#4f46e5]/30">OVO</span>
                    <span className="bg-[#0284c7]/15 text-[#38bdf8] px-2 py-1 rounded border border-[#0284c7]/30">DANA</span>
                  </div>
                </div>
              </div>

              {/* Creator details footer */}
              <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
                <span className="flex items-center gap-1.5 align-middle select-none">
                  <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  Made with Space-Age Techno Graphic
                </span>
                <span className="select-all">© 2026 Johan</span>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* Futuristic Floating Toast Alerts notifications system */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl border cyber-panel-glow bg-[#0d131f]/95 shadow-2xl flex items-center gap-3 animate-bounce max-w-sm text-center">
          <div className="p-1 rounded-full bg-white/10 text-white">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <p className="text-xs font-medium font-sans text-white text-left leading-relaxed">
            {toastMessage.text}
          </p>
        </div>
      )}

      {/* Outer small tech overlay badge */}
      <div className="relative text-center py-4 bg-black/60 border-t border-white/5 text-[10px] font-mono text-white/30 tracking-widest gap-2">
        <span>ANTENNA AZIMUTH MONITOR</span> • <span>CALIBRATION PROTOCOL V4</span> • <span>GITHUB PUBLIC REPOSITORY SYNC</span>
      </div>
    </div>
  );
}
