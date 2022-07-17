interface Token {
  type: TokenType;
  value: string;
  range: number[];
  lnum: number;
  lnumStartIndex: number;
  isKeyword: boolean;
}

enum TokenType {
  Identifier = "Identifier", // User defined identifiers within the language

  StringLiteral = "StringLiteral", // " or '
  NumericLiteral = "NumericLiteral", // 1, 2, 3, 4, etc.
  BooleanLiteral = "BooleanLiteral", // true or false
  NilLiteral = "NilLiteral", // nil
  VarargLiteral = "VarargLiteral", // ...
  CommentLiteral = "CommentLiteral", // -- or --[[]]

  // Keywords
  Do = "Do",
  If = "If",
  In = "In",
  End = "End",
  For = "For",
  Else = "Else",
  Then = "Then",
  Break = "Break",
  Local = "Local",
  Until = "Until",
  While = "While",
  Elseif = "Elseif",
  Repeat = "Repeat",
  Return = "Return",
  Function = "Function",
  Goto = "Goto",
  Or = "Or",
  And = "And",
  Not = "Not",

  // Punctuators
  Dot = "Dot", // .
  Comma = "Comma", // ,
  Equal = "Equal", // =
  GreaterThan = "GreaterThan", // >
  LessThan = "LessThan", // <
  Divide = "Divide", // /
  Colon = "Colon", // :
  Tilda = "Tilda", // ~
  Ampersand = "Ampersand", // &
  Pipe = "Pipe", // |
  Star = "Star", // *
  Carrot = "Carrot", // ^
  Percentage = "Percentage", // %
  OpenBrace = "OpenBrace", // {
  ClosedBrace = "ClosedBrace", // }
  OpenParenthesis = "OpenParenthesis", // (
  ClosedParenthesis = "ClosedParenthesis", // )
  OpenBracket = "OpenBracket", // [
  ClosedBracket = "ClosedBracket", // ]
  SemiColon = "SemiColon", // ;
  HashTag = "HashTag", // #
  Minus = "Minus", // -
  Plus = "Plus", // +
  DoubleDot = "DoubleDot", // ..
  DoubleEqual = "DoubleEqual", // ==
  TildaEqual = "TildaEqual", // ~=
  GreaterThanEqual = "GreaterThanEqual", // >=
  LessThanEqual = "LessThanEqual", // <=
  DoubleDivide = "DoubleDivide", // //
  DoubleColon = "DoubleColon", // ::
  DoubleGreaterThan = "DoubleGreaterThan", // >>
  DoubleLessThan = "DoubleLessThan", // <<

  EOF = "EOF", // <eof>
}

export { TokenType };
export type { Token };
