import BN from 'bn.js';
import { ISAAC } from "../random/isaac";
import { ec } from "elliptic";

export namespace ECC {
/**
 * Generate Random Number with Maximum Bound by CSPRNG
 * @param to The Maximum Number
 * @param seed The Optional Psuedo Random Seed
 */
export function random(to: BN, seed?: string) {
  const length = to.byteLength();

  const prng = new ISAAC(seed);
  
  let output = new BN(prng.bytes(length));
  while (output.gte(to) || output.isNeg()) {
    output = new BN(prng.bytes(length));
  }
  return output;
};

/**
 * Generate Random EC KeyPair by CSPRNG
 * @param curve The Elliptic Curve
 * @param seed The Seed String (Optional)
 */
export function randomKeyPair(curve: ec, seed: string | false = false) {
  if (!seed) return curve.genKeyPair();
  else {
    // The Point should be smaller than N
    const N = curve.n as BN;
    const point = random(N, seed);
    return curve.keyFromPrivate(point.toString('hex'));
  }
}

/**
 * Generate Random EC Point by CSPRNG
 * @param seed The Seed String (Optional)
 */
export function randomPoint(curve: ec, seed: string | false = false) {
  const pair = randomKeyPair(curve, seed);
  return pair.getPublic();
};

}