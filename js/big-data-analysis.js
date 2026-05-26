const MAPS = {
  jan8_college_football: "https://felt.com/embed/map/Event-1-NRG-Jan-8-2024-College-Football-copy-M2aOwIdcQaat71xrbsuTbB?loc=29.685,-95.411,12.56z",
  jan11_playoff: "https://felt.com/embed/map/Event-2-NRG-Jan-11-Playoff-copy-CSHN59AG9BT5KO1HZRoTWAbB?loc=29.69314,-95.41,12.56z",
  jun28_beyonce: "https://felt.com/embed/map/Event-3-NRG-Jun-28-Beyonce-Concert-copy-9CS5Yjof2TcyzNbEgkbTF9BA?loc=29.685,-95.411,12.56z",
  oct6_football: "https://felt.com/embed/map/Event4-NRG-Oct-6-2024-Football-Game-copy-MG79CIP7sTmS7yntvbbBYeC?loc=29.685,-95.411,12.56z",
  Sept_15_Chicago_Bears: "https://felt.com/embed/map/Event-5-Sept-15-2024-NRG-Stadium-Chicago-Bears-vs-Houston-Texans-start-time-5-20pm-XPdrKzcnT4WBVVLYfl1OSC?loc=29.7476,-95.5893,8.93z&legend=1&cooperativeGestures=1&link=1&geolocation=0&zoomControls=1&scaleBar=1",
  Dec_27_Texas_Bowl : "https://felt.com/embed/map/Event-6-Dec-27-2023-NRG-Stadium-Texas-Bowl-Oklahoma-State-vs-Texas-A-M-start-time-7-00pm-faph9CryqSVuaW1VnAj9BmSA?loc=29.7476,-95.5893,8.93z&legend=1&cooperativeGestures=1&link=1&geolocation=0&zoomControls=1&scaleBar=1",
  Mar_8_2025_Houston_Rodeo: "https://felt.com/embed/map/Event-7-Mar-8-2025-NRG-Stadium-Houston-Rodeo-start-time-2-45-p-m-concert-at-5-00pm-A9CbY1kh9AQIGgHPJKs9C2hzB?loc=29.7476,-95.5893,8.93z&legend=1&cooperativeGestures=1&link=1&geolocation=0&zoomControls=1&scaleBar=1",
  Oct_2_2024_Houston_Astros: "https://felt.com/embed/map/Event-8-Oct-2-2024-Daikin-Park-Houston-Astros-vs-Detroit-Tiger-Playoffs-start-time-3-00pm-V9CxplgFVSyiIIYNrlt0fuD?loc=29.8085,-95.4161,10.86z&legend=1&cooperativeGestures=1&link=1&geolocation=0&zoomControls=1&scaleBar=1",
  Mar_30_2025_Toyota_Center: "https://felt.com/embed/map/Event-9-Mar-30-2025-Toyota-Center-Millennium-Tour-Houston-2025-O8VwmCGJRRO9CO9AiwHBW1WA?loc=29.7476,-95.5893,8.93z&legend=1&cooperativeGestures=1&link=1&geolocation=0&zoomControls=1&scaleBar=1",
  Oct_25_2024_Shell_Energy: "https://felt.com/embed/map/Event-10-Oct-25-2024-Shell-Energy-Stadium-Kamala-Harris-Rally-EQCZ0HzZQl6LPeR4q9BTp1D?loc=29.7476,-95.5893,8.93z&legend=1&cooperativeGestures=1&link=1&geolocation=0&zoomControls=1&scaleBar=1"
};

// Initialize DOM elements
const sel = document.getElementById('eventSel');
const mapFrame = document.getElementById('mapFrame');
const buffer = document.getElementById('bufferRange');
const bufferOut = document.getElementById('bufferOut');
const additionalMetricsContainer = document.getElementById('additionalMetricsData');

// Post-Event Analysis DOM elements
const postEventSel = document.getElementById('postEventSel');
const postMapFrame = document.getElementById('postMapFrame');
const postOriginSelect = document.getElementById('postOriginSelect');
const postDestinationSelect = document.getElementById('postDestinationSelect');
const postHourSelect = document.getElementById('postHourSelect');
const postRouteResults = document.getElementById('postRouteResults');
const postRouteMapDiv = document.getElementById('postRouteMap');
const postMapContainer = document.getElementById('postMapContainer');

// Event listeners
sel.addEventListener('change', async () => { 
  mapFrame.src = MAPS[sel.value]; 
  
  // Load data for new event and update chord diagram
  currentEvent = sel.value;
  const container = document.getElementById('chordDiagram');
  container.innerHTML = '<div style="padding: 50px; text-align: center;">Loading data...</div>';
  
  try {
    await loadEventData(currentEvent);
    await loadStadiumAttendanceData();
    const timeValue = parseInt(document.getElementById('timeSelector').value) || 0;
    drawChordDiagram(timeValue, currentDataType);
    
    // Update arrival and departure charts
    drawProfileChart('arrivalChart', 'arrival', 'var(--good)');
    drawProfileChart('departureChart', 'departure', 'var(--med)');
    
    // Update special event data
    displaySpecialEventData();
    
    // Update additional metrics panel
    updateAdditionalMetrics(currentEvent);
    
    // Update shared header
    updateTransitAndMetricsHeader();
  } catch (error) {
    console.error('Error loading event data:', error);
    container.innerHTML = '<div style="padding: 50px; text-align: center; color: red;">Error loading data</div>';
    if (additionalMetricsContainer) {
      additionalMetricsContainer.innerHTML = '<p style="text-align: center; color: #b00020; padding: 20px;">Unable to load additional metrics.</p>';
    }
  }
});

if (buffer && bufferOut) {
  buffer.addEventListener('input', () => { 
    bufferOut.textContent = buffer.value + " mi"; 
    update(); 
  });
}

// Post-Event Analysis event listeners
if (postEventSel) {
  postEventSel.addEventListener('change', async () => { 
    if (postMapFrame) postMapFrame.src = MAPS[postEventSel.value]; 
    
    // Load data for post-event analysis
    try {
      await loadPostEventData(postEventSel.value);
      populatePostEventSelectors();
      renderPostEventFilteredResults();
      
      // Update post-event arrival and departure charts
      drawPostEventProfileChart('postArrivalChart', 'arrival', 'var(--good)');
      drawPostEventProfileChart('postDepartureChart', 'departure', 'var(--med)');
    } catch (error) {
      console.error('Error loading post-event data:', error);
      if (postRouteResults) postRouteResults.innerHTML = '<div style="padding: 30px; text-align: center; color: red;">Error loading data</div>';
    }
  });
}

