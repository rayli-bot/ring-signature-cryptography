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

  constructor(seed?: string) {
    this.reset();
    if (seed) this.seed(seed);
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
   * Seeding the PRNG
   * @param s The Input Seed String
   */
  public seed(s: string | number | Array<number>) {
    let a: number, b: number, c: number, d: number;
    let e: number, f: number, g: number, h: number, i: number;

    /* seeding the seeds of love - the golden ratio */
    a = b = c = d = e = f = g = h = 0x9e3779b9;

    if(s && typeof s === 'string') {
      s = this.toIntArray(s);
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
   * Return internal state of the PRNG
   */
  public internals() {
    return {
      a: this.acc, b: this.brs,
      c: this.cnt, m: this.m, r: this.r,
    };
  }

  /**
   * Transform String to Integer Array
   * @param data The Input String Data
   */
  private toIntArray(data: string) {
    let w1, w2, u, r4: number[] = [], r = [], i = 0;
    let s = data + '\0\0\0'; // pad string to avoid discarding last chars
    let l = s.length - 1;

    while(i < l) {
      w1 = s.charCodeAt(i++);
      w2 = s.charCodeAt(i+1);
      if       (w1 < 0x0080) {
        // 0x0000 - 0x007f code point: basic ascii
        r4.push(w1);
      } else if(w1 < 0x0800) {
        // 0x0080 - 0x07ff code point
        r4.push(((w1 >>>  6) & 0x1f) | 0xc0);
        r4.push(((w1 >>>  0) & 0x3f) | 0x80);
      } else if((w1 & 0xf800) != 0xd800) {
        // 0x0800 - 0xd7ff / 0xe000 - 0xffff code point
        r4.push(((w1 >>> 12) & 0x0f) | 0xe0);
        r4.push(((w1 >>>  6) & 0x3f) | 0x80);
        r4.push(((w1 >>>  0) & 0x3f) | 0x80);
      } else if(((w1 & 0xfc00) == 0xd800)
             && ((w2 & 0xfc00) == 0xdc00)) {
        // 0xd800 - 0xdfff surrogate / 0x10ffff - 0x10000 code point
        u = ((w2 & 0x3f) | ((w1 & 0x3f) << 10)) + 0x10000;
        r4.push(((u >>> 18) & 0x07) | 0xf0);
        r4.push(((u >>> 12) & 0x3f) | 0x80);
        r4.push(((u >>>  6) & 0x3f) | 0x80);
        r4.push(((u >>>  0) & 0x3f) | 0x80);
        i++;
      } else {
        // invalid char
      }
      /* add integer (four utf-8 value) to array */
      if(r4.length > 3) {
        // little endian
        r.push(
          (r4.shift() as number <<  0) | (r4.shift() as number <<  8) |
          (r4.shift() as number << 16) | (r4.shift() as number << 24)
        );
      }
    }

    return r;
  }
}