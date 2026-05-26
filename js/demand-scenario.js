// Demand Scenario State (6.2 - Multi-Model Structure)
const state = {
  // Active model selector
  activeModel: 'nrg', // 'nrg', 'fanfest', or 'airports'

  // PART 1: GENERAL PARAMETERS (shared across all models)
  general: {
    dayType: 'weekday',
    selectedDate: null,
    international: 75,
    domestic: 25,
    outsideRegion: 80,
    insideRegion: 20,
    tdmReduction: 0
  },

  // PART 2: MODEL-SPECIFIC PARAMETERS
  nrg: {
    gameStartTime: '11:00',
    gameDuration: 150,
    attendance: 75000,
    spectator: 58000,
    fifaConstituent: 17000,
    ingressTransit: 20,
    ingressTNC: 9,
    ingressWalkBike: 1,
    ingressAuto: 70,
    egressTransit: 20,
    egressTNC: 9,
    egressWalkBike: 1,
    egressAuto: 70,
    ingressProfile: null, // 18 hours: 6am-11pm
    egressProfile: null,
    selectedProfilePreset: 'default',
  },

  fanfest: {
    attendance: 20000,
    ingressTransit: 38,
    ingressTNC: 7,
    ingressWalkBike: 5,
    ingressAuto: 50,
    egressTransit: 38,
    egressTNC: 7,
    egressWalkBike: 5,
    egressAuto: 50,
    ingressProfile: null, // 18 hours: 6am-11pm
    egressProfile: null,
  }
};

// Utility function to format numbers with commas
function formatNumber(num) {
  return num.toLocaleString('en-US');
}

