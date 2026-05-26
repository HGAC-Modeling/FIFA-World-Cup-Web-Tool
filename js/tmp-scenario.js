/**
 * TMP Scenario Page JavaScript
 * Handles placeholder maps and interactive components for the TMP Scenario (Supply) page
 */

// Global map instances
let nrgClosuresMap = null;
let fanfestClosuresMap = null;
let priorityRoutesMap = null;
let plannedConstructionMap = null;
let hotelsMap = null;

// Priority routes data for table
let priorityRoutesData = [];

// Tab state
let activeTab = 'roadNetwork'; // 'roadNetwork' or 'parkingRideshare'

/**
 * Switch between category tabs
 * @param {string} tab - The tab to switch to
 */
function switchTab(tab) {
  activeTab = tab;

  // Get tab buttons
  const btnRoadNetwork = document.getElementById('btnRoadNetwork');
  const btnParkingRideshare = document.getElementById('btnParkingRideshare');
  const btnHotelsRentals = document.getElementById('btnHotelsRentals');

  // Get sections
  const roadNetworkSection = document.getElementById('roadNetworkSection');
  const parkingRideshareSection = document.getElementById('parkingRideshareSection');
  const hotelsRentalsSection = document.getElementById('hotelsRentalsSection');

  // Update button states
  if (btnRoadNetwork) btnRoadNetwork.classList.toggle('active', tab === 'roadNetwork');
  if (btnParkingRideshare) btnParkingRideshare.classList.toggle('active', tab === 'parkingRideshare');
  if (btnHotelsRentals) btnHotelsRentals.classList.toggle('active', tab === 'hotelsRentals');

  // Show/hide sections
  if (roadNetworkSection) roadNetworkSection.style.display = tab === 'roadNetwork' ? 'block' : 'none';
  if (parkingRideshareSection) parkingRideshareSection.style.display = tab === 'parkingRideshare' ? 'block' : 'none';
  if (hotelsRentalsSection) hotelsRentalsSection.style.display = tab === 'hotelsRentals' ? 'block' : 'none';

  // Re-invalidate maps when switching tabs to ensure proper rendering
  if (tab === 'roadNetwork') {
    setTimeout(() => {
      if (nrgClosuresMap) nrgClosuresMap.invalidateSize();
      if (fanfestClosuresMap) fanfestClosuresMap.invalidateSize();
      if (priorityRoutesMap) priorityRoutesMap.invalidateSize();
      if (plannedConstructionMap) plannedConstructionMap.invalidateSize();
    }, 100);
  } else if (tab === 'hotelsRentals') {
    setTimeout(async () => {
      // If user opens Hotels tab before async map init finishes,
      // initialize here to guarantee the map appears.
      if (!hotelsMap) {
        try {
          hotelsMap = await createHotelsMap('hotelsMap', 'data/hotels/Hotel.json');
        } catch (error) {
          console.error('Error initializing hotels map on tab open:', error);
        }
      }
      if (hotelsMap) hotelsMap.invalidateSize();
    }, 250);
  }
}

/**
 * Creates a placeholder Leaflet map centered on Houston
 * @param {string} containerId - The ID of the HTML element to contain the map
 * @param {string} label - Optional label to display on the map
 * @returns {object} Leaflet map instance
 */
function createPlaceholderMap(containerId, label = 'Placeholder Map - Data Pending') {
  // Houston coordinates
  const houstonLat = 29.7604;
  const houstonLng = -95.3698;
  const zoomLevel = 10;

  // Initialize the map
  const map = L.map(containerId, {
    center: [houstonLat, houstonLng],
    zoom: zoomLevel,
    scrollWheelZoom: false
  });

  // Add Esri satellite imagery tile layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  }).addTo(map);

  // Add a marker at Houston center with popup
  const marker = L.marker([houstonLat, houstonLng]).addTo(map);
  marker.bindPopup(`<b>${label}</b><br>Houston, TX`).openPopup();

  return map;
}

/**
 * Creates a road closure map with GeoJSON data
 * @param {string} containerId - The ID of the HTML element to contain the map
 * @param {string} geojsonPath - Path to the GeoJSON file
 * @param {string} lineColor - Color for the road closure lines
 * @returns {object} Leaflet map instance
 */
