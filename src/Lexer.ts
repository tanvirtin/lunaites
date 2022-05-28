enum TokenType {
  EOF = 1,
  StringLiteral = 2,
  Keyword = 4,
  Identifier = 8,
  NumericLiteral = 16,
  Punctuator = 32,
  BooleanLiteral = 64,
  NilLiteral = 128,
  VarargLiteral = 256,
}

interface Token {
  type: number;
  value: boolean | number | string;
  line: number;
  lineStart: number;
  range: number[];
}

interface Feature {
  labels?: boolean;
  integerDivision?: boolean;
  bitwiseOperators?: boolean;
  extendedIdentifiers?: boolean;
}

export { TokenType };
export type { Feature, Token };
