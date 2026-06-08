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
    { label: 'U', deg: 0, color: '#0f172a' },
    { label: 'TL', deg: 45, color: 'rgba(15, 23, 42, 0.4)' },
    { label: 'T', deg: 90, color: 'rgba(15, 23, 42, 0.8)' },
    { label: 'TG', deg: 135, color: 'rgba(15, 23, 42, 0.4)' },
    { label: 'S', deg: 180, color: 'rgba(15, 23, 42, 0.8)' },
    { label: 'BD', deg: 225, color: 'rgba(15, 23, 42, 0.4)' },
    { label: 'B', deg: 270, color: 'rgba(15, 23, 42, 0.8)' },
    { label: 'BL', deg: 315, color: 'rgba(15, 23, 42, 0.4)' },
  ];

  // Degree markings layout on a circular path
  const markings = Array.from({ length: 24 }).map((_, i) => i * 15);

  return (
    <div className="cyber-panel p-5 rounded-2xl flex flex-col items-center border border-slate-200/80 shadow-lg text-slate-800">
      
      {/* Target Status Bar */}
      <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
        <div className="text-left">
          <span className="text-[10px] tracking-wider font-mono text-slate-400 uppercase font-bold">Arah HP Anda saat ini</span>
          <div className="text-sm font-display font-extrabold text-slate-800 leading-tight">
            Heading: <span className="font-mono text-emerald-600 font-black">{deviceHeading}°</span> {getCardinalLabel(deviceHeading)}
          </div>
        </div>
        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-1 text-slate-400 hover:text-slate-800 transition-all font-sans"
          title="Info Petunjuk Kompas"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showExplanation && (
        <div className="mb-4 text-[11px] bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-650 leading-relaxed font-sans">
          🔥 <b>Cara Kerja Kompas Akurat:</b> Letakkan smartphone Anda secara mendatar (flat) di telapak tangan atau atap rumah Anda seperti memakai <i>onlinecompass.app</i>. Putar perangkat Anda sampai jarum/panah navigasi berimpit di area hijau sinyal target!
        </div>
      )}

      {/* HUGE HIGH-FIDELITY COMPASS CONTAINER */}
      <div className="relative w-64 h-64 my-4 flex items-center justify-center select-none">
        
        {/* Static Outside Bezel - points straight up */}
        <div className="absolute inset-0 border-[3px] border-slate-200 rounded-full flex items-center justify-center">
          {/* Static Pointer needle top representing phone pointing axis */}
          <div className="absolute top-0 w-1.5 h-3.5 bg-slate-800 rounded-b-md z-[50]"></div>
          {/* Glowing ring */}
          <div className="absolute inset-2 border border-slate-200 rounded-full animate-pulse-slow"></div>
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
                    ? 'h-3.5 bg-slate-800/60' 
                    : deg % 30 === 0 
                      ? 'h-2 bg-slate-800/35' 
                      : 'h-1 bg-slate-800/15'
                }`}></div>
                
                {/* Tick Degree number label */}
                {deg % 30 === 0 && (
                  <span className="absolute top-4 text-[7px] font-mono text-slate-500 font-semibold">
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
          <div className="absolute inset-16 rounded-full border border-slate-200 flex items-center justify-center">
            {/* Elegant cross hairs */}
            <div className="absolute w-full h-[0.5px] bg-slate-200"></div>
            <div className="absolute h-full w-[0.5px] bg-slate-200"></div>
          </div>

          {/* Sinyal Target Marker Dot on Compass Border */}
          {selectedStation && (
            <div 
              className="absolute inset-0"
              style={{ transform: `rotate(${targetBearing}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center z-[100]">
                {/* Glowing Target signal marker */}
                <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] text-white font-black shadow-[0_0_15px_#10b981] animate-pulse">
                  📡
                </div>
                <div className="text-[7px] font-display font-bold text-emerald-700 mt-1 uppercase tracking-widest bg-emerald-50 border border-emerald-500/20 px-1 rounded">
                  MUX
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER HEADING READOUT PANEL (Non-Rotating center core) */}
        <div className="absolute z-20 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-300 shadow-md flex flex-col items-center justify-center">
            <span className={`text-sm font-display font-black select-all ${isAligned ? 'text-emerald-600 animate-pulse text-glow-green' : 'text-slate-800'}`}>
              {deviceHeading}°
            </span>
            <span className="text-[7px] font-mono uppercase text-slate-400 font-bold tracking-widest mt-0.5">
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
              fill={isAligned ? '#10b981' : '#4f46e5'} 
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
              stroke={isAligned ? '#10b981' : 'rgba(79, 70, 229, 0.4)'} 
              strokeWidth="1" 
              strokeDasharray="2, 2"
            />
          </svg>
        )}
      </div>

      {/* Target bearing visual bar */}
      <div className="w-full text-center mt-1">
        <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">Azimuth Target MUX</span>
        <div className="text-sm font-bold text-slate-800">
          📍 {selectedStation ? `${selectedStation.name}: ${Math.round(targetBearing)}°` : 'Silakan pilih stasiun TV'}
        </div>
      </div>

      {/* Alignment banner message */}
      <div className={`mt-3 w-full py-2.5 px-3 rounded-lg border text-center font-display font-medium text-xs transition-all duration-300 ${
        !selectedStation 
          ? 'bg-slate-50 border-slate-200 text-slate-450' 
          : isAligned
            ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.06)] px-4 animate-pulse font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
      }`}>
        <div className="flex items-center justify-center gap-1.5 select-none">
          {isAligned && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
          <span className="font-bold tracking-wide">{getAlignmentDirective()}</span>
        </div>
      </div>

      {/* Sensor Calibration Helper / Simulated sliding tools */}
      <div className="w-full mt-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1.5">
          <span className="flex items-center gap-1 font-bold">
            <Smartphone className="w-3.5 h-3.5 text-slate-600" />
            {isSensorActive ? '📡 Sensor Fisik HP Aktif' : 'Simulasi Arah Kompas'}
          </span>
          {!isSensorActive ? (
            <button 
              onClick={requestCompassPermission}
              className="bg-slate-900 text-white hover:bg-slate-800 font-sans font-bold text-[9px] px-2.5 py-1 rounded-md transition-all shadow-sm"
            >
              Aktifkan Sensor HP
            </button>
          ) : (
            <button 
              onClick={() => setDeviceHeading(0)}
              className="hover:text-slate-800 transition-all duration-200 flex items-center gap-0.5 text-[9px] uppercase font-bold text-slate-400"
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
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800 hover:accent-slate-900 transition-all focus:outline-none"
        />
        <p className="text-[9px] text-center text-slate-400 font-mono mt-1.5">
          {isSensorActive 
            ? 'Arah terhubung dengan sensor gyro internal. Putar HP Anda untuk merespon!' 
            : 'Gunakan slider di atas untuk menirukan rotasi HP / arah pointing antena.'}
        </p>
      </div>



      {permissionError && (
        <div className="mt-2 text-[9px] text-red-600 font-mono text-center bg-red-50 border border-red-200 p-2 rounded-lg">
          {permissionError}
        </div>
      )}
    </div>
  );
}
