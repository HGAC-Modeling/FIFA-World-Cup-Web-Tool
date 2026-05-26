// CSP-safe CSV loader (replaces d3.csv which uses eval)
async function loadCSV(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.statusText}`);
  }
  const text = await response.text();
  return d3.csvParse(text);
}

const MAPS = {
  model_scenario_1: "https://felt.com/embed/map/Weekday-Baseline-Scenario-ISglh3tVSYq77SCNvd7ZID?loc=40.402,-111.859,14z",
  baseline_scenario: "https://felt.com/embed/map/Event-2-NRG-Jan-11-Playoff-copy-CSHN59AG9BT5KO1HZRoTWAbB?loc=29.69314,-95.41,12.56z",
  jun28_beyonce: "https://felt.com/embed/map/Event-3-NRG-Jun-28-Beyonce-Concert-copy-9CS5Yjof2TcyzNbEgkbTF9BA?loc=29.685,-95.411,12.56z",
  oct6_football: "https://felt.com/embed/map/Event4-NRG-Oct-6-2024-Football-Game-copy-MG79CIP7sTmS7yntvbbBYeC?loc=29.685,-95.411,12.56z"
};

// Initialize DOM elements
const mapFrame = document.getElementById('mapFrame');
// Removed buffer controls
// New controls for OD/hour
const originSelect = document.getElementById('originSelect');
const destinationSelect = document.getElementById('destinationSelect');
const hourSelect = document.getElementById('hourSelect');
const routeResults = document.getElementById('routeResults');
const routeMapDiv = document.getElementById('routeMap');
const mapContainer = document.getElementById('mapContainer');

// Leaflet map variables
let leafletMap = null;
let routeLayer = null;

// Note: Performance Measures dropdown handling is now in traffic-analysis-summary.html
// Using two-level dropdown system (mainCategorySelect -> subcategorySelect)

// Buffer slider removed

// OD data from CSV with time periods
const locations = ['Parklot', 'Rideshare', 'Region 3', 'Region 4'];
const timeLabels = [
  '00:00 - 06:00', '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
  '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
  '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00', '23:00 - 00:00'
];

// Event to CSV file mapping
const EVENT_DATA_FILES = {
  model_scenario_1: {
    trips: 'data/Jan 8 2024 College Football_Trip.csv',
    percent: 'data/Jan 8 2024 College Football_percent.csv',
    profiles: 'data/performance measure/baseline weekday_arrival departure.csv',
    specialEvent: 'data/Jan 8 2024_Special Event.csv',
    ridership: 'data/performance measure/baseline weekday_ridership.csv'
  },
  baseline_scenario: {
    trips: 'data/Jan 8 2024 College Football_Trip.csv', // Placeholder - update if needed
    percent: 'data/Jan 8 2024 College Football_percent.csv', // Placeholder - update if needed
    profiles: 'data/performance measure/baseline weekday_arrival departure.csv',
    specialEvent: 'data/Jan 8 2024_Special Event.csv', // Placeholder - update if needed
    ridership: 'data/performance measure/baseline weekday_ridership.csv'
  },
  jan11_playoff: {
    trips: 'data/Jan 11 Playoff Hourly_Trip.csv',
    percent: 'data/Jan 11 Playoff Hourly_percent.csv',
    profiles: 'data/Jan 11 2024_Arrival_Departure Profile.csv',
    specialEvent: 'data/Jan 11 2024_Special Event.csv'
  },
  jun28_beyonce: {
    trips: 'data/Jun 28 Beyonce_Trip.csv',
    percent: 'data/Jun 28 Beyonce_percent.csv',
    profiles: 'data/June 28 2024_Arrival_Departure Profile.csv',
    specialEvent: 'data/Jun 28 2024_Special Event.csv'
  },
  oct6_football: {
    trips: 'data/Oct 6 2024_Trip.csv',
    percent: 'data/Oct 6 2024_percent.csv',
    profiles: 'data/Oct 6 2024_Arrival_Departure Profile.csv',
    specialEvent: 'data/Oct 6 2024_Special Event.csv'
  }
};

// Data caches for new CSVs
let scenarioPerformanceRows = [];

// Store loaded data for each event
let eventDataCache = {};
let currentEvent = 'model_scenario_1';
let currentDataType = 'trips';
let dataLoaded = false;

// Function to parse CSV data into OD structure
function parseCSVtoOD(csvData) {
  const odData = {};
  
  csvData.forEach(row => {
    const origin = row.Origin;
    const destination = row.Destination;
    
    if (!odData[origin]) {
      odData[origin] = {};
    }
    
    // Extract hourly values (skip Origin and Destination columns)
    const hourlyValues = [];
    for (let key in row) {
      if (key !== 'Origin' && key !== 'Destination') {
        const value = parseFloat(row[key]);
        hourlyValues.push(isNaN(value) ? 0 : value);
      }
    }
    
    odData[origin][destination] = hourlyValues;
  });
  
  return odData;
}

// Load data for a specific event
async function loadEventData(eventId) {
  if (eventDataCache[eventId]) {
    return eventDataCache[eventId];
  }
  
  try {
    const files = EVENT_DATA_FILES[eventId];
    
    // Load trip, percent, profile, special event, and ridership data
    const loadPromises = [
      loadCSV(files.trips),
      loadCSV(files.percent),
      loadCSV(files.profiles),
      loadCSV(files.specialEvent)
    ];
    
    // Add ridership data if available
    if (files.ridership) {
      loadPromises.push(loadCSV(files.ridership));
    } else {
      loadPromises.push(Promise.resolve([]));
    }
    
    const [tripsData, percentData, profilesData, specialEventData, ridershipData] = await Promise.all(loadPromises);
    
    // Check if this is the baseline scenario with Auto/Rideshare format
    const hasAutoRideshare = profilesData.length > 0 && 
      (profilesData[0]['Arrival Profile Auto'] !== undefined || 
       profilesData[0]['Departure Profile Auto'] !== undefined);
    
    let profiles;
    if (hasAutoRideshare) {
      // New format with Auto and Rideshare columns
      profiles = {
        arrivalAuto: profilesData.map(d => parseFloat(d['Arrival Profile Auto']) || 0),
        departureAuto: profilesData.map(d => parseFloat(d['Departure Profile Auto']) || 0),
        arrivalRideshare: profilesData.map(d => parseFloat(d['Arrival Profile Rideshare']) || 0),
        departureRideshare: profilesData.map(d => parseFloat(d['Departure Profile Rideshare']) || 0),
        timeRanges: profilesData.map(d => (d['Time Range'] || '').trim())
      };
      console.log('Loaded Auto/Rideshare format data:', {
        arrivalAuto: profiles.arrivalAuto.length,
        arrivalRideshare: profiles.arrivalRideshare.length,
        sampleArrivalRideshare: profiles.arrivalRideshare.slice(0, 10),
        sampleDepartureRideshare: profiles.departureRideshare.slice(0, 10)
      });
    } else {
      // Old format with single Arrival/Departure Profile columns
      profiles = {
        arrival: profilesData.map(d => parseFloat(d['Arrival Profile']) || 0),
        departure: profilesData.map(d => parseFloat(d['Departure Profile']) || 0),
        timeRanges: profilesData.map(d => d['Time Range'])
      };
    }
    
    eventDataCache[eventId] = {
      trips: parseCSVtoOD(tripsData),
      percent: parseCSVtoOD(percentData),
      profiles: profiles,
      specialEvent: specialEventData[0], // Get first (and only) row
      ridership: ridershipData || []
    };
    
    return eventDataCache[eventId];
  } catch (error) {
    console.error(`Error loading data for event ${eventId}:`, error);
    throw error;
  }
}

// Initialize with first event
async function initializeData() {
  try {
    await loadEventData(currentEvent);
    // Load scenario performance CSV for the new UI
    const scenarioPerf = await loadCSV('data/performance measure/scenario_route_performance.csv');
    // Keep scenario performance rows for filtering
    scenarioPerformanceRows = scenarioPerf || [];
    // Debug logs to help diagnose empty dropdowns
    console.log('Scenario rows:', scenarioPerformanceRows.length);
    // Populate selectors and render default results
    populateSelectors();
    renderFilteredResults();
    dataLoaded = true;
    update();
    // If opened via file://, some browsers block CSV XHR; surface a hint
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
      console.warn('Page opened via file://. CSV requests may be blocked by the browser.');
      if (routeResults && scenarioPerformanceRows.length === 0) {
        routeResults.innerHTML = '<div style="padding:12px;background:#fff4e5;border:1px solid #ffd8a8;border-radius:6px;color:#8a6d3b;">CSV files could not be loaded. Please serve this folder via a local web server (e.g., <code>python -m http.server 8000</code>) and open <code>http://localhost:8000/traffic-analysis-summary.html</code>.</div>';
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error);
    // Create fallback data for charts
    createFallbackData();
    dataLoaded = true;
    // Populate selectors and table from any available fallback rows
    try { populateSelectors(); } catch (e) { console.warn('populateSelectors failed:', e); }
    try { renderFilteredResults(); } catch (e) { console.warn('renderFilteredResults failed:', e); }
    update();
  }
}

// Populate the dropdowns
function populateSelectors() {
  // Helper to clear options except the first default
  const clearOptions = (selectEl) => {
    while (selectEl && selectEl.options && selectEl.options.length > 1) {
      selectEl.remove(1);
    }
  };

  // Extract unique values from scenario performance CSV
  const uniqueOrigins = Array.from(new Set((scenarioPerformanceRows || [])
    .map(r => (r['Origion'] || r['Origin'] || '').trim())
    .filter(Boolean))).sort();
  
  const uniqueDestinations = Array.from(new Set((scenarioPerformanceRows || [])
    .map(r => (r['Destination'] || '').trim())
    .filter(Boolean))).sort();

  // Extract available hour columns from CSV headers
  const availableHours = [];
  if (scenarioPerformanceRows.length > 0) {
    const firstRow = scenarioPerformanceRows[0];
    const keys = Object.keys(firstRow);
    keys.forEach(key => {
      // Look for any column with time patterns (Speed, Travel Time, or TTI columns)
      if ((key.includes('Speed') || key.includes('Travel Time') || key.includes('TTI')) && key.includes('(') && key.includes(')')) {
        const timeMatch = key.match(/\((\d{2}:\d{2}.*?\d{2}:\d{2})\)/);
        if (timeMatch) {
          const timeStr = timeMatch[1];
          // Only add if we haven't seen this time range before
          if (!availableHours.includes(timeStr)) {
            availableHours.push(timeStr);
          }
        }
      }
    });
  }

  // Origins
  if (originSelect) {
    clearOptions(originSelect);
    uniqueOrigins.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o;
      originSelect.appendChild(opt);
    });
  }

  // Destinations
  if (destinationSelect) {
    clearOptions(destinationSelect);
    uniqueDestinations.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      destinationSelect.appendChild(opt);
    });
  }

  // Hours - use detected hours or fallback
  if (hourSelect) {
    clearOptions(hourSelect);
    const hoursToUse = availableHours.length > 0 ? availableHours : [
      '12:00–13:00','13:00–14:00','14:00–15:00','15:00–16:00','16:00–17:00',
      '17:00–18:00','18:00–19:00','19:00–20:00','20:00–21:00'
    ];
    hoursToUse.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      hourSelect.appendChild(opt);
    });
  }
}

// Filter and render results table
function renderFilteredResults() {
  if (!routeResults) return;
  // Determine desired scenario display name from selector
  const optionValue = sel ? sel.value : '';
  const optionText = sel ? (sel.options[sel.selectedIndex]?.text || '') : '';
  const mapScenario = (val) => {
    const m = {
      // Match CSV's Scenario Name exactly
      model_scenario_1: 'Model Scenario 1',
      baseline_scenario: 'Baseline Scenario',
    };
    return m[val] || optionText;
  };
  const desiredScenario = mapScenario(optionValue);
  const origin = originSelect ? originSelect.value : '';
  const destination = destinationSelect ? destinationSelect.value : '';
  const hour = hourSelect ? hourSelect.value : '';

  // Don't show table if no selections are made
  if (!origin || !destination || !hour) {
    routeResults.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">Select origin, destination, and hour to view scenario performance.</div>';
    hideRouteMap();
    return;
  }

  // Filter scenario rows by scenario name (exact match ignoring spaces issues)
  const normalize = (s) => (s || '').toString().replace(/\s+/g,' ').trim().toLowerCase();
  const desiredNorm = normalize(desiredScenario);
  let scenFiltered = scenarioPerformanceRows.filter(r => normalize(r['Scenario Name']) === desiredNorm);
  // If no matches, don't filter by scenario to avoid empty results
  if (scenFiltered.length === 0) scenFiltered = scenarioPerformanceRows.slice();

  // OD filter: match Origin and Destination columns
  const byOrigin = origin ? scenFiltered.filter(r => {
    const rowOrigin = (r['Origion'] || r['Origin'] || '').trim();
    return rowOrigin === origin.trim();
  }) : scenFiltered;
  
  const byOD = destination ? byOrigin.filter(r => {
    const rowDest = (r['Destination'] || '').trim();
    return rowDest === destination.trim();
  }) : byOrigin;

  // Robust hour column picker to handle encoding variants in headers
  function pickHourValue(row, hourLabel, prefix = 'Speed') {
    if (!hourLabel) return '';
    const desired = hourLabel.replace(/\s/g, '').replace(/[-–—]/g, '-');
    const desiredDigits = desired.replace(/[^0-9:]/g, ''); // e.g., 12:00:13:00
    const keys = Object.keys(row);

    // 1) Exact match for common patterns
    const candidates = [
      `${prefix} (${hourLabel.replace(/\s/g,'')})`,
      `${prefix} (${hourLabel})`,
    ];
    for (const c of candidates) {
      if (c in row) return row[c];
    }

    // 2) Normalize keys by removing spaces and unifying dashes, then compare
    let match = keys.find(k => {
      const norm = k.replace(/\s/g,'').replace(/[-–—]/g,'-');
      return norm.includes(`${prefix}(`) && norm.includes(desired);
    });
    if (match) return row[match];

    // 3) Fallback: compare only time digits to survive mojibake (e.g., 12:00�13:00)
    match = keys.find(k => {
      const digits = k.replace(/\s/g,'').replace(/[^0-9:]/g,'');
      return digits.includes(desiredDigits) && k.includes(prefix);
    });
    return match ? row[match] : '';
  }

  // Build table
  if (byOD.length === 0) {
    routeResults.innerHTML = '<div style="padding: 16px; color:#666;">No data found for the selected origin, destination, and hour combination. Try selecting different values.</div>';
    hideRouteMap();
    return;
  }

  const rowsHtml = byOD.map(r => {
    const hourVal = hour ? pickHourValue(r, hour) : '';
    const typicalSpeed = hour ? pickHourValue(r, hour, 'Typical Speed') : '';
    const eventSpeed = hour ? pickHourValue(r, hour, 'Event Day Speed') : '';
    const typicalTravelTime = hour ? pickHourValue(r, hour, 'Typical Travel Time') : '';
    const eventTravelTime = hour ? pickHourValue(r, hour, 'Event Day Travel Time') : '';
    const typicalTTI = hour ? pickHourValue(r, hour, 'Typical TTI') : '';
    const eventTTI = hour ? pickHourValue(r, hour, 'Event Day TTI') : '';
    
    return `<tr>
      <td>${r['Route Name'] || ''}</td>
      <td>${r['Origion'] || r['Origin'] || ''}</td>
      <td>${r['Destination'] || ''}</td>
      <td style="text-align:right;">${r['Route Distance (mile)'] || ''}</td>
      <td style="text-align:right;">${typicalSpeed}</td>
      <td style="text-align:right;">${eventSpeed}</td>
      <td style="text-align:right;">${typicalTravelTime}</td>
      <td style="text-align:right;">${eventTravelTime}</td>
      <td style="text-align:right;">${typicalTTI}</td>
      <td style="text-align:right;">${eventTTI}</td>
    </tr>`;
  }).join('');

  routeResults.innerHTML = `
    <div style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Route</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Origin</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Destination</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Distance (mi)</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Typical Speed</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Event Speed</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Typical Travel Time (mins)</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Event Day Travel Time (mins)</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Typical TTI</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Event TTI</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
  
  // Show map if we have a valid route
  if (byOD.length > 0 && origin && destination) {
    showRouteMap(origin, destination, byOD[0]);
    displayRidershipTable();
  } else {
    hideRouteMap();
  }
}

