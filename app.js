// AuraCarbon - Application Logic

// Carbon footprint database & state
let state = {
  // User lifestyle settings
  transportType: 'car_petrol',
  transportDist: 150,
  flights: 4,
  electricity: 60,
  renewable: 'none',
  diet: 'meat_heavy',
  foodWaste: 'moderate',
  shopping: 'moderate',
  recycle: 'yes',
  
  // App state
  calculatedFootprint: 0, // In tons
  breakdown: {
    transport: 0,
    energy: 0,
    diet: 0,
    shopping: 0
  },
  completedHabits: [], // Array of habit IDs completed today
  savingsHistory: [38, 40, 42, 45, 41, 44, 42], // Historical savings in kg for past 7 days
  isOnboarded: false
};

// Habit database
const HABITS = [
  { id: 'transit', name: 'Take Public Transit / Carpool', impact: 4.8, category: 'transport', icon: 'fa-bus' },
  { id: 'meatless', name: 'Eat Plant-Based Meals Today', impact: 3.5, category: 'diet', icon: 'fa-carrot' },
  { id: 'unplug', name: 'Unplug Unused Electronics', impact: 0.8, category: 'energy', icon: 'fa-plug' },
  { id: 'wash_cold', name: 'Wash Clothes in Cold Water', impact: 1.2, category: 'energy', icon: 'fa-temperature-empty' },
  { id: 'no_plastic', name: 'Avoid Single-Use Plastics', impact: 0.5, category: 'shopping', icon: 'fa-ban' },
  { id: 'compost', name: 'Compost Food Scrap Waste', impact: 0.9, category: 'diet', icon: 'fa-seedling' },
  { id: 'local_produce', name: 'Buy Local Produce', impact: 1.1, category: 'diet', icon: 'fa-shop' }
];

// DOM elements
const welcomeTitle = document.getElementById('welcome-title');
const openCalcBtn = document.getElementById('open-calc-btn');
const closeCalcBtn = document.getElementById('close-calc-btn');
const calcModal = document.getElementById('calc-modal');
const prevStepBtn = document.getElementById('prev-step-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const calculatorForm = document.getElementById('calculator-form');
const resetHabitsBtn = document.getElementById('reset-habits-btn');

// Sliders mapping
const sliders = [
  { inputId: 'transportDist', valId: 'transportDistVal', suffix: ' km' },
  { inputId: 'flights', valId: 'flightsVal', suffix: ' hrs' },
  { inputId: 'electricity', valId: 'electricityVal', prefix: '$' }
];

// Initialize Sliders
sliders.forEach(slider => {
  const inputEl = document.getElementById(slider.inputId);
  const valEl = document.getElementById(slider.valId);
  if (inputEl && valEl) {
    inputEl.addEventListener('input', (e) => {
      const val = e.target.value;
      valEl.textContent = (slider.prefix || '') + val + (slider.suffix || '');
    });
  }
});

// Modal step controls
let currentStep = 1;
const totalSteps = 4;

function updateModalStep() {
  document.querySelectorAll('.calculator-step').forEach(step => {
    step.classList.remove('active');
  });
  document.querySelector(`.calculator-step[data-step="${currentStep}"]`).classList.add('active');

  document.querySelectorAll('.indicator-dot').forEach(dot => {
    const stepNum = parseInt(dot.getAttribute('data-step'));
    if (stepNum <= currentStep) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  if (currentStep === 1) {
    prevStepBtn.style.visibility = 'hidden';
  } else {
    prevStepBtn.style.visibility = 'visible';
  }

  if (currentStep === totalSteps) {
    nextStepBtn.textContent = 'Calculate';
  } else {
    nextStepBtn.textContent = 'Next';
  }
}

nextStepBtn.addEventListener('click', () => {
  if (currentStep < totalSteps) {
    currentStep++;
    updateModalStep();
  } else {
    // Submit form
    calculateFootprintFromForm();
    closeCalculator();
  }
});

prevStepBtn.addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep--;
    updateModalStep();
  }
});

// Modal Open/Close
openCalcBtn.addEventListener('click', () => {
  currentStep = 1;
  updateModalStep();
  // Populate form with current state values
  syncStateToForm();
  calcModal.classList.add('active');
});

closeCalcBtn.addEventListener('click', closeCalculator);

function closeCalculator() {
  calcModal.classList.remove('active');
}

// Navigation Tab Swapping
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tabName = link.getAttribute('data-tab');
    
    // Toggle active nav link
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // Toggle active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// Load state from local storage or initialize first time
function loadState() {
  const saved = localStorage.getItem('auracarbon_state');
  if (saved) {
    state = JSON.parse(saved);
  } else {
    // Default values calculate to initial state
    runCalculations();
    state.isOnboarded = true;
    saveState();
  }
}

