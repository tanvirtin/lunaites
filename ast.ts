import { Token } from "./mod.ts";

interface Expression {
  token: Token;
  left?: Expression;
  right?: Expression;
}

class Literal implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }
}

class Identifier implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }
}

class StringLiteral extends Literal {}

class NumericLiteral extends Literal {}

class BooleanLiteral extends Literal {}

class NilLiteral extends Literal {}

class VarargLiteral extends Literal {}

class CommentLiteral extends Literal {}

export {
  BooleanLiteral,
  CommentLiteral,
  Identifier,
  NilLiteral,
  NumericLiteral,
  StringLiteral,
  VarargLiteral,
};
export type { Expression };
