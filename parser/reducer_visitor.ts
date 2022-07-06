import { ast, Visitor } from "./mod.ts";

enum NodeType {
  Literal = "Literal",
  NilLiteral = "NilLiteral",
  VarargLiteral = "VarargLiteral",
  StringLiteral = "StringLiteral",
  NumericLiteral = "NumericLiteral",
  BooleanLiteral = "BooleanLiteral",
  CommentLiteral = "CommentLiteral",
  Identifier = "Identifier",
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
  Block = "Block",
  Chunk = "Chunk",
}

class ReducerVisitor implements Visitor {
  visitLiteral(_node: ast.Literal) {
    return NodeType.Literal;
  }

  visitNilLiteral(_node: ast.NilLiteral) {
    return NodeType.NilLiteral;
  }

  visitVarargLiteral(_node: ast.VarargLiteral) {
    return NodeType.VarargLiteral;
  }

  visitStringLiteral(_node: ast.StringLiteral) {
    return NodeType.StringLiteral;
  }

  visitNumericLiteral(_node: ast.NumericLiteral) {
    return NodeType.NumericLiteral;
  }

  visitBooleanLiteral(_node: ast.BooleanLiteral) {
    return NodeType.BooleanLiteral;
  }

  visitCommentLiteral(_node: ast.CommentLiteral) {
    return NodeType.CommentLiteral;
  }

  visitIdentifier(_node: ast.Identifier) {
    return NodeType.Identifier;
  }

  visitGotoStatement(_node: ast.GotoStatement): unknown {
    return NodeType.GotoStatement;
  }

  visitGroupingExpression(node: ast.GroupingExpression): unknown {
    return {
      type: NodeType.GroupingExpression,
      expression: node.expression.accept(this),
    };
  }

  visitUnaryExpression(node: ast.UnaryExpression): unknown {
    return {
      type: NodeType.UnaryExpression,
      argument: node.argument.accept(this),
    };
  }

  visitBinaryExpression(node: ast.BinaryExpression): unknown {
    return {
      type: NodeType.BinaryExpression,
      left: node.left.accept(this),
      right: node.right.accept(this),
    };
  }

  visitLabelStatement(_node: ast.LabelStatement) {
    return NodeType.LabelStatement;
  }

  visitBreakStatement(_node: ast.BreakStatement): unknown {
    return NodeType.BreakStatement;
  }

  visitLocalStatement(node: ast.LocalStatement): unknown {
    return {
      type: NodeType.LocalStatement,
      variables: node.variables.map((variable) => variable.accept(this)),
      init: node.init.map((expression) => expression.accept(this)),
    };
  }

  visitReturnStatement(node: ast.ReturnStatement): unknown {
    return {
      type: NodeType.ReturnStatement,
      expressions: node.arguments.map((argument) => argument.accept(this)),
    };
  }

  visitRepeatStatement(node: ast.RepeatStatement): unknown {
    return {
      type: NodeType.RepeatStatement,
      condition: node.condition.accept(this),
      body: node.block.accept(this),
    };
  }

  visitWhileStatement(node: ast.WhileStatement): unknown {
    return {
      type: NodeType.WhileStatement,
      condition: node.condition.accept(this),
      body: node.block.accept(this),
    };
  }

  visitDoStatement(node: ast.DoStatement): unknown {
    return {
      type: NodeType.DoStatement,
      body: node.block.accept(this),
    };
  }

  visitBlock(node: ast.Block): unknown {
    return node.statements.map((statement) => statement.accept(this));
  }

  visitChunk(node: ast.Chunk): unknown {
    return {
      type: NodeType.Chunk,
      body: node.block.accept(this),
    };
  }

  visit(node: ast.Node): unknown {
    switch (node.constructor) {
      case ast.Chunk:
        return this.visitChunk(node as ast.Chunk);
      case ast.Block:
        return this.visitBlock(node as ast.Block);
      case ast.LabelStatement:
        return this.visitLabelStatement(node as ast.LabelStatement);
      case ast.RepeatStatement:
        return this.visitRepeatStatement(node as ast.RepeatStatement);
      case ast.GotoStatement:
        return this.visitGotoStatement(node as ast.GotoStatement);
      case ast.ReturnStatement:
        return this.visitReturnStatement(node as ast.ReturnStatement);
      case ast.LocalStatement:
        return this.visitLocalStatement(node as ast.LocalStatement);
      case ast.DoStatement:
        return this.visitDoStatement(node as ast.DoStatement);
      case ast.BreakStatement:
        return this.visitBreakStatement(node as ast.BreakStatement);
      case ast.BinaryExpression:
        return this.visitBinaryExpression(node as ast.BinaryExpression);
      case ast.UnaryExpression:
        return this.visitUnaryExpression(node as ast.UnaryExpression);
      case ast.GroupingExpression:
        return this.visitGroupingExpression(node as ast.GroupingExpression);
      case ast.Identifier:
        return this.visitIdentifier(node as ast.Identifier);
      case ast.CommentLiteral:
        return this.visitCommentLiteral(node as ast.CommentLiteral);
      case ast.BooleanLiteral:
        return this.visitBooleanLiteral(node as ast.BooleanLiteral);
      case ast.NumericLiteral:
        return this.visitNumericLiteral(node as ast.NumericLiteral);
      case ast.StringLiteral:
        return this.visitStringLiteral(node as ast.StringLiteral);
      case ast.VarargLiteral:
        return this.visitVarargLiteral(node as ast.VarargLiteral);
      case ast.NilLiteral:
        return this.visitNilLiteral(node as ast.NilLiteral);
      case ast.Literal:
        return this.visitLiteral(node as ast.Literal);
      default:
        throw new Error("no node found for visitor");
    }
  }
}

export { NodeType, ReducerVisitor };
