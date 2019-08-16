import { curve } from 'elliptic';
import BN from 'bn.js';
import { LinkableSignature, Scheme } from './interface';
import * as Hash from 'js-sha512';
import { ECC } from '../../util';

/**
 * Linkable Ring Signature
 * https://pdfs.semanticscholar.org/1b0a/789633f94ec9c32ceeeea51afa2d2aff98c3.pdf
 */
export class LinkableRingSignature extends Scheme<LinkableSignature, LinkableSignature> {
  public H: curve.base.BasePoint;

  /**
   * Initialize Linkable Ring Signature Instance
   * @param keys Public Keys of Group Members
   * @param h The predefined Generator Point
   * @param curve The Elliptic Curve
   */
  constructor(keys: string[], h: string, curve?: string) {
    super(keys, curve);

    // This Point should be setup before
    this.H = this.curve.curve.decodePoint(h, 'hex') as curve.base.BasePoint;
  }

  /**
   * Sign The Ring
   * @param message The Signing Message
   * @param position The Key Position
   * @param keyString The Member's Public Key String in hex
   */
  public sign(message: string, position: number, keyString: string): LinkableSignature {

    // Get Global Parameters
    const G = this.curve.g as curve.base.BasePoint;
    const H = this.H;
    const N = this.curve.n as BN;

    const key = this.curve.keyFromPrivate(keyString, 'hex');
    const secret = key.getPrivate();

    // The Keypair should within the initiated group
    if (!this.inGroup(key, position)) throw new Error('key error: not in group');

    // Get Message
    const raw = new BN(Hash.sha512_256.digest(message));

    // Roughly Random a Random Number smaller than N
    const u = ECC.random(N);

    // Get Secret Linkable Number
    const y = H.mul(secret);

    const c: BN[] = [];
    const s: BN[] = [];

    const encoded_y      = new BN(y.encodeCompressed('array'));
    // Secret Random Number for Signing
    const encoded_rn = new BN(G.mul(u).encodeCompressed('array'));
    // Secret Random Number for Linking
    const encoded_link   = new BN(H.mul(u).encodeCompressed('array'));

    // Build the Signature Message
    const cipher = this.hash.concat(encoded_y).concat(raw).concat(encoded_rn).concat(encoded_link)
      .map(x => new BN(x).toArray()).reduce((a, b) => a.concat(b), []);
    const b = new BN(Hash.sha512_256.digest(cipher));

    // Initialize the first element
    c[(position + 1) % this.members] = b;

    // Ring Operation
    for (let i = (position + 2) % this.members ; i !== (position + 1) % this.members ; i = (i + 1) % this.members) {
      // The Previous Index
      const j = (this.members + ((i-1) % this.members)) % this.members;
      s[j] = ECC.random(N);

      // g^Sn
      const x1 = G.mul(s[j]);

      // Yn^Cn
      const x2 = this.keys[j].getPublic().mul(c[j]);

      // Tn = Yn^Cn * g^Sn % p
      const xi = new BN(x2.add(x1).encodeCompressed('array'));

      // h^Sn
      const y1 = H.mul(s[j]);
      // y^Cn
      const y2 = y.mul(c[j]);
      // Zn = y^Cn * h^Sn % p
      const yi = new BN(y2.add(y1).encodeCompressed('array'));

      const ci = this.hash.concat(encoded_y).concat(raw).concat(xi).concat(yi)
        .map(x => new BN(x).toArray()).reduce((a, b) => a.concat(b), []);

      c[i] = new BN(Hash.sha512_256.digest(ci));
    }

    // Sn = u - Cn * Xn
    s[position] = u.mod(N).sub(secret.mul(c[position]).mod(N));
    // Fix Buggy Negative Modulus
    if (s[position].isNeg()) s[position] = s[position].add(N);

    return {
      S: s.map(x => x.toString('hex')),
      C: c[0].toString('hex'),
      Y: encoded_y.toString('hex'),
    };
  };

  /**
   * Verify a Signature with the signed message
   * @param message The Signed Message
   * @param signature The Ring Signature Instance
   */
  public verify(message: string, signature: LinkableSignature): boolean {

    // Get Global Parameters
    const G = this.curve.g as curve.base.BasePoint;
    const H = this.H;

    const raw = new BN(Hash.sha512_256.digest(message));

    let ci = new BN(signature.C, 'hex');
    let encoded_y = new BN(signature.Y, 'hex');
    let yi = this.curve.curve.decodePoint(signature.Y, 'hex') as curve.base.BasePoint;

    for (let i = 0 ; i < this.members ; i++) {
      const si = new BN(signature.S[i], 'hex');

      const a1 = G.mul(si);
      const a2 = this.keys[i].getPublic().mul(ci);
      const ai = new BN(a2.add(a1).encodeCompressed('array'));

      const b1 = H.mul(si);
      const b2 = yi.mul(ci);
      const bi = new BN(b2.add(b1).encodeCompressed('array'));
  
      const temp = this.hash.concat(encoded_y).concat(raw).concat(ai).concat(bi)
        .map(x => new BN(x).toArray()).reduce((a, b) => a.concat(b), []);
      ci = new BN(Hash.sha512_256.digest(temp));
    }

    return signature.C === ci.toString('hex');
  };

  /**
   * Check is two signature valid and linked (signed by the same signer).
   * @param m1 The 1st Signed Message
   * @param s1 The 1st Signature
   * @param m2 The 2nd Signed Message
   * @param s2 The 2nd Signature
   */
  public isLink(m1: string, s1: LinkableSignature, m2: string, s2: LinkableSignature) {
    if (!this.verify(m1, s1)) return false;
    if (!this.verify(m2, s2)) return false;
    return s1.Y === s2.Y;
  }
}