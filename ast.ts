import { Token } from "./mod.ts";

interface Expression {
  toString(): string;
}

interface Statement {
  toString(): string;
}

class Literal implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }
}

class NilLiteral extends Literal {}

class VarargLiteral extends Literal {}

class StringLiteral extends Literal {}

class NumericLiteral extends Literal {}

class BooleanLiteral extends Literal {}

class CommentLiteral extends Literal {}

class Identifier implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }
}

class GroupingExpression implements Expression {
  openParenthesis: Token;
  expression: Expression;
  closedParenthesis: Token;

  constructor(
    openParenthesis: Token,
    expression: Expression,
    closedParenthesis: Token,
  ) {
    this.openParenthesis = openParenthesis;
    this.expression = expression;
    this.closedParenthesis = closedParenthesis;
  }
}

class UnaryExpression implements Expression {
  operator: Token;
  right: Expression;

  constructor(operator: Token, right: Expression) {
    this.operator = operator;
    this.right = right;
  }
}

class BinaryExpression implements Expression {
  left: Expression;
  operator: Token;
  right: Expression;

  constructor(left: Expression, operator: Token, right: Expression) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

class LocalStatement implements Statement {
  variables: Identifier[];
  initializations: Expression[];

  constructor(variables: Identifier[], initializations: Expression[]) {
    this.variables = variables;
    this.initializations = initializations;
  }
}

class Chunk {
  body: Statement[];

  constructor(body: Statement[]) {
    this.body = body;
  }
}

export {
  BinaryExpression,
  BooleanLiteral,
  Chunk,
  CommentLiteral,
  GroupingExpression,
  Identifier,
  LocalStatement,
  NilLiteral,
  NumericLiteral,
  StringLiteral,
  UnaryExpression,
  VarargLiteral,
};
export type { Expression, Statement };
