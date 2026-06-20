const { state, HABITS, runCalculations } = require('./app');

describe('Carbon Footprint Calculator Logic', () => {
  beforeEach(() => {
    // Reset state to default settings before each test
    state.transportType = 'car_petrol';
    state.transportDist = 150;
    state.flights = 4;
    state.electricity = 60;
    state.renewable = 'none';
    state.diet = 'meat_heavy';
    state.foodWaste = 'moderate';
    state.shopping = 'moderate';
    state.recycle = 'yes';
  });

  test('should calculate correct default footprint', () => {
    runCalculations();
    expect(state.calculatedFootprint).toBeGreaterThan(0);
    // Breakdown components must be calculated
    expect(state.breakdown.transport).toBeGreaterThan(0);
    expect(state.breakdown.energy).toBeGreaterThan(0);
    expect(state.breakdown.diet).toBeGreaterThan(0);
    expect(state.breakdown.shopping).toBeGreaterThan(0);
  });

  test('should reduce transportation footprint with electric car or public transit', () => {
    runCalculations();
    const defaultTransport = state.breakdown.transport;

    state.transportType = 'car_electric';
    runCalculations();
    const electricTransport = state.breakdown.transport;
    expect(electricTransport).toBeLessThan(defaultTransport);

    state.transportType = 'active';
    state.flights = 0;
    runCalculations();
    expect(state.breakdown.transport).toBe(0);
  });

  test('should apply discount to energy bill based on renewable choices', () => {
    // Standard Grid
    state.renewable = 'none';
    runCalculations();
    const standardEnergy = state.breakdown.energy;

    // Partial Renewable
    state.renewable = 'partial';
    runCalculations();
    const partialEnergy = state.breakdown.energy;
    expect(partialEnergy).toBe(Math.round(standardEnergy * 0.5));

    // Full Renewable
    state.renewable = 'full';
    runCalculations();
    expect(state.breakdown.energy).toBe(0);
  });

  test('should reduce diet footprint for vegetarian and vegan diets', () => {
    runCalculations();
    const meatHeavyDiet = state.breakdown.diet;

    state.diet = 'vegetarian';
    runCalculations();
    const vegDiet = state.breakdown.diet;
    expect(vegDiet).toBeLessThan(meatHeavyDiet);

    state.diet = 'vegan';
    runCalculations();
    const veganDiet = state.breakdown.diet;
    expect(veganDiet).toBeLessThan(vegDiet);
  });
});
