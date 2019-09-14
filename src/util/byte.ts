import { Modulo } from "./modulo";

export namespace Bytes {

  /**
   * Transform String to Integer Array
   * @param data The Input String Data
   */
  export function str2IntArray(data: string) {
    let w1, w2, u, r4: number[] = [], r = [], i = 0;
    let s = data + '\0\0\0'; // pad string to avoid discarding last chars
    let l = s.length - 1;

    while(i < l) {
      w1 = s.charCodeAt(i++);
      w2 = s.charCodeAt(i+1);
      if       (w1 < 0x0080) {
        // 0x0000 - 0x007f code point: basic ascii
        r4.push(w1);
      } else if(w1 < 0x0800) {
        // 0x0080 - 0x07ff code point
        r4.push(((w1 >>>  6) & 0x1f) | 0xc0);
        r4.push(((w1 >>>  0) & 0x3f) | 0x80);
      } else if((w1 & 0xf800) != 0xd800) {
        // 0x0800 - 0xd7ff / 0xe000 - 0xffff code point
        r4.push(((w1 >>> 12) & 0x0f) | 0xe0);
        r4.push(((w1 >>>  6) & 0x3f) | 0x80);
        r4.push(((w1 >>>  0) & 0x3f) | 0x80);
      } else if(((w1 & 0xfc00) == 0xd800)
              && ((w2 & 0xfc00) == 0xdc00)) {
        // 0xd800 - 0xdfff surrogate / 0x10ffff - 0x10000 code point
        u = ((w2 & 0x3f) | ((w1 & 0x3f) << 10)) + 0x10000;
        r4.push(((u >>> 18) & 0x07) | 0xf0);
        r4.push(((u >>> 12) & 0x3f) | 0x80);
        r4.push(((u >>>  6) & 0x3f) | 0x80);
        r4.push(((u >>>  0) & 0x3f) | 0x80);
        i++;
      } else {
        // invalid char
      }
      /* add integer (four utf-8 value) to array */
      if(r4.length > 3) {
        // little endian
        r.push(
          (r4.shift() as number <<  0) | (r4.shift() as number <<  8) |
          (r4.shift() as number << 16) | (r4.shift() as number << 24)
        );
      }
    }

    return r;
  };

  /**
   * Transfer Hex to Int Array
   * @param hex The String in Hex Format
   */
  export function hexToBytes(hex: string) {
    let result = [];
    for (var i = 0; i < hex.length; i += 2) {
      result.push(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  };

  /**
   * Transfer String into Byte Array
   * @param str The String Input
   */
  export function strToBytes(str: string) {
    let result = [];
    for (let i = 0 ; i < str.length ; i++)
      result.push(str.charCodeAt(i));
    return new Uint8Array(result);
  };

  /**
   * Transfer Byte Array into String (UTF-8)
   * @param bytes The Byte Array Input
   */
  export function bytesToStr(bytes: Uint8Array) {
    let result = '';
    for (let i = 0 ; i < bytes.length ; i++)
      result += String.fromCharCode(bytes[i]);
    return result;
  };

  /**
   * Transfer Each Octet into 5-Trinary
   * @param bytes The Byte Array Input
  export function bytesToTrits(bytes: Uint8Array) {
    let output = new Array<number>();
    for (const byte of bytes) {
      if (byte >= 243 || byte < 0) throw 'Invalid Byte Number (0 <= x < 243)';
      const trits = byte.toString(3);
      for (let trit of trits) {
        output.push(parseInt(trit));
      }
    }
    return output;
  };

  export function tritsToBytes(trits: Array<number>) {

  };
  */

  /**
   * Transfer Octets Array into Trinary Array
   * @param bytes The Byte Array Input
   */
  export function bytesToTrits(bytes: Uint8Array, correction?: Array<number>) {
    const table: { [key: string]: Array<number> } = {
      '000': [0, 0], '001': [0, 1],
      '010': [0, -1], '011': [1, 0],
      '100': [1, 1], '101': [1, -1],
      '110': [-1, 0], '111': [-1, 1],
    };

    let trits = new Array<number>();

    // Pad Zero(s) if bytes not divided by 3
    const padding = Modulo.mod(bytes.length * 8, 3);
    if (padding > 0) {
      bytes = concatBytes(bytes, new Uint8Array(padding).fill(0));
    }
    // total numbmer of trits
    let length = Math.floor(bytes.length * 8 / 3) * 2;

    let counter = 0;
    let pointer = 0;

    while (length >= 16) {
      // get next three octets to bits
      let octets = bytes.subarray(counter, counter + 3);
      let bits24 = new Array<boolean>();
      for (const octet of octets) {
        for (let i = 7 ; i >= 0 ; i--) {
          bits24.push(octet & (1 << i) ? true : false);
        }
      }

      // Transform each 3-bits into 2 trits
      while (bits24.length > 0) {
        let bits3 = bits24.splice(0, 3);
        const k0 = bits3[0] === true ? '1' : '0';
        const k1 = bits3[1] === true ? '1' : '0';
        const k2 = bits3[2] === true ? '1' : '0';
        const key = k0 + k1 + k2;

        // Correction for Failed trits
        if (correction) {
          if (correction.indexOf(pointer) > -1 && key === '111') {
            trits.push(...[-1, -1]);
          } else trits.push(...table[key]);
        } else trits.push(...table[key]);
        
        pointer += 2;
      }

      length -= 16;
      counter += 3;
    }
    
    return trits;
  };

  /*
  export function tritsToBytes(trits: Array<number>) {

    const table: { [key: string]: Array<number> } = {
      // Original Ternary Transformation
      '00': [0,0,0], '01': [0,0,1], '0-1': [0,1,0],
      '10': [0,1,1], '11': [1,0,0], '1-1': [1,0,1],
      '-10': [1,1,0], '-11': [1,1,1],
      // Modular Ternary Transformation
      '02': [0,1,0], '12': [1,0,1], '20': [1,1,0],
      '21': [1,1,1], '22': [1,1,1], '-1-1': [1,1,1],
    };

    // 5-trits per byte

    const padding = bits % 8 > 4 ? bits % 8 : (8 - bits % 8);
    if (Math.floor((trits.length / 2) * 3) % 8 !== 0) throw 'trits cannot be divided as bytes';
    // Check is trits first
    for (let i = 0 ; i < trits.length ; i++) {
      if (trits[i] < -1 || trits[i] > 2) throw `Trit[${i}] = ${trits[i]} is invalid`;
    }

    let output = Array<number>();
    let correction = Array<number>();

    let pointer = 0;
    while (trits.length > 0) {
      let bits24 = Array<number>();
      // Get 24-bits
      for (let i = 0 ; i < 3 ; i++) {
        let t = trits.splice(0, 2);
        let key = t[0].toString() + t[1].toString();
        if (key === '22' || key === '-1-1') correction.push(pointer);
        bits24.push(...table[key]);
        pointer += 2;
      }

      for (let i = 0 ; i < 3 ; i++)
        output.push(parseInt(bits24.splice(0, 8).join(''), 2));
    }

    return { data: Buffer.from(new Uint8Array(output)), correction };
  }
  */

  export function concatBytes(a: Uint8Array, b: Uint8Array) { // a, b TypedArray of same type
    var c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
  };
};
