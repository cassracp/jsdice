// src/index.ts

/**
 * Represents the detailed result of a single dice notation expression.
 */
export interface RollResult {
  /** The original dice notation string for this roll. */
  notation: string;
  /** The final total of the roll, including modifiers. */
  total: number;
  /** An array of the numbers rolled on the dice, after any keep/drop logic has been applied. */
  rolls: number[];
}

/**
 * The primary export. Rolls dice based on a notation string, supporting compound rolls.
 * @param notation The dice notation string (e.g., "1d6, 2d10+5").
 * @returns An array of RollResult objects, one for each comma-separated expression.
 * @throws Error if any part of the notation is invalid.
 */
export function roll(notation: string): RollResult[] {
  const expressions = notation.split(',').map(expr => expr.trim());
  return expressions.map(expr => evaluateSingleRoll(expr));
}

/**
 * Evaluates a single, non-compound dice notation expression.
 * @param notation A single dice notation string (e.g., "4d6kh3+5").
 * @returns A RollResult object with the detailed outcome.
 */
function evaluateSingleRoll(notation: string): RollResult {
  const GLOBAL_DICE_LIMIT = 1000;
  const MAX_EXPLOSIONS_PER_DIE = 100; // Hard cap to prevent true infinite loops

  // Regex: 1:numDice, 2:numSides, 3:reroll, 5:explode, 8:keep/drop full, 9:keep/drop op, 10:keep/drop count, 11:modifier
  const match = notation.match(/^(\d+)d(\d+)(r(?:[<>=]=?)?\d+(L\d+)?)?(!(?:[<>=]=?)?\d*(L\d+)?)?((kh|kl|dh|dl)(\d+))?\s*([+-]\s*\d+)?$/i);
  if (!match) {
    throw new Error(`Invalid dice notation: "${notation}". Expected format like "4d6r<2!>5kh3+5".`);
  }

  const numDice = parseInt(match[1], 10);
  const numSides = parseInt(match[2], 10);
  
  const rerollModifier = match[3];
  const explodeModifier = match[5];
  const keepDropOperator = match[8]?.toLowerCase();
  const keepDropCount = match[9] ? parseInt(match[9], 10) : 0;
  
  const modifierString = match[10] ? match[10].replace(/\s/g, '') : null;
  const modifier = modifierString ? parseInt(modifierString, 10) : 0;

  if (numDice <= 0 || numSides <= 0) {
    throw new Error('Number of dice and number of sides must be positive.');
  }

  if (numDice > GLOBAL_DICE_LIMIT) {
    throw new Error(`Cannot roll more than ${GLOBAL_DICE_LIMIT} dice at once.`);
  }

  // --- Validation for Keep/Drop ---
  // This validation must happen before rolls are modified by explosions
  if (keepDropOperator) {
    if ((keepDropOperator === 'dl' || keepDropOperator === 'dh') && keepDropCount >= numDice) {
      throw new Error('Cannot drop all dice or more dice than were rolled.');
    }
    if ((keepDropOperator === 'kl' || keepDropOperator === 'kh') && keepDropCount > numDice) {
      throw new Error('Cannot keep more dice than were rolled.');
    }
    if ((keepDropOperator === 'kl' || keepDropOperator === 'kh') && keepDropCount === 0) {
      throw new Error('Cannot keep zero dice.');
    }
  }

  const initialRolls: number[] = [];
  const performRoll = () => Math.floor(Math.random() * numSides) + 1;

  // --- Reroll Parsing ---
  let rerollCondition: ((roll: number) => boolean) | null = null;
  let rerollsRemaining = numDice;
  if (rerollModifier) {
    const rerollMatch = rerollModifier.match(/r([<>=]=?)?(\d+)(L(\d+))?/i);
    if (!rerollMatch) throw new Error(`Invalid reroll syntax: "${rerollModifier}"`);
    const comparison = rerollMatch[1] || '=';
    const target = parseInt(rerollMatch[2], 10);
    rerollsRemaining = rerollMatch[4] ? parseInt(rerollMatch[4], 10) : numDice;
    switch (comparison) {
      case '=': rerollCondition = (roll) => roll === target; break;
      case '<': rerollCondition = (roll) => roll < target; break;
      case '>': rerollCondition = (roll) => roll > target; break;
      case '<=': rerollCondition = (roll) => roll <= target; break;
      case '>=': rerollCondition = (roll) => roll >= target; break;
    }
  }

  // --- Explode Parsing ---
  let explodeCondition: ((roll: number) => boolean) | null = null;
  let explodeLimit = MAX_EXPLOSIONS_PER_DIE;
  if (explodeModifier) {
    const explodeMatch = explodeModifier.match(/!([<>=]=?)?(\d*)?(L(\d+))?/i);
    if (!explodeMatch) throw new Error(`Invalid explode syntax: "${explodeModifier}"`);
    const comparison = explodeMatch[1] || '=';
    const target = explodeMatch[2] ? parseInt(explodeMatch[2], 10) : numSides;
    explodeLimit = explodeMatch[4] ? parseInt(explodeMatch[4], 10) : MAX_EXPLOSIONS_PER_DIE;
    switch (comparison) {
      case '=': explodeCondition = (roll) => roll === target; break;
      case '<': explodeCondition = (roll) => roll < target; break;
      case '>': explodeCondition = (roll) => roll > target; break;
      case '<=': explodeCondition = (roll) => roll <= target; break;
      case '>=': explodeCondition = (roll) => roll >= target; break;
    }
  }

  // --- Main Rolling Loop ---
  for (let i = 0; i < numDice; i++) {
    // 1. Initial Roll (with potential reroll)
    let currentRoll = performRoll();
    if (rerollCondition && rerollCondition(currentRoll) && rerollsRemaining > 0) {
      currentRoll = performRoll(); // Reroll once
      rerollsRemaining--;
    }
    initialRolls.push(currentRoll);

    // 2. Handle Explosions
    if (explodeCondition) {
      let explosionsRemaining = explodeLimit;
      while (explodeCondition(currentRoll) && explosionsRemaining > 0) {
        currentRoll = performRoll();
        initialRolls.push(currentRoll);
        explosionsRemaining--;
      }
    }
  }

  // --- Keep/Drop Logic ---
  let finalRolls = [...initialRolls];
  if (keepDropOperator) {
    finalRolls.sort((a, b) => a - b); // Sort ascending
    const rollCount = finalRolls.length;

    switch (keepDropOperator) {
      case 'dl':
        finalRolls = finalRolls.slice(keepDropCount);
        break;
      case 'dh':
        finalRolls = finalRolls.slice(0, rollCount - keepDropCount);
        break;
      case 'kl':
        finalRolls = finalRolls.slice(0, keepDropCount);
        break;
      case 'kh':
        finalRolls = finalRolls.slice(rollCount - keepDropCount);
        break;
    }
  }

  const total = finalRolls.reduce((sum, roll) => sum + roll, 0);

  return {
    notation: notation,
    total: total + modifier,
    rolls: finalRolls,
  };
}

