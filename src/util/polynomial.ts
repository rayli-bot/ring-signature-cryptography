import { Modulo } from './modulo';
import * as math from 'mathjs';

/**
 * Little-Endian Implementation of Polynomial Class
 * p[0] = coefficient of x^0
 */
export class Polynomial extends Array<number> {

  constructor (p: Array<number> | number, preset: number = 0) {
    // Fill Zero Polynomial if p is number
    if (typeof p === 'number') {
      super(p);
      this.fill(preset);
    }
    // Prevent initializing the array length instead of single element array
    else if (p.length === 1) {
      super(1);
      this[0] = p[0];
    } else {
      p = p || [];
      super(...p);
    }
  }

  static get [Symbol.species](): ArrayConstructor {
    return Object.assign(function (...items: any[]) {
      return new Polynomial(new Array(...items))
    }, Polynomial) as any;
  }

  /**
   * Clean the Polynomial
   */
  public clean() {
    while(this.length > 0) this.pop();
  }

  /**
   * Assign another polynomial to this polynomial
   * @param x The Preset Polynomial
   */
  public assign(x: number[]) {
    this.clean();
    this.push(...x);
    return this;
  }

  /**
   * Fill up the polynomial with new length
   * @param x the value
   * @param length the polynomial length
   */
  public prefill(x: number, length: number) {
    this.clean();
    this.length = length;
    this.fill(x);
    return this;
  }

  /**
   * Get the String Representation of Polynomial
   * @param debug Will return all coefficient even zeros.
   */
  public toString(debug = false) {
    if (!debug) return this.join(',');
    let tmp = [];
    for (let i = this.length - 1 ; i >= 0 ; i--) {
      if (this[i] != 0 || debug) {
        if (i > 1) tmp.push(`${this[i]}x^${i}`);
        else if (i === 1) tmp.push(`${this[i]}x`);
        else tmp.push(this[i].toString());
      }
    }
    return tmp.join(' + ');
  }

  /**
   * Gets the degree of the actual polynomial
   */
  public degree() {
    for (let i = this.length - 1 ; i >= 0 ; i--) {
      if (this[i] != 0) return i;
    }
    return 0;
  }

  /**
   * Check is the Polynomial is Zero
   */
  public isZero() {
    return (this.degree() == 0 && this[0] == 0) || this.length === 0;
  }

  /**
   * Returns the Largest Coefficient
   */
  public lc() {
    return this[this.degree()];
  }

  /**
   * Clone the Polynomial to a new object
   */
  public clone() {
    return Object.assign(new Polynomial([]), this);
  }

  /**
   * Resize Adds Leading Zeros to the polynomial vectors
   * @param b The other Polynomial vector
   */
  public resize(b: Polynomial) {
    if (this.length > b.length) {
      const len = this.length - b.length;
      // Add Leading Zero(s) to b
      b.push(...new Array(len).fill(0));
    } else {
      const len = b.length - this.length;
      // Add Leading Zero(s) to a
      this.push(...new Array(len).fill(0));
    }
    return [this, b];
  };

  /**
   * Trim Leading Zeros of a polynomial vector
   */
  public trim() {
    while (this.length > 0 && this[this.length - 1] == 0) this.pop();
    return this;
  };

  /**
   * Subtracts two Polynomials
   * @param b The other Polynomial vector
   */
  public sub(b: Polynomial) {
    const v = this.resize(b);
    b = v[1];
    // b = v[1];
    // length of a & b should be the same
    for (let i = 0 ; i < this.length ; i++) {
      this[i] += -b[i];
    }
    return this;
  };

  /**
   * Adds two Polynomials
   * @param b The other Polynomial vector
   */
  public add(b: Polynomial) {
    const v = this.resize(b);
    b = v[1];
    for (let i = 0 ; i < this.length ; i++) {
      this[i] += b[i];
    }
    return this;
  };

  /**
   * Multiplies two Polynomials
   * @param b The other Polynomial vector
   */
  public mul(b: Polynomial) {
    const s = this.clone();
    this.prefill(0, s.degree() + b.degree() + 1);
    for (let i = 0 ; i < s.length ; i++) {
      for (let j = 0 ; j < b.length ; j++) {
        if (s[i] != 0 && b[j] != 0) {
          this[j + i] += s[i] * b[j];
        }
      }
    }
    return this;
  };

  /**
   * Reduce a Polynomial to Modulo
   * @param p The Modulo number
   */
  public mod(p: number) {
    for (let i = 0 ; i < this.length ; i++) {
      this[i] = Modulo.mod(this[i], p);
    }
    return this;
  };

  /**
   * Centerlift of Polynomial with respect to a value
   * @param q The Centerlifting Value
   */
  public center(q: number) {
    const u = Math.floor(q / 2);
    this.mod(q);
    for (let i = 0 ; i < this.length ; i++)
      if (this[i] > u) this[i] -= q;

    return this;
  };

  /**
   * Check whether all coefficient is greater than a value
   * @param p The Coefficient Value
   */
  public gt(p: number) {
    for (let i = 0 ; i < this.length ; i++)
      if (this[i] <= p) return false;
    return true;
  };

  /**
   * Check whether all coefficient is greater than or equal to a value
   * @param p The Coefficient Value
   */
  public gte(p: number) {
    for (let i = 0 ; i < this.length ; i++)
      if (this[i] < p) return false;
    return true;
  };

  /**
   * Check whether all coefficient is equal to a value
   * @param p The Coefficient Value
   */
  public equal(p: number) {
    for (let i = 0 ; i < this.length ; i++)
      if (this[i] !== p) return false;
    return true;
  };

  /**
   * Check whether all coefficient is less than a value
   * @param p The Coefficient Value
   */
  public lt(p: number) {
    for (let i = 0 ; i < this.length ; i++)
      if (this[i] >= p) return false;
    return true;
  }

  /**
   * Check whether all coefficient is less than or equal to a value
   * @param p The Coefficient Value
   */
  public lte(p: number) {
    for (let i = 0 ; i < this.length ; i++)
      if (this[i] > p) return false;
    return true;
  }
}