async function createRoadClosureMap(containerId, geojsonPath, lineColor) {
  // Initialize the map with basic settings
  const map = L.map(containerId, {
    scrollWheelZoom: true,
    zoomControl: true
  });

  // Add Esri satellite imagery tile layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  }).addTo(map);

  try {
    // Fetch the GeoJSON data
    const response = await fetch(geojsonPath);
    const geojsonData = await response.json();

    // Add GeoJSON layer to the map
    const geojsonLayer = L.geoJSON(geojsonData, {
      style: function (feature) {
        // Style for LineString features
        if (feature.geometry.type === 'LineString') {
          return {
            color: lineColor,
            weight: 6,
            opacity: 0.8
          };
        }
      },
      pointToLayer: function (feature, latlng) {
        // Style for Point features (like Gate 11)
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: lineColor,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
      },
      onEachFeature: function (feature, layer) {
        // Add tooltip with description on mouseover
        if (feature.properties && feature.properties.description) {
          layer.bindTooltip(feature.properties.description, {
            permanent: false,
            sticky: true,
            className: 'road-closure-tooltip',
            maxWidth: 250
          });
        }
      }
    }).addTo(map);

    // Fit the map to the bounds of the GeoJSON features
    const bounds = geojsonLayer.getBounds();
    map.fitBounds(bounds, { padding: [30, 30] });

  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    // Set a default view if GeoJSON loading fails
    map.setView([29.7604, -95.3698], 12);
  }

  return map;
}

/**
 * Creates a priority routes map with unique colors for each route
 * @param {string} containerId - The ID of the HTML element to contain the map
 * @param {string} geojsonPath - Path to the enhanced GeoJSON file with color properties
 * @returns {object} Leaflet map instance with routes data
 */
async function createPriorityRoutesMap(containerId, geojsonPath) {
  // Initialize the map with basic settings
  const map = L.map(containerId, {
    scrollWheelZoom: true,
    zoomControl: true
  });

  // Add Esri satellite imagery tile layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  }).addTo(map);

  const routesData = [];
  let routeNumber = 0;

  try {
    // Fetch the enhanced GeoJSON data
    const response = await fetch(geojsonPath);
    const geojsonData = await response.json();

    // Add GeoJSON layer to the map with unique colors
    const geojsonLayer = L.geoJSON(geojsonData, {
      style: function (feature) {
        // Use the routeColor property from enhanced GeoJSON
        const color = feature.properties.routeColor || '#00cc88';

        return {
          color: color,
          weight: 6,
          opacity: 0.8
        };
      },
      onEachFeature: function (feature, layer) {
        // Collect route data for table
        if (feature.properties.RouteName) {
          routeNumber++;
          routesData.push({
            number: routeNumber,
            name: feature.properties.RouteName,
            category: feature.properties.Route_Category || 'N/A',
            origin: feature.properties.Origin || 'N/A',
            destination: feature.properties.Destination || 'N/A',
            color: feature.properties.routeColor || '#00cc88'
          });
        }

        // Add tooltip with description on mouseover
        if (feature.properties && feature.properties.description) {
          const color = feature.properties.routeColor || '#00cc88';
          layer.bindTooltip(
            `<div style="border-left: 4px solid ${color}; padding-left: 8px;">
              <strong>Route #${routeNumber}</strong><br>
              ${feature.properties.description}
            </div>`,
            {
              permanent: false,
              sticky: true,
              className: 'road-closure-tooltip',
              maxWidth: 300
            }
          );
        }
      }
    }).addTo(map);

    // Fit the map to the bounds of the GeoJSON features
    const bounds = geojsonLayer.getBounds();
    map.fitBounds(bounds, { padding: [30, 30] });

  } catch (error) {
    console.error('Error loading priority routes GeoJSON:', error);
    // Set a default view if GeoJSON loading fails
    map.setView([29.7604, -95.3698], 12);
  }

  // Return map and routes data
  return { map, routesData };
}

/**
 * Initialize all maps on the page
 */
