import { NTRUMLS, ParamSet } from '../../src/signature/ntrumls';
import 'mocha';
import { expect } from 'chai';
import { Bytes } from '../../src/util';
import { sha3_256 } from 'js-sha3';

describe('NTRUMLS', () => {

  it('should return correct trits from bytes', () => {
    const tests = [
      { a: [1,2], b: [0,0,0,0,0,-1,0,0,0,1,0,0,0,0,0,0] },
      { a: [0,8,1,4,4], b: [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,-1,0,0,0,0,0,0] },
    ];

    for (let test of tests) {
      let bytes = new Uint8Array(test.a);
      expect(Bytes.bytesToTrits(bytes)).deep.equals(test.b);
    }
  });

  it('should pack private key correctly', () => {
    const n1 = new NTRUMLS(ParamSet.bit126);
    const pair = n1.create();
    const priv = n1.export();

    const n2 = new NTRUMLS(ParamSet.bit126);
    n2.import(priv);

    const n3 = new NTRUMLS(ParamSet.bit126);
    n3.import(pair);

    expect(sha3_256(JSON.stringify(n1.getPrivateKey())))
      .equals(sha3_256(JSON.stringify(n2.getPrivateKey())))
      .equals(sha3_256(JSON.stringify(n3.getPrivateKey())))

    expect(sha3_256(JSON.stringify(n1.getPublicKey())))
      .equals(sha3_256(JSON.stringify(n2.getPublicKey())))
      .equals(sha3_256(JSON.stringify(n3.getPublicKey())))

  });

  it('should sign correctly', () => {
    const message = 'foo-bar';
    const ntru = new NTRUMLS(ParamSet.bit126);
    const pair = ntru.create();

    const sign = ntru.sign(message, pair);
    const challenge = ntru.challenge(message, pair.pub);

    expect(ntru.verify(message, sign, pair.pub)).to.true;

    expect(ntru.verify(message, challenge.sp, pair.pub)).to.false;
    expect(ntru.verify('foo-bar1', sign, pair.pub)).to.false;
    expect(ntru.verify('message', sign, pair.pub)).to.false;

    expect(ntru.verify(message, sign.concat(...[-1,0,0]), pair.pub)).to.false;

    expect(ntru.verify(message, sign, ntru.create().pub)).to.false;
  }).timeout(10000);

});