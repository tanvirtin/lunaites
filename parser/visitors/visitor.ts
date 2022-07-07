import { ast } from "../mod.ts";

interface Visitor {
  visitLiteral(node: ast.Node): void;
  visitNilLiteral(node: ast.Node): void;
  visitVarargLiteral(node: ast.Node): void;
  visitStringLiteral(node: ast.Node): void;
  visitNumericLiteral(node: ast.Node): void;
  visitBooleanLiteral(node: ast.Node): void;
  visitCommentLiteral(node: ast.Node): void;
  visitIdentifier(node: ast.Node): void;
  visitGroupingExpression(node: ast.Node): void;
  visitGotoStatement(node: ast.Node): void;
  visitUnaryExpression(node: ast.Node): void;
  visitBinaryExpression(node: ast.Node): void;
  visitLocalStatement(node: ast.Node): void;
  visitReturnStatement(node: ast.Node): void;
  visitLabelStatement(node: ast.Node): void;
  visitDoStatement(node: ast.Node): void;
  visitBreakStatement(node: ast.Node): void;
  visitRepeatStatement(node: ast.Node): void;
  visitWhileStatement(node: ast.Node): void;
  visitBlock(node: ast.Node): void;
  visitChunk(node: ast.Node): void;
  visit(node: ast.Node): void;
}

export type { Visitor };