function saveState() {
  localStorage.setItem('auracarbon_state', JSON.stringify(state));
}

// Map form values to state
function syncStateToForm() {
  // Trans
  document.querySelector(`input[name="transportType"][value="${state.transportType}"]`).checked = true;
  document.getElementById('transportDist').value = state.transportDist;
  document.getElementById('transportDistVal').textContent = state.transportDist + ' km';
  document.getElementById('flights').value = state.flights;
  document.getElementById('flightsVal').textContent = state.flights + ' hrs';
  // Energy
  document.getElementById('electricity').value = state.electricity;
  document.getElementById('electricityVal').textContent = '$' + state.electricity;
  document.querySelector(`input[name="renewable"][value="${state.renewable}"]`).checked = true;
  // Diet
  document.querySelector(`input[name="diet"][value="${state.diet}"]`).checked = true;
  document.querySelector(`input[name="foodWaste"][value="${state.foodWaste}"]`).checked = true;
  // Shopping
  document.querySelector(`input[name="shopping"][value="${state.shopping}"]`).checked = true;
  document.querySelector(`input[name="recycle"][value="${state.recycle}"]`).checked = true;
}

function calculateFootprintFromForm() {
  const formData = new FormData(calculatorForm);
  state.transportType = formData.get('transportType');
  state.transportDist = parseInt(document.getElementById('transportDist').value);
  state.flights = parseInt(document.getElementById('flights').value);
  state.electricity = parseInt(document.getElementById('electricity').value);
  state.renewable = formData.get('renewable');
  state.diet = formData.get('diet');
  state.foodWaste = formData.get('foodWaste');
  state.shopping = formData.get('shopping');
  state.recycle = formData.get('recycle');
  
  runCalculations();
  saveState();
  updateUI();
}

// Calculate carbon footprint in kg CO2 equivalents per year
function runCalculations() {
  // 1. Transportation
  let transFactor = 0.18; // car_petrol
  if (state.transportType === 'car_electric') transFactor = 0.05;
  if (state.transportType === 'public') transFactor = 0.04;
  if (state.transportType === 'active') transFactor = 0;
  
  const transportCO2 = state.transportDist * 52 * transFactor;
  const flightCO2 = state.flights * 90; // approx 90kg per hour of flight
  const totalTransport = transportCO2 + flightCO2;

  // 2. Home Energy
  let energyMultiplier = 0.4 * 12; // 0.4kg per $ billed, converted to annual
  let renewDiscount = 1;
  if (state.renewable === 'partial') renewDiscount = 0.5;
  if (state.renewable === 'full') renewDiscount = 0;
  const totalEnergy = state.electricity * energyMultiplier * renewDiscount;

  // 3. Diet and Food
  let dietCO2 = 1700; // balanced default
  if (state.diet === 'meat_heavy') dietCO2 = 2500;
  if (state.diet === 'vegetarian') dietCO2 = 1200;
  if (state.diet === 'vegan') dietCO2 = 800;

  let wasteCO2 = 200; // moderate default
  if (state.foodWaste === 'high') wasteCO2 = 400;
  if (state.foodWaste === 'minimal') wasteCO2 = 50;
  const totalDiet = dietCO2 + wasteCO2;

  // 4. Goods & Shopping
  let shoppingCO2 = 800;
  if (state.shopping === 'high') shoppingCO2 = 1500;
  if (state.shopping === 'minimal') shoppingCO2 = 300;

  let recycleCO2 = 50; // regularly recycling helps offset some indirect goods footprint
  if (state.recycle === 'no') recycleCO2 = 200;
  const totalShopping = shoppingCO2 + recycleCO2;

  // Set values to state (convert to Tons for total footprint, keeping raw kg for breakdown)
  state.breakdown.transport = Math.round(totalTransport);
  state.breakdown.energy = Math.round(totalEnergy);
  state.breakdown.diet = Math.round(totalDiet);
  state.breakdown.shopping = Math.round(totalShopping);

  const totalKg = totalTransport + totalEnergy + totalDiet + totalShopping;
  state.calculatedFootprint = parseFloat((totalKg / 1000).toFixed(1));
}

// Chart variables
let emissionsChart = null;
let historicalChart = null;

