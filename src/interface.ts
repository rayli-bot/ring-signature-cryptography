import { ec } from 'elliptic';
import BN = require("bn.js");

export interface BasicSignature {
  S: string[];
  C: string;
};

export interface LinkableSignature extends BasicSignature {
  Y: string;
};

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

  protected inGroup(key: ec.KeyPair, index?: number) {
    if (!index) return this.keys.findIndex(x =>
      x.getPublic().encodeCompressed('hex').toString('hex') ===
      key.getPublic().encodeCompressed('hex').toString('hex')
    ) > -1;
    else {
      if (index >= this.keys.length || index < 0) return false;
      return this.keys[index].getPublic().encodeCompressed('hex').toString('hex') ===
        key.getPublic().encodeCompressed('hex').toString('hex');
    }
  }

  public abstract sign(message: string, position: number, keyString: string): T;
  public abstract verify(message: string, signature: T): boolean;
}