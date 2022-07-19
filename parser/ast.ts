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
  MemberExpression = "MemberExpression",
  UnaryExpression = "UnaryExpression",
  BinaryExpression = "BinaryExpression",
  LocalStatement = "LocalStatement",
  ForNumericStatement = "ForNumericStatement",
  ForGenericStatement = "ForGenericStatement",
  ReturnStatement = "ReturnStatement",
  LabelStatement = "LabelStatement",
  GotoStatement = "GotoStatement",
  BreakStatement = "BreakStatement",
  DoStatement = "DoStatement",
  RepeatStatement = "RepeatStatement",
  WhileStatement = "WhileStatement",
  IfStatement = "IfStatement",
  FunctionLocalStatement = "FunctionLocalStatement",
  FunctionGlobalStatement = "FunctionGlobalStatement",
  AssignmentStatement = "AssignmentStatement",
  TableKey = "TableKey",
  TableKeyString = "TableKeyString",
  TableValue = "TableValue",
  TableConstructor = "TableConstructor",
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

class Identifier implements Expression {
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitIdentifier(this);
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

class FunctionExpression implements Expression {
  parlist: Expression[];
  block: Block;

  constructor(parlist: Expression[], block: Block) {
    this.parlist = parlist;
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitFunctionExpression(this);
  }
}

class FunctionLocalStatement implements Statement {
  funcname: Identifier;
  parlist: Expression[];
  block: Block;

  constructor(
    funcname: Identifier,
    parlist: Expression[],
    block: Block,
  ) {
    this.funcname = funcname;
    this.parlist = parlist;
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitFunctionLocalStatement(this);
  }
}

class FunctionGlobalStatement implements Statement {
  funcname: Identifier | MemberExpression;
  parlist: Expression[];
  block: Block;

  constructor(
    funcname: Identifier | MemberExpression,
    parlist: Expression[],
    block: Block,
  ) {
    this.funcname = funcname;
    this.parlist = parlist;
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitFunctionGlobalStatement(this);
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

class MemberExpression implements Expression {
  base: Identifier;
  identifier: Identifier;
  indexer: string;

  constructor(base: Identifier, indexer: string, identifier: Identifier) {
    this.base = base;
    this.identifier = identifier;
    this.indexer = indexer;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitMemberExpression(this);
  }
}

class TableKey implements Expression {
  key: Expression;
  value: Expression;

  constructor(key: Expression, value: Expression) {
    this.key = key;
    this.value = value;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitTableKey(this);
  }
}

class TableKeyString implements Expression {
  key: Identifier;
  value: Expression;

  constructor(key: Identifier, value: Expression) {
    this.key = key;
    this.value = value;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitTableKeyString(this);
  }
}

class TableValue implements Expression {
  value: Expression;

  constructor(value: Expression) {
    this.value = value;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitTableValue(this);
  }
}

class TableConstructor implements Expression {
  fieldlist: Expression[];

  constructor(fieldlist: Expression[]) {
    this.fieldlist = fieldlist;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitTableConstructor(this);
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

class AssignmentStatement implements Statement {
  variables: Identifier[];
  init: Expression[];

  constructor(variables: Identifier[], init: Expression[]) {
    this.variables = variables;
    this.init = init;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitAssignmentStatement(this);
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

class ForNumericStatement implements Statement {
  variable: Identifier;
  start: Expression;
  end: Expression;
  step: Expression | void;
  block: Block;

  constructor(
    variable: Identifier,
    start: Expression,
    end: Expression,
    step: Expression | void,
    block: Block,
  ) {
    this.variable = variable;
    this.start = start;
    this.end = end;
    this.step = step;
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitForNumericStatement(this);
  }
}

class ForGenericStatement implements Statement {
  variables: Identifier[];
  iterators: Expression[];
  block: Block;

  constructor(
    variables: Identifier[],
    iterators: Expression[],
    block: Block,
  ) {
    this.variables = variables;
    this.iterators = iterators;
    this.block = block;
  }

  accept(visitor: Visitor): unknown {
    return visitor.visitForGenericStatement(this);
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
  AssignmentStatement,
  BinaryExpression,
  Block,
  BooleanLiteral,
  BreakStatement,
  Chunk,
  CommentLiteral,
  DoStatement,
  ForGenericStatement,
  ForNumericStatement,
  FunctionExpression,
  FunctionGlobalStatement,
  FunctionLocalStatement,
  GotoStatement,
  GroupingExpression,
  Identifier,
  IfStatement,
  LabelStatement,
  Literal,
  LocalStatement,
  MemberExpression,
  NilLiteral,
  NodeType,
  NumericLiteral,
  RepeatStatement,
  ReturnStatement,
  StringLiteral,
  TableConstructor,
  TableKey,
  TableKeyString,
  TableValue,
  UnaryExpression,
  VarargLiteral,
  WhileStatement,
};
export type { Expression, Node, Statement, Visitor };