// Update slider background gradient based on value
function updateSliderBackground(slider) {
  const min = slider.min || 0;
  const max = slider.max || 100;
  const value = slider.value;
  const percentage = ((value - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(90deg, var(--accent) 0%, #9333ea ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
}

// DOM Elements - General Parameters (Part 1)
const btnWeekday = document.getElementById('btnWeekday');
const btnWeekend = document.getElementById('btnWeekend');
const btnCalendar = document.getElementById('btnCalendar');
const calendarModal = document.getElementById('calendarModal');
const closeModal = document.getElementById('closeModal');
const selectedDateInput = document.getElementById('selectedDate');
const fifaDates = document.querySelectorAll('.fifa-date');
const internationalSplitSlider = document.getElementById('internationalSplit');
const internationalValue = document.getElementById('internationalValue');
const domesticValue = document.getElementById('domesticValue');
const regionSplitSlider = document.getElementById('regionSplit');
const outsideRegionValue = document.getElementById('outsideRegionValue');
const insideRegionValue = document.getElementById('insideRegionValue');
const tdmReductionSlider = document.getElementById('tdmReduction');
const tdmReductionValue = document.getElementById('tdmReductionValue');

// Model Selector Buttons
const btnNRG = document.getElementById('btnNRG');
const btnFanFest = document.getElementById('btnFanFest');
const nrgSection = document.getElementById('nrgSection');
const fanfestSection = document.getElementById('fanfestSection');

// Import/Export
const btnImportScenario = document.getElementById('btnImportScenario');
const importMethodSelect = document.getElementById('importMethodSelect');
const csvFileInput = document.getElementById('csvFileInput');
const btnSaveScenario = document.getElementById('btnSaveScenario');
const summaryModal = document.getElementById('summaryModal');
const closeSummaryModal = document.getElementById('closeSummaryModal');
const btnCancelSummary = document.getElementById('btnCancelSummary');
const btnContinueToName = document.getElementById('btnContinueToName');
const summaryTableContainer = document.getElementById('summaryTableContainer');
const saveScenarioModal = document.getElementById('saveScenarioModal');
const closeSaveModal = document.getElementById('closeSaveModal');
const btnCancelSave = document.getElementById('btnCancelSave');
const btnConfirmSave = document.getElementById('btnConfirmSave');
const scenarioNameInput = document.getElementById('scenarioNameInput');

// Switch between model tabs (NRG, Fan Fest)
function switchModel(model) {
  state.activeModel = model;

  // Update button states
  btnNRG.classList.toggle('active', model === 'nrg');
  btnFanFest.classList.toggle('active', model === 'fanfest');

  // Show/hide sections
  nrgSection.style.display = model === 'nrg' ? 'block' : 'none';
  fanfestSection.style.display = model === 'fanfest' ? 'block' : 'none';

  // Initialize profile chart for the active model
  if (model === 'nrg') {
    nrgProfileChart.init();
  } else if (model === 'fanfest') {
    fanfestProfileChart.init();
  }
}

// Initialize
function init() {
  initializeSliders();

  // Force NRG profile preset to Default on initial page load
  const nrgProfilePreset = document.getElementById('nrg_profilePreset');
  if (nrgProfilePreset) {
    nrgProfilePreset.value = 'default';
  }
  state.nrg.selectedProfilePreset = 'default';

  // Initialize all model profiles with defaults
  generateDefaultProfilesNRG();
  generateDefaultProfilesFanFest();

  switchModel('nrg'); // Start with NRG Stadium

  // Bind listeners after initial render so defaults always appear on first load.
  try {
    setupEventListeners();
  } catch (error) {
    console.error('Error binding event listeners:', error);
  }
}

function initializeSliders() {
  // General parameters
  updateSliderBackground(internationalSplitSlider);
  updateSliderBackground(regionSplitSlider);
  updateSliderBackground(tdmReductionSlider);

  // NRG sliders
  const nrgAttendance = document.getElementById('nrg_attendance');
  const nrgSpectator = document.getElementById('nrg_spectator');
  const nrgFifaConstituent = document.getElementById('nrg_fifaConstituent');
  const nrgIngressTransit = document.getElementById('nrg_ingressTransit');
  const nrgIngressTNC = document.getElementById('nrg_ingressTNC');
  const nrgIngressWalkBike = document.getElementById('nrg_ingressWalkBike');
  const nrgEgressTransit = document.getElementById('nrg_egressTransit');
  const nrgEgressTNC = document.getElementById('nrg_egressTNC');
  const nrgEgressWalkBike = document.getElementById('nrg_egressWalkBike');

  updateSliderBackground(nrgAttendance);
  updateSliderBackground(nrgSpectator);
  updateSliderBackground(nrgFifaConstituent);
  updateSliderBackground(nrgIngressTransit);
  updateSliderBackground(nrgIngressTNC);
  updateSliderBackground(nrgIngressWalkBike);
  updateSliderBackground(nrgEgressTransit);
  updateSliderBackground(nrgEgressTNC);
  updateSliderBackground(nrgEgressWalkBike);

  // Fan Fest sliders
  const fanfestAttendance = document.getElementById('fanfest_attendance');
  const fanfestIngressTransit = document.getElementById('fanfest_ingressTransit');
  const fanfestIngressTNC = document.getElementById('fanfest_ingressTNC');
  const fanfestIngressWalkBike = document.getElementById('fanfest_ingressWalkBike');
  const fanfestEgressTransit = document.getElementById('fanfest_egressTransit');
  const fanfestEgressTNC = document.getElementById('fanfest_egressTNC');
  const fanfestEgressWalkBike = document.getElementById('fanfest_egressWalkBike');

  updateSliderBackground(fanfestAttendance);
  updateSliderBackground(fanfestIngressTransit);
  updateSliderBackground(fanfestIngressTNC);
  updateSliderBackground(fanfestIngressWalkBike);
  updateSliderBackground(fanfestEgressTransit);
  updateSliderBackground(fanfestEgressTNC);
  updateSliderBackground(fanfestEgressWalkBike);
}

function setupEventListeners() {
  // ========== MODEL SELECTOR BUTTONS ==========
  btnNRG.addEventListener('click', () => switchModel('nrg'));
  btnFanFest.addEventListener('click', () => switchModel('fanfest'));

  // ========== PART 1: GENERAL PARAMETERS ==========

  // Weekday/Weekend toggle
  btnWeekday.addEventListener('click', () => {
    state.general.dayType = 'weekday';
    btnWeekday.classList.add('active');
    btnWeekend.classList.remove('active');
    state.general.selectedDate = null;
    selectedDateInput.value = '';
  });

  btnWeekend.addEventListener('click', () => {
    state.general.dayType = 'weekend';
    btnWeekend.classList.add('active');
    btnWeekday.classList.remove('active');
    state.general.selectedDate = null;
    selectedDateInput.value = '';
  });

  // Calendar modal
  btnCalendar.addEventListener('click', () => {
    calendarModal.classList.add('show');
  });

  closeModal.addEventListener('click', () => {
    calendarModal.classList.remove('show');
  });

  calendarModal.addEventListener('click', (e) => {
    if (e.target === calendarModal) {
      calendarModal.classList.remove('show');
    }
  });

  // FIFA date selection
  fifaDates.forEach(dateBtn => {
    dateBtn.addEventListener('click', () => {
      const date = dateBtn.getAttribute('data-date');
      const day = dateBtn.getAttribute('data-day');

      state.general.selectedDate = date;
      selectedDateInput.value = dateBtn.textContent;

      // Determine weekday vs weekend
      if (day === 'Saturday' || day === 'Sunday') {
        state.general.dayType = 'weekend';
        btnWeekend.classList.add('active');
        btnWeekday.classList.remove('active');
      } else {
        state.general.dayType = 'weekday';
        btnWeekday.classList.add('active');
        btnWeekend.classList.remove('active');
      }

      calendarModal.classList.remove('show');
    });
  });

  // International/Domestic split slider
  internationalSplitSlider.addEventListener('input', () => {
    state.general.international = parseInt(internationalSplitSlider.value);
    state.general.domestic = 100 - state.general.international;

    // 6.1a: Outside region must be at least as much as International
    if (state.general.international > state.general.outsideRegion) {
      state.general.outsideRegion = state.general.international;
      state.general.insideRegion = 100 - state.general.outsideRegion;
      regionSplitSlider.value = state.general.outsideRegion;
      outsideRegionValue.textContent = state.general.outsideRegion;
      insideRegionValue.textContent = state.general.insideRegion;
      updateSliderBackground(regionSplitSlider);
    }

    internationalValue.textContent = state.general.international;
    domesticValue.textContent = state.general.domestic;
    updateSliderBackground(internationalSplitSlider);
  });

  // Region split slider
  regionSplitSlider.addEventListener('input', () => {
    state.general.outsideRegion = parseInt(regionSplitSlider.value);
    state.general.insideRegion = 100 - state.general.outsideRegion;

    // 6.1a: Outside region must be at least as much as International
    if (state.general.outsideRegion < state.general.international) {
      state.general.international = state.general.outsideRegion;
      state.general.domestic = 100 - state.general.international;
      internationalSplitSlider.value = state.general.international;
      internationalValue.textContent = state.general.international;
      domesticValue.textContent = state.general.domestic;
      updateSliderBackground(internationalSplitSlider);
    }

    outsideRegionValue.textContent = state.general.outsideRegion;
    insideRegionValue.textContent = state.general.insideRegion;
    updateSliderBackground(regionSplitSlider);
  });

  // TDM Reduction slider
  tdmReductionSlider.addEventListener('input', () => {
    state.general.tdmReduction = parseInt(tdmReductionSlider.value);
    tdmReductionValue.textContent = state.general.tdmReduction;
    updateSliderBackground(tdmReductionSlider);
  });

  // ========== PART 2: NRG STADIUM MODEL-SPECIFIC PARAMETERS ==========
  setupNRGListeners();

  // ========== PART 2: FAN FEST MODEL-SPECIFIC PARAMETERS ==========
  setupFanFestListeners();

  // ========== IMPORT/EXPORT BUTTONS ==========
  // Import scenario button - toggle dropdown
  btnImportScenario.addEventListener('click', () => {
    if (importMethodSelect.style.display === 'none') {
      importMethodSelect.style.display = 'block';
      importMethodSelect.value = ''; // Reset selection
    } else {
      importMethodSelect.style.display = 'none';
    }
  });

  // Import method selector handler
  importMethodSelect.addEventListener('change', (e) => {
    const selectedMethod = e.target.value;

    if (selectedMethod === 'csv') {
      // User selected "Import from CSV" - open file picker
      csvFileInput.click();
      importMethodSelect.style.display = 'none';
      importMethodSelect.value = ''; // Reset selection
    } else if (selectedMethod === 'baseline_weekday' || selectedMethod === 'baseline_weekend') {
      // User selected a prebuilt scenario - load it
      loadPrebuiltScenario(selectedMethod);
      importMethodSelect.style.display = 'none';
      importMethodSelect.value = ''; // Reset selection
    }
  });

  // CSV file input handler
  csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importScenarioFromCSV(event.target.result);
        // Reset file input so the same file can be imported again
        csvFileInput.value = '';
      } catch (error) {
        alert('Error importing CSV: ' + error.message);
        csvFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Save scenario button - Step 1: Validate, then show summary
  btnSaveScenario.addEventListener('click', () => {
    // Step 1: Validate
    const validationErrors = validateScenario();
    if (validationErrors.length > 0) {
      alert('Cannot save scenario. Please fix the following issues:\n\n' + validationErrors.join('\n'));
      return;
    }

    // Step 2: Show summary
    displaySummaryTable();
    summaryModal.classList.add('show');
  });

  // Summary modal - close
  closeSummaryModal.addEventListener('click', () => {
    summaryModal.classList.remove('show');
  });

  btnCancelSummary.addEventListener('click', () => {
    summaryModal.classList.remove('show');
  });

  // Close summary modal when clicking outside
  summaryModal.addEventListener('click', (e) => {
    if (e.target === summaryModal) {
      summaryModal.classList.remove('show');
    }
  });

  // Continue button - go to name entry
  btnContinueToName.addEventListener('click', () => {
    summaryModal.classList.remove('show');
    scenarioNameInput.value = '';
    saveScenarioModal.classList.add('show');
    scenarioNameInput.focus();
  });

  // Close save modal
  closeSaveModal.addEventListener('click', () => {
    saveScenarioModal.classList.remove('show');
  });

  btnCancelSave.addEventListener('click', () => {
    saveScenarioModal.classList.remove('show');
  });

  // Close modal when clicking outside
  saveScenarioModal.addEventListener('click', (e) => {
    if (e.target === saveScenarioModal) {
      saveScenarioModal.classList.remove('show');
    }
  });

  // Confirm save button - Step 3: Download CSV
  btnConfirmSave.addEventListener('click', () => {
    const scenarioName = scenarioNameInput.value.trim();
    if (!scenarioName) {
      alert('Please enter a scenario name');
      return;
    }

    exportScenarioToCSV(scenarioName);
  });
}

// ========== MODEL-SPECIFIC SETUP FUNCTIONS ==========

function setupNRGListeners() {
  // 1. Game Start Time
  const nrgGameStartTime = document.getElementById('nrg_gameStartTime');
  nrgGameStartTime.addEventListener('change', (e) => {
    state.nrg.gameStartTime = e.target.value;

    if (state.nrg.selectedProfilePreset === 'default') {
      // Default mode: regenerate profiles based on game time
      generateDefaultProfilesNRG();
      nrgProfileChart.init();
    } else {
      // Prior Event selected: only update the dotted line indicators
      nrgProfileChart.updateGameLines();
    }
  });

  // 2. Game Duration
  const nrgGameDuration = document.getElementById('nrg_gameDuration');
  nrgGameDuration.addEventListener('change', (e) => {
    state.nrg.gameDuration = parseInt(e.target.value);

    if (state.nrg.selectedProfilePreset === 'default') {
      // Default mode: regenerate profiles based on game time
      generateDefaultProfilesNRG();
      nrgProfileChart.init();
    } else {
      // Prior Event selected: only update the dotted line indicators
      nrgProfileChart.updateGameLines();
    }
  });

  // 3. NRG Attendance
  const nrgAttendance = document.getElementById('nrg_attendance');
  const nrgAttendanceValue = document.getElementById('nrg_attendanceValue');
  nrgAttendance.addEventListener('input', (e) => {
    state.nrg.attendance = parseInt(e.target.value);
    nrgAttendanceValue.textContent = formatNumber(state.nrg.attendance);
    updateSliderBackground(nrgAttendance);
    adjustNRGSplitProportional();
  });

  // 4. Spectator Slider
  const nrgSpectator = document.getElementById('nrg_spectator');
  nrgSpectator.addEventListener('input', (e) => {
    let newSpectator = parseInt(e.target.value);
    const totalAttendance = state.nrg.attendance;

    // Enforce max constraint
    if (newSpectator > 58000) newSpectator = 58000;

    // Enforce constraint: spectator cannot exceed attendance
    if (newSpectator > totalAttendance) newSpectator = totalAttendance;

    // Calculate new FIFA constituent (must sum to attendance)
    let newFIFA = totalAttendance - newSpectator;

    // Enforce FIFA max constraint
    if (newFIFA > 17000) {
      newFIFA = 17000;
      newSpectator = totalAttendance - 17000;
    }

    // Enforce min constraints
    if (newSpectator < 0) newSpectator = 0;
    if (newFIFA < 0) newFIFA = 0;

    state.nrg.spectator = newSpectator;
    state.nrg.fifaConstituent = newFIFA;
    updateNRGSplitUI();
  });

  // 5. FIFA Constituent Slider
  const nrgFifaConstituent = document.getElementById('nrg_fifaConstituent');
  nrgFifaConstituent.addEventListener('input', (e) => {
    let newFIFA = parseInt(e.target.value);
    const totalAttendance = state.nrg.attendance;

    // Enforce max constraint
    if (newFIFA > 17000) newFIFA = 17000;

    // Enforce constraint: FIFA cannot exceed attendance
    if (newFIFA > totalAttendance) newFIFA = totalAttendance;

    // Calculate new spectator (must sum to attendance)
    let newSpectator = totalAttendance - newFIFA;

    // Enforce spectator max constraint
    if (newSpectator > 58000) {
      newSpectator = 58000;
      newFIFA = totalAttendance - 58000;
    }

    // Enforce min constraints
    if (newSpectator < 0) newSpectator = 0;
    if (newFIFA < 0) newFIFA = 0;

    state.nrg.spectator = newSpectator;
    state.nrg.fifaConstituent = newFIFA;
    updateNRGSplitUI();
  });

  // 6. Ingress Mode Shares
  const nrgIngressTransit = document.getElementById('nrg_ingressTransit');
  const nrgIngressTransitValue = document.getElementById('nrg_ingressTransitValue');
  nrgIngressTransit.addEventListener('input', (e) => {
    state.nrg.ingressTransit = parseInt(e.target.value);
    nrgIngressTransitValue.textContent = state.nrg.ingressTransit;
    updateSliderBackground(nrgIngressTransit);
    updateNRGIngressAuto();
  });

  const nrgIngressTNC = document.getElementById('nrg_ingressTNC');
  const nrgIngressTNCValue = document.getElementById('nrg_ingressTNCValue');
  nrgIngressTNC.addEventListener('input', (e) => {
    state.nrg.ingressTNC = parseInt(e.target.value);
    nrgIngressTNCValue.textContent = state.nrg.ingressTNC;
    updateSliderBackground(nrgIngressTNC);
    updateNRGIngressAuto();
  });

  const nrgIngressWalkBike = document.getElementById('nrg_ingressWalkBike');
  const nrgIngressWalkBikeValue = document.getElementById('nrg_ingressWalkBikeValue');
  nrgIngressWalkBike.addEventListener('input', (e) => {
    state.nrg.ingressWalkBike = parseInt(e.target.value);
    nrgIngressWalkBikeValue.textContent = state.nrg.ingressWalkBike;
    updateSliderBackground(nrgIngressWalkBike);
    updateNRGIngressAuto();
  });

  // 7. Egress Mode Shares
  const nrgEgressTransit = document.getElementById('nrg_egressTransit');
  const nrgEgressTransitValue = document.getElementById('nrg_egressTransitValue');
  nrgEgressTransit.addEventListener('input', (e) => {
    state.nrg.egressTransit = parseInt(e.target.value);
    nrgEgressTransitValue.textContent = state.nrg.egressTransit;
    updateSliderBackground(nrgEgressTransit);
    updateNRGEgressAuto();
  });

  const nrgEgressTNC = document.getElementById('nrg_egressTNC');
  const nrgEgressTNCValue = document.getElementById('nrg_egressTNCValue');
  nrgEgressTNC.addEventListener('input', (e) => {
    state.nrg.egressTNC = parseInt(e.target.value);
    nrgEgressTNCValue.textContent = state.nrg.egressTNC;
    updateSliderBackground(nrgEgressTNC);
    updateNRGEgressAuto();
  });

  const nrgEgressWalkBike = document.getElementById('nrg_egressWalkBike');
  const nrgEgressWalkBikeValue = document.getElementById('nrg_egressWalkBikeValue');
  nrgEgressWalkBike.addEventListener('input', (e) => {
    state.nrg.egressWalkBike = parseInt(e.target.value);
    nrgEgressWalkBikeValue.textContent = state.nrg.egressWalkBike;
    updateSliderBackground(nrgEgressWalkBike);
    updateNRGEgressAuto();
  });

  // 8. Profile Preset Dropdown
  const nrgProfilePreset = document.getElementById('nrg_profilePreset');
  nrgProfilePreset.addEventListener('change', async (e) => {
    state.nrg.selectedProfilePreset = e.target.value;

    if (e.target.value === 'default') {
      // Generate default game-time-based profiles
      generateDefaultProfilesNRG();
      nrgProfileChart.init();
    } else {
      // Load prior event profile from CSV
      await loadPriorEventProfile(e.target.value);
    }
  });
}

function setupFanFestListeners() {
  // 1. Fan Fest Attendance
  const fanfestAttendance = document.getElementById('fanfest_attendance');
  const fanfestAttendanceValue = document.getElementById('fanfest_attendanceValue');
  fanfestAttendance.addEventListener('input', (e) => {
    state.fanfest.attendance = parseInt(e.target.value);
    fanfestAttendanceValue.textContent = formatNumber(state.fanfest.attendance);
    updateSliderBackground(fanfestAttendance);
  });

  // 2. Ingress Mode Shares
  const fanfestIngressTransit = document.getElementById('fanfest_ingressTransit');
  const fanfestIngressTransitValue = document.getElementById('fanfest_ingressTransitValue');
  fanfestIngressTransit.addEventListener('input', (e) => {
    state.fanfest.ingressTransit = parseInt(e.target.value);
    fanfestIngressTransitValue.textContent = state.fanfest.ingressTransit;
    updateSliderBackground(fanfestIngressTransit);
    updateFanFestIngressAuto();
  });

  const fanfestIngressTNC = document.getElementById('fanfest_ingressTNC');
  const fanfestIngressTNCValue = document.getElementById('fanfest_ingressTNCValue');
  fanfestIngressTNC.addEventListener('input', (e) => {
    state.fanfest.ingressTNC = parseInt(e.target.value);
    fanfestIngressTNCValue.textContent = state.fanfest.ingressTNC;
    updateSliderBackground(fanfestIngressTNC);
    updateFanFestIngressAuto();
  });

  const fanfestIngressWalkBike = document.getElementById('fanfest_ingressWalkBike');
  const fanfestIngressWalkBikeValue = document.getElementById('fanfest_ingressWalkBikeValue');
  fanfestIngressWalkBike.addEventListener('input', (e) => {
    state.fanfest.ingressWalkBike = parseInt(e.target.value);
    fanfestIngressWalkBikeValue.textContent = state.fanfest.ingressWalkBike;
    updateSliderBackground(fanfestIngressWalkBike);
    updateFanFestIngressAuto();
  });

  // 3. Egress Mode Shares
  const fanfestEgressTransit = document.getElementById('fanfest_egressTransit');
  const fanfestEgressTransitValue = document.getElementById('fanfest_egressTransitValue');
  fanfestEgressTransit.addEventListener('input', (e) => {
    state.fanfest.egressTransit = parseInt(e.target.value);
    fanfestEgressTransitValue.textContent = state.fanfest.egressTransit;
    updateSliderBackground(fanfestEgressTransit);
    updateFanFestEgressAuto();
  });

  const fanfestEgressTNC = document.getElementById('fanfest_egressTNC');
  const fanfestEgressTNCValue = document.getElementById('fanfest_egressTNCValue');
  fanfestEgressTNC.addEventListener('input', (e) => {
    state.fanfest.egressTNC = parseInt(e.target.value);
    fanfestEgressTNCValue.textContent = state.fanfest.egressTNC;
    updateSliderBackground(fanfestEgressTNC);
    updateFanFestEgressAuto();
  });

  const fanfestEgressWalkBike = document.getElementById('fanfest_egressWalkBike');
  const fanfestEgressWalkBikeValue = document.getElementById('fanfest_egressWalkBikeValue');
  fanfestEgressWalkBike.addEventListener('input', (e) => {
    state.fanfest.egressWalkBike = parseInt(e.target.value);
    fanfestEgressWalkBikeValue.textContent = state.fanfest.egressWalkBike;
    updateSliderBackground(fanfestEgressWalkBike);
    updateFanFestEgressAuto();
  });
}

function setupAirportsListeners() {
  // 1. Ingress Mode Shares
  const airportsIngressTransit = document.getElementById('airports_ingressTransit');
  const airportsIngressTransitValue = document.getElementById('airports_ingressTransitValue');
  airportsIngressTransit.addEventListener('input', (e) => {
    state.airports.ingressTransit = parseInt(e.target.value);
    airportsIngressTransitValue.textContent = state.airports.ingressTransit;
    updateSliderBackground(airportsIngressTransit);
    updateAirportsIngressAuto();
  });

  const airportsIngressTNC = document.getElementById('airports_ingressTNC');
  const airportsIngressTNCValue = document.getElementById('airports_ingressTNCValue');
  airportsIngressTNC.addEventListener('input', (e) => {
    state.airports.ingressTNC = parseInt(e.target.value);
    airportsIngressTNCValue.textContent = state.airports.ingressTNC;
    updateSliderBackground(airportsIngressTNC);
    updateAirportsIngressAuto();
  });

  const airportsIngressWalkBike = document.getElementById('airports_ingressWalkBike');
  const airportsIngressWalkBikeValue = document.getElementById('airports_ingressWalkBikeValue');
  airportsIngressWalkBike.addEventListener('input', (e) => {
    state.airports.ingressWalkBike = parseInt(e.target.value);
    airportsIngressWalkBikeValue.textContent = state.airports.ingressWalkBike;
    updateSliderBackground(airportsIngressWalkBike);
    updateAirportsIngressAuto();
  });

  // 2. Egress Mode Shares
  const airportsEgressTransit = document.getElementById('airports_egressTransit');
  const airportsEgressTransitValue = document.getElementById('airports_egressTransitValue');
  airportsEgressTransit.addEventListener('input', (e) => {
    state.airports.egressTransit = parseInt(e.target.value);
    airportsEgressTransitValue.textContent = state.airports.egressTransit;
    updateSliderBackground(airportsEgressTransit);
    updateAirportsEgressAuto();
  });

  const airportsEgressTNC = document.getElementById('airports_egressTNC');
  const airportsEgressTNCValue = document.getElementById('airports_egressTNCValue');
  airportsEgressTNC.addEventListener('input', (e) => {
    state.airports.egressTNC = parseInt(e.target.value);
    airportsEgressTNCValue.textContent = state.airports.egressTNC;
    updateSliderBackground(airportsEgressTNC);
    updateAirportsEgressAuto();
  });

  const airportsEgressWalkBike = document.getElementById('airports_egressWalkBike');
  const airportsEgressWalkBikeValue = document.getElementById('airports_egressWalkBikeValue');
  airportsEgressWalkBike.addEventListener('input', (e) => {
    state.airports.egressWalkBike = parseInt(e.target.value);
    airportsEgressWalkBikeValue.textContent = state.airports.egressWalkBike;
    updateSliderBackground(airportsEgressWalkBike);
    updateAirportsEgressAuto();
  });
}

// ========== HELPER FUNCTIONS - NRG MODE SHARE AUTO-CALCULATION ==========

function updateNRGIngressAuto() {
  state.nrg.ingressAuto = 100 - state.nrg.ingressTransit - state.nrg.ingressTNC - state.nrg.ingressWalkBike;
  document.getElementById('nrg_ingressAutoValue').textContent = state.nrg.ingressAuto;
}

function updateNRGEgressAuto() {
  state.nrg.egressAuto = 100 - state.nrg.egressTransit - state.nrg.egressTNC - state.nrg.egressWalkBike;
  document.getElementById('nrg_egressAutoValue').textContent = state.nrg.egressAuto;
}

// ========== HELPER FUNCTIONS - NRG SPECTATOR/FIFA SPLIT ==========

function adjustNRGSplitProportional() {
  const totalAttendance = state.nrg.attendance;

  if (totalAttendance === 0) {
    state.nrg.spectator = 0;
    state.nrg.fifaConstituent = 0;
  } else {
    // Calculate current proportions
    const currentTotal = state.nrg.spectator + state.nrg.fifaConstituent;
    const spectatorRatio = currentTotal > 0 ? state.nrg.spectator / currentTotal : 0.77;
    const fifaRatio = currentTotal > 0 ? state.nrg.fifaConstituent / currentTotal : 0.23;

    // Apply proportions to new attendance
    let newSpectator = Math.round(totalAttendance * spectatorRatio / 1000) * 1000;
    let newFIFA = Math.round(totalAttendance * fifaRatio / 1000) * 1000;

    // Ensure they sum correctly (handle rounding)
    if (newSpectator + newFIFA !== totalAttendance) {
      newSpectator = totalAttendance - newFIFA;
    }

    // Apply max constraints
    if (newSpectator > 58000) {
      newSpectator = 58000;
      newFIFA = totalAttendance - 58000;
    }
    if (newFIFA > 17000) {
      newFIFA = 17000;
      newSpectator = totalAttendance - 17000;
    }

    // Apply min constraints
    if (newSpectator < 0) newSpectator = 0;
    if (newFIFA < 0) newFIFA = 0;

    state.nrg.spectator = newSpectator;
    state.nrg.fifaConstituent = newFIFA;
  }

  updateNRGSplitUI();
}

function updateNRGSplitUI() {
  const spectatorSlider = document.getElementById('nrg_spectator');
  const spectatorValue = document.getElementById('nrg_spectatorValue');
  const fifaSlider = document.getElementById('nrg_fifaConstituent');
  const fifaValue = document.getElementById('nrg_fifaConstituentValue');

  spectatorSlider.value = state.nrg.spectator;
  spectatorValue.textContent = formatNumber(state.nrg.spectator);
  updateSliderBackground(spectatorSlider);

  fifaSlider.value = state.nrg.fifaConstituent;
  fifaValue.textContent = formatNumber(state.nrg.fifaConstituent);
  updateSliderBackground(fifaSlider);
}

// ========== HELPER FUNCTIONS - FAN FEST MODE SHARE AUTO-CALCULATION ==========

function updateFanFestIngressAuto() {
  state.fanfest.ingressAuto = 100 - state.fanfest.ingressTransit - state.fanfest.ingressTNC - state.fanfest.ingressWalkBike;
  document.getElementById('fanfest_ingressAutoValue').textContent = state.fanfest.ingressAuto;
}

function updateFanFestEgressAuto() {
  state.fanfest.egressAuto = 100 - state.fanfest.egressTransit - state.fanfest.egressTNC - state.fanfest.egressWalkBike;
  document.getElementById('fanfest_egressAutoValue').textContent = state.fanfest.egressAuto;
}

// ========== HELPER FUNCTIONS - AIRPORTS MODE SHARE AUTO-CALCULATION ==========

function updateAirportsIngressAuto() {
  state.airports.ingressAuto = 100 - state.airports.ingressTransit - state.airports.ingressTNC - state.airports.ingressWalkBike;
  document.getElementById('airports_ingressAutoValue').textContent = state.airports.ingressAuto;
}

function updateAirportsEgressAuto() {
  state.airports.egressAuto = 100 - state.airports.egressTransit - state.airports.egressTNC - state.airports.egressWalkBike;
  document.getElementById('airports_egressAutoValue').textContent = state.airports.egressAuto;
}

// ========== PROFILE GENERATION - NRG ==========

function generateDefaultProfilesNRG() {
  // Fixed default profile for NRG Stadium (6:00 AM - 8:00 PM provided by user).
  // Remaining hours (9:00 PM - 11:00 PM) are set to 0%.
  state.nrg.ingressProfile = [
    0, 4, 14, 48, 30, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ];
  state.nrg.egressProfile = [
    0, 0, 0, 0, 0, 0, 0, 0, 70, 25, 5, 0, 0, 0, 0, 0, 0, 0
  ];
}

// Load Prior Event Profile from CSV
async function loadPriorEventProfile(filename) {
  try {
    // Fetch the CSV file
    const response = await fetch(`data/arrivalDeparture/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
    }
    const csvText = await response.text();

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    // Find column indices
    const timeRangeIdx = headers.findIndex(h => h.trim().toLowerCase() === 'time range');
    const arrivalAutoIdx = headers.findIndex(h => h.trim().toLowerCase() === 'arrival profile auto');
    const departureAutoIdx = headers.findIndex(h => h.trim().toLowerCase() === 'departure profile auto');
    const arrivalRideshareIdx = headers.findIndex(h => h.trim().toLowerCase() === 'arrival profile rideshare');
    const departureRideshareIdx = headers.findIndex(h => h.trim().toLowerCase() === 'departure profile rideshare');

    if (timeRangeIdx === -1 || arrivalAutoIdx === -1 || departureAutoIdx === -1 ||
      arrivalRideshareIdx === -1 || departureRideshareIdx === -1) {
      throw new Error('CSV missing required columns');
    }

    // Initialize arrays for 18 hours (6am-11pm)
    const arrivalCounts = new Array(18).fill(0);
    const departureCounts = new Array(18).fill(0);

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      const timeRange = cols[timeRangeIdx].trim();
      // Combine Auto and Rideshare to get total trips
      const arrivalCount = parseFloat(cols[arrivalAutoIdx]) + parseFloat(cols[arrivalRideshareIdx]);
      const departureCount = parseFloat(cols[departureAutoIdx]) + parseFloat(cols[departureRideshareIdx]);

      // Extract end hour from time range (e.g., "06:00 - 07:00" -> 7)
      const match = timeRange.match(/- (\d{2}):(\d{2})/);
      if (!match) continue;

      const endHour = parseInt(match[1]);

      // Map to array index (6am = index 0, 11pm = index 17)
      if (endHour >= 6 && endHour <= 23) {
        const idx = endHour - 6;
        arrivalCounts[idx] += arrivalCount;
        departureCounts[idx] += departureCount;
      } else if (endHour === 0 || endHour === 24) {
        // 23:00 - 00:00 gets added to 11pm (index 17)
        arrivalCounts[17] += arrivalCount;
        departureCounts[17] += departureCount;
      }
      // Note: 00:00 - 06:00 has endHour=6, so it maps to index 0 (6am)
    }

    // Convert counts to percentages
    const arrivalTotal = arrivalCounts.reduce((a, b) => a + b, 0);
    const departureTotal = departureCounts.reduce((a, b) => a + b, 0);

    const ingressProfile = arrivalCounts.map(count => (count / arrivalTotal * 100));
    const egressProfile = departureCounts.map(count => (count / departureTotal * 100));

    // Round to 1 decimal place
    state.nrg.ingressProfile = ingressProfile.map(v => Math.round(v * 10) / 10);
    state.nrg.egressProfile = egressProfile.map(v => Math.round(v * 10) / 10);

    // Final adjustment to ensure exactly 100% (adjust largest value)
    const finalIngressSum = state.nrg.ingressProfile.reduce((a, b) => a + b, 0);
    const finalEgressSum = state.nrg.egressProfile.reduce((a, b) => a + b, 0);

    if (Math.abs(finalIngressSum - 100) > 0.01) {
      const maxIngressIdx = state.nrg.ingressProfile.indexOf(Math.max(...state.nrg.ingressProfile));
      state.nrg.ingressProfile[maxIngressIdx] += (100 - finalIngressSum);
      state.nrg.ingressProfile[maxIngressIdx] = Math.round(state.nrg.ingressProfile[maxIngressIdx] * 10) / 10;
    }

    if (Math.abs(finalEgressSum - 100) > 0.01) {
      const maxEgressIdx = state.nrg.egressProfile.indexOf(Math.max(...state.nrg.egressProfile));
      state.nrg.egressProfile[maxEgressIdx] += (100 - finalEgressSum);
      state.nrg.egressProfile[maxEgressIdx] = Math.round(state.nrg.egressProfile[maxEgressIdx] * 10) / 10;
    }

    // Refresh the chart and table
    nrgProfileChart.init();

  } catch (error) {
    console.error('Error loading prior event profile:', error);
    alert(`Failed to load prior event data: ${error.message}`);
  }
}

// ========== PROFILE GENERATION - FAN FEST ==========

function generateDefaultProfilesFanFest() {
  // Fan Fest: 18 hours (6am-11pm), bell curves centered around noon (ingress) and evening (egress)
  const ingressPeakHour = 12; // Noon
  const egressPeakHour = 18; // 6pm

  // Initialize profile arrays (18 hours: 6am-11pm)
  const ingressProfile = new Array(18).fill(0);
  const egressProfile = new Array(18).fill(0);

  // Generate ingress bell curve
  for (let i = 0; i < 18; i++) {
    const hour = i + 6;
    const sigma = 2.0; // Wider spread for Fan Fest
    const exponent = -Math.pow(hour - ingressPeakHour, 2) / (2 * sigma * sigma);
    ingressProfile[i] = Math.exp(exponent);
  }

  // Generate egress bell curve
  for (let i = 0; i < 18; i++) {
    const hour = i + 6;
    const sigma = 2.0;
    const exponent = -Math.pow(hour - egressPeakHour, 2) / (2 * sigma * sigma);
    egressProfile[i] = Math.exp(exponent);
  }

  // Normalize to sum to 100%
  const ingressSum = ingressProfile.reduce((a, b) => a + b, 0);
  const egressSum = egressProfile.reduce((a, b) => a + b, 0);

  for (let i = 0; i < 18; i++) {
    ingressProfile[i] = (ingressProfile[i] / ingressSum * 100);
    egressProfile[i] = (egressProfile[i] / egressSum * 100);
  }

  // Round to 1 decimal place
  // Ingress: use specified default profile (6:00–23:00), already summing to 100%
  state.fanfest.ingressProfile = [
    0.0,  // 6:00
    4.0,  // 7:00
    13.0, // 8:00
    17.0, // 9:00
    15.0, // 10:00
    11.0, // 11:00
    7.0,  // 12:00
    6.0,  // 13:00
    6.0,  // 14:00
    7.0,  // 15:00
    5.0,  // 16:00
    3.0,  // 17:00
    3.0,  // 18:00
    3.0,  // 19:00
    0.0,  // 20:00
    0.0,  // 21:00
    0.0,  // 22:00
    0.0   // 23:00
  ];

  // Egress: use specified default profile (6:00–23:00), already summing to 100%
  state.fanfest.egressProfile = [
    0.0, // 6:00
    0.0, // 7:00
    2.0, // 8:00
    4.0, // 9:00
    5.0, // 10:00
    6.0, // 11:00
    8.0, // 12:00
    10.0,// 13:00
    12.0,// 14:00
    13.0,// 15:00
    12.0,// 16:00
    10.0,// 17:00
    8.0, // 18:00
    5.0, // 19:00
    3.0, // 20:00
    2.0, // 21:00
    0.0, // 22:00
    0.0  // 23:00
  ];

  // Final adjustment to ensure exactly 100%
  const finalIngressSum = state.fanfest.ingressProfile.reduce((a, b) => a + b, 0);
  const finalEgressSum = state.fanfest.egressProfile.reduce((a, b) => a + b, 0);

  if (Math.abs(finalIngressSum - 100) > 0.01) {
    const maxIngressIdx = state.fanfest.ingressProfile.indexOf(Math.max(...state.fanfest.ingressProfile));
    state.fanfest.ingressProfile[maxIngressIdx] += (100 - finalIngressSum);
    state.fanfest.ingressProfile[maxIngressIdx] = Math.round(state.fanfest.ingressProfile[maxIngressIdx] * 10) / 10;
  }

  if (Math.abs(finalEgressSum - 100) > 0.01) {
    const maxEgressIdx = state.fanfest.egressProfile.indexOf(Math.max(...state.fanfest.egressProfile));
    state.fanfest.egressProfile[maxEgressIdx] += (100 - finalEgressSum);
    state.fanfest.egressProfile[maxEgressIdx] = Math.round(state.fanfest.egressProfile[maxEgressIdx] * 10) / 10;
  }
}

// ========== PROFILE CHART OBJECTS ==========

const nrgProfileChart = {
  hours: ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'],
  xStart: 60,
  xEnd: 740,
  yTop: 0,
  yBottom: 250,

  init() {
    // Generate default profiles if not set
    if (!state.nrg.ingressProfile || !state.nrg.egressProfile) {
      generateDefaultProfilesNRG();
    }
    this.renderChart();
    this.renderInputTable();
    this.updateTotals();
    this.updateGameLines();
  },

  updateGameLines() {
    this.updateGameStartLine();
    this.updateGameEndLine();
  },

  updateGameStartLine() {
    const gameStartTime = state.nrg.gameStartTime;
    const [hours, minutes] = gameStartTime.split(':').map(Number);
    const hoursSince6am = hours - 6 + (minutes / 60);

    const gameStartLine = document.getElementById('nrg_gameStartLine');
    if (hours >= 6 && hours < 24) {
      const x = this.getX(hoursSince6am);
      gameStartLine.setAttribute('x1', x);
      gameStartLine.setAttribute('x2', x);
      gameStartLine.style.display = 'block';
    } else {
      gameStartLine.style.display = 'none';
    }
  },

  updateGameEndLine() {
    const gameStartTime = state.nrg.gameStartTime;
    const gameDuration = state.nrg.gameDuration;

    const [hours, minutes] = gameStartTime.split(':').map(Number);
    const gameStartHour = hours + (minutes / 60);
    const gameEndHour = gameStartHour + (gameDuration / 60);
    const hoursSince6am = gameEndHour - 6;

    const gameEndLine = document.getElementById('nrg_gameEndLine');
    if (gameEndHour >= 6 && gameEndHour < 24) {
      const x = this.getX(hoursSince6am);
      gameEndLine.setAttribute('x1', x);
      gameEndLine.setAttribute('x2', x);
      gameEndLine.style.display = 'block';
    } else {
      gameEndLine.style.display = 'none';
    }
  },

  getX(index) {
    const spacing = (this.xEnd - this.xStart) / 17;
    return this.xStart + (index * spacing);
  },

  getY(percentage) {
    // 0% = yBottom (250), 75% = yTop (0)
    return this.yBottom - (percentage / 75) * (this.yBottom - this.yTop);
  },

  getPercentageFromY(y) {
    // Convert Y coordinate back to percentage (max 75%)
    const percentage = ((this.yBottom - y) / (this.yBottom - this.yTop)) * 75;
    return Math.max(0, Math.min(75, percentage));
  },

  roundToTenth(value) {
    return Math.round(value * 10) / 10;
  },

  renderChart() {
    // Render ingress line
    const ingressLine = document.getElementById('nrg_ingressLine');
    const ingressPoints = state.nrg.ingressProfile.map((val, idx) =>
      `${this.getX(idx)},${this.getY(val)}`
    ).join(' ');
    ingressLine.setAttribute('points', ingressPoints);

    // Render egress line
    const egressLine = document.getElementById('nrg_egressLine');
    const egressPoints = state.nrg.egressProfile.map((val, idx) =>
      `${this.getX(idx)},${this.getY(val)}`
    ).join(' ');
    egressLine.setAttribute('points', egressPoints);

    // Render draggable points
    this.renderPoints();
  },

  renderPoints() {
    const ingressPointsContainer = document.getElementById('nrg_ingressPoints');
    const egressPointsContainer = document.getElementById('nrg_egressPoints');

    ingressPointsContainer.innerHTML = '';
    egressPointsContainer.innerHTML = '';

    // Create ingress points
    state.nrg.ingressProfile.forEach((val, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', this.getX(idx));
      circle.setAttribute('cy', this.getY(val));
      circle.setAttribute('r', 6);
      circle.setAttribute('fill', '#5b6cf8');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', 2);
      circle.dataset.type = 'ingress';
      circle.dataset.index = idx;
      this.addDragHandlers(circle);
      ingressPointsContainer.appendChild(circle);
    });

    // Create egress points
    state.nrg.egressProfile.forEach((val, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', this.getX(idx));
      circle.setAttribute('cy', this.getY(val));
      circle.setAttribute('r', 6);
      circle.setAttribute('fill', '#f97316');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', 2);
      circle.dataset.type = 'egress';
      circle.dataset.index = idx;
      this.addDragHandlers(circle);
      egressPointsContainer.appendChild(circle);
    });
  },

  addDragHandlers(circle) {
    const svg = document.getElementById('nrg_profileChart');
    let isDragging = false;

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const rect = svg.getBoundingClientRect();
      const svgX = e.clientX - rect.left;
      const svgY = e.clientY - rect.top;

      // Convert to SVG coordinates
      const scaleX = 800 / rect.width;
      const scaleY = 300 / rect.height;
      const y = svgY * scaleY;

      // Clamp Y to chart bounds
      const clampedY = Math.max(this.yTop, Math.min(this.yBottom, y));
      const newPercentage = this.roundToTenth(this.getPercentageFromY(clampedY));

      const type = circle.dataset.type;
      const index = parseInt(circle.dataset.index);

      if (type === 'ingress') {
        state.nrg.ingressProfile[index] = newPercentage;
      } else {
        state.nrg.egressProfile[index] = newPercentage;
      }

      this.renderChart();
      this.updateInputTable();
      this.updateTotals();
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    circle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  },

  renderInputTable() {
    const tbody = document.getElementById('nrg_profileInputsBody');
    tbody.innerHTML = '';

    this.hours.forEach((hour, idx) => {
      const row = document.createElement('tr');

      const hourCell = document.createElement('td');
      hourCell.textContent = hour;
      row.appendChild(hourCell);

      const ingressCell = document.createElement('td');
      const ingressInput = document.createElement('input');
      ingressInput.type = 'number';
      ingressInput.step = '0.1';
      ingressInput.min = '0';
      ingressInput.max = '75';
      ingressInput.value = state.nrg.ingressProfile[idx].toFixed(1);
      ingressInput.dataset.type = 'ingress';
      ingressInput.dataset.index = idx;
      ingressInput.addEventListener('input', (e) => this.onInputChange(e));
      ingressCell.appendChild(ingressInput);
      row.appendChild(ingressCell);

      const egressCell = document.createElement('td');
      const egressInput = document.createElement('input');
      egressInput.type = 'number';
      egressInput.step = '0.1';
      egressInput.min = '0';
      egressInput.max = '75';
      egressInput.value = state.nrg.egressProfile[idx].toFixed(1);
      egressInput.dataset.type = 'egress';
      egressInput.dataset.index = idx;
      egressInput.addEventListener('input', (e) => this.onInputChange(e));
      egressCell.appendChild(egressInput);
      row.appendChild(egressCell);

      tbody.appendChild(row);
    });
  },

  updateInputTable() {
    const tbody = document.getElementById('nrg_profileInputsBody');
    const inputs = tbody.querySelectorAll('input');

    inputs.forEach(input => {
      const type = input.dataset.type;
      const index = parseInt(input.dataset.index);
      const value = type === 'ingress' ? state.nrg.ingressProfile[index] : state.nrg.egressProfile[index];
      input.value = value.toFixed(1);
    });
  },

  onInputChange(e) {
    const input = e.target;
    const type = input.dataset.type;
    const index = parseInt(input.dataset.index);
    let value = parseFloat(input.value);

    if (isNaN(value)) value = 0;
    value = this.roundToTenth(Math.max(0, Math.min(75, value)));

    if (type === 'ingress') {
      state.nrg.ingressProfile[index] = value;
    } else {
      state.nrg.egressProfile[index] = value;
    }

    this.renderChart();
    this.updateTotals();
  },

  updateTotals() {
    const ingressTotal = this.roundToTenth(state.nrg.ingressProfile.reduce((sum, val) => sum + val, 0));
    const egressTotal = this.roundToTenth(state.nrg.egressProfile.reduce((sum, val) => sum + val, 0));

    document.getElementById('nrg_ingressTotal').textContent = ingressTotal.toFixed(1) + '%';
    document.getElementById('nrg_egressTotal').textContent = egressTotal.toFixed(1) + '%';

    const ingressStatus = document.getElementById('nrg_ingressStatus');
    const egressStatus = document.getElementById('nrg_egressStatus');

    if (Math.abs(ingressTotal - 100) < 0.1) {
      ingressStatus.textContent = '✓';
      ingressStatus.style.color = '#22c55e';
    } else {
      ingressStatus.textContent = '✗';
      ingressStatus.style.color = '#ef4444';
    }

    if (Math.abs(egressTotal - 100) < 0.1) {
      egressStatus.textContent = '✓';
      egressStatus.style.color = '#22c55e';
    } else {
      egressStatus.textContent = '✗';
      egressStatus.style.color = '#ef4444';
    }
  }
};

const fanfestProfileChart = {
  hours: ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'],
  xStart: 60,
  xEnd: 740,
  yTop: 0,
  yBottom: 250,

  init() {
    // Generate default profiles if not set
    if (!state.fanfest.ingressProfile || !state.fanfest.egressProfile) {
      generateDefaultProfilesFanFest();
    }
    this.renderChart();
    this.renderInputTable();
    this.updateTotals();
  },

  getX(index) {
    const spacing = (this.xEnd - this.xStart) / 17;
    return this.xStart + (index * spacing);
  },

  getY(percentage) {
    return this.yBottom - (percentage / 75) * (this.yBottom - this.yTop);
  },

  getPercentageFromY(y) {
    const percentage = ((this.yBottom - y) / (this.yBottom - this.yTop)) * 75;
    return Math.max(0, Math.min(75, percentage));
  },

  roundToTenth(value) {
    return Math.round(value * 10) / 10;
  },

  renderChart() {
    const ingressLine = document.getElementById('fanfest_ingressLine');
    const ingressPoints = state.fanfest.ingressProfile.map((val, idx) =>
      `${this.getX(idx)},${this.getY(val)}`
    ).join(' ');
    ingressLine.setAttribute('points', ingressPoints);

    const egressLine = document.getElementById('fanfest_egressLine');
    const egressPoints = state.fanfest.egressProfile.map((val, idx) =>
      `${this.getX(idx)},${this.getY(val)}`
    ).join(' ');
    egressLine.setAttribute('points', egressPoints);

    this.renderPoints();
  },

  renderPoints() {
    const ingressPointsContainer = document.getElementById('fanfest_ingressPoints');
    const egressPointsContainer = document.getElementById('fanfest_egressPoints');

    ingressPointsContainer.innerHTML = '';
    egressPointsContainer.innerHTML = '';

    state.fanfest.ingressProfile.forEach((val, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', this.getX(idx));
      circle.setAttribute('cy', this.getY(val));
      circle.setAttribute('r', 6);
      circle.setAttribute('fill', '#5b6cf8');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', 2);
      circle.dataset.type = 'ingress';
      circle.dataset.index = idx;
      this.addDragHandlers(circle);
      ingressPointsContainer.appendChild(circle);
    });

    state.fanfest.egressProfile.forEach((val, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', this.getX(idx));
      circle.setAttribute('cy', this.getY(val));
      circle.setAttribute('r', 6);
      circle.setAttribute('fill', '#f97316');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', 2);
      circle.dataset.type = 'egress';
      circle.dataset.index = idx;
      this.addDragHandlers(circle);
      egressPointsContainer.appendChild(circle);
    });
  },

  addDragHandlers(circle) {
    const svg = document.getElementById('fanfest_profileChart');
    let isDragging = false;

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const rect = svg.getBoundingClientRect();
      const svgY = e.clientY - rect.top;
      const scaleY = 300 / rect.height;
      const y = svgY * scaleY;

      const clampedY = Math.max(this.yTop, Math.min(this.yBottom, y));
      const newPercentage = this.roundToTenth(this.getPercentageFromY(clampedY));

      const type = circle.dataset.type;
      const index = parseInt(circle.dataset.index);

      if (type === 'ingress') {
        state.fanfest.ingressProfile[index] = newPercentage;
      } else {
        state.fanfest.egressProfile[index] = newPercentage;
      }

      this.renderChart();
      this.updateInputTable();
      this.updateTotals();
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    circle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  },

  renderInputTable() {
    const tbody = document.getElementById('fanfest_profileInputsBody');
    tbody.innerHTML = '';

    this.hours.forEach((hour, idx) => {
      const row = document.createElement('tr');

      const hourCell = document.createElement('td');
      hourCell.textContent = hour;
      row.appendChild(hourCell);

      const ingressCell = document.createElement('td');
      const ingressInput = document.createElement('input');
      ingressInput.type = 'number';
      ingressInput.step = '0.1';
      ingressInput.min = '0';
      ingressInput.max = '75';
      ingressInput.value = state.fanfest.ingressProfile[idx].toFixed(1);
      ingressInput.dataset.type = 'ingress';
      ingressInput.dataset.index = idx;
      ingressInput.addEventListener('input', (e) => this.onInputChange(e));
      ingressCell.appendChild(ingressInput);
      row.appendChild(ingressCell);

      const egressCell = document.createElement('td');
      const egressInput = document.createElement('input');
      egressInput.type = 'number';
      egressInput.step = '0.1';
      egressInput.min = '0';
      egressInput.max = '75';
      egressInput.value = state.fanfest.egressProfile[idx].toFixed(1);
      egressInput.dataset.type = 'egress';
      egressInput.dataset.index = idx;
      egressInput.addEventListener('input', (e) => this.onInputChange(e));
      egressCell.appendChild(egressInput);
      row.appendChild(egressCell);

      tbody.appendChild(row);
    });
  },

  updateInputTable() {
    const tbody = document.getElementById('fanfest_profileInputsBody');
    const inputs = tbody.querySelectorAll('input');

    inputs.forEach(input => {
      const type = input.dataset.type;
      const index = parseInt(input.dataset.index);
      const value = type === 'ingress' ? state.fanfest.ingressProfile[index] : state.fanfest.egressProfile[index];
      input.value = value.toFixed(1);
    });
  },

  onInputChange(e) {
    const input = e.target;
    const type = input.dataset.type;
    const index = parseInt(input.dataset.index);
    let value = parseFloat(input.value);

    if (isNaN(value)) value = 0;
    value = this.roundToTenth(Math.max(0, Math.min(75, value)));

    if (type === 'ingress') {
      state.fanfest.ingressProfile[index] = value;
    } else {
      state.fanfest.egressProfile[index] = value;
    }

    this.renderChart();
    this.updateTotals();
  },

  updateTotals() {
    const ingressTotal = this.roundToTenth(state.fanfest.ingressProfile.reduce((sum, val) => sum + val, 0));
    const egressTotal = this.roundToTenth(state.fanfest.egressProfile.reduce((sum, val) => sum + val, 0));

    document.getElementById('fanfest_ingressTotal').textContent = ingressTotal.toFixed(1) + '%';
    document.getElementById('fanfest_egressTotal').textContent = egressTotal.toFixed(1) + '%';

    const ingressStatus = document.getElementById('fanfest_ingressStatus');
    const egressStatus = document.getElementById('fanfest_egressStatus');

    if (Math.abs(ingressTotal - 100) < 0.1) {
      ingressStatus.textContent = '✓';
      ingressStatus.style.color = '#22c55e';
    } else {
      ingressStatus.textContent = '✗';
      ingressStatus.style.color = '#ef4444';
    }

    if (Math.abs(egressTotal - 100) < 0.1) {
      egressStatus.textContent = '✓';
      egressStatus.style.color = '#22c55e';
    } else {
      egressStatus.textContent = '✗';
      egressStatus.style.color = '#ef4444';
    }
  }
};

// Display summary table (6.1c)
function displaySummaryTable() {
  const summary = [
    // General Parameters
    { parameter: 'Day Type', value: state.general.dayType },
    { parameter: 'Selected Date', value: state.general.selectedDate || 'None' },
    { parameter: 'International', value: `${state.general.international}%` },
    { parameter: 'Domestic', value: `${state.general.domestic}%` },
    { parameter: 'Outside Region', value: `${state.general.outsideRegion}%` },
    { parameter: 'Inside Region', value: `${state.general.insideRegion}%` },
    { parameter: 'TDM Background Traffic Reduction', value: `${state.general.tdmReduction}%` },

    // NRG Stadium Parameters
    { parameter: 'NRG - Game Start Time', value: state.nrg.gameStartTime },
    { parameter: 'NRG - Game Duration', value: `${state.nrg.gameDuration} minutes` },
    { parameter: 'NRG - Attendance', value: formatNumber(state.nrg.attendance) },
    { parameter: 'NRG - Spectators', value: formatNumber(state.nrg.spectator) },
    { parameter: 'NRG - FIFA Constituents', value: formatNumber(state.nrg.fifaConstituent) },
    { parameter: 'NRG - Ingress Transit', value: `${state.nrg.ingressTransit}%` },
    { parameter: 'NRG - Ingress TNC', value: `${state.nrg.ingressTNC}%` },
    { parameter: 'NRG - Ingress Walk/Bike', value: `${state.nrg.ingressWalkBike}%` },
    { parameter: 'NRG - Ingress Auto', value: `${state.nrg.ingressAuto}%` },
    { parameter: 'NRG - Egress Transit', value: `${state.nrg.egressTransit}%` },
    { parameter: 'NRG - Egress TNC', value: `${state.nrg.egressTNC}%` },
    { parameter: 'NRG - Egress Walk/Bike', value: `${state.nrg.egressWalkBike}%` },
    { parameter: 'NRG - Egress Auto', value: `${state.nrg.egressAuto}%` },

    // Fan Fest Parameters
    { parameter: 'Fan Fest - Attendance', value: formatNumber(state.fanfest.attendance) },
    { parameter: 'Fan Fest - Ingress Transit', value: `${state.fanfest.ingressTransit}%` },
    { parameter: 'Fan Fest - Ingress TNC', value: `${state.fanfest.ingressTNC}%` },
    { parameter: 'Fan Fest - Ingress Walk/Bike', value: `${state.fanfest.ingressWalkBike}%` },
    { parameter: 'Fan Fest - Ingress Auto', value: `${state.fanfest.ingressAuto}%` },
    { parameter: 'Fan Fest - Egress Transit', value: `${state.fanfest.egressTransit}%` },
    { parameter: 'Fan Fest - Egress TNC', value: `${state.fanfest.egressTNC}%` },
    { parameter: 'Fan Fest - Egress Walk/Bike', value: `${state.fanfest.egressWalkBike}%` },
    { parameter: 'Fan Fest - Egress Auto', value: `${state.fanfest.egressAuto}%` },

    // Airports Parameters
    { parameter: 'Airports - Ingress Transit', value: `${state.airports.ingressTransit}%` },
    { parameter: 'Airports - Ingress TNC', value: `${state.airports.ingressTNC}%` },
    { parameter: 'Airports - Ingress Walk/Bike', value: `${state.airports.ingressWalkBike}%` },
    { parameter: 'Airports - Ingress Auto', value: `${state.airports.ingressAuto}%` },
    { parameter: 'Airports - Egress Transit', value: `${state.airports.egressTransit}%` },
    { parameter: 'Airports - Egress TNC', value: `${state.airports.egressTNC}%` },
    { parameter: 'Airports - Egress Walk/Bike', value: `${state.airports.egressWalkBike}%` },
    { parameter: 'Airports - Egress Auto', value: `${state.airports.egressAuto}%` },
  ];

  let tableHTML = '<table class="summary-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
  tableHTML += '<thead><tr style="background-color: var(--panel); border-bottom: 2px solid var(--accent);">';
  tableHTML += '<th style="padding: 10px; text-align: left; font-weight: 600;">Parameter</th>';
  tableHTML += '<th style="padding: 10px; text-align: left; font-weight: 600;">Value</th>';
  tableHTML += '</tr></thead><tbody>';

  summary.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
    tableHTML += `<tr style="background-color: ${bgColor}; border-bottom: 1px solid #e5e7eb;">`;
    tableHTML += `<td style="padding: 8px; font-weight: 500;">${row.parameter}</td>`;
    tableHTML += `<td style="padding: 8px;">${row.value}</td>`;
    tableHTML += '</tr>';
  });

  // Add profile totals for all three models
  const nrgIngressTotal = state.nrg.ingressProfile.reduce((a, b) => a + b, 0).toFixed(1);
  const nrgEgressTotal = state.nrg.egressProfile.reduce((a, b) => a + b, 0).toFixed(1);
  const fanfestIngressTotal = state.fanfest.ingressProfile.reduce((a, b) => a + b, 0).toFixed(1);
  const fanfestEgressTotal = state.fanfest.egressProfile.reduce((a, b) => a + b, 0).toFixed(1);

  let rowIdx = summary.length;

  tableHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;">`;
  tableHTML += `<td style="padding: 8px; font-weight: 500;">NRG - Arrival Profile Total</td>`;
  tableHTML += `<td style="padding: 8px;">${nrgIngressTotal}% (${nrgIngressTotal === '100.0' ? '✓' : '✗'})</td>`;
  tableHTML += '</tr>';
  rowIdx++;

  tableHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;">`;
  tableHTML += `<td style="padding: 8px; font-weight: 500;">NRG - Departure Profile Total</td>`;
  tableHTML += `<td style="padding: 8px;">${nrgEgressTotal}% (${nrgEgressTotal === '100.0' ? '✓' : '✗'})</td>`;
  tableHTML += '</tr>';
  rowIdx++;

  tableHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;">`;
  tableHTML += `<td style="padding: 8px; font-weight: 500;">Fan Fest - Arrival Profile Total</td>`;
  tableHTML += `<td style="padding: 8px;">${fanfestIngressTotal}% (${fanfestIngressTotal === '100.0' ? '✓' : '✗'})</td>`;
  tableHTML += '</tr>';
  rowIdx++;

  tableHTML += `<tr style="background-color: ${rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;">`;
  tableHTML += `<td style="padding: 8px; font-weight: 500;">Fan Fest - Departure Profile Total</td>`;
  tableHTML += `<td style="padding: 8px;">${fanfestEgressTotal}% (${fanfestEgressTotal === '100.0' ? '✓' : '✗'})</td>`;
  tableHTML += '</tr>';
  rowIdx++;

  tableHTML += '</tbody></table>';
  summaryTableContainer.innerHTML = tableHTML;
}

// Load prebuilt scenario from data folder
function loadPrebuiltScenario(scenarioType) {
  const scenarioFiles = {
    'baseline_weekday': 'data/Preloaded Demand Scenarios/baseline_weekday.csv',
    'baseline_weekend': 'data/Preloaded Demand Scenarios/baseline_weekend.csv'
  };

  const filePath = scenarioFiles[scenarioType];
  if (!filePath) {
    alert('Unknown scenario type: ' + scenarioType);
    return;
  }

  // Fetch the CSV file from the data folder
  fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load prebuilt scenario: ' + response.statusText);
      }
      return response.text();
    })
    .then(csvContent => {
      importScenarioFromCSV(csvContent);
    })
    .catch(error => {
      alert('Error loading prebuilt scenario: ' + error.message);
      console.error('Error loading prebuilt scenario:', error);
    });
}

// Import scenario from CSV
function importScenarioFromCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header and data
  const headers = lines[0].split(',').map(h => h.trim());
  const values = lines[1].split(',').map(v => v.trim());

  // Create a map of column name to value
  const data = {};
  headers.forEach((header, index) => {
    data[header] = values[index];
  });

  // ========== GENERAL PARAMETERS ==========

  // Day Type
  if (data['dayType']) {
    state.general.dayType = data['dayType'];
    if (state.general.dayType === 'weekday') {
      btnWeekday.classList.add('active');
      btnWeekend.classList.remove('active');
    } else {
      btnWeekend.classList.add('active');
      btnWeekday.classList.remove('active');
    }
  }

  // Selected Date
  if (data['selectedDate'] && data['selectedDate'] !== '') {
    state.general.selectedDate = data['selectedDate'];
    selectedDateInput.value = data['selectedDate'];
  } else {
    state.general.selectedDate = null;
    selectedDateInput.value = '';
  }

  // International/Domestic Split
  if (data['international']) {
    state.general.international = parseInt(data['international']);
    state.general.domestic = parseInt(data['domestic']);
    internationalSplitSlider.value = state.general.international;
    document.getElementById('internationalValue').textContent = state.general.international;
    document.getElementById('domesticValue').textContent = state.general.domestic;
    updateSliderBackground(internationalSplitSlider);
  }

  // Region Split
  if (data['outsideRegion']) {
    state.general.outsideRegion = parseInt(data['outsideRegion']);
    state.general.insideRegion = parseInt(data['insideRegion']);
    regionSplitSlider.value = state.general.outsideRegion;
    document.getElementById('outsideRegionValue').textContent = state.general.outsideRegion;
    document.getElementById('insideRegionValue').textContent = state.general.insideRegion;
    updateSliderBackground(regionSplitSlider);
  }

  // TDM Reduction
  if (data['tdmReduction']) {
    state.general.tdmReduction = parseInt(data['tdmReduction']);
    tdmReductionSlider.value = state.general.tdmReduction;
    document.getElementById('tdmReductionValue').textContent = state.general.tdmReduction;
    updateSliderBackground(tdmReductionSlider);
  }

  // ========== NRG STADIUM PARAMETERS ==========

  // Game Start Time
  if (data['nrg_gameStartTime']) {
    state.nrg.gameStartTime = data['nrg_gameStartTime'];
    document.getElementById('nrg_gameStartTime').value = data['nrg_gameStartTime'];
  }

  // Game Duration
  if (data['nrg_gameDuration']) {
    state.nrg.gameDuration = parseInt(data['nrg_gameDuration']);
    document.getElementById('nrg_gameDuration').value = data['nrg_gameDuration'];
  }

  // Attendance
  if (data['nrg_attendance']) {
    state.nrg.attendance = parseInt(data['nrg_attendance']);
    const attendanceSlider = document.getElementById('nrg_attendance');
    attendanceSlider.value = state.nrg.attendance;
    document.getElementById('nrg_attendanceValue').textContent = formatNumber(state.nrg.attendance);
    updateSliderBackground(attendanceSlider);
  }

  // Spectator and FIFA Constituent
  if (data['nrg_spectator']) {
    state.nrg.spectator = parseInt(data['nrg_spectator']);
  }
  if (data['nrg_fifaConstituent']) {
    state.nrg.fifaConstituent = parseInt(data['nrg_fifaConstituent']);
  }
  // Update NRG split UI
  const spectatorSlider = document.getElementById('nrg_spectator');
  const fifaSlider = document.getElementById('nrg_fifaConstituent');
  spectatorSlider.value = state.nrg.spectator;
  fifaSlider.value = state.nrg.fifaConstituent;
  document.getElementById('nrg_spectatorValue').textContent = formatNumber(state.nrg.spectator);
  document.getElementById('nrg_fifaConstituentValue').textContent = formatNumber(state.nrg.fifaConstituent);
  updateSliderBackground(spectatorSlider);
  updateSliderBackground(fifaSlider);

  // NRG Ingress Mode Share
  if (data['nrg_ingressTransit']) {
    state.nrg.ingressTransit = parseInt(data['nrg_ingressTransit']);
    const slider = document.getElementById('nrg_ingressTransit');
    slider.value = state.nrg.ingressTransit;
    document.getElementById('nrg_ingressTransitValue').textContent = state.nrg.ingressTransit;
    updateSliderBackground(slider);
  }
  if (data['nrg_ingressTNC']) {
    state.nrg.ingressTNC = parseInt(data['nrg_ingressTNC']);
    const slider = document.getElementById('nrg_ingressTNC');
    slider.value = state.nrg.ingressTNC;
    document.getElementById('nrg_ingressTNCValue').textContent = state.nrg.ingressTNC;
    updateSliderBackground(slider);
  }
  if (data['nrg_ingressWalkBike']) {
    state.nrg.ingressWalkBike = parseInt(data['nrg_ingressWalkBike']);
    const slider = document.getElementById('nrg_ingressWalkBike');
    slider.value = state.nrg.ingressWalkBike;
    document.getElementById('nrg_ingressWalkBikeValue').textContent = state.nrg.ingressWalkBike;
    updateSliderBackground(slider);
  }
  state.nrg.ingressAuto = 100 - state.nrg.ingressTransit - state.nrg.ingressTNC - state.nrg.ingressWalkBike;
  document.getElementById('nrg_ingressAutoValue').textContent = state.nrg.ingressAuto;

  // NRG Egress Mode Share
  if (data['nrg_egressTransit']) {
    state.nrg.egressTransit = parseInt(data['nrg_egressTransit']);
    const slider = document.getElementById('nrg_egressTransit');
    slider.value = state.nrg.egressTransit;
    document.getElementById('nrg_egressTransitValue').textContent = state.nrg.egressTransit;
    updateSliderBackground(slider);
  }
  if (data['nrg_egressTNC']) {
    state.nrg.egressTNC = parseInt(data['nrg_egressTNC']);
    const slider = document.getElementById('nrg_egressTNC');
    slider.value = state.nrg.egressTNC;
    document.getElementById('nrg_egressTNCValue').textContent = state.nrg.egressTNC;
    updateSliderBackground(slider);
  }
  if (data['nrg_egressWalkBike']) {
    state.nrg.egressWalkBike = parseInt(data['nrg_egressWalkBike']);
    const slider = document.getElementById('nrg_egressWalkBike');
    slider.value = state.nrg.egressWalkBike;
    document.getElementById('nrg_egressWalkBikeValue').textContent = state.nrg.egressWalkBike;
    updateSliderBackground(slider);
  }
  state.nrg.egressAuto = 100 - state.nrg.egressTransit - state.nrg.egressTNC - state.nrg.egressWalkBike;
  document.getElementById('nrg_egressAutoValue').textContent = state.nrg.egressAuto;

  // NRG Arrival/Departure Profiles (18 hours: 6am-11pm)
  const nrgIngressProfile = [];
  const nrgEgressProfile = [];
  for (let i = 6; i <= 23; i++) {
    if (data[`nrg_ingress_${i}`]) {
      nrgIngressProfile.push(parseFloat(data[`nrg_ingress_${i}`]));
    }
    if (data[`nrg_egress_${i}`]) {
      nrgEgressProfile.push(parseFloat(data[`nrg_egress_${i}`]));
    }
  }
  if (nrgIngressProfile.length === 18) state.nrg.ingressProfile = nrgIngressProfile;
  if (nrgEgressProfile.length === 18) state.nrg.egressProfile = nrgEgressProfile;

  // ========== FAN FEST PARAMETERS ==========

  // Attendance
  if (data['fanfest_attendance']) {
    state.fanfest.attendance = parseInt(data['fanfest_attendance']);
    const slider = document.getElementById('fanfest_attendance');
    slider.value = state.fanfest.attendance;
    document.getElementById('fanfest_attendanceValue').textContent = formatNumber(state.fanfest.attendance);
    updateSliderBackground(slider);
  }

  // Fan Fest Ingress Mode Share
  if (data['fanfest_ingressTransit']) {
    state.fanfest.ingressTransit = parseInt(data['fanfest_ingressTransit']);
    const slider = document.getElementById('fanfest_ingressTransit');
    slider.value = state.fanfest.ingressTransit;
    document.getElementById('fanfest_ingressTransitValue').textContent = state.fanfest.ingressTransit;
    updateSliderBackground(slider);
  }
  if (data['fanfest_ingressTNC']) {
    state.fanfest.ingressTNC = parseInt(data['fanfest_ingressTNC']);
    const slider = document.getElementById('fanfest_ingressTNC');
    slider.value = state.fanfest.ingressTNC;
    document.getElementById('fanfest_ingressTNCValue').textContent = state.fanfest.ingressTNC;
    updateSliderBackground(slider);
  }
  if (data['fanfest_ingressWalkBike']) {
    state.fanfest.ingressWalkBike = parseInt(data['fanfest_ingressWalkBike']);
    const slider = document.getElementById('fanfest_ingressWalkBike');
    slider.value = state.fanfest.ingressWalkBike;
    document.getElementById('fanfest_ingressWalkBikeValue').textContent = state.fanfest.ingressWalkBike;
    updateSliderBackground(slider);
  }
  state.fanfest.ingressAuto = 100 - state.fanfest.ingressTransit - state.fanfest.ingressTNC - state.fanfest.ingressWalkBike;
  document.getElementById('fanfest_ingressAutoValue').textContent = state.fanfest.ingressAuto;

  // Fan Fest Egress Mode Share
  if (data['fanfest_egressTransit']) {
    state.fanfest.egressTransit = parseInt(data['fanfest_egressTransit']);
    const slider = document.getElementById('fanfest_egressTransit');
    slider.value = state.fanfest.egressTransit;
    document.getElementById('fanfest_egressTransitValue').textContent = state.fanfest.egressTransit;
    updateSliderBackground(slider);
  }
  if (data['fanfest_egressTNC']) {
    state.fanfest.egressTNC = parseInt(data['fanfest_egressTNC']);
    const slider = document.getElementById('fanfest_egressTNC');
    slider.value = state.fanfest.egressTNC;
    document.getElementById('fanfest_egressTNCValue').textContent = state.fanfest.egressTNC;
    updateSliderBackground(slider);
  }
  if (data['fanfest_egressWalkBike']) {
    state.fanfest.egressWalkBike = parseInt(data['fanfest_egressWalkBike']);
    const slider = document.getElementById('fanfest_egressWalkBike');
    slider.value = state.fanfest.egressWalkBike;
    document.getElementById('fanfest_egressWalkBikeValue').textContent = state.fanfest.egressWalkBike;
    updateSliderBackground(slider);
  }
  state.fanfest.egressAuto = 100 - state.fanfest.egressTransit - state.fanfest.egressTNC - state.fanfest.egressWalkBike;
  document.getElementById('fanfest_egressAutoValue').textContent = state.fanfest.egressAuto;

  // Fan Fest Arrival/Departure Profiles (18 hours: 6am-11pm)
  const fanfestIngressProfile = [];
  const fanfestEgressProfile = [];
  for (let i = 6; i <= 23; i++) {
    if (data[`fanfest_ingress_${i}`]) {
      fanfestIngressProfile.push(parseFloat(data[`fanfest_ingress_${i}`]));
    }
    if (data[`fanfest_egress_${i}`]) {
      fanfestEgressProfile.push(parseFloat(data[`fanfest_egress_${i}`]));
    }
  }
  if (fanfestIngressProfile.length === 18) state.fanfest.ingressProfile = fanfestIngressProfile;
  if (fanfestEgressProfile.length === 18) state.fanfest.egressProfile = fanfestEgressProfile;

  // ========== AIRPORTS PARAMETERS ==========

  // Airports Ingress Mode Share
  if (data['airports_ingressTransit']) {
    state.airports.ingressTransit = parseInt(data['airports_ingressTransit']);
    const slider = document.getElementById('airports_ingressTransit');
    slider.value = state.airports.ingressTransit;
    document.getElementById('airports_ingressTransitValue').textContent = state.airports.ingressTransit;
    updateSliderBackground(slider);
  }
  if (data['airports_ingressTNC']) {
    state.airports.ingressTNC = parseInt(data['airports_ingressTNC']);
    const slider = document.getElementById('airports_ingressTNC');
    slider.value = state.airports.ingressTNC;
    document.getElementById('airports_ingressTNCValue').textContent = state.airports.ingressTNC;
    updateSliderBackground(slider);
  }
  if (data['airports_ingressWalkBike']) {
    state.airports.ingressWalkBike = parseInt(data['airports_ingressWalkBike']);
    const slider = document.getElementById('airports_ingressWalkBike');
    slider.value = state.airports.ingressWalkBike;
    document.getElementById('airports_ingressWalkBikeValue').textContent = state.airports.ingressWalkBike;
    updateSliderBackground(slider);
  }
  state.airports.ingressAuto = 100 - state.airports.ingressTransit - state.airports.ingressTNC - state.airports.ingressWalkBike;
  document.getElementById('airports_ingressAutoValue').textContent = state.airports.ingressAuto;

  // Airports Egress Mode Share
  if (data['airports_egressTransit']) {
    state.airports.egressTransit = parseInt(data['airports_egressTransit']);
    const slider = document.getElementById('airports_egressTransit');
    slider.value = state.airports.egressTransit;
    document.getElementById('airports_egressTransitValue').textContent = state.airports.egressTransit;
    updateSliderBackground(slider);
  }
  if (data['airports_egressTNC']) {
    state.airports.egressTNC = parseInt(data['airports_egressTNC']);
    const slider = document.getElementById('airports_egressTNC');
    slider.value = state.airports.egressTNC;
    document.getElementById('airports_egressTNCValue').textContent = state.airports.egressTNC;
    updateSliderBackground(slider);
  }
  if (data['airports_egressWalkBike']) {
    state.airports.egressWalkBike = parseInt(data['airports_egressWalkBike']);
    const slider = document.getElementById('airports_egressWalkBike');
    slider.value = state.airports.egressWalkBike;
    document.getElementById('airports_egressWalkBikeValue').textContent = state.airports.egressWalkBike;
    updateSliderBackground(slider);
  }
  state.airports.egressAuto = 100 - state.airports.egressTransit - state.airports.egressTNC - state.airports.egressWalkBike;
  document.getElementById('airports_egressAutoValue').textContent = state.airports.egressAuto;

  // ========== UPDATE PROFILE CHARTS ==========

  // Update profile charts for all models
  if (state.nrg.ingressProfile && state.nrg.egressProfile) {
    nrgProfileChart.renderChart();
    nrgProfileChart.renderInputTable();
    nrgProfileChart.updateTotals();
    nrgProfileChart.updateGameLines();
  }

  if (state.fanfest.ingressProfile && state.fanfest.egressProfile) {
    fanfestProfileChart.renderChart();
    fanfestProfileChart.renderInputTable();
    fanfestProfileChart.updateTotals();
  }

  // ========== DISPLAY IMPORTED SCENARIO NAME (Spec 6.1d) ==========

  if (data['scenarioName']) {
    const importedNameContainer = document.getElementById('importedScenarioName');
    const scenarioNameDisplay = document.getElementById('scenarioNameDisplay');
    scenarioNameDisplay.textContent = data['scenarioName'];
    importedNameContainer.style.display = 'block';
  }

  alert('Scenario imported successfully!');
}

// Export scenario to CSV
function exportScenarioToCSV(scenarioName) {
  // Create timestamp
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Build CSV header - New multi-model schema (6.2b)
  const headers = [
    'scenarioName',
    'timestamp',
    // General Parameters
    'dayType',
    'selectedDate',
    'international',
    'domestic',
    'outsideRegion',
    'insideRegion',
    'tdmReduction',
    // NRG Stadium Parameters
    'nrg_gameStartTime',
    'nrg_gameDuration',
    'nrg_attendance',
    'nrg_spectator',
    'nrg_fifaConstituent',
    'nrg_ingressTransit',
    'nrg_ingressTNC',
    'nrg_ingressWalkBike',
    'nrg_egressTransit',
    'nrg_egressTNC',
    'nrg_egressWalkBike'
  ];

  // Add NRG ingress profile columns (6am to 11pm = hours 6-23)
  for (let i = 6; i <= 23; i++) {
    headers.push(`nrg_ingress_${i}`);
  }

  // Add NRG egress profile columns
  for (let i = 6; i <= 23; i++) {
    headers.push(`nrg_egress_${i}`);
  }

  // Fan Fest Parameters
  headers.push('fanfest_attendance');
  headers.push('fanfest_ingressTransit');
  headers.push('fanfest_ingressTNC');
  headers.push('fanfest_ingressWalkBike');
  headers.push('fanfest_egressTransit');
  headers.push('fanfest_egressTNC');
  headers.push('fanfest_egressWalkBike');

  // Add Fan Fest ingress profile columns (6am to 11pm = hours 6-23)
  for (let i = 6; i <= 23; i++) {
    headers.push(`fanfest_ingress_${i}`);
  }

  // Add Fan Fest egress profile columns
  for (let i = 6; i <= 23; i++) {
    headers.push(`fanfest_egress_${i}`);
  }

  // Airports Parameters
  headers.push('airports_ingressTransit');
  headers.push('airports_ingressTNC');
  headers.push('airports_ingressWalkBike');
  headers.push('airports_egressTransit');
  headers.push('airports_egressTNC');
  headers.push('airports_egressWalkBike');

  // Build CSV data row - New multi-model schema
  const values = [
    scenarioName,
    timestamp,
    // General Parameters
    state.general.dayType,
    state.general.selectedDate || '',
    state.general.international,
    state.general.domestic,
    state.general.outsideRegion,
    state.general.insideRegion,
    state.general.tdmReduction,
    // NRG Stadium Parameters
    state.nrg.gameStartTime,
    state.nrg.gameDuration,
    state.nrg.attendance,
    state.nrg.spectator,
    state.nrg.fifaConstituent,
    state.nrg.ingressTransit,
    state.nrg.ingressTNC,
    state.nrg.ingressWalkBike,
    state.nrg.egressTransit,
    state.nrg.egressTNC,
    state.nrg.egressWalkBike
  ];

  // Add NRG ingress profile values
  state.nrg.ingressProfile.forEach(val => {
    values.push(val.toFixed(1));
  });

  // Add NRG egress profile values
  state.nrg.egressProfile.forEach(val => {
    values.push(val.toFixed(1));
  });

  // Fan Fest Parameters
  values.push(state.fanfest.attendance);
  values.push(state.fanfest.ingressTransit);
  values.push(state.fanfest.ingressTNC);
  values.push(state.fanfest.ingressWalkBike);
  values.push(state.fanfest.egressTransit);
  values.push(state.fanfest.egressTNC);
  values.push(state.fanfest.egressWalkBike);

  // Add Fan Fest ingress profile values
  state.fanfest.ingressProfile.forEach(val => {
    values.push(val.toFixed(1));
  });

  // Add Fan Fest egress profile values
  state.fanfest.egressProfile.forEach(val => {
    values.push(val.toFixed(1));
  });

  // Airports Parameters
  values.push(state.airports.ingressTransit);
  values.push(state.airports.ingressTNC);
  values.push(state.airports.ingressWalkBike);
  values.push(state.airports.egressTransit);
  values.push(state.airports.egressTNC);
  values.push(state.airports.egressWalkBike);

  // Create CSV content
  const csvContent = headers.join(',') + '\n' + values.join(',');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Format filename: ScenarioName_Timestamp.csv
  const fileTimestamp = timestamp.replace(/[: ]/g, '-');
  const filename = `${scenarioName}_${fileTimestamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Close modal and show success message
  saveScenarioModal.classList.remove('show');
  alert('Scenario saved successfully!\n\nFile: ' + filename);
}

// Validate scenario before export
function validateScenario() {
  const errors = [];

  // Validate NRG Stadium profiles
  const nrgIngressTotal = state.nrg.ingressProfile.reduce((sum, val) => sum + val, 0);
  const nrgIngressRounded = Math.round(nrgIngressTotal * 10) / 10;
  if (Math.abs(nrgIngressRounded - 100) > 0.1) {
    errors.push(`• NRG Stadium ingress profile must sum to 100% (currently ${nrgIngressRounded.toFixed(1)}%)`);
  }

  const nrgEgressTotal = state.nrg.egressProfile.reduce((sum, val) => sum + val, 0);
  const nrgEgressRounded = Math.round(nrgEgressTotal * 10) / 10;
  if (Math.abs(nrgEgressRounded - 100) > 0.1) {
    errors.push(`• NRG Stadium egress profile must sum to 100% (currently ${nrgEgressRounded.toFixed(1)}%)`);
  }

  // Check NRG spectator + FIFA constituent sum to attendance
  if (state.nrg.spectator + state.nrg.fifaConstituent !== state.nrg.attendance) {
    errors.push(`• NRG Stadium: Spectators (${formatNumber(state.nrg.spectator)}) + FIFA Constituents (${formatNumber(state.nrg.fifaConstituent)}) must sum to Attendance (${formatNumber(state.nrg.attendance)})`);
  }

  // Validate Fan Fest profiles
  const fanfestIngressTotal = state.fanfest.ingressProfile.reduce((sum, val) => sum + val, 0);
  const fanfestIngressRounded = Math.round(fanfestIngressTotal * 10) / 10;
  if (Math.abs(fanfestIngressRounded - 100) > 0.1) {
    errors.push(`• Fan Fest ingress profile must sum to 100% (currently ${fanfestIngressRounded.toFixed(1)}%)`);
  }

  const fanfestEgressTotal = state.fanfest.egressProfile.reduce((sum, val) => sum + val, 0);
  const fanfestEgressRounded = Math.round(fanfestEgressTotal * 10) / 10;
  if (Math.abs(fanfestEgressRounded - 100) > 0.1) {
    errors.push(`• Fan Fest egress profile must sum to 100% (currently ${fanfestEgressRounded.toFixed(1)}%)`);
  }

  return errors;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  init();
  // Note: profileChart.init() is now called within switchModel() for each model
});
