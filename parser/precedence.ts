import { Token, TokenType } from "./mod.ts";

// Precedence is a static class (enum with methods).
class Precedence {
  static Lowest = 1;
  static Or = 2; // or
  static And = 3; // and
  static Comparison = 4; // <, >, <=, >=, ~=, ==
  static BitwiseOr = 5; // |
  static BitwiseExclusiveOr = 6; // ~
  static BitwiseAnd = 7; // &
  static BitwiseShift = 8; // >>, <<
  static StringConcat = 9; // ..
  static Term = 10; // +, -
  static Factor = 11; // *, /, //
  static Unary = 12; // -, #, ~, not
  static Exponent = 13; // ^

  // Each token will have a precedence associated with it.
  // https://www.lua.org/pil/3.5.html
  static getPrecedence(operatorToken: Token) {
    switch (operatorToken.type) {
      default:
        return Precedence.Lowest;

      case TokenType.Or:
        return Precedence.Or;
      case TokenType.And:
        return Precedence.And;

      case TokenType.GreaterThan:
        return Precedence.Comparison;
      case TokenType.LessThan:
        return Precedence.Comparison;
      case TokenType.GreaterThanEqual:
        return Precedence.Comparison;
      case TokenType.LessThanEqual:
        return Precedence.Comparison;
      case TokenType.DoubleEqual:
        return Precedence.Comparison;
      case TokenType.TildaEqual:
        return Precedence.Comparison;

      case TokenType.Pipe:
        return Precedence.BitwiseOr;
      case TokenType.Tilda:
        return Precedence.BitwiseExclusiveOr;
      case TokenType.Ampersand:
        return Precedence.BitwiseAnd;
      case TokenType.DoubleGreaterThan:
        return Precedence.BitwiseShift;
      case TokenType.DoubleLessThan:
        return Precedence.BitwiseShift;

      case TokenType.DoubleDot:
        return Precedence.StringConcat;

      case TokenType.Plus:
        return Precedence.Term;
      case TokenType.Minus:
        return Precedence.Term;

      case TokenType.Percentage:
        return Precedence.Factor;
      case TokenType.Star:
        return Precedence.Factor;
      case TokenType.Divide:
        return Precedence.Factor;
      case TokenType.DoubleDivide:
        return Precedence.Factor;

      case TokenType.Carrot:
        return Precedence.Exponent;
    }
  }

  static getUnaryPrecedence(_operatorToken: Token) {
    return Precedence.Unary;
  }

  static getBinaryPrecedence(operatorToken: Token) {
    return this.getPrecedence(operatorToken);
  }
}

export { Precedence };
