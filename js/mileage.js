/**
 * MotoPulse - Mileage & Fuel Analytics Engine
 * Complies with strict fuel-economy calculation safeguards:
 * - Proper Full-to-Full interval calculation with partial fill accumulation
 * - No fabricated mileage on 1st fill or single fill
 * - Lifetime average = total distance / total fuel across valid full intervals
 * - Diagnostics: Best/Worst interval tracking & unusual drop signals
 */

const MileageEngine = {
  // Calculate stats for current active bike with full edge-case protection
  calculateStats(bike, refuels = []) {
    if (!refuels || refuels.length === 0) {
      return {
        avgMileage: null,
        lastMileage: null,
        bestMileage: null,
        worstMileage: null,
        mileageDropAlert: null,
        costPerKm: null,
        totalSpend: 0,
        totalLitres: 0,
        monthlySpend: 0,
        estimatedRange: null,
        rangeConfidence: 'None',
        totalValidDistance: 0,
        entriesWithMileage: []
      };
    }

    // Sort refuels chronologically ascending by odometer
    const sorted = [...refuels].sort((a, b) => Number(a.odometer) - Number(b.odometer));

    let totalValidDistance = 0;
    let totalFuelForValidDistance = 0;
    let totalSpendForValidDistance = 0;
    let totalSpend = 0;
    let totalLitres = 0;
    const entriesWithMileage = [];

    // Track state between full tank endpoints
    let lastFullEntry = null;
    let accumulatedFuelSinceLastFull = 0;
    let accumulatedSpendSinceLastFull = 0;

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const odo = Number(entry.odometer) || 0;
      const litres = Number(entry.litres) || 0;
      const cost = Number(entry.cost) || 0;
      const isFull = Boolean(entry.isFullTank);

      totalSpend += cost;
      totalLitres += litres;

      let calcMileage = null;
      let tripDistance = 0;
      let intervalType = 'standard'; // 'baseline' | 'partial' | 'full'

      if (i > 0) {
        tripDistance = odo - (Number(sorted[i - 1].odometer) || 0);
      }

      if (isFull) {
        if (lastFullEntry !== null) {
          // Closed full-to-full interval!
          const intervalDist = odo - lastFullEntry.odometer;
          const intervalFuel = accumulatedFuelSinceLastFull + litres;
          const intervalCost = accumulatedSpendSinceLastFull + cost;

          if (intervalDist > 0 && intervalFuel > 0) {
            calcMileage = Number((intervalDist / intervalFuel).toFixed(2));
            totalValidDistance += intervalDist;
            totalFuelForValidDistance += intervalFuel;
            totalSpendForValidDistance += intervalCost;
          }
          intervalType = 'full';
        } else {
          // First full tank - Baseline entry!
          intervalType = 'baseline';
        }

        // Reset accumulation for next interval
        lastFullEntry = { odometer: odo, date: entry.date, index: i };
        accumulatedFuelSinceLastFull = 0;
        accumulatedSpendSinceLastFull = 0;
      } else {
        // Partial fill - accumulate fuel & spend until next full tank
        accumulatedFuelSinceLastFull += litres;
        accumulatedSpendSinceLastFull += cost;
        intervalType = 'partial';
      }

      entriesWithMileage.push({
        ...entry,
        tripDistance: Math.max(0, tripDistance),
        mileage: calcMileage,
        intervalType
      });
    }

    // Lifetime Average Fuel Economy (Strict Weighted Average: Total Valid Distance / Total Fuel in Valid Intervals)
    let avgMileage = null;
    if (totalFuelForValidDistance > 0 && totalValidDistance > 0) {
      avgMileage = Number((totalValidDistance / totalFuelForValidDistance).toFixed(2));
    }

    // Extract all valid completed full interval mileages
    const validMileages = entriesWithMileage
      .map(e => e.mileage)
      .filter(m => typeof m === 'number' && m > 0);

    const lastMileage = validMileages.length > 0 ? validMileages[validMileages.length - 1] : null;
    const bestMileage = validMileages.length > 0 ? Math.max(...validMileages) : null;
    const worstMileage = validMileages.length > 0 ? Math.min(...validMileages) : null;

    // Mileage Drop Signal (e.g. >15% drop compared to lifetime average)
    let mileageDropAlert = null;
    if (avgMileage && lastMileage && validMileages.length >= 2) {
      const dropPct = Math.round(((avgMileage - lastMileage) / avgMileage) * 100);
      if (dropPct >= 15) {
        mileageDropAlert = {
          percentDrop: dropPct,
          lastMileage,
          avgMileage,
          message: `Last trip mileage (${lastMileage} km/L) dropped ${dropPct}% below average. Check cold tire pressure or chain slack.`
        };
      }
    }

    // Running Cost per Kilometer (Fuel only)
    let costPerKm = null;
    if (totalValidDistance > 0 && totalSpendForValidDistance > 0) {
      costPerKm = Number((totalSpendForValidDistance / totalValidDistance).toFixed(2));
    } else if (avgMileage && sorted.length > 0) {
      const recentPrice = Number(sorted[sorted.length - 1]?.pricePerLitre) || 102;
      costPerKm = Number((recentPrice / avgMileage).toFixed(2));
    }

    // Estimated Usable Fuel Range (Clearly an estimate, never claiming sensor accuracy)
    let estimatedRange = null;
    let rangeConfidence = 'None';
    const effectiveMileage = lastMileage || avgMileage;
    if (effectiveMileage && bike.tankCapacity) {
      const tankCap = Number(bike.tankCapacity) || 13;
      // Assume 80% usable capacity (conservatively excluding 20% emergency reserve/slosh)
      const usableFuel = tankCap * 0.8;
      estimatedRange = Math.round(usableFuel * effectiveMileage);
      rangeConfidence = validMileages.length >= 3 ? 'High' : 'Moderate';
    }

    // Current Month Spend
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthlySpend = refuels.reduce((acc, curr) => {
      if (!curr.date) return acc;
      const d = new Date(curr.date);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        return acc + (Number(curr.cost) || 0);
      }
      return acc;
    }, 0);

    return {
      avgMileage,
      lastMileage,
      bestMileage,
      worstMileage,
      mileageDropAlert,
      costPerKm,
      totalSpend: Math.round(totalSpend),
      totalLitres: Number(totalLitres.toFixed(1)),
      monthlySpend: Math.round(monthlySpend),
      estimatedRange,
      rangeConfidence,
      totalValidDistance,
      entriesWithMileage
    };
  },

  // Draw smooth fuel economy trend chart onto canvas
  renderChart(canvasId, refuels = [], currencySymbol = '₹', unit = 'km/L', isLightMode = false, accentColor = '#f59e0b') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement?.clientWidth || 360;
    const height = 160;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, width, height);

    // Filter valid mileage entries (chronological order)
    const points = [...refuels]
      .filter(r => r.mileage && r.mileage > 0)
      .slice(-8); // Show up to last 8 intervals

    if (points.length < 2) {
      // Clean, minimal placeholder message
      ctx.fillStyle = isLightMode ? '#8a8375' : '#71717a';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Log 2+ full tank refills to see mileage trend curve', width / 2, height / 2);
      return;
    }

    const paddingX = 40;
    const paddingY = 24;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const values = points.map(p => p.mileage);
    const minVal = Math.floor(Math.min(...values) * 0.9);
    const maxVal = Math.ceil(Math.max(...values) * 1.1);
    const range = (maxVal - minVal) || 10;

    // Grid lines
    ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = paddingY + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(paddingX, y);
      ctx.lineTo(width - paddingX, y);
      ctx.stroke();

      const val = Math.round(maxVal - (range / 3) * i);
      ctx.fillStyle = isLightMode ? '#78716c' : '#a1a1aa';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${val}`, paddingX - 8, y + 3);
    }

    const coords = points.map((p, idx) => {
      const x = paddingX + (chartW / (points.length - 1)) * idx;
      const y = paddingY + chartH - ((p.mileage - minVal) / range) * chartH;
      return { x, y, mileage: p.mileage, date: p.date };
    });

    // Area fill
    const gradient = ctx.createLinearGradient(0, paddingY, 0, height - paddingY);
    gradient.addColorStop(0, accentColor + '40'); // 25% opacity
    gradient.addColorStop(1, accentColor + '00'); // 0% opacity

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.lineTo(coords[coords.length - 1].x, height - paddingY);
    ctx.lineTo(coords[0].x, height - paddingY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Curve line
    ctx.beginPath();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.stroke();

    // Data dots
    coords.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.strokeStyle = isLightMode ? '#fbf9f4' : '#0e0f14';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isLightMode ? '#1e1b18' : '#f4f4f5';
      ctx.font = '700 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${c.mileage}`, c.x, c.y - 8);
    });
  }
};
