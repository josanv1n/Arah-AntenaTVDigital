/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Types representing MUX stations and calculations
export interface TVStation {
  id: string;
  name: string; // e.g., "MUX TVRI Joglo"
  operator: string; // e.g., "TVRI Nasional"
  frequency: number; // e.g., 610 MHz
  channel: number; // e.g., 38 UHF
  city: string; // e.g., "Jakarta"
  province: string; // e.g., "DKI Jakarta"
  latitude: number;
  longitude: number;
  heightMasl?: number; // Height above sea level in meters
  channelsServed: string[]; // List of channels broadcasted (e.g., ["TVRI Nasional", "TVRI Sport", "Net TV"])
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SignalCalculation {
  bearing: number; // Target angle in degrees (0-360)
  distanceKm: number; // Distance in kilometers
  optimalAngle: number; // Expected azimuth bearing
  strengthPercent: number; // 0 to 100 estimated signal strength
  strengthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  colorCode: string;
}

// Comprehensive database of Indonesia's Digital TV Transmitters (MUX)
export const INDONESIAN_TV_STATIONS: TVStation[] = [
  // --- JABODETABEK ---
  {
    id: 'tvri-joglo',
    name: 'MUX TVRI Joglo',
    operator: 'LPP TVRI',
    frequency: 618,
    channel: 39,
    city: 'Jakarta Barat',
    province: 'DKI Jakarta',
    latitude: -6.2163,
    longitude: 106.7381,
    heightMasl: 120,
    channelsServed: ['TVRI Nasional', 'TVRI Jakarta', 'TVRI World', 'TVRI Sport', 'NET. TV', 'DAAI TV', 'Badar TV', 'TEMPO TV']
  },
  {
    id: 'rcti-kbn-jeruk',
    name: 'MUX RCTI Kebon Jeruk',
    operator: 'MNC Media',
    frequency: 530,
    channel: 28,
    city: 'Jakarta Barat',
    province: 'DKI Jakarta',
    latitude: -6.1925,
    longitude: 106.7686,
    heightMasl: 140,
    channelsServed: ['RCTI', 'GTV', 'MNCTV', 'iNews']
  },
  {
    id: 'sctv-pengadegan',
    name: 'MUX SCTV Pengadegan',
    operator: 'SCM / Emtek',
    frequency: 498,
    channel: 24,
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    latitude: -6.2416,
    longitude: 106.8481,
    heightMasl: 135,
    channelsServed: ['SCTV', 'Indosiar', 'Moji', 'Mentari TV', 'RTV', 'Kompas TV']
  },
  {
    id: 'metro-kedoya',
    name: 'MUX Metro TV Kedoya',
    operator: 'Media Group',
    frequency: 554,
    channel: 31,
    city: 'Jakarta Barat',
    province: 'DKI Jakarta',
    latitude: -6.1706,
    longitude: 106.7600,
    heightMasl: 110,
    channelsServed: ['Metro TV', 'Magna Channel', 'BN Channel', 'Sandi TV']
  },
  {
    id: 'trans-mampang',
    name: 'MUX Trans TV Mampang',
    operator: 'Trans Media',
    frequency: 626,
    channel: 40,
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    latitude: -6.2435,
    longitude: 106.8282,
    heightMasl: 130,
    channelsServed: ['Trans TV', 'Trans 7', 'CNN Indonesia', 'CNBC Indonesia']
  },
  {
    id: 'tvone-kuningan',
    name: 'MUX tvOne Kuningan',
    operator: 'VIVA Group',
    frequency: 578,
    channel: 34,
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    latitude: -6.2223,
    longitude: 106.8315,
    heightMasl: 125,
    channelsServed: ['tvOne', 'ANTV']
  },

  // --- BANDUNG & SEKITARNYA ---
  {
    id: 'tvri-panyandungan',
    name: 'MUX TVRI Panyandungan',
    operator: 'LPP TVRI',
    frequency: 586,
    channel: 35,
    city: 'Bandung',
    province: 'Jawa Barat',
    latitude: -6.8384,
    longitude: 107.6289,
    heightMasl: 1200,
    channelsServed: ['TVRI Nasional', 'TVRI Jawa Barat', 'TVRI World', 'TVRI Sport', 'NET. TV', 'RTV', 'SCTV', 'Indosiar']
  },
  {
    id: 'metro-bandung',
    name: 'MUX Metro TV Bandung',
    operator: 'Media Group',
    frequency: 562,
    channel: 32,
    city: 'Bandung',
    province: 'Jawa Barat',
    latitude: -6.9034,
    longitude: 107.6438,
    heightMasl: 750,
    channelsServed: ['Metro TV', 'Magna Channel', 'BN Channel']
  },
  {
    id: 'rcti-bandung',
    name: 'MUX RCTI Bandung',
    operator: 'MNC Media',
    frequency: 634,
    channel: 41,
    city: 'Bandung',
    province: 'Jawa Barat',
    latitude: -6.8911,
    longitude: 107.6256,
    heightMasl: 810,
    channelsServed: ['RCTI', 'GTV', 'MNCTV', 'iNews']
  },

  // --- SURABAYA & SEKITARNYA ---
  {
    id: 'tvri-surabaya',
    name: 'MUX TVRI Surabaya',
    operator: 'LPP TVRI (Sambisari)',
    frequency: 586,
    channel: 35,
    city: 'Surabaya',
    province: 'Jawa Timur',
    latitude: -7.2882,
    longitude: 112.6567,
    heightMasl: 45,
    channelsServed: ['TVRI Nasional', 'TVRI Jawa Timur', 'TVRI World', 'TVRI Sport', 'SCTV', 'Indosiar', 'Moji', 'Mentari TV']
  },
  {
    id: 'rcti-surabaya',
    name: 'MUX RCTI Surabaya',
    operator: 'MNC Media',
    frequency: 634,
    channel: 41,
    city: 'Surabaya',
    province: 'Jawa Timur',
    latitude: -7.2721,
    longitude: 112.7932,
    heightMasl: 30,
    channelsServed: ['RCTI', 'GTV', 'MNCTV', 'iNews']
  },
  {
    id: 'metro-surabaya',
    name: 'MUX Metro TV Surabaya',
    operator: 'Media Group',
    frequency: 610,
    channel: 38,
    city: 'Surabaya',
    province: 'Jawa Timur',
    latitude: -7.3321,
    longitude: 112.7291,
    heightMasl: 25,
    channelsServed: ['Metro TV', 'Magna Channel', 'BN Channel']
  },

  // --- SMARANG & YOGYAKARTA ---
  {
    id: 'tvri-gombel',
    name: 'MUX TVRI Gombel',
    operator: 'LPP TVRI',
    frequency: 546,
    channel: 30,
    city: 'Semarang',
    province: 'Jawa Tengah',
    latitude: -7.0315,
    longitude: 110.4228,
    heightMasl: 270,
    channelsServed: ['TVRI Nasional', 'TVRI Jawa Tengah', 'TVRI World', 'TVRI Sport', 'Kompas TV', 'Trans TV', 'Trans 7']
  },
  {
    id: 'rcti-semarang',
    name: 'MUX RCTI Semarang',
    operator: 'MNC Media',
    frequency: 626,
    channel: 40,
    city: 'Semarang',
    province: 'Jawa Tengah',
    latitude: -7.0125,
    longitude: 110.4182,
    heightMasl: 250,
    channelsServed: ['RCTI', 'GTV', 'MNCTV', 'iNews']
  },
  {
    id: 'tvri-pathuk',
    name: 'MUX TVRI Pathuk',
    operator: 'LPP TVRI Yogyakarta',
    frequency: 538,
    channel: 29,
    city: 'Gunungkidul',
    province: 'DI Yogyakarta',
    latitude: -7.8486,
    longitude: 110.4952,
    heightMasl: 700,
    channelsServed: ['TVRI Nasional', 'TVRI Yogyakarta', 'TVRI World', 'TVRI Sport', 'NET. TV', 'Metro TV', 'RTV']
  },
  {
    id: 'sctv-patuk',
    name: 'MUX SCTV Patuk',
    operator: 'SCM / Emtek',
    frequency: 562,
    channel: 32,
    city: 'Gunungkidul',
    province: 'DI Yogyakarta',
    latitude: -7.8465,
    longitude: 110.4988,
    heightMasl: 680,
    channelsServed: ['SCTV', 'Indosiar', 'Moji', 'Mentari TV', 'RTV', 'Kompas TV']
  },

  // --- MEDAN & SUMATERA UTARA ---
  {
    id: 'tvri-medan',
    name: 'MUX TVRI Bandar Baru',
    operator: 'LPP TVRI',
    frequency: 530,
    channel: 28,
    city: 'Deli Serdang',
    province: 'Sumatera Utara',
    latitude: 3.2505,
    longitude: 98.5434,
    heightMasl: 950,
    channelsServed: ['TVRI Nasional', 'TVRI Sumatera Utara', 'TVRI World', 'TVRI Sport', 'NET. TV', 'DAAI TV']
  },
  {
    id: 'rcti-medan',
    name: 'MUX RCTI Medan',
    operator: 'MNC Media',
    frequency: 650,
    channel: 43,
    city: 'Medan',
    province: 'Sumatera Utara',
    latitude: 3.5852,
    longitude: 98.6756,
    heightMasl: 50,
    channelsServed: ['RCTI', 'GTV', 'MNCTV', 'iNews']
  },

  // --- MAKASSAR & SULAWESI SELATAN ---
  {
    id: 'tvri-makassar',
    name: 'MUX TVRI Makassar',
    operator: 'LPP TVRI',
    frequency: 530,
    channel: 28,
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    latitude: -5.1481,
    longitude: 119.4124,
    heightMasl: 30,
    channelsServed: ['TVRI Nasional', 'TVRI Sulawesi Selatan', 'TVRI World', 'TVRI Sport', 'NET. TV', 'RTV']
  },
  {
    id: 'rcti-makassar',
    name: 'MUX RCTI Makassar',
    operator: 'MNC Media',
    frequency: 626,
    channel: 40,
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    latitude: -5.1328,
    longitude: 119.4322,
    heightMasl: 35,
    channelsServed: ['RCTI', 'GTV', 'MNCTV', 'iNews']
  },

  // --- JAMBI ---
  {
    id: 'tvri-jambi',
    name: 'MUX TVRI Jambi',
    operator: 'LPP TVRI Jambi',
    frequency: 658,
    channel: 44,
    city: 'Kota Jambi',
    province: 'Jambi',
    latitude: -1.6111,
    longitude: 103.5855,
    heightMasl: 120,
    channelsServed: ['TVRI Nasional', 'TVRI Jambi', 'TVRI World', 'TVRI Sport', 'NET. TV', 'Jek TV', 'Jambi TV']
  },
  {
    id: 'rcti-jambi',
    name: 'MUX RCTI Jambi',
    operator: 'MNC Media',
    frequency: 562,
    channel: 32,
    city: 'Kota Jambi',
    province: 'Jambi',
    latitude: -1.6033,
    longitude: 103.5790,
    heightMasl: 100,
    channelsServed: ['RCTI', 'GTV', 'MNCTV', 'iNews']
  },
  {
    id: 'sctv-jambi',
    name: 'MUX SCTV Jambi',
    operator: 'SCM / Emtek',
    frequency: 538,
    channel: 29,
    city: 'Kota Jambi',
    province: 'Jambi',
    latitude: -1.6172,
    longitude: 103.5930,
    heightMasl: 95,
    channelsServed: ['SCTV', 'Indosiar', 'Moji', 'Mentari TV', 'Kompas TV']
  },
  {
    id: 'trans-jambi',
    name: 'MUX Trans TV Jambi',
    operator: 'Trans Media',
    frequency: 482,
    channel: 22,
    city: 'Kota Jambi',
    province: 'Jambi',
    latitude: -1.6092,
    longitude: 103.5684,
    heightMasl: 90,
    channelsServed: ['Trans TV', 'Trans 7', 'CNN Indonesia', 'CNBC Indonesia']
  },
  {
    id: 'metro-jambi',
    name: 'MUX Metro TV Jambi',
    operator: 'Media Group',
    frequency: 522,
    channel: 27,
    city: 'Kota Jambi',
    province: 'Jambi',
    latitude: -1.6245,
    longitude: 103.6067,
    heightMasl: 85,
    channelsServed: ['Metro TV', 'Magna Channel', 'BN Channel']
  },
  {
    id: 'tvri-sarolangun',
    name: 'MUX TVRI Sarolangun',
    operator: 'LPP TVRI',
    frequency: 538,
    channel: 29,
    city: 'Sarolangun',
    province: 'Jambi',
    latitude: -2.3117,
    longitude: 102.6468,
    heightMasl: 150,
    channelsServed: ['TVRI Nasional', 'TVRI Jambi', 'TVRI World', 'TVRI Sport']
  },
  {
    id: 'tvri-bungo',
    name: 'MUX TVRI Muara Bungo',
    operator: 'LPP TVRI',
    frequency: 546,
    channel: 30,
    city: 'Muara Bungo',
    province: 'Jambi',
    latitude: -1.4883,
    longitude: 102.1311,
    heightMasl: 180,
    channelsServed: ['TVRI Nasional', 'TVRI Jambi', 'TVRI World', 'TVRI Sport']
  },
  {
    id: 'tvri-sungai-penuh',
    name: 'MUX TVRI Sungai Penuh',
    operator: 'LPP TVRI',
    frequency: 546,
    channel: 30,
    city: 'Sungai Penuh',
    province: 'Jambi',
    latitude: -2.0645,
    longitude: 101.3813,
    heightMasl: 950,
    channelsServed: ['TVRI Nasional', 'TVRI Jambi', 'TVRI World', 'TVRI Sport']
  }
];

// Coordinate details of representative major cities in Indonesia used for simulator fallbacks
export const INDONESIAN_CITIES = [
  { name: 'Jambi (Kantor Gubernur)', latitude: -1.6151, longitude: 103.5931 },
  { name: 'Jakarta (Monas)', latitude: -6.1754, longitude: 106.8272 },
  { name: 'Bandung (Alun-Alun)', latitude: -6.9218, longitude: 107.6071 },
  { name: 'Surabaya (Tugu Pahlawan)', latitude: -7.2458, longitude: 112.7378 },
  { name: 'Semarang (Simpang Lima)', latitude: -6.9901, longitude: 110.4229 },
  { name: 'Yogyakarta (Malioboro)', latitude: -7.7925, longitude: 110.3658 },
  { name: 'Medan (Istana Maimun)', latitude: 3.5753, longitude: 98.6838 },
  { name: 'Makassar (Pantai Losari)', latitude: -5.1444, longitude: 119.4061 }
];

/**
 * Calculates the distance between two points on the Earth (Haversine Formula) in km.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the bearing (azimuth angle in degrees) from coordinate 1 to coordinate 2.
 * Returns value in 0-360 range (0 = North, 90 = East, 180 = South, 270 = West).
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

/**
 * Determines signal quality and outputs an evaluation object package.
 * Simulates Free Space Path Loss (FSPL) and horizon obstacles for Indonesian typical setup.
 */
export function evaluateTVReceiverSignal(distanceKm: number, heightMasl: number = 50): {
  strengthPercent: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  colorCode: string;
  description: string;
} {
  // Simple Indonesian Digital TV UHF signal degradation model (DVB-T2)
  // Inside 12 km -> Excellent signal
  // 12 to 25 km -> Good signal
  // 25 to 45 km -> Fair signal, may need an outdoor high gain booster
  // Over 45 km -> Poor signal, requires tall pole, clean line of sight
  
  let strengthPercent = 100 - (distanceKm * 1.5);
  // Add tall mast advantage
  if (heightMasl > 100) {
    strengthPercent += Math.min(20, (heightMasl - 100) / 10);
  }
  
  strengthPercent = Math.max(5, Math.min(100, Math.round(strengthPercent)));

  if (distanceKm <= 15) {
    return {
      strengthPercent,
      status: 'EXCELLENT',
      colorCode: '#22c55e', // Emerald-500 Glowing Neon
      description: 'Sinyal Jos Gandos! Cukup Antena Indoor / Antena Kecil saja sudah mantap.'
    };
  } else if (distanceKm <= 35) {
    return {
      strengthPercent,
      status: 'GOOD',
      colorCode: '#eab308', // Yellow-500
      description: 'Sinyal Bagus. Disarankan pakai Antena Outdoor sedang tanpa booster.'
    };
  } else if (distanceKm <= 55) {
    return {
      strengthPercent,
      status: 'FAIR',
      colorCode: '#f97316', // Orange-500
      description: 'Sinyal Cukup. Wajib Antena Outdoor High-gain plus tiang minimal 4-6 meter.'
    };
  } else {
    return {
      strengthPercent,
      status: 'POOR',
      colorCode: '#ef4444', // Red-500
      description: 'Sinyal Lemah (Fringe Area). Wajib tiang sangat tinggi + Booster penguat sinyal!'
    };
  }
}

/**
 * Generates Apps Script .gs code to display inside the application.
 */
export function getGoogleAppsScriptTemplate(spreadsheetId: string): string {
  return `/**
 * Google Apps Script untuk Arah Sinyal Antena TV Digital
 * Dipakai sebagai Web App Backend untuk mencatat history pencarian & mengambil properties.
 * 
 * SPREADSHEET_ID: "${spreadsheetId}"
 * Simpan GEMINI_API_KEY di Project Settings -> Script Properties.
 */

const SPREADSHEET_ID = "${spreadsheetId}";

function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const historySheet = spreadsheet.getSheetByName("History") || createHistorySheet(spreadsheet);
    
    // Ambil GEMINI_API_KEY dari Script Properties
    const scriptProperties = PropertiesService.getScriptProperties();
    const geminiApiKey = scriptProperties.getProperty("GEMINI_API_KEY") || "BELUM_DIKONFIGURASI";
    
    // Ambil data history terakhir (limit 20)
    const lastRow = historySheet.getLastRow();
    const historyData = [];
    if (lastRow > 1) {
      const rows = Math.min(20, lastRow - 1);
      const values = historySheet.getRange(lastRow - rows + 1, 1, rows, 6).getValues();
      for (let i = values.length - 1; i >= 0; i--) {
        historyData.push({
          timestamp: values[i][0],
          action: values[i][1],
          userLocation: values[i][2],
          targetMux: values[i][3],
          distance: values[i][4],
          bearing: values[i][5]
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      geminiConfigured: geminiApiKey !== "BELUM_DIKONFIGURASI",
      data: historyData
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseError) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const historySheet = spreadsheet.getSheetByName("History") || createHistorySheet(spreadsheet);
    
    // Ambil parameter data
    const timestamp = new Date();
    const action = postData.action || "SELECT_STATION";
    const userLocation = postData.userLocation || "-";
    const targetMux = postData.targetMux || "-";
    const distance = parseFloat(postData.distance) || 0;
    const bearing = parseInt(postData.bearing) || 0;
    
    // Append baris baru
    historySheet.appendRow([
      timestamp,
      action,
      userLocation,
      targetMux,
      distance,
      bearing
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Aksi sukses disimpan dalam sheet History!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Membuat tab sheet History dengan Header lengkap dan stylish jika belum ada
function createHistorySheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName("History");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("History");
    
    // Set format Header agar sesuai dengan screenshot (lowercase english)
    const headers = ["timestamp", "action", "userLocation", "targetMux", "distance", "bearing"];
    sheet.getRange(1, 1, 1, 6).setValues([headers]);
    
    // Kasih styling header dikit biar rapi bray
    const headerRange = sheet.getRange("A1:F1");
    headerRange.setBackground("#0f172a") // Dark slate background
               .setFontColor("#FFFFFF") // White text
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
               
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 6);
  }
  return sheet;
}
`;
}
