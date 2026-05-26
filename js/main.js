const MAPS = {
  heatmap_am: "maps/heatmap_trips_map_AM.html",
  heatmap_md: "maps/heatmap_trips_map_MD.html",
  heatmap_ov: "maps/heatmap_trips_map_OV.html",
  heatmap_pm: "maps/heatmap_trips_map_PM.html",
  hexagon_am: "maps/hexagon_trips_map_AM.html",
  hexagon_md: "maps/hexagon_trips_map_MD.html",
  hexagon_ov: "maps/hexagon_trips_map_OV.html",
  hexagon_pm: "maps/hexagon_trips_map_PM.html"
};

// Initialize DOM elements
const sel = document.getElementById('eventSel');
const mapFrame = document.getElementById('mapFrame');
const buffer = document.getElementById('bufferRange');
const bufferOut = document.getElementById('bufferOut');

// Event listeners
sel.addEventListener('change', () => { 
  mapFrame.src = MAPS[sel.value]; 
});

buffer.addEventListener('input', () => { 
  bufferOut.textContent = buffer.value + " mi"; 
  update(); 
});

// Draw roadway share bars
const roadwayBars = document.getElementById('roadwayBars');
function drawBars(){
  const labels = ['I-10','I-85','I-75','I-485','I-495'];
  roadwayBars.innerHTML = '';
  labels.forEach(l => {
    const row = document.createElement('div'); 
    row.className = 'bar';
    
    const lab = document.createElement('label'); 
    lab.textContent = l; 
    row.appendChild(lab);
    
    const track = document.createElement('div'); 
    track.className = 'bar-track';
    
    const fill = document.createElement('div'); 
    fill.className = 'bar-fill'; 
    fill.style.width = (30 + Math.random() * 60) + '%'; 
    fill.style.background = 'linear-gradient(90deg,var(--med),var(--avg))';
    
    track.appendChild(fill); 
    row.appendChild(track);
    roadwayBars.appendChild(row);
  });
}

// Draw chart function
function drawChart(svgId, color){
  const svg = document.getElementById(svgId);
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
  drawBars();
  drawChart('snapshotChart', 'var(--avg)');
  drawChart('arrivalChart', 'var(--good)');
  drawChart('departureChart', 'var(--med)');
}

// Initialize the application
update();
