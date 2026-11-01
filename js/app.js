/**
 * MotoPulse - Main Application Controller
 * Zero Mock Data - Full Manual Tracking & Control
 */

// Sound Engine using Web Audio API
const SoundEffects = {
  ctx: null,
  enabled: true,

  init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    } catch (e) {}
  },

  playClick() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {}
  },

  playSuccess() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);
    } catch (e) {}
  }
};

// Completely Empty Default State - No Mock / Sample Data
const DEFAULT_STATE = {
  activeBikeId: null,
  currency: '₹',
  unitDist: 'km',
  unitFuel: 'L',
  unitMileage: 'km/L',
  soundEnabled: true,
  theme: 'dark', // 'dark' | 'light' | 'auto'
  accentColor: 'ferrari', // 'ferrari' (Ferrari Red #E60000) | 'orange' | 'mint' | 'amber' | 'emerald'
  bikes: []
};

// Main App Controller
const App = {
  state: null,
  activeTab: 'garage',
  pendingUploadDocId: null,
  currentViewingDocId: null,

  init() {
    this.loadState();
    SoundEffects.init();
    SoundEffects.enabled = this.state.soundEnabled !== false;

    this.applyTheme();
    this.bindEvents();
    this.render();

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.state && this.state.theme === 'auto') {
          this.applyTheme();
        }
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  },

  loadState() {
    try {
      const stored = localStorage.getItem('motopulse_state');
      if (stored) {
        this.state = JSON.parse(stored);
        // If state contains legacy demo bikes (Panigale / default demo), wipe clean as requested
        const hasLegacyDemo = this.state.bikes && this.state.bikes.some(b => 
          b.id === 'bike_panigale' || b.id === 'bike_scrambler' || b.id === 'bike_default'
        );
        if (hasLegacyDemo) {
          this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
          this.saveState();
        } else {
          if (!this.state.theme) this.state.theme = 'dark';
          if (!this.state.accentColor || this.state.accentColor === 'amber' || this.state.accentColor === 'orange') this.state.accentColor = 'ferrari';
        }
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.saveState();
      }
    } catch (e) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  },

  saveState() {
    try {
      localStorage.setItem('motopulse_state', JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  },

  getActiveBike() {
    if (!this.state.bikes || this.state.bikes.length === 0) return null;
    return this.state.bikes.find(b => b.id === this.state.activeBikeId) || this.state.bikes[0];
  },

  // Setup Event Listeners
  bindEvents() {
    // Navigation bar tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) {
          SoundEffects.playClick();
          this.switchTab(tab);
        }
      });
    });

    // Close modals on clicking backdrop or handle
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        SoundEffects.playClick();
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal(overlay.id);
        }
      });
    });

    // Refuel Auto-calculate cost & Real-Time Performance Variance
    const odoInput = document.getElementById('refuelOdometer');
    const litInput = document.getElementById('refuelLitres');
    const priceInput = document.getElementById('refuelPrice');
    const costInput = document.getElementById('refuelCost');

    const recalcCost = () => {
      const lit = parseFloat(litInput?.value) || 0;
      const prc = parseFloat(priceInput?.value) || 0;
      if (lit > 0 && prc > 0 && costInput) {
        costInput.value = (lit * prc).toFixed(2);
      }
      this.updateRefuelVariance();
    };
    if (litInput) litInput.addEventListener('input', recalcCost);
    if (priceInput) priceInput.addEventListener('input', recalcCost);
    if (odoInput) odoInput.addEventListener('input', () => this.updateRefuelVariance());

    // Form Submissions
    const refuelForm = document.getElementById('refuelForm');
    if (refuelForm) refuelForm.addEventListener('submit', (e) => this.handleRefuelSubmit(e));

    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) serviceForm.addEventListener('submit', (e) => this.handleServiceSubmit(e));

    const odoForm = document.getElementById('odoForm');
    if (odoForm) odoForm.addEventListener('submit', (e) => this.handleOdoSubmit(e));

    const editBikeForm = document.getElementById('editBikeForm');
    if (editBikeForm) editBikeForm.addEventListener('submit', (e) => this.handleEditBikeSubmit(e));

    const newBikeForm = document.getElementById('newBikeForm');
    if (newBikeForm) newBikeForm.addEventListener('submit', (e) => this.handleNewBikeSubmit(e));

    const editDocForm = document.getElementById('editDocForm');
    if (editDocForm) editDocForm.addEventListener('submit', (e) => this.handleDocSubmit(e));
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabId}`);
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);

    if (targetTab) targetTab.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    const bike = this.getActiveBike();
    if (bike && tabId === 'mileage') {
      const stats = MileageEngine.calculateStats(bike, bike.refuels);
      MileageEngine.renderChart('mileageChart', stats.entriesWithMileage, this.state.currency, this.state.unitMileage, this.isLightMode(), this.getAccentHex());
    }
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  showToast(message) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  },

  // ================= MAIN RENDER =================
  render() {
    const firstRunContainer = document.getElementById('firstRunSetupContainer');
    const mainTabsContainer = document.getElementById('mainTabsContainer');
    const headerBikeName = document.getElementById('headerBikeName');
    const rapidSheet = document.getElementById('rapidActionSheet');

    if (!this.state.bikes || this.state.bikes.length === 0) {
      if (firstRunContainer) firstRunContainer.style.display = 'block';
      if (mainTabsContainer) mainTabsContainer.style.display = 'none';
      if (rapidSheet) rapidSheet.style.display = 'none';
      if (headerBikeName) headerBikeName.textContent = 'Setup Motorcycle';
      return;
    }

    if (firstRunContainer) firstRunContainer.style.display = 'none';
    if (mainTabsContainer) mainTabsContainer.style.display = 'block';
    if (rapidSheet) rapidSheet.style.display = 'flex';

    const bike = this.getActiveBike();
    if (!bike) return;

    if (headerBikeName) headerBikeName.textContent = bike.name;

    this.renderGarageTab(bike);
    this.renderMileageTab(bike);
    this.renderServiceTab(bike);
    this.renderPreRideTab(bike);
    this.renderVaultTab(bike);
  },

  // ================= FIRST RUN / ONBOARDING =================
  handleOnboardingSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('setupBikeName').value.trim();
    const plate = document.getElementById('setupBikePlate').value.trim().toUpperCase();
    const odo = parseFloat(document.getElementById('setupBikeOdo').value) || 0;
    const displacement = document.getElementById('setupBikeDisplacement').value.trim() || '';
    const tank = parseFloat(document.getElementById('setupBikeTank').value) || 13;

    if (!name || !plate) {
      alert('Please enter your motorcycle name and license plate.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Initialize clean service items starting at current odometer
    const cleanServiceItems = ServiceEngine.getDefaultServiceItems().map(item => {
      const interval = Number(item.intervalKm) || 4000;
      const d = new Date();
      d.setMonth(d.getMonth() + (Number(item.intervalMonths) || 6));
      return {
        ...item,
        lastServicedOdo: odo,
        lastServicedDate: todayStr,
        nextDueOdo: odo + interval,
        nextDueDate: d.toISOString().split('T')[0]
      };
    });

    const newBike = {
      id: 'bike_' + Date.now(),
      name,
      plate,
      year: new Date().getFullYear(),
      displacement,
      tankCapacity: tank,
      currentOdo: odo,
      initialOdo: odo,
      photo: 'assets/bike1.jpg',
      rsaPhone: '+9118002098004',
      specs: {
        estMileage: 35.0,
        frontTirePsi: 29,
        rearTirePsi: 33,
        chainSlack: '25-30 mm',
        oilGrade: '15W-50'
      },
      serviceItems: cleanServiceItems,
      serviceHistory: [],
      refuels: [],
      documents: []
    };

    this.state.bikes = [newBike];
    this.state.activeBikeId = newBike.id;
    this.saveState();
    SoundEffects.playSuccess();
    this.render();
    this.showToast(`Welcome! ${name} is setup and ready.`);
  },

  // ================= TAB 1: GARAGE =================
  renderGarageTab(bike) {
    const heroName = document.getElementById('garageBikeName');
    const heroPlate = document.getElementById('garageBikePlate');
    const heroImg = document.getElementById('garageBikeImg');
    const heroOdo = document.getElementById('garageOdoReading');

    if (heroName) heroName.textContent = bike.name;
    if (heroPlate) heroPlate.textContent = bike.plate || 'NO PLATE';
    if (heroImg && bike.photo) heroImg.src = bike.photo;
    if (heroOdo) heroOdo.textContent = Number(bike.currentOdo || 0).toLocaleString();

    // Specs
    const specEngine = document.getElementById('garageSpecEngine');
    const specTank = document.getElementById('garageSpecTank');
    const specTires = document.getElementById('garageSpecTires');
    const specYear = document.getElementById('garageSpecYear');

    if (specEngine) specEngine.textContent = bike.displacement || '--';
    if (specTank) specTank.textContent = bike.tankCapacity ? `${bike.tankCapacity} L` : '--';
    if (specTires) specTires.textContent = `${bike.specs?.frontTirePsi || 29} / ${bike.specs?.rearTirePsi || 33} PSI (Cold)`;
    if (specYear) specYear.textContent = bike.year || '--';

    // Mileage Stats in Garage
    const mileageStats = MileageEngine.calculateStats(bike, bike.refuels);
    const garageAvgMileage = document.getElementById('garageAvgMileage');
    const garageFuelRange = document.getElementById('garageFuelRange');
    const dashDelta = document.getElementById('dashMileageDelta');

    if (garageAvgMileage) garageAvgMileage.textContent = mileageStats.avgMileage > 0 ? mileageStats.avgMileage : '--';
    if (garageFuelRange) garageFuelRange.textContent = mileageStats.estimatedRange > 0 ? `~${mileageStats.estimatedRange}` : '--';

    // Mileage Performance Variance / Delta vs Previous Refill
    if (dashDelta) {
      const validEntries = (mileageStats.entriesWithMileage || []).filter(e => typeof e.mileage === 'number' && e.mileage > 0);
      if (validEntries.length >= 2) {
        const last = validEntries[validEntries.length - 1].mileage;
        const prev = validEntries[validEntries.length - 2].mileage;
        const diff = Number((last - prev).toFixed(1));
        if (diff >= 0) {
          dashDelta.className = 'dash-delta-tag good';
          dashDelta.textContent = `▲ +${diff} vs last fill`;
        } else {
          dashDelta.className = 'dash-delta-tag warn';
          dashDelta.textContent = `▼ ${diff} vs last fill`;
        }
      } else if (validEntries.length === 1) {
        dashDelta.className = 'dash-delta-tag good';
        dashDelta.textContent = '1st full fill logged';
      } else {
        dashDelta.className = 'dash-delta-tag';
        dashDelta.textContent = 'Calculated live';
      }
    }

    // Service Health & Alert
    const serviceEval = ServiceEngine.evaluateServiceItems(bike.currentOdo, bike.serviceItems);
    const healthVal = document.getElementById('garageHealthVal');
    const healthDot = document.getElementById('garageHealthDot');
    if (healthVal) healthVal.textContent = `${serviceEval.overallHealth}%`;
    if (healthDot) {
      healthDot.style.color = serviceEval.overallHealth >= 80 ? 'var(--status-good)' : serviceEval.overallHealth >= 50 ? 'var(--status-warn)' : 'var(--status-danger)';
    }

    // Component Health Rings (Circular Progress Bars)
    const healthRingsContainer = document.getElementById('healthRingsContainer');
    if (healthRingsContainer) {
      const circ = 2 * Math.PI * 26; // 163.36
      healthRingsContainer.innerHTML = serviceEval.items.map(item => {
        const pct = Math.max(0, Math.min(100, item.progressPercent || 0));
        const offset = (circ - (pct / 100) * circ).toFixed(1);
        const strokeColor = item.status === 'danger' ? 'var(--status-danger)' : item.status === 'warn' ? 'var(--status-warn)' : 'var(--status-good)';
        const subText = item.status === 'danger' ? 'OVERDUE' : (item.kmRemaining > 0 ? `${item.kmRemaining} km` : 'Due now');

        return `
          <div class="health-ring-card" onclick="App.openEditServiceItemModal('${item.id}')" title="${item.name}: ${pct}% remaining">
            <div class="health-ring-wrapper">
              <svg class="health-ring-svg" viewBox="0 0 64 64">
                <circle class="health-ring-track" cx="32" cy="32" r="26" />
                <circle class="health-ring-progress" cx="32" cy="32" r="26"
                  stroke="${strokeColor}"
                  stroke-dasharray="${circ.toFixed(1)}"
                  stroke-dashoffset="${offset}" />
              </svg>
              <div class="health-ring-center">
                <span class="health-ring-pct" style="color:${strokeColor};">${pct}%</span>
              </div>
            </div>
            <div class="health-ring-title">${item.name}</div>
            <div class="health-ring-sub">${subText}</div>
          </div>
        `;
      }).join('');
    }

    // Document Status & Action Required Evaluation
    const docs = VaultEngine.evaluateDocumentStatus(bike.documents || []);
    const expiredDoc = docs.find(d => d.diffDays !== null && d.diffDays < 0);
    const expiringSoonDoc = docs.find(d => d.diffDays !== null && d.diffDays >= 0 && d.diffDays <= 15);

    const alertContainer = document.getElementById('garageAlertContainer');
    if (alertContainer) {
      if (serviceEval.criticalOverdue.length > 0) {
        const item = serviceEval.criticalOverdue[0];
        alertContainer.innerHTML = `
          <div class="alert-strip danger">
            <div class="alert-strip-text">
              <strong>${item.name} Overdue:</strong> ${item.statusText}
            </div>
            <button class="alert-strip-btn" onclick="App.openLogServiceModal('${item.id}')">Log Service</button>
          </div>
        `;
      } else if (expiredDoc) {
        alertContainer.innerHTML = `
          <div class="alert-strip danger">
            <div class="alert-strip-text">
              <strong>${expiredDoc.title} Expired:</strong> Expired on ${expiredDoc.expiryDate}. Renew immediately.
            </div>
            <button class="alert-strip-btn" onclick="App.switchTab('vault')">View Vault</button>
          </div>
        `;
      } else if (serviceEval.warningSoon.length > 0) {
        const item = serviceEval.warningSoon[0];
        alertContainer.innerHTML = `
          <div class="alert-strip warning">
            <div class="alert-strip-text">
              <strong>${item.name}:</strong> ${item.statusText}
            </div>
            <button class="alert-strip-btn" onclick="App.openLogServiceModal('${item.id}')">Log</button>
          </div>
        `;
      } else if (expiringSoonDoc) {
        alertContainer.innerHTML = `
          <div class="alert-strip warning">
            <div class="alert-strip-text">
              <strong>${expiringSoonDoc.title} Expiring:</strong> Due in ${expiringSoonDoc.diffDays} days (${expiringSoonDoc.expiryDate}).
            </div>
            <button class="alert-strip-btn" onclick="App.switchTab('vault')">View Docs</button>
          </div>
        `;
      } else {
        alertContainer.innerHTML = `
          <div class="alert-strip info">
            <div class="alert-strip-text">All systems optimal. Next scheduled service due in ${serviceEval.nextDueItem?.kmRemaining || 500} km.</div>
          </div>
        `;
      }
    }

    // Care Preview (Top 3 items)
    const carePreviewList = document.getElementById('garageCarePreview');
    if (carePreviewList) {
      const topItems = serviceEval.items.slice(0, 3);
      carePreviewList.innerHTML = topItems.map(item => `
        <div class="service-component-card">
          <div class="service-component-header">
            <div>
              <span class="service-component-title">${item.name}</span>
              <div class="service-stats-line">
                <span>Ran: <strong>${item.kmRan} km</strong></span>
                <span>•</span>
                <span>Due in: <strong>${item.kmRemaining} km</strong></span>
              </div>
            </div>
            <span class="service-status-pill ${item.status}">${item.statusText}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${item.status}" style="width: ${item.progressPercent}%"></div>
          </div>
          <div class="service-component-footer">
            <span>Next due: ${item.nextDueOdo} km</span>
            <button class="btn-mini-action" onclick="App.openEditServiceItemModal('${item.id}')">✏️ Set Due</button>
          </div>
        </div>
      `).join('');
    }

    // Ownership Cost & Expense Summary (TCO)
    const fuelSpend = (bike.refuels || []).reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
    const serviceSpend = (bike.serviceHistory || []).reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
    const totalLifetimeCost = fuelSpend + serviceSpend;

    // Tracked distance
    let trackedDist = mileageStats.totalValidDistance > 0 
      ? mileageStats.totalValidDistance 
      : Math.max(0, (bike.currentOdo || 0) - (bike.initialOdo || 0));

    const overallCostPerKm = trackedDist > 0 
      ? `${this.state.currency}${(totalLifetimeCost / trackedDist).toFixed(2)}/km` 
      : '--';

    // Current Month Spending Breakdown
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const monthFuel = (bike.refuels || [])
      .filter(r => r.date && r.date.startsWith(currentYearMonth))
      .reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
    const monthService = (bike.serviceHistory || [])
      .filter(s => s.date && s.date.startsWith(currentYearMonth))
      .reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
    const monthTotal = monthFuel + monthService;

    const tcoSpendEl = document.getElementById('garageTcoTotalSpend');
    const tcoCostKmEl = document.getElementById('garageTcoCostPerKm');
    const tcoMonthSpendEl = document.getElementById('garageTcoMonthSpend');
    const tcoBreakdownEl = document.getElementById('garageTcoBreakdown');

    if (tcoSpendEl) tcoSpendEl.textContent = `${this.state.currency}${totalLifetimeCost.toLocaleString()}`;
    if (tcoCostKmEl) tcoCostKmEl.textContent = overallCostPerKm;
    if (tcoMonthSpendEl) tcoMonthSpendEl.textContent = `${this.state.currency}${monthTotal.toLocaleString()}`;
    if (tcoBreakdownEl) tcoBreakdownEl.textContent = `Fuel: ${this.state.currency}${monthFuel.toLocaleString()} • Service: ${this.state.currency}${monthService.toLocaleString()}`;
  },

  // ================= TAB 2: MILEAGE & FUEL =================
  renderMileageTab(bike) {
    const stats = MileageEngine.calculateStats(bike, bike.refuels);

    const avgEl = document.getElementById('mileageHeroAvg');
    const lastEl = document.getElementById('mileageHeroLast');
    const costEl = document.getElementById('mileageHeroCost');
    const totalSpendEl = document.getElementById('mileageHeroTotalSpend');
    const totalLitresEl = document.getElementById('mileageHeroLitres');

    if (avgEl) avgEl.textContent = stats.avgMileage > 0 ? stats.avgMileage : '--';
    if (lastEl) lastEl.textContent = stats.lastMileage > 0 ? `${stats.lastMileage} km/L` : '--';
    if (costEl) costEl.textContent = stats.costPerKm > 0 ? `${this.state.currency}${stats.costPerKm}` : '--';
    if (totalSpendEl) totalSpendEl.textContent = stats.totalSpend > 0 ? `${this.state.currency}${stats.totalSpend.toLocaleString()}` : '0';
    if (totalLitresEl) totalLitresEl.textContent = stats.totalLitres > 0 ? `${stats.totalLitres} L` : '0 L';

    // Best, Worst & Estimated Usable Range
    const bestEl = document.getElementById('mileageBestVal');
    const worstEl = document.getElementById('mileageWorstVal');
    const rangeEl = document.getElementById('mileageRangeVal');

    if (bestEl) bestEl.textContent = stats.bestMileage ? `${stats.bestMileage} km/L` : '--';
    if (worstEl) worstEl.textContent = stats.worstMileage ? `${stats.worstMileage} km/L` : '--';
    if (rangeEl) rangeEl.textContent = stats.estimatedRange ? `~${stats.estimatedRange} km` : '--';

    // Mileage Drop Signal Alert
    const dropAlertEl = document.getElementById('mileageDiagnosticAlert');
    if (dropAlertEl) {
      if (stats.mileageDropAlert) {
        dropAlertEl.innerHTML = `
          <div class="alert-strip warning" style="margin-bottom:12px;">
            <div class="alert-strip-text">
              <strong>⚠️ Diagnostic Signal:</strong> Fuel economy dropped by ${stats.mileageDropAlert.dropPercent}% (from ${stats.mileageDropAlert.previousMileage} to ${stats.mileageDropAlert.recentMileage} km/L). Recommended checks: cold tyre pressure, chain slack/lube, and air filter element.
            </div>
          </div>
        `;
      } else {
        dropAlertEl.innerHTML = '';
      }
    }

    // Render Canvas chart
    MileageEngine.renderChart('mileageChart', stats.entriesWithMileage, this.state.currency, this.state.unitMileage, this.isLightMode(), this.getAccentHex());

    // Render Logbook
    const historyList = document.getElementById('refuelHistoryList');
    if (historyList) {
      if (!stats.entriesWithMileage || stats.entriesWithMileage.length === 0) {
        historyList.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 13px;">No fuel logs yet. Tap "+ Add Refuel" to record your first fill!</div>`;
      } else {
        const reversed = [...stats.entriesWithMileage].reverse();
        historyList.innerHTML = reversed.map(entry => `
          <div class="log-item-card">
            <div class="log-item-main">
              <div class="log-item-title">
                <span>${entry.station || 'Fuel Station'}</span>
                ${entry.mileage ? `<span class="log-item-badge">${entry.mileage} km/L</span>` : ''}
              </div>
              <div class="log-item-meta">
                <span>📅 ${entry.date}</span>
                <span>•</span>
                <span>${entry.odometer.toLocaleString()} km</span>
                <span>•</span>
                <span>${entry.litres} L</span>
                ${entry.tripDistance > 0 ? `<span>• +${entry.tripDistance} km</span>` : ''}
              </div>
            </div>
            <div class="log-item-right">
              <div class="log-item-cost">${this.state.currency}${entry.cost}</div>
              <div class="item-action-btns">
                <button class="btn-mini-action" onclick="App.openEditRefuelModal('${entry.id}')">✏️ Edit</button>
                <button class="btn-mini-action danger" onclick="App.deleteRefuel('${entry.id}')">🗑️</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  },

  // ================= TAB 3: SERVICE (MANUAL TRACKING & DUE DATES) =================
  renderServiceTab(bike) {
    const serviceEval = ServiceEngine.evaluateServiceItems(bike.currentOdo, bike.serviceItems);

    const listEl = document.getElementById('fullServiceItemsList');
    if (listEl) {
      listEl.innerHTML = serviceEval.items.map(item => `
        <div class="service-component-card">
          <div class="service-component-header">
            <div>
              <span class="service-component-title">${item.name}</span>
              <div class="service-stats-line">
                <span>Ran: <strong>${item.kmRan} km</strong></span>
                <span>•</span>
                <span>Due in: <strong>${item.kmRemaining} km</strong></span>
                ${item.nextDueDate ? `<span>• Due: <strong>${item.nextDueDate}</strong> (${item.daysRemaining !== null ? item.daysRemaining + 'd' : ''})</span>` : ''}
              </div>
            </div>
            <span class="service-status-pill ${item.status}">${item.statusText}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${item.status}" style="width: ${item.progressPercent}%"></div>
          </div>
          <div class="service-component-footer">
            <span>Last Changed: ${item.lastServicedOdo || 0} km ${item.lastServicedDate ? '(' + item.lastServicedDate + ')' : ''}</span>
            <div style="display:flex; gap:6px;">
              <button class="btn-mini-action" onclick="App.openEditServiceItemModal('${item.id}')">✏️ Set Due / Edit</button>
              <button class="btn-mini-action" onclick="App.quickResetServiceItem('${item.id}')">🔄 Changed Today</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    const historyEl = document.getElementById('serviceHistoryList');
    if (historyEl) {
      if (!bike.serviceHistory || bike.serviceHistory.length === 0) {
        historyEl.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 13px;">No service records yet. Tap "+ Log Service Record" after servicing your bike!</div>`;
      } else {
        const sorted = [...bike.serviceHistory].sort((a, b) => b.odometer - a.odometer);
        historyEl.innerHTML = sorted.map(entry => {
          const textToScan = `${entry.serviceType || ''} ${(entry.servicedItemIds || []).join(' ')} ${entry.notes || ''}`.toLowerCase();
          let icon = '🔧';
          if (textToScan.includes('oil') || textToScan.includes('fluid') || textToScan.includes('coolant')) {
            icon = '💧';
          } else if (textToScan.includes('chain') || textToScan.includes('sprocket') || textToScan.includes('lube')) {
            icon = '⚙️';
          } else if (textToScan.includes('brake') || textToScan.includes('pad') || textToScan.includes('disc')) {
            icon = '🛡️';
          } else if (textToScan.includes('plug') || textToScan.includes('spark') || textToScan.includes('battery') || textToScan.includes('fuse')) {
            icon = '⚡';
          } else if (textToScan.includes('tire') || textToScan.includes('tyre') || textToScan.includes('wheel')) {
            icon = '🛞';
          }

          const parts = [];
          if (entry.servicedItemIds && entry.servicedItemIds.length > 0) {
            entry.servicedItemIds.forEach(id => {
              parts.push(this.getServiceNameById(id));
            });
          }

          return `
            <div class="timeline-item">
              <div class="timeline-node">${icon}</div>
              <div class="timeline-card">
                <div class="timeline-header">
                  <span class="timeline-title">${entry.serviceType}</span>
                  <span class="timeline-cost">${this.state.currency}${Number(entry.cost || 0).toLocaleString()}</span>
                </div>
                <div class="timeline-meta-row">
                  <span>📅 ${entry.date}</span>
                  <span>•</span>
                  <span>${entry.odometer.toLocaleString()} ${this.state.unitDist}</span>
                  <span>•</span>
                  <span>${entry.workshop || 'Workshop'}</span>
                </div>
                ${parts.length > 0 ? `
                  <div class="parts-tag-list">
                    ${parts.map(p => `<span class="part-tag">✓ ${p}</span>`).join('')}
                  </div>
                ` : ''}
                ${entry.nextDueOdo || entry.nextDueDate ? `
                  <div style="font-size:10px; color:var(--text-muted); margin-top:5px;">
                    Next due: ${entry.nextDueOdo ? entry.nextDueOdo + ' ' + this.state.unitDist : ''} ${entry.nextDueDate ? 'on ' + entry.nextDueDate : ''}
                  </div>
                ` : ''}
                ${entry.notes ? `<div style="font-size:11px; color:var(--text-dim); margin-top:4px;">${entry.notes}</div>` : ''}
                <div class="item-action-btns" style="margin-top:8px; justify-content:flex-end;">
                  <button class="btn-mini-action" onclick="App.openEditServiceModal('${entry.id}')">✏️ Edit</button>
                  <button class="btn-mini-action danger" onclick="App.deleteService('${entry.id}')">🗑️</button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  },

  getServiceNameById(id) {
    const bike = this.getActiveBike();
    const item = (bike?.serviceItems || []).find(i => i.id === id);
    return item ? item.name : id;
  },

  // Manual Service Item Setter (Engine Oil, Brakes, Air Filter, etc.)
  openEditServiceItemModal(itemId) {
    const bike = this.getActiveBike();
    const item = (bike.serviceItems || []).find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('editServiceItemId').value = itemId;
    document.getElementById('editItemModalTitle').textContent = `Set Due: ${item.name}`;
    document.getElementById('editServiceItemName').value = item.name || '';
    document.getElementById('editServiceItemLastOdo').value = item.lastServicedOdo || 0;
    document.getElementById('editServiceItemLastDate').value = item.lastServicedDate || '';
    document.getElementById('editServiceItemNextOdo').value = item.nextDueOdo || (Number(item.lastServicedOdo || 0) + (Number(item.intervalKm) || 4000));
    document.getElementById('editServiceItemNextDate').value = item.nextDueDate || '';
    document.getElementById('editServiceItemNotes').value = item.notes || '';

    this.openModal('editServiceItemModal');
  },

  handleSaveServiceItem(e) {
    e.preventDefault();
    const itemId = document.getElementById('editServiceItemId').value;
    const name = document.getElementById('editServiceItemName').value.trim();
    const lastOdo = parseFloat(document.getElementById('editServiceItemLastOdo').value) || 0;
    const lastDate = document.getElementById('editServiceItemLastDate').value;
    const nextOdo = parseFloat(document.getElementById('editServiceItemNextOdo').value) || 0;
    const nextDate = document.getElementById('editServiceItemNextDate').value;
    const notes = document.getElementById('editServiceItemNotes').value.trim();

    const valRes = ServiceEngine.validateServiceItem(lastOdo, nextOdo, lastDate, nextDate);
    if (!valRes.valid) {
      alert(`Validation Error: ${valRes.error}`);
      return;
    }

    const bike = this.getActiveBike();
    if (!bike.serviceItems) bike.serviceItems = [];

    const idx = bike.serviceItems.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      bike.serviceItems[idx] = {
        ...bike.serviceItems[idx],
        name,
        lastServicedOdo: lastOdo,
        lastServicedDate: lastDate,
        nextDueOdo: nextOdo,
        nextDueDate: nextDate,
        notes
      };
    } else {
      // New custom item
      bike.serviceItems.push({
        id: itemId || 'custom_' + Date.now(),
        name,
        lastServicedOdo: lastOdo,
        lastServicedDate: lastDate,
        nextDueOdo: nextOdo,
        nextDueDate: nextDate,
        notes,
        intervalKm: Math.max(500, nextOdo - lastOdo)
      });
    }

    this.saveState();
    SoundEffects.playSuccess();
    this.closeModal('editServiceItemModal');
    this.render();
    this.showToast(`${name} due details updated`);
  },

  openAddCustomServiceItemModal() {
    const bike = this.getActiveBike();
    const currentOdo = bike?.currentOdo || 0;
    const todayStr = new Date().toISOString().split('T')[0];

    document.getElementById('editServiceItemId').value = 'custom_' + Date.now();
    document.getElementById('editItemModalTitle').textContent = 'Add Custom Maintenance Item';
    document.getElementById('editServiceItemName').value = '';
    document.getElementById('editServiceItemLastOdo').value = currentOdo;
    document.getElementById('editServiceItemLastDate').value = todayStr;
    document.getElementById('editServiceItemNextOdo').value = currentOdo + 5000;
    document.getElementById('editServiceItemNextDate').value = '';
    document.getElementById('editServiceItemNotes').value = '';

    this.openModal('editServiceItemModal');
  },

  deleteCustomServiceItem() {
    const itemId = document.getElementById('editServiceItemId').value;
    if (!confirm('Remove this maintenance item from tracking?')) return;
    const bike = this.getActiveBike();
    bike.serviceItems = (bike.serviceItems || []).filter(i => i.id !== itemId);
    this.saveState();
    this.closeModal('editServiceItemModal');
    this.render();
    this.showToast('Maintenance item removed');
  },

  quickResetServiceItem(itemId) {
    const bike = this.getActiveBike();
    const item = (bike.serviceItems || []).find(i => i.id === itemId);
    const itemName = item ? item.name : 'Maintenance Component';
    const todayStr = new Date().toISOString().split('T')[0];

    bike.serviceItems = ServiceEngine.quickResetItem(bike.serviceItems, itemId, bike.currentOdo);

    // Retain service history event
    if (!bike.serviceHistory) bike.serviceHistory = [];
    bike.serviceHistory.unshift({
      id: 'svc_' + Date.now(),
      date: todayStr,
      odometer: bike.currentOdo,
      serviceType: 'Routine Maintenance',
      workshop: 'Self / DIY',
      cost: 0,
      notes: `Quick Reset: ${itemName} marked serviced/replaced today.`,
      servicedItemIds: [itemId]
    });

    this.saveState();
    SoundEffects.playSuccess();
    this.render();
    this.showToast(`${itemName} marked changed today! History recorded.`);
  },

  // ================= TAB 4: CHECKLIST =================
  renderPreRideTab(bike) {
    const listEl = document.getElementById('tclocsChecklist');
    const checklist = bike.preRideChecklist || PreRideEngine.getDefaultChecklist(bike.specs);
    const allChecked = PreRideEngine.isAllClear(checklist);

    const badgeEl = document.getElementById('tclocsStatusBadge');
    if (badgeEl) {
      badgeEl.textContent = allChecked ? 'ALL CLEAR' : 'PENDING';
      badgeEl.className = 'doc-badge ' + (allChecked ? 'active' : 'neutral');
    }

    const inspectionTextEl = document.getElementById('tclocsLastInspectionText');
    if (inspectionTextEl) {
      if (bike.lastInspectionDate) {
        const d = new Date(bike.lastInspectionDate);
        inspectionTextEl.textContent = `Last inspected: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        inspectionTextEl.textContent = 'Last inspected: Not completed today';
      }
    }

    if (listEl) {
      listEl.innerHTML = checklist.map(item => `
        <div class="checklist-item ${item.checked ? 'checked' : ''}" onclick="App.toggleTclocsItem('${item.id}')">
          <div class="check-circle">
            ${item.checked ? '✓' : ''}
          </div>
          <div class="checklist-content">
            <div class="checklist-title">${item.title}</div>
            <div class="checklist-desc">${item.desc}</div>
          </div>
        </div>
      `).join('');
    }
  },

  toggleTclocsItem(itemId) {
    const bike = this.getActiveBike();
    bike.preRideChecklist = PreRideEngine.toggleCheckItem(bike.preRideChecklist || PreRideEngine.getDefaultChecklist(bike.specs), itemId);
    bike.lastInspectionDate = new Date().toISOString();
    this.saveState();
    SoundEffects.playClick();
    this.renderPreRideTab(bike);
    if (PreRideEngine.isAllClear(bike.preRideChecklist)) {
      SoundEffects.playSuccess();
      this.showToast('Inspection Complete! Ready to Ride');
    }
  },

  markAllTclocsClear() {
    const bike = this.getActiveBike();
    bike.preRideChecklist = PreRideEngine.markAll(bike.preRideChecklist || PreRideEngine.getDefaultChecklist(bike.specs), true);
    bike.lastInspectionDate = new Date().toISOString();
    this.saveState();
    SoundEffects.playSuccess();
    this.renderPreRideTab(bike);
    this.showToast('All items marked clear');
  },

  // ================= TAB 5: DOCUMENTS & VAULT =================
  renderVaultTab(bike) {
    const docs = VaultEngine.evaluateDocumentStatus(bike.documents || []);
    const docsList = document.getElementById('documentLockerList');

    if (docsList) {
      if (docs.length === 0) {
        docsList.innerHTML = `
          <div style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 13px;">
            No documents uploaded yet.<br>
            <button class="btn-secondary" style="margin-top:10px; font-size:12px;" onclick="App.openAddDocModal()">
              + Upload RC / Insurance / License
            </button>
          </div>
        `;
      } else {
        docsList.innerHTML = docs.map(doc => `
          <div class="doc-card">
            <div class="doc-card-top">
              <div class="doc-info">
                <div class="doc-title">${doc.title}</div>
                <div class="doc-number">${doc.docNumber || 'No Number Specified'}</div>
                <div class="doc-expiry-row">
                  <span>Valid: ${doc.expiryDate || 'No Expiry'}</span>
                  <span>•</span>
                  <span>${doc.issuer || 'Issuer'}</span>
                </div>
              </div>
              <span class="doc-badge ${doc.badgeClass}">${doc.badgeText}</span>
            </div>

            <div class="doc-attachment-row">
              ${doc.fileData ? `
                <img src="${doc.fileData}" class="doc-preview-thumb" onclick="App.openViewDocModal('${doc.id}')" alt="Thumbnail">
                <div class="doc-file-info" onclick="App.openViewDocModal('${doc.id}')" style="cursor:pointer;">
                  <strong style="color:#fff;">📄 ${doc.fileName || 'Attached Document'}</strong>
                  <div style="font-size:10px; color:var(--status-good);">Tap to view full screen</div>
                </div>
              ` : `
                <div class="doc-file-info">
                  <span style="color:var(--text-dim);">No file attached yet</span>
                </div>
              `}

              <div class="doc-actions-row">
                <button class="btn-doc-action primary" onclick="App.triggerDocFileUpload('${doc.id}')" title="Upload Photo/PDF">
                  📷 ${doc.fileData ? 'Replace' : 'Upload'}
                </button>
                <button class="btn-doc-action" onclick="App.openEditDocModal('${doc.id}')" title="Edit details">
                  ✏️ Edit
                </button>
                <button class="btn-doc-action" style="color:var(--status-danger);" onclick="App.deleteDoc('${doc.id}')" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    const rsaBtn = document.getElementById('btnRsaDirectCall');
    if (rsaBtn) {
      rsaBtn.href = `tel:${bike.rsaPhone || '+9118002098004'}`;
    }
  },

  // Document File Upload & Viewing
  triggerDocFileUpload(docId) {
    this.pendingUploadDocId = docId;
    const input = document.getElementById('docFileInput');
    if (input) {
      input.value = '';
      input.click();
    }
  },

  async handleDocFileSelected(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const docId = this.pendingUploadDocId;
    if (!docId) return;

    try {
      this.showToast('Compressing & saving document...');
      const res = await VaultEngine.compressFile(file);
      const bike = this.getActiveBike();
      const doc = (bike.documents || []).find(d => d.id === docId);
      if (doc) {
        doc.fileData = res.dataUrl;
        doc.fileName = res.name;
        doc.fileType = res.type;
        this.saveState();
        SoundEffects.playSuccess();
        this.renderVaultTab(bike);
        this.showToast('Document file attached!');
      }
    } catch (e) {
      alert('Upload error: ' + e.message);
    }
  },

  openViewDocModal(docId) {
    const bike = this.getActiveBike();
    const doc = (bike.documents || []).find(d => d.id === docId);
    if (!doc || !doc.fileData) return;

    this.currentViewingDocId = docId;
    const titleEl = document.getElementById('viewDocTitle');
    const metaEl = document.getElementById('viewDocMeta');
    const imgEl = document.getElementById('viewDocImg');

    if (titleEl) titleEl.textContent = doc.title;
    if (metaEl) metaEl.textContent = `${doc.docNumber || ''} • Valid till ${doc.expiryDate || 'N/A'}`;
    if (imgEl) imgEl.src = doc.fileData;

    const modal = document.getElementById('viewDocModal');
    if (modal) modal.classList.add('active');
  },

  removeDocFile(docId) {
    if (!confirm('Remove attached file from this document?')) return;
    const bike = this.getActiveBike();
    const doc = (bike.documents || []).find(d => d.id === docId);
    if (doc) {
      doc.fileData = null;
      doc.fileName = null;
      doc.fileType = null;
      this.saveState();
      this.closeModal('viewDocModal');
      this.renderVaultTab(bike);
      this.showToast('Attached file removed');
    }
  },

  openAddDocModal() {
    this.closeModal('speedDialModal');
    document.getElementById('editDocId').value = '';
    document.getElementById('editDocModalTitle').textContent = 'Add Document';
    document.getElementById('editDocTitle').value = '';
    document.getElementById('editDocNumber').value = '';
    document.getElementById('editDocIssuer').value = '';
    document.getElementById('editDocExpiry').value = '';
    this.openModal('editDocModal');
  },

  openEditDocModal(docId) {
    const bike = this.getActiveBike();
    const doc = (bike.documents || []).find(d => d.id === docId);
    if (!doc) return;

    document.getElementById('editDocId').value = docId;
    document.getElementById('editDocModalTitle').textContent = 'Edit Document';
    document.getElementById('editDocTitle').value = doc.title || '';
    document.getElementById('editDocNumber').value = doc.docNumber || '';
    document.getElementById('editDocIssuer').value = doc.issuer || '';
    document.getElementById('editDocExpiry').value = doc.expiryDate || '';
    this.openModal('editDocModal');
  },

  handleDocSubmit(e) {
    e.preventDefault();
    const docId = document.getElementById('editDocId').value;
    const title = document.getElementById('editDocTitle').value.trim();
    const docNumber = document.getElementById('editDocNumber').value.trim();
    const issuer = document.getElementById('editDocIssuer').value.trim();
    const expiryDate = document.getElementById('editDocExpiry').value;

    const bike = this.getActiveBike();
    if (!bike.documents) bike.documents = [];

    if (docId) {
      const doc = bike.documents.find(d => d.id === docId);
      if (doc) {
        doc.title = title;
        doc.docNumber = docNumber;
        doc.issuer = issuer;
        doc.expiryDate = expiryDate;
      }
    } else {
      bike.documents.push({
        id: 'doc_' + Date.now(),
        title,
        docNumber,
        issuer,
        expiryDate,
        fileData: null,
        fileName: null
      });
    }

    this.saveState();
    SoundEffects.playSuccess();
    this.closeModal('editDocModal');
    this.renderVaultTab(bike);
    this.showToast('Document saved');
  },

  deleteDoc(docId) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    const bike = this.getActiveBike();
    bike.documents = (bike.documents || []).filter(d => d.id !== docId);
    this.saveState();
    this.renderVaultTab(bike);
    this.showToast('Document deleted');
  },

  // ================= REFUEL (LOG, EDIT, DELETE) =================
  openLogRefuelModal() {
    this.closeModal('speedDialModal');
    const bike = this.getActiveBike();
    document.getElementById('editRefuelId').value = '';
    document.getElementById('refuelModalTitle').textContent = 'Log Fuel Refill';
    document.getElementById('refuelDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('refuelOdometer').value = bike?.currentOdo || '';
    document.getElementById('refuelLitres').value = '';
    document.getElementById('refuelPrice').value = '';
    document.getElementById('refuelCost').value = '';
    document.getElementById('refuelStation').value = '';
    document.getElementById('refuelFullTank').checked = true;
    this.updateRefuelVariance();
    this.openModal('refuelModal');
  },

  openEditRefuelModal(refuelId) {
    const bike = this.getActiveBike();
    const entry = (bike.refuels || []).find(r => r.id === refuelId);
    if (!entry) return;

    document.getElementById('editRefuelId').value = refuelId;
    document.getElementById('refuelModalTitle').textContent = 'Edit Fuel Record';
    document.getElementById('refuelDate').value = entry.date;
    document.getElementById('refuelOdometer').value = entry.odometer;
    document.getElementById('refuelLitres').value = entry.litres;
    document.getElementById('refuelPrice').value = entry.pricePerLitre || '';
    document.getElementById('refuelCost').value = entry.cost;
    document.getElementById('refuelStation').value = entry.station || '';
    document.getElementById('refuelFullTank').checked = entry.isFullTank !== false;
    this.updateRefuelVariance();
    this.openModal('refuelModal');
  },

  quickAddLitres(n) {
    SoundEffects.playClick();
    const litInput = document.getElementById('refuelLitres');
    if (!litInput) return;
    const current = parseFloat(litInput.value) || 0;
    litInput.value = (current + n).toFixed(1);
    
    const priceInput = document.getElementById('refuelPrice');
    const costInput = document.getElementById('refuelCost');
    const prc = parseFloat(priceInput?.value) || 0;
    if (prc > 0 && costInput) {
      costInput.value = (parseFloat(litInput.value) * prc).toFixed(2);
    }
    this.updateRefuelVariance();
  },

  quickSetFullTank() {
    SoundEffects.playClick();
    const bike = this.getActiveBike();
    const litInput = document.getElementById('refuelLitres');
    const fullCheck = document.getElementById('refuelFullTank');
    if (fullCheck) fullCheck.checked = true;
    if (litInput && bike?.tankCapacity) {
      litInput.value = parseFloat(bike.tankCapacity).toFixed(1);
      const priceInput = document.getElementById('refuelPrice');
      const costInput = document.getElementById('refuelCost');
      const prc = parseFloat(priceInput?.value) || 0;
      if (prc > 0 && costInput) {
        costInput.value = (parseFloat(litInput.value) * prc).toFixed(2);
      }
    }
    this.updateRefuelVariance();
  },

  updateRefuelVariance() {
    const odoInput = document.getElementById('refuelOdometer');
    const litInput = document.getElementById('refuelLitres');
    const varianceBox = document.getElementById('refuelVarianceBox');
    if (!odoInput || !litInput || !varianceBox) return;

    const curOdo = parseFloat(odoInput.value) || 0;
    const litres = parseFloat(litInput.value) || 0;
    const bike = this.getActiveBike();
    if (!bike || curOdo <= 0 || litres <= 0) {
      varianceBox.classList.remove('active');
      return;
    }

    const previousRefuels = [...(bike.refuels || [])]
      .filter(r => r.odometer < curOdo && r.isFullTank)
      .sort((a, b) => b.odometer - a.odometer);

    if (previousRefuels.length === 0) {
      varianceBox.innerHTML = `
        <div class="variance-row">
          <span style="color:var(--text-dim); font-size:11px;">Initial Baseline Refill:</span>
          <span class="variance-tag better">First Full Fill</span>
        </div>
      `;
      varianceBox.classList.add('active');
      return;
    }

    const lastRefuel = previousRefuels[0];
    const tripDist = curOdo - lastRefuel.odometer;
    if (tripDist <= 0) {
      varianceBox.classList.remove('active');
      return;
    }

    const currentMileage = Number((tripDist / litres).toFixed(1));
    const stats = MileageEngine.calculateStats(bike, bike.refuels);
    const avgMileage = stats.avgMileage;

    let varianceHtml = `
      <div class="variance-row">
        <span>Trip Since Last Fill:</span>
        <strong>${tripDist.toLocaleString()} ${this.state.unitDist}</strong>
      </div>
      <div class="variance-row">
        <span>Calculated Economy:</span>
        <strong style="color:var(--text-main); font-family:var(--font-mono); font-size:13px;">${currentMileage} ${this.state.unitMileage}</strong>
      </div>
    `;

    if (avgMileage && avgMileage > 0) {
      const diff = Number((currentMileage - avgMileage).toFixed(1));
      const pct = Math.round(((currentMileage - avgMileage) / avgMileage) * 100);
      const isBetter = diff >= 0;
      varianceHtml += `
        <div class="variance-row" style="margin-top:4px;">
          <span>Variance vs Avg (${avgMileage}):</span>
          <span class="variance-tag ${isBetter ? 'better' : 'worse'}">
            ${isBetter ? '▲ +' : '▼ '}${pct}% (${diff >= 0 ? '+' : ''}${diff} ${this.state.unitMileage})
          </span>
        </div>
      `;
    }

    varianceBox.innerHTML = varianceHtml;
    varianceBox.classList.add('active');
  },

  handleRefuelSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editRefuelId').value;
    const date = document.getElementById('refuelDate').value;
    const odo = parseFloat(document.getElementById('refuelOdometer').value);
    const litres = parseFloat(document.getElementById('refuelLitres').value);
    const price = parseFloat(document.getElementById('refuelPrice').value) || 0;
    const cost = parseFloat(document.getElementById('refuelCost').value);
    const station = document.getElementById('refuelStation').value.trim() || 'Fuel Station';
    const isFullTank = document.getElementById('refuelFullTank').checked;

    if (isNaN(odo) || odo < 0 || isNaN(litres) || litres <= 0 || isNaN(cost) || cost <= 0) {
      alert('Please fill valid positive values for odometer, litres, and total cost.');
      return;
    }

    const bike = this.getActiveBike();
    if (!editId && bike && odo < bike.currentOdo) {
      const confirmPastRefuel = confirm(
        `Odometer Decrement Notice:\n\nEntered refuel odometer (${odo.toLocaleString()} km) is less than motorcycle's current odometer (${bike.currentOdo.toLocaleString()} km).\n\nIf you are logging an older past refuel, tap OK to save. Tap Cancel to correct.`
      );
      if (!confirmPastRefuel) return;
    }

    if (!bike.refuels) bike.refuels = [];

    if (editId) {
      const idx = bike.refuels.findIndex(r => r.id === editId);
      if (idx !== -1) {
        bike.refuels[idx] = {
          ...bike.refuels[idx],
          date,
          odometer: odo,
          litres,
          pricePerLitre: price,
          cost,
          station,
          isFullTank
        };
      }
    } else {
      bike.refuels.push({
        id: 'ref_' + Date.now(),
        date,
        odometer: odo,
        litres,
        pricePerLitre: price,
        cost,
        station,
        isFullTank
      });
    }

    if (odo > bike.currentOdo) {
      bike.currentOdo = odo;
    }

    this.saveState();
    SoundEffects.playSuccess();
    this.closeModal('refuelModal');
    this.render();
    this.showToast(editId ? 'Refuel updated' : 'Refuel logged');
  },

  deleteRefuel(refuelId) {
    if (!confirm('Delete this fuel record?')) return;
    const bike = this.getActiveBike();
    bike.refuels = (bike.refuels || []).filter(r => r.id !== refuelId);
    this.saveState();
    this.render();
    this.showToast('Refuel deleted');
  },

  // ================= SERVICE (LOG, EDIT, DELETE) =================
  openLogServiceModal(defaultItemId) {
    this.closeModal('speedDialModal');
    const bike = this.getActiveBike();
    document.getElementById('editServiceId').value = '';
    document.getElementById('serviceModalTitle').textContent = 'Log Service Record';
    document.getElementById('serviceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('serviceOdometer').value = bike?.currentOdo || '';
    document.getElementById('serviceTypeSelect').value = 'Oil & Filter Change';
    document.getElementById('serviceWorkshop').value = '';
    document.getElementById('serviceCost').value = '';
    document.getElementById('serviceNotes').value = '';
    document.getElementById('serviceNextDueOdo').value = (bike?.currentOdo || 0) + 4000;

    const nextD = new Date();
    nextD.setMonth(nextD.getMonth() + 6);
    document.getElementById('serviceNextDueDate').value = nextD.toISOString().split('T')[0];

    const partsGrid = document.getElementById('servicePartsGrid');
    if (partsGrid) {
      const items = bike.serviceItems || ServiceEngine.getDefaultServiceItems();
      partsGrid.innerHTML = items.map(item => `
        <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:#fff; cursor:pointer;">
          <input type="checkbox" name="servicePart" value="${item.id}" ${item.id === defaultItemId ? 'checked' : ''} style="accent-color:var(--accent-primary);">
          <span>${item.name}</span>
        </label>
      `).join('');
    }
    this.openModal('serviceModal');
  },

  openEditServiceModal(serviceId) {
    const bike = this.getActiveBike();
    const entry = (bike.serviceHistory || []).find(s => s.id === serviceId);
    if (!entry) return;

    document.getElementById('editServiceId').value = serviceId;
    document.getElementById('serviceModalTitle').textContent = 'Edit Service Record';
    document.getElementById('serviceDate').value = entry.date;
    document.getElementById('serviceOdometer').value = entry.odometer;
    document.getElementById('serviceTypeSelect').value = entry.serviceType || '';
    document.getElementById('serviceWorkshop').value = entry.workshop || '';
    document.getElementById('serviceCost').value = entry.cost || 0;
    document.getElementById('serviceNotes').value = entry.notes || '';
    document.getElementById('serviceNextDueOdo').value = entry.nextDueOdo || '';
    document.getElementById('serviceNextDueDate').value = entry.nextDueDate || '';

    const partsGrid = document.getElementById('servicePartsGrid');
    if (partsGrid) {
      const items = bike.serviceItems || ServiceEngine.getDefaultServiceItems();
      const servicedIds = entry.servicedItemIds || [];
      partsGrid.innerHTML = items.map(item => `
        <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:#fff; cursor:pointer;">
          <input type="checkbox" name="servicePart" value="${item.id}" ${servicedIds.includes(item.id) ? 'checked' : ''} style="accent-color:var(--accent-primary);">
          <span>${item.name}</span>
        </label>
      `).join('');
    }
    this.openModal('serviceModal');
  },

  handleServiceSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editServiceId').value;
    const date = document.getElementById('serviceDate').value;
    const odo = parseFloat(document.getElementById('serviceOdometer').value);
    const serviceType = document.getElementById('serviceTypeSelect').value.trim() || 'Service';
    const workshop = document.getElementById('serviceWorkshop').value.trim() || 'Workshop';
    const cost = parseFloat(document.getElementById('serviceCost').value) || 0;
    const notes = document.getElementById('serviceNotes').value.trim();
    const nextDueOdo = parseFloat(document.getElementById('serviceNextDueOdo').value) || null;
    const nextDueDate = document.getElementById('serviceNextDueDate').value || null;

    if (isNaN(odo) || odo < 0) {
      alert('Please enter a valid odometer reading.');
      return;
    }

    if (nextDueOdo && nextDueOdo <= odo) {
      alert(`Validation Error: Next due odometer (${nextDueOdo.toLocaleString()} km) cannot be less than or equal to service odometer (${odo.toLocaleString()} km).`);
      return;
    }

    if (nextDueDate && date) {
      const nD = new Date(nextDueDate);
      const sD = new Date(date);
      if (!isNaN(nD.getTime()) && !isNaN(sD.getTime()) && nD < sD) {
        alert('Validation Error: Next due calendar date cannot be earlier than service date.');
        return;
      }
    }

    const bike = this.getActiveBike();
    if (!editId && bike && odo < bike.currentOdo) {
      const confirmPastSvc = confirm(
        `Odometer Notice:\n\nEntered service odometer (${odo.toLocaleString()} km) is less than motorcycle's current odometer (${bike.currentOdo.toLocaleString()} km).\n\nIf you are recording a past historical service record, tap OK to proceed. Tap Cancel to correct.`
      );
      if (!confirmPastSvc) return;
    }

    const checkedParts = [];
    document.querySelectorAll('input[name="servicePart"]:checked').forEach(cb => {
      checkedParts.push(cb.value);
    });

    if (!bike.serviceHistory) bike.serviceHistory = [];

    const record = {
      id: editId || 'svc_' + Date.now(),
      date,
      odometer: odo,
      serviceType,
      workshop,
      cost,
      notes,
      servicedItemIds: checkedParts,
      nextDueOdo,
      nextDueDate
    };

    if (editId) {
      const idx = bike.serviceHistory.findIndex(s => s.id === editId);
      if (idx !== -1) bike.serviceHistory[idx] = record;
    } else {
      bike.serviceHistory.push(record);
    }

    // Update the changed components' last changed & next due values
    if (checkedParts.length > 0 && bike.serviceItems) {
      bike.serviceItems = bike.serviceItems.map(item => {
        if (checkedParts.includes(item.id)) {
          return {
            ...item,
            lastServicedOdo: odo,
            lastServicedDate: date,
            nextDueOdo: nextDueOdo || (odo + (Number(item.intervalKm) || 4000)),
            nextDueDate: nextDueDate || item.nextDueDate
          };
        }
        return item;
      });
    }

    if (odo > bike.currentOdo) {
      bike.currentOdo = odo;
    }

    this.saveState();
    SoundEffects.playSuccess();
    this.closeModal('serviceModal');
    this.render();
    this.showToast(editId ? 'Service record updated' : 'Service record saved');
  },

  deleteService(serviceId) {
    if (!confirm('Delete this service record?')) return;
    const bike = this.getActiveBike();
    bike.serviceHistory = (bike.serviceHistory || []).filter(s => s.id !== serviceId);
    this.saveState();
    this.render();
    this.showToast('Service record deleted');
  },

  // ================= ODOMETER QUICK MODAL =================
  openOdometerModal() {
    const bike = this.getActiveBike();
    document.getElementById('quickOdoInput').value = bike?.currentOdo || 0;
    this.openModal('odometerModal');
  },

  adjustQuickOdo(delta) {
    const input = document.getElementById('quickOdoInput');
    if (input) {
      const current = parseFloat(input.value) || 0;
      input.value = current + delta;
    }
  },

  handleOdoSubmit(e) {
    e.preventDefault();
    const val = parseFloat(document.getElementById('quickOdoInput').value);
    if (val === undefined || isNaN(val) || val < 0) return;

    const bike = this.getActiveBike();
    if (bike && val < bike.currentOdo) {
      const confirmCorrection = confirm(
        `Odometer Decrement Notice:\n\nNew odometer (${val.toLocaleString()} km) is lower than current motorcycle odometer (${bike.currentOdo.toLocaleString()} km).\n\nIs this an intentional odometer correction or speedometer replacement?`
      );
      if (!confirmCorrection) return;
    }

    bike.currentOdo = val;
    this.saveState();
    SoundEffects.playSuccess();
    this.closeModal('odometerModal');
    this.render();
    this.showToast(`Odometer updated to ${val.toLocaleString()} km`);
  },

  // ================= EDIT MOTORCYCLE =================
  openEditBikeModal() {
    this.closeModal('speedDialModal');
    this.closeModal('bikeSwitcherModal');
    const bike = this.getActiveBike();
    if (!bike) return;

    document.getElementById('editBikeName').value = bike.name || '';
    document.getElementById('editBikePlate').value = bike.plate || '';
    document.getElementById('editBikeYear').value = bike.year || '';
    document.getElementById('editBikeDisplacement').value = bike.displacement || '';
    document.getElementById('editBikeTank').value = bike.tankCapacity || '';
    document.getElementById('editBikeFrontPsi').value = bike.specs?.frontTirePsi || 29;
    document.getElementById('editBikeRearPsi').value = bike.specs?.rearTirePsi || 33;
    const slackEl = document.getElementById('editBikeChainSlack');
    if (slackEl) slackEl.value = bike.specs?.chainSlack || '25-30 mm';
    document.getElementById('editBikeRsa').value = bike.rsaPhone || '';

    this.openModal('editBikeModal');
  },

  handleEditBikeSubmit(e) {
    e.preventDefault();
    const bike = this.getActiveBike();
    if (!bike) return;

    bike.name = document.getElementById('editBikeName').value.trim() || 'My Motorcycle';
    bike.plate = document.getElementById('editBikePlate').value.trim().toUpperCase() || '';
    bike.year = parseInt(document.getElementById('editBikeYear').value) || new Date().getFullYear();
    bike.displacement = document.getElementById('editBikeDisplacement').value.trim();
    bike.tankCapacity = parseFloat(document.getElementById('editBikeTank').value) || 14;
    bike.rsaPhone = document.getElementById('editBikeRsa').value.trim();

    if (!bike.specs) bike.specs = {};
    bike.specs.frontTirePsi = parseInt(document.getElementById('editBikeFrontPsi').value) || 29;
    bike.specs.rearTirePsi = parseInt(document.getElementById('editBikeRearPsi').value) || 33;
    const slackEl = document.getElementById('editBikeChainSlack');
    if (slackEl) bike.specs.chainSlack = slackEl.value.trim() || '25-30 mm';

    this.saveState();
    SoundEffects.playSuccess();
    this.closeModal('editBikeModal');
    this.render();
    this.showToast('Motorcycle details updated');
  },

  async handleBikePhotoSelected(input) {
    if (!input.files || input.files.length === 0) return;
    try {
      this.showToast('Compressing photo...');
      const res = await VaultEngine.compressFile(input.files[0], 1200, 0.75);
      const bike = this.getActiveBike();
      bike.photo = res.dataUrl;
      this.saveState();
      SoundEffects.playSuccess();
      this.render();
      this.showToast('Motorcycle photo updated!');
    } catch (e) {
      alert('Photo upload error: ' + e.message);
    }
  },

  deleteCurrentBike() {
    if (this.state.bikes.length <= 1) {
      if (confirm('Delete this motorcycle and reset to setup screen?')) {
        this.resetAllDataClean();
      }
      return;
    }
    const bike = this.getActiveBike();
    if (!confirm(`Are you sure you want to delete ${bike.name}?`)) return;

    this.state.bikes = this.state.bikes.filter(b => b.id !== bike.id);
    this.state.activeBikeId = this.state.bikes[0].id;
    this.saveState();
    this.closeModal('editBikeModal');
    this.render();
    this.showToast('Motorcycle removed');
  },

  // ================= BIKE SWITCHER & ADD BIKE =================
  openBikeSwitcherModal() {
    const listEl = document.getElementById('garageBikesList');
    if (listEl) {
      listEl.innerHTML = this.state.bikes.map(b => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-card-subtle); border-radius:8px; margin-bottom:8px; border:1px solid ${b.id === this.state.activeBikeId ? 'var(--accent-primary)' : 'var(--border-subtle)'}; cursor:pointer;" onclick="App.selectBike('${b.id}')">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${b.photo || 'assets/bike1.jpg'}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
            <div>
              <div style="font-weight:600; font-size:14px; color:#fff;">${b.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${b.plate || ''} • ${b.currentOdo.toLocaleString()} km</div>
            </div>
          </div>
          ${b.id === this.state.activeBikeId ? '<span style="color:var(--accent-primary); font-size:12px; font-weight:600;">Active</span>' : ''}
        </div>
      `).join('');
    }
    this.openModal('bikeSwitcherModal');
  },

  selectBike(bikeId) {
    this.state.activeBikeId = bikeId;
    this.saveState();
    SoundEffects.playClick();
    this.closeModal('bikeSwitcherModal');
    this.render();
  },

  openNewBikeModal() {
    this.closeModal('bikeSwitcherModal');
    document.getElementById('newBikeName').value = '';
    document.getElementById('newBikePlate').value = '';
    document.getElementById('newBikeYear').value = new Date().getFullYear();
    document.getElementById('newBikeDisplacement').value = '';
    document.getElementById('newBikeTank').value = 13.5;
    document.getElementById('newBikeOdo').value = '';
    this.openModal('newBikeModal');
  },

  handleNewBikeSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newBikeName').value.trim();
    const plate = document.getElementById('newBikePlate').value.trim().toUpperCase();
    const year = parseInt(document.getElementById('newBikeYear').value) || new Date().getFullYear();
    const displacement = document.getElementById('newBikeDisplacement').value.trim();
    const tank = parseFloat(document.getElementById('newBikeTank').value) || 14;
    const odo = parseFloat(document.getElementById('newBikeOdo').value) || 0;
    const frontPsi = parseInt(document.getElementById('newBikeFrontPsi')?.value) || 29;
    const rearPsi = parseInt(document.getElementById('newBikeRearPsi')?.value) || 33;
    const chainSlack = document.getElementById('newBikeChainSlack')?.value.trim() || '25-30 mm';

    const newId = 'bike_' + Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    const newBike = {
      id: newId,
      name,
      plate,
      year,
      displacement,
      tankCapacity: tank,
      currentOdo: odo,
      initialOdo: odo,
      photo: 'assets/bike1.jpg',
      rsaPhone: '+9118002098004',
      specs: {
        estMileage: 35.0,
        frontTirePsi: frontPsi,
        rearTirePsi: rearPsi,
        chainSlack: chainSlack,
        oilGrade: '15W-50'
      },
      serviceItems: ServiceEngine.getDefaultServiceItems().map(item => ({
        ...item,
        lastServicedOdo: odo,
        lastServicedDate: todayStr,
        nextDueOdo: odo + (Number(item.intervalKm) || 4000)
      })),
      serviceHistory: [],
      refuels: [],
      documents: []
    };

    this.state.bikes.push(newBike);
    this.state.activeBikeId = newId;
    this.saveState();
    SoundEffects.playSuccess();
    this.closeModal('newBikeModal');
    this.render();
    this.showToast(`${name} added to your Garage!`);
  },

  // ================= COMPLETE RESET & CLEAN START =================
  resetAllDataClean() {
    const input = prompt(
      'DANGER: Complete Wipe & Factory Reset\n\nThis will permanently delete all motorcycles, fuel logs, service history, and uploaded documents from this device.\n\nTo confirm, type "RESET" in capital letters below:'
    );
    if (input !== 'RESET') {
      if (input !== null) {
        alert('Reset cancelled. You must type "RESET" in capital letters to wipe data.');
      }
      return;
    }
    localStorage.removeItem('motopulse_state');
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
    this.render();
    this.showToast('All data erased. Setup your motorcycle to begin!');
  },

  // ================= BACKUP & PREFERENCES =================
  toggleSoundSetting(checkbox) {
    this.state.soundEnabled = checkbox.checked;
    SoundEffects.enabled = checkbox.checked;
    this.saveState();
  },

  exportBackup() {
    this.exportData();
  },

  exportData() {
    const exportPayload = {
      schemaVersion: 2,
      appVersion: '2.4.0',
      exportDate: new Date().toISOString(),
      state: this.state
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `motopulse_backup_v2_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
    this.showToast('Backup exported (Schema v2 with documents)');
  },

  handleImportBackup(e) {
    const input = e.target ? e.target : e;
    if (!input || !input.files || input.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        let importedState = null;

        // Support Schema v2 and legacy v1
        if (parsed.schemaVersion === 2 && parsed.state && Array.isArray(parsed.state.bikes)) {
          importedState = parsed.state;
        } else if (parsed.bikes && Array.isArray(parsed.bikes)) {
          importedState = parsed;
        } else {
          throw new Error('Unrecognized backup schema. Missing valid "bikes" array.');
        }

        // Validate bike records structure transactionally
        for (const b of importedState.bikes) {
          if (!b.id || !b.name) {
            throw new Error('Corrupted motorcycle record found in backup.');
          }
        }

        const bikeCount = importedState.bikes.length;
        const currentCount = this.state.bikes ? this.state.bikes.length : 0;

        const choice = confirm(
          `Backup Verified! Found ${bikeCount} motorcycle(s).\n\n` +
          `• Tap OK to REPLACE all current data with this backup.\n` +
          `• Tap CANCEL to MERGE new motorcycles into your existing garage (${currentCount} existing).`
        );

        if (choice) {
          // Replace
          this.state = importedState;
          if (!this.state.theme) this.state.theme = 'dark';
          if (!this.state.accentColor) this.state.accentColor = 'amber';
          this.saveState();
          this.applyTheme();
          this.render();
          this.showToast(`Backup restored: ${bikeCount} bike(s) loaded.`);
        } else {
          // Merge
          const existingIds = new Set((this.state.bikes || []).map(b => b.id));
          let mergedCount = 0;
          if (!this.state.bikes) this.state.bikes = [];

          importedState.bikes.forEach(b => {
            if (!existingIds.has(b.id)) {
              this.state.bikes.push(b);
              mergedCount++;
            }
          });

          if (!this.state.activeBikeId && this.state.bikes.length > 0) {
            this.state.activeBikeId = this.state.bikes[0].id;
          }

          this.saveState();
          this.applyTheme();
          this.render();
          this.showToast(`Merged ${mergedCount} new motorcycle(s) into your garage!`);
        }
      } catch (err) {
        alert('Transactional Import Error: ' + err.message + '\n\nYour existing data was left completely untouched.');
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(input.files[0]);
  },

  // ================= THEME & CUSTOMIZATION =================
  isLightMode() {
    const theme = this.state.theme || 'dark';
    if (theme === 'auto') {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    }
    return theme === 'light';
  },

  applyTheme() {
    const theme = this.state.theme || 'dark';
    const accent = this.state.accentColor || 'amber';

    let effectiveTheme = theme;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-accent', accent);
    document.body.className = `theme-${effectiveTheme} accent-${accent}`;

    // Update Android status bar theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', effectiveTheme === 'light' ? '#FFFFFF' : '#08080A');
    }

    // Update header toggle button icon
    const themeBtn = document.getElementById('headerThemeBtn');
    if (themeBtn) {
      themeBtn.innerHTML = effectiveTheme === 'light' ? '⚫' : '⚪';
      themeBtn.title = effectiveTheme === 'light' ? 'Switch to Black & Ferrari Red' : 'Switch to White & Ferrari Red';
    }

    this.updateSettingsPills();

    // Refresh active chart if on mileage tab
    if (this.activeTab === 'mileage') {
      const bike = this.getActiveBike();
      if (bike) {
        const stats = MileageEngine.calculateStats(bike, bike.refuels);
        MileageEngine.renderChart('mileageChart', stats.entriesWithMileage, this.state.currency, this.state.unitMileage, this.isLightMode(), this.getAccentHex());
      }
    }
  },

  toggleTheme() {
    SoundEffects.playClick();
    const currentTheme = this.state.theme || 'dark';
    let effectiveTheme = currentTheme;
    if (currentTheme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }
    const nextTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  },

  setTheme(theme) {
    this.state.theme = theme;
    this.saveState();
    this.applyTheme();
    SoundEffects.playClick();
    const names = { dark: '⚫ Black & Ferrari Red (Dark)', light: '⚪ White & Ferrari Red (Light)', auto: '📱 Auto System Theme' };
    this.showToast(names[theme] || theme);
  },

  setAccent(accent) {
    this.state.accentColor = accent;
    this.saveState();
    this.applyTheme();
    SoundEffects.playClick();
    const names = {
      ferrari: 'Scarlet Red (#D90B1F)',
      red: 'Scarlet Red (#D90B1F)',
      orange: 'Safety Orange (#FF5722)',
      mint: 'Neon Mint (#00E676)',
      amber: 'Speedo Gold',
      crimson: 'Cafe Red',
      emerald: 'Racing Green',
      saddle: 'Heritage Leather',
      steel: 'Sterling Chrome'
    };
    this.showToast(`🎨 Accent: ${names[accent] || accent}`);
  },

  getAccentHex() {
    const accents = {
      ferrari: '#D90B1F',
      red: '#D90B1F',
      orange: '#FF5722',
      mint: '#00E676',
      amber: '#f59e0b',
      crimson: '#D90B1F',
      emerald: '#10b981',
      saddle: '#d97706',
      steel: '#38bdf8'
    };
    return accents[this.state.accentColor] || '#D90B1F';
  },

  updateSettingsPills() {
    const currentTheme = this.state.theme || 'dark';
    const currentAccent = this.state.accentColor || 'amber';

    document.querySelectorAll('.theme-pill').forEach(pill => {
      if (pill.dataset.themeVal === currentTheme) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    document.querySelectorAll('.accent-swatch-btn').forEach(btn => {
      if (btn.dataset.accentVal === currentAccent) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  openSettingsModal() {
    SoundEffects.playClick();
    const curInput = document.getElementById('settingCurrency');
    const distInput = document.getElementById('settingUnitDist');
    const fuelInput = document.getElementById('settingUnitFuel');
    const mileageInput = document.getElementById('settingUnitMileage');
    const soundToggle = document.getElementById('settingSoundToggle');

    if (curInput) curInput.value = this.state.currency || '₹';
    if (distInput) distInput.value = this.state.unitDist || 'km';
    if (fuelInput) fuelInput.value = this.state.unitFuel || 'L';
    if (mileageInput) mileageInput.value = this.state.unitMileage || 'km/L';
    if (soundToggle) soundToggle.checked = this.state.soundEnabled !== false;

    this.updateSettingsPills();
    this.openModal('settingsModal');
  },

  saveUnitSettings() {
    const curInput = document.getElementById('settingCurrency');
    const distInput = document.getElementById('settingUnitDist');
    const fuelInput = document.getElementById('settingUnitFuel');
    const mileageInput = document.getElementById('settingUnitMileage');

    if (curInput) this.state.currency = curInput.value.trim() || '₹';
    if (distInput) this.state.unitDist = distInput.value;
    if (fuelInput) this.state.unitFuel = fuelInput.value;
    if (mileageInput) this.state.unitMileage = mileageInput.value;

    this.saveState();
    SoundEffects.playSuccess();
    this.render();
    this.showToast('✓ Units & Currency updated');
    this.closeModal('settingsModal');
  },

  toggleSoundFX(enabled) {
    this.state.soundEnabled = !!enabled;
    SoundEffects.enabled = this.state.soundEnabled;
    this.saveState();
    if (enabled) SoundEffects.playClick();
    this.showToast(enabled ? '🔊 Sound effects enabled' : '🔇 Sound effects muted');
  },

  confirmFactoryReset() {
    const ans = confirm('⚠️ Reset MotoPulse completely?\n\nThis will permanently delete all motorcycles, odometer history, fuel logs, service records, and saved documents.');
    if (ans) {
      localStorage.removeItem('motopulse_state');
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.saveState();
      this.closeModal('settingsModal');
      this.applyTheme();
      this.render();
      this.showToast('App reset to clean slate');
    }
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