// Initialize Leaflet map
function initializeLeafletMap() {
  if (leafletMap) {
    leafletMap.remove();
  }
  
  // Houston area center coordinates
  const houstonCenter = [29.7604, -95.3698];
  
  leafletMap = L.map('mapContainer').setView(houstonCenter, 10);
  
  // Add Esri satellite imagery tile layer (same as Supply Scenario)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  }).addTo(leafletMap);
  
  // Initialize route layer
  routeLayer = L.layerGroup().addTo(leafletMap);
}

// Get coordinates for locations (simplified mapping)
function getLocationCoordinates(location) {
  const coordinates = {
    'Airport - George Bush Intercontinental Airport': [29.9844, -95.3414],
    'Medical Center': [29.7058, -95.3974],
    'Galleria': [29.7377, -95.4619],
    'NRG Stadium': [29.6847, -95.4107],
    'Houston Dash & Dynamo Stadium': [29.7556, -95.3556],
    'Houston Sports Park': [29.6231, -95.4347],
    'Downtown': [29.7604, -95.3698]
  };
  
  return coordinates[location] || [29.7604, -95.3698]; // Default to Houston center
}

// Show route map for selected origin/destination
async function showRouteMap(origin, destination, routeData) {
  if (!routeMapDiv || !mapContainer) return;
  
  routeMapDiv.style.display = 'block';
  
  // Initialize map if not already done
  if (!leafletMap) {
    initializeLeafletMap();
  }
  
  // Clear previous route
  if (routeLayer) {
    routeLayer.clearLayers();
  }
  
  // Get fallback coordinates for origin and destination (will be updated from GeoJSON if available)
  let originCoords = getLocationCoordinates(origin);
  let destCoords = getLocationCoordinates(destination);
  
  // Markers will be created after we load the GeoJSON and get actual route coordinates
  let originMarker = null;
  let destMarker = null;
  
  // Load and display routes from GeoJSON
  try {
    const response = await fetch('data/performance measure/unique_priority_routes.geojson');
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    const geojsonData = await response.json();
    
    console.log('GeoJSON loaded:', geojsonData.features.length, 'features');
    console.log('Looking for routes from:', origin, 'to:', destination);
    
    // Normalize location names for matching (handle variations and typos)
    const normalizeLocation = (name) => {
      if (!name) return '';
      return name.trim().toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[\/\-]/g, ' ')
        .replace(/&/g, 'and')
        .replace(/[.,]/g, '');
    };
    
    // Extract key words from location names for better matching
    const extractKeyWords = (name) => {
      const normalized = normalizeLocation(name);
      // Remove common words that don't help with matching
      const stopWords = ['the', 'at', 'to', 'and', 'of', 'houston', 'center', 'centre'];
      return normalized.split(' ')
        .filter(word => word.length > 2 && !stopWords.includes(word))
        .sort()
        .join(' ');
    };
    
    // Check if two location names match (handles partial matches)
    const locationsMatch = (name1, name2) => {
      if (!name1 || !name2) return false;
      
      const norm1 = normalizeLocation(name1);
      const norm2 = normalizeLocation(name2);
      
      // Exact match
      if (norm1 === norm2) {
        console.log('Exact match:', name1, '===', name2);
        return true;
      }
      
      // Check if one contains the other (for partial matches)
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        const shorter = norm1.length < norm2.length ? norm1 : norm2;
        // Lower threshold for matching - allow shorter strings
        if (shorter.length >= 3) {
          console.log('Partial match:', name1, 'contains', name2);
          return true;
        }
      }
      
      // Try key word matching for cases like "Medical Center" vs "Intercontinental Houston Medical Center"
      const keywords1 = extractKeyWords(name1);
      const keywords2 = extractKeyWords(name2);
      
      if (keywords1 && keywords2) {
        // Check if all key words from shorter name are in longer name
        const shorterKeywords = keywords1.length < keywords2.length ? keywords1 : keywords2;
        const longerKeywords = keywords1.length >= keywords2.length ? keywords1 : keywords2;
        
        if (shorterKeywords && longerKeywords.includes(shorterKeywords)) {
          console.log('Keyword match:', name1, 'keywords match', name2);
          return true;
        }
        
        // Check individual word matches
        const shorterWords = shorterKeywords.split(' ').filter(w => w.length >= 4);
        const longerWords = longerKeywords.split(' ');
        const matches = shorterWords.filter(w => longerWords.some(lw => lw.includes(w) || w.includes(lw)));
        
        if (matches.length > 0 && matches.length === shorterWords.length) {
          console.log('Word match:', name1, 'words match', name2);
          return true;
        }
      }
      
      // Special cases for common location names
      const specialMatches = {
        'medical center': ['intercontinental houston medical center', 'westin medical center'],
        'galleria': ['hyatt regency houston galleria', 'jw marriott at the galleria'],
        'nrg stadium': ['nrg stadium'],
        'airport': ['george bush intercontinental airport', 'intercontinental']
      };
      
      const checkSpecial = (n1, n2) => {
        const n1Lower = normalizeLocation(n1);
        const n2Lower = normalizeLocation(n2);
        for (const [key, values] of Object.entries(specialMatches)) {
          if (n1Lower.includes(key) && values.some(v => n2Lower.includes(v))) return true;
          if (n2Lower.includes(key) && values.some(v => n1Lower.includes(v))) return true;
        }
        return false;
      };
      
      if (checkSpecial(name1, name2)) {
        console.log('Special case match:', name1, 'matches', name2);
        return true;
      }
      
      return false;
    };
    
    // Filter routes that match the selected origin and destination
    // Also try reverse direction matching
    const matchingRoutes = geojsonData.features.filter(feature => {
      const featureOrigin = feature.properties.Origin || '';
      const featureDest = feature.properties.Destinatio || feature.properties.Destination || '';
      
      // Try forward direction
      const forwardMatch = locationsMatch(featureOrigin, origin) && locationsMatch(featureDest, destination);
      
      // Try reverse direction (in case route is stored backwards)
      const reverseMatch = locationsMatch(featureOrigin, destination) && locationsMatch(featureDest, origin);
      
      if (forwardMatch) {
        console.log('Found matching route (forward):', featureOrigin, '->', featureDest);
      }
      if (reverseMatch) {
        console.log('Found matching route (reverse):', featureDest, '->', featureOrigin);
      }
      
      return forwardMatch || reverseMatch;
    });
    
    console.log('Found', matchingRoutes.length, 'matching routes');
    
    // Debug: log all available routes if no matches found
    if (matchingRoutes.length === 0) {
      console.log('No matches found. Available routes in GeoJSON:');
      geojsonData.features.forEach((feature, idx) => {
        console.log(`  ${idx + 1}. ${feature.properties.Origin || 'N/A'} -> ${feature.properties.Destinatio || feature.properties.Destination || 'N/A'}`);
      });
    }
    
    // Display routes on the map
    const routeLines = [];
    const allRouteLines = [];
    let firstMatchingRoute = null; // Store first matching route to get origin/dest coordinates
    
    // First, add all routes from GeoJSON (for debugging and to show available routes)
    geojsonData.features.forEach((feature, index) => {
      // Check if geometry exists and is valid
      if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn('Feature has no valid geometry:', feature);
        return;
      }
      
      let coordinates = [];
      
      // Handle different geometry types
      if (feature.geometry.type === 'LineString') {
        // Single line string - coordinates is an array of [lon, lat] or [lon, lat, elevation] pairs
        coordinates = feature.geometry.coordinates.map(coord => {
          if (!Array.isArray(coord) || coord.length < 2) {
            return null;
          }
          // Handle coordinates with or without elevation: [lon, lat] or [lon, lat, elevation]
          const lon = parseFloat(coord[0]);
          const lat = parseFloat(coord[1]);
          if (isNaN(lon) || isNaN(lat)) {
            console.warn('Invalid coordinate values:', coord);
            return null;
          }
          return [lat, lon]; // Convert [lon, lat] to [lat, lon] for Leaflet
        }).filter(coord => coord !== null);
      } else if (feature.geometry.type === 'MultiLineString') {
        // MultiLineString - coordinates is an array of arrays of [lon, lat] pairs
        // Flatten all line segments into one continuous line
        coordinates = feature.geometry.coordinates.flat().map(coord => {
          if (!Array.isArray(coord) || coord.length < 2) {
            return null;
          }
          const lon = parseFloat(coord[0]);
          const lat = parseFloat(coord[1]);
          if (isNaN(lon) || isNaN(lat)) {
            console.warn('Invalid coordinate values:', coord);
            return null;
          }
          return [lat, lon]; // Convert [lon, lat] to [lat, lon] for Leaflet
        }).filter(coord => coord !== null);
      } else {
        console.warn('Unsupported geometry type:', feature.geometry.type, 'for feature:', feature.properties);
        return;
      }
      
      if (coordinates.length === 0) {
        console.warn('No valid coordinates after conversion for feature:', feature.properties);
        return;
      }
      
      console.log(`Processing route ${index + 1}: ${coordinates.length} coordinate points`, 
        `(from ${feature.properties.Origin || 'N/A'} to ${feature.properties.Destinatio || feature.properties.Destination || 'N/A'})`);
      
      // Check if this route matches the selected origin/destination
      const featureOrigin = feature.properties.Origin || '';
      const featureDest = feature.properties.Destinatio || feature.properties.Destination || '';
      const isMatch = matchingRoutes.includes(feature);
      
      // If no exact matches, try partial matching
      let shouldShow = isMatch;
      if (!shouldShow && matchingRoutes.length === 0) {
        const originMatches = locationsMatch(featureOrigin, origin) || locationsMatch(featureDest, origin);
        const destMatches = locationsMatch(featureOrigin, destination) || locationsMatch(featureDest, destination);
        shouldShow = originMatches || destMatches;
      }
      
      // Only show matching routes (or all routes if no matches found, for debugging)
      if (!shouldShow && matchingRoutes.length > 0) {
        return; // Skip non-matching routes if we have matches
      }
      
      // Store first matching route to use its coordinates for origin/destination markers
      if (shouldShow && !firstMatchingRoute && coordinates.length > 0) {
        firstMatchingRoute = {
          coordinates: coordinates,
          origin: featureOrigin,
          dest: featureDest
        };
        
        // Verify the route matches the selected origin and destination
        // Use route coordinates only if they match the selected locations
        const originMatches = locationsMatch(featureOrigin, origin);
        const destMatches = locationsMatch(featureDest, destination);
        
        if (originMatches && destMatches) {
          // Route matches - use route coordinates
          originCoords = coordinates[0]; // First coordinate is origin
          destCoords = coordinates[coordinates.length - 1]; // Last coordinate is destination
          console.log('Using route coordinates for markers:', {
            origin: origin,
            originCoords: originCoords,
            destination: destination,
            destCoords: destCoords
          });
        } else {
          // Route doesn't match exactly - use fallback coordinates from dropdown selections
          originCoords = getLocationCoordinates(origin);
          destCoords = getLocationCoordinates(destination);
          console.log('Using fallback coordinates for markers:', {
            origin: origin,
            originCoords: originCoords,
            destination: destination,
            destCoords: destCoords
          });
        }
      }
      
      // Style matching routes
      const routeLine = L.polyline(coordinates, {
        color: shouldShow ? '#2196F3' : '#CCCCCC',
        weight: shouldShow ? 5 : 3,
        opacity: shouldShow ? 0.8 : 0.3
      }).addTo(routeLayer);
      
      // Add popup with route information
      const routeName = feature.properties.Route_Name || feature.properties.RouteName || 'Route';
      const routeInfo = `
        <div style="text-align: center;">
          <strong>${routeName}</strong><br>
          ${routeData && shouldShow ? `<strong>Distance:</strong> ${routeData['Route Distance (mile)'] || 'N/A'} miles<br>` : ''}
          <strong>From:</strong> ${featureOrigin}<br>
          <strong>To:</strong> ${featureDest}
          ${shouldShow ? '<br><span style="color: #2196F3; font-weight: bold;">✓ Matching Route</span>' : ''}
        </div>
      `;
      routeLine.bindPopup(routeInfo);
      
      if (shouldShow) {
        routeLines.push(routeLine);
      }
      allRouteLines.push(routeLine);
    });
    
    // Create origin and destination markers using coordinates that match the dropdown selections
    // Verify that coordinates match the selected origin and destination
    let finalOriginCoords = originCoords;
    let finalDestCoords = destCoords;
    
    // If we have a matching route, verify it matches the dropdown selections
    if (firstMatchingRoute) {
      const routeOriginMatches = locationsMatch(firstMatchingRoute.origin, origin);
      const routeDestMatches = locationsMatch(firstMatchingRoute.dest, destination);
      
      if (routeOriginMatches && routeDestMatches) {
        // Route matches dropdown selections - use route coordinates
        finalOriginCoords = firstMatchingRoute.coordinates[0];
        finalDestCoords = firstMatchingRoute.coordinates[firstMatchingRoute.coordinates.length - 1];
        console.log('Using route coordinates - matches dropdown selections');
      } else {
        // Route doesn't match dropdown selections - use fallback coordinates
        finalOriginCoords = getLocationCoordinates(origin);
        finalDestCoords = getLocationCoordinates(destination);
        console.log('Route coordinates don\'t match dropdown - using fallback coordinates');
      }
    } else {
      // No matching route found - use fallback coordinates
      finalOriginCoords = getLocationCoordinates(origin);
      finalDestCoords = getLocationCoordinates(destination);
      console.log('No matching route - using fallback coordinates');
    }
    
    // Create markers with the selected origin/destination names displayed
    originMarker = L.marker(finalOriginCoords, {
      icon: L.divIcon({
        className: 'custom-marker origin-marker',
        html: `<div style="background: #4CAF50; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">ORIGIN: ${origin}</div>`,
        iconSize: [Math.max(120, origin.length * 7 + 40), 30],
        iconAnchor: [Math.max(60, origin.length * 3.5 + 20), 15]
      })
    }).addTo(routeLayer);
    
    destMarker = L.marker(finalDestCoords, {
      icon: L.divIcon({
        className: 'custom-marker destination-marker',
        html: `<div style="background: #FF9800; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">DEST: ${destination}</div>`,
        iconSize: [Math.max(120, destination.length * 7 + 50), 30],
        iconAnchor: [Math.max(60, destination.length * 3.5 + 25), 15]
      })
    }).addTo(routeLayer);
    
    // Add popups with location names from dropdown selections
    originMarker.bindPopup(`<strong>Origin:</strong><br>${origin}`);
    destMarker.bindPopup(`<strong>Destination:</strong><br>${destination}`);
    
    if (routeLines.length > 0 || allRouteLines.length > 0) {
      // Fit map to show matching routes (or all routes if no matches)
      const featuresToFit = routeLines.length > 0 
        ? [originMarker, destMarker, ...routeLines]
        : [originMarker, destMarker, ...allRouteLines];
      const group = new L.featureGroup(featuresToFit);
      
      // Get bounds and add padding to ensure full route is visible
      const bounds = group.getBounds();
      leafletMap.fitBounds(bounds, {
        padding: [50, 50], // Add 50px padding on all sides
        maxZoom: 15 // Limit max zoom to ensure full route is visible
      });
      
      console.log('Successfully displayed', routeLines.length || allRouteLines.length, 'routes on map');
      console.log('Map bounds:', bounds.toBBoxString());
    } else {
      // If no routes found at all, create markers with fallback coordinates matching dropdown selections
      if (!originMarker || !destMarker) {
        // Use coordinates that match the dropdown selections
        const fallbackOriginCoords = getLocationCoordinates(origin);
        const fallbackDestCoords = getLocationCoordinates(destination);
        
        originMarker = L.marker(fallbackOriginCoords, {
          icon: L.divIcon({
            className: 'custom-marker origin-marker',
            html: `<div style="background: #4CAF50; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">ORIGIN: ${origin}</div>`,
            iconSize: [Math.max(120, origin.length * 7 + 40), 30],
            iconAnchor: [Math.max(60, origin.length * 3.5 + 20), 15]
          })
        }).addTo(routeLayer);
        
        destMarker = L.marker(fallbackDestCoords, {
          icon: L.divIcon({
            className: 'custom-marker destination-marker',
            html: `<div style="background: #FF9800; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">DEST: ${destination}</div>`,
            iconSize: [Math.max(120, destination.length * 7 + 50), 30],
            iconAnchor: [Math.max(60, destination.length * 3.5 + 25), 15]
          })
        }).addTo(routeLayer);
        
        originMarker.bindPopup(`<strong>Origin:</strong><br>${origin}`);
        destMarker.bindPopup(`<strong>Destination:</strong><br>${destination}`);
      }
      
      // Show a straight line as fallback using coordinates matching dropdown selections
      const fallbackOriginCoords = getLocationCoordinates(origin);
      const fallbackDestCoords = getLocationCoordinates(destination);
      const routeLine = L.polyline([fallbackOriginCoords, fallbackDestCoords], {
        color: '#2196F3',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(routeLayer);
      
      // Add route info popup to the line
      routeLine.bindPopup(`
        <div style="text-align: center;">
          <strong>${routeData ? (routeData['Route Name'] || 'Route') : 'Route'}</strong><br>
          <strong>Distance:</strong> ${routeData ? (routeData['Route Distance (mile)'] || 'N/A') : 'N/A'} miles<br>
          <strong>From:</strong> ${origin}<br>
          <strong>To:</strong> ${destination}
        </div>
      `);
      
      // Fit map to show both points
      const group = new L.featureGroup([originMarker, destMarker, routeLine]);
      leafletMap.fitBounds(group.getBounds().pad(0.1));
    }
  } catch (error) {
    console.error('Error loading GeoJSON routes:', error);
    
    // Create markers with fallback coordinates matching dropdown selections
    const errorOriginCoords = getLocationCoordinates(origin);
    const errorDestCoords = getLocationCoordinates(destination);
    
    originMarker = L.marker(errorOriginCoords, {
      icon: L.divIcon({
        className: 'custom-marker origin-marker',
        html: `<div style="background: #4CAF50; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">ORIGIN: ${origin}</div>`,
        iconSize: [Math.max(120, origin.length * 7 + 40), 30],
        iconAnchor: [Math.max(60, origin.length * 3.5 + 20), 15]
      })
    }).addTo(routeLayer);
    
    destMarker = L.marker(errorDestCoords, {
      icon: L.divIcon({
        className: 'custom-marker destination-marker',
        html: `<div style="background: #FF9800; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">DEST: ${destination}</div>`,
        iconSize: [Math.max(120, destination.length * 7 + 50), 30],
        iconAnchor: [Math.max(60, destination.length * 3.5 + 25), 15]
      })
    }).addTo(routeLayer);
    
    originMarker.bindPopup(`<strong>Origin:</strong><br>${origin}`);
    destMarker.bindPopup(`<strong>Destination:</strong><br>${destination}`);
    
    // Fallback: Draw a line between origin and destination if GeoJSON fails to load
    const routeLine = L.polyline([errorOriginCoords, errorDestCoords], {
      color: '#2196F3',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(routeLayer);
    
    // Add route info popup to the line
    routeLine.bindPopup(`
      <div style="text-align: center;">
        <strong>${routeData ? (routeData['Route Name'] || 'Route') : 'Route'}</strong><br>
        <strong>Distance:</strong> ${routeData ? (routeData['Route Distance (mile)'] || 'N/A') : 'N/A'} miles<br>
        <strong>From:</strong> ${origin}<br>
        <strong>To:</strong> ${destination}
      </div>
    `);
    
    // Fit map to show both points
    const group = new L.featureGroup([originMarker, destMarker, routeLine]);
    leafletMap.fitBounds(group.getBounds().pad(0.1));
  }
}

// Hide route map
function hideRouteMap() {
  if (routeMapDiv) {
    routeMapDiv.style.display = 'none';
  }
  // Hide ridership table
  const ridershipTable = document.getElementById('ridershipTable');
  if (ridershipTable) {
    ridershipTable.style.display = 'none';
  }
}

// Display ridership table
function displayRidershipTable() {
  const ridershipTable = document.getElementById('ridershipTable');
  const ridershipTableContent = document.getElementById('ridershipTableContent');
  
  if (!ridershipTable || !ridershipTableContent) return;
  
  // Check if ridership data is available
  if (!eventDataCache[currentEvent] || !eventDataCache[currentEvent].ridership || eventDataCache[currentEvent].ridership.length === 0) {
    ridershipTable.style.display = 'none';
    return;
  }
  
  const ridershipData = eventDataCache[currentEvent].ridership;
  
  // Filter out empty rows and build table
  const validRows = ridershipData.filter(row => {
    const mode = (row.Mode || '').trim();
    const boarding = (row.Boarding || '').trim();
    return mode || boarding;
  });
  
  if (validRows.length === 0) {
    ridershipTable.style.display = 'none';
    return;
  }
  
  // Function to get icon for each mode
  const getModeIcon = (mode, number) => {
    if (!mode && number) {
      // Sub-items like Red Line, Green Line, etc.
      const lineName = number.toLowerCase();
      if (lineName.includes('red')) return '🔴';
      if (lineName.includes('green')) return '🟢';
      if (lineName.includes('purple')) return '🟣';
      if (lineName.includes('blue')) return '🔵';
      if (lineName.includes('orange')) return '🟠';
      if (lineName.includes('yellow')) return '🟡';
      return '🚇'; // Default train icon for lines
    }
    
    const modeLower = mode.toLowerCase();
    if (modeLower.includes('bus')) {
      if (modeLower.includes('express')) return '🚌'; // Express bus
      if (modeLower.includes('commuter')) return '🚍'; // Commuter bus
      return '🚌'; // Local bus
    }
    if (modeLower.includes('rail') || modeLower.includes('light rail')) {
      return '🚊'; // Light rail/tram
    }
    if (modeLower.includes('commuter')) {
      return '🚆'; // Commuter rail
    }
    if (modeLower.includes('brt')) {
      return '🚎'; // BRT (Bus Rapid Transit)
    }
    if (modeLower.includes('total')) {
      return '📊'; // Total/sum icon
    }
    return '🚇'; // Default transit icon
  };
  
  // Build table HTML
  const tableRows = validRows.map(row => {
    const mode = (row.Mode || '').trim();
    const number = (row.Number || '').trim();
    const boarding = (row.Boarding || '').trim();
    
    // Format boarding number with commas
    const boardingFormatted = boarding ? parseInt(boarding).toLocaleString() : '';
    
    // Check if this is a total row
    const isTotal = mode.toLowerCase() === 'total' || (!mode && !number && boarding);
    const rowStyle = isTotal ? 'background:#f5f5f5; font-weight:bold;' : '';
    
    // Get icon for this mode
    const icon = getModeIcon(mode, number);
    
    // Handle different row types:
    // 1. Rows with Mode (main categories)
    // 2. Rows with only Number (sub-items like Red Line, Green Line, etc.)
    // 3. Total row (no Mode, no Number, but has Boarding)
    let modeCell;
    let numberCell;
    
    if (mode) {
      // Main category row
      modeCell = `<td style="padding:8px; ${rowStyle}"><span style="font-size:16px; margin-right:6px;">${icon}</span>${mode}</td>`;
      numberCell = `<td style="text-align:center; padding:8px; ${rowStyle}">${number || ''}</td>`;
    } else if (number && !mode) {
      // Sub-item row (like Red Line, Green Line, etc.)
      modeCell = `<td style="padding-left:20px; padding:8px; ${rowStyle}"><span style="font-size:14px; margin-right:6px;">${icon}</span>${number}</td>`;
      numberCell = `<td style="text-align:center; padding:8px; ${rowStyle}"></td>`;
    } else {
      // Total row or other special cases
      modeCell = `<td style="padding:8px; ${rowStyle}"><span style="font-size:16px; margin-right:6px;">${icon}</span>${mode || 'Total'}</td>`;
      numberCell = `<td style="text-align:center; padding:8px; ${rowStyle}">${number || ''}</td>`;
    }
    
    return `<tr style="${rowStyle}">
      ${modeCell}
      ${numberCell}
      <td style="text-align:right; padding:8px; ${rowStyle}">${boardingFormatted || ''}</td>
    </tr>`;
  }).join('');
  
  ridershipTableContent.innerHTML = `
    <div style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Mode</th>
            <th style="text-align:center; padding:8px; border-bottom:1px solid #eee;">Number</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Boarding</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
  
  ridershipTable.style.display = 'block';
}

// Handlers
if (originSelect) originSelect.addEventListener('change', renderFilteredResults);
if (destinationSelect) destinationSelect.addEventListener('change', renderFilteredResults);
if (hourSelect) hourSelect.addEventListener('change', renderFilteredResults);

// Create fallback data when CSV loading fails
function createFallbackData() {
  const fallbackProfiles = {
    arrival: [10, 15, 25, 40, 60, 80, 75, 65, 55, 45, 35, 30, 25, 20, 15, 10, 8, 5, 3, 2],
    departure: [5, 8, 12, 20, 35, 55, 70, 85, 90, 85, 75, 60, 45, 35, 25, 20, 15, 10, 8, 5],
    timeRanges: [
      '00:00 - 01:00', '01:00 - 02:00', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00',
      '05:00 - 06:00', '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
      '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
      '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00'
    ]
  };
  
  const fallbackSpecialEvent = {
    EVENT: 'Model Scenario 1',
    DATE: 'Simulation Run',
    'TIME OF EVENT': 'Various',
    'EVENT BOARDINGS': '5000',
    'DAY OF EVENT RIDERSHIP': '25000',
    'AVERAGE MONTHLY DAILY RIDERSHIP': '18000',
    TIMEFRAME: 'All Day'
  };
  
  // Create fallback OD data
  const fallbackTrips = {
    'Parklot': {
      'Parklot': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Rideshare': [10, 15, 20, 25, 30, 35, 40, 45, 50, 45, 40, 35, 30, 25, 20, 15, 10, 8, 5, 3],
      'Region 3': [5, 8, 12, 15, 18, 22, 25, 28, 30, 28, 25, 22, 18, 15, 12, 8, 5, 3, 2, 1],
      'Region 4': [3, 5, 8, 10, 12, 15, 18, 20, 22, 20, 18, 15, 12, 10, 8, 5, 3, 2, 1, 0]
    },
    'Rideshare': {
      'Parklot': [8, 12, 16, 20, 24, 28, 32, 36, 40, 36, 32, 28, 24, 20, 16, 12, 8, 6, 4, 2],
      'Rideshare': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Region 3': [4, 6, 8, 10, 12, 14, 16, 18, 20, 18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1],
      'Region 4': [2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 0]
    },
    'Region 3': {
      'Parklot': [6, 9, 12, 15, 18, 21, 24, 27, 30, 27, 24, 21, 18, 15, 12, 9, 6, 4, 3, 1],
      'Rideshare': [4, 6, 8, 10, 12, 14, 16, 18, 20, 18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1],
      'Region 3': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Region 4': [3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]
    },
    'Region 4': {
      'Parklot': [4, 6, 8, 10, 12, 14, 16, 18, 20, 18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1],
      'Rideshare': [3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1],
      'Region 3': [2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 0],
      'Region 4': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  };
  
  eventDataCache[currentEvent] = {
    trips: fallbackTrips,
    percent: fallbackTrips, // Use same data for percentage
    profiles: fallbackProfiles,
    specialEvent: fallbackSpecialEvent
  };
}

// Function to build matrix for a specific time period
function buildMatrix(timeIndex, dataType = 'trips') {
  if (!eventDataCache[currentEvent]) {
    return [];
  }
  
  const odData = eventDataCache[currentEvent][dataType];
  const matrix = [];
  
  locations.forEach(origin => {
    const row = [];
    locations.forEach(dest => {
      if (!odData[origin] || !odData[origin][dest]) {
        row.push(0);
      } else if (timeIndex === 'all') {
        // Sum all time periods
        const total = odData[origin][dest].reduce((sum, val) => sum + val, 0);
        row.push(total);
      } else {
        row.push(odData[origin][dest][timeIndex] || 0);
      }
    });
    matrix.push(row);
  });
  
  return matrix;
}

// Draw interactive chord diagram
function drawChordDiagram(timeIndex = 'all', dataType = 'trips') {
  const container = document.getElementById('chordDiagram');
  
  if (!container) {
    console.warn('Chord diagram container not found');
    return;
  }
  
  container.innerHTML = '';
  
  if (!dataLoaded) {
    container.innerHTML = '<div style="padding: 50px; text-align: center;">Loading data...</div>';
    return;
  }
  
  const matrix = buildMatrix(timeIndex, dataType);
  
  const width = 550;
  const height = 550;
  const outerRadius = Math.min(width, height) * 0.30;
  const innerRadius = outerRadius - 25;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('style', 'max-width: 550px; max-height: 550px;')
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);
  
  const colors = ['#4A90E2', '#E24A4A', '#50C878', '#FFB347'];
  
  const chord = d3.chord()
    .padAngle(0.05)
    .sortSubgroups(d3.descending);
  
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);
  
  const ribbon = d3.ribbon()
    .radius(innerRadius);
  
  const chords = chord(matrix);
  
  // Add groups (arcs)
  const group = svg.append('g')
    .selectAll('g')
    .data(chords.groups)
    .join('g');
  
  group.append('path')
    .attr('fill', d => colors[d.index])
    .attr('stroke', d => colors[d.index])
    .attr('d', arc)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.8);
      svg.selectAll('.ribbon')
        .style('opacity', r => (r.source.index === d.index || r.target.index === d.index) ? 0.8 : 0.1);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 1);
      svg.selectAll('.ribbon').style('opacity', 0.7);
    });
  
  // Add labels
  group.append('text')
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr('dy', '.35em')
    .attr('transform', d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${outerRadius + 40})
      ${d.angle > Math.PI ? 'rotate(180)' : ''}
    `)
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .style('pointer-events', 'none')
    .text(d => locations[d.index]);
  
  // Add ribbons (connections)
  svg.append('g')
    .attr('fill-opacity', 0.7)
    .selectAll('path')
    .data(chords)
    .join('path')
    .attr('class', 'ribbon')
    .attr('d', ribbon)
    .attr('fill', d => colors[d.source.index])
    .attr('stroke', d => colors[d.source.index])
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 1);
      // Show tooltip with flow information
      const valueLabel = dataType === 'trips' ? 'Trips' : 'Percentage';
      const valueFormatted = dataType === 'trips' ? d.source.value.toLocaleString() : d.source.value.toFixed(3) + '%';
      
      const tooltip = d3.select('body').append('div')
        .attr('class', 'chord-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '10000')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html(`<strong>${locations[d.source.index]} → ${locations[d.target.index]}</strong><br/>${valueLabel}: ${valueFormatted}`);
    })
    .on('mousemove', function(event) {
      d3.select('.chord-tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 0.7);
      d3.selectAll('.chord-tooltip').remove();
    });
}

