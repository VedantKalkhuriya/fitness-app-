import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShoppingList, calculatePlanNutrition, recalculatePlanAfterMealEdit } from './dietPlanUtils.js';

test('combines only matching ingredients with compatible units', () => {
  const list = buildShoppingList({ weekPlan: [
    { meals: [{ ingredients: [{ name: 'Rice', quantity: 100, unit: 'grams' }, { name: 'Salt' }] }] },
    { meals: [{ ingredients: [{ name: 'rice', quantity: 50, unit: 'g' }, { name: 'Salt' }, { name: 'Rice', quantity: 2, unit: 'cup' }] }] },
  ] });
  assert.deepEqual(list.map((item) => [item.name, item.quantity, item.unit]), [
    ['Rice', 150, 'g'], ['Rice', 2, 'cup'], ['Salt', null, ''], ['Salt', null, ''],
  ]);
});

test('does not calculate daily macro averages when any day is missing data', () => {
  assert.deepEqual(calculatePlanNutrition({
    weekPlan: [{ calories: 1800 }, { calories: null }],
  }), { calories: null, proteinGrams: null, carbohydrateGrams: null, fatGrams: null });
  assert.equal(calculatePlanNutrition({ totalDailyCalories: 1900 }).calories, 1900);
});

test('invalidates aggregate estimates after a meal edit unless every meal has estimates', () => {
  const result = recalculatePlanAfterMealEdit({
    totalDailyCalories: 2000,
    weekPlan: [{ calories: 2000, meals: [{ calories: 800 }, { calories: 1200 }] }],
  });
  assert.equal(result.weekPlan[0].calories, 2000);
  assert.equal(result.totalDailyCalories, null);
  const missing = recalculatePlanAfterMealEdit({ weekPlan: [{ meals: [{ calories: 800 }, { calories: null }] }] });
  assert.equal(missing.weekPlan[0].calories, null);
});
