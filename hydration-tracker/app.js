/**
 * Daily Pulse — Hydration Tracker App
 * Shared Application Logic
 */

/* ============================================================
   STATE
   ============================================================ */
const State = {
  hydration: {
    goal: 2500,     // ml
    current: 850,   // ml
    log: []
  },
  calories: {
    goal: 2000,
    consumed: 0,
    burned: 0,
    breakdown: { carbs: 0, protein: 0, fat: 0 }
  },
  habits: {
    list: [
      { id: 'water', name: 'Drink Water Goal', icon: 'water_drop', streak: 4 },
      { id: 'exercise', name: '30-min Exercise', icon: 'fitness_center', streak: 2 },
      { id: 'sleep', name: '8 Hours Sleep', icon: 'bedtime', streak: 6 },
      { id: 'veggies', name: 'Eat Vegetables', icon: 'eco', streak: 3 },
      { id: 'noscr', name: 'No Screens 1hr Before Bed', icon: 'no_cell', streak: 1 },
    ],
    // Key: habitId_dayIndex (0=Mon..6=Sun)
    checked: {}
  },
  meals: {
    // dayIndex (0=Mon..6=Sun) -> { breakfast, lunch, dinner, snack }
    plan: {}
  },
  currentPage: 'dashboard'
};

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigateTo(pageId) {
  // Update pages
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  // Update sidebar nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  // Update mobile bottom nav
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  State.currentPage = pageId;

  // Page-specific init
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'hydration') renderHydration();
  if (pageId === 'calories') initCaloriesPage();
  if (pageId === 'habits') renderHabits();
  if (pageId === 'meal') renderMealPlanner();

  // Close mobile sidebar if open
  document.querySelector('.sidebar')?.classList.remove('mobile-open');
}

/* ============================================================
   DATE HELPER
   ============================================================ */
function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWeekDays() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return days;
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ============================================================
   RING CHART HELPER
   ============================================================ */
function setRing(svgId, pct) {
  const circle = document.getElementById(svgId);
  if (!circle) return;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const pct = Math.round((State.hydration.current / State.hydration.goal) * 100);
  const calPct = Math.round((State.calories.consumed / State.calories.goal) * 100);

  // Ring charts
  setTimeout(() => {
    setRing('ring-hydration', Math.min(pct, 100));
    setRing('ring-calories', Math.min(calPct, 100));
    setRing('ring-vitality', 72);

    // Progress bars
    document.querySelectorAll('.dash-track[data-pct]').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }, 100);

  // Update counters
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('dash-hydration-ml', State.hydration.current + ' ml');
  el('dash-hydration-pct', pct + '%');
  el('dash-cal', State.calories.consumed + ' kcal');
  el('dash-cal-goal', '/ ' + State.calories.goal);
}

/* ============================================================
   HYDRATION TRACKER
   ============================================================ */
const CUP_SIZES = [
  { label: 'Sip', ml: 100, icon: 'coffee' },
  { label: 'Glass', ml: 250, icon: 'water_full' },
  { label: 'Bottle', ml: 500, icon: 'water_drop' },
  { label: 'Large', ml: 750, icon: 'local_drink' }
];

function renderHydration() {
  updateWaterVisual();
  renderHydrationLog();
  updateMilestones();
}

function updateWaterVisual() {
  const pct = Math.min((State.hydration.current / State.hydration.goal) * 100, 100);
  const fill = document.getElementById('water-fill');
  const label = document.getElementById('water-label');
  const track = document.getElementById('hydration-track');
  const pctLabel = document.getElementById('hydration-pct-label');
  const remaining = document.getElementById('hydration-remaining');

  if (fill) fill.style.height = pct + '%';
  if (label) label.textContent = State.hydration.current + ' ml';
  if (track) { track.dataset.pct = pct; setTimeout(() => track.style.width = pct + '%', 50); }
  if (pctLabel) pctLabel.textContent = Math.round(pct) + '%';
  if (remaining) {
    const rem = Math.max(State.hydration.goal - State.hydration.current, 0);
    remaining.textContent = rem > 0 ? rem + ' ml remaining' : '🎉 Goal achieved!';
  }
}

function addWater(ml) {
  State.hydration.current = Math.min(State.hydration.current + ml, State.hydration.goal);
  State.hydration.log.unshift({
    ml,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    icon: ml <= 100 ? 'coffee' : ml <= 250 ? 'water_full' : ml <= 500 ? 'water_drop' : 'local_drink'
  });
  updateWaterVisual();
  updateMilestones();
  renderHydrationLog();
  if (State.hydration.current >= State.hydration.goal) showToast('🏆 Daily hydration goal achieved!');
  else showToast(`+${ml} ml added! Keep going 💧`);
}