// Post-Event Analysis dropdown event listeners
if (postOriginSelect) postOriginSelect.addEventListener('change', renderPostEventFilteredResults);
if (postDestinationSelect) postDestinationSelect.addEventListener('change', renderPostEventFilteredResults);
if (postHourSelect) postHourSelect.addEventListener('change', renderPostEventFilteredResults);

// OD data from CSV with time periods
const locations = ['Other', 'Parklot', 'Rideshare', 'around_NRG', 'downtown', 'galleria', 'hou_airport', 'iah_airport'];

// Function to format location names for display
function formatLocationName(location) {
  if (location === 'hou_airport') {
    return 'HOU Airport';
  } else if (location === 'iah_airport') {
    return 'IAH Airport';
  } else if (location === 'around_NRG') {
    return 'Around NRG';
  } else if (location === 'downtown') {
    return 'Downtown';
  } else if (location === 'galleria') {
    return 'Galleria';
  }
  return location;
}

const timeLabels = [
  '00:00 - 06:00', '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
  '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
  '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00', '23:00 - 00:00'
];

// Event to CSV file mapping
const EVENT_DATA_FILES = {
  jan8_college_football: {
    trips: 'data/priorEvents/OD_Hourly_Flows/NRG Jan 8 2024 College Football v4_grouped.csv',
    percent: 'data/Jan 8 2024 College Football_percent.csv',
    profiles: 'data/priorEvents/arrivalDeparture/NRG Jan 8 2024 College Football v4_grouped.csv',
    specialEvent: 'data/priorEvents/Jan 8 2024_Special Event.csv'
  },
  jan11_playoff: {
    trips: 'data/priorEvents/OD_Hourly_Flows/NRG Jan 11 Playoff v4_grouped.csv',
    percent: 'data/Jan 11 Playoff Hourly_percent.csv',
    profiles: 'data/priorEvents/arrivalDeparture/NRG Jan 11 Playoff v4_grouped.csv',
    specialEvent: 'data/priorEvents/Jan 11 2024_Special Event.csv'
  },
  jun28_beyonce: {
    trips: 'data/priorEvents/OD_Hourly_Flows/NRG Jun 28 Beyonce Concert v4_grouped.csv',
    percent: 'data/Jun 28 Beyonce_percent.csv',
    profiles: 'data/priorEvents/arrivalDeparture/NRG Jun 28 Beyonce Concert v4_grouped.csv',
    specialEvent: 'data/priorEvents/Jun 28 2024_Special Event.csv'
  },
  oct6_football: {
    trips: 'data/priorEvents/OD_Hourly_Flows/NRG Oct 6 2024 Football Game v4_grouped.csv',
    percent: 'data/Oct 6 2024_percent.csv',
    profiles: 'data/priorEvents/arrivalDeparture/NRG Oct 6 2024 Football Game v4_grouped.csv',
    specialEvent: 'data/priorEvents/Oct 6 2024_Special Event.csv'
  },
  Sept_15_Chicago_Bears: {
    trips: 'data/priorEvents/OD_Hourly_Flows/NRG Sep 15 2024 Football Game v4_grouped.csv',
    percent: null,
    profiles: 'data/priorEvents/arrivalDeparture/NRG Sep 15 2024 Football Game v4_grouped.csv',
    specialEvent: 'data/priorEvents/Sept15_Special Event.csv'
  },
  Dec_27_Texas_Bowl: {
    trips: 'data/priorEvents/OD_Hourly_Flows/NRG Dec 27 2023 College Bowl v4_grouped.csv',
    percent: null,
    profiles: 'data/priorEvents/arrivalDeparture/NRG Dec 27 2023 College Bowl v4_grouped.csv',
    specialEvent: 'data/priorEvents/Dec27_Special Event.csv'
  },
  Mar_8_2025_Houston_Rodeo: {
    trips: 'data/priorEvents/OD_Hourly_Flows/NRG Mar 8 2025 Rodeo v4_grouped.csv',
    percent: null,
    profiles: 'data/priorEvents/arrivalDeparture/NRG Mar 8 2025 Rodeo v4_grouped.csv',
    specialEvent: 'data/priorEvents/Mar8_Special Event.csv'
  },
  Oct_2_2024_Houston_Astros: {
    trips: 'data/priorEvents/OD_Hourly_Flows/Daikin Oct 2 2024 Astros Playoff Game v4_grouped.csv',
    percent: null,
    profiles: 'data/priorEvents/arrivalDeparture/Daikin Oct 2 2024 Astros Playoff Game v4_grouped.csv',
    specialEvent: 'data/priorEvents/Oct2_Special Event.csv'
  },
  Mar_30_2025_Toyota_Center: {
    trips: 'data/priorEvents/OD_Hourly_Flows/Houston Mar 30 2025 Toyota Center v4_grouped.csv',
    percent: null,
    profiles: 'data/priorEvents/arrivalDeparture/Houston Mar 30 2025 Toyota Center v4_grouped.csv',
    specialEvent: 'null'
  },
  Oct_25_2024_Shell_Energy: {
    trips: 'data/priorEvents/OD_Hourly_Flows/Houston Oct 25 2024 Harris Rally v4_grouped.csv',
    percent: null,
    profiles: 'data/priorEvents/arrivalDeparture/Houston Oct 25 2024 Harris Rally v4_grouped.csv',
    specialEvent: 'data/priorEvents/Oct25_Special Event.csv'
  }
};

const PRIOR_EVENT_LABELS = {
  jan8_college_football: 'Jan 8 2024 College Football',
  jan11_playoff: 'Jan 11 2024 Playoff',
  jun28_beyonce: 'Jun 28 2024 Beyonc\uFFFD Concert',
  oct6_football: 'Oct 6 2024 Football Game',
  Sept_15_Chicago_Bears: 'Sept 15 2024 Chicago Bears',
  Dec_27_Texas_Bowl: 'Dec 27 2024 Texas Bowl',
  Mar_8_2025_Houston_Rodeo: 'Mar 8 2025 Houston Rodeo',
  Oct_2_2024_Houston_Astros: 'Oct 2 2024 Houston Astros',
  Mar_30_2025_Toyota_Center: 'Mar 30 2025 Toyota Center',
  Oct_25_2024_Shell_Energy: 'Oct 25 2024 Shell Energy'
};

