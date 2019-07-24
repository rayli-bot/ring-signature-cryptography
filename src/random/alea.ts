import * as Hash from "js-sha512";
import { toByteArray } from "../util";

/**
 * Alea Psuedo Random Number Generator
 * https://web.archive.org/web/20110516012139/http://baagoe.com/en/RandomMusings/javascript/
 */
export class ALEA {

  private s0: number = 0;
  private s1: number = 0;
  private s2: number = 0;
  private c: number = 1;

  constructor(args: string | number[] = []) {

    if (typeof args === 'string') args = toByteArray(Hash.sha512_256(args));

    if (args.length === 0) args = [+new Date()];

    let mash = Mash();
    this.s0 = mash(' ');
    this.s1 = mash(' ');
    this.s2 = mash(' ');

    for (let i = 0 ; i < args.length ; i++) {
      this.s0 -= mash(args[i]);
      if (this.s0 < 0) this.s0 += 1;

      this.s1 -= mash(args[i]);
      if (this.s1 < 0) this.s1 += 1;

      this.s2 -= mash(args[i]);
      if (this.s2 < 0) this.s2 += 1;
    }
  }

  /**
   * Return a random 2^-32 to 2^32 Random Number
   */
  public random() {
    let t = 2091639 * this.s0 + this.c * 2.3283064365386963e-10; // 2^-32
    this.s0 = this.s1;
    this.s1 = this.s2;
    return this.s2 = t - (this.c = t | 0);
  }

  /**
   * Return a UINT32 Format Random Number
   */
  public uint32() {
    return this.random() * 0x100000000; // 2^32
  }

  /**
   * Return a Fract53 Format Random Number
   */
  public fract53() {
    return this.random() + 
      (this.random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
  }

  /**
   * Export the Internal State to PRNG
   */
  public export() {
    return { s0: this.s0, s1: this.s1, s2: this.s2, c: this.c };
  }

  /**
   * Import the Internal State to PRNG
   * @param state The Specified State for the PRNG
   */
  public import(state: { s0: number, s1: number, s2: number, c: number }) {
    this.s0 = +state.s0 || 0;
    this.s1 = +state.s1 || 0;
    this.s2 = +state.s2 || 0;
    this.c = +state.c || 0;
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

/**
 * Mash Function
 * Crus the input into `predictable` unknown number
 */
function Mash() {
  let n = 0xefc8249d;

  const mash = (data: string | number) => {
    data = data.toString();
    for (let i = 0 ; i < data.length ; i++) {
      n += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
}