async function initializeMaps() {
  // Road Closures Maps with GeoJSON data
  nrgClosuresMap = await createRoadClosureMap(
    'nrgClosuresMap',
    'specs/road_closures/nrg_closures.geojson',
    '#ff5733' // Orange-red for NRG
  );

  fanfestClosuresMap = await createRoadClosureMap(
    'fanfestClosuresMap',
    'specs/road_closures/fanfest_closures.geojson',
    '#5b6cf8' // Blue-purple for Fan Fest
  );

  // Priority Routes Map with enhanced GeoJSON data (unique colors)
  const priorityRoutesResult = await createPriorityRoutesMap(
    'priorityRoutesMap',
    'data/Priority Routes/priority_routes_enhanced.geojson'
  );
  priorityRoutesMap = priorityRoutesResult.map;
  priorityRoutesData = priorityRoutesResult.routesData;

  // Populate the priority routes table
  populatePriorityRoutesTable();

  // Planned Construction Map (placeholder)
  plannedConstructionMap = createPlaceholderMap('plannedConstructionMap', 'Planned Construction Map');

  // Hotels map using converted WGS84 GeoJSON
  hotelsMap = await createHotelsMap(
    'hotelsMap',
    'data/hotels/Hotel.json'
  );
}

/**
 * Update slider gradient background for WebKit browsers
 * @param {HTMLElement} slider - The slider element
 */
