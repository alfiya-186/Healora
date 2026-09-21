/**
 * HEALORA CLINICAL DRUG-NUTRIENT & ALLERGY SAFETY ENGINE
 * 
 * Rule-based Clinical Decision Support System (CDSS) for medical nutrition therapy.
 * Deterministic expert rules preventing adverse drug-food interactions,
 * absorption blunting, and accidental allergen exposure.
 * 
 * NO AI/ML - 100% Deterministic Clinical Informatics.
 */

export const evaluateClinicalSafety = ({
  medical_history = '',
  current_medications = '',
  food_allergies = '',
  family_history = ''
}) => {
  const alerts = [];

  const medText = (current_medications || '').toLowerCase();
  const histText = (medical_history || '').toLowerCase();
  const allergyText = (food_allergies || '').toLowerCase();

  // 1. Thyroid / Levothyroxine Interaction Check
  if (
    medText.includes('thyroid') || 
    medText.includes('levothyroxine') || 
    medText.includes('eltroxin') || 
    medText.includes('thyronorm') ||
    histText.includes('thyroid')
  ) {
    alerts.push({
      id: 'thyroid_timing',
      type: 'DRUG_NUTRIENT_INTERACTION',
      severity: 'HIGH',
      badge: '⚠️ Thyroid Absorption Lock',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      medication: 'Thyroid Medication (Levothyroxine / Thyronorm)',
      mechanism: 'Calcium in milk/curd, soy proteins, and iron supplements bind to thyroid hormone in the gastrointestinal tract, reducing absorption by up to 40%.',
      clinicalDirective: 'Take thyroid tablet with plain water upon waking. Maintain a strict 4-hour gap before consuming milk, curd, soy, or iron-rich foods.',
      safetyRule: 'Space dairy & calcium 4 hours away from thyroid pill'
    });
  }

  // 2. Diabetes / Metformin / Glycemic Hypoglycemia Safety
  if (
    medText.includes('metformin') || 
    medText.includes('glycomet') || 
    medText.includes('janumet') || 
    medText.includes('insulin') ||
    histText.includes('diabetes')
  ) {
    alerts.push({
      id: 'diabetes_metformin',
      type: 'METABOLIC_SAFETY',
      severity: 'HIGH',
      badge: '⚠️ Glycemic Meal Timing Rule',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      medication: 'Oral Hypoglycemic / Metformin Protocol',
      mechanism: 'Skipping scheduled complex-carbohydrate meals while taking antidiabetic medication triggers acute hypoglycemia (dizziness, shakiness, cold sweat).',
      clinicalDirective: 'Never skip prescribed meal slots. Always take metformin with or immediately after food to avoid stomach irritation and blood sugar crashes.',
      safetyRule: 'Strict meal consistency required; zero meal skipping'
    });
  }

  // 3. Hypertension / Blood Pressure / Potassium Balance
  if (
    medText.includes('bp') || 
    medText.includes('amlodipine') || 
    medText.includes('telmisartan') || 
    medText.includes('losartan') || 
    histText.includes('hypertension')
  ) {
    alerts.push({
      id: 'bp_potassium',
      type: 'ELECTROLYTE_SAFETY',
      severity: 'MEDIUM',
      badge: '⚠️ Electrolyte & Sodium Advisory',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      medication: 'Antihypertensive (Blood Pressure Protocol)',
      mechanism: 'Certain blood pressure agents reduce potassium excretion in kidneys. Using potassium-based salt substitutes can cause dangerous potassium buildup (hyperkalemia).',
      clinicalDirective: 'Keep added salt low (< 1,800mg daily). Avoid artificial potassium salt substitutes. Drink 2.5L water daily to maintain electrolyte balance.',
      safetyRule: 'Low sodium protocol; avoid artificial potassium salts'
    });
  }

  // 4. Iron Supplement & Tea/Coffee Tannin Blocker
  if (
    medText.includes('iron') || 
    medText.includes('ferrous') || 
    medText.includes('orofer') || 
    histText.includes('anemia')
  ) {
    alerts.push({
      id: 'iron_tannins',
      type: 'DRUG_NUTRIENT_INTERACTION',
      severity: 'MEDIUM',
      badge: '⚠️ Iron Absorption Blocker',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      medication: 'Iron Supplements (Ferrous Salts)',
      mechanism: 'Tannins in tea, green tea, and coffee, and calcium in milk block iron absorption by up to 60%. Vitamin C triples iron absorption.',
      clinicalDirective: 'Pair iron supplements with citrus or lemon water. Do not drink tea or coffee within 2 hours before or after iron intake.',
      safetyRule: '2-hour tea/coffee blackout window around iron intake'
    });
  }

  // 5. Food Allergy & Allergen Conflict Engine
  if (allergyText && allergyText !== 'none') {
    if (allergyText.includes('dairy') || allergyText.includes('lactose')) {
      alerts.push({
        id: 'allergy_dairy',
        type: 'ALLERGEN_CONFLICT',
        severity: 'CRITICAL',
        badge: '🚫 Lactose / Dairy Conflict Block',
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        medication: 'Food Allergy Flag: Dairy / Lactose',
        mechanism: 'Lactase deficiency leads to acute gastrointestinal inflammation, cramping, and severe malabsorption.',
        clinicalDirective: 'Strict allergen block enabled. Dairy milk and curd are replaced with plant-based alternatives (fortified almond milk or soy curd).',
        safetyRule: 'Dairy strictly excluded from all meal slots'
      });
    }

    if (allergyText.includes('gluten')) {
      alerts.push({
        id: 'allergy_gluten',
        type: 'ALLERGEN_CONFLICT',
        severity: 'CRITICAL',
        badge: '🚫 Gluten / Celiac Exclusion',
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        medication: 'Food Allergy Flag: Gluten / Wheat',
        mechanism: 'Wheat gluten causes autoimmune mucosal blunting in celiac and gluten-sensitive patients.',
        clinicalDirective: 'All wheat, maida, and rava excluded. Diet locked to certified gluten-free grains (millet, oats, Kerala brown rice).',
        safetyRule: 'Zero wheat/gluten cross-contamination allowed'
      });
    }

    if (allergyText.includes('peanut')) {
      alerts.push({
        id: 'allergy_peanut',
        type: 'ALLERGEN_CONFLICT',
        severity: 'CRITICAL',
        badge: '🚫 Peanut Anaphylaxis Lock',
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        medication: 'Food Allergy Flag: Peanuts / Nuts',
        mechanism: 'Peanut allergen proteins can trigger immediate life-threatening anaphylactic shock.',
        clinicalDirective: 'Absolute zero-tolerance allergen lock. All recipes strictly forbid peanuts, mixed tree nuts, and peanut-derived oils.',
        safetyRule: 'Absolute peanut exclusion with recipe warning'
      });
    }

    if (
      allergyText.includes('shellfish') || 
      allergyText.includes('egg') || 
      allergyText.includes('soy')
    ) {
      alerts.push({
        id: 'allergy_custom',
        type: 'ALLERGEN_CONFLICT',
        severity: 'CRITICAL',
        badge: `🚫 Specific Allergen Alert (${food_allergies})`,
        badgeColor: 'bg-red-100 text-red-900 border-red-300',
        medication: `Food Allergy Flag: ${food_allergies}`,
        mechanism: `Specific IgE immunological reactivity to ${food_allergies} proteins.`,
        clinicalDirective: `Patient profile allergen lock active. Nutritionist notified to exclude all traces of ${food_allergies}.`,
        safetyRule: `Allergen exclusion enforced for ${food_allergies}`
      });
    }
  }

  return {
    alerts,
    isAllClear: alerts.length === 0,
    totalAlerts: alerts.length,
    criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length
  };
};

