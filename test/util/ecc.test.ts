import { random, randomKeyPair, randomPoint } from '../../src';
import 'mocha';
import { expect } from 'chai';
import { ec } from 'elliptic';

describe('Ring Signature Utility', () => {

  const iterator = 100;
  const seed = "i am seed 0";
  const fake = "i am seed 1";
  const curve = new ec('ed25519');

  it('should generate same number from same seed', () => {
    for (let i = 0 ; i < iterator ; i++) {
      expect(random(curve.n as any, seed).toString('hex'))
        .equals(random(curve.n as any, seed).toString('hex'))
        .not.equals(random(curve.n as any).toString("hex"))
        .not.equals(random(curve.n as any, fake).toString('hex'));
    }
  }).timeout(10000);

  it('should generate same keypair from same seed', () => {
    for (let i = 0 ; i < iterator ; i++) {
      expect(randomKeyPair(curve, seed).inspect())
        .equals(randomKeyPair(curve, seed).inspect())
        .not.equals(randomKeyPair(curve).inspect())
        .not.equals(randomKeyPair(curve, fake).inspect());
    }
  }).timeout(10000);

  it('should generate same point from same seed', () => {
    for (let i = 0 ; i < iterator ; i++) {
      expect(randomPoint(curve, seed).inspect())
        .equals(randomPoint(curve, seed).inspect())
        .not.equals(randomPoint(curve).inspect())
        .not.equals(randomPoint(curve, fake).inspect());
    }
  }).timeout(10000);
});