/**
 * Represents the result of a success count.
 */
export interface SuccessCountResult {
  /** The original dice notation string for this expression. */
  notation: string;
  /** The number of dice that met the success condition. */
  successCount: number;
  /** An array of the numbers rolled on the dice, after any keep/drop logic has been applied. */
  rolls: number[];
}

/**
 * Rolls dice and counts the number of dice that meet a given success condition.
 * @param notation The dice notation string (e.g., "10d6, 4d6kh3!").
 * @param condition The success condition string (e.g., ">=5", "<3", "=6").
 * @returns An array of SuccessCountResult objects, one for each comma-separated expression.
 */
export function countSuccesses(notation: string, condition: string): SuccessCountResult[] {
  const conditionMatch = condition.match(/([<>=]=?)?(\d+)/);
  if (!conditionMatch) {
    throw new Error(`Invalid success condition: "${condition}"`);
  }

  const comparison = conditionMatch[1] || '=';
  const target = parseInt(conditionMatch[2], 10);

  let conditionFn: (roll: number) => boolean;

  switch (comparison) {
    case '=': conditionFn = (roll) => roll === target; break;
    case '<': conditionFn = (roll) => roll < target; break;
    case '>': conditionFn = (roll) => roll > target; break;
    case '<=': conditionFn = (roll) => roll <= target; break;
    case '>=': conditionFn = (roll) => roll >= target; break;
    default:
      // This should be unreachable due to the regex
      throw new Error(`Invalid comparison operator: "${comparison}"`);
  }

  const rollResults = roll(notation);

  return rollResults.map(result => {
    const successCount = result.rolls.filter(conditionFn).length;
    return {
      notation: result.notation,
      successCount: successCount,
      rolls: result.rolls,
    };
  });
}