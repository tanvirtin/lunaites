import { ast } from "../mod.ts";
import { Visitor } from "./mod.ts";

class MinimizerVisitor implements Visitor {
  visitLiteral(_node: ast.Literal) {
    return ast.NodeType.Literal;
  }

  visitNilLiteral(_node: ast.NilLiteral) {
    return ast.NodeType.NilLiteral;
  }

  visitVarargLiteral(_node: ast.VarargLiteral) {
    return ast.NodeType.VarargLiteral;
  }

  visitStringLiteral(_node: ast.StringLiteral) {
    return ast.NodeType.StringLiteral;
  }

  visitNumericLiteral(_node: ast.NumericLiteral) {
    return ast.NodeType.NumericLiteral;
  }

  visitBooleanLiteral(_node: ast.BooleanLiteral) {
    return ast.NodeType.BooleanLiteral;
  }

  visitCommentLiteral(_node: ast.CommentLiteral) {
    return ast.NodeType.CommentLiteral;
  }

  visitIdentifier(_node: ast.Identifier) {
    return ast.NodeType.Identifier;
  }

  visitGotoStatement(_node: ast.GotoStatement): unknown {
    return ast.NodeType.GotoStatement;
  }

  visitGroupingExpression(node: ast.GroupingExpression): unknown {
    return {
      type: ast.NodeType.GroupingExpression,
      expression: node.expression.accept(this),
    };
  }

  visitMemberExpression(node: ast.MemberExpression): unknown {
    return {
      type: ast.NodeType.MemberExpression,
      indexer: node.indexer,
      base: node.base.accept(this),
      identifier: node.identifier.accept(this),
    };
  }

  visitUnaryExpression(node: ast.UnaryExpression): unknown {
    return {
      type: ast.NodeType.UnaryExpression,
      argument: node.argument.accept(this),
    };
  }

  visitBinaryExpression(node: ast.BinaryExpression): unknown {
    return {
      type: ast.NodeType.BinaryExpression,
      left: node.left.accept(this),
      right: node.right.accept(this),
    };
  }

  visitFunctionExpression(node: ast.FunctionExpression): unknown {
    return {
      type: ast.NodeType.FunctionExpression,
      parlist: node.parlist.map((par) => par.accept(this)),
      block: node.block.accept(this),
    };
  }

  visitLabelStatement(_node: ast.LabelStatement) {
    return ast.NodeType.LabelStatement;
  }

  visitBreakStatement(_node: ast.BreakStatement): unknown {
    return ast.NodeType.BreakStatement;
  }

  visitLocalStatement(node: ast.LocalStatement): unknown {
    return {
      type: ast.NodeType.LocalStatement,
      variables: node.variables.map((variable) => variable.accept(this)),
      init: node.init.map((expression) => expression.accept(this)),
    };
  }

  visitReturnStatement(node: ast.ReturnStatement): unknown {
    return {
      type: ast.NodeType.ReturnStatement,
      expressions: node.arguments.map((argument) => argument.accept(this)),
    };
  }

  visitRepeatStatement(node: ast.RepeatStatement): unknown {
    return {
      type: ast.NodeType.RepeatStatement,
      condition: node.condition.accept(this),
      body: node.block.accept(this),
    };
  }

  visitWhileStatement(node: ast.WhileStatement): unknown {
    return {
      type: ast.NodeType.WhileStatement,
      condition: node.condition.accept(this),
      body: node.block.accept(this),
    };
  }

  visitIfStatement(node: ast.IfStatement): unknown {
    return {
      type: ast.NodeType.IfStatement,
      ifCondition: node.ifCondition.accept(this),
      ifBlock: node.ifBlock.accept(this),
      elseifConditions: node.elseifConditions.map((condition) =>
        condition.accept(this)
      ),
      elseifBlocks: node.elseifBlocks.map((block) => block.accept(this)),
      elseBlock: node.elseBlock?.accept(this),
    };
  }

  visitFunctionLocalStatement(node: ast.FunctionLocalStatement): unknown {
    return {
      type: ast.NodeType.FunctionLocalStatement,
      name: node.name.accept(this),
      parlist: node.parlist.map((par) => par.accept(this)),
      block: node.block.accept(this),
    };
  }

  visitFunctionGlobalStatement(node: ast.FunctionGlobalStatement): unknown {
    return {
      type: ast.NodeType.FunctionGlobalStatement,
      funcname: node.funcname.accept(this),
      parlist: node.parlist.map((par) => par.accept(this)),
      block: node.block.accept(this),
    };
  }

  visitForNumericStatement(node: ast.ForNumericStatement): unknown {
    return {
      type: ast.NodeType.ForNumericStatement,
      variable: node.variable.accept(this),
      start: node.start.accept(this),
      end: node.end.accept(this),
      step: node.step?.accept(this),
      block: node.block.accept(this),
    };
  }

  visitForGenericStatement(node: ast.ForGenericStatement): unknown {
    return {
      type: ast.NodeType.ForGenericStatement,
      variables: node.variables.map((variable) => variable.accept(this)),
      iterators: node.iterators.map((iterator) => iterator.accept(this)),
      block: node.block.accept(this),
    };
  }

  visitDoStatement(node: ast.DoStatement): unknown {
    return {
      type: ast.NodeType.DoStatement,
      body: node.block.accept(this),
    };
  }

  visitAssignmentStatement(node: ast.AssignmentStatement): unknown {
    return {
      type: ast.NodeType.AssignmentStatement,
      variables: node.variables.map((variable) => variable.accept(this)),
      init: node.init.map((iterator) => iterator.accept(this)),
    };
  }

  visitBlock(node: ast.Block): unknown {
    return node.statements.map((statement) => statement.accept(this));
  }

  visitChunk(node: ast.Chunk): unknown {
    return {
      type: ast.NodeType.Chunk,
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
      case ast.IfStatement:
        return this.visitIfStatement(node as ast.IfStatement);
      case ast.WhileStatement:
        return this.visitWhileStatement(node as ast.WhileStatement);
      case ast.ForNumericStatement:
        return this.visitForNumericStatement(node as ast.ForNumericStatement);
      case ast.AssignmentStatement:
        return this.visitAssignmentStatement(node as ast.AssignmentStatement);
      case ast.FunctionLocalStatement:
        return this.visitFunctionLocalStatement(
          node as ast.FunctionLocalStatement,
        );
      case ast.FunctionGlobalStatement:
        return this.visitFunctionGlobalStatement(
          node as ast.FunctionGlobalStatement,
        );
      case ast.BreakStatement:
        return this.visitBreakStatement(node as ast.BreakStatement);
      case ast.BinaryExpression:
        return this.visitBinaryExpression(node as ast.BinaryExpression);
      case ast.UnaryExpression:
        return this.visitUnaryExpression(node as ast.UnaryExpression);
      case ast.GroupingExpression:
        return this.visitGroupingExpression(node as ast.GroupingExpression);
      case ast.MemberExpression:
        return this.visitMemberExpression(node as ast.MemberExpression);
      case ast.FunctionExpression:
        return this.visitFunctionExpression(node as ast.FunctionExpression);
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

export { MinimizerVisitor };
