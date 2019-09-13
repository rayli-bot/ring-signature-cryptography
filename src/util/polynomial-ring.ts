import { Polynomial } from "./polynomial";
import { Modulo } from "./modulo";

export class PolynomialRing {

  public N: number;
  public R: Polynomial;

  private readonly exit = 5000;

  /**
   * Construct the Ring Instance.
   * @param N The Dimension of this Ring (x^N - 1)
   */
  constructor(N: number) {
    this.N = N;
    // Build the x^N - 1 Ring
    this.R = new Polynomial(N + 1);
    this.R[N] = 1; this.R[0] = -1;
  }

  /**
   * Adds two Polynomial within the Ring
   * @param a 1st Polynomial
   * @param b 2nd Polynomial
   * @param p The Optional Modulo
   */
  public add(a: Polynomial, b: Polynomial, p?: number) {
    if (a.degree() > this.N || b.degree() > this.N)
      throw 'Out of Ring Addition not supported'
    else
      return p ? a.add(b).mod(p) : a.add(b);
  };

  /**
   * Subtracts two Polynomial within the Ring
   * @param a 1st Polynomial
   * @param b 2nd Polynomial
   * @param p The Optional Modulo
   */
  public sub(a: Polynomial, b: Polynomial, p?: number) {
    if (a.degree() > this.N || b.degree() > this.N)
      throw 'Out of Ring Subtraction not supported'
    else
      return p ? a.sub(b).mod(p) : a.sub(b);
  };

  /**
   * Multiplies two Polynomial within the Ring
   * @param a 1st Polynomial
   * @param b 2nd Polynomial
   * @param p The Modulo (Optional)
   */
  public mul(a: Polynomial, b: Polynomial, p?: number) {
    let v = a.resize(b);
    a = v[0]; b = v[1];
    let out = new Polynomial(this.N);
    if (a.degree() > this.N || b.degree() > this.N)
      throw 'Out of Ring Multiplication not supported';
    for (let k = this.N - 1 ; k >= 0 ; k--) {
      out[k] = 0;
      let j = k + 1;
      for (let i = this.N - 1 ; i >= 0 ; i--) {
        if (j == this.N) j = 0;
        if (a[i] !== 0 && b[j] !== 0) {
          p ? out[k] = Modulo.mod(out[k] + (a[i] * b[j]), p) : out[k] += a[i] * b[j];
        }
        j++;
      }
    }
    return out;
  };

  /**
   * Long Division two Polynomial within the Ring
   * @param a The 1st Polynomial
   * @param b The 2nd Polynomial
   * @param p The Modulo Value
   */
  public div(a: Polynomial, b: Polynomial, p: number) {
    let r = a.clone();
    let x = b.clone();
    let n = x.degree();
    let q = new Polynomial(n);
    const c = x.lc();
    const u = Modulo.modinv(c, p);
    const di = a.lc();

    let i = 0;
    while (r.degree() >= x.degree() && !r.isZero() && i <= this.exit) {
      const D = r.degree() - x.degree();
      // v = u*r_d X^(d-n)
      let v = new Polynomial(D + 1);
      v[D] = u * di;
      q = q.add(v);
      const y = v.mul(x);
      r = r.sub(y).mod(p);
      i++;
    }
    if (i >= this.exit) throw 'division function exit max. execution cycle';
    return { q: q.mod(p).trim(), r: r.mod(p).trim() };
  }

  /**
   * Get the euclidean ring inverse of a polynomial.
   * @param a The Polynomial Value
   * @param p The Modulo Value {2 or 3 only}
   */
  public egcd(a: Polynomial, p: number) {
    // r[0] = a, r[1] = Ring
    // let r: Array<Polynomial> = [a, this.R];
    let ra = a; let rb = this.R;
    let sa = new Polynomial([1]);
    let sb = new Polynomial([0]);
    // q[0] = q[1] = 0
    // let q: Array<Polynomial> = [new Polynomial([0]), new Polynomial([0])];
    // s[0] = 1 s[1] = 0
    // let s: Array<Polynomial> = [new Polynomial([1]), new Polynomial([0])];
    // t[0] = 0 t[1] = 1
    // let t: Array<Polynomial> = [new Polynomial([0]), new Polynomial([1])];

    if (a.degree() >= this.R.degree()) throw 'Out of Ring';

    let index = 2;
    let divided = { q: new Polynomial([0]), r: new Polynomial([0]) };
    do {
      // Calculate the division
      divided = this.div(ra, rb, p);
      // q.push(divided.q); r.push(divided.r);
      ra = rb; rb = divided.r;

      // Save Extended Euclidean Computation
      const sc = sa.sub(divided.q.mul(sb)).mod(p);
      // const si = s[index-2].sub(q[index].mul(s[index-1])).mod(p);
      // const ti = t[index-2].sub(q[index].mul(t[index-1])).mod(p);
      sa = sb; sb = sc;
      // s.push(si); // t.push(ti);

      index++;
    } while (!divided.r.isZero() && index <= this.exit); // Force Reject Prevent Infinite Loop
    if (index >= this.exit) throw 'egcd function exit max. execution cycle';

    // Remove the last Extended Euclidean Computation
    // s * a + t * R = 1 mod p
    // s.pop();
    // return s[s.length - 1].mod(p);
    return sa.mod(p);
  }

  /**
   * Calculate the Inverse in GF(2^m)
   * @param a The Polynomial Value
   * @param p The Power of 2 (p = 2^e)
   */
  public invGF2M(a: Polynomial, p: number) {
    if (Math.log2(p) % 1 !== 0) throw 'invalid modulo in GF(2^m) field';

    let n = 2;

    // Calculate the MI from GF(2);
    let fq = this.egcd(a, 2);

    // Shift Fq from GF(2) to GF(2^m)
    // f(0) = f^-1 mod 2
    // f(n) = f(n - 1) * (2 - a * f(n - 1))
    while (n < p) {
      n *= 2;
      let temp = this.mul(a, fq, n);
      temp = new Polynomial([2]).sub(temp).mod(n);
      fq = this.mul(fq, temp, n);
    }

    return fq.mod(p);
  }

  /**
   * Calculate the Inverse in Ring.
   * @param a The Polynomial Value
   * @param p The Modulo Number
   */
  public inv(a: Polynomial, p: number) {
    if (a.degree() >= this.R.degree()) throw 'out of ring';

    if (a.degree() == 1) return new Polynomial([Modulo.modinv(a[0], p)]);
    if (Math.log2(p) % 1 === 0) return this.invGF2M(a, p);
    else return this.egcd(a, p);
  }

  // modinv = egcd -> mod / egcd / GF2^m
}