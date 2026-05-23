/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TVStation, Coordinates } from '../data';

interface SignalMapProps {
  stations: TVStation[];
  userLocation: Coordinates;
  selectedStation: TVStation | null;
  onSelectStation: (station: TVStation) => void;
}

export default function SignalMap({
  stations,
  userLocation,
  selectedStation,
  onSelectStation,
}: SignalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Keep track of layers to remove them easily
  const stationMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const signalLineRef = useRef<L.Polyline | null>(null);
  const coverageCirclesRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create leaflet map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([userLocation.latitude, userLocation.longitude], 12);

    // Add CartoDB Dark Matter tile layer for an incredible futuristic aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      minZoom: 4,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Initialize layer groups
    stationMarkersGroupRef.current = L.layerGroup().addTo(map);
    coverageCirclesRef.current = L.layerGroup().addTo(map);

    // Dynamic resize handler
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Custom pulsing HTML template for user's absolute position
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-6 h-6 bg-white border border-black rounded-full opacity-30 animate-ping"></div>
          <div class="absolute w-4 h-4 bg-white border-2 border-black rounded-full shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-[#0a0f18] rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userIcon,
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <strong class="text-white">Posisi Anda</strong><br/>
          Lat: ${userLocation.latitude.toFixed(5)}<br/>
          Lon: ${userLocation.longitude.toFixed(5)}
         </div>`
      );

    // Pan map to user location
    map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
  }, [userLocation]);

  // Render TV MUX Station Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = stationMarkersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    stations.forEach((station) => {
      const isSelected = selectedStation?.id === station.id;

      // HTML custom marker styled like a digital radar pulse/tower
      const towerIcon = L.divIcon({
        className: 'tv-tower-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer">
            ${isSelected ? `
              <div class="absolute w-8 h-8 bg-emerald-500 rounded-full opacity-20 animate-ping"></div>
              <div class="absolute w-4 h-4 bg-emerald-400 rounded-full blur-xs opacity-50"></div>
            ` : `
              <div class="absolute w-3 h-3 bg-white/20 rounded-full blur-[2px]"></div>
            `}
            <div class="absolute w-5 h-5 flex items-center justify-center rounded-full border ${
              isSelected ? 'border-emerald-400 bg-[#0d131f] text-emerald-400' : 'border-white/30 bg-[#0a0f18] text-white/70'
            } shadow-md transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                <path d="M12 2v20M17 5H7M15 9H9M19 13H5" />
              </svg>
            </div>
            ${isSelected ? `
              <div class="absolute -top-1 w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
            ` : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([station.latitude, station.longitude], { icon: towerIcon });
      
      marker.on('click', () => {
        onSelectStation(station);
      });

      marker.bindPopup(`
        <div class="p-2 font-display text-xs text-white max-w-[200px]">
          <div class="font-bold border-b border-white/10 pb-1 mb-1 flex items-center gap-1">
            <span class="w-2 h-2 ${isSelected ? 'bg-emerald-400' : 'bg-white/60'} rounded-full"></span>
            ${station.name}
          </div>
          <div class="space-y-1 text-gray-300 font-mono text-[10px]">
            <p><span class="text-gray-400 font-sans">Mux Operator:</span> ${station.operator}</p>
            <p><span class="text-gray-400 font-sans">Kanal:</span> Ch ${station.channel} (${station.frequency} MHz)</p>
            <p><span class="text-gray-400 font-sans">Wilayah Mux:</span> ${station.city}</p>
          </div>
          <button class="mt-2 w-full bg-white text-black font-semibold font-sans py-1 rounded text-[10px] uppercase hover:bg-gray-200 transition-all">
            Kunci Arah Sinyal
          </button>
        </div>
      `, {
        closeButton: false,
      });

      markersGroup.addLayer(marker);
    });
  }, [stations, selectedStation]);

  // Update glowing connection line and signal ranges
  useEffect(() => {
    const map = mapInstanceRef.current;
    const circlesGroup = coverageCirclesRef.current;
    if (!map || !circlesGroup) return;

    // Clear previous line
    if (signalLineRef.current) {
      signalLineRef.current.remove();
      signalLineRef.current = null;
    }

    circlesGroup.clearLayers();

    if (!selectedStation) return;

    // 1. Draw glowing, pulsing connection vector
    const userCoords: [number, number] = [userLocation.latitude, userLocation.longitude];
    const stationCoords: [number, number] = [selectedStation.latitude, selectedStation.longitude];

    // Elegant animated white/grey dash line pointing directly to MUX
    signalLineRef.current = L.polyline([userCoords, stationCoords], {
      color: '#ffffff',
      weight: 3,
      dashArray: '10, 8',
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // 2. Draw Transmitter Range boundaries on map to help identify weak zones
    // Excellent range = 15km
    L.circle(stationCoords, {
      radius: 15000,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.03,
      weight: 1,
      dashArray: '5, 5',
    }).addTo(circlesGroup);

    // Maximum Fringe Area = 55km
    L.circle(stationCoords, {
      radius: 55000,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.01,
      weight: 1,
      dashArray: '10, 10',
    }).addTo(circlesGroup);

    // Fit map bounds to encompass user and target cleanly
    const group = L.featureGroup([
      L.marker(userCoords),
      L.marker(stationCoords)
    ]);
    map.fitBounds(group.getBounds().pad(0.2), { animate: true });

  }, [selectedStation, userLocation]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Visual coordinates bar */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0f18]/95 backdrop-blur-md rounded-md border border-white/10 shadow-lg text-[10px] font-mono text-white/80">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
        <span>LAT: {userLocation.latitude.toFixed(5)}</span>
        <span>|</span>
        <span>LON: {userLocation.longitude.toFixed(5)}</span>
      </div>

      <div ref={mapContainerRef} className="w-full h-full" id="map-radar-stage" />

      {/* Tech indicators overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1 text-[9px] font-mono text-white/50 bg-[#0d131f]/90 px-3 py-2 rounded border border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
          <span>Sinyal Kuat (&lt;15 km)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-red-500 inline-block"></span>
          <span>Batas Sinyal (&lt;55 km)</span>
        </div>
      </div>
    </div>
  );
}
