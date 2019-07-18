import BN = require("bn.js");
import generate from 'randombytes';

/**
 * Generate Random Number with Maximum Bound
 * @param to The Maximum Number
 */
export function random(to: BN) {
  const bytes = to.byteLength();
  
  let output = new BN(generate(bytes));
  while (output.gte(to) || output.isNeg()) {
    output = new BN(generate(bytes));
  }

  return output;
};