function updateSliderGradient(slider) {
  const min = slider.min || 0;
  const max = slider.max || 100;
  const value = slider.value;
  const percentage = ((value - min) / (max - min)) * 100;

  // Apply gradient background: gradient to the left of thumb, gray to the right
  slider.style.background = `linear-gradient(to right, #5b6cf8 0%, #9333ea ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}

/**
 * Initialize parking calculations for NRG Stadium
 */
function initializeParkingNRG() {
  const spacesSlider = document.getElementById('parking_nrg_spaces');
  const ppvSlider = document.getElementById('parking_nrg_ppv');
  const spacesValue = document.getElementById('parking_nrg_spacesValue');
  const ppvValue = document.getElementById('parking_nrg_ppvValue');
  const totalDisplay = document.getElementById('parking_nrg_total');

  function updateParkingTotal() {
    if (spacesSlider && ppvSlider && totalDisplay) {
      const spaces = parseInt(spacesSlider.value);
      const ppv = parseFloat(ppvSlider.value);
      const total = Math.round(spaces * ppv);
      totalDisplay.textContent = total.toLocaleString();
    }
  }

  if (spacesSlider && spacesValue) {
    updateSliderGradient(spacesSlider);
    spacesSlider.addEventListener('input', function () {
      spacesValue.textContent = parseInt(this.value).toLocaleString();
      updateSliderGradient(this);
      updateParkingTotal();
    });
  }

  if (ppvSlider && ppvValue) {
    updateSliderGradient(ppvSlider);
    ppvSlider.addEventListener('input', function () {
      ppvValue.textContent = parseFloat(this.value).toFixed(1);
      updateSliderGradient(this);
      updateParkingTotal();
    });
  }

  // Initial calculation
  updateParkingTotal();
}

/**
 * Initialize parking calculations for Fan Fest
 */
function initializeParkingFanFest() {
  const spacesSlider = document.getElementById('parking_fanfest_spaces');
  const ppvSlider = document.getElementById('parking_fanfest_ppv');
  const spacesValue = document.getElementById('parking_fanfest_spacesValue');
  const ppvValue = document.getElementById('parking_fanfest_ppvValue');
  const totalDisplay = document.getElementById('parking_fanfest_total');

  function updateParkingTotal() {
    if (spacesSlider && ppvSlider && totalDisplay) {
      const spaces = parseInt(spacesSlider.value);
      const ppv = parseFloat(ppvSlider.value);
      const total = Math.round(spaces * ppv);
      totalDisplay.textContent = total.toLocaleString();
    }
  }

  if (spacesSlider && spacesValue) {
    updateSliderGradient(spacesSlider);
    spacesSlider.addEventListener('input', function () {
      spacesValue.textContent = parseInt(this.value).toLocaleString();
      updateSliderGradient(this);
      updateParkingTotal();
    });
  }

  if (ppvSlider && ppvValue) {
    updateSliderGradient(ppvSlider);
    ppvSlider.addEventListener('input', function () {
      ppvValue.textContent = parseFloat(this.value).toFixed(1);
      updateSliderGradient(this);
      updateParkingTotal();
    });
  }

  // Initial calculation
  updateParkingTotal();
}

/**
 * Initialize rideshare calculations for NRG Stadium
 */
function initializeRideshareNRG() {
  const pickupsSlider = document.getElementById('rideshare_nrg_pickups');
  const ppvSlider = document.getElementById('rideshare_nrg_ppv');
  const pickupsValue = document.getElementById('rideshare_nrg_pickupsValue');
  const ppvValue = document.getElementById('rideshare_nrg_ppvValue');
  const totalDisplay = document.getElementById('rideshare_nrg_total');

  function updateRideshareTotal() {
    if (pickupsSlider && ppvSlider && totalDisplay) {
      const pickups = parseInt(pickupsSlider.value);
      const ppv = parseFloat(ppvSlider.value);
      const total = Math.round(pickups * ppv);
      totalDisplay.textContent = total.toLocaleString();
    }
  }

  if (pickupsSlider && pickupsValue) {
    updateSliderGradient(pickupsSlider);
    pickupsSlider.addEventListener('input', function () {
      pickupsValue.textContent = parseInt(this.value).toLocaleString();
      updateSliderGradient(this);
      updateRideshareTotal();
    });
  }

  if (ppvSlider && ppvValue) {
    updateSliderGradient(ppvSlider);
    ppvSlider.addEventListener('input', function () {
      ppvValue.textContent = parseFloat(this.value).toFixed(1);
      updateSliderGradient(this);
      updateRideshareTotal();
    });
  }

  // Initial calculation
  updateRideshareTotal();
}

/**
 * Initialize rideshare calculations for Fan Fest
 */
function initializeRideshareFanFest() {
  const pickupsSlider = document.getElementById('rideshare_fanfest_pickups');
  const ppvSlider = document.getElementById('rideshare_fanfest_ppv');
  const pickupsValue = document.getElementById('rideshare_fanfest_pickupsValue');
  const ppvValue = document.getElementById('rideshare_fanfest_ppvValue');
  const totalDisplay = document.getElementById('rideshare_fanfest_total');

  function updateRideshareTotal() {
    if (pickupsSlider && ppvSlider && totalDisplay) {
      const pickups = parseInt(pickupsSlider.value);
      const ppv = parseFloat(ppvSlider.value);
      const total = Math.round(pickups * ppv);
      totalDisplay.textContent = total.toLocaleString();
    }
  }

  if (pickupsSlider && pickupsValue) {
    updateSliderGradient(pickupsSlider);
    pickupsSlider.addEventListener('input', function () {
      pickupsValue.textContent = parseInt(this.value).toLocaleString();
      updateSliderGradient(this);
      updateRideshareTotal();
    });
  }

  if (ppvSlider && ppvValue) {
    updateSliderGradient(ppvSlider);
    ppvSlider.addEventListener('input', function () {
      ppvValue.textContent = parseFloat(this.value).toFixed(1);
      updateSliderGradient(this);
      updateRideshareTotal();
    });
  }

  // Initial calculation
  updateRideshareTotal();
}

/**
 * Page initialization
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('TMP Scenario page loaded');

  // Initialize all placeholder maps
  initializeMaps();

  // Initialize parking functionality
  initializeParkingNRG();
  initializeParkingFanFest();

  // Initialize rideshare functionality
  initializeRideshareNRG();
  initializeRideshareFanFest();

  // Set up tab switching event listeners
  const btnRoadNetwork = document.getElementById('btnRoadNetwork');
  const btnParkingRideshare = document.getElementById('btnParkingRideshare');
  const btnHotelsRentals = document.getElementById('btnHotelsRentals');

  if (btnRoadNetwork) {
    btnRoadNetwork.addEventListener('click', () => switchTab('roadNetwork'));
  }

  if (btnParkingRideshare) {
    btnParkingRideshare.addEventListener('click', () => switchTab('parkingRideshare'));
  }

  if (btnHotelsRentals) {
    btnHotelsRentals.addEventListener('click', () => switchTab('hotelsRentals'));
  }
});

/**
 * Toggle the priority routes table visibility
 */
function toggleRoutesTable() {
  const container = document.getElementById('routesTableContainer');
  const button = document.getElementById('toggleRoutesTable');
  const icon = document.getElementById('toggleIcon');

  if (container && button && icon) {
    if (container.style.display === 'none') {
      container.style.display = 'block';
      button.innerHTML = '<span id="toggleIcon">▲</span> Hide Routes Table';
    } else {
      container.style.display = 'none';
      button.innerHTML = '<span id="toggleIcon">▼</span> Show Routes Table';
    }
  }
}

/**
 * Creates a hotels map with point markers and hotel name tooltips
 * @param {string} containerId - The ID of the HTML element to contain the map
 * @param {string} geojsonPath - Path to the GeoJSON file
 * @returns {object} Leaflet map instance
 */
async function createHotelsMap(containerId, geojsonPath) {
  const map = L.map(containerId, {
    scrollWheelZoom: true,
    zoomControl: true
  });

  // Esri satellite imagery, consistent with other maps
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  }).addTo(map);

  try {
    const response = await fetch(geojsonPath);
    const geojsonData = await response.json();

    const hotelsLayer = L.geoJSON(geojsonData, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5,
          fillColor: '#e11d48',
          color: '#ffffff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.9
        });
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindTooltip(feature.properties.name, {
            permanent: false,
            sticky: true,
            className: 'road-closure-tooltip',
            maxWidth: 260
          });
        }
      }
    }).addTo(map);

    const bounds = hotelsLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    } else {
      map.setView([29.7604, -95.3698], 5);
    }
  } catch (error) {
    console.error('Error loading Hotels GeoJSON:', error);
    map.setView([29.7604, -95.3698], 5);
  }

  return map;
}

/**
 * Populate the priority routes table with data
 */
function populatePriorityRoutesTable() {
  const tableBody = document.getElementById('routesTableBody');

  if (!tableBody || !priorityRoutesData || priorityRoutesData.length === 0) {
    console.log('No routes data available for table');
    return;
  }

  // Clear existing rows
  tableBody.innerHTML = '';

  // Create a row for each route
  priorityRoutesData.forEach((route, index) => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #f0f0f0';
    row.style.transition = 'background 0.2s';

    // Add hover effect
    row.addEventListener('mouseenter', function () {
      this.style.background = 'var(--panel)';
    });
    row.addEventListener('mouseleave', function () {
      this.style.background = 'white';
    });

    // Route number cell
    const numberCell = document.createElement('td');
    numberCell.style.padding = '10px 12px';
    numberCell.style.fontSize = '13px';
    numberCell.style.fontWeight = '600';
    numberCell.style.color = 'var(--ink)';
    numberCell.textContent = route.number;
    row.appendChild(numberCell);

    // Color swatch cell
    const colorCell = document.createElement('td');
    colorCell.style.padding = '10px 12px';
    const colorSwatch = document.createElement('div');
    colorSwatch.style.width = '30px';
    colorSwatch.style.height = '20px';
    colorSwatch.style.background = route.color;
    colorSwatch.style.borderRadius = '4px';
    colorSwatch.style.border = '1px solid #ddd';
    colorCell.appendChild(colorSwatch);
    row.appendChild(colorCell);

    // Category cell
    const categoryCell = document.createElement('td');
    categoryCell.style.padding = '10px 12px';
    categoryCell.style.fontSize = '13px';
    categoryCell.style.color = 'var(--muted)';
    categoryCell.textContent = route.category;
    row.appendChild(categoryCell);

    // Origin cell
    const originCell = document.createElement('td');
    originCell.style.padding = '10px 12px';
    originCell.style.fontSize = '13px';
    originCell.style.color = 'var(--muted)';
    originCell.textContent = route.origin;
    row.appendChild(originCell);

    // Destination cell
    const destCell = document.createElement('td');
    destCell.style.padding = '10px 12px';
    destCell.style.fontSize = '13px';
    destCell.style.color = 'var(--muted)';
    destCell.textContent = route.destination;
    row.appendChild(destCell);

    // Route/Frequency cell (shortened display) - moved to last position
    const nameCell = document.createElement('td');
    nameCell.style.padding = '10px 12px';
    nameCell.style.fontSize = '13px';
    nameCell.style.color = 'var(--ink)';
    const shortName = route.name.split('/').slice(-1)[0] || route.name;
    nameCell.textContent = shortName;
    nameCell.title = route.name; // Full name on hover
    row.appendChild(nameCell);

    tableBody.appendChild(row);
  });

  console.log(`Populated routes table with ${priorityRoutesData.length} routes`);
}
