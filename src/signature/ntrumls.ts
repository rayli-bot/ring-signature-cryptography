import { PolynomialRing } from '../util/polynomial-ring';
import { ALEA, ISAAC } from '../random';
import { Polynomial } from '../util/polynomial';
import { Bytes } from '../util/byte';
import { sha3_256 } from 'js-sha3';

export interface KeyPair {
  priv: { f: Array<number>, g: Array<number> };
  pub: Array<number>;
};

export interface PrivateKey {
  f: { [key: string]: Array<number> };
  g: { [key: string]: Array<number> };
};

export interface Param {
  N: number;
  p: number;
  q: number;
  d1: number;
  d2: number;
  d3: number;
  Bs: number;
  Bt: number;
};

export namespace ParamSet {
  export const bit82: Param = {
    N: 401, p: 3, q: 32768, Bs: 138, Bt: 46, d1: 8, d2: 8, d3: 6
  };

  export const bit88: Param = {
    N: 443, p: 3, q: 65536, Bs: 138, Bt: 46, d1: 9, d2: 8, d3: 5
  };

  export const bit126: Param = {
    N: 563, p: 3, q: 65536, Bs: 174, Bt: 58, d1: 10, d2: 9, d3: 8
  };

  export const bit179: Param = {
    N: 743, p: 3, q: 131072, Bs: 186, Bt: 62, d1: 11, d2: 11, d3: 6
  };

  export const bit269: Param = {
    N: 907, p: 3, q: 131072, Bs: 225, Bt: 75, d1: 13, d2: 12, d3: 7
  };
}

export class NTRUMLS {

  public N: number;
  public p: number;
  public q: number;
  public d1: number; public d2: number; public d3: number;
  public Bs: number;
  public Bt: number;
  public ring: PolynomialRing;
  public rng: ALEA | ISAAC;

  private keypair?: KeyPair;

  constructor(param: Param, seed?: string) {
    this.N = param.N; this.p = param.p; this.q = param.q;
    this.d1 = param.d1; this.d2 = param.d2; this.d3 = param.d3;
    this.Bs = param.Bs; this.Bt = param.Bt;
    // Ring = x^N - 1
    this.ring = new PolynomialRing(this.N);

    seed ? this.rng = new ALEA(seed) : this.rng = new ALEA();
  }

  /**
   * Generate Psuedo-Random Small Polynomial with [-1, 0, 1].
   * @param pos The number of Positive 1's.
   * @param neg The number of Negative 1's.
   * @param len The Coefficient Length of the Polynomial
   */
  public randomPoly(pos: number, neg: number, len: number) {
    let x = new Polynomial(len);
    let state = Array.from({length: len}, (v,i) => i);
    // choose +1 in P(x)
    for (let i = 0 ; i < pos ; i++) {
      const j = this.rng.range(0, state.length - 1);
      x[state[j]] = 1;
      state.splice(j, 1);
    }
    // choose -1 in P(x)
    for (let i = 0 ; i < neg ; i++) {
      const j = this.rng.range(0, state.length - 1);
      x[state[j]] = -1;
      state.splice(j, 1);
    }

    return x;
  }

