enum TokenTypes {
  EOF = 1,
  StringLiteral = 2,
  Keyword = 4,
  Identifier = 8,
  NumericLiteral = 16,
  Punctuator = 32,
  BooleanLiteral = 64,
  NilLiteral = 128,
  VarargLiteral = 256,
};

interface Token {
  type: number;
  value: boolean | number | string;
  line: number;
  lineStart: number;
  range: number[];
}

class Tokenizer {}

export { Tokenizer };
export type { Token, TokenTypes };
