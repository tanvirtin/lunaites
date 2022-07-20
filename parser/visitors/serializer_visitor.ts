import { ast } from "../mod.ts";
import { Visitor } from "./mod.ts";

class SerializerVisitor implements Visitor {
  visitLiteral(node: ast.Literal) {
    return {
      type: ast.NodeType.Literal,
      value: node.token.value,
    };
  }

  visitNilLiteral(node: ast.NilLiteral) {
    return {
      type: ast.NodeType.NilLiteral,
      value: node.token.value,
    };
  }

  visitVarargLiteral(node: ast.VarargLiteral) {
    return {
      type: ast.NodeType.VarargLiteral,
      value: node.token.value,
    };
  }

  visitStringLiteral(node: ast.StringLiteral) {
    return {
      type: ast.NodeType.StringLiteral,
      value: node.token.value,
    };
  }

  visitNumericLiteral(node: ast.NumericLiteral) {
    return {
      type: ast.NodeType.NumericLiteral,
      value: node.token.value,
    };
  }

  visitBooleanLiteral(node: ast.BooleanLiteral) {
    return {
      type: ast.NodeType.BooleanLiteral,
      value: node.token.value,
    };
  }

  visitCommentLiteral(node: ast.CommentLiteral) {
    return {
      type: ast.NodeType.CommentLiteral,
      value: node.token.value,
    };
  }

  visitIdentifier(node: ast.Identifier) {
    return {
      type: ast.NodeType.Identifier,
      name: node.token.value,
    };
  }

  visitGotoStatement(node: ast.GotoStatement): unknown {
    return {
      type: ast.NodeType.GotoStatement,
      label: node.label.accept(this),
    };
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
      base: node.base.accept(this),
      indexer: node.indexer,
      identifier: node.identifier.accept(this),
    };
  }

  visitUnaryExpression(node: ast.UnaryExpression): unknown {
    return {
      type: ast.NodeType.UnaryExpression,
      operator: node.operator.value,
      argument: node.argument.accept(this),
    };
  }

  visitBinaryExpression(node: ast.BinaryExpression): unknown {
    return {
      type: ast.NodeType.BinaryExpression,
      left: node.left.accept(this),
      operator: node.operator.value,
      right: node.right.accept(this),
    };
  }

  visitTableKey(node: ast.TableKey): unknown {
    return {
      type: ast.NodeType.TableKey,
      key: node.key.accept(this),
      value: node.value.accept(this),
    };
  }

  visitTableKeyString(node: ast.TableKeyString): unknown {
    return {
      type: ast.NodeType.TableKeyString,
      key: node.key.accept(this),
      value: node.value.accept(this),
    };
  }

  visitTableValue(node: ast.TableValue): unknown {
    return {
      type: ast.NodeType.TableValue,
      value: node.value.accept(this),
    };
  }

  visitTableConstructor(node: ast.TableConstructor): unknown {
    return {
      type: ast.NodeType.TableConstructor,
      fieldlist: node.fieldlist.map((field) => field.accept(this)),
    };
  }

  visitStringCallExpression(node: ast.StringCallExpression): unknown {
    return {
      type: ast.NodeType.StringCallExpression,
      base: node.base.accept(this),
      argument: node.argument.accept(this),
    };
  }

  visitCallExpression(node: ast.CallExpression): unknown {
    return {
      type: ast.NodeType.CallExpression,
      base: node.base.accept(this),
      args: node.args.map((arg) => arg.accept(this)),
    };
  }

  visitLocalStatement(node: ast.LocalStatement): unknown {
    return {
      type: ast.NodeType.LocalStatement,
      variables: node.variables.map((variable) => variable.accept(this)),
      init: node.init.map((expression) => expression.accept(this)),
    };
  }

  visitCallStatement(node: ast.CallStatement): unknown {
    return {
      type: ast.NodeType.CallStatement,
      expression: node.expression.accept(this),
    };
  }

  visitReturnStatement(node: ast.ReturnStatement): unknown {
    return {
      type: ast.NodeType.ReturnStatement,
      expressions: node.arguments.map((argument) => argument.accept(this)),
    };
  }

  visitLabelStatement(node: ast.LabelStatement) {
    return {
      type: ast.NodeType.LabelStatement,
      name: node.name,
    };
  }

  visitBreakStatement(_node: ast.BreakStatement): unknown {
    return {
      type: ast.NodeType.BreakStatement,
    };
  }

  visitRepeatStatement(node: ast.RepeatStatement): unknown {
    return {
      type: ast.NodeType.BreakStatement,
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

  visitDoStatement(node: ast.DoStatement): unknown {
    return {
      type: ast.NodeType.DoStatement,
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
      funcname: node.funcname.accept(this),
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

  visitAssignmentStatement(node: ast.AssignmentStatement): unknown {
    return {
      type: ast.NodeType.AssignmentStatement,
      variables: node.variables.map((variable) => variable.accept(this)),
      init: node.init.map((iterator) => iterator.accept(this)),
    };
  }

  visitFunctionExpression(node: ast.FunctionExpression): unknown {
    return {
      type: ast.NodeType.FunctionExpression,
      parlist: node.parlist.map((par) => par.accept(this)),
      block: node.block.accept(this),
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
      case ast.BreakStatement:
        return this.visitBreakStatement(node as ast.BreakStatement);
      case ast.WhileStatement:
        return this.visitWhileStatement(node as ast.WhileStatement);
      case ast.IfStatement:
        return this.visitIfStatement(node as ast.IfStatement);
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
      case ast.TableKey:
        return this.visitTableKey(node as ast.TableKey);
      case ast.TableKeyString:
        return this.visitTableKeyString(node as ast.TableKeyString);
      case ast.TableValue:
        return this.visitTableValue(node as ast.TableValue);
      case ast.TableConstructor:
        return this.visitTableConstructor(node as ast.TableConstructor);
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
      case ast.StringCallExpression:
        return this.visitStringCallExpression(node as ast.StringCallExpression);
      case ast.CallExpression:
        return this.visitCallExpression(node as ast.CallExpression);
      case ast.CallStatement:
        return this.visitCallStatement(node as ast.CallStatement);
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

export { SerializerVisitor };