  /**
   * Generate KeyPair
   */
  public create(): KeyPair {
    // Fi = (d) 1's && d -1's
    // const F1 = this.randomPoly(this.d1, this.d1, this.N);
    // const F2 = this.randomPoly(this.d2, this.d2, this.N);
    // const F3 = this.randomPoly(this.d3, this.d3, this.N);
    // P(f): p(F1 * F2 + F3 + 1)
    // the max. coefficient is x^(N-1)
    // this should have invertiable in x^N - 1 IFF P(f) < x^N - 1
    // const f = this.ring.add(this.ring.add(this.ring.mul(F1, F2, this.p), F3, this.p), new Polynomial([1]), this.p);

    // P(f): (d+1) 1's && (d) -1's && f^-1 mod p && f^-1 mod q
    const f = this.randomPoly(this.d1 + 1, this.d1, this.N);

    // Gi = (d) 1's && d -1's
    // const G1 = this.randomPoly(this.d1, this.d1, this.N);
    // const G2 = this.randomPoly(this.d2, this.d2, this.N);
    // const G3 = this.randomPoly(this.d3, this.d3, this.N);
    // P(g): G1 * G2 + G3 + 1
    // const g = this.ring.add(this.ring.add(this.ring.mul(G1, G2, this.p), G3, this.p), new Polynomial([1]), this.p);

    // P(g): (d) 1's && (d) -1's
    const g = this.randomPoly(this.d1, this.d1, this.N);
    const fq = this.ring.inv(f, this.q);
    const h1 = this.ring.mul(new Polynomial([this.p]), fq, this.q);
    // h = p * fq * g
    const h = this.ring.mul(h1, g, this.q);

    this.keypair = { priv: { f, g }, pub: h };
    return this.keypair;
  };

  /**
   * Get Public Key
   */
  public pub(pack?: true): ArrayBuffer;
  public pub(pack?: false): Array<number>;
  public pub(pack: boolean = false): ArrayBuffer | Array<number> {
    if (!this.keypair) throw 'Keypair Not Exist';
    if (pack) return this.pack(this.keypair.pub)
    else return this.keypair.pub;
  };

  public priv() {
    if (!this.keypair) throw 'Keypair Not Exist';
    return this.keypair.priv;
  }

  /**
   * Export the Private Key
   * Export a json describe where is -1, +1 in f and g
   */
  public export(): PrivateKey {
    if (!this.keypair) throw 'Keypair Not Exist';

    let output: PrivateKey = {f: { }, g: { }};
    const f = this.keypair.priv.f;
    const g = this.keypair.priv.g;
    
    if (f.length !== g.length) throw 'Keypair private key length not correct';

    for (let i = 0 ; i < f.length ; i++) {
      if (f[i] !== 0) {
        if (!output.f[f[i].toString()]) output.f[f[i].toString()] = [];
        output.f[f[i].toString()].push(i);
      }

      if (g[i] !== 0) {
        if (!output.g[g[i].toString()]) output.g[g[i].toString()] = [];
        output.g[g[i].toString()].push(i);
      }
    }

    return output;
  }

  public import(keypair: PrivateKey | KeyPair) {
    if (!keypair) throw 'invalid keypair';

    const isKeypair = (pair: any): pair is KeyPair => {
      return pair.priv && pair.pub;
    };

    const isPrivateKey = (pair: any): pair is PrivateKey => {
      return pair.f && pair.g;
    };

    if (isKeypair(keypair)) this.keypair = keypair;
    else if (isPrivateKey(keypair)) {

      let f = new Polynomial(this.N);
      let g = new Polynomial(this.N);

      // Recover f & g from neg & pos index
      for (const v in keypair.f) {
        for (let i = 0 ; i < keypair.f[v].length ; i++) {
          f[keypair.f[v][i]] = Number(v);
        }
      }
      for (const v in keypair.g) {
        for (let i = 0 ; i < keypair.g[v].length ; i++) {
          g[keypair.g[v][i]] = Number(v);
        }
      }

      const fq = this.ring.inv(f, this.q);
      const h1 = this.ring.mul(new Polynomial([this.p]), fq, this.q);
      // h = p * fq * g
      const h = this.ring.mul(h1, g, this.q);

      this.keypair = { priv: { f, g }, pub: h };
    }
  }

  /**
   * Pack the Polynomial / number Array into Buffer
   * @param data The number Array / Polynomial
   */
  public pack(data: Array<number>): ArrayBuffer {
    const bits = Math.log2(this.q);
    if (bits >= 32) return new Uint32Array(data).buffer
    else if (bits >= 16) return new Uint16Array(data).buffer
    else return new Uint8Array(data).buffer
  }