// Time period controls
const timeSelector = document.getElementById('timeSelector');
const timeSlider = document.getElementById('timeSlider');
const playButton = document.getElementById('playButton');
const dataTypeRadios = document.querySelectorAll('input[name="dataType"]');
let playInterval = null;
let isPlaying = false;

// Event listeners for data type toggle
dataTypeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentDataType = e.target.value;
    const timeValue = timeSelector.value;
    drawChordDiagram(timeValue, currentDataType);
  });
});

// Event listeners for time controls (guard for pages without these controls)
if (timeSelector) {
  timeSelector.addEventListener('change', () => {
    const value = timeSelector.value;
    if (value !== 'all' && timeSlider) {
      timeSlider.value = value;
    }
    drawChordDiagram(value, currentDataType);
    stopPlayback();
  });
}

if (timeSlider) {
  timeSlider.addEventListener('input', () => {
    const timeIndex = parseInt(timeSlider.value);
    if (timeSelector) timeSelector.value = timeIndex.toString();
    drawChordDiagram(timeIndex, currentDataType);
    stopPlayback();
  });
}

if (playButton) {
  playButton.addEventListener('click', () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });
}

function startPlayback() {
  isPlaying = true;
  playButton.textContent = '⏸ Pause';
  playButton.style.background = '#E24A4A';
  
  // Start from current position or beginning
  let currentIndex = parseInt(timeSlider.value);
  
  playInterval = setInterval(() => {
    currentIndex++;
    if (currentIndex > 18) {
      currentIndex = 0; // Loop back to start
    }
    timeSlider.value = currentIndex;
    timeSelector.value = currentIndex.toString();
    drawChordDiagram(currentIndex, currentDataType);
  }, 800); // Change every 800ms
}

