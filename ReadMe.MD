# Ring Signature Toolkit

Ring Signature Javascript toolkit including classic Ring Signature, Linkable Ring Signature. More Ring Signature Scheme will be included.

## TODO List

- [X] DTO Interface
- [X] Keypair Geneartion
- [X] Ring Signature Algo
- [X] Linkable (Traceable) Ring Signature Algo
- [X] Cryptographically secure pseudorandom number generator
- [X] Psuedo EC Point Generator

## Future Development

- [ ] Lattice-based Ring Signature
- [ ] Lattice-based Linkable Ring Signature
- [ ] Hybrid Mobile App Benchmark

## Mission

- [ ] Lattice-based Threshold Ring Signature (based on Raptors-512)

## Tutorial

### Classic Ring Signature

```typescript
import { RingSignature, randomKeyPair } from 'rstk';

// Declare the curve
const curveName = 'ed25519';
let curve: ec = new ec(curveName);

// The Ad-Hoc Group
let pairs: ec.KeyPair[] = [];
for (let i = 0 ; i < members ; i++) {
  const pair = randomKeyPair(curve);
  pairs.push(pair);
}

// Initiate Classic Ring Signature Instance
const ring = new RingSignature(
  pairs.map(x =>
    x.getPublic().encodeCompressed('hex').toString('hex')
  ),
  curveName
);

// let's us sign a ring signature with one of the groupmate (2nd)
const pair = pairs[2];
const signature = ring.sign("i am message", 2, pair.getPrivate().toString('hex'));
ring.verify("i am message", signature); // should return true
```

### Linkable Ring Signature

```typescript
import { LinkableRingSignature, randomKeyPair, randomPoint } from 'rstk';

// Declare the curve
const curveName = 'ed25519';
let curve: ec = new ec(curveName);

// The Ad-Hoc Group
let pairs: ec.KeyPair[] = [];
for (let i = 0 ; i < members ; i++) {
  const pair = randomKeyPair(curve);
  pairs.push(pair);
}

// Set a preset generate H
const h = randomPoint(curve, "i am seed - making h as constant");

// Initiate Classic Ring Signature Instance
const ring = new LinkableRingSignature(
  pairs.map(x =>
    x.getPublic().encodeCompressed('hex').toString('hex')
  ),
  h.toString('hex'),
  curveName
);

// let's us sign a ring signature with one of the groupmate (2nd)
const alice = pairs[2];
const bob = pairs[1];
const s1 = ring.sign("i am message 1", 2, alice.getPrivate().toString('hex'));
const s2 = ring.sign("i am message 2", 2, alice.getPrivate().toString('hex'));
const s3 = ring.sign("i am message 1", 1, bob.getPrivate().toString('hex'));
ring.verify("i am message 1", s1); // should return true
ring.verify("i am message 2", s2); // should return true
ring.verify("i am message 1", s3); // should return true

// Will show linkage between signatures
ring.isLink("i am message 1", s1, "i am message 2", s2); // should return true
ring.isLink("i am message 1", s1, "i am message 1", s3); // should return false
```



### Appendix

- [Psuedo Random Generator Distribution Test](https://www.khanacademy.org/computer-programming/prng-test/5500564014432256)

