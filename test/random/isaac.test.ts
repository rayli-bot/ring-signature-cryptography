import { ISAAC } from '../../src';
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

  it('should generate random number in range', () => {
    const g = new ISAAC();
    const min = 0;
    const max = 100;
    for (let i = 0 ; i < iterator ; i++) {
      const n = g.range(min, max);
      expect(n).gte(min).lte(max);
    }
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
        .equals("e28bdb24750b67a6c8a411c9fd04ff79b354a11f51344c8f61529a349b61581f")
        .equals(x2.toString('hex'))
        .not.equals(x3.toString('hex'));

      expect(x3.toString('hex')).equals('1be9c134275310179717d52b8eaca7d247c95067c6d27aab22ad37f84f724cac');

      expect(x1.byteLength)
        .equals(x2.byteLength)
        .equals(x3.byteLength)
        .equals(32);
    }
  });

  it('should resync two different prng with import state', () => {
    const g1 = new ISAAC(seed);
    const g2 = new ISAAC(fake);

    for (let i = 0 ; i < 3 ; i++)
      expect(g1.random()).not.equals(g2.random());

    // sync p2 to p1
    g1.import(g2.export());

    for (let i = 0 ; i < 3 ; i++)
      expect(g1.random()).equals(g2.random());

    // test sync non-sequentially

    g1.random();
    g1.random();

    const g1s = [g1.random(), g1.random(), g1.random()];

    g2.random();
    g2.random();

    const g2s = [g2.random(), g2.random(), g2.random()];

    for (let i = 0 ; i < 3 ; i++)
      expect(g1s[i]).equals(g2s[i]);
  });
});