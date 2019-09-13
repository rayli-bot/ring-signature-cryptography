import { Modulo } from '../../src';
import 'mocha';
import { expect } from 'chai';

describe('Modulo Utility', () => {

  it('should calculate correct modulo', () => {
    const tests = [
      { a: -1, b: 3, z: 2 },
      { a: -2, b: 7, z: 5 },
      { a: -3, b: 6, z: 3 },
      { a: -4, b: 13, z: 9 },
      { a: -5, b: 5, z: 0 },
    ];

    for (let t of tests) {
      expect(Modulo.mod(t.a, t.b)).equals(t.z);
    }
  });

  it('should calculate correct modulo inverse with extended euclidean', () => {
    const tests = [
      { a: 15, b: 5, z: 5 },
      { a: 7, b: 9, z: 1 },
      { a: 12, b: 9, z: 3 },
      { a: 81, b: 57, z: 3 },
    ];

    for (let t of tests) {
      expect(Modulo.egcd(t.a, t.b).gcd).equals(t.z);
    }
  });
});