function stopPlayback() {
  isPlaying = false;
  playButton.textContent = '▶ Play';
  playButton.style.background = '#4A90E2';
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

// Draw arrival/departure profile chart with axes and interactivity (same as Prior Events Analysis)
function drawProfileChart(svgId, profileType, color) {
  const svg = document.getElementById(svgId);
  
  // Check if element exists
  if (!svg) {
    console.warn(`Chart element ${svgId} not found`);
    return;
  }
  
  // Check if data is loaded
  if (!dataLoaded || !eventDataCache[currentEvent] || !eventDataCache[currentEvent].profiles) {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 400 200');
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#666');
    text.setAttribute('font-size', '14');
    text.textContent = 'Profile data unavailable';
    svg.appendChild(text);
    return;
  }
  
  const profiles = eventDataCache[currentEvent].profiles;
  
  // Get Auto and Rideshare data
  const autoVals = profileType === 'arrival' 
    ? (profiles.arrivalAuto || profiles.arrival || [])
    : (profiles.departureAuto || profiles.departure || []);
  const rideshareVals = profileType === 'arrival'
    ? (profiles.arrivalRideshare || [])
    : (profiles.departureRideshare || []);
  
  // Debug logging
  console.log(`Chart: ${svgId}, Profile Type: ${profileType}`);
  console.log('Auto values:', autoVals);
  console.log('Rideshare values:', rideshareVals);
  console.log('Has rideshare data:', rideshareVals.length > 0 && rideshareVals.some(v => v > 0));
  
  // Calculate max value across both series
  const max = Math.max(
    ...autoVals, 
    ...rideshareVals, 
    1
  );
  
  const w = 400, h = 200, p = 40, pTop = 10, pRight = 10;
  const chartWidth = w - p - pRight;
  const chartHeight = h - pTop - p;
  
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  
  // Create tooltip div if it doesn't exist
  let tooltip = document.getElementById(`${svgId}-tooltip`);
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = `${svgId}-tooltip`;
    tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.9); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; pointer-events: none; opacity: 0; transition: opacity 0.2s; z-index: 1000; white-space: nowrap;';
    document.body.appendChild(tooltip);
  }
  
  // Draw Y-axis
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg','line');
  yAxis.setAttribute('x1', p);
  yAxis.setAttribute('y1', pTop);
  yAxis.setAttribute('x2', p);
  yAxis.setAttribute('y2', h - p);
  yAxis.setAttribute('stroke', '#666');
  yAxis.setAttribute('stroke-width', '2');
  svg.appendChild(yAxis);
  
  // Draw X-axis
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg','line');
  xAxis.setAttribute('x1', p);
  xAxis.setAttribute('y1', h - p);
  xAxis.setAttribute('x2', w - pRight);
  xAxis.setAttribute('y2', h - p);
  xAxis.setAttribute('stroke', '#666');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);
  
  // Y-axis label
  const yLabel = document.createElementNS('http://www.w3.org/2000/svg','text');
  yLabel.setAttribute('x', -h/2);
  yLabel.setAttribute('y', 12);
  yLabel.setAttribute('transform', 'rotate(-90)');
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('fill', '#333');
  yLabel.setAttribute('font-size', '14');
  yLabel.setAttribute('font-weight', 'bold');
  yLabel.textContent = profileType === 'arrival' ? 'Arrivals' : 'Departures';
  svg.appendChild(yLabel);
  
  // X-axis label
  const xLabel = document.createElementNS('http://www.w3.org/2000/svg','text');
  xLabel.setAttribute('x', w/2);
  xLabel.setAttribute('y', h - 5);
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('fill', '#333');
  xLabel.setAttribute('font-size', '14');
  xLabel.setAttribute('font-weight', 'bold');
  xLabel.textContent = 'Time of Day';
  svg.appendChild(xLabel);
  
  // Y-axis ticks and labels
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const yPos = h - p - (i / yTicks) * chartHeight;
    const value = Math.round((i / yTicks) * max);
    
    // Tick line
    const tick = document.createElementNS('http://www.w3.org/2000/svg','line');
    tick.setAttribute('x1', p - 5);
    tick.setAttribute('y1', yPos);
    tick.setAttribute('x2', p);
    tick.setAttribute('y2', yPos);
    tick.setAttribute('stroke', '#666');
    tick.setAttribute('stroke-width', '1');
    svg.appendChild(tick);
    
    // Grid line
    const grid = document.createElementNS('http://www.w3.org/2000/svg','line');
    grid.setAttribute('x1', p);
    grid.setAttribute('y1', yPos);
    grid.setAttribute('x2', w - pRight);
    grid.setAttribute('y2', yPos);
    grid.setAttribute('stroke', '#eee');
    grid.setAttribute('stroke-width', '1');
    grid.setAttribute('stroke-dasharray', '2,2');
    svg.appendChild(grid);
    
    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x', p - 8);
    label.setAttribute('y', yPos + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', '#666');
    label.setAttribute('font-size', '11');
    label.textContent = value;
    svg.appendChild(label);
  }
  
  // Define colors for Auto and Rideshare
  const autoColor = profileType === 'arrival' ? '#4A90E2' : '#E24A4A'; // Blue for arrival auto, Red for departure auto
  const rideshareColor = profileType === 'arrival' ? '#50C878' : '#FFB347'; // Green for arrival rideshare, Orange for departure rideshare
  
  // Helper function to create line path
  const createLinePath = (values) => {
    if (!values || values.length === 0) return '';
    const stepX = chartWidth / (values.length - 1);
    let path = `M ${p} ${h - p - (values[0] / max) * chartHeight}`;
    for (let i = 1; i < values.length; i++) {
      const x = p + i * stepX;
      const y = h - p - (values[i] / max) * chartHeight;
      path += ` L ${x} ${y}`;
    }
    return path;
  };
  
  // Draw Auto line
  if (autoVals.length > 0) {
    const autoPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    autoPath.setAttribute('d', createLinePath(autoVals));
    autoPath.setAttribute('fill', 'none');
    autoPath.setAttribute('stroke', autoColor);
    autoPath.setAttribute('stroke-width', '2.5');
    autoPath.setAttribute('class', 'profile-line profile-line-auto');
    autoPath.style.cursor = 'pointer';
    svg.appendChild(autoPath);
    
    // Draw Auto points
    const stepX = chartWidth / (autoVals.length - 1);
    autoVals.forEach((v, i) => {
      const x = p + i * stepX;
      const y = h - p - (v / max) * chartHeight;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', autoColor);
      circle.setAttribute('class', 'profile-point profile-point-auto');
      circle.style.cursor = 'pointer';
      
      // Hover effects
      circle.addEventListener('mouseenter', function(e) {
        this.setAttribute('r', '5');
        const rect = svg.getBoundingClientRect();
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY - 30) + 'px';
        tooltip.innerHTML = `<strong>${profiles.timeRanges[i]}</strong><br/>Auto: <strong>${v.toLocaleString()}</strong>${rideshareVals[i] > 0 ? `<br/>Rideshare: <strong>${rideshareVals[i].toLocaleString()}</strong>` : ''}`;
        tooltip.style.opacity = '1';
      });
      
      circle.addEventListener('mousemove', function(e) {
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY - 30) + 'px';
      });
      
      circle.addEventListener('mouseleave', function() {
        this.setAttribute('r', '3');
        tooltip.style.opacity = '0';
      });
      
      svg.appendChild(circle);
    });
  }
  
  // Draw Rideshare line (always draw if we have data, even if some values are 0)
  if (rideshareVals.length > 0) {
    console.log('Drawing Rideshare line with', rideshareVals.length, 'values');
    console.log('Rideshare values:', rideshareVals);
    const ridesharePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ridesharePath.setAttribute('d', createLinePath(rideshareVals));
    ridesharePath.setAttribute('fill', 'none');
    ridesharePath.setAttribute('stroke', rideshareColor);
    ridesharePath.setAttribute('stroke-width', '2.5');
    ridesharePath.setAttribute('stroke-dasharray', '5,5');
    ridesharePath.setAttribute('class', 'profile-line profile-line-rideshare');
    ridesharePath.style.cursor = 'pointer';
    svg.appendChild(ridesharePath);
    
    // Draw Rideshare points
    const stepX = chartWidth / (rideshareVals.length - 1);
    rideshareVals.forEach((v, i) => {
      if (v > 0) {
        const x = p + i * stepX;
        const y = h - p - (v / max) * chartHeight;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', rideshareColor);
        circle.setAttribute('class', 'profile-point profile-point-rideshare');
        circle.style.cursor = 'pointer';
        
        // Hover effects
        circle.addEventListener('mouseenter', function(e) {
          this.setAttribute('r', '5');
          const rect = svg.getBoundingClientRect();
          tooltip.style.left = (e.pageX + 10) + 'px';
          tooltip.style.top = (e.pageY - 30) + 'px';
          tooltip.innerHTML = `<strong>${profiles.timeRanges[i]}</strong><br/>Auto: <strong>${autoVals[i].toLocaleString()}</strong><br/>Rideshare: <strong>${v.toLocaleString()}</strong>`;
          tooltip.style.opacity = '1';
        });
        
        circle.addEventListener('mousemove', function(e) {
          tooltip.style.left = (e.pageX + 10) + 'px';
          tooltip.style.top = (e.pageY - 30) + 'px';
        });
        
        circle.addEventListener('mouseleave', function() {
          this.setAttribute('r', '3');
          tooltip.style.opacity = '0';
        });
        
        svg.appendChild(circle);
      }
    });
  }
  
  // Add legend
  const legendY = pTop + 5;
  // Move legend more to the left for departure chart to avoid overlap
  const legendX = profileType === 'departure' ? w - pRight - 140 : w - pRight - 10;
  
  // Auto legend
  const autoLegendLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  autoLegendLine.setAttribute('x1', legendX - 60);
  autoLegendLine.setAttribute('y1', legendY);
  autoLegendLine.setAttribute('x2', legendX - 40);
  autoLegendLine.setAttribute('y2', legendY);
  autoLegendLine.setAttribute('stroke', autoColor);
  autoLegendLine.setAttribute('stroke-width', '2.5');
  svg.appendChild(autoLegendLine);
  
  const autoLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  autoLegendText.setAttribute('x', legendX - 35);
  autoLegendText.setAttribute('y', legendY + 4);
  autoLegendText.setAttribute('fill', '#333');
  autoLegendText.setAttribute('font-size', '10');
  autoLegendText.textContent = 'Auto';
  svg.appendChild(autoLegendText);
  
  // Rideshare legend (only if there's rideshare data)
  if (rideshareVals.length > 0) {
    const rideshareLegendLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rideshareLegendLine.setAttribute('x1', legendX - 60);
    rideshareLegendLine.setAttribute('y1', legendY + 15);
    rideshareLegendLine.setAttribute('x2', legendX - 40);
    rideshareLegendLine.setAttribute('y2', legendY + 15);
    rideshareLegendLine.setAttribute('stroke', rideshareColor);
    rideshareLegendLine.setAttribute('stroke-width', '2.5');
    rideshareLegendLine.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(rideshareLegendLine);
    
    const rideshareLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rideshareLegendText.setAttribute('x', legendX - 35);
    rideshareLegendText.setAttribute('y', legendY + 19);
    rideshareLegendText.setAttribute('fill', '#333');
    rideshareLegendText.setAttribute('font-size', '10');
    rideshareLegendText.textContent = 'Rideshare';
    svg.appendChild(rideshareLegendText);
  }
  
  // X-axis time labels (show every 3rd hour to avoid crowding)
  const numPoints = Math.max(autoVals.length, rideshareVals.length);
  const stepX = chartWidth / (numPoints - 1);
  for (let i = 0; i < numPoints; i++) {
    if (i % 3 === 0 || i === numPoints - 1) {
      const x = p + i * stepX;
      const timeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      timeLabel.setAttribute('x', x);
      timeLabel.setAttribute('y', h - p + 12);
      timeLabel.setAttribute('text-anchor', 'middle');
      timeLabel.setAttribute('fill', '#666');
      timeLabel.setAttribute('font-size', '10');
      if (profiles.timeRanges && profiles.timeRanges[i]) {
        timeLabel.textContent = profiles.timeRanges[i].split(' - ')[0];
      }
      svg.appendChild(timeLabel);
    }
  }
}

