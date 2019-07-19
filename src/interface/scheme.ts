import { ec } from 'elliptic';
import BN = require("bn.js");
import { BasicSignature } from './type';

export abstract class Scheme<T extends BasicSignature> {

  public curve: ec;
  public name: string;

  public keys: ec.KeyPair[] = [];
  public get members() { return this.keys.length; }

  public hash: BN[] = [];

  // Prefer Curve as ed25519
  constructor(keys: string[], curve?: string) {
    if (!curve) {
      this.curve = new ec('ed25519');
      this.name = 'ed25519';
    } else {
      this.curve = new ec(curve);
      this.name = curve;
    }

    // Get KeyPairs by Public Key
    for (const key of keys) {
      const pair = this.curve.keyFromPublic(key, 'hex');
      this.keys.push(pair);

      // Append to Scheme's Key String
      this.hash.concat(pair.getPublic().encodeCompressed("array"));
    }
  }

  public abstract sign(message: string, position: number, keyString: string): T;
  public abstract verify(message: string, signature: T): boolean;
}