  /**
   * Unpack Buffer to Typed Array
   * @param buf The Array Buffer
   */
  public unpack(buf: ArrayBuffer) {
    const bits = Math.log2(this.q);
    if (bits >= 32) return new Uint32Array(buf)
    else if (bits >= 16) return new Uint16Array(buf)
    else return new Uint8Array(buf)
  }

  /**
   * Get the Original Challenge for the Signature
   * @param msg The Message for Signing
   * @param pub The Signer's Public Key
   */
  public challenge(msg: string, pub: Array<number>) {
    const h = new Polynomial(pub);
    // Pool = H (H(msg) | H(pub))
    const pool = sha3_256.digest(sha3_256.digest(msg).concat(sha3_256.digest(pub)));
    // Hash to Trits
    const trits = Bytes.bytesToTrits(new Uint8Array(pool));
    // sp = msg mod p
    const sp = new Polynomial(trits).mod(this.p);

    // tp = h * sp mod q
    const tp = this.ring.mul(h, sp, this.q);

    return { sp, tp };
  };

  /**
   * NTRUMLS Signing Function
   * @param msg The Message for Signing
   * @param pair The Keypair for Signing
   */
  public sign(msg: string, pair: KeyPair): ArrayBuffer {
    const q2 = Math.floor(this.q / 2);

    const f = new Polynomial(pair.priv.f);
    const g = new Polynomial(pair.priv.g);
    const h = new Polynomial(pair.pub);

    const challenge = this.challenge(msg, pair.pub);
    const tp = challenge.tp; const sp = challenge.sp;

    let s: Polynomial, t: Polynomial, af: Polynomial, ag: Polynomial;

    do {
      // r = Random from {0, q/2p + 1/2}
      const r = this.rng.range(0, Math.floor((this.q / (2 * this.p)) + 0.5));

      // s0 = sp + pr
      const pr = new Polynomial(sp.length, this.p * r);
      const s0 = this.ring.add(sp, pr);

      // t0 = h * s0 mod q
      const t0 = this.ring.mul(h, s0, this.q);

      const ginv = this.ring.inv(g, this.p);
      const tp0 = this.ring.sub(tp, t0, this.p);
      // a = g^-1 * (tp - t0) mod p
      const a = this.ring.mul(ginv, tp0, this.p);

      af = this.ring.mul(a, f, this.q);
      ag = this.ring.mul(a, g, this.q);

      // s = s0 + a*f
      s = this.ring.add(s0, af, this.q);
      // t = t0 + a*g
      t = this.ring.add(t0, ag, this.q);

    } while (af.gt(this.Bs) || ag.gt(this.Bt) || s.gt(q2 - this.Bs) || t.gt(q2 - this.Bt));

    // f(1) : sp == s0 mod p
    // f(2) : t = h * s mod q
    // Pack the Signature into a byte
    return this.pack(s);
  }

  /**
   * Verify the Signature with related Public Key
   * @param msg The Signed Message
   * @param signature The Signature of the Message
   * @param pub The Public key for verification
   */
  public verify(msg: string, signature: ArrayBuffer, pub: Array<number>) {
    const unpacked = this.unpack(signature);
    const origin = Array.from(unpacked);

    const challenge = this.challenge(msg, pub);

    const h = new Polynomial(pub);
    const s = new Polynomial(origin);
    const t = this.ring.mul(h, s, this.q);

    const Hs = sha3_256(s);
    const Hsp = sha3_256(challenge.sp);
    const Hsmp = sha3_256(s.mod(this.p));
    
    const q2 = Math.floor(this.q / 2);
    // Prevent Transcription distinguisable problem
    if (s.gt(q2-this.Bs) || t.gt(q2-this.Bt)) return false;
    // Not accepting the same value signature
    else if (Hs === Hsp) return false;
    // Reject invalid signature
    else if (Hsmp !== Hsp) return false;
    else return true;
  }
}
