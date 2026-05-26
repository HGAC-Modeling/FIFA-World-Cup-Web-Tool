// Post Event Analysis JavaScript
// This file handles data loading and chart rendering for Post Event Analysis
// Can be easily updated to use different CSV files for post-event data

// CSP-safe CSV loader (replaces d3.csv which uses eval)
async function loadCSV(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.statusText}`);
  }
  const text = await response.text();
  return d3.csvParse(text);
}

const POST_EVENT_MAPS = {
  june14_2026_germany_curacao: "https://arcadis.maps.arcgis.com/apps/dashboards/478fb1c41ed9405d9a4521e988d85082",
  june17_2026_portugal_playoff1: "https://arcadis.maps.arcgis.com/apps/dashboards/478fb1c41ed9405d9a4521e988d85082",
  june20_2026_netherlands_playoffb: "https://arcadis.maps.arcgis.com/apps/dashboards/478fb1c41ed9405d9a4521e988d85082",
  june23_2026_portugal_uzbekistan: "https://arcadis.maps.arcgis.com/apps/dashboards/478fb1c41ed9405d9a4521e988d85082",
  june26_2026_capeverde_saudiarabia: "https://arcadis.maps.arcgis.com/apps/dashboards/478fb1c41ed9405d9a4521e988d85082",
  june29_2026_groupc_groupf: "https://arcadis.maps.arcgis.com/apps/dashboards/478fb1c41ed9405d9a4521e988d85082",
  july4_2026_winner73_winner74: "https://arcadis.maps.arcgis.com/apps/dashboards/478fb1c41ed9405d9a4521e988d85082"
};

// Congestion view uses a separate ArcGIS compare app per match.
// Placeholder: same URL for all 7 matches until unique appids are provided.
const POST_EVENT_CONGESTION_MAPS = {
  june14_2026_germany_curacao: "https://arcadis.maps.arcgis.com/apps/instant/compare/index.html?appid=fb2f0a54d9a14fa2b57ddbe5b25616f5",
  june17_2026_portugal_playoff1: "https://arcadis.maps.arcgis.com/apps/instant/compare/index.html?appid=fb2f0a54d9a14fa2b57ddbe5b25616f5",
  june20_2026_netherlands_playoffb: "https://arcadis.maps.arcgis.com/apps/instant/compare/index.html?appid=fb2f0a54d9a14fa2b57ddbe5b25616f5",
  june23_2026_portugal_uzbekistan: "https://arcadis.maps.arcgis.com/apps/instant/compare/index.html?appid=fb2f0a54d9a14fa2b57ddbe5b25616f5",
  june26_2026_capeverde_saudiarabia: "https://arcadis.maps.arcgis.com/apps/instant/compare/index.html?appid=fb2f0a54d9a14fa2b57ddbe5b25616f5",
  june29_2026_groupc_groupf: "https://arcadis.maps.arcgis.com/apps/instant/compare/index.html?appid=fb2f0a54d9a14fa2b57ddbe5b25616f5",
  july4_2026_winner73_winner74: "https://arcadis.maps.arcgis.com/apps/instant/compare/index.html?appid=fb2f0a54d9a14fa2b57ddbe5b25616f5"
};

// Active view tab: 'travelTime' (default, shows dashboard with map + bar chart)
// or 'congestion' (shows compare iframe; bar chart hidden via different source)
let postEventCurrentView = 'travelTime';

// Resolve which iframe URL to load based on currently selected tab + event
function getPostEventMapUrl(eventKey, view) {
  const key = eventKey || postEventCurrentEvent;
  const tab = view || postEventCurrentView;
  const dict = tab === 'congestion' ? POST_EVENT_CONGESTION_MAPS : POST_EVENT_MAPS;
  return dict[key] || dict[postEventCurrentEvent] || '';
}

// Apply current tab + event to the iframe (and toggle button state)
function applyPostEventView() {
  if (postMapFrame) {
    postMapFrame.src = getPostEventMapUrl();
  }
  document.querySelectorAll('#peViewToggle .pe-toggle-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-pe-view') === postEventCurrentView;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

// Post Event Data Configuration
// Update these paths to point to your post-event specific CSV files
const POST_EVENT_DATA_CONFIG = {
  // Trip data files - update these paths for post-event specific data
  tripFiles: {
    jan8_college_football: 'data/Jan 8 2024 College Football_Trip.csv',
    jan11_playoff: 'data/NRG Jan 11 Playoff Hourly_Trip.csv',
    jun28_beyonce: 'data/Jun 28 Beyonce_Trip.csv',
    oct6_football: 'data/Oct 6 2024_Trip.csv'
  },
  
  // Percentage data files - update these paths for post-event specific data
  percentFiles: {
    jan8_college_football: 'data/Jan 8 2024 College Football_percent.csv',
    jan11_playoff: 'data/Jan 11 Playoff Hourly_percent.csv',
    jun28_beyonce: 'data/Jun 28 Beyonce_percent.csv',
    oct6_football: 'data/Oct 6 2024_percent.csv'
  },
  
  // Arrival/Departure profile files - update these paths for post-event specific data
  profileFiles: {
    jan8_college_football: 'data/Jan 8 2024_Arrival_Departure Profile.csv',
    jan11_playoff: 'data/Jan 11 2024_Arrival_Departure Profile.csv',
    jun28_beyonce: 'data/June 28 2024_Arrival_Departure Profile.csv',
    oct6_football: 'data/Oct 6 2024_Arrival_Departure Profile.csv'
  },
  
  // Special event data files - update these paths for post-event specific data
  specialEventFiles: {
    jan8_college_football: 'data/Jan 8 2024_Special Event.csv',
    jan11_playoff: 'data/Jan 11 2024_Special Event.csv',
    jun28_beyonce: 'data/Jun 28 2024_Special Event.csv',
    oct6_football: 'data/Oct 6 2024_Special Event.csv'
  }
};

// DOM elements will be initialized after DOM is loaded
let postEventSel, postMapFrame, postBuffer, postBufferOut, postTimeSelector, postTimeSlider, postPlayButton, postChordDiagram, postArrivalChart, postDepartureChart, postSpecialEventData;

// Post Event Analysis data cache
let postEventDataCache = {};
let postEventDataLoaded = false;
let postEventCurrentEvent = 'june14_2026_germany_curacao';
let postEventCurrentDataType = 'trips';

// OD data from CSV with time periods
const postEventLocations = ['Parklot', 'Rideshare', 'Region 3', 'Region 4'];
const postEventTimeLabels = [
  '00:00 - 06:00', '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00',
  '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
  '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00', '23:00 - 00:00'
];

// Set up event listeners for Post Event Analysis
function setupPostEventEventListeners() {
  // View toggle (Travel Time / Congestion)
  document.querySelectorAll('#peViewToggle .pe-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-pe-view');
      if (!next || next === postEventCurrentView) return;
      postEventCurrentView = next;
      applyPostEventView();
    });
  });

  // Event selector listener
  if (postEventSel) {
    postEventSel.addEventListener('change', async () => {
      postEventCurrentEvent = postEventSel.value;
      applyPostEventView();

      // Load data for new event and update chord diagram
      if (!postChordDiagram) return;
      if (postChordDiagram) {
        postChordDiagram.innerHTML = '<div style="padding: 50px; text-align: center;">Loading post-event data...</div>';
      }
      
      try {
        await loadPostEventData(postEventCurrentEvent);
        const timeValue = postTimeSelector ? postTimeSelector.value : 'all';
        drawPostEventChordDiagram(timeValue, postEventCurrentDataType);
        
        // Update arrival and departure charts
        drawPostEventProfileChart('arrivalChart', 'arrival', 'var(--good)');
        drawPostEventProfileChart('departureChart', 'departure', 'var(--med)');
        
        // Update special event data
        displayPostEventSpecialEventData();
      } catch (error) {
        console.error('Error loading post-event data:', error);
        if (postChordDiagram) {
          postChordDiagram.innerHTML = '<div style="padding: 50px; text-align: center; color: red;">Error loading post-event data</div>';
        }
      }
    });
  }

  // Buffer slider listener
  if (postBuffer) {
    postBuffer.addEventListener('input', () => { 
      if (postBufferOut) postBufferOut.textContent = postBuffer.value + " mi"; 
      updatePostEventAnalysis(); 
    });
  }

  // Data type radio button listeners
  document.addEventListener('change', (e) => {
    if (e.target.name === 'dataType') {
      postEventCurrentDataType = e.target.value;
      const timeValue = postTimeSelector ? postTimeSelector.value : 'all';
      drawPostEventChordDiagram(timeValue, postEventCurrentDataType);
    }
  });

  // Time selector and slider listeners
  if (postTimeSelector) {
    postTimeSelector.addEventListener('change', () => {
      if (postTimeSlider) postTimeSlider.value = postTimeSelector.value;
      drawPostEventChordDiagram(postTimeSelector.value, postEventCurrentDataType);
    });
  }

  if (postTimeSlider) {
    postTimeSlider.addEventListener('input', () => {
      if (postTimeSelector) postTimeSelector.value = postTimeSlider.value;
      drawPostEventChordDiagram(postTimeSlider.value, postEventCurrentDataType);
    });
  }

  // Play button functionality
  if (postPlayButton) {
    postPlayButton.addEventListener('click', () => {
      if (postPlayButton.textContent === '▶ Play') {
        postPlayButton.textContent = '⏸ Pause';
        startPostEventAnimation();
      } else {
        postPlayButton.textContent = '▶ Play';
        stopPostEventAnimation();
      }
    });
  }
}

// Load post-event data from CSV files
async function loadPostEventData(eventName) {
  if (postEventDataCache[eventName]) {
    return postEventDataCache[eventName];
  }
  
  try {
    console.log(`Loading post-event data for: ${eventName}`);
    
    // Load trip data
    const tripFile = POST_EVENT_DATA_CONFIG.tripFiles[eventName];
    const percentFile = POST_EVENT_DATA_CONFIG.percentFiles[eventName];
    const profileFile = POST_EVENT_DATA_CONFIG.profileFiles[eventName];
    const specialEventFile = POST_EVENT_DATA_CONFIG.specialEventFiles[eventName];
    
    const [tripData, percentData, profileData, specialEventData] = await Promise.all([
      loadCSV(tripFile),
      loadCSV(percentFile),
      loadCSV(profileFile),
      loadCSV(specialEventFile)
    ]);
    
    // Process the data (same structure as Prior Events Analysis)
    const odData = processPostEventODData(tripData, percentData);
    const profiles = processPostEventProfileData(profileData);
    
    const processedData = {
      trips: odData.trips,
      percentage: odData.percentage,
      profiles: profiles,
      specialEvent: specialEventData[0] || {}
    };
    
    postEventDataCache[eventName] = processedData;
    console.log(`Post-event data loaded for ${eventName}:`, processedData);
    
    return processedData;
  } catch (error) {
    console.error(`Error loading post-event data for ${eventName}:`, error);
    throw error;
  }
}

// Process post-event OD data (same structure as Prior Events Analysis)
function processPostEventODData(tripData, percentData) {
  const trips = {};
  const percentage = {};
  
  // Initialize data structure
  postEventLocations.forEach(origin => {
    trips[origin] = {};
    percentage[origin] = {};
    postEventLocations.forEach(dest => {
      trips[origin][dest] = [];
      percentage[origin][dest] = [];
    });
  });
  
  // Process trip data
  tripData.forEach(row => {
    const origin = row.Origin;
    const destination = row.Destination;
    
    if (trips[origin] && trips[origin][destination]) {
      postEventTimeLabels.forEach((timeLabel, index) => {
        const timeKey = timeLabel;
        const value = parseInt(row[timeKey]) || 0;
        trips[origin][destination][index] = value;
      });
    }
  });
  
  // Process percentage data
  percentData.forEach(row => {
    const origin = row.Origin;
    const destination = row.Destination;
    
    if (percentage[origin] && percentage[origin][destination]) {
      postEventTimeLabels.forEach((timeLabel, index) => {
        const timeKey = timeLabel;
        const value = parseFloat(row[timeKey]) || 0;
        percentage[origin][destination][index] = value;
      });
    }
  });
  
  console.log('Processed OD data structure:', { trips, percentage });
  return { trips, percentage };
}

// Process post-event profile data (same structure as Prior Events Analysis)
function processPostEventProfileData(profileData) {
  const arrival = [];
  const departure = [];
  
  profileData.forEach(row => {
    const arrivalValue = parseFloat(row['Arrival Profile'] || 0) || 0;
    const departureValue = parseFloat(row['Departure Profile'] || 0) || 0;
    
    arrival.push(arrivalValue);
    departure.push(departureValue);
  });
  
  console.log('Processed profile data:', { arrival, departure });
  return { arrival, departure };
}

// Build matrix for chord diagram (same as Prior Events Analysis)
function buildPostEventMatrix(timeIndex, dataType = 'trips') {
  if (!postEventDataCache[postEventCurrentEvent]) {
    return [];
  }
  
  const odData = postEventDataCache[postEventCurrentEvent][dataType];
  const matrix = [];
  
  postEventLocations.forEach(origin => {
    const row = [];
    postEventLocations.forEach(dest => {
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

// Draw post-event chord diagram (exact same as Prior Events Analysis)
function drawPostEventChordDiagram(timeIndex = 'all', dataType = 'trips') {
  const container = postChordDiagram;
  
  if (!container) {
    console.warn('Chord diagram container not found');
    return;
  }
  
  container.innerHTML = '';
  
  if (!postEventDataLoaded) {
    container.innerHTML = '<div style="padding: 50px; text-align: center;">Loading data...</div>';
    return;
  }
  
  const matrix = buildPostEventMatrix(timeIndex, dataType);
  
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
    .text(d => postEventLocations[d.index]);
  
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
        .style('background', 'rgba(0,0,0,0.9)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);
      
      tooltip.html(`
        <strong>${postEventLocations[d.source.index]} → ${postEventLocations[d.target.index]}</strong><br/>
        ${valueLabel}: ${valueFormatted}
      `);
      
      tooltip.transition().duration(200).style('opacity', 1);
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

// Draw post-event profile chart (exact same as Prior Events Analysis)
function drawPostEventProfileChart(svgId, profileType, color) {
  const svg = document.getElementById(svgId);
  
  // Check if element exists
  if (!svg) {
    console.warn(`Chart element ${svgId} not found`);
    return;
  }
  
  // Check if data is loaded
  if (!postEventDataLoaded || !postEventDataCache[postEventCurrentEvent] || !postEventDataCache[postEventCurrentEvent].profiles) {
    console.warn(`Profile data not loaded for ${postEventCurrentEvent}`);
    return;
  }
  
  const profiles = postEventDataCache[postEventCurrentEvent].profiles;
  const vals = profileType === 'arrival' ? profiles.arrival : profiles.departure;
  
  const w = 400, h = 200, p = 40, pTop = 10, pRight = 10;
  const chartWidth = w - p - pRight;
  const chartHeight = h - pTop - p;
  const max = Math.max(...vals, 1);
  
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
    svg.appendChild(grid);
    
    // Value label
    const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x', p - 10);
    label.setAttribute('y', yPos + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', '#666');
    label.setAttribute('font-size', '12');
    label.textContent = value;
    svg.appendChild(label);
  }
  
  // X-axis ticks and labels
  const xTicks = vals.length;
  for (let i = 0; i < xTicks; i++) {
    const xPos = p + (i / (xTicks - 1)) * chartWidth;
    const timeLabel = postEventTimeLabels[i] || `T${i}`;
    
    // Tick line
    const tick = document.createElementNS('http://www.w3.org/2000/svg','line');
    tick.setAttribute('x1', xPos);
    tick.setAttribute('y1', h - p);
    tick.setAttribute('x2', xPos);
    tick.setAttribute('y2', h - p + 5);
    tick.setAttribute('stroke', '#666');
    tick.setAttribute('stroke-width', '1');
    svg.appendChild(tick);
    
    // Time label (rotated)
    const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x', xPos);
    label.setAttribute('y', h - p + 20);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#666');
    label.setAttribute('font-size', '10');
    label.setAttribute('transform', `rotate(-45, ${xPos}, ${h - p + 20})`);
    label.textContent = timeLabel.substring(0, 8); // Shorten labels
    svg.appendChild(label);
  }
  
  // Draw bars
  for (let i = 0; i < vals.length; i++) {
    const xPos = p + (i / (vals.length - 1)) * chartWidth;
    const barWidth = chartWidth / (vals.length - 1) * 0.8;
    const barHeight = (vals[i] / max) * chartHeight;
    const yPos = h - p - barHeight;
    
    const bar = document.createElementNS('http://www.w3.org/2000/svg','rect');
    bar.setAttribute('x', xPos - barWidth/2);
    bar.setAttribute('y', yPos);
    bar.setAttribute('width', barWidth);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('fill', color);
    bar.setAttribute('stroke', '#fff');
    bar.setAttribute('stroke-width', '1');
    bar.style.cursor = 'pointer';
    
    // Add hover effects
    bar.addEventListener('mouseenter', function(e) {
      this.style.opacity = '0.8';
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `
        <strong>${postEventTimeLabels[i] || `Time ${i}`}</strong><br/>
        ${profileType === 'arrival' ? 'Arrivals' : 'Departures'}: ${vals[i].toLocaleString()}
      `;
    });
    
    bar.addEventListener('mousemove', function(e) {
      tooltip.style.left = (e.pageX + 10) + 'px';
      tooltip.style.top = (e.pageY - 10) + 'px';
    });
    
    bar.addEventListener('mouseleave', function() {
      this.style.opacity = '1';
      tooltip.style.opacity = '0';
    });
    
    svg.appendChild(bar);
  }
}

// Display post-event special event data
function displayPostEventSpecialEventData() {
  if (!postSpecialEventData || !postEventDataCache[postEventCurrentEvent]) {
    if (postSpecialEventData) {
      postSpecialEventData.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Loading post-event special event data...</p>';
    }
    return;
  }
  
  const specialEvent = postEventDataCache[postEventCurrentEvent].specialEvent;
  
  // Format the data for display
  const eventBoardings = specialEvent['EVENT BOARDINGS']?.replace(/,/g, '') || '0';
  const dayRidership = specialEvent['DAY OF EVENT RIDERSHIP']?.replace(/,/g, '') || '0';
  const avgRidership = specialEvent['AVERAGE MONTHLY DAILY RIDERSHIP']?.replace(/,/g, '') || '0';
  
  // Calculate increase/decrease percentage if avg ridership is available
  let ridershipChange = '';
  if (avgRidership !== '0' && avgRidership !== ' -') {
    const increase = ((parseInt(dayRidership) - parseInt(avgRidership)) / parseInt(avgRidership) * 100).toFixed(1);
    const changeColor = increase > 0 ? '#E24A4A' : '#50C878';
    const changeIcon = increase > 0 ? '↗️' : '↘️';
    ridershipChange = `<p style="color: ${changeColor}; font-weight: bold; margin: 8px 0;">${changeIcon} ${Math.abs(increase)}% vs average</p>`;
  }
  
  postSpecialEventData.innerHTML = `
    <div style="padding: 15px;">
      <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Post-Event: ${specialEvent.EVENT || 'Special Event'}</h4>
      <div style="font-size: 13px; line-height: 1.4;">
        <p style="margin: 5px 0;"><strong>Date:</strong> ${specialEvent.DATE || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${specialEvent['TIME OF EVENT'] || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Event Boardings:</strong> ${parseInt(eventBoardings).toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Day Ridership:</strong> ${parseInt(dayRidership).toLocaleString()}</p>
        ${avgRidership !== '0' && avgRidership !== ' -' ? `<p style="margin: 5px 0;"><strong>Avg Daily:</strong> ${parseInt(avgRidership).toLocaleString()}</p>` : ''}
        ${ridershipChange}
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;"><strong>Timeframe:</strong> ${specialEvent.TIMEFRAME || 'N/A'}</p>
      </div>
    </div>
  `;
}

// Update all post-event charts and data
function updatePostEventAnalysis() {
  if (postEventDataLoaded) {
    const timeValue = postTimeSelector ? postTimeSelector.value : 'all';
    drawPostEventChordDiagram(timeValue, postEventCurrentDataType);
    drawPostEventProfileChart('arrivalChart', 'arrival', 'var(--good)');
    drawPostEventProfileChart('departureChart', 'departure', 'var(--med)');
    displayPostEventSpecialEventData();
  }
}

// Animation functions
let postEventAnimationInterval = null;

function startPostEventAnimation() {
  let currentTime = 0;
  postEventAnimationInterval = setInterval(() => {
    if (postTimeSelector) {
      postTimeSelector.value = currentTime;
      if (postTimeSlider) postTimeSlider.value = currentTime;
      drawPostEventChordDiagram(currentTime, postEventCurrentDataType);
      currentTime = (currentTime + 1) % 19; // 0-18 for time periods
    }
  }, 1000);
}

function stopPostEventAnimation() {
  if (postEventAnimationInterval) {
    clearInterval(postEventAnimationInterval);
    postEventAnimationInterval = null;
  }
}

// Initialize DOM elements
function initializePostEventDOMElements() {
  postEventSel = document.getElementById('eventSel');
  postMapFrame = document.getElementById('mapFrame');
  postBuffer = document.getElementById('bufferRange');
  postBufferOut = document.getElementById('bufferOut');
  postTimeSelector = document.getElementById('timeSelector');
  postTimeSlider = document.getElementById('timeSlider');
  postPlayButton = document.getElementById('playButton');
  postChordDiagram = document.getElementById('chordDiagram');
  postArrivalChart = document.getElementById('arrivalChart');
  postDepartureChart = document.getElementById('departureChart');
  postSpecialEventData = document.getElementById('specialEventData');
  
  console.log('DOM elements initialized:', {
    postEventSel: !!postEventSel,
    postMapFrame: !!postMapFrame,
    postChordDiagram: !!postChordDiagram,
    postArrivalChart: !!postArrivalChart,
    postDepartureChart: !!postDepartureChart,
    postSpecialEventData: !!postSpecialEventData
  });
}

// Initialize post-event data loading
async function initializePostEventData() {
  try {
    // Initialize DOM elements first
    initializePostEventDOMElements();
    
    // Set up event listeners
    setupPostEventEventListeners();

    // Always initialize map in case this page is running in map-only mode.
    if (postEventSel && !postEventSel.value) {
      postEventSel.value = postEventCurrentEvent;
    }
    if (postEventSel) {
      postEventCurrentEvent = postEventSel.value || postEventCurrentEvent;
    }
    applyPostEventView();

    // If analytic containers are missing, stop after map setup.
    if (!postChordDiagram || !postTimeSelector || !postSpecialEventData) {
      console.log('Post-event map-only mode initialized');
      return;
    }
    
    // Load data
    await loadPostEventData(postEventCurrentEvent);
    postEventDataLoaded = true;
    
    // Initial render
    drawPostEventChordDiagram('all', postEventCurrentDataType);
    drawPostEventProfileChart('arrivalChart', 'arrival', 'var(--good)');
    drawPostEventProfileChart('departureChart', 'departure', 'var(--med)');
    displayPostEventSpecialEventData();
    
    console.log('Post-event analysis initialized successfully');
  } catch (error) {
    console.error('Error initializing post-event data:', error);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePostEventData);
} else {
  initializePostEventData();
}
