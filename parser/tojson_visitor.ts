import { ast, Visitor } from "./mod.ts";

class ToJSONVisitor implements Visitor {
  visitLiteral(node: ast.Literal) {
    return {
      type: "Literal",
      value: node.token.value,
    };
  }

  visitNilLiteral(node: ast.NilLiteral) {
    return {
      type: "NilLiteral",
      value: node.token.value,
    };
  }

  visitVarargLiteral(node: ast.VarargLiteral) {
    return {
      type: "VarargLiteral",
      value: node.token.value,
    };
  }

  visitStringLiteral(node: ast.StringLiteral) {
    return {
      type: "StringLiteral",
      value: node.token.value,
    };
  }

  visitNumericLiteral(node: ast.NumericLiteral) {
    return {
      type: "NumericLiteral",
      value: node.token.value,
    };
  }

  visitBooleanLiteral(node: ast.BooleanLiteral) {
    return {
      type: "BooleanLiteral",
      value: node.token.value,
    };
  }

  visitCommentLiteral(node: ast.CommentLiteral) {
    return {
      type: "CommentLiteral",
      value: node.token.value,
    };
  }

  visitIdentifier(node: ast.Identifier) {
    return {
      type: "Identifier",
      name: node.token.value,
    };
  }

  visitGotoStatement(node: ast.GotoStatement): unknown {
    return {
      type: "GotoStatement",
      label: node.label.accept(this),
    };
  }

  visitGroupingExpression(node: ast.GroupingExpression): unknown {
    return {
      type: "GroupingExpression",
      expression: node.expression.accept(this),
    };
  }

  visitUnaryExpression(node: ast.UnaryExpression): unknown {
    return {
      type: "UnaryExpression",
      operator: node.operator.value,
      argument: node.argument.accept(this),
    };
  }

  visitBinaryExpression(node: ast.BinaryExpression): unknown {
    return {
      type: "BinaryExpression",
      left: node.left.accept(this),
      operator: node.operator.value,
      right: node.right.accept(this),
    };
  }
  visitLocalStatement(node: ast.LocalStatement): unknown {
    return {
      type: "LocalStatement",
      variables: node.variables.map((variable) => variable.accept(this)),
      init: node.init.map((expression) => expression.accept(this)),
    };
  }
  visitReturnStatement(node: ast.ReturnStatement): unknown {
    return {
      type: "ReturnStatement",
      expressions: node.arguments.map((argument) => argument.accept(this)),
    };
  }

  visitLabelStatement(node: ast.LabelStatement) {
    return {
      type: "LabelStatement",
      name: node.name,
    };
  }

  visitBlock(node: ast.Block): unknown {
    return node.statements.map((statement) => statement.accept(this));
  }

  visitChunk(node: ast.Chunk): unknown {
    return {
      type: "Chunk",
      body: node.block.accept(this),
    };
  }

  visit(node: ast.Node): unknown {
    if (node instanceof ast.Chunk) {
      return this.visitChunk(node);
    }

    if (node instanceof ast.Block) {
      return this.visitBlock(node);
    }

    if (node instanceof ast.LabelStatement) {
      return this.visitLabelStatement(node);
    }

    if (node instanceof ast.GotoStatement) {
      return this.visitGotoStatement(node);
    }

    if (node instanceof ast.ReturnStatement) {
      return this.visitReturnStatement(node);
    }

    if (node instanceof ast.LocalStatement) {
      return this.visitLocalStatement(node);
    }

    if (node instanceof ast.BinaryExpression) {
      return this.visitBinaryExpression(node);
    }

    if (node instanceof ast.UnaryExpression) {
      return this.visitUnaryExpression(node);
    }

    if (node instanceof ast.GroupingExpression) {
      return this.visitGroupingExpression(node);
    }

    if (node instanceof ast.Identifier) {
      return this.visitIdentifier(node);
    }

    if (node instanceof ast.CommentLiteral) {
      return this.visitCommentLiteral(node);
    }

    if (node instanceof ast.BooleanLiteral) {
      return this.visitBooleanLiteral(node);
    }

    if (node instanceof ast.NumericLiteral) {
      return this.visitNumericLiteral(node);
    }

    if (node instanceof ast.StringLiteral) {
      return this.visitStringLiteral(node);
    }

    if (node instanceof ast.VarargLiteral) {
      return this.visitVarargLiteral(node);
    }

    if (node instanceof ast.NilLiteral) {
      return this.visitNilLiteral(node);
    }

    if (node instanceof ast.Literal) {
      return this.visitLiteral(node);
    }

    throw new Error("no node found for visitor");
  }
}

export { ToJSONVisitor };