function renderHydrationLog() {
  const container = document.getElementById('hydration-log');
  if (!container) return;
  if (State.hydration.log.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--on-surface-variant);font-size:14px;padding:20px 0;">No entries yet. Log your first drink!</p>';
    return;
  }
  container.innerHTML = State.hydration.log.slice(0, 8).map(entry => `
    <div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--outline-variant);">
      <div class="flex items-center gap-sm">
        <div style="width:36px;height:36px;border-radius:var(--r-sm);background:rgba(0,107,47,0.08);display:flex;align-items:center;justify-content:center;">
          <span class="material-symbols-outlined text-primary" style="font-size:18px;">${entry.icon}</span>
        </div>
        <div>
          <p style="font-size:14px;font-weight:600;">${entry.ml} ml</p>
          <p style="font-size:12px;color:var(--on-surface-variant);">${entry.time}</p>
        </div>
      </div>
      <span class="chip chip-green">Logged</span>
    </div>
  `).join('');
}

function updateMilestones() {
  const pct = (State.hydration.current / State.hydration.goal) * 100;
  const milestones = [25, 50, 75, 100];
  milestones.forEach(m => {
    const dot = document.getElementById('milestone-' + m);
    if (dot) dot.classList.toggle('filled', pct >= m);
  });
}

/* ============================================================
   CALORIE CALCULATOR
   ============================================================ */

function initCaloriesPage() {
  // Reset result panel on each visit so user sees fresh state
  const results = document.getElementById('cal-results');
  if (results) results.classList.add('hidden');
}
function calculateCalories() {
  const weight = parseFloat(document.getElementById('cal-weight')?.value) || 70;
  const height = parseFloat(document.getElementById('cal-height')?.value) || 170;
  const age = parseFloat(document.getElementById('cal-age')?.value) || 25;
  const gender = document.getElementById('cal-gender')?.value || 'male';
  const activity = parseFloat(document.getElementById('cal-activity')?.value) || 1.375;
  const goal = document.getElementById('cal-goal')?.value || 'maintain';

  // Harris-Benedict BMR
  let bmr;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  let tdee = bmr * activity;

  let target;
  if (goal === 'lose') target = tdee - 500;
  else if (goal === 'gain') target = tdee + 500;
  else target = tdee;

  const protein = Math.round((target * 0.30) / 4);
  const carbs   = Math.round((target * 0.45) / 4);
  const fat     = Math.round((target * 0.25) / 9);

  // Update display
  const set = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  set('result-bmr', Math.round(bmr));
  set('result-tdee', Math.round(tdee));
  set('result-target', Math.round(target));
  set('result-protein', protein + 'g');
  set('result-carbs', carbs + 'g');
  set('result-fat', fat + 'g');

  // Macro bars
  const total = protein + carbs + fat;
  const pPct = Math.round((protein * 4 / target) * 100);
  const cPct = Math.round((carbs * 4 / target) * 100);
  const fPct = Math.round((fat * 9 / target) * 100);

  setTimeout(() => {
    const setBar = (id, pct) => { const b = document.getElementById(id); if(b) b.style.width = pct + '%'; };
    setBar('bar-protein', pPct);
    setBar('bar-carbs', cPct);
    setBar('bar-fat', fPct);
  }, 100);

  State.calories.goal = Math.round(target);
  showToast('✅ Calorie plan calculated!');

  document.getElementById('cal-results')?.classList.remove('hidden');
}

