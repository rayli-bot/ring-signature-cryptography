import { Polynomial } from '../../src';
import 'mocha';
import { expect } from 'chai';

describe('Polynomial Utility', () => {

  it('should return correct string', () => {
    const tests = [
      { a: [3,4,-2], d: false, s: '-2x^2 + 4x + 3' },
      { a: [4,1,-12,0,1,-6], d: false, s: '-6x^5 + 1x^4 + -12x^2 + 1x + 4' },
      { a: [14,12,-2,7,2,-4,-12], d: false, s: '-12x^6 + -4x^5 + 2x^4 + 7x^3 + -2x^2 + 12x + 14' },
      { a: [14,12,-2,0,0,0,-12], d: true, s: '-12x^6 + 0x^5 + 0x^4 + 0x^3 + -2x^2 + 12x + 14' },
    ];

    for (let t of tests) {
      const p = new Polynomial(t.a);
      expect(p.toString(t.d)).equals(t.s);
    }
  });

  it('should get the degree of polynomial', () => {
    const tests = [
      { a: [1,0,1,0], z: 2 },
      { a: [0,1,0,0], z: 1 },
      { a: [0,0,0,0], z: 0 },
      { a: [], z: 0 },
    ];

    for (let t of tests) {
      expect(new Polynomial(t.a).degree()).to.equals(t.z);
    }
  });

  it('should check the polynomial is zero or not', () => {
    const tests = [
      { a: [0,0,0,0], z: true },
      { a: [0], z: true },
      { a: [1,0,0,0], z: false },
      { a: [0,0,0,1], z: false },
      { a: [], z: true },
    ];

    for (let t of tests) {
      expect(new Polynomial(t.a).isZero()).to.equals(t.z);
    }
  });

  it('should get the largest coefficient', () => {
    const tests = [
      { a: [3,4,-2], z: -2 },
      { a: [4,1,-12,0,1,-6], z: -6 },
      { a: [-3,0,-2,1,17], z: 17 }
    ];

    for (let t of tests) {
      expect(new Polynomial(t.a).lc())
        .deep.equal(t.z);
    }
  });

  it('should calculate correct polynomial addition', () => {
    const tests = [
      { a: [3,4,-2], b: [-7,-10,17], z: [-4,-6,15] },
      { a: [4,1,-12,0,1,-6], b: [3,8,6,-1,0], z: [7,9,-6,-1,1,-6]},
      { a: [-3,0,-2,1,17], b: [14,12,-2,7,2,-4,-12], z: [11,12,-4,8,19,-4,-12] }
    ];

    for (let t of tests) {
      expect(new Polynomial(t.a).add(new Polynomial(t.b)))
        .deep.equal(t.z);
    }
  });

  it('should calculate correct polynomial substration', () => {
    const tests = [
      { a: [3,4,-5,0,18], b: [7,3,-12,-3,7,-9], z: [-4,1,7,3,11,9] },
      { a: [-5,0,-3,18,-7,9,11], b: [-1,1,-12,10,5], z: [-4,-1,9,8,-12,9,11] },
      { a: [2,0,0,2,0,0], b: [0,1,0,1], z: [2,-1,0,1,0,0] }
    ];

    for (let t of tests) {
      expect(new Polynomial(t.a).sub(new Polynomial(t.b)))
        .deep.equal(t.z);
    }
  });

  it('should calculate correct polynomial multiplication', () => {
    const tests = [
      { a: [3,0,0], b: [4,-5,7], z: [12,-15,21] },
      { a: [-3,5,-2], b: [-3,5,7], z: [9,-30,10,25,-14] },
      { a: [3,0,0,-1], b: [4], z: [12,0,0,-4]},
      { a: [0,1], b: [2, 1], z: [0,2,1]}
    ];

    for (let t of tests) {
      expect(new Polynomial(t.a).mul(new Polynomial(t.b)))
        .deep.equal(t.z);
    }
  });

  it('should calculate correct polynomial modulo', () => {
    const tests = [
      { a: [1, 0, -1, 1, 1, 0, -1], b: 3, z: [1, 0, 2, 1, 1, 0, 2] },
      { a: [3,2,1], b: 2, z: [1,0,1] },
    ];

    for (let t of tests) {
      expect(new Polynomial(t.a).mod(t.b))
        .deep.equal(t.z);
    }
  });

  it('should clone the polynomial', () => {
    const tests = [
      [1, 0, -1, 1, 1, 0, -1]
    ];

    for (let t of tests) {
      const p = new Polynomial(t);
      expect(p).deep.equal(p.clone());
    }
  });

  it('should fill the polynomial with preset value', () => {
    for (let i = 10 ; i < 100 ; i++) {
      const p = new Polynomial(i, i);
      expect(p.length).equals(i);
      expect(p).deep.equal(new Array(i).fill(i));
    }
  });

  it('should compare to a single value of all coefficient', () => {
    for (let i = 10 ; i < 100 ; i++) {
      const a = new Polynomial(i, i - 1);
      const b = new Polynomial(i, i);
      const c = new Polynomial(i, i + 1);
      expect(a.gt(i)).to.false;
      expect(a.gte(i)).to.false;
      expect(a.lt(i)).to.true;
      expect(a.lte(i)).to.true;

      expect(b.gt(i)).to.false;
      expect(b.gte(i)).to.true;
      expect(b.lt(i)).to.false;
      expect(b.lte(i)).to.true;

      expect(c.gt(i)).to.true;
      expect(c.gte(i)).to.true;
      expect(c.lt(i)).to.false;
      expect(c.lte(i)).to.false;
    }
  });
});