function renderCharts() {
  // Destroy existing charts to avoid overlap
  if (emissionsChart) emissionsChart.destroy();
  if (historicalChart) historicalChart.destroy();

  const ctxPie = document.getElementById('emissionsChart').getContext('2d');
  const dataPie = {
    labels: ['Transport', 'Home Energy', 'Diet & Food', 'Shopping & Goods'],
    datasets: [{
      data: [
        state.breakdown.transport,
        state.breakdown.energy,
        state.breakdown.diet,
        state.breakdown.shopping
      ],
      backgroundColor: ['#06b6d4', '#f97316', '#10b981', '#a855f7'],
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }]
  };

  emissionsChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: dataPie,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#9ca3af',
            font: { family: 'Inter', size: 12 }
          }
        }
      },
      cutout: '65%'
    }
  });

  // Calculate daily progress based on habits checked
  const currentSavings = state.completedHabits.reduce((acc, hId) => {
    const habit = HABITS.find(h => h.id === hId);
    return acc + (habit ? habit.impact : 0);
  }, 0);

  // Show a rolling 7-day trend
  const historyData = [...state.savingsHistory];
  historyData[historyData.length - 1] = parseFloat((historyData[historyData.length - 1] + currentSavings).toFixed(1));

  const ctxLine = document.getElementById('historicalChart').getContext('2d');
  historicalChart = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
      datasets: [{
        label: 'Carbon Saved (kg CO₂e)',
        data: historyData,
        fill: true,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9ca3af' }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });
}

// Generate Insights dynamically based on user high emissions
function generateInsights() {
  const insightsContainer = document.getElementById('insight-list-container');
  insightsContainer.innerHTML = '';

  const insights = [];

  // Insight 1: Transport
  if (state.transportType === 'car_petrol' && state.transportDist > 100) {
    insights.push({
      title: 'High Vehicle Emissions',
      text: 'You travel substantial mileage using a petrol car. Swapping just 1 day of driving with transit saves up to 250kg of CO₂ yearly.',
      type: 'warning'
    });
  } else if (state.flights > 5) {
    insights.push({
      title: 'Frequent Flyer Impact',
      text: 'Long-haul flights constitute a massive share of your emissions. Consider carbon offset programs or train alternatives.',
      type: 'warning'
    });
  } else {
    insights.push({
      title: 'Clean Travel Master',
      text: 'Your transportation choices are eco-friendly! Keep using active transport and public transit.',
      type: 'success'
    });
  }

  // Insight 2: Energy
  if (state.renewable === 'none') {
    insights.push({
      title: 'Transition to Clean Energy',
      text: 'Your home is powered by standard grid electricity. Check if your provider offers a green energy option to reduce utility footprint to zero.',
      type: 'warning'
    });
  } else if (state.electricity > 100) {
    insights.push({
      title: 'Optimize Appliance Power',
      text: 'Your high electricity bill suggests high consumption. Smart plugs and LED bulb retrofits can trim 15% off your usage.',
      type: 'warning'
    });
  }

  // Insight 3: Diet
  if (state.diet === 'meat_heavy') {
    insights.push({
      title: 'Plant-forward Savings',
      text: 'Diet is a powerful carbon lever. Reducing red meat intake or going meatless on weekdays cuts diet footprint by 30%.',
      type: 'warning'
    });
  } else if (state.diet === 'vegan' || state.diet === 'vegetarian') {
    insights.push({
      title: 'Excellent Diet Footprint',
      text: 'Your plant-based diet helps maintain one of the lowest possible nutritional carbon impacts.',
      type: 'success'
    });
  }

  insights.forEach(ins => {
    const div = document.createElement('div');
    div.className = `insight-card ${ins.type === 'warning' ? 'warning' : ''}`;
    div.innerHTML = `
      <h4 class="font-outfit">${ins.title}</h4>
      <p>${ins.text}</p>
    `;
    insightsContainer.appendChild(div);
  });
}

// Render habits dynamically
function renderHabits() {
  const quickList = document.getElementById('quick-habit-list');
  const fullList = document.getElementById('full-habit-list');
  
  quickList.innerHTML = '';
  fullList.innerHTML = '';

  HABITS.forEach(habit => {
    const isChecked = state.completedHabits.includes(habit.id);
    const html = `
      <div class="habit-item">
        <div class="habit-info">
          <div class="habit-icon">
            <i class="fa-solid ${habit.icon}"></i>
          </div>
          <div>
            <div class="habit-name">${habit.name}</div>
            <div class="habit-impact">-${habit.impact} kg CO₂e</div>
          </div>
        </div>
        <div class="habit-checkbox-wrapper">
          <input type="checkbox" class="habit-checkbox" data-id="${habit.id}" ${isChecked ? 'checked' : ''}>
          <div class="checkmark"></div>
        </div>
      </div>
    `;

    // Append to full list tab
    const fullItemWrapper = document.createElement('div');
    fullItemWrapper.innerHTML = html;
    fullList.appendChild(fullItemWrapper.firstElementChild);

    // Append to dashboard quick list (top 3 habits)
    if (HABITS.indexOf(habit) < 3) {
      const quickItemWrapper = document.createElement('div');
      quickItemWrapper.innerHTML = html;
      quickList.appendChild(quickItemWrapper.firstElementChild);
    }
  });

  // Attach event listeners to all habit checkboxes
  document.querySelectorAll('.habit-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const habitId = e.target.getAttribute('data-id');
      const isChecked = e.target.checked;

      if (isChecked) {
        if (!state.completedHabits.includes(habitId)) {
          state.completedHabits.push(habitId);
        }
      } else {
        state.completedHabits = state.completedHabits.filter(id => id !== habitId);
      }

      saveState();
      updateUI();
    });
  });
}

