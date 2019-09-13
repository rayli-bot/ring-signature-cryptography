import { Polynomial, PolynomialRing } from '../../src';
import 'mocha';
import { expect } from 'chai';

describe('Polynomial Utility', () => {

  it('should add correctly in ring', () => {
    const tests = [
      { N: 4, a: [3,2,1], b: [1,0,1], p: 3, z: [1,2,2] },
      { N: 4, a: [3,2,1], b: [1,0,1], p: undefined, z: [4,2,2] },
    ];

    for (let t of tests) {
      const a = new Polynomial(t.a);
      const b = new Polynomial(t.b);
      const ring = new PolynomialRing(t.N);
      expect(ring.add(a, b, t.p))
        .deep.equal(new Polynomial(t.z))
        .deep.equal(t.z);
    }
  });

  it('should substract correctly in ring', () => {
    const tests = [
      { N: 4, a: [3,2,1], b: [2,2,2], p: 3, z: [1,0,2] },
      { N: 4, a: [3,2,1], b: [2,2,2], p: undefined, z: [1,0,-1] },
    ];

    for (let t of tests) {
      const a = new Polynomial(t.a);
      const b = new Polynomial(t.b);
      const ring = new PolynomialRing(t.N);
      expect(ring.sub(a, b, t.p))
        .deep.equal(new Polynomial(t.z))
        .deep.equal(t.z);
    }
  });

  it('should multiply correctly in ring', () => {
    const tests = [
      { N: 3, a: [3,2,1], b: [2,2,2], p: 3, z: [0,0,0] },
      { N: 3, a: [3,2,1], b: [2,2,2], p: undefined, z: [12,12,12] },
    ];

    for (let t of tests) {
      const a = new Polynomial(t.a);
      const b = new Polynomial(t.b);
      const ring = new PolynomialRing(t.N);
      expect(ring.mul(a, b, t.p))
        .deep.equal(new Polynomial(t.z))
        .deep.equal(t.z);
    }
  });

  it('should compute the division correctly in ring', () => {
    const test = {
       N: 5, p: 3,
       a: [1,0,1],
       z: [1,2,2,1,1],
    };

    let r: Array<Polynomial> = [];
    let q: Array<Polynomial> = [];
    let s: Array<Polynomial> = [];
    let t: Array<Polynomial> = [];

    const a = new Polynomial(test.a);
    const ring = new PolynomialRing(test.N);

    // r[0] = a, r[1] = Ring
    r.push(a); r.push(ring.R);
    // s[0] = 1 s[1] = 0
    s.push(new Polynomial([1]));
    s.push(new Polynomial([0]));
    // t[0] = 0 t[1] = 1
    t.push(new Polynomial([0]));
    t.push(new Polynomial([1]));
    // q[0] = q[1] = 0
    q.push(new Polynomial([0]));
    q.push(new Polynomial([0]));

    let q2 = ring.div(r[0], r[1], test.p);
    q.push(q2.q); r.push(q2.r);
    expect(q2.q).deep.equals([]);
    expect(q2.r).deep.equals([1,0,1]);

    let q3 = ring.div(r[1], r[2], test.p);
    q.push(q3.q); r.push(q3.r);
    expect(q3.q).deep.equals([0,2,0,1]);
    expect(q3.r).deep.equals([2,1]);

    let q4 = ring.div(r[2], r[3], test.p);
    q.push(q4.q); r.push(q4.r);
    expect(q4.q).deep.equals([1,1]);
    expect(q4.r).deep.equals([2]);

    let q5 = ring.div(r[3], r[4], test.p);
    q.push(q5.q); r.push(q5.r);
    expect(q5.q).deep.equals([1,2]);
    expect(q5.r).deep.equals([]);

    // s[i] = s[i-2] - q[i] * s[k-1] mod p
    // t[i] = t[i-2] - q[i] * t[k-1] mod p
    for (let k = 2 ; k < r.length - 1; k++) {
      const si = s[k-2].sub(q[k].mul(s[k-1])).mod(test.p);
      const ti = t[k-2].sub(q[k].mul(t[k-1])).mod(test.p);
      s.push(si); t.push(ti);
    }

    expect(s.length).equals(t.length).equals(5);
    expect(s[s.length - 1]).deep.equals(test.z);
  });

  it('should compute the egcd correctly in ring with prime modulo', () => {
    const tests = [
      {
        N: 5, p: 3,
        a: [1,0,1],
        z: [1,2,2,1,1],
      },
      {
        N: 11, p: 3,
        a: [-1,1,1,0,-1,0,1,0,0,1,-1],
        z: [1,2,0,2,2,1,0,2,1,2],
      },
      {
        N: 7, p: 3,
        a: [-1,0,1,1,-1,0,1],
        z: [1,1,1,1,0,2,1]
      },
      {
        N: 11, p: 3,
        a: [-1, 1, 1, 0, -1, 0, 1, 0, 0, 1, -1],
        z: [1, 2, 0, 2, 2, 1, 0, 2, 1, 2]
      },
      {
        N: 4, p: 5,
        a: [1,0,1],
        z: [1]
      },
      {
        N: 4, p: 2,
        a: [-1,0,1,1],
        z: [1,1,1]
      },
      {
        N: 6, p: 2,
        a: [-1,0,1,1],
        z: [0,0,1,0,1,1]
      },
      {
        N: 11, p: 2,
        a: [-1, 1, 1, 0, -1, 0, 1, 0, 0, 1, -1],
        z: [1, 1, 0, 0, 0, 1]
      },
    ];

    for (let t of tests) {
      const a = new Polynomial(t.a);
      const ring = new PolynomialRing(t.N);
      const finv = ring.egcd(a, t.p);
      expect(finv).deep.equal(t.z);
    }
  });

  it('should calculate correct GF(2^m) inverse in ring correctly', () => {
    const tests = [
      {
        N: 11, p: 32,
        a: [-1, 1, 1, 0, -1, 0, 1, 0, 0, 1, -1],
        z: [5, 9, 6, 16, 4, 15, 16, 22, 20, 18, 30]
      }
    ];

    for (let t of tests) {
      const a = new Polynomial(t.a);
      const ring = new PolynomialRing(t.N);
      const finv = ring.invGF2M(a, t.p);
      expect(finv).deep.equal(t.z);
    }
  });

  it('should calculate correct inverse in ring correctly', () => {
    const tests = [
      {
        N: 11, p: 32,
        a: [-1, 1, 1, 0, -1, 0, 1, 0, 0, 1, -1],
        z: [5, 9, 6, 16, 4, 15, 16, 22, 20, 18, 30]
      },
      {
        N: 11, p: 2,
        a: [-1, 1, 1, 0, -1, 0, 1, 0, 0, 1, -1],
        z: [1, 1, 0, 0, 0, 1]
      },
      {
        N: 11, p: 3,
        a: [-1, 1, 1, 0, -1, 0, 1, 0, 0, 1, -1],
        z: [1, 2, 0, 2, 2, 1, 0, 2, 1, 2]
      },
    ];

    for (let t of tests) {
      const a = new Polynomial(t.a);
      const ring = new PolynomialRing(t.N);
      const finv = ring.inv(a, t.p);
      expect(finv).deep.equal(t.z);
    }
  });

  it('should demonstrate the computation within a NTRU cryptosystem', () => {
    // System Parameters
    const params = { N: 11, p: 3, q: 32 };

    // Generate Random Polynomials {f, g} for Keypair Generation
    const f = new Polynomial([-1, 1, 1, 0, -1, 0, 1, 0, 0, 1, -1]);
    const g = new Polynomial([-1, 0, 1, 1, 0, 1, 0, 0, -1, 0, -1]);

    const ring = new PolynomialRing(params.N);
    const fp = ring.inv(f, params.p); const fq = ring.inv(f, params.q);
    expect(fp).deep.equals([1, 2, 0, 2, 2, 1, 0, 2, 1, 2]);
    expect(fq).deep.equals([5, 9, 6, 16, 4, 15, 16, 22, 20, 18, 30]);

    // Getting the Public Key
    const h1 = ring.mul(new Polynomial([params.p]), fq, params.q);
    const h = ring.mul(h1, g, params.q);
    expect(h).deep.equals([8, 25, 22, 20, 12, 24, 15, 19, 12, 19, 16]);

    // The Message in Polynomial
    const m = new Polynomial([-1,0,0,1,-1,0,0,0,-1,1,1]);
    // The Random Number in Polynomial
    const r = new Polynomial([-1,0,1,1,1,-1,0,-1]);

    // Encryption using public key {h}
    const e1 = ring.mul(r, h, params.q);
    const e = ring.add(e1, m, params.q);
    expect(e).deep.equals([14, 11, 26, 24, 14, 16, 30, 7, 25, 6, 19]);

    // Decryption with Private Key {f}
    const a = ring.mul(f, e, params.q).center(params.q);
    expect(a).deep.equals([3, -7, -10, -11, 10, 7, 6, 7, 5, -3, -7]);
    const b = a.mod(params.p).center(params.p);
    expect(b).deep.equals([0, -1, -1, 1, 1, 1, 0, 1, -1, 0, -1]);
    const d = ring.mul(fp, b, params.p).center(params.p);
    expect(d).deep.equals(m);
  });
});