/* ============================================================
   HABIT TRACKER
   ============================================================ */
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function renderHabits() {
  const container = document.getElementById('habits-list');
  if (!container) return;

  container.innerHTML = State.habits.list.map(habit => `
    <div class="card mb-md">
      <div class="flex items-center justify-between mb-md">
        <div class="flex items-center gap-sm">
          <div style="width:44px;height:44px;border-radius:var(--r-md);background:rgba(0,107,47,0.08);display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined text-primary">${habit.icon}</span>
          </div>
          <div>
            <p class="font-semibold" style="font-size:15px;">${habit.name}</p>
            <p class="text-sm text-muted">🔥 ${habit.streak}-day streak</p>
          </div>
        </div>
        <span class="chip chip-green">${habit.streak}🔥</span>
      </div>
      <div>
        <div class="habit-week-grid mb-xs">
          ${DAYS.map(d => `<div class="day-label">${d[0]}</div>`).join('')}
        </div>
        <div class="habit-week-grid">
          ${DAYS.map((d, i) => {
            const key = habit.id + '_' + i;
            const checked = !!State.habits.checked[key];
            return `<div class="day-check ${checked ? 'checked' : ''}" onclick="toggleHabit('${habit.id}', ${i}, this)" title="${d}">
              ${checked ? '<span class="material-symbols-outlined" style="font-size:14px;">check</span>' : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function toggleHabit(habitId, dayIndex, el) {
  const key = habitId + '_' + dayIndex;
  State.habits.checked[key] = !State.habits.checked[key];
  el.classList.toggle('checked', State.habits.checked[key]);
  el.innerHTML = State.habits.checked[key]
    ? '<span class="material-symbols-outlined" style="font-size:14px;">check</span>'
    : '';
  const habit = State.habits.list.find(h => h.id === habitId);
  const msg = State.habits.checked[key]
    ? `✅ "${habit.name}" marked for ${DAYS[dayIndex]}!`
    : `Unmarked "${habit.name}" for ${DAYS[dayIndex]}`;
  showToast(msg);
}

function addHabit() {
  const input = document.getElementById('new-habit-input');
  if (!input || !input.value.trim()) return;
  State.habits.list.push({
    id: 'habit_' + Date.now(),
    name: input.value.trim(),
    icon: 'star',
    streak: 0
  });
  input.value = '';
  renderHabits();
  showToast('New habit added!');
}

/* ============================================================
   MEAL PLANNER
   ============================================================ */
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const WEEK_DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const SAMPLE_MEALS = {
  breakfast: ['Oatmeal with berries', 'Scrambled eggs & toast', 'Smoothie bowl', 'Whole grain cereal'],
  lunch:     ['Grilled chicken salad', 'Lentil soup', 'Quinoa bowl', 'Tuna sandwich'],
  dinner:    ['Baked salmon & veg', 'Stir-fried tofu', 'Brown rice & dal', 'Grilled chicken'],
  snack:     ['Apple & peanut butter', 'Mixed nuts', 'Greek yogurt', 'Rice cakes']
};

function renderMealPlanner() {
  const container = document.getElementById('meal-planner-grid');
  if (!container) return;

  container.innerHTML = WEEK_DAYS.map((day, di) => `
    <div class="card">
      <div class="flex items-center justify-between mb-md">
        <h3 style="font-family:var(--font-display);font-size:15px;font-weight:700;">${day}</h3>
        <button class="btn btn-ghost btn-sm" onclick="autoFillDay(${di})">
          <span class="material-symbols-outlined" style="font-size:16px;">auto_awesome</span> Auto
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${MEAL_TYPES.map(mealType => {
          const key = di + '_' + mealType.toLowerCase();
          const val = State.meals.plan[key] || '';
          return `
            <div>
              <p style="font-size:11px;font-weight:600;color:var(--on-surface-variant);margin-bottom:4px;">${mealType.toUpperCase()}</p>
              <div class="meal-slot ${val ? 'filled' : ''}" onclick="editMeal(${di}, '${mealType.toLowerCase()}', this)">
                ${val ? `<span class="material-symbols-outlined text-primary" style="font-size:16px;">check_circle</span> ${val}`
                       : `<span class="material-symbols-outlined" style="font-size:16px;">add_circle_outline</span> Add ${mealType}`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function autoFillDay(di) {
  MEAL_TYPES.forEach(mealType => {
    const key = di + '_' + mealType.toLowerCase();
    const pool = SAMPLE_MEALS[mealType.toLowerCase()];
    State.meals.plan[key] = pool[Math.floor(Math.random() * pool.length)];
  });
  renderMealPlanner();
  showToast(`✨ ${WEEK_DAYS[di]} plan auto-filled!`);
}

function editMeal(di, mealType, el) {
  const key = di + '_' + mealType;
  const cur = State.meals.plan[key] || '';
  const pool = SAMPLE_MEALS[mealType] || [];

  // Simple cycle through options
  const idx = pool.indexOf(cur);
  const next = pool[(idx + 1) % pool.length];
  State.meals.plan[key] = next;

  const day = WEEK_DAYS[di];
  el.className = 'meal-slot filled';
  el.innerHTML = `<span class="material-symbols-outlined text-primary" style="font-size:16px;">check_circle</span> ${next}`;
  showToast(`🍽️ ${day} ${mealType} updated!`);
}

/* ============================================================
   CUSTOM WATER INPUT
   ============================================================ */
function addCustomWater() {
  const input = document.getElementById('custom-water-input');
  const ml = parseInt(input?.value);
  if (!ml || ml <= 0) { showToast('Please enter a valid amount'); return; }
  addWater(ml);
  if (input) input.value = '';
}

/* ============================================================
   LOG VITALS MODAL
   ============================================================ */
function openLogModal() {
  document.getElementById('log-modal')?.classList.remove('hidden');
}
function closeLogModal() {
  document.getElementById('log-modal')?.classList.add('hidden');
}
function submitVitals() {
  const water = parseInt(document.getElementById('log-water')?.value) || 0;
  const cals  = parseInt(document.getElementById('log-calories')?.value) || 0;
  if (water > 0) {
    State.hydration.current = Math.min(State.hydration.current + water, State.hydration.goal);
  }
  if (cals > 0) {
    State.calories.consumed = Math.min(State.calories.consumed + cals, State.calories.goal * 2);
  }
  closeLogModal();
  renderDashboard();
  if (State.currentPage === 'hydration') renderHydration();
  showToast('✅ Vitals logged successfully!');
}

/* ============================================================
   RESET DAY
   ============================================================ */
function resetDay() {
  if (!confirm('Reset today\'s hydration tracking?')) return;
  State.hydration.current = 0;
  State.hydration.log = [];
  renderHydration();
  renderDashboard();
  showToast('🔄 Hydration reset for today.');
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Update date label
  document.querySelectorAll('.today-label').forEach(el => {
    el.textContent = getTodayLabel();
  });

  // Attach nav listeners
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(btn.dataset.page);
    });
  });

  // Mobile hamburger
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('mobile-open');
  });

  // Start on dashboard
  navigateTo('dashboard');
});
