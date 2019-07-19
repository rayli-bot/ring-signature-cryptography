import { LinkableRingSignature } from '../src';
import 'mocha';
import { expect } from 'chai';
import { ec } from 'elliptic';

describe('Linkable Ring Signature', () => {
  const members = 5;

  let ring: LinkableRingSignature;
  let pairs: ec.KeyPair[] = [];
  const curveName = 'ed25519';
  let curve: ec = new ec(curveName);

  // Generate Test Signature for Each Member
  const message = "i am foo";
  const fake = "i am foo bar";

  // Mock as declared H Point
  const h = curve.genKeyPair().getPublic().encodeCompressed('hex');

  before('generating random keypairs', () => {
    for (let i = 0 ; i < members ; i++) {
      const pair = curve.genKeyPair();
      pairs.push(pair);
    }
  });

  it('should create ring signature object', () => {
    ring = new LinkableRingSignature(
      pairs.map(x => 
        x.getPublic().encodeCompressed('hex').toString('hex')
      ),
      h.toString('hex'),
      curveName
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
      console.time('\tLinkable Ring Signature : sign & verify');
      const str = pairs[0].getPrivate().toString('hex');
      // console.time('sign');
      const signature = ring.sign(message, 0, str);
      // console.timeEnd('sign');
      // console.time('verify');
      expect(ring.verify(message, signature)).true;
      console.timeEnd('\tLinkable Ring Signature : sign & verify');
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

  it('should show linking between signatures', () => {
    let signs = [];
    const m1 = "i am msg 1";
    const m2 = "i am msg 2";
    for (let i = 0 ; i < members ; i++) {
      const str = pairs[i].getPrivate().toString('hex');
      const s1 = ring.sign(m1, i, str);
      const s2 = ring.sign(m2, i, str);
      expect(JSON.stringify(s1)).is.not.equals(JSON.stringify(s2));
      expect(ring.isLink(m1, s1, m2, s2)).true;
      expect(ring.isLink(m2, s1, m1, s2)).false;
    }
  });
});