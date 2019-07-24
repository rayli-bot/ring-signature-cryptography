import { ALEA } from '../src';
import 'mocha';
import { expect } from 'chai';

describe('Psuedo Random Generator - ALEA', () => {

  const iterator = 100;

  it('should be the same from the same seed', () => {
    const g1 = new ALEA([1]);
    const g2 = new ALEA([3]);
    const g3 = new ALEA([1]);

    const numbers = [];
    const s = new ALEA([3]);


    for (let i = 0 ; i < iterator ; i++) {
      expect(g1.random()).equals(g3.random()).not.equals(g2.random());
      numbers.push(s.random());
    }

    // Check distinct numbers
    const uniques = [...new Set(numbers)];
    expect(uniques.length).equals(numbers.length);
  });

  it('benchmark random generator', () => {
    const ite = 100000;
    const g = new ALEA();
    console.time('\t100.000 runs');
    for (let i = 0 ; i < ite ; ++i)
      g.random();
    console.timeEnd('\t100.000 runs');
  });

  it('should generate known values', () => {
    const g = new ALEA([12345]);

    const values = [
      0.27138191112317145,
      0.19615925149992108,
      0.6810678059700876
    ];

    for (const value of values) {
      expect(g.random()).equals(value);
    }
  });

  it('should generate known values with UINT32 Format', () => {
    const g = new ALEA([12345]);

    const values = [
      1165576433,
      842497570,
      2925163953
    ];

    for (const value of values) {
      expect(g.uint32()).equals(value);
    }
  });

  it('should generate known values with Fract53 Format', () => {
    const g = new ALEA([12345]);

    const values = [
      0.27138191116884325,
      0.6810678062004586,
      0.3407802057882554
    ];

    for (const value of values) {
      expect(g.fract53()).equals(value);
    }
  });

  it('should generate random number in range', () => {
    const g = new ALEA();
    const min = 0;
    const max = 100;
    for (let i = 0 ; i < iterator ; i++) {
      const n = g.range(min, max);
      expect(n).gte(min).lte(max);
    }
  });

  it('should generate known values with Byte Format', () => {
    const g = new ALEA([12345]);
    const length = 32;

    const values = [
      "4532aefd57fcb82b8f6ffaf5a7ce00b8fe79f99f5fb0e90e5a268ba88fa1a649",
      "5242d3d03110d9a0b05fa28fec6e9852fa55913ee83e10d0dceb286ac2dac7d3",
      "d0c19df848f51681907efe1a8f3ee3453923919fa7c5f40048df65a3d0ccb569"
    ];

    for (const value of values) {
      expect(Buffer.from(g.bytes(length)).toString('hex')).equals(value);
    }
  });

  it('should import state and sync prng', () => {
    const g1 = new ALEA([200]);

    // Generate some numbers
    for (let i = 0 ; i < 3 ; i++) g1.random();

    const state = g1.export();

    const g2 = new ALEA();
    g2.import(state);

    for (let i = 0 ; i < iterator ; i++)
      expect(g1.random()).equals(g2.random());
  });

  it('should resync two different prng with import state', () => {
    const g1 = new ALEA([20000]);
    const g2 = new ALEA([9000]);

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