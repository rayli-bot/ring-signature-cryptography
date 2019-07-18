import { RingSignature } from '../src/ring';
import 'mocha';
import { expect } from 'chai';
import { ec } from 'elliptic';

describe('Ring Signature', () => {
  const members = 5;

  let ring: RingSignature;
  let pairs: ec.KeyPair[] = [];
  let curve: ec = new ec('ed25519');

  // Generate Test Signature for Each Member
  const message = "i am foo";
  const fake = "i am foo bar";

  before('generating random keypairs', () => {
    for (let i = 0 ; i < members ; i++) {
      const pair = curve.genKeyPair();
      pairs.push(pair);
    }
  });

  it('should create ring signature object', () => {
    ring = new RingSignature(
      pairs.map(x => 
        x.getPublic().encodeCompressed('hex').toString('hex')
      ),
      curve
    );
    expect(ring).exist;
  });

  it('should match each keypair', () => {
    ring.keys.forEach((key, i) => {
      expect(pairs[i].getPublic().encodeCompressed('hex').toString('hex'))
        .equals(key.getPublic().encodeCompressed('hex').toString('hex'));
    });
  });

  it('should verify signature', () => {
    for (let i = 0 ; i < members ; i++) {
      const str = pairs[0].getPrivate().toString('hex');
      // console.time('sign');
      const signature = ring.sign(message, 0, str);
      // console.timeEnd('sign');
      // console.time('verify');
      expect(ring.verify(message, signature)).true;
      // console.timeEnd('verify');
      expect(ring.verify(fake, signature)).false;
    }
  }).timeout(10000);

  it('should verify signature for each member', () => {
    for (let i = 0 ; i < members ; i++) {
      const str = pairs[i].getPrivate().toString('hex');
      const signature = ring.sign(message, i, str);
      expect(ring.verify(message, signature)).true;
      expect(ring.verify(fake, signature)).false;
    }
  }).timeout(10000);
});