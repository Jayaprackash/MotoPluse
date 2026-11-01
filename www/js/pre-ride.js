/**
 * MotoPulse - T-CLOCS Pre-Ride Safety Inspection Suite
 */

const PreRideEngine = {
  getDefaultChecklist(specs = {}) {
    const frontPsi = specs.frontTirePsi || 29;
    const rearPsi = specs.rearTirePsi || 33;
    const slack = specs.chainSlack || '25-30 mm';

    return [
      {
        id: 'tires',
        letter: 'T',
        title: 'Tires & Wheels',
        desc: `Check cold pressure (Front: ${frontPsi} PSI, Rear: ${rearPsi} PSI), tread depth, sidewalls & rims`,
        checked: false
      },
      {
        id: 'controls',
        letter: 'C',
        title: 'Controls & Levers',
        desc: 'Clutch lever free play (2-3mm), smooth throttle return, front/rear brake lever firm response',
        checked: false
      },
      {
        id: 'lights',
        letter: 'L',
        title: 'Lights & Electrics',
        desc: 'Headlight high/low beam, tail & brake lamp (both switches), turn indicators, horn & kill-switch',
        checked: false
      },
      {
        id: 'oils',
        letter: 'O',
        title: 'Oil & Vital Fluids',
        desc: 'Engine oil level on center-stand/level ground, brake fluid reservoirs (clear & above MIN), coolant level',
        checked: false
      },
      {
        id: 'chassis',
        letter: 'C',
        title: 'Chassis & Drive Chain',
        desc: `Drive chain free slack (${slack} per manual), link lubrication, sprocket teeth wear & suspension rebound`,
        checked: false
      },
      {
        id: 'stands',
        letter: 'S',
        title: 'Stands & Cut-Off Switch',
        desc: 'Side stand spring tension, stand pivot tightness, side stand safety ignition cut-off sensor',
        checked: false
      }
    ];
  },

  toggleCheckItem(checklist, itemId) {
    return checklist.map(item => {
      if (item.id === itemId) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
  },

  markAll(checklist, status = true) {
    return checklist.map(item => ({ ...item, checked: status }));
  },

  isAllClear(checklist) {
    return checklist.every(item => item.checked);
  }
};
