export namespace Modulo {

  /**
   * Modulo Calculation prevent negative result
   * @param a The Value
   * @param b The Modulo
   */
  export function mod(a: number, b: number) {
    const x = (a + b) % b;
    return x == 0 ? 0 : x;  // Prevent -0
  };

  /**
   * Extended Euclidean Algorithm for Integers
   * @param a 1st Integer
   * @param b 2nd Integer
   */
  export function egcd(a: number, b: number) {
    let x = 0, y = 1, u = 1, v = 0;
    while (a !== 0) {
      // Quotient
      let q = Math.floor(b/a);
      // Remainder
      let r = b % a;

      let m = x - u * q;
      let n = y - v * q;
      b = a; a = r; x = u; y = v; u = m; v = n;
    }
    return { gcd: b, x, y };
  };

  /**
   * Return the Mod Inverse of an Integer, returns -1 if inverse does not exist
   * @param a The Integer
   * @param m The Modulo
   */
  export function modinv(a: number, m: number) {
    const result = egcd(a, m);
    if (result.gcd !== 1) return -1;
    else return (result.x % m);
  };
};