function updateUI() {
  // Welcome title & subtitle personalization
  const userName = "Eco Ally";
  welcomeTitle.textContent = `Hey, ${userName}!`;
  
  // Total footprint KPI
  document.getElementById('kpi-footprint').textContent = state.calculatedFootprint;
  
  // Diff comparison against average (US average ~ 16 tons, Global average ~ 4.7 tons)
  const averageTons = 12.0;
  const pctDiff = Math.round(((averageTons - state.calculatedFootprint) / averageTons) * 100);
  const diffEl = document.getElementById('kpi-footprint-diff');
  if (pctDiff >= 0) {
    diffEl.textContent = `${pctDiff}% lower`;
    diffEl.parentElement.className = "kpi-trend trend-down";
    diffEl.parentElement.firstElementChild.className = "fa-solid fa-arrow-down";
  } else {
    diffEl.textContent = `${Math.abs(pctDiff)}% higher`;
    diffEl.parentElement.className = "kpi-trend trend-up";
    diffEl.parentElement.firstElementChild.className = "fa-solid fa-arrow-up";
  }

  // Daily Savings calculation
  const totalSaved = state.completedHabits.reduce((acc, hId) => {
    const habit = HABITS.find(h => h.id === hId);
    return acc + (habit ? habit.impact : 0);
  }, 0);
  document.getElementById('kpi-savings').textContent = totalSaved.toFixed(1);

  // Score computation
  // Start with 100, deduct points for higher footprint (max footprint capped around 25 tons for scaling)
  let score = Math.max(10, Math.round(100 - (state.calculatedFootprint * 3.5)));
  // Add bonus points for daily green habits
  score = Math.min(100, score + (state.completedHabits.length * 4));
  document.getElementById('kpi-score').textContent = score;

  // Compute Eco Level Badges
  const badgeEl = document.getElementById('kpi-level-badge');
  if (badgeEl) {
    if (score < 45) {
      badgeEl.textContent = "Eco Seedling 🌱";
      badgeEl.className = "eco-badge badge-seedling";
    } else if (score >= 45 && score < 70) {
      badgeEl.textContent = "Eco Sprout 🌿";
      badgeEl.className = "eco-badge badge-sprout";
    } else if (score >= 70 && score < 85) {
      badgeEl.textContent = "Eco Sapling 🌳";
      badgeEl.className = "eco-badge badge-sapling";
    } else {
      badgeEl.textContent = "Forest Protector 👑";
      badgeEl.className = "eco-badge badge-protector";
    }
  }

  // Calculate beginner friendly real-world analogies
  const treesCount = Math.round(state.calculatedFootprint * 16.5);
  const phonesCharged = Math.round(state.calculatedFootprint * 121643);
  const milesDriven = Math.round(state.calculatedFootprint * 2500);

  document.getElementById('analogy-trees').textContent = treesCount.toLocaleString();
  document.getElementById('analogy-phones').textContent = phonesCharged.toLocaleString();
  document.getElementById('analogy-miles').textContent = `${milesDriven.toLocaleString()} miles`;

  // Reduction target progress: (Daily savings * 365) compared against 15% reduction of annual footprint
  const targetReductionKg = (state.calculatedFootprint * 1000) * 0.15;
  const projectedAnnualSavings = totalSaved * 365;
  let targetProgress = Math.min(100, Math.round((projectedAnnualSavings / targetReductionKg) * 100));
  if (isNaN(targetProgress)) targetProgress = 0;

  document.getElementById('target-progress-pct').textContent = `${targetProgress}%`;
  document.getElementById('target-progress-bar').style.width = `${targetProgress}%`;

  // Render lists and charts
  renderHabits();
  generateInsights();
  renderCharts();
}

// Reset checklists handler
resetHabitsBtn.addEventListener('click', () => {
  state.completedHabits = [];
  saveState();
  updateUI();
});

// App Bootstrap
function init() {
  loadState();
  updateUI();
  
  // If first time/never calculated, trigger the modal automatically to onboard
  const hasOnboarded = localStorage.getItem('auracarbon_onboarded');
  if (!hasOnboarded) {
    setTimeout(() => {
      openCalcBtn.click();
      localStorage.setItem('auracarbon_onboarded', 'true');
    }, 800);
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
init(); // ensure init executes even if DOM already parsed