// Store loaded data for each event
let eventDataCache = {};
let currentEvent = 'jan8_college_football';
let currentDataType = 'trips';
let dataLoaded = false;
let stadiumAttendanceData = null;
let stadiumAttendancePromise = null;

// CSP-safe CSV loader (replaces d3.csv which uses eval)
async function loadCSV(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.statusText}`);
  }
  const text = await response.text();
  return d3.csvParse(text);
}

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

function normalizeEventName(name) {
  if (!name) {
    return '';
  }
  
  return name
    .toString()
    .normalize('NFD')
    .replace(/\uFFFD/g, 'e')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

async function loadStadiumAttendanceData() {
  if (stadiumAttendanceData) {
    return stadiumAttendanceData;
  }
  
  if (stadiumAttendancePromise) {
    return stadiumAttendancePromise;
  }
  
  stadiumAttendancePromise = (async () => {
    try {
      const csvText = await d3.text('data/priorEvents/stadiumAttendance_2.csv');
      const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      // Skip first row (empty header) and second row (column headers), start from row 3 (index 2)
      if (lines.length <= 2) {
        stadiumAttendanceData = {};
        return stadiumAttendanceData;
      }
      
      // Use the second row as headers and parse from row 3 onwards
      const headerRow = lines[1];
      const dataRowsText = lines.slice(2).join('\n');
      const fullCsv = headerRow + '\n' + dataRowsText;
      
      // Parse CSV with proper header handling
      const parsedData = d3.csvParse(fullCsv);
      
      // Also parse raw rows to extract "Other" and "In Total" which may not be in headers
      const rawDataRows = d3.csvParseRows(dataRowsText);
      
      if (!parsedData || !parsedData.length) {
        stadiumAttendanceData = {};
        return stadiumAttendanceData;
      }
      
      stadiumAttendanceData = parsedData.reduce((acc, row, index) => {
        if (!row) {
          return acc;
        }
        
        // Helper to get and clean column values
        const getValue = (columnName) => {
          // Try exact match first, then try common variations
          const keys = Object.keys(row);
          let val = row[columnName];
          
          // If not found, try case-insensitive match
          if (val === undefined || val === null) {
            const foundKey = keys.find(k => k.toLowerCase() === columnName.toLowerCase());
            if (foundKey) val = row[foundKey];
          }
          
          // If still not found, try partial match (for columns with special characters like tab)
          if (val === undefined || val === null) {
            const foundKey = keys.find(k => k.toLowerCase().includes(columnName.toLowerCase()) || columnName.toLowerCase().includes(k.toLowerCase()));
            if (foundKey) val = row[foundKey];
          }
          
          if (val === undefined || val === null || val === '') {
            return '';
          }
          
          // Clean the value: remove quotes, trim whitespace
          let cleaned = String(val).trim();
          cleaned = cleaned.replace(/^["\s]+|["\s]+$/g, '');
          return cleaned;
        };
        
        // Map columns from new CSV structure
        // Column names as they appear in CSV header (row 2)
        const keys = Object.keys(row);
        
        // Find Event Attendance column (may have tab prefix)
        const attendanceKey = keys.find(k => k.toLowerCase().includes('event attendance') || k.toLowerCase().includes('attendance')) || keys.find(k => k.trim().toLowerCase().includes('attendance'));
        const attendance = attendanceKey ? getValue(attendanceKey) : '';
        
        // Map columns from new CSV structure (stadiumAttendance_2.csv)
        // Try to find columns with flexible matching
        const record = {
          event: getValue('EVENT'),
          location: getValue('LOCATION'),
          time: getValue('TIME OF EVENT'),
          attendance: attendance, // Event Attendance (with tab prefix)
          availableParking: getValue('Available Parking'),
          venueAutoParking: getValue('Venue Auto Parking'),
          autoPassengers: getValue('Auto Passengers (Venue )') || getValue('Auto Passengers (Venue)'),
          autoShare: getValue(' Auto Share of Attendance (Venue)') || getValue('Auto Share of Attendance (Venue)'),
          tncDropoffs: getValue('TNC Drop-offs (Venue, Yellow Lot)'),
          tncPassengers: getValue('TNC Passengers (Venue)'),
          tncShare: getValue('TNC Share of Attendance (Venue)'),
          redLine: getValue('METRO Red Line Riders'),
          transitShare: getValue('Transit Share (Red Line)'),
          otherModes: getValue('Other Modes (Sponge Parking, TNC Surface Street Drop-Off, Express Bus, Walk/Bike)')
        };
        
        const key = normalizeEventName(record.event);
        if (key && record.event) {
          acc[key] = record;
        }
        
        return acc;
      }, {});
      
      return stadiumAttendanceData;
    } catch (error) {
      console.error('Error loading stadium attendance data:', error);
      stadiumAttendanceData = {};
      throw error;
    } finally {
      stadiumAttendancePromise = null;
    }
  })();
  
  return stadiumAttendancePromise;
}

function parseMetricNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const cleaned = value.toString().replace(/[^0-9\-.]/g, '');
  if (!cleaned) {
    return null;
  }
  
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatMetricNumber(value) {
  const parsed = parseMetricNumber(value);
  if (parsed === null) {
    return 'N/A';
  }
  
  return parsed.toLocaleString();
}

function formatMetricPercent(value) {
  const parsed = parseMetricNumber(value);
  if (parsed === null) {
    return 'N/A';
  }
  
  return `${parsed}%`;
}

function updateAdditionalMetrics(eventId) {
  if (!additionalMetricsContainer) {
    return;
  }
  
  if (!stadiumAttendanceData) {
    loadStadiumAttendanceData()
      .then(() => updateAdditionalMetrics(eventId))
      .catch(() => {
        additionalMetricsContainer.innerHTML = '<p style="text-align: center; color: #b00020; padding: 20px;">Unable to load additional metrics.</p>';
      });
    
    additionalMetricsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Loading additional metrics...</p>';
    return;
  }
  
  const eventLabel = PRIOR_EVENT_LABELS[eventId] || '';
  const normalizedKey = normalizeEventName(eventLabel || eventId || '');
  const record = stadiumAttendanceData[normalizedKey];
  
  if (!record) {
    const fallbackName = eventLabel || eventId || 'the selected event';
    additionalMetricsContainer.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">No additional metrics available for ${fallbackName}.</p>`;
    return;
  }
  
  const metrics = [
    { label: 'Event Attendance', value: formatMetricNumber(record.attendance) },
    // { label: 'Available Parking', value: formatMetricNumber(record.availableParking) },
    {
      label: 'Venue Auto Parking',
      value: (() => {
        const formatted = formatMetricNumber(record.venueAutoParking);
        return formatted === 'N/A'
          ? 'N/A'
          : `${formatted} (Vehicles)`;
      })()
    },
    {
      label: 'Auto Passengers (Venue)',
      value: (() => {
        const formatted = formatMetricNumber(record.autoPassengers);
        return formatted === 'N/A'
          ? 'N/A'
          : `${formatted} (*2.5 occupancy assumed)`;
      })()
    },
    { label: 'Auto Share of Attendance (Venue)', value: formatMetricPercent(record.autoShare) },
    {
      label: 'TNC Drop-offs (Venue, Yellow Lot)',
      value: (() => {
        const formatted = formatMetricNumber(record.tncDropoffs);
        return formatted === 'N/A'
          ? 'N/A'
          : `${formatted} (Vehicles)`;
      })()
    },
    {
      label: 'TNC Passengers (Venue)',
      value: (() => {
        const formatted = formatMetricNumber(record.tncPassengers);
        return formatted === 'N/A'
          ? 'N/A'
          : `${formatted} (*2.7 occupancy assumed)`;
      })()
    },
    { label: 'TNC Share of Attendance (Venue)', value: formatMetricPercent(record.tncShare) },
    { label: 'METRO Red Line Riders', value: formatMetricNumber(record.redLine) },
    { label: 'Transit Share (Red Line)', value: formatMetricPercent(record.transitShare) },
    { label: 'Other Modes (Sponge Parking, TNC Surface Street Drop-Off, Express Bus, Walk/Bike)', value: formatMetricPercent(record.otherModes) },
    {
      label: '<br/> **Note**',
      value: 'Auto and TNC data were provided by NRG Stadium, and transit data was provided by METRO'
    }
  ];
  
  const metricList = metrics.map(metric => `
    <p style="margin:4px 0; font-size:13px; color:#333;">
      <span style="font-weight:600;">${metric.label}:</span>
      <span style="margin-left:6px;">${metric.value}</span>
    </p>
  `).join('');
  
  additionalMetricsContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      <span style="font-size:13px; color:#666;">${record.location || 'Location N/A'} • ${record.time || 'Time N/A'}</span>
      <div style="border-top:1px solid #e0e0e0; padding-top:8px;">
        ${metricList}
      </div>
    </div>
  `;
}

// Load data for a specific event
async function loadEventData(eventId) {
  if (eventDataCache[eventId]) {
    return eventDataCache[eventId];
  }
  
  try {
    const files = EVENT_DATA_FILES[eventId];

    if (!files || !files.trips) {
      throw new Error(`Missing trip data configuration for event ${eventId}`);
    }

    const tripsPromise = loadCSV(files.trips);
    const percentPromise = files.percent
      ? loadCSV(files.percent).catch(error => {
          console.warn(`Percent data not found for ${eventId}:`, error);
          return null;
        })
      : Promise.resolve(null);
    const profilesPromise = files.profiles
      ? loadCSV(files.profiles).catch(error => {
          console.warn(`Profile data not found for ${eventId}:`, error);
          return null;
        })
      : Promise.resolve(null);
    // Special handling for multi-line format CSVs (Oct2 and Oct25) that have an extra header row
    const specialEventPromise = files.specialEvent && files.specialEvent !== 'null'
      ? (async () => {
          try {
            // For Oct2 and Oct25, skip the first row which contains "GREEN LINE" and "PURPLE LINE" labels
            if (eventId === 'Oct_2_2024_Houston_Astros' || eventId === 'Oct_25_2024_Shell_Energy') {
              const csvText = await d3.text(files.specialEvent);
              const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
              // Skip first line (GREEN LINE/PURPLE LINE labels) and parse from second line (actual headers)
              const csvWithoutFirstRow = lines.slice(1).join('\n');
              const parsed = d3.csvParse(csvWithoutFirstRow);
              
              // Manually parse the CSV to ensure correct column mapping
              // D3 might not handle duplicate column names correctly, so we'll parse by position
              if (lines.length >= 3) {
                // Line 1: GREEN LINE/PURPLE LINE labels (skip)
                // Line 2: Headers
                // Line 3: Data
                const headerLine = lines[1];
                const dataLine = lines[2];
                
                // Parse headers
                const headers = d3.csvParseRows(headerLine)[0];
                // Parse data row (handle quoted values)
                const dataRow = d3.csvParseRows(dataLine)[0];
                
                console.log('Headers:', headers);
                console.log('Data row:', dataRow);
                
                // Map data by position:
                // 0: DATE, 1: EVENT, 2: TIME OF EVENT, 3: TIMEFRAME
                // 4: GREEN EVENT BOARDINGS, 5: GREEN DAY RIDERSHIP, 6: GREEN AVG RIDERSHIP
                // 7: PURPLE EVENT BOARDINGS, 8: PURPLE DAY RIDERSHIP, 9: PURPLE AVG RIDERSHIP
                const fixedRow = {
                  'DATE': dataRow[0] || '',
                  'EVENT': dataRow[1] || '',
                  'TIME OF EVENT': dataRow[2] || '',
                  'TIMEFRAME': dataRow[3] || '',
                  // GREEN LINE columns (positions 4, 5, 6)
                  'EVENT BOARDINGS': dataRow[4] || '',
                  'DAY OF EVENT RIDERSHIP': dataRow[5] || '',
                  'AVERAGE MONTHLY DAILY RIDERSHIP': dataRow[6] || '',
                  // PURPLE LINE columns (positions 7, 8, 9) - use .1 suffix
                  'EVENT BOARDINGS.1': dataRow[7] || '',
                  'DAY OF EVENT RIDERSHIP.1': dataRow[8] || '',
                  'AVERAGE MONTHLY DAILY RIDERSHIP.1': dataRow[9] || ''
                };
                
                console.log('Fixed row for', eventId, ':', fixedRow);
                return [fixedRow];
              }
              
              // Fallback to D3 parsing if manual parsing fails
              if (parsed && parsed.length > 0) {
                console.log('Using D3 parsed data:', parsed[0]);
                return parsed;
              }
              return parsed;
            } else {
              // Standard CSV format - load normally
              console.log(`Loading special event file for ${eventId}: ${files.specialEvent}`);
              const data = await loadCSV(files.specialEvent);
              console.log(`Loaded special event data for ${eventId}:`, data);
              return data;
            }
          } catch (error) {
            console.error(`Special event data not found for ${eventId} (file: ${files.specialEvent}):`, error);
            return null;
          }
        })()
      : Promise.resolve(null);
    
    // Load trip, percent, profile, and special event data (with optional fallbacks)
    const [tripsData, percentData, profilesData, specialEventData] = await Promise.all([
      tripsPromise,
      percentPromise,
      profilesPromise,
      specialEventPromise
    ]);

    if (!tripsData || !tripsData.length) {
      throw new Error(`Trip data missing or empty for event ${eventId}`);
    }

    const profiles = profilesData
      ? {
          arrival: profilesData.map(d => parseFloat(d['Arrival Profile']) || 0),
          departure: profilesData.map(d => parseFloat(d['Departure Profile']) || 0),
          arrivalAuto: profilesData.map(d => parseFloat(d['Arrival Profile Auto']) || 0),
          departureAuto: profilesData.map(d => parseFloat(d['Departure Profile Auto']) || 0),
          arrivalRideshare: profilesData.map(d => parseFloat(d['Arrival Profile Rideshare']) || 0),
          departureRideshare: profilesData.map(d => parseFloat(d['Departure Profile Rideshare']) || 0),
          timeRanges: profilesData.map(d => d['Time Range'])
        }
      : null;
    
    eventDataCache[eventId] = {
      trips: parseCSVtoOD(tripsData),
      percent: percentData ? parseCSVtoOD(percentData) : null,
      profiles,
      specialEvent: specialEventData && specialEventData.length ? specialEventData[0] : null
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
    await Promise.all([
      loadEventData(currentEvent),
      loadStadiumAttendanceData()
    ]);
    dataLoaded = true;
    update();
  } catch (error) {
    console.error('Error initializing data:', error);
    const container = document.getElementById('chordDiagram');
    if (container) {
      container.innerHTML = '<div style="padding: 50px; text-align: center; color: red;">Error loading data. Please check console.</div>';
    }
  }
}

// Function to build matrix for a specific time period
function buildMatrix(timeIndex, dataType = 'trips') {
  if (!eventDataCache[currentEvent]) {
    return [];
  }

  const odData = eventDataCache[currentEvent][dataType] || eventDataCache[currentEvent].trips;

  if (!odData) {
    return [];
  }
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
function drawChordDiagram(timeIndex = 0, dataType = 'trips') {
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
  
  const colors = [
    '#4A90E2', // Other - blue
    '#70BCAC', // Parklot - pink
    '#F3978F', // Rideshare - red
    '#C971A4', // around_NRG - green
    '#E2A14C', // downtown - orange
    '#689FCC', // galleria - light blue
    '#9F74B0', // hou_airport - purple
    '#B0D36E'  // iah_airport - light green
  ];
  
  const chord = d3.chord()
    .padAngle(0.05)
    .sortSubgroups(d3.descending);
  
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);
  
  const ribbon = d3.ribbon()
    .radius(innerRadius);
  
  const chords = chord(matrix);
  
  // Calculate total flows for percentage calculations
  // Sum all ribbon values to get actual total flow
  const totalRibbonFlow = chords.reduce((sum, c) => sum + c.source.value, 0);
  // Sum all group values for arc percentages (represents total node activity)
  const totalGroupFlow = chords.groups.reduce((sum, g) => sum + g.value, 0);
  
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
      translate(${outerRadius + 20})
      ${d.angle > Math.PI ? 'rotate(180)' : ''}
    `)
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .style('pointer-events', 'none')
    .text(d => formatLocationName(locations[d.index]));
  
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
      // Show tooltip with flow information and percentage
      const valueLabel = dataType === 'trips' ? 'Trips' : 'Percentage';
      const valueFormatted = dataType === 'trips' ? d.source.value.toLocaleString() : d.source.value.toFixed(3) + '%';
      
      // Calculate percentage of this flow relative to total ribbon flow
      const flowPercentage = totalRibbonFlow > 0 ? ((d.source.value / totalRibbonFlow) * 100).toFixed(1) : '0.0';
      
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
        .html(`<strong>${formatLocationName(locations[d.source.index])} → ${formatLocationName(locations[d.target.index])}</strong><br/>${valueLabel}: ${valueFormatted}<br/>Percentage: ${flowPercentage}%`);
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
    const timeValue = parseInt(timeSelector.value) || 0;
    drawChordDiagram(timeValue, currentDataType);
  });
});

