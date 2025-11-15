// tests/index.test.ts
import { roll, countSuccesses } from '../src/index';

describe('roll', () => {
  // Test basic rolls
  test('should return a valid result for a single 1d6 roll', () => {
    const result = roll('1d6');
    expect(result).toHaveLength(1);
    expect(result[0].total).toBeGreaterThanOrEqual(1);
    expect(result[0].total).toBeLessThanOrEqual(6);
    expect(result[0].rolls).toHaveLength(1);
    expect(result[0].notation).toBe('1d6');
  });

  test('should return a valid result for a single 2d10 roll', () => {
    const result = roll('2d10');
    expect(result[0].total).toBeGreaterThanOrEqual(2); // Minimum 1+1
    expect(result[0].total).toBeLessThanOrEqual(20); // Maximum 10+10
    expect(result[0].rolls).toHaveLength(2);
  });

  // Test compound rolls
  test('should handle compound rolls', () => {
    const result = roll('1d6, 2d10+5');
    expect(result).toHaveLength(2);

    // Check first result
    expect(result[0].total).toBeGreaterThanOrEqual(1);
    expect(result[0].total).toBeLessThanOrEqual(6);
    expect(result[0].notation).toBe('1d6');

    // Check second result
    expect(result[1].total).toBeGreaterThanOrEqual(2 + 5);
    expect(result[1].total).toBeLessThanOrEqual(20 + 5);
    expect(result[1].notation).toBe('2d10+5');
  });

  // Test error handling
  test('should throw an error for invalid notation', () => {
    expect(() => roll('invalid')).toThrow('Invalid dice notation: "invalid". Expected format like "4d6r<2!>5kh3+5".');
  });

  test('should throw an error for invalid part of a compound roll', () => {
    expect(() => roll('1d6, invalid')).toThrow('Invalid dice notation: "invalid". Expected format like "4d6r<2!>5kh3+5".');
  });

  test('should throw an error for zero dice', () => {
    expect(() => roll('0d6')).toThrow('Number of dice and number of sides must be positive.');
  });

  test('should throw an error for zero sides', () => {
    expect(() => roll('1d0')).toThrow('Number of dice and number of sides must be positive.');
  });

  test('should throw an error if rolling more than the global limit of dice', () => {
    expect(() => roll('1001d6')).toThrow('Cannot roll more than 1000 dice at once.');
  });

  // Test modifiers
  test('should handle a positive modifier', () => {
    const result = roll('1d20+5')[0];
    expect(result.total).toBeGreaterThanOrEqual(1 + 5);
    expect(result.total).toBeLessThanOrEqual(20 + 5);
  });

  test('should handle a negative modifier', () => {
    const result = roll('3d6-3')[0];
    expect(result.total).toBeGreaterThanOrEqual(3 - 3);
    expect(result.total).toBeLessThanOrEqual(18 - 3);
  });

  // --- Keep/Drop Tests ---

  describe('drop/keep operators', () => {
    test('should handle drop lowest (dl) with a deterministic roll', () => {
      expect(roll('4d1dl3')[0].total).toBe(1);
    });

    test('should handle drop lowest (dl) with a random roll', () => {
      const result = roll('4d6dl1')[0];
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeLessThanOrEqual(18);
      expect(result.rolls).toHaveLength(3);
    });

    test('should throw an error if dropping all dice', () => {
      expect(() => roll('4d6dl4')).toThrow('Cannot drop all dice or more dice than were rolled.');
    });

    test('should throw an error if dropping more dice than rolled', () => {
      expect(() => roll('4d6dl5')).toThrow('Cannot drop all dice or more dice than were rolled.');
    });

    // Tests for keep highest (kh)
    test('should handle keep highest (kh) with a deterministic roll', () => {
      expect(roll('4d1kh3')[0].total).toBe(3);
    });

    test('should handle keep highest (kh) with a random roll', () => {
      const result = roll('4d6kh3')[0];
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeLessThanOrEqual(18);
      expect(result.rolls).toHaveLength(3);
    });

    test('should throw an error if keeping more dice than rolled', () => {
      expect(() => roll('4d6kh5')).toThrow('Cannot keep more dice than were rolled.');
    });

    // Tests for keep lowest (kl)
    test('should handle keep lowest (kl) with a deterministic roll', () => {
      expect(roll('4d1kl3')[0].total).toBe(3);
    });

    test('should handle keep lowest (kl) with a random roll', () => {
      const result = roll('4d6kl3')[0];
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeLessThanOrEqual(18);
      expect(result.rolls).toHaveLength(3);
    });

    test('should throw an error if keeping zero dice', () => {
      expect(() => roll('4d6kl0')).toThrow('Cannot keep zero dice.');
    });

    // Tests for drop highest (dh)
    test('should handle drop highest (dh) with a deterministic roll', () => {
      expect(roll('4d1dh3')[0].total).toBe(1);
    });

    test('should handle drop highest (dh) with a random roll', () => {
      const result = roll('4d6dh1')[0];
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeLessThanOrEqual(18);
      expect(result.rolls).toHaveLength(3);
    });

    test('should throw an error if dropping all dice with dh', () => {
      expect(() => roll('4d6dh4')).toThrow('Cannot drop all dice or more dice than were rolled.');
    });
  });

  describe('reroll operator (r)', () => {
    test('should interact correctly with keep/drop operators', () => {
      // Reroll 1s, then keep the highest 3.
      const result = roll('4d6r=1kh3')[0];
      expect(result.total).toBeGreaterThanOrEqual(2 + 2 + 2); // Lowest possible is 2,2,2
      expect(result.total).toBeLessThanOrEqual(6 + 6 + 6);
      expect(result.rolls).toHaveLength(3);
    });

    test('should throw an error for incomplete reroll syntax', () => {
      expect(() => roll('4d6r')).toThrow();
    });
  });

  describe('reroll with limit (L)', () => {
    let randomSpy: jest.SpyInstance;

    afterEach(() => {
      // Restore the original Math.random after each test
      randomSpy.mockRestore();
    });

    test('should only reroll a limited number of dice', () => {
      // Mock Math.random to return a predictable sequence of values
      // For 3d10:
      // 1. 0.9 -> 10
      // 2. 0.9 -> 10
      // 3. 0.1 -> 2
      // Reroll:
      // 4. 0.4 -> 5
      randomSpy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9) // First roll is 10
        .mockReturnValueOnce(0.9) // Second roll is 10
        .mockReturnValueOnce(0.1) // Third roll is 2
        .mockReturnValueOnce(0.4); // Reroll is 5

      // Roll 3d10, reroll on 10, but only limit 1 time.
      const result = roll('3d10r=10L1')[0];

      // The first 10 should be rerolled to a 5.
      // The second 10 should be kept, as the limit is 1.
      // The 2 is kept.
      // Final rolls should be [5, 10, 2]
      expect(result.rolls).toEqual(expect.arrayContaining([5, 10, 2]));
      expect(result.total).toBe(17);
    });

    test('should throw an error for incomplete limit syntax', () => {
      expect(() => roll('4d6r<2L')).toThrow();
    });
  });

  describe('exploding dice (!)', () => {
    let randomSpy: jest.SpyInstance;

    afterEach(() => {
      randomSpy.mockRestore();
    });

    test('should handle a simple explosion', () => {
      // 1d6! that rolls 6, 6, 3
      randomSpy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // 6
        .mockReturnValueOnce(0.99) // 6
        .mockReturnValueOnce(0.4);  // 3
      
      const result = roll('1d6!')[0];
      expect(result.rolls).toEqual([6, 6, 3]);
      expect(result.total).toBe(15);
    });

    test('should handle a conditional explosion', () => {
      // 1d10!>8 that rolls 9, 8, 4
      randomSpy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.85) // 9
        .mockReturnValueOnce(0.75) // 8
        .mockReturnValueOnce(0.35); // 4

      const result = roll('1d10!>=8')[0];
      expect(result.rolls).toEqual([9, 8, 4]);
      expect(result.total).toBe(21);
    });

    test('should respect the explosion limit', () => {
      // 1d6!L1 that rolls 6, 6, 3
      randomSpy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // 6
        .mockReturnValueOnce(0.99); // 6 (will not be used for explosion)
      
      const result = roll('1d6!L1')[0];
      // The first 6 explodes once, rolling another 6. The limit is reached.
      expect(result.rolls).toEqual([6, 6]);
      expect(result.total).toBe(12);
    });

    test('should interact correctly with keep operator', () => {
      // 4d6!L1kh3
      // Initial rolls: 6, 5, 6, 2
      // Explosions: 4, 1
      randomSpy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // 6
        .mockReturnValueOnce(0.8)  // 5
        .mockReturnValueOnce(0.99) // 6
        .mockReturnValueOnce(0.2)  // 2
        .mockReturnValueOnce(0.6)  // 4 (explosion from first 6)
        .mockReturnValueOnce(0.05); // 1 (explosion from second 6)

      const result = roll('4d6!L1kh3')[0];
      // Initial rolls are [6, 5, 6, 2].
      // The two 6s explode once, adding a 4 and a 1.
      // The full pool of dice is [6, 5, 6, 2, 4, 1].
      // Keeping the highest 3 gives [6, 6, 5].
      expect(result.rolls).toEqual([5, 6, 6]);
      expect(result.total).toBe(17);
    });

    test('should interact correctly with reroll operator', () => {
      // 2d6r=1!L1
      // Rolls: 1, (reroll) 6, (explode) 3. Then for the second die: 6, (explode) 2
      randomSpy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.05) // 1 (reroll)
        .mockReturnValueOnce(0.99) // 6 (new roll)
        .mockReturnValueOnce(0.4)  // 3 (explosion)
        .mockReturnValueOnce(0.99) // 6 (second die)
        .mockReturnValueOnce(0.2); // 2 (explosion)

      const result = roll('2d6r=1!L1')[0];
      // Die 1 rolls a 1, is rerolled to a 6. The 6 explodes once to a 3.
      // Die 2 rolls a 6, explodes once to a 2.
      // The final pool of dice is [6, 3, 6, 2].
      expect(result.rolls).toEqual(expect.arrayContaining([6, 3, 6, 2]));
      expect(result.total).toBe(17);
    });

    test('should throw an error for incomplete explosion syntax', () => {
      expect(() => roll('4d6!L')).toThrow();
    });
  });
});

