export interface BasicSignature {
  S: string[];
  C: string;
};

export interface LinkableSignature extends BasicSignature {
  Y: string;
};