/**
 * CLINICAL ALLERGEN DICTIONARY & CONFLICT CHECKER
 * Detects whether a prescribed meal text conflicts with patient's diagnosed food allergies.
 */
export const ALLERGEN_DICTIONARY = {
  peanuts: {
    label: 'Peanuts / Tree Nuts',
    keys: ['peanut', 'peanuts', 'groundnut', 'groundnuts', 'nut', 'nuts', 'cashew', 'almond', 'walnut', 'pista', 'pistachio', 'hazelnut', 'nutella'],
    warning: 'Severe Anaphylaxis Risk: Patient has diagnosed peanut/nut allergy.'
  },
  dairy: {
    label: 'Dairy / Lactose',
    keys: ['milk', 'curd', 'paneer', 'cheese', 'butter', 'ghee', 'yogurt', 'yoghurt', 'cream', 'whey', 'lassi', 'buttermilk', 'custard', 'ice cream', 'dairy'],
    warning: 'Lactose Intolerance / Dairy Allergy Conflict: Patient cannot tolerate dairy proteins.'
  },
  gluten: {
    label: 'Gluten / Wheat',
    keys: ['wheat', 'bread', 'roti', 'chapati', 'parotta', 'porotta', 'maida', 'atta', 'pasta', 'rava', 'semolina', 'sooji', 'suji', 'gluten', 'biscuit', 'cake', 'naan'],
    warning: 'Celiac / Gluten Allergy Conflict: Patient must strictly avoid wheat and gluten.'
  },
  eggs: {
    label: 'Egg',
    keys: ['egg', 'eggs', 'omelette', 'omlet', 'scramble', 'boiled egg', 'egg roast', 'bhurji', 'mayonnaise', 'mayo', 'albumen'],
    warning: 'Egg Allergen Conflict: Patient has documented egg hypersensitivity.'
  },
  shellfish: {
    label: 'Shellfish / Seafood',
    keys: ['fish', 'prawn', 'prawns', 'shrimp', 'shrimps', 'crab', 'crabs', 'lobster', 'seafood', 'squid', 'clam', 'meen', 'tuna', 'salmon'],
    warning: 'Shellfish / Seafood Allergen Conflict: Patient has documented seafood hypersensitivity.'
  },
  soy: {
    label: 'Soy',
    keys: ['soy', 'soya', 'tofu', 'edamame', 'soy milk', 'soya chunks', 'miso'],
    warning: 'Soy Protein Allergy Conflict: Patient is allergic to soy.'
  }
};

