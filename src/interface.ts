import { ec } from 'elliptic';
import BN from 'bn.js';

/**
 * The Signature Format for Classic Ring Signature
 */
export interface BasicSignature {
  S: string[];
  C: string;
};

/**
 * The Signature Format for Linkable Ring Signature
 */
export interface LinkableSignature extends BasicSignature {
  Y: string;
};


export interface Signer {
  key: string;
  ref: string;
  S: string;
};

/**
 * Common Scheme for Ring Signature
 */
export abstract class Scheme<T extends BasicSignature, K> {

  public curve: ec;
  public name: string;  // The Curve Name

  public keys: ec.KeyPair[] = [];
  /**
   * Get The Ring Size
   */
  public get members() { return this.keys.length; }

  public hash: BN[] = []; // All Compressed format of Public Keys Points.

  /**
   * Initialize Ring Signature Instance
   * @param keys Public Keys of Group Members
   * @param curve The Elliptic Curve
   */
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

  /**
   * Check is the Key inside this Ring Group
   * @param key The specified Public Key
   * @param index The Key index in Group
   */
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

  /**
   * Common Interface for Signing The Ring
   * @param message The Signing Message
   * @param position The Key Position
   * @param keyString The Member's Public Key String in hex
   */
  public abstract sign(message: string, position: number, keyString: string): K;

  /**
   * Common Interface for Verifying a Signature with the signed message
   * @param message The Signed Message
   * @param signature The Ring Signature Instance
   */
  public abstract verify(message: string, signature: T): boolean;
}
