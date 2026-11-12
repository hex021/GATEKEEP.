/**
 * VibeSync Test Harness
 * Lightweight, zero-dependency testing harness supporting synchronous and asynchronous tests,
 * expectation assertions, tier-based tagging, and detailed failure diagnostics.
 */

class TestContext {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0,
    };
    this.failures = [];
  }

  suite(name, fn) {
    const previousSuite = this.currentSuite;
    const suiteObj = {
      name,
      tests: [],
      parent: previousSuite,
    };
    this.suites.push(suiteObj);
    this.currentSuite = suiteObj;
    try {
      fn();
    } finally {
      this.currentSuite = previousSuite;
    }
  }

  test(name, fn, options = {}) {
    const testCase = {
      name,
      fn,
      suite: this.currentSuite ? this.currentSuite.name : 'Default',
      skip: options.skip || false,
    };
    if (this.currentSuite) {
      this.currentSuite.tests.push(testCase);
    } else {
      this.suites.push({ name: 'Root', tests: [testCase] });
    }
  }

  async run(filter = null) {
    const startTime = performance.now();
    this.stats = { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 };
    this.failures = [];

    for (const suite of this.suites) {
      for (const t of suite.tests) {
        if (filter && !t.name.toLowerCase().includes(filter.toLowerCase()) && !suite.name.toLowerCase().includes(filter.toLowerCase())) {
          continue;
        }

        this.stats.total++;
        if (t.skip) {
          this.stats.skipped++;
          continue;
        }

        const tStart = performance.now();
        try {
          await t.fn();
          this.stats.passed++;
        } catch (err) {
          this.stats.failed++;
          this.failures.push({
            suite: suite.name,
            test: t.name,
            error: err,
            durationMs: performance.now() - tStart,
          });
        }
      }
    }
    this.stats.durationMs = performance.now() - startTime;
    return this.getReport();
  }

  getReport() {
    return {
      stats: { ...this.stats },
      failures: [...this.failures],
    };
  }
}

export const globalHarness = new TestContext();

export function suite(name, fn) {
  globalHarness.suite(name, fn);
}

export function test(name, fn, options) {
  globalHarness.test(name, fn, options);
}

export function expect(actual) {
  const matchers = (isNot = false) => ({
    toBe(expected) {
      const pass = actual === expected;
      if (isNot ? pass : !pass) {
        throw new Error(isNot ? `Expected NOT ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}` : `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      const pass = a === b;
      if (isNot ? pass : !pass) {
        throw new Error(isNot ? `Expected deep inequality but both were:\n${a}` : `Expected deep equality:\nExpected: ${b}\nActual:   ${a}`);
      }
    },
    toBeTruthy() {
      const pass = !!actual;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${isNot ? 'falsy' : 'truthy'} value but got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      const pass = !actual;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${isNot ? 'truthy' : 'falsy'} value but got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(val) {
      if (typeof actual !== 'number' || (isNot ? actual > val : actual <= val)) {
        throw new Error(`Expected ${actual} ${isNot ? '<=' : '>'} ${val}`);
      }
    },
    toBeGreaterThanOrEqual(val) {
      if (typeof actual !== 'number' || (isNot ? actual >= val : actual < val)) {
        throw new Error(`Expected ${actual} ${isNot ? '<' : '>='} ${val}`);
      }
    },
    toBeLessThan(val) {
      if (typeof actual !== 'number' || (isNot ? actual < val : actual >= val)) {
        throw new Error(`Expected ${actual} ${isNot ? '>=' : '<'} ${val}`);
      }
    },
    toBeLessThanOrEqual(val) {
      if (typeof actual !== 'number' || (isNot ? actual <= val : actual > val)) {
        throw new Error(`Expected ${actual} ${isNot ? '>' : '<='} ${val}`);
      }
    },
    toBeCloseTo(expected, delta = 0.001) {
      const diff = Math.abs(actual - expected);
      const pass = diff <= delta;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? 'NOT to be close to' : 'to be close to'} ${expected} (diff: ${diff})`);
      }
    },
    toContain(sub) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(sub);
      } else if (Array.isArray(actual)) {
        pass = actual.includes(sub);
      } else {
        throw new Error(`toContain only supports strings and arrays, got ${typeof actual}`);
      }
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(sub)}`);
      }
    },
    toHaveLength(len) {
      const pass = actual && actual.length === len;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected length ${isNot ? 'NOT ' : ''}${len} but got ${actual ? actual.length : 'undefined'}`);
      }
    },
    toMatch(regex) {
      const pass = regex.test(String(actual));
      if (isNot ? pass : !pass) {
        throw new Error(`Expected "${actual}" ${isNot ? 'NOT to match' : 'to match'} pattern ${regex}`);
      }
    },
    toThrow(expectedMessage) {
      if (typeof actual !== 'function') {
        throw new Error(`toThrow requires a function, got ${typeof actual}`);
      }
      let threw = false;
      let caughtError = null;
      try {
        actual();
      } catch (err) {
        threw = true;
        caughtError = err;
      }
      if (isNot) {
        if (threw) throw new Error(`Expected function NOT to throw, but it threw: ${caughtError.message}`);
        return;
      }
      if (!threw) {
        throw new Error(`Expected function to throw an error, but it did not`);
      }
      if (expectedMessage && !caughtError.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to include "${expectedMessage}" but got "${caughtError.message}"`);
      }
    },
  });

  const base = matchers(false);
  base.not = matchers(true);
  return base;
}
