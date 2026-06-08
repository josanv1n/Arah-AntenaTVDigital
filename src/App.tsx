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
  kota?: string;
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
  
  // Custom states for standing address and address loader
  const [address, setAddress] = useState<string>('Kantor Gubernur, Telanaipura, Jambi, Sumatra, Indonesia');
  const [addressLoading, setAddressLoading] = useState<boolean>(false);
  const [addressSearchInput, setAddressSearchInput] = useState<string>('');
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  
  // Selection states
  const [selectedStation, setSelectedStation] = useState<TVStation | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('Semua');
  
  // Google Sheets integration state
  const [appScriptUrl, setAppScriptUrl] = useState<string>(() => {
    return localStorage.getItem('tv_antenna_script_url') || 
      ((import.meta as any).env.VITE_WEB_APP_URL as string) || 
      ((import.meta as any).env.WEB_APP_URL as string) || 
      'https://script.google.com/macros/s/AKfycbwdXykYv4Gr_PhL3tItdnbcEznemgDMpZiVVJVZ7IHIhxcei6Uwr6x2KB1nRcSDxjixXA/exec';
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

  // Helper to calculate closest city fallback if internet/nominatim fails
  const getClosestCityName = (lat: number, lng: number): string => {
    let closestCity = 'Indonesia';
    let minDistance = Infinity;
    
    INDONESIAN_CITIES.forEach((city) => {
      const dist = calculateDistance(lat, lng, city.latitude, city.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = city.name.split(' (')[0];
      }
    });
    
    return closestCity;
  };

  // High-accuracy reverse map address lookup + auto-seek nearest station
  const fetchAddressAndSelectNearest = async (lat: number, lng: number, selectNearest = true) => {
    setAddressLoading(true);
    const closestCityName = getClosestCityName(lat, lng);
    let addressResult = `Kawasan ${closestCityName} (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&email=un1c0rn7899999@gmail.com`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          addressResult = data.display_name;
        } else if (data && data.name) {
          addressResult = data.name;
        }

        if (data && data.address) {
          const cityResult = data.address.city || data.address.municipality || data.address.town || data.address.village || data.address.suburb || data.address.state || closestCityName;
          setActiveCityName(cityResult);
        } else {
          setActiveCityName(closestCityName);
        }
      } else {
        setActiveCityName(closestCityName);
      }
    } catch (err) {
      console.error('Error reverse geocoding coordinates:', err);
      setActiveCityName(closestCityName);
    }
    
    setAddress(addressResult);
    setAddressLoading(false);

    if (selectNearest) {
      let nearest: TVStation | null = null;
      let minDistance = Infinity;
      
      INDONESIAN_TV_STATIONS.forEach((station) => {
        const dist = calculateDistance(lat, lng, station.latitude, station.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = station;
        }
      });
      
      if (nearest) {
        setSelectedStation(nearest);
        showToast(`📡 Pemancar terdekat otomatis terpilih: ${(nearest as TVStation).name} (Jarak: ${minDistance.toFixed(1)} km)`, 'success');
      }
    }
  };

  // Full complete address lookups based on manual search query inputted by user
  const handleSearchAddress = async () => {
    if (!addressSearchInput.trim()) return;
    setIsSearchingAddress(true);
    showToast(`Mencari Alamat: ${addressSearchInput}...`, 'success');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearchInput)}&countrycodes=id&limit=3&email=un1c0rn7899999@gmail.com`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          
          setUserLocation({ latitude: lat, longitude: lon });
          setActiveCityName(first.name || 'Hasil Pencarian');
          
          // Fetch full precise details for address state & nearest MUX
          await fetchAddressAndSelectNearest(lat, lon, true);
          showToast('📍 Posisi Anda berhasil diperbarui sesuai alamat lengkap!', 'success');
        } else {
          showToast('Alamat tidak ditemukan di Indonesia bray bray.', 'alert');
        }
      } else {
        showToast('Satuan info satelit pencari pincang bray.', 'error');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      showToast('Gagal menyinkronkan data pencarian alamat.', 'error');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Set initial address and nearest station lookup on mount
  useEffect(() => {
    fetchAddressAndSelectNearest(userLocation.latitude, userLocation.longitude, true);
  }, []);

  // Automatically request GPS coordinate lock on startup or manual click
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      showToast('Browser Anda tidak mendukung GPS Geolocation.', 'error');
      return;
    }

    setIsLocating(true);
    showToast('📡 Sedang mengunci koordinat satelit GPS Anda...', 'success');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setActiveCityName('GPS Anda');
        setIsLocating(false);
        showToast('📍 Koordinat GPS berhasil terkunci secara akurat!', 'success');
        await fetchAddressAndSelectNearest(latitude, longitude, true);
      },
      (error) => {
        console.error('GPS error:', error);
        setIsLocating(false);
        showToast('Gagal memproses koordinat GPS. Menggunakan lokasi default.', 'alert');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Filter and sort stations based on user distance and search query
  const filteredStations = INDONESIAN_TV_STATIONS
    .map((station) => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        station.latitude,
        station.longitude
      );
      return { ...station, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .filter((station) => {
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

  // Automatically log selecting a station to Google Sheets on click
  const handleSelectStation = async (station: TVStation) => {
    setSelectedStation(station);
    
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      station.latitude,
      station.longitude
    );
    const bearing = calculateBearing(
      userLocation.latitude,
      userLocation.longitude,
      station.latitude,
      station.longitude
    );

    const coordsOnly = `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`;

    const newLog: LogItem = {
      timestamp: new Date().toISOString(),
      action: 'PILIH_STASIUN',
      userLocation: coordsOnly,
      kota: activeCityName,
      targetMux: station.name,
      distance: Number(dist.toFixed(2)),
      bearing: Math.round(bearing),
      synchronized: false
    };

    if (appScriptUrl) {
      try {
        const payload = {
          spreadsheetId: '1jHxBbN5zacD9hBClTHTiimRk2cVCCxlYOXHg9OBFU9w',
          sheetName: 'History',
          timestamp: newLog.timestamp,
          action: newLog.action,
          userLocation: coordsOnly, // koordinat berdiri murni
          kota: activeCityName,     // nama kota
          targetMux: newLog.targetMux, // pilihan stasiun tv digital
          distance: newLog.distance,
          bearing: newLog.bearing
        };

        await fetch(appScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        newLog.synchronized = true;
        showToast(`📲 Automatis Mencatat: ${station.name} (${activeCityName}) ke Google Sheets!`, 'success');
      } catch (err) {
        console.error('Failed to log select event to Google Sheets:', err);
      }
    }
    
    setLogs(prev => [newLog, ...prev]);
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

    const coordsOnly = `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`;

    const newLog: LogItem = {
      timestamp: new Date().toISOString(),
      action: 'LOCK_ANTENNA_SUCCESS',
      userLocation: coordsOnly,
      kota: activeCityName,
      targetMux: selectedStation.name,
      distance: Number(distance.toFixed(2)),
      bearing: Math.round(bearing),
      synchronized: false
    };

    // Attempt real live sync if Webapp Link is provided
    if (appScriptUrl) {
      setIsSyncing(true);
      try {
        const payload = {
          spreadsheetId: '1jHxBbN5zacD9hBClTHTiimRk2cVCCxlYOXHg9OBFU9w',
          sheetName: 'History',
          timestamp: newLog.timestamp,
          action: newLog.action,
          userLocation: coordsOnly,
          kota: activeCityName,
          targetMux: newLog.targetMux,
          distance: newLog.distance,
          bearing: newLog.bearing
        };

        await fetch(appScriptUrl, {
          method: 'POST',
          mode: 'no-cors', // Standard cross-origin setting for Apps Script Web App
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        newLog.synchronized = true;
        setLogs(prev => [newLog, ...prev]);
        showToast('🎉 Sinyal Dilock & Terkirim Secara Automatis ke Google Sheets!', 'success');
      } catch (err) {
        console.error('Sync failed:', err);
        setLogs(prev => [newLog, ...prev]);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setLogs(prev => [newLog, ...prev]);
    }
  };

  const handleManualSyncCheck = async () => {
    if (!appScriptUrl) {
      showToast('Link Google Apps Script kosong bray!', 'error');
      return;
    }
    
    setIsSyncing(true);
    showToast('🔄 Mengambil data log terbaru dari Google Sheets...', 'success');
    
    try {
      const res = await fetch(appScriptUrl);
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        const sheetLogs: LogItem[] = data.data.map((item: any) => ({
          timestamp: item.timestamp || new Date().toISOString(),
          action: item.action || 'PILIH_STASIUN',
          userLocation: item.userLocation || '-',
          kota: item.kota || '-',
          targetMux: item.targetMux || '-',
          distance: typeof item.distance === 'string' ? parseFloat(item.distance) || 0 : item.distance || 0,
          bearing: typeof item.bearing === 'string' ? parseInt(item.bearing) || 0 : item.bearing || 0,
          synchronized: true
        }));
        
        setLogs(sheetLogs);
        showToast('✅ Berhasil menyelaraskan log riwayat langsung dari Google Sheets!', 'success');
      } else {
        showToast('Koneksi lancar! Klik beberapa stasiun untuk melihat pemutakhiran data secara langsung.', 'success');
      }
    } catch (err) {
      console.error('Failed to parse GET response:', err);
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
    <div className="relative min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-950 selection:text-white">
      {/* Super Cool Moving Techno Grid Animated Canvas Backdrop */}
      <div className="absolute inset-0 cyber-grid opacity-45 pointer-events-none animate-grid-move"></div>
      
      {/* Radiant Glowing Pulsar Core */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-slate-100/60 pointer-events-none animate-pulse-slow border border-slate-200/50"></div>
      
      {/* Decorative subtle visual lines on margins */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

      {/* Header Panel */}
      <header className="relative z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-4">
            <div className="relative group select-none">
              <div className="absolute inset-0 bg-slate-200 rounded-xl filter blur-sm opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
              <img 
                src="https://josanvin.github.io/josanvin/img/ArahSinyal2.png" 
                alt="Arah Sinyal Antena Logo" 
                className="relative w-12 h-12 object-contain rounded-xl border border-slate-200"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">UHF - DVB-T2</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h1 className="text-xl font-display font-extrabold tracking-tight text-glow text-slate-900 mt-0.5">
                Arah Sinyal Antena <span className="font-light text-slate-600">TV Digital</span>
              </h1>
            </div>
          </div>

          {/* Location Fast Controls (Clean State HUD) */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-400 font-bold hidden sm:inline">SATELIT GEOLOKASI (OSM) AKTIF</span>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[10px] font-mono flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              AUTO-MATCHING
            </div>
          </div>

        </div>
      </header>
 
      {/* Location Status Banner with Alamat Berdiri */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
        <div className="cyber-panel p-4.5 rounded-2xl border border-slate-200/80 bg-white/95 shadow-md flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 flex items-start gap-3.5">
              <div className="mt-1 flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 shrink-0">
                <MapPin className="w-5 h-5 animate-pulse text-orange-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-orange-500/10 text-orange-700 px-2 py-0.5 rounded font-mono font-extrabold tracking-wider uppercase">POSISI BERDIRI ANDA</span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    Koordinat: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
                  </span>
                  {addressLoading && (
                    <span className="text-[10px] text-emerald-600 font-mono animate-pulse flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span> Mendapatkan alamat...
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-sans font-bold text-slate-800 leading-relaxed">
                  {address}
                </h2>
                <p className="text-[10px] text-slate-400 font-mono">
                  💡 <i>Tips: Anda bisa mencari alamat lengkap Anda atau klik di mana saja pada peta untuk memperbarui posisi berdiri.</i>
                </p>
              </div>
            </div>
            
            {/* Action button */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={handleRequestGPS}
                disabled={isLocating}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-display font-bold transition-all duration-300 shadow-sm active:scale-98 ${
                  isLocating 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg border border-slate-900'
                }`}
              >
                <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-slate-400' : 'text-white'}`} />
                <span>{isLocating ? 'Mengunci Sinyal GPS...' : 'Cek Lokasi Posisi & Cari Pemancar'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Complete Address Search Bar */}
          <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik alamat lengkap asal bray... (contoh: Sleman Yogyakarta, Kebayoran Baru Jakarta, Sukun Malang)"
                value={addressSearchInput}
                onChange={(e) => setAddressSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchAddress();
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-all font-display"
              />
            </div>
            <button
              onClick={handleSearchAddress}
              disabled={isSearchingAddress || !addressSearchInput.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-slate-100 rounded-xl text-xs font-display font-semibold text-white transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5"
            >
              {isSearchingAddress ? (
                <>
                  <span className="w-3 h-3 border-2 border-indigo-600 border-t-white rounded-full animate-spin"></span>
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Cari Alamat Lengkap</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDEBAR: Transmitter list (Left panel) - 4 columns */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Filter, Search & Stations Feed List */}
          <div className="cyber-panel p-5 rounded-2xl flex flex-col flex-1 border border-slate-200/80 bg-white/95 shadow-md text-slate-800">
            
            {/* Search inputs */}
            <div className="space-y-3 mb-4">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <h2 className="font-display font-black text-sm tracking-wide uppercase flex items-center gap-1.5 text-slate-900">
                    <Tv className="w-4.5 h-4.5 text-slate-700" />
                    Stasiun TV Digital
                  </h2>
                  <div className="text-[10px] text-indigo-700 font-bold bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md mt-1 font-mono tracking-wide">
                    📍 Berdiri: {getClosestCityName(userLocation.latitude, userLocation.longitude)} • Aktif: {activeCityName}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold self-start sm:self-center mt-1 sm:mt-0">{filteredStations.length} Pemancar</span>
              </div>

              {/* Text Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari RCTI, SCTV, TVRI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-all font-display"
                />
              </div>
            </div>

            {/* Transmitter list element feed */}
            <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5 custom-scrollbar">
              {filteredStations.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-display">
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
                      onClick={() => handleSelectStation(station)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                        isSelected
                          ? 'bg-slate-100 text-slate-900 border-slate-400 ring-2 ring-slate-400/20 shadow-sm'
                          : 'bg-slate-50/50 border-slate-200/85 hover:bg-slate-100/50 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-display font-extrabold text-xs uppercase ${isSelected ? 'text-slate-950 font-black' : 'text-slate-800'}`}>
                            {station.name}
                          </h3>
                          <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>
                            {station.operator} • Ch {station.channel} ({station.frequency} MHz)
                          </p>
                        </div>
                        <span 
                          className="w-2.5 h-2.5 rounded-full ring-4 shadow-sm"
                          style={{ 
                            backgroundColor: strength.colorCode,
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
                            className={`text-[8px] font-sans font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {ch}
                          </span>
                        ))}
                        {station.channelsServed.length > 4 && (
                          <span className={`text-[8px] font-sans font-bold ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                            +{station.channelsServed.length - 4} TV
                          </span>
                        )}
                      </div>

                      {/* Display computed distance and direction info */}
                      <div className="mt-3.5 pt-2 border-t grid grid-cols-2 text-[10px] font-mono text-left border-slate-200/60">
                        <div>
                          <span className={`${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>Jarak:</span>{' '}
                          <strong className="font-bold">{dist.toFixed(1)} km</strong>
                        </div>
                        <div className="text-right">
                          <span className={`${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>Arah:</span>{' '}
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
            <div className="cyber-panel p-4.5 rounded-2xl border border-slate-200/80 bg-white/95 shadow-md space-y-3">
              <div className="flex items-center gap-1.5 text-[9px] tracking-widest text-slate-500 font-mono uppercase font-black">
                <Wifi className="w-4 h-4 text-emerald-500" />
                Evaluasi Kualitas Sinyal
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-sans font-bold text-slate-600">Kekuatan Sinyal</span>
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
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${signalSpecs?.strengthPercent}%`,
                    backgroundColor: signalSpecs?.colorCode
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 font-semibold">
                <span>RSSI Est: {signalSpecs?.strengthPercent}%</span>
                <span>Jarak Garis Lurus: {distanceKm.toFixed(1)} km</span>
              </div>

              <p className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-650 leading-relaxed font-sans italic">
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
                onSelectStation={handleSelectStation}
                onMoveUserLocation={async (coords) => {
                  setUserLocation(coords);
                  setActiveCityName(getClosestCityName(coords.latitude, coords.longitude));
                  await fetchAddressAndSelectNearest(coords.latitude, coords.longitude, true);
                }}
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
            <div className="cyber-panel p-5 rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg flex flex-col justify-between text-slate-800 relative overflow-hidden">
              {/* Pulse core inside donor card */}
              <div className="absolute top-[-100px] right-[-100px] w-48 h-48 rounded-full bg-slate-100 filter blur-2xl opacity-40 pointer-events-none"></div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-slate-800 animate-bounce animate-pulse" />
                  <h3 className="font-display font-semibold text-sm tracking-wide uppercase text-slate-800">Donasi Bosquu!</h3>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4 italic">
                  "Bantu <strong className="text-slate-900">Johan</strong> beli kopi kapiten ☕ & kuota modem biar tetep semangat bray buat rawat satelit & server MUX ini! Donasi receh amat berguna buat kelangsungan hidup developer indie, gincu sikat langsung donasi lewat E-Wallet di bawah bray! Gaskeun!"
                </p>

                {/* E-wallet layout bar */}
                <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  {/* Account detail row */}
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-slate-500 font-bold font-mono">REKENING / NO HP:</span>
                    <strong className="text-slate-900 font-mono text-sm select-all tracking-wider font-extrabold">0813-41-300-100</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-slate-500 font-bold font-mono">ATAS NAMA:</span>
                    <strong className="text-emerald-700 font-sans font-black">Johan</strong>
                  </div>
                  
                  {/* Digital Wallet grid logos representations styled beautifully */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-[9px] font-mono text-center font-bold">
                    <span className="bg-[#ea580c]/15 text-[#ea580c] px-2 py-1 rounded border border-[#ea580c]/30">SHOPEEPAY</span>
                    <span className="bg-[#10b981]/15 text-[#10b981] px-2 py-1 rounded border border-[#10b981]/30">GOPAY</span>
                    <span className="bg-[#4f46e5]/15 text-[#4f46e5] px-2 py-1 rounded border border-[#4f46e5]/30">OVO</span>
                    <span className="bg-[#0284c7]/15 text-[#0284c7] px-2 py-1 rounded border border-[#0284c7]/30">DANA</span>
                  </div>
                </div>
              </div>

              {/* Creator details footer */}
              <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl border border-slate-200 bg-white/95 shadow-xl flex items-center gap-3 animate-bounce max-w-sm text-center text-slate-800">
          <div className="p-1 rounded-full bg-slate-100 text-slate-800">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
          </div>
          <p className="text-xs font-bold font-sans text-slate-800 text-left leading-relaxed">
            {toastMessage.text}
          </p>
        </div>
      )}

      {/* Outer small tech overlay badge */}
      <div className="relative text-center py-4 bg-slate-100 border-t border-slate-200/80 text-[10px] font-mono text-slate-500 font-semibold tracking-widest gap-2 shadow-sm">
        <span>ANTENNA AZIMUTH MONITOR</span> • <span>CALIBRATION PROTOCOL V4</span> • <span>GITHUB PUBLIC REPOSITORY SYNC</span>
      </div>
    </div>
  );
}
