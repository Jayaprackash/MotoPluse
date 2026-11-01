/**
 * MotoPulse - Service Due & Maintenance Suite
 */

const ServiceEngine = {
  getDefaultServiceItems() {
    return [
      {
        id: 'engine_oil',
        name: 'Engine Oil & Filter',
        icon: 'droplet',
        intervalKm: 4000,
        intervalMonths: 6,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 4000,
        nextDueDate: '',
        notes: 'Engine oil and oil filter replacement'
      },
      {
        id: 'chain_lube',
        name: 'Chain Cleaning & Lube',
        icon: 'link',
        intervalKm: 500,
        intervalMonths: 1,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 500,
        nextDueDate: '',
        notes: 'Clean with degreaser and apply chain lube'
      },
      {
        id: 'brake_pads',
        name: 'Brake Pads & Fluid',
        icon: 'disc',
        intervalKm: 8000,
        intervalMonths: 12,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 8000,
        nextDueDate: '',
        notes: 'Inspect pad thickness and brake fluid level'
      },
      {
        id: 'air_filter',
        name: 'Air Intake Filter',
        icon: 'wind',
        intervalKm: 6000,
        intervalMonths: 12,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 6000,
        nextDueDate: '',
        notes: 'Clean or replace air filter element'
      },
      {
        id: 'spark_plugs',
        name: 'Spark Plugs',
        icon: 'zap',
        intervalKm: 12000,
        intervalMonths: 24,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 12000,
        nextDueDate: '',
        notes: 'Check electrode gap and clean carbon deposits'
      },
      {
        id: 'tires',
        name: 'Tires (Tread & PSI)',
        icon: 'circle',
        intervalKm: 2000,
        intervalMonths: 1,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 2000,
        nextDueDate: '',
        notes: 'Check tread depth and cold tire pressure'
      },
      {
        id: 'coolant',
        name: 'Coolant & Radiator',
        icon: 'thermometer',
        intervalKm: 15000,
        intervalMonths: 24,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 15000,
        nextDueDate: '',
        notes: 'Inspect coolant level and radiator fins'
      },
      {
        id: 'battery',
        name: 'Battery Health',
        icon: 'battery-charging',
        intervalKm: 10000,
        intervalMonths: 6,
        lastServicedOdo: 0,
        lastServicedDate: '',
        nextDueOdo: 10000,
        nextDueDate: '',
        notes: 'Check voltage and clean terminal terminals'
      }
    ];
  },

  // Calculate detailed status for each item based on current odometer and manual due dates
  evaluateServiceItems(currentOdometer, serviceItems = []) {
    const items = serviceItems.length > 0 ? serviceItems : this.getDefaultServiceItems();
    const evaluated = [];
    let totalScore = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    items.forEach((item) => {
      const lastOdo = Number(item.lastServicedOdo) || 0;
      const kmRan = Math.max(0, currentOdometer - lastOdo);

      // Determine next due odometer: manually specified nextDueOdo OR (lastServicedOdo + intervalKm)
      let nextDueOdo = Number(item.nextDueOdo);
      if (!nextDueOdo || isNaN(nextDueOdo)) {
        nextDueOdo = lastOdo + (Number(item.intervalKm) || 4000);
      }
      const kmRemaining = nextDueOdo - currentOdometer;

      // Determine next due date
      let daysRemaining = null;
      let dueDateFormatted = item.nextDueDate || '';
      if (item.nextDueDate) {
        const dueD = new Date(item.nextDueDate);
        if (!isNaN(dueD.getTime())) {
          dueD.setHours(0, 0, 0, 0);
          daysRemaining = Math.ceil((dueD - today) / (1000 * 60 * 60 * 24));
        }
      }

      // Calculate progress percentage
      const totalSpan = Math.max(1, nextDueOdo - lastOdo);
      const progressPercent = Math.max(0, Math.min(100, Math.round((kmRemaining / totalSpan) * 100)));

      // Determine status
      let status = 'good';
      let statusText = 'Optimal';

      const isKmOverdue = kmRemaining <= 0;
      const isDateOverdue = daysRemaining !== null && daysRemaining <= 0;
      const isKmWarning = kmRemaining > 0 && (kmRemaining <= 300 || kmRemaining <= totalSpan * 0.15);
      const isDateWarning = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 15;

      if (isKmOverdue || isDateOverdue) {
        status = 'danger';
        if (isKmOverdue && isDateOverdue) {
          if (daysRemaining === 0) {
            statusText = `Overdue (${Math.abs(kmRemaining)} km) & Due Today`;
          } else {
            statusText = `Overdue by ${Math.abs(kmRemaining)} km & ${Math.abs(daysRemaining)}d`;
          }
        } else if (isKmOverdue) {
          statusText = `Overdue by ${Math.abs(kmRemaining)} km`;
        } else {
          if (daysRemaining === 0) {
            statusText = `Due Today (${kmRemaining} km left)`;
          } else {
            statusText = `Overdue by ${Math.abs(daysRemaining)} days`;
          }
        }
      } else if (isKmWarning || isDateWarning) {
        status = 'warn';
        if (isKmWarning && isDateWarning) {
          statusText = `Due in ${kmRemaining} km / ${daysRemaining}d`;
        } else if (isDateWarning) {
          statusText = `Due in ${daysRemaining}d (${kmRemaining} km)`;
        } else {
          statusText = `Due in ${kmRemaining} km`;
        }
      } else {
        status = 'good';
        if (daysRemaining !== null) {
          statusText = `${kmRemaining} km / ${daysRemaining}d left`;
        } else {
          statusText = `${kmRemaining} km left`;
        }
      }

      let itemScore = 100;
      if (status === 'danger') itemScore = 30;
      else if (status === 'warn') itemScore = 70;
      totalScore += itemScore;

      evaluated.push({
        ...item,
        kmRan,
        nextDueOdo,
        kmRemaining,
        daysRemaining,
        progressPercent,
        status,
        statusText
      });
    });

    const overallHealth = items.length > 0 ? Math.round(totalScore / items.length) : 100;
    const criticalOverdue = evaluated.filter(i => i.status === 'danger');
    const warningSoon = evaluated.filter(i => i.status === 'warn');

    return {
      items: evaluated,
      overallHealth,
      criticalOverdue,
      warningSoon,
      nextDueItem: evaluated.sort((a, b) => a.kmRemaining - b.kmRemaining)[0]
    };
  },

  // Reset an item after service
  quickResetItem(serviceItems, itemId, currentOdometer, customNextDueOdo = null, customNextDueDate = null) {
    const todayStr = new Date().toISOString().split('T')[0];
    return serviceItems.map(item => {
      if (item.id === itemId) {
        const interval = Number(item.intervalKm) || 4000;
        const nextOdo = customNextDueOdo ? Number(customNextDueOdo) : currentOdometer + interval;
        
        let nextDate = customNextDueDate;
        if (!nextDate) {
          const d = new Date();
          d.setMonth(d.getMonth() + (Number(item.intervalMonths) || 6));
          nextDate = d.toISOString().split('T')[0];
        }

        return {
          ...item,
          lastServicedOdo: currentOdometer,
          lastServicedDate: todayStr,
          nextDueOdo: nextOdo,
          nextDueDate: nextDate
        };
      }
      return item;
    });
  },

  // Validate item before saving
  validateServiceItem(lastOdo, nextOdo, lastDate, nextDate) {
    const lOdo = Number(lastOdo) || 0;
    const nOdo = Number(nextOdo) || 0;
    if (nOdo > 0 && nOdo <= lOdo) {
      return {
        valid: false,
        error: `Next due odometer (${nOdo} km) cannot be less than or equal to last serviced odometer (${lOdo} km).`
      };
    }
    if (lastDate && nextDate) {
      const lD = new Date(lastDate);
      const nD = new Date(nextDate);
      if (!isNaN(lD.getTime()) && !isNaN(nD.getTime()) && nD < lD) {
        return {
          valid: false,
          error: 'Next due calendar date cannot be earlier than last serviced date.'
        };
      }
    }
    return { valid: true };
  }
};
