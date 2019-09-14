import { NTRUMLS } from '../../src/signature/ntrumls';
import 'mocha';
import { expect } from 'chai';
import { Bytes } from '../../src/util';

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

  it('should sign correctly', () => {
    const message = 'foo-bar';
    const ntru = new NTRUMLS({ N: 443, p: 3, q: 65536, d: 10, Bs: 138, Bt: 46 });
    const pair = ntru.create();
    const sign = ntru.sign(message, pair);
    
    const v1 = ntru.verify(message, sign, pair.pub);
    expect(v1).to.true;

    expect(ntru.verify('foo-bar1', sign, pair.pub)).to.false;
    expect(ntru.verify('message', sign, pair.pub)).to.false;

    expect(ntru.verify(message, sign.concat(...[-1,0,0]), pair.pub)).to.false;

    expect(ntru.verify(message, sign, ntru.create().pub)).to.false;
  });
});