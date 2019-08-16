import * as Hash from "js-sha512";
import { Bytes } from '../util';

/**
 * 32-bit integer safe adder
 * @param x 1st 32-bit integer
 * @param y 2nd 32-bit integer
 */
export function add(x: number, y: number) {
  const lsb = (x & 0xffff) + (y & 0xffff);
  const msb = (x >>>   16) + (y >>>   16) + (lsb >>> 16);
  return (msb << 16) | (lsb & 0xffff);
};

/**
 * ISAAC Cryptographically Secure Psuedo Random Number Generator (CSPRNG)
 * https://burtleburtle.net/bob/rand/isaacafa.html
 */
export class ISAAC {
  // internal memory
  m = new Array<number>(256);
  // accumulator
  acc = 0;
   // last result
  brs = 0;
  // counter
  cnt = 0;
  // result array
  r = Array<number>(256);
  // generation counter
  gnt = 0;

  constructor(seed: string | number[] | false = false) {
    this.reset();
    if (!seed) seed = [Math.random() * 0xffffffff];
    seed = Hash.sha512_256(seed);
    this.seed(seed);
  }

  /**
   * Initialization
   */
  public reset() {
    this.acc = this.brs = this.gnt = this.cnt = 0;
    for(var i = 0; i < 256; ++i)
      this.m[i] = this.r[i] = 0;
  }

  /**
   * Return internal state of the PRNG
   */
  public export() {
    return {
      a: this.acc, b: this.brs,
      c: this.cnt, m: this.m, r: this.r,
    };
  }

  public import(state: { a: number, b: number, c: number, m: number[], r: number[] }) {
    this.acc = state.a; this.brs = state.b;
    this.cnt = state.c; this.m = state.m;
    this.r = state.r;
  }

  /**
   * Seeding the PRNG
   * @param s The Input Seed String
   */
  public seed(s: string | number | Array<number>) {
    let a: number, b: number, c: number, d: number;
    let e: number, f: number, g: number, h: number, i: number;

    /* seeding the seeds of love - the golden ratio */
    a = b = c = d = e = f = g = h = 0x9e3779b9;

    if(s && typeof s === 'string') {
      s = Bytes.str2IntArray(s);
    }

    if(s && typeof(s) === 'number') {
      s = [s];
    }

    if (s instanceof Array) {
      this.reset();
      for(i = 0 ; i < s.length ; i++)
        this.r[i & 0xff] += (typeof s[i] === 'number') ? s[i] : 0;
    }

    /* seed mixer */
    const seed_mix = () => {
      a ^= b <<  11; d = add(d, a); b = add(b, c);
      b ^= c >>>  2; e = add(e, b); c = add(c, d);
      c ^= d <<   8; f = add(f, c); d = add(d, e);
      d ^= e >>> 16; g = add(g, d); e = add(e, f);
      e ^= f <<  10; h = add(h, e); f = add(f, g);
      f ^= g >>>  4; a = add(a, f); g = add(g, h);
      g ^= h <<   8; b = add(b, g); h = add(h, a);
      h ^= a >>>  9; c = add(c, h); a = add(a, b);
    }

    /* scramble it */
    for (i = 0 ; i < 4 ; i++)
      seed_mix();

    for (i = 0 ; i < 256 ; i += 8) {
      if (s) {  /* use all the information in the seed */
        a = add(a, this.r[i + 0]); b = add(b, this.r[i + 1]);
        c = add(c, this.r[i + 2]); d = add(d, this.r[i + 3]);
        e = add(e, this.r[i + 4]); f = add(f, this.r[i + 5]);
        g = add(g, this.r[i + 6]); h = add(h, this.r[i + 7]);
      }
      seed_mix();
      /* fill in m[] with messy stuff */
      this.m[i + 0] = a; this.m[i + 1] = b; this.m[i + 2] = c;
      this.m[i + 3] = d; this.m[i + 4] = e; this.m[i + 5] = f;
      this.m[i + 6] = g; this.m[i + 7] = h;
    }

    if (s) {
      /* do a second pass to make all of the seed affect all of m[] */
      for(i = 0; i < 256; i += 8) {
        a = add(a, this.m[i + 0]); b = add(b, this.m[i + 1]);
        c = add(c, this.m[i + 2]); d = add(d, this.m[i + 3]);
        e = add(e, this.m[i + 4]); f = add(f, this.m[i + 5]);
        g = add(g, this.m[i + 6]); h = add(h, this.m[i + 7]);
        seed_mix();
        /* fill in m[] with messy stuff (again) */
        this.m[i + 0] = a; this.m[i + 1] = b; this.m[i + 2] = c;
        this.m[i + 3] = d; this.m[i + 4] = e; this.m[i + 5] = f;
        this.m[i + 6] = g; this.m[i + 7] = h;
      }
    }

    this.prng(); /* fill in the first set of results */
    this.gnt = 256;  /* prepare to use the first set of results */;
  }

  /**
   * Psuedo Random Generator
   * @param n Number of Run
   */
  public prng(n?: number) {
    let i, x, y;
    n = (n && typeof(n) === 'number')
      ? Math.abs(Math.floor(n)) : 1;

    while(n--) {
      this.cnt = add(this.cnt,   1);
      this.brs = add(this.brs, this.cnt);

      for(i = 0; i < 256; i++) {
        switch(i & 3) {
          case 0: this.acc ^= this.acc <<  13; break;
          case 1: this.acc ^= this.acc >>>  6; break;
          case 2: this.acc ^= this.acc <<   2; break;
          case 3: this.acc ^= this.acc >>> 16; break;
        }
        this.acc             = add(this.m[(i +  128) & 0xff], this.acc); x = this.m[i];
        this.m[i] =   y      = add(this.m[(x >>>  2) & 0xff], add(this.acc, this.brs));
        this.r[i] = this.brs = add(this.m[(y >>> 10) & 0xff], x);
      }
    }
  }

  /**
   * Return a random number
   */
  public rand() {
    if (!this.gnt--) {
      this.prng();
      this.gnt = 255;
    }
    return this.r[this.gnt];
  }

  /**
   * Return a 32-bit fraction in the range [0, 1]
   */
  public random() {
    return 0.5 + this.rand() * 2.3283064365386963e-10; // 2^-32
  }

  /**
   * Return the inclusive range
   * @param min The Minimum Number
   * @param max The Maximum Number
   */
  public range(min: number, max: number) {
    if (min > max) throw new Error('min is greater than max');

    // Return Integer
    if (Number.isInteger(min) && Number.isInteger(max)) {
      return Math.floor(this.random() * (max - min + 1)) + min;
    }
    // Return Float
    else {
      return this.random() * (max - min) + min;
    }
  }

  /**
   * Return Random Bytes
   * @param amount The Byte Length
   */
  public bytes(length: number): Uint8Array {
    let out = new Uint8Array(length);

    for (let i = 0 ; i < length ; i++) {
      out[i] = this.range(0, 255);
    }

    return out;
  }
}