describe('countSuccesses', () => {
  let randomSpy: jest.SpyInstance;

  afterEach(() => {
    // Restore the original Math.random after each test that uses it
    if (randomSpy) {
      randomSpy.mockRestore();
    }
  });

  test('should count successes for a simple roll', () => {
    const result = countSuccesses('10d6', '>=5');
    expect(result).toHaveLength(1);
    expect(result[0].successCount).toBeGreaterThanOrEqual(0);
    expect(result[0].successCount).toBeLessThanOrEqual(10);
    expect(result[0].rolls).toHaveLength(10);
    expect(result[0].notation).toBe('10d6');
  });

  test('should handle compound rolls', () => {
    const results = countSuccesses('5d10, 2d6', '>6');
    expect(results).toHaveLength(2);

    expect(results[0].notation).toBe('5d10');
    expect(results[0].successCount).toBe(results[0].rolls.filter((r: number) => r > 6).length);

    expect(results[1].notation).toBe('2d6');
    expect(results[1].successCount).toBe(0); // Cannot roll > 6 on a d6
  });

  test('should count successes after applying all other modifiers', () => {
    // 4d6!L1kh3, count successes >=5
    // Initial rolls: 6, 5, 2, 1
    // Explosions: 4
    randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99) // 6
      .mockReturnValueOnce(0.8)  // 5
      .mockReturnValueOnce(0.2)  // 2
      .mockReturnValueOnce(0.05) // 1
      .mockReturnValueOnce(0.6); // 4 (explosion from first 6)

    const result = countSuccesses('4d6!L1kh3', '>=5')[0];
    // Full pool of dice is [6, 5, 2, 1, 4].
    // Keeping the highest 3 gives final rolls of [6, 5, 4].
    // Counting successes >= 5 on [6, 5, 4] gives 2.
    expect(result.rolls).toEqual([4, 5, 6]);
    expect(result.successCount).toBe(2);
  });

  test('should throw an error for an invalid condition string', () => {
    expect(() => countSuccesses('10d6', 'invalid')).toThrow('Invalid success condition: "invalid"');
  });
});