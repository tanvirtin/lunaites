import { Token } from "./mod.ts";

interface Expression {
  toString(): string;
  toJSON(): unknown;
}

interface Statement {
  toString(): string;
  toJSON(): unknown;
}

class Literal implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  toJSON() {
    return {
      type: "Literal",
      value: this.token.value,
    };
  }
}

class NilLiteral extends Literal {
  toJSON() {
    return {
      type: "NilLiteral",
      value: this.token.value,
    };
  }
}

class VarargLiteral extends Literal {
  toJSON() {
    return {
      type: "VarargLiteral",
      value: this.token.value,
    };
  }
}

class StringLiteral extends Literal {
  toJSON() {
    return {
      type: "StringLiteral",
      value: this.token.value,
    };
  }
}

class NumericLiteral extends Literal {
  toJSON() {
    return {
      type: "NumericLiteral",
      value: this.token.value,
    };
  }
}

class BooleanLiteral extends Literal {
  toJSON() {
    return {
      type: "BooleanLiteral",
      value: this.token.value,
    };
  }
}

class CommentLiteral extends Literal {
  toJSON() {
    return {
      type: "CommentLiteral",
      value: this.token.value,
    };
  }
}

class Identifier implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  toJSON() {
    return {
      type: "Identifier",
      name: this.token.value,
    };
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

  toJSON() {
    return {
      type: "GroupingExpression",
      expression: this.expression.toJSON(),
    };
  }
}

class UnaryExpression implements Expression {
  operator: Token;
  argument: Expression;

  constructor(operator: Token, argument: Expression) {
    this.operator = operator;
    this.argument = argument;
  }

  toJSON() {
    return {
      type: "UnaryExpression",
      operator: this.operator.value,
      argument: this.argument.toJSON(),
    };
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

  toJSON() {
    return {
      type: "BinaryExpression",
      left: this.left.toJSON(),
      operator: this.operator.value,
      right: this.right.toJSON(),
    };
  }
}

class LocalStatement implements Statement {
  variables: Identifier[];
  init: Expression[];

  constructor(variables: Identifier[], init: Expression[]) {
    this.variables = variables;
    this.init = init;
  }

  toJSON() {
    return {
      type: "LocalStatement",
      variables: this.variables.map((variable) => variable.toJSON()),
      init: this.init.map((expression) => expression.toJSON()),
    };
  }
}

class ReturnStatement implements Statement {
  arguments: Expression[];

  constructor(expressions: Expression[]) {
    this.arguments = expressions;
  }

  toJSON() {
    return {
      type: "ReturnStatement",
      expressions: this.arguments.map((argument) => argument.toJSON()),
    };
  }
}

class LabelStatement implements Statement {
  name: Identifier;

  constructor(name: Identifier) {
    this.name = name;
  }

  toJSON() {
    return {
      type: "LabelStatement",
      name: this.name,
    };
  }
}

class Block {
  statements: Statement[];

  constructor(statements: Statement[]) {
    this.statements = statements;
  }

  toJSON() {
    return this.statements.map((statement) => statement.toJSON());
  }
}

class Chunk {
  block: Block;

  constructor(block: Block) {
    this.block = block;
  }

  toJSON() {
    return {
      type: "Chunk",
      block: this.block.toJSON(),
    };
  }
}

export {
  BinaryExpression,
  Block,
  BooleanLiteral,
  Chunk,
  CommentLiteral,
  GroupingExpression,
  Identifier,
  LabelStatement,
  LocalStatement,
  NilLiteral,
  NumericLiteral,
  ReturnStatement,
  StringLiteral,
  UnaryExpression,
  VarargLiteral,
};
export type { Expression, Statement };