export const checkMealAllergenConflict = (mealText = '', patientAllergies = '') => {
  if (!mealText || !patientAllergies || patientAllergies.toLowerCase() === 'none' || patientAllergies.toLowerCase() === 'none reported') {
    return null;
  }

  const cleanMeal = String(mealText).toLowerCase();
  const cleanAllergies = String(patientAllergies).toLowerCase();

  for (const [allergenType, def] of Object.entries(ALLERGEN_DICTIONARY)) {
    // Check if patient has this allergy
    const patientHasAllergy = cleanAllergies.includes(allergenType) || 
      def.keys.some(k => cleanAllergies.includes(k));

    if (patientHasAllergy) {
      // Find if meal matches any forbidden keyword
      const matched = def.keys.find(kw => {
        // Boundary matching: checks word boundaries, spaces, parentheses, hyphens
        const regex = new RegExp(`(^|[^a-zA-Z])${kw}([^a-zA-Z]|$)`, 'i');
        return regex.test(cleanMeal);
      });

      if (matched) {
        return {
          hasConflict: true,
          allergenType,
          allergenLabel: def.label,
          matchedKeyword: matched,
          warning: def.warning,
          patientAllergy: patientAllergies
        };
      }
    }
  }

  return null;
};

/**
 * CLINICAL DIETARY PREFERENCE & ETHICAL RESTRICTIONS
 * Detects whether a prescribed meal text violates patient's diet preference (Vegan, Vegetarian, Halal, Pescatarian).
 */
