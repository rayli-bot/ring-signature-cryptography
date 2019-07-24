/**
 * Copy the original vector to truncated / padded with zeros to obtain the speicifed length
 * @param matrix The Original Vector
 * @param length The Length of the New Vector
 */
export function copy(a1: number[], length: number) {
  let output = new Array<number>(length);
  for (let i = 0 ; i < length ; i++) {
    if (i >= a1.length) output[i] = 0;
    else output[i] = a1[i];
  }
  return output;
};

/**
 * Compute Norm 1 for Vector
 * @param a1 The Original Vector
 */
export function norm1(a1: number[]) {
  let sum = 0;
  for (let v of a1)
    sum += Math.abs(v);
  return sum;
};