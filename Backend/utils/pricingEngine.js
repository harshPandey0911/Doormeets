/**
 * Pricing Engine Utility
 * Evaluates formula-based and conditional pricing rules for a service
 */

const evaluateFormula = (formulaString, variables) => {
  try {
    // Start with basePrice in variables if not specified
    let sanitizedFormula = formulaString;
    
    // Replace all variables in formula string with their numeric values
    Object.keys(variables).forEach(key => {
      const val = parseFloat(variables[key]) || 0;
      // Use regex to match variable boundaries
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      sanitizedFormula = sanitizedFormula.replace(regex, val);
    });

    // Remove any character that is NOT a digit, decimal point, space, or standard math operator (+ - * / ( ))
    // This makes it completely safe from injection attacks.
    const safeFormula = sanitizedFormula.replace(/[^0-9\s+\-*/().]/g, '');

    // Securely evaluate the mathematical expression
    // Since only digits and basic operators exist, Function evaluation is safe here.
    const result = new Function(`return (${safeFormula})`)();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch (error) {
    console.error('[PricingEngine] Formula evaluation error:', error);
    return 0;
  }
};

const evaluatePricingRules = (basePrice, rules, inputs) => {
  let finalPrice = basePrice;

  // 1. Separate rules
  const formulaRule = rules.find(r => r.ruleType === 'formula');
  const conditionalRules = rules.filter(r => r.ruleType === 'conditional');

  // 2. If a formula rule exists, calculate base via formula
  if (formulaRule && formulaRule.formulaString) {
    const variables = { basePrice, ...inputs };
    finalPrice = evaluateFormula(formulaRule.formulaString, variables);
  }

  // 3. Process conditional rules
  conditionalRules.forEach(rule => {
    const { fieldName, operator, value, priceModifierType, modifierValue } = rule;
    const userVal = inputs[fieldName];

    if (userVal === undefined) return;

    let isMatch = false;
    if (operator === 'equals') {
      isMatch = String(userVal).toLowerCase() === String(value).toLowerCase();
    } else if (operator === 'greater_than') {
      isMatch = parseFloat(userVal) > parseFloat(value);
    } else if (operator === 'less_than') {
      isMatch = parseFloat(userVal) < parseFloat(value);
    }

    if (isMatch) {
      if (priceModifierType === 'add') {
        finalPrice += modifierValue;
      } else if (priceModifierType === 'multiply') {
        finalPrice *= modifierValue;
      } else if (priceModifierType === 'fixed') {
        finalPrice = modifierValue;
      }
    }
  });

  return Math.max(0, finalPrice);
};

module.exports = {
  evaluateFormula,
  evaluatePricingRules
};