export const DIET_PREFERENCE_RULES = {
  vegan: {
    label: 'Vegan',
    forbiddenKeys: [
      // Meats & Poultry
      'chicken', 'meat', 'beef', 'mutton', 'pork', 'bacon', 'ham', 'lamb', 'duck', 'turkey', 'veal', 'sausage', 'steak',
      // Seafood
      'fish', 'prawn', 'prawns', 'shrimp', 'shrimps', 'crab', 'crabs', 'lobster', 'seafood', 'squid', 'clam', 'meen', 'tuna', 'salmon',
      // Eggs
      'egg', 'eggs', 'omelette', 'omlet', 'scramble', 'boiled egg', 'egg roast', 'bhurji', 'mayonnaise', 'mayo',
      // Dairy & Animal Byproducts
      'milk', 'curd', 'paneer', 'cheese', 'butter', 'ghee', 'yogurt', 'yoghurt', 'cream', 'whey', 'lassi', 'buttermilk', 'honey'
    ],
    reason: 'Vegan Protocol Violation: Strictly plant-based. All meat, poultry, seafood, dairy, and eggs are prohibited.'
  },
  vegetarian: {
    label: 'Vegetarian',
    forbiddenKeys: [
      // Meats & Poultry
      'chicken', 'meat', 'beef', 'mutton', 'pork', 'bacon', 'ham', 'lamb', 'duck', 'turkey', 'veal', 'sausage', 'steak',
      // Seafood
      'fish', 'prawn', 'prawns', 'shrimp', 'shrimps', 'crab', 'crabs', 'lobster', 'seafood', 'squid', 'clam', 'meen', 'tuna', 'salmon'
    ],
    reason: 'Vegetarian Protocol Violation: Meat, poultry, and seafood are strictly prohibited.'
  },
  pescatarian: {
    label: 'Pescatarian',
    forbiddenKeys: [
      'chicken', 'meat', 'beef', 'mutton', 'pork', 'bacon', 'ham', 'lamb', 'duck', 'turkey', 'veal', 'sausage', 'steak'
    ],
    reason: 'Pescatarian Protocol Violation: Red meat and poultry are forbidden (only plant foods and seafood allowed).'
  },
  halal: {
    label: 'Halal',
    forbiddenKeys: [
      'pork', 'bacon', 'ham', 'lard', 'pork ribs', 'pepperoni'
    ],
    reason: 'Halal Compliance Violation: Pork and non-halal animal derivatives are strictly prohibited.'
  }
};

export const checkMealDietPreferenceConflict = (mealText = '', foodPreferences = '') => {
  if (!mealText || !foodPreferences || foodPreferences.toLowerCase() === 'no preference') {
    return null;
  }

  const cleanMeal = String(mealText).toLowerCase();
  const cleanPref = String(foodPreferences).toLowerCase();

  for (const [prefKey, def] of Object.entries(DIET_PREFERENCE_RULES)) {
    if (cleanPref.includes(prefKey)) {
      const matched = def.forbiddenKeys.find(kw => {
        const regex = new RegExp(`(^|[^a-zA-Z])${kw}([^a-zA-Z]|$)`, 'i');
        return regex.test(cleanMeal);
      });

      if (matched) {
        return {
          hasConflict: true,
          preference: def.label,
          matchedKeyword: matched,
          warning: def.reason
        };
      }
    }
  }

  return null;
};

/**
 * Unified Conflict Evaluator for Meals
 * Evaluates both Clinical Allergies (CRITICAL) and Dietary Preferences (HIGH).
 */
export const evaluateMealConflicts = (mealText = '', { food_allergies = '', food_preferences = '' } = {}) => {
  const allergen = checkMealAllergenConflict(mealText, food_allergies);
  const dietPref = checkMealDietPreferenceConflict(mealText, food_preferences);
  return {
    allergenConflict: allergen,
    dietPreferenceConflict: dietPref,
    hasAnyConflict: !!(allergen || dietPref)
  };
};