// Display traffic flow data (placeholder for traffic-specific metrics)
function displayTrafficFlowData() {
  const container = document.getElementById('trafficFlowData');
  
  if (!container) {
    console.warn('Traffic flow data container not found');
    return;
  }
  
  if (!dataLoaded || !eventDataCache[currentEvent]) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Loading traffic flow data...</p>';
    return;
  }
  
  const specialEvent = eventDataCache[currentEvent].specialEvent;
  
  // For now, use placeholder traffic flow metrics based on the special event data
  // This will be replaced with actual traffic data when available
  const eventBoardings = specialEvent['EVENT BOARDINGS']?.replace(/,/g, '') || '0';
  const dayRidership = specialEvent['DAY OF EVENT RIDERSHIP']?.replace(/,/g, '') || '0';
  
  // Calculate estimated traffic metrics (placeholder calculations)
  const estimatedVehicleTrips = Math.round(parseInt(eventBoardings) * 0.8); // Estimate 80% of boardings as vehicle trips
  const estimatedPeakHourTrips = Math.round(estimatedVehicleTrips * 0.15); // 15% in peak hour
  const avgTripDuration = Math.round(25 + Math.random() * 15); // Random between 25-40 minutes
  
  container.innerHTML = `
    <div style="padding: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Traffic Flow Analysis</h4>
      <div style="font-size: 13px; line-height: 1.4;">
        <p style="margin: 5px 0;"><strong>Estimated Vehicle Trips:</strong> ${estimatedVehicleTrips.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Peak Hour Volume:</strong> ${estimatedPeakHourTrips.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Avg Trip Duration:</strong> ${avgTripDuration} mins</p>
        <p style="margin: 8px 0; font-size: 11px; color: #666;"><em>Based on event data analysis</em></p>
        <div style="margin-top: 10px; padding: 8px; background: #f0f8ff; border-radius: 4px; border-left: 3px solid #4A90E2;">
          <p style="margin: 0; font-size: 12px; color: #2c5aa0;"><strong>Note:</strong> These are estimated traffic flow metrics based on available event data. Actual traffic data will be integrated when available.</p>
        </div>
      </div>
    </div>
  `;
}

// Legacy draw chart function for other charts
function drawChart(svgId, color){
  const svg = document.getElementById(svgId);
  
  // Check if element exists
  if (!svg) {
    console.warn(`Chart element ${svgId} not found`);
    return;
  }
  
  const w = 400, h = 160, p = 20;
  const vals = Array.from({length: 8}, () => Math.random() * 100 + 20);
  const max = Math.max(...vals);
  
  svg.innerHTML = '';
  vals.forEach((v, i) => {
    const x = p + i * 40;
    const barH = (v / max) * (h - p * 2);
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', h - p - barH);
    rect.setAttribute('width', 30);
    rect.setAttribute('height', barH);
    rect.setAttribute('fill', color);
    
    svg.appendChild(rect);
  });
}

// Update all charts and data
function update(){
  if (dataLoaded) {
    drawChordDiagram('all', 'trips');
    drawProfileChart('arrivalChart', 'arrival', 'var(--good)');
    drawProfileChart('departureChart', 'departure', 'var(--med)');
    displayTrafficFlowData();
  }
  drawChart('snapshotChart', 'var(--avg)');
}

// Initialize the application
initializeData();
