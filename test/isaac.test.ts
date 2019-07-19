import { ISAAC } from '../src';
import 'mocha';
import { expect } from 'chai';

describe('Psuedo Random Generator - ISSAC', () => {

  const iterator = 100;
  const seed = "i am seed 0";
  const fake = "i am seed 1";

  it('should be the same from the same seed', () => {
    const g1 = new ISAAC();
    const g2 = new ISAAC();

    for (let i = 0 ; i < iterator ; i++) {
      g1.reset(); g2.reset();
      g1.seed(seed); g2.seed(seed);
      expect(g1.rand()).equals(g2.rand());
    }
  });

  it('should be different from different seed', () => {
    const g1 = new ISAAC();
    const g2 = new ISAAC();

    for (let i = 0 ; i < iterator ; i++) {
      g1.reset(); g2.reset();
      g1.seed(fake); g2.seed(seed);
      expect(g1.rand()).not.equals(g2.rand());
    }
  });

  it('benchmark random generator', () => {
    const ite = 100000;
    const g = new ISAAC();
    console.time('\t100.000 runs');
    for (let i = 0 ; i < ite ; ++i)
      g.rand();
    console.timeEnd('\t100.000 runs');
  });

  it('should generate random bytes with seed', () => {

    for (let i = 0 ; i < iterator ; i++) {
      const g1 = new ISAAC(seed);
      const g2 = new ISAAC(seed);
      const g3 = new ISAAC(fake);

      const x1 = Buffer.from(g1.bytes(32));
      const x2 = Buffer.from(g2.bytes(32));
      const x3 = Buffer.from(g3.bytes(32));

      expect(x1.toString('hex'))
        .equals(x2.toString('hex'))
        .not.equals(x3.toString('hex'));

      expect(x1.byteLength)
        .equals(x2.byteLength)
        .equals(x3.byteLength)
        .equals(32);
    }
  });
});