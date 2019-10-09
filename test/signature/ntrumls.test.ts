import { NTRUMLS, ParamSet } from '../../src/signature/ntrumls';
import 'mocha';
import { expect } from 'chai';
import { Bytes, Polynomial } from '../../src/util';
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

    expect(sha3_256(JSON.stringify(n1.priv())))
      .equals(sha3_256(JSON.stringify(n2.priv())))
      .equals(sha3_256(JSON.stringify(n3.priv())))

    expect(sha3_256(JSON.stringify(n1.pub())))
      .equals(sha3_256(JSON.stringify(n2.pub())))
      .equals(sha3_256(JSON.stringify(n3.pub())))
  });

  it('should sign correctly', () => {
    const message = 'foo-bar';
    const ntru = new NTRUMLS(ParamSet.bit126);
    const pair = ntru.create();

    const pubKey = ntru.pub(true);

    const sign = ntru.sign(message, pair);
    const challenge = ntru.challenge(message, pair.pub);

    // Should Get the Same Byte Length everytime
    expect(pubKey.byteLength).equals(sign.byteLength).equals(1126);

    expect(ntru.verify(message, sign, pair.pub)).to.true;

    expect(ntru.verify(message, new Uint32Array(challenge.sp).buffer, pair.pub)).to.false;
    expect(ntru.verify('foo-bar1', sign, pair.pub)).to.false;
    expect(ntru.verify('message', sign, pair.pub)).to.false;

    expect(ntru.verify(message, sign, ntru.create().pub)).to.false;
  }).timeout(10000);

  it('should benchmark NTRUMLS scheme performance', async (done) => {
    const rounds = 10;
    const message = 'foo-bar';

    let ntru = new NTRUMLS(ParamSet.bit126);

    console.time("Setup for "+rounds+" times")
    for (let i = 0 ; i < rounds ; i++) {
      ntru = new NTRUMLS(ParamSet.bit126);
      ntru.create();
    }
    console.timeEnd("Setup for "+rounds+" times")

    let pair = ntru.create();
    console.time("Sign for "+rounds+" times")
    for (let i = 0 ; i < rounds ; i++) {
      ntru.sign(message, pair);
    }
    console.timeEnd("Sign for "+rounds+" times")

    let signs = [];
    for (let i = 0 ; i < rounds ; i++) {
      signs.push(ntru.sign(message, pair));
    }

    console.time("Verify for "+rounds+" times")
    for (let i = 0 ; i < rounds ; i++) {
      ntru.verify(message, signs[i], pair.pub);
    }
    console.timeEnd("Verify for "+rounds+" times")

    done();
  }).timeout(100000);
});