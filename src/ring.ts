import { curve } from 'elliptic';
import BN from 'bn.js';
import { BasicSignature, Scheme } from './interface';
import * as Hash from 'js-sha512';
import { random } from './util';

/**
 * Classic Ring Signature Scheme
 * https://people.csail.mit.edu/rivest/pubs/RST01.pdf
 */
export class RingSignature extends Scheme<BasicSignature, BasicSignature> {

  /**
   * Initialize Ring Signature Instance
   * @param keys Public Keys of Group Members
   * @param curve The Elliptic Curve
   */
  constructor(keys: string[], curve?: string) {
    super(keys, curve);
  }

  /**
   * Sign The Ring
   * @param message The Signing Message
   * @param position The Key Position
   * @param keyString The Member's Public Key String in hex
   */
  public sign(message: string, position: number, keyString: string): BasicSignature {

    // Get Global Parameters
    const G = this.curve.g as curve.base.BasePoint;
    const N = this.curve.n as BN;

    const key = this.curve.keyFromPrivate(keyString, 'hex');
    const secret = key.getPrivate();

    // The Keypair should within the initiated group
    if (!this.inGroup(key, position)) throw new Error('key error: not in group');

    // Get Message
    const raw = new BN(Hash.sha512_256.digest(message));

    // Roughly Random a Random Number smaller than N
    const u = random(N);

    const c: BN[] = [];
    const s: BN[] = [];

    // Secret Random Number for Signing
    const encoded_rn = new BN(G.mul(u).encodeCompressed('array'));

    // Build the Signature Message
    let cipher = this.hash.concat(raw).concat(encoded_rn);

    const xx = cipher.map(x => new BN(x).toArray()).reduce((a, b) => a.concat(b), []);
    const b = new BN(Hash.sha512_256.digest(xx));

    // Initialize the first element
    c[(position + 1) % this.members] = b;

    // Ring Operation
    for (let i = (position + 2) % this.members ; i !== (position + 1) % this.members ; i = (i + 1) % this.members) {
      const j = (this.members + ((i-1) % this.members)) % this.members;
      s[j] = random(N);

      // g^Sn
      const x1 = G.mul(s[j]);

      // Yn^Cn
      const x2 = this.keys[j].getPublic().mul(c[j]);

      // Tn = Yn^Cn * g^Sn % p
      const xi = new BN(x2.add(x1).encodeCompressed('array'));

      const ci = this.hash.concat(raw).concat(xi)
        .map(x => new BN(x).toArray()).reduce((a, b) => a.concat(b), []);

      c[i] = new BN(Hash.sha512_256.digest(ci));
    }

    // Sn = u - Cn * Xn
    s[position] = u.mod(N).sub(secret.mul(c[position]).mod(N));
    // Fix Buggy Negative Modulus
    if (s[position].isNeg()) s[position] = s[position].add(N);

    return {
      S: s.map(x => x.toString('hex')),
      C: c[0].toString('hex')
    };
  };

  /**
   * Verify a Signature with the signed message
   * @param message The Signed Message
   * @param signature The Ring Signature Instance
   */
  public verify(message: string, signature: BasicSignature): boolean {

    // Get Global Parameters
    const G = this.curve.g as curve.base.BasePoint;

    const raw = new BN(Hash.sha512_256.digest(message));

    let ci = new BN(signature.C, 'hex');

    for (let i = 0 ; i < this.members ; i++) {
      const si = new BN(signature.S[i], 'hex');
      const a1 = G.mul(si);
      const a2 = this.keys[i].getPublic().mul(ci);
      const ai = new BN(a2.add(a1).encodeCompressed('array'));
  
      const temp = this.hash.concat(raw).concat(ai)
        .map(x => new BN(x).toArray()).reduce((a, b) => a.concat(b), []);
      ci = new BN(Hash.sha512_256.digest(temp));
    }

    return signature.C === ci.toString('hex');
  };
}