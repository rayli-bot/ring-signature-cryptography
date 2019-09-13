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
   * Transfer Byte Array into Trinary Array
   * @param bytes The Byte Array Input
   */
  export function bytesToTrits(bytes: Uint8Array) {
    // Pad Zero(s) if bytes not divided by 3
    let padding = Modulo.mod(bytes.length, 3);
    // Padding Zeros to byte array
    let pads = new Uint8Array(padding).fill(0);
    bytes = concatBytes(bytes, pads);

    // Start Transferring bytes to tinaries
  };

  export function concatBytes(a: Uint8Array, b: Uint8Array) { // a, b TypedArray of same type
    var c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
  };
};
