/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Compass, RotateCcw, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';
import { TVStation } from '../data';

interface CyberCompassProps {
  selectedStation: TVStation | null;
  targetBearing: number; // Azimuth to Mux (0-360)
  onLockConfirmed?: (bearing: number, deviation: number) => void;
}

export default function CyberCompass({
  selectedStation,
  targetBearing,
  onLockConfirmed,
}: CyberCompassProps) {
  const [deviceHeading, setDeviceHeading] = useState<number>(0); // 0deg (North)
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Manual compass sensor activation
  const requestCompassPermission = async () => {
    if (typeof window === 'undefined') return;

    // Ask for DeviceOrientation permissions on iOS 13+
    const DeviceOrientationEventAny = DeviceOrientationEvent as any;
    if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          setIsSensorActive(true);
          setPermissionError(null);
        } else {
          setPermissionError('Izin akses kompas ditolak oleh sistem HP.');
        }
      } catch (err) {
        setPermissionError('Gagal mengaktifkan sensor kompas perangkat.');
      }
    } else {
      // Standard Android & Chrome platforms
      const win = window as any;
      if ('ondeviceorientationabsolute' in win) {
        win.addEventListener('deviceorientationabsolute', handleOrientation, true);
        setIsSensorActive(true);
      } else {
        win.addEventListener('deviceorientation', handleOrientation, true);
        setIsSensorActive(true);
      }
      setPermissionError(null);
    }
  };

  const handleOrientation = (e: any) => {
    let heading = 0;
    
    // On iOS devices, webkitCompassHeading is the absolute magnetic north heading
    if (e.webkitCompassHeading !== undefined) {
      heading = e.webkitCompassHeading;
      setIsSensorActive(true);
    } else if (e.absolute === true || e.alpha !== null) {
      // Android device absolute orientation or standard alpha
      // e.alpha represents rotation around z-axis (0-360). 
      // We use 360 - e.alpha to make it rotate clockwise matching map compass physics.
      heading = (360 - e.alpha) % 360;
      setIsSensorActive(true);
    }
    
    setDeviceHeading(Math.round(heading));
  };

  // Listen automatically on mount, or provide fallback
  useEffect(() => {
    const win = window as any;
    if ('ondeviceorientationabsolute' in win) {
      win.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
      win.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      const win = typeof window !== 'undefined' ? (window as any) : null;
      if (win && 'ondeviceorientationabsolute' in win) {
        win.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      }
    };
  }, []);

  // Calculate deviation from direct transmitter alignment
  // target bearing vs current pointing angle
  const rawDiff = targetBearing - deviceHeading;
  // Normalize difference to -180 to 180
  const normalizedDiff = ((rawDiff + 180) % 360) - 180;
  const absDiff = Math.abs(normalizedDiff);
  
  // Locked threshold is +/- 4 degrees (optimal antenna lobe)
  const isAligned = absDiff <= 4 && selectedStation !== null;

  // Render text directive in Indonesian
  const getAlignmentDirective = () => {
    if (!selectedStation) {
      return 'PILIH STASIUN TV UNTUK MEMULAI';
    }
    if (isAligned) {
      return 'ANTENA SEJAJAR! LOCK DI SINI!';
    }
    if (normalizedDiff > 0) {
      return `PUTAR ANTENA / HP ${Math.round(absDiff)}° KANAN ➡️`;
    } else {
      return `⬅️ PUTAR ANTENA / HP ${Math.round(absDiff)}° KIRI`;
    }
  };

  // Convert Heading key degree to cardinal text label
  const getCardinalLabel = (deg: number) => {
    const d = (deg + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'Utara (U)';
    if (d >= 22.5 && d < 67.5) return 'Timur Laut (TL)';
    if (d >= 67.5 && d < 112.5) return 'Timur (T)';
    if (d >= 112.5 && d < 157.5) return 'Tenggara (TG)';
    if (d >= 157.5 && d < 202.5) return 'Selatan (S)';
    if (d >= 202.5 && d < 247.5) return 'Barat Daya (BD)';
    if (d >= 247.5 && d < 292.5) return 'Barat (B)';
    return 'Barat Laut (BL)';
  };

  // Complete array of cardinal points for the high-end rotating dial
  const cardinalPoints = [
    { label: 'U', deg: 0, color: '#ffffff' },
    { label: 'TL', deg: 45, color: 'rgba(255,255,255,0.4)' },
    { label: 'T', deg: 90, color: 'rgba(255,255,255,0.7)' },
    { label: 'TG', deg: 135, color: 'rgba(255,255,255,0.4)' },
    { label: 'S', deg: 180, color: 'rgba(255,255,255,0.7)' },
    { label: 'BD', deg: 225, color: 'rgba(255,255,255,0.4)' },
    { label: 'B', deg: 270, color: 'rgba(255,255,255,0.7)' },
    { label: 'BL', deg: 315, color: 'rgba(255,255,255,0.4)' },
  ];

  // Degree markings layout on a circular path
  const markings = Array.from({ length: 24 }).map((_, i) => i * 15);

  return (
    <div className="cyber-panel p-5 rounded-2xl flex flex-col items-center border border-white/10 shadow-lg text-white">
      
      {/* Target Status Bar */}
      <div className="w-full flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
        <div className="text-left">
          <span className="text-[10px] tracking-wider font-mono text-white/40 uppercase">Arah HP Anda saat ini</span>
          <div className="text-sm font-display font-bold text-white leading-tight">
            Heading: <span className="font-mono text-emerald-400">{deviceHeading}°</span> {getCardinalLabel(deviceHeading)}
          </div>
        </div>
        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-1 text-white/40 hover:text-white transition-all"
          title="Info Petunjuk Kompas"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showExplanation && (
        <div className="mb-4 text-[11px] bg-white/2 border border-white/5 p-3 rounded-lg text-white/80 leading-relaxed font-sans">
          🔥 <b>Cara Kerja Kompas Akurat:</b> Letakkan smartphone Anda secara mendatar (flat) di telapak tangan atau atap rumah Anda seperti memakai <i>onlinecompass.app</i>. Putar perangkat Anda sampai jarum/panah navigasi berimpit di area hijau sinyal target!
        </div>
      )}

      {/* HUGE HIGH-FIDELITY COMPASS CONTAINER */}
      <div className="relative w-64 h-64 my-4 flex items-center justify-center select-none">
        
        {/* Static Outside Bezel - points straight up */}
        <div className="absolute inset-0 border-[3px] border-white/5 rounded-full flex items-center justify-center">
          {/* Static Pointer needle top representing phone pointing axis */}
          <div className="absolute top-0 w-1 h-3.5 bg-white rounded-b-md z-[50]"></div>
          {/* Glowing ring */}
          <div className="absolute inset-2 border border-white/10 rounded-full animate-pulse-slow"></div>
        </div>

        {/* ROTATING COMPASS ROSE DIAL - Rotates counter to heading (-deviceHeading) */}
        <div 
          className="absolute inset-2 transition-transform duration-100 ease-out"
          style={{ transform: `rotate(${-deviceHeading}deg)` }}
        >
          {/* Dial markers of degrees */}
          <div className="absolute inset-0">
            {markings.map((deg) => (
              <div
                key={deg}
                className="absolute inset-0 flex items-start justify-center"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                {/* Tick length */}
                <div className={`w-0.5 mt-0.5 rounded-full ${
                  deg % 90 === 0 
                    ? 'h-3.5 bg-white/60' 
                    : deg % 30 === 0 
                      ? 'h-2 bg-white/30' 
                      : 'h-1 bg-white/15'
                }`}></div>
                
                {/* Tick Degree number label */}
                {deg % 30 === 0 && (
                  <span className="absolute top-4 text-[7px] font-mono text-white/30 font-semibold">
                    {deg}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Cardinal Labels */}
          {cardinalPoints.map((pt) => (
            <div
              key={pt.label}
              className="absolute inset-0 flex items-start justify-center"
              style={{ transform: `rotate(${pt.deg}deg)` }}
            >
              <span 
                className={`absolute top-9 font-display font-black text-xs leading-none tracking-tighter`}
                style={{ color: pt.color }}
              >
                {pt.label}
              </span>
            </div>
          ))}

          {/* COMPASS INTERNAL DECORATIVE PATTERN */}
          <div className="absolute inset-16 rounded-full border border-white/5 flex items-center justify-center">
            {/* Elegant cross hairs */}
            <div className="absolute w-full h-[0.5px] bg-white/5"></div>
            <div className="absolute h-full w-[0.5px] bg-white/5"></div>
          </div>

          {/* Sinyal Target Marker Dot on Compass Border */}
          {selectedStation && (
            <div 
              className="absolute inset-0"
              style={{ transform: `rotate(${targetBearing}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center z-[100]">
                {/* Glowing Target signal marker */}
                <div className="w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center text-[8px] text-[#0a0f18] font-black shadow-[0_0_15px_#10b981] animate-pulse">
                  📡
                </div>
                <div className="text-[7px] font-display font-bold text-emerald-300 mt-1 uppercase tracking-widest bg-emerald-950/90 border border-emerald-400/20 px-1 rounded">
                  MUX
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER HEADING READOUT PANEL (Non-Rotating center core) */}
        <div className="absolute z-20 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#0a0f18]/95 border-2 border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
            <span className={`text-sm font-display font-black select-all ${isAligned ? 'text-emerald-400 animate-pulse text-glow-green' : 'text-white'}`}>
              {deviceHeading}°
            </span>
            <span className="text-[7px] font-mono uppercase text-white/40 tracking-widest mt-0.5">
              Heading
            </span>
          </div>
        </div>

        {/* Dynamic Target Arrow Indicator pointing current phone to target stasiun */}
        {selectedStation && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-100 ease-out z-10"
            style={{ transform: `rotate(${normalizedDiff}deg)` }}
            viewBox="0 0 100 100"
          >
            {/* Elegant compass needle/indicator showing bearing discrepancy */}
            <path 
              d="M50,14 L55,27 L45,27 Z" 
              fill={isAligned ? '#10b981' : '#ffffff'} 
              className={isAligned ? 'animate-pulse' : ''}
              style={{ filter: isAligned ? 'drop-shadow(0 0 10px #10b981)' : 'none' }}
              opacity="0.95"
            />
            {/* Sinyal line vector */}
            <line 
              x1="50" 
              y1="27" 
              x2="50" 
              y2="42" 
              stroke={isAligned ? '#10b981' : 'rgba(255,255,255,0.25)'} 
              strokeWidth="1" 
              strokeDasharray="2, 2"
            />
          </svg>
        )}
      </div>

      {/* Target bearing visual bar */}
      <div className="w-full text-center mt-1">
        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Azimuth Target MUX</span>
        <div className="text-sm font-semibold text-white/90">
          📍 {selectedStation ? `${selectedStation.name}: ${Math.round(targetBearing)}°` : 'Silakan pilih stasiun TV'}
        </div>
      </div>

      {/* Alignment banner message */}
      <div className={`mt-3 w-full py-2.5 px-3 rounded-lg border text-center font-display font-medium text-xs transition-all duration-300 ${
        !selectedStation 
          ? 'bg-white/5 border-white/10 text-white/50' 
          : isAligned
            ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 animate-pulse'
            : 'bg-white/5 border-white/10 text-white/90'
      }`}>
        <div className="flex items-center justify-center gap-1.5 select-none">
          {isAligned && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          <span className="font-bold tracking-wide">{getAlignmentDirective()}</span>
        </div>
      </div>

      {/* Sensor Calibration Helper / Simulated sliding tools */}
      <div className="w-full mt-4 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center text-[10px] text-white/50 font-mono mb-1.5">
          <span className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-white/70" />
            {isSensorActive ? '📡 Sensor Fisik HP Aktif' : 'Simulasi Arah Kompas'}
          </span>
          {!isSensorActive ? (
            <button 
              onClick={requestCompassPermission}
              className="bg-white text-black hover:bg-gray-100 font-sans font-bold text-[9px] px-2 py-0.5 rounded transition-all shadow-sm"
            >
              Aktifkan Sensor HP
            </button>
          ) : (
            <button 
              onClick={() => setDeviceHeading(0)}
              className="hover:text-white transition-all duration-200 flex items-center gap-0.5 text-[9px] uppercase font-bold text-white/30"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          )}
        </div>

        {/* Simulation Slider Control always available for desktop convenience and edge testing */}
        <input 
          type="range" 
          min="0" 
          max="359" 
          value={deviceHeading}
          onChange={(e) => {
            setDeviceHeading(Number(e.target.value));
            // Disable native flag warning once manually interacted with desktop fallback slider
          }}
          className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-100 transition-all focus:outline-none"
        />
        <p className="text-[9px] text-center text-white/30 font-mono mt-1.5">
          {isSensorActive 
            ? 'Arah terhubung dengan sensor gyro internal. Putar HP Anda untuk merespon!' 
            : 'Gunakan slider di atas untuk menirukan rotasi HP / arah pointing antena.'}
        </p>
      </div>

      {/* UI Lock Trigger Action */}
      {selectedStation && (
        <button
          onClick={() => onLockConfirmed?.(targetBearing, normalizedDiff)}
          className={`mt-4 w-full font-display py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-300 ${
            isAligned
              ? 'bg-white text-[#0a0f18] hover:bg-white/95 shadow-md active:scale-98'
              : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
          }`}
          disabled={!isAligned}
        >
          {isAligned ? 'Kunci & Catat Ke Google Sheets 🔒' : 'Luruskan Sinyal Dulu'}
        </button>
      )}

      {permissionError && (
        <div className="mt-2 text-[9px] text-red-400 font-mono text-center bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
          {permissionError}
        </div>
      )}
    </div>
  );
}
