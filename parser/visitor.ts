import { ast } from "./mod.ts";

interface Visitor {
  visitLiteral(node: ast.Node): unknown;
  visitNilLiteral(node: ast.Node): unknown;
  visitVarargLiteral(node: ast.Node): unknown;
  visitStringLiteral(node: ast.Node): unknown;
  visitNumericLiteral(node: ast.Node): unknown;
  visitBooleanLiteral(node: ast.Node): unknown;
  visitCommentLiteral(node: ast.Node): unknown;
  visitIdentifier(node: ast.Node): unknown;
  visitGroupingExpression(node: ast.Node): unknown;
  visitUnaryExpression(node: ast.Node): unknown;
  visitBinaryExpression(node: ast.Node): unknown;
  visitLocalStatement(node: ast.Node): unknown;
  visitReturnStatement(node: ast.Node): unknown;
  visitLabelStatement(node: ast.Node): unknown;
  visitBlock(node: ast.Node): unknown;
  visitChunk(node: ast.Node): unknown;
  visit(node: ast.Node): unknown;
}

export type { Visitor };
