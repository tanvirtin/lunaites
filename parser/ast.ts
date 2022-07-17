import { Token, Visitor } from "./mod.ts";

enum NodeType {
  Literal = "Literal",
  NilLiteral = "NilLiteral",
  VarargLiteral = "VarargLiteral",
  StringLiteral = "StringLiteral",
  NumericLiteral = "NumericLiteral",
  BooleanLiteral = "BooleanLiteral",
  CommentLiteral = "CommentLiteral",
  Identifier = "Identifier",
  FunctionExpression = "FunctionExpression",
  GroupingExpression = "GroupingExpression",
  UnaryExpression = "UnaryExpression",
  BinaryExpression = "BinaryExpression",
  LocalStatement = "LocalStatement",
  ReturnStatement = "ReturnStatement",
  LabelStatement = "LabelStatement",
  GotoStatement = "GotoStatement",
  BreakStatement = "BreakStatement",
  DoStatement = "DoStatement",
  RepeatStatement = "RepeatStatement",
  WhileStatement = "WhileStatement",
  IfStatement = "IfStatement",
  FunctionDeclaration = "FunctionDeclaration",
  Block = "Block",
  Chunk = "Chunk",
}

interface Node {
  accept(visitor: Visitor): unknown;
}

type Expression = Node;
type Statement = Node;

class Literal implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitLiteral(this);
  }
}

class NilLiteral extends Literal {
  accept(visitor: Visitor): unknown {
    return visitor.visitNilLiteral(this);
  }
}

class VarargLiteral extends Literal {
  accept(visitor: Visitor): unknown {
    return visitor.visitVarargLiteral(this);
  }
}

class StringLiteral extends Literal {
  accept(visitor: Visitor): unknown {
    return visitor.visitStringLiteral(this);
  }
}

class NumericLiteral extends Literal {
  accept(visitor: Visitor): unknown {
    return visitor.visitNumericLiteral(this);
  }
}

class BooleanLiteral extends Literal {
  accept(visitor: Visitor): unknown {
    return visitor.visitBooleanLiteral(this);
  }
}

class CommentLiteral extends Literal {
  accept(visitor: Visitor): unknown {
    return visitor.visitCommentLiteral(this);
  }
}

class Identifier implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitIdentifier(this);
  }
}

class FunctionExpression implements Expression {
  arguments: Expression[];
  block: Block;

  constructor(argList: Expression[], block: Block) {
    this.arguments = argList;
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitFunctionExpression(this);
  }
}

class FunctionDeclaration implements Statement {
  isLocal: boolean;
  identifier: Identifier | null;
  arguments: Expression[];
  block: Block;

  constructor(
    isLocal: boolean,
    argList: Expression[],
    block: Block,
    identifier: Identifier | null,
  ) {
    this.isLocal = isLocal;
    this.arguments = argList;
    this.block = block;
    this.identifier = identifier;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitFunctionDeclaration(this);
  }
}

class GroupingExpression implements Expression {
  expression: Expression;

  constructor(expression: Expression) {
    this.expression = expression;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitGroupingExpression(this);
  }
}

class UnaryExpression implements Expression {
  operator: Token;
  argument: Expression;

  constructor(operator: Token, argument: Expression) {
    this.operator = operator;
    this.argument = argument;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitUnaryExpression(this);
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

  accept(visitor: Visitor): unknown {
    return visitor.visitBinaryExpression(this);
  }
}

class LocalStatement implements Statement {
  variables: Identifier[];
  init: Expression[];

  constructor(variables: Identifier[], init: Expression[]) {
    this.variables = variables;
    this.init = init;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitLocalStatement(this);
  }
}

class ReturnStatement implements Statement {
  arguments: Expression[];

  constructor(expressions: Expression[]) {
    this.arguments = expressions;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitReturnStatement(this);
  }
}

class LabelStatement implements Statement {
  name: Identifier;

  constructor(name: Identifier) {
    this.name = name;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitLabelStatement(this);
  }
}

class GotoStatement implements Statement {
  label: Identifier;

  constructor(label: Identifier) {
    this.label = label;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitGotoStatement(this);
  }
}

class BreakStatement implements Statement {
  accept(visitor: Visitor): unknown {
    return visitor.visitBreakStatement(this);
  }
}

class DoStatement implements Statement {
  block: Block;

  constructor(block: Block) {
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitDoStatement(this);
  }
}

class RepeatStatement implements Statement {
  block: Block;
  condition: Expression;

  constructor(block: Block, condition: Expression) {
    this.block = block;
    this.condition = condition;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitRepeatStatement(this);
  }
}

class WhileStatement implements Statement {
  block: Block;
  condition: Expression;

  constructor(block: Block, condition: Expression) {
    this.block = block;
    this.condition = condition;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitWhileStatement(this);
  }
}

class IfStatement implements Statement {
  ifCondition: Expression;
  ifBlock: Block;
  elseifConditions: Expression[];
  elseifBlocks: Block[];
  elseBlock: Block | null;

  constructor(
    ifCondition: Expression,
    ifBlock: Block,
    elseifConditions: Expression[],
    elseifBlocks: Block[],
    elseBlock: Block | null,
  ) {
    this.ifCondition = ifCondition;
    this.ifBlock = ifBlock;
    this.elseifConditions = elseifConditions;
    this.elseifBlocks = elseifBlocks;
    this.elseBlock = elseBlock;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitIfStatement(this);
  }
}

class Block implements Node {
  statements: Statement[];

  constructor(statements: Statement[]) {
    this.statements = statements;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitBlock(this);
  }
}

class Chunk implements Node {
  block: Block;

  constructor(block: Block) {
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitChunk(this);
  }
}

export {
  BinaryExpression,
  Block,
  BooleanLiteral,
  BreakStatement,
  Chunk,
  CommentLiteral,
  DoStatement,
  FunctionDeclaration,
  FunctionExpression,
  GotoStatement,
  GroupingExpression,
  Identifier,
  IfStatement,
  LabelStatement,
  Literal,
  LocalStatement,
  NilLiteral,
  NodeType,
  NumericLiteral,
  RepeatStatement,
  ReturnStatement,
  StringLiteral,
  UnaryExpression,
  VarargLiteral,
  WhileStatement,
};
export type { Expression, Node, Statement, Visitor };