// Event listeners for time controls
timeSelector.addEventListener('change', () => {
  const value = timeSelector.value;
  timeSlider.value = value;
  drawChordDiagram(parseInt(value), currentDataType);
  stopPlayback();
});

timeSlider.addEventListener('input', () => {
  const timeIndex = parseInt(timeSlider.value);
  timeSelector.value = timeIndex.toString();
  drawChordDiagram(timeIndex, currentDataType);
  stopPlayback();
});

playButton.addEventListener('click', () => {
  if (isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
});

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

// Draw arrival/departure profile chart with axes and interactivity
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
  yLabel.setAttribute('y', -h/300);
  yLabel.setAttribute('transform', 'rotate(-90)');
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('fill', '#333');
  yLabel.setAttribute('font-size', '12');
  yLabel.setAttribute('font-weight', 'bold');
  yLabel.textContent = profileType === 'arrival' ? 'Arrivals' : 'Departures';
  svg.appendChild(yLabel);
  
  // X-axis label
  const xLabel = document.createElementNS('http://www.w3.org/2000/svg','text');
  xLabel.setAttribute('x', w/2);
  xLabel.setAttribute('y', h - 5);
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('fill', '#333');
  xLabel.setAttribute('font-size', '12');
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
  
  // Draw Rideshare line
  if (rideshareVals.length > 0 && rideshareVals.some(v => v > 0)) {
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
  if (rideshareVals.length > 0 && rideshareVals.some(v => v > 0)) {
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

// Update shared header for Transit Ridership and Additional Metrics
function updateTransitAndMetricsHeader() {
  const header = document.getElementById('transitAndMetricsHeader');
  if (!header) return;
  
  if (!dataLoaded || !eventDataCache[currentEvent]) {
    header.textContent = 'Transit Ridership & Additional Metrics';
    return;
  }
  
  const specialEvent = eventDataCache[currentEvent].specialEvent;
  if (specialEvent && specialEvent.EVENT) {
    const eventName = specialEvent.EVENT.toString().replace(/^["']|["']$/g, '');
    header.textContent = eventName;
  } else {
    // Fallback to event label if SpecialEvent data is not available
    const eventLabel = PRIOR_EVENT_LABELS[currentEvent];
    if (eventLabel) {
      header.textContent = eventLabel;
    } else {
      header.textContent = 'Transit Ridership & Additional Metrics';
    }
  }
}

// Display special event data
function displaySpecialEventData() {
  const container = document.getElementById('specialEventData');
  
  if (!container) {
    console.warn('Special event data container not found');
    return;
  }
  
  if (!dataLoaded || !eventDataCache[currentEvent]) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Loading special event data...</p>';
    return;
  }
  
  const specialEvent = eventDataCache[currentEvent].specialEvent;

  if (!specialEvent) {
    console.warn(`No special event data found for ${currentEvent}`);
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Special event data unavailable for this event.</p>';
    return;
  }
  
  // Debug logging for troubleshooting
  if (currentEvent === 'Mar_8_2025_Houston_Rodeo') {
    console.log('Special Event Data for Mar 8 2025:', specialEvent);
    console.log('Available keys:', Object.keys(specialEvent));
  }
  
  // Check if this event uses the multi-line format (Oct2 and Oct25)
  // These events have GREEN LINE and PURPLE LINE data instead of just RED LINE
  const isMultiLineFormat = currentEvent === 'Oct_2_2024_Houston_Astros' || currentEvent === 'Oct_25_2024_Shell_Energy';
  
  if (isMultiLineFormat) {
    // Handle GREEN LINE and PURPLE LINE format
    // The CSV columns are: DATE, EVENT, TIME OF EVENT, TIMEFRAME, 
    // GREEN LINE: EVENT BOARDINGS, DAY OF EVENT RIDERSHIP, AVERAGE MONTHLY DAILY RIDERSHIP,
    // PURPLE LINE: EVENT BOARDINGS, DAY OF EVENT RIDERSHIP, AVERAGE MONTHLY DAILY RIDERSHIP
    // D3 CSV parser will name duplicate columns with .1 suffix
    
    // Debug: log the special event object to see what we're working with
    console.log('Special Event Data for', currentEvent, ':', specialEvent);
    console.log('Available keys:', Object.keys(specialEvent));
    
    // Helper function to safely parse and clean numeric values
    const parseValue = (value) => {
      if (value === undefined || value === null || value === '') return '0';
      const cleaned = value.toString().replace(/,/g, '').trim();
      return cleaned || '0';
    };
    
    // Check all possible column name variations that D3 might create
    // D3.csvParse should create .1 suffixes for duplicate columns, but let's verify
    const allKeys = Object.keys(specialEvent);
    console.log('All column keys:', allKeys);
    
    // Try to find the correct columns - D3 should create:
    // EVENT BOARDINGS (GREEN), EVENT BOARDINGS.1 (PURPLE)
    // DAY OF EVENT RIDERSHIP (GREEN), DAY OF EVENT RIDERSHIP.1 (PURPLE)
    // AVERAGE MONTHLY DAILY RIDERSHIP (GREEN), AVERAGE MONTHLY DAILY RIDERSHIP.1 (PURPLE)
    
    // Parse GREEN LINE data (first set of columns - no suffix)
    let greenEventBoardings = parseValue(specialEvent['EVENT BOARDINGS']);
    let greenDayRidership = parseValue(specialEvent['DAY OF EVENT RIDERSHIP']);
    let greenAvgRidership = parseValue(specialEvent['AVERAGE MONTHLY DAILY RIDERSHIP']);
    
    // Parse PURPLE LINE data (second set of columns - with .1 suffix from D3 CSV parser)
    let purpleEventBoardings = parseValue(specialEvent['EVENT BOARDINGS.1']);
    let purpleDayRidership = parseValue(specialEvent['DAY OF EVENT RIDERSHIP.1']);
    let purpleAvgRidership = parseValue(specialEvent['AVERAGE MONTHLY DAILY RIDERSHIP.1']);
    
    // Debug: log raw values to see what we're getting
    console.log('Raw GREEN values:', {
      boardings: specialEvent['EVENT BOARDINGS'],
      ridership: specialEvent['DAY OF EVENT RIDERSHIP'],
      avg: specialEvent['AVERAGE MONTHLY DAILY RIDERSHIP']
    });
    console.log('Raw PURPLE values:', {
      boardings: specialEvent['EVENT BOARDINGS.1'],
      ridership: specialEvent['DAY OF EVENT RIDERSHIP.1'],
      avg: specialEvent['AVERAGE MONTHLY DAILY RIDERSHIP.1']
    });
    
    console.log('Parsed GREEN LINE - Boardings:', greenEventBoardings, 'Day Ridership:', greenDayRidership, 'Avg:', greenAvgRidership);
    console.log('Parsed PURPLE LINE - Boardings:', purpleEventBoardings, 'Day Ridership:', purpleDayRidership, 'Avg:', purpleAvgRidership);
    
    // Calculate changes for GREEN LINE
    let greenRidershipChange = '';
    if (greenAvgRidership !== '0' && greenAvgRidership !== ' -' && greenAvgRidership !== '') {
      const greenIncrease = ((parseInt(greenDayRidership) - parseInt(greenAvgRidership)) / parseInt(greenAvgRidership) * 100).toFixed(1);
      const greenChangeColor = greenIncrease > 0 ? '#E24A4A' : '#50C878';
      const greenChangeIcon = greenIncrease > 0 ? '↗️' : '↘️';
      greenRidershipChange = `<p style="color: ${greenChangeColor}; font-weight: bold; margin: 4px 0; font-size: 11px;">${greenChangeIcon} ${Math.abs(greenIncrease)}% vs average</p>`;
    }
    
    // Calculate changes for PURPLE LINE
    let purpleRidershipChange = '';
    if (purpleAvgRidership !== '0' && purpleAvgRidership !== ' -' && purpleAvgRidership !== '') {
      const purpleIncrease = ((parseInt(purpleDayRidership) - parseInt(purpleAvgRidership)) / parseInt(purpleAvgRidership) * 100).toFixed(1);
      const purpleChangeColor = purpleIncrease > 0 ? '#E24A4A' : '#50C878';
      const purpleChangeIcon = purpleIncrease > 0 ? '↗️' : '↘️';
      purpleRidershipChange = `<p style="color: ${purpleChangeColor}; font-weight: bold; margin: 4px 0; font-size: 11px;">${purpleChangeIcon} ${Math.abs(purpleIncrease)}% vs average</p>`;
    }
    
    // Clean DATE and EVENT values (remove quotes if present)
    const eventName = (specialEvent.EVENT || 'Special Event').toString().replace(/^["']|["']$/g, '');
    const eventDate = (specialEvent.DATE || 'N/A').toString().replace(/^["']|["']$/g, '');
    const eventTime = (specialEvent['TIME OF EVENT'] || 'N/A').toString().replace(/^["']|["']$/g, '');
    const eventTimeframe = (specialEvent.TIMEFRAME || 'N/A').toString().replace(/^["']|["']$/g, '');
    
    container.innerHTML = `
      <div style="padding: 15px;">
        <div style="font-size: 13px; line-height: 1.4;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${eventTime}</p>
          
          <div style="margin: 12px 0; padding: 10px; background: #f0f7ff; border-left: 3px solid #28a745; border-radius: 4px;">
            <h5 style="margin: 0 0 8px 0; color: #28a745; font-size: 14px; font-weight: 600;">GREEN LINE</h5>
            <p style="margin: 3px 0;"><strong>Event Boardings:</strong> ${parseInt(greenEventBoardings || '0').toLocaleString()}</p>
            <p style="margin: 3px 0;"><strong>Event day Ridership:</strong> ${parseInt(greenDayRidership || '0').toLocaleString()}</p>
            ${greenAvgRidership !== '0' && greenAvgRidership !== ' -' && greenAvgRidership !== '' ? `<p style="margin: 3px 0;"><strong>Avg Daily:</strong> ${parseInt(greenAvgRidership).toLocaleString()}</p>` : ''}
            ${greenRidershipChange}
          </div>
          
          <div style="margin: 12px 0; padding: 10px; background: #fff5f5; border-left: 3px solid #9c27b0; border-radius: 4px;">
            <h5 style="margin: 0 0 8px 0; color: #9c27b0; font-size: 14px; font-weight: 600;">PURPLE LINE</h5>
            <p style="margin: 3px 0;"><strong>Event Boardings:</strong> ${parseInt(purpleEventBoardings || '0').toLocaleString()}</p>
            <p style="margin: 3px 0;"><strong>Event day Ridership:</strong> ${parseInt(purpleDayRidership || '0').toLocaleString()}</p>
            ${purpleAvgRidership !== '0' && purpleAvgRidership !== ' -' && purpleAvgRidership !== '' ? `<p style="margin: 3px 0;"><strong>Avg Daily:</strong> ${parseInt(purpleAvgRidership).toLocaleString()}</p>` : ''}
            ${purpleRidershipChange}
          </div>
          
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;"><strong>Timeframe:</strong> ${eventTimeframe}</p>
        </div>
      </div>
    `;
  } else {
    // Handle standard RED LINE format
    // Parse and clean numeric values - remove commas and trim spaces
    const eventBoardings = (specialEvent['EVENT BOARDINGS']?.toString() || '0').replace(/,/g, '').trim() || '0';
    const dayRidership = (specialEvent['DAY OF EVENT RIDERSHIP']?.toString() || '0').replace(/,/g, '').trim() || '0';
    const avgRidership = (specialEvent['AVERAGE MONTHLY DAILY RIDERSHIP']?.toString() || '0').replace(/,/g, '').trim() || '0';
    
    // Clean DATE and EVENT values (remove quotes if present and trim spaces)
    const eventDate = (specialEvent.DATE || 'N/A').toString().replace(/^["']|["']$/g, '').trim() || 'N/A';
    const eventTime = (specialEvent['TIME OF EVENT'] || 'N/A').toString().replace(/^["']|["']$/g, '').trim() || 'N/A';
    const eventTimeframe = (specialEvent.TIMEFRAME || 'N/A').toString().replace(/^["']|["']$/g, '').trim() || 'N/A';
    
    // Calculate increase/decrease percentage if avg ridership is available
    let ridershipChange = '';
    if (avgRidership !== '0' && avgRidership !== ' -' && avgRidership !== '') {
      const increase = ((parseInt(dayRidership) - parseInt(avgRidership)) / parseInt(avgRidership) * 100).toFixed(1);
      const changeColor = increase > 0 ? '#E24A4A' : '#50C878';
      const changeIcon = increase > 0 ? '↗️' : '↘️';
      ridershipChange = `<p style="color: ${changeColor}; font-weight: bold; margin: 4px 0; font-size: 11px;">${changeIcon} ${Math.abs(increase)}% vs average</p>`;
    }
    
    container.innerHTML = `
      <div style="padding: 15px;">
        <div style="font-size: 13px; line-height: 1.4;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${eventTime}</p>
          
          <div style="margin: 12px 0; padding: 10px; background: #fff5f5; border-left: 3px solid #e24a4a; border-radius: 4px;">
            <h5 style="margin: 0 0 8px 0; color: #e24a4a; font-size: 14px; font-weight: 600;">RED LINE</h5>
            <p style="margin: 3px 0;"><strong>Event Boardings:</strong> ${parseInt(eventBoardings || '0').toLocaleString()}</p>
            <p style="margin: 3px 0;"><strong>Event day Ridership:</strong> ${parseInt(dayRidership || '0').toLocaleString()}</p>
            ${avgRidership !== '0' && avgRidership !== ' -' && avgRidership !== '' ? `<p style="margin: 3px 0;"><strong>Avg Daily:</strong> ${parseInt(avgRidership).toLocaleString()}</p>` : ''}
            ${ridershipChange}
          </div>
          
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;"><strong>Timeframe:</strong> ${eventTimeframe}</p>
        </div>
      </div>
    `;
  }
}

// Update all charts and data
function update(){
  if (dataLoaded) {
    const timeValue = parseInt(timeSelector?.value) || 0;
    drawChordDiagram(timeValue, currentDataType);
    drawProfileChart('arrivalChart', 'arrival', 'var(--good)');
    drawProfileChart('departureChart', 'departure', 'var(--med)');
    displaySpecialEventData();
    updateAdditionalMetrics(currentEvent);
    updateTransitAndMetricsHeader();
  }
  drawChart('snapshotChart', 'var(--avg)');
}

// Post-Event Analysis Functions
let postEventDataCache = {};

// Load post-event data (using same data for now)
async function loadPostEventData(eventName) {
  if (postEventDataCache[eventName]) {
    return postEventDataCache[eventName];
  }
  
  try {
    // For now, use the same data as prior events
    // This will be updated later with actual post-event data
    const data = await loadEventData(eventName);
    postEventDataCache[eventName] = data;
    return data;
  } catch (error) {
    console.error('Error loading post-event data:', error);
    throw error;
  }
}

// Populate post-event selectors (using same logic as prior events)
function populatePostEventSelectors() {
  if (!postEventDataCache[postEventSel.value]) return;
  
  const data = postEventDataCache[postEventSel.value];
  
  // Populate origin and destination dropdowns
  if (postOriginSelect && postDestinationSelect) {
    // Clear existing options
    postOriginSelect.innerHTML = '<option value="">Select Origin</option>';
    postDestinationSelect.innerHTML = '<option value="">Select Destination</option>';
    
    // Add unique origins and destinations
    const origins = [...new Set(data.odData.map(d => d.origin))];
    const destinations = [...new Set(data.odData.map(d => d.destination))];
    
    origins.forEach(origin => {
      const option = document.createElement('option');
      option.value = origin;
      option.textContent = origin;
      postOriginSelect.appendChild(option);
    });
    
    destinations.forEach(destination => {
      const option = document.createElement('option');
      option.value = destination;
      option.textContent = destination;
      postDestinationSelect.appendChild(option);
    });
  }
  
  // Populate hour dropdown
  if (postHourSelect) {
    postHourSelect.innerHTML = '<option value="">Select Hour</option>';
    timeLabels.forEach(time => {
      const option = document.createElement('option');
      option.value = time;
      option.textContent = time;
      postHourSelect.appendChild(option);
    });
  }
}

// Render post-event filtered results
function renderPostEventFilteredResults() {
  if (!postEventDataCache[postEventSel.value]) return;
  
  const origin = postOriginSelect ? postOriginSelect.value : '';
  const destination = postDestinationSelect ? postDestinationSelect.value : '';
  const hour = postHourSelect ? postHourSelect.value : '';
  
  if (!origin || !destination || !hour) {
    if (postRouteResults) {
      postRouteResults.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">Select origin, destination, and hour to view post-event performance.</div>';
    }
    hidePostEventRouteMap();
    return;
  }
  
  const data = postEventDataCache[postEventSel.value];
  const filteredData = data.odData.filter(d => 
    d.origin === origin && d.destination === destination && d.time === hour
  );
  
  if (filteredData.length === 0) {
    if (postRouteResults) {
      postRouteResults.innerHTML = '<div style="padding: 16px; color:#666;">No data found for the selected origin, destination, and hour combination.</div>';
    }
    hidePostEventRouteMap();
    return;
  }
  
  // Display results
  if (postRouteResults) {
    const result = filteredData[0];
    postRouteResults.innerHTML = `
      <div style="padding: 16px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">Post-Event Analysis Results</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
            <div style="font-weight: 600; color: #333;">Origin</div>
            <div style="font-size: 14px; color: #666;">${result.origin}</div>
          </div>
          <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
            <div style="font-weight: 600; color: #333;">Destination</div>
            <div style="font-size: 14px; color: #666;">${result.destination}</div>
          </div>
          <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
            <div style="font-weight: 600; color: #333;">Time Period</div>
            <div style="font-size: 14px; color: #666;">${result.time}</div>
          </div>
          <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
            <div style="font-weight: 600; color: #333;">Trips</div>
            <div style="font-size: 18px; color: #1976d2;">${result.trips}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Show route map
  showPostEventRouteMap(result.origin, result.destination, result);
}

// Show post-event route map
function showPostEventRouteMap(origin, destination, routeData) {
  if (!postRouteMapDiv || !postMapContainer) return;
  
  postRouteMapDiv.style.display = 'block';
  
  // Create a simple map visualization (same as prior events for now)
  const mapHtml = `
    <div style="padding: 20px; text-align: center;">
      <h4 style="margin: 0 0 10px 0; color: #333;">Post-Event Route: ${origin} → ${destination}</h4>
      <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 20px 0;">
        <div style="padding: 10px; background: #e3f2fd; border-radius: 6px; min-width: 120px;">
          <div style="font-weight: 600; color: #1976d2;">Origin</div>
          <div style="font-size: 14px; color: #666;">${origin}</div>
        </div>
        <div style="flex: 1; height: 2px; background: linear-gradient(to right, #1976d2, #ff9800); position: relative;">
          <div style="position: absolute; right: -8px; top: -6px; width: 0; height: 0; border-left: 8px solid #ff9800; border-top: 6px solid transparent; border-bottom: 6px solid transparent;"></div>
        </div>
        <div style="padding: 10px; background: #fff3e0; border-radius: 6px; min-width: 120px;">
          <div style="font-weight: 600; color: #f57c00;">Destination</div>
          <div style="font-size: 14px; color: #666;">${destination}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
        <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
          <div style="font-weight: 600; color: #333;">Time Period</div>
          <div style="font-size: 14px; color: #666;">${routeData.time || 'N/A'}</div>
        </div>
        <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
          <div style="font-weight: 600; color: #333;">Trips</div>
          <div style="font-size: 18px; color: #1976d2;">${routeData.trips || 'N/A'}</div>
        </div>
      </div>
    </div>
  `;
  
  postMapContainer.innerHTML = mapHtml;
}

// Hide post-event route map
function hidePostEventRouteMap() {
  if (postRouteMapDiv) {
    postRouteMapDiv.style.display = 'none';
  }
}

// Draw post-event profile chart
function drawPostEventProfileChart(containerId, type, color) {
  // For now, use the same chart logic as prior events
  // This will be updated later with actual post-event data
  drawProfileChart(containerId, type, color);
}

// Initialize the application
initializeData();
