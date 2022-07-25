import { Expression } from "./ast.ts";
import {
  ast,
  ParserException,
  Precedence,
  Scanner,
  TokenCursor,
  Tokenizer,
  TokenType,
} from "./mod.ts";

const {
  Not,
  Dot,
  Colon,
  Equal,
  Do,
  Identifier,
  ClosedBrace,
  OpenBracket,
  ClosedBracket,
  OpenBrace,
  EOF,
  NilLiteral,
  BooleanLiteral,
  ClosedParenthesis,
  StringLiteral,
  CommentLiteral,
  NumericLiteral,
  Or,
  Comma,
  And,
  VarargLiteral,
  DoubleColon,
  Star,
  DoubleDivide,
  LessThan,
  GreaterThan,
  DoubleDot,
  TildaEqual,
  DoubleLessThan,
  DoubleGreaterThan,
  DoubleEqual,
  Divide,
  Tilda,
  Carrot,
  Ampersand,
  LessThanEqual,
  OpenParenthesis,
  Pipe,
  Plus,
  Minus,
  HashTag,
  SemiColon,
  Return,
  If,
  In,
  For,
  Goto,
  Else,
  Then,
  Local,
  Break,
  Until,
  While,
  Elseif,
  Repeat,
  End,
  Function,
  GreaterThanEqual,
} = TokenType;

// Prerequisites: Backus-Naur Form
// - http://marvin.cs.uidaho.edu/Teaching/CS445/grammar.pdf
// References:
// - https://www.lua.org/manual/5.4/manual.html#9
// - https://craftinginterpreters.com/

// Pratt parser.
class Parser {
  #scanner: Scanner;
  #tokenCursor: TokenCursor;

  constructor(source: string) {
    const scanner = new Scanner(source);
    const tokenizer = new Tokenizer(scanner, {
      contextualGoto: false,
    });
    const tokenCursor = new TokenCursor(tokenizer);

    this.#scanner = scanner;
    this.#tokenCursor = tokenCursor;

    // We start the cursor.
    this.#tokenCursor.advance();
  }

  #assertToken(tokenType: TokenType): Parser | never {
    if (!this.#tokenCursor.consume(tokenType)) {
      ParserException.raiseUnexpectedTokenError(
        this.#scanner,
        this.#tokenCursor.current,
        this.#tokenCursor.next,
      );
    }

    return this;
  }

  #expect(value: string | TokenType): TokenCursor | never {
    if (this.#tokenCursor.match(value)) {
      return this.#tokenCursor;
    }

    ParserException.raiseExpectedError(
      this.#scanner,
      value,
      this.#tokenCursor.next,
    );
  }

  // AST Node parsers.
  // -----------------------------------------------------------------------
  // Each method below will move the token cursor as necessary tokens are
  // gathered to create a particular node in the ast.
  //
  // After parsing of a node is completed, the parser method should not move
  // the token cursor any further.
  //
  // This means after an ast node has been parsed, the token cursor will be
  // located in the last token that was part of the ast node that just got parsed.
  //
  // Since I am generating an ast through recursion it is important that each
  // parser method keeps this behaviour consistent to avoid random bugs.

  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Utility /////////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  // args ::= ‘(’ [explist] ‘)’ | tableconstructor | LiteralString
  #parseArgs(): ast.Expression[] {
    if (this.#tokenCursor.match(OpenParenthesis)) {
      this.#tokenCursor.advance();

      if (this.#tokenCursor.match(ClosedParenthesis)) {
        return [];
      }

      const explist = this.#parseExplist();

      this.#tokenCursor.advance();

      this.#expect(ClosedParenthesis);

      return explist;
    }

    if (this.#tokenCursor.match(OpenBrace)) {
      return [this.#parseTableConstructorExpression()];
    }

    if (this.#tokenCursor.match(StringLiteral)) {
      return [this.#parseStringLiteralExpression()];
    }

    ParserException.raiseExpectedError(
      this.#scanner,
      "function arguments",
      this.#tokenCursor.current,
    );
  }

  // field ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
  #parseField(): ast.Expression {
    if (this.#tokenCursor.match(OpenBracket)) {
      this.#tokenCursor.advance();

      const key = this.parseExpression();

      this.#tokenCursor.advance();

      this.#expect(ClosedBracket).advance();

      this.#expect(Equal).advance();

      const value = this.parseExpression();

      return new ast.TableKey(key, value);
    }

    if (this.#tokenCursor.match(Identifier)) {
      const key = this.#parseIdentifierExpression();

      this.#tokenCursor.advance();

      this.#expect(Equal).advance();

      const value = this.parseExpression();

      return new ast.TableKeyString(key, value);
    }

    const value = this.parseExpression();

    return new ast.TableValue(value);
  }

  // fieldlist ::= field {fieldsep field} [fieldsep]
  #parseFieldlist(): ast.Expression[] {
    const fieldList = [this.#parseField()];

    while (this.#tokenCursor.someMatchNext(Comma, SemiColon)) {
      // Move to the either matched "," or ";"
      this.#tokenCursor.advance();

      // However if we encounter ClosedBrace we have a dangling "," or ";"
      if (this.#tokenCursor.matchNext(ClosedBrace)) {
        break;
      }

      // We skip over "," or ";"
      this.#tokenCursor.advance();

      fieldList.push(this.#parseField());
    }

    return fieldList;
  }

  // var ::=  Name | prefixexp ‘[’ exp ‘]’ | prefixexp ‘.’ Name
  // prefixexp ::= var | functioncall | ‘(’ exp ‘)’
  // functioncall ::=  prefixexp args | prefixexp ‘:’ Name args
  #parseVar(): ast.Expression {
    if (this.#tokenCursor.match(OpenParenthesis)) {
      return this.#chainFunctionCalls(this.#parseGroupingExpression());
    }

    if (this.#tokenCursor.match(Identifier)) {
      const base = this.#parseIdentifierExpression();

      if (this.#tokenCursor.consumeNext(OpenBracket)) {
        const expression = this.parseExpression();

        this.#tokenCursor.advance();

        this.#expect(ClosedBracket);

        return this.#chainFunctionCalls(
          new ast.IndexExpression(base, expression),
        );
      }

      if (this.#tokenCursor.consumeNext(Dot)) {
        const identifier = this.#parseIdentifierExpression();

        return this.#chainFunctionCalls(
          new ast.MemberExpression(base, ".", identifier),
        );
      }

      if (this.#tokenCursor.consumeNext(Colon)) {
        const identifier = this.#parseIdentifierExpression();

        const memberExpression = new ast.MemberExpression(
          base,
          ":",
          identifier,
        );

        this.#tokenCursor.advance();

        const args = this.#parseArgs();

        return this.#createFunctionCallExpression(memberExpression, args);
      }

      if (
        this.#tokenCursor.someMatchNext(
          OpenParenthesis,
          OpenBrace,
          StringLiteral,
        )
      ) {
        this.#tokenCursor.advance();

        const args = this.#parseArgs();

        return this.#createFunctionCallExpression(base, args);
      }

      return base;
    }

    ParserException.raiseExpectedError(
      this.#scanner,
      "=",
      this.#tokenCursor.next,
    );
  }

  // varlist ::= var {‘,’ var}
  #parseVarlist(): ast.Expression[] {
    const varlist = [this.#parseVar()];

    while (this.#tokenCursor.consumeNext(Comma)) {
      varlist.push(this.#parseVar());
    }

    return varlist;
  }

  // explist ::= exp {‘,’ exp}
  #parseExplist(): ast.Expression[] {
    const expressions = [this.parseExpression()];

    while (this.#tokenCursor.consumeNext(Comma)) {
      expressions.push(this.parseExpression());
    }

    return expressions;
  }

  // namelist ::= Name {‘,’ Name}
  #parseNamelist(): ast.Identifier[] {
    const namelist = [this.#parseIdentifierExpression()];

    while (this.#tokenCursor.consumeNext(Comma)) {
      namelist.push(this.#parseIdentifierExpression());
    }

    return namelist;
  }

  // funcname ::= Name {‘.’ Name} [‘:’ Name]
  #parseFuncname(): ast.Identifier | ast.MemberExpression {
    const base = this.#parseIdentifierExpression();

    if (this.#tokenCursor.someMatchNext(Dot, Colon)) {
      this.#tokenCursor.advance();

      const indexerToken = this.#tokenCursor.current;

      this.#tokenCursor.advance();

      const identifier = this.#parseIdentifierExpression();

      return new ast.MemberExpression(base, indexerToken.value, identifier);
    }

    return base;
  }

  // parlist ::= namelist [‘,’ ‘...’] | ‘...’
  #parseParlist(): ast.Expression[] {
    this.#expect(OpenParenthesis).advance();

    const parlist = [];

    if (this.#tokenCursor.match(VarargLiteral)) {
      parlist.push(this.#parseVarargLiteralExpression());
    } else if (this.#tokenCursor.match(Identifier)) {
      parlist.push(this.#parseIdentifierExpression());

      while (this.#tokenCursor.consumeNext(Comma)) {
        if (this.#tokenCursor.match(VarargLiteral)) {
          parlist.push(this.#parseVarargLiteralExpression());
          break;
        }

        parlist.push(this.#parseIdentifierExpression());
      }

      this.#tokenCursor.advance();
    }

    this.#expect(ClosedParenthesis);

    return parlist;
  }

  // funcbody ::= ‘(’ [parlist] ‘)’ block end
  #parseFuncbody(): [ast.Expression[], ast.Block] {
    const parlist = this.#parseParlist();

    this.#tokenCursor.advance();

    const block = this.parseBlock();

    this.#expect(End);

    return [parlist, block];
  }

  //     suffix ::= '[' exp ']' | '.' Name | ':' Name args | args
  //     args ::= '(' [explist] ')' | tableconstructor | String
  #chainFunctionCalls(leftExpression: ast.Expression): ast.Expression {
    while (
      this.#tokenCursor.someMatchNext(
        StringLiteral,
        OpenParenthesis,
        OpenBrace,
        OpenBracket,
        Dot,
        Colon,
      )
    ) {
      if (this.#tokenCursor.consumeNext(OpenBracket)) {
        const expression = this.parseExpression();

        this.#tokenCursor.advance();

        this.#expect(ClosedBracket);

        leftExpression = new ast.IndexExpression(
          leftExpression,
          expression,
        );
      }

      if (this.#tokenCursor.consumeNext(Dot)) {
        const identifier = this.#parseIdentifierExpression();

        leftExpression = new ast.MemberExpression(
          leftExpression,
          ".",
          identifier,
        );
      }

      if (this.#tokenCursor.consumeNext(Colon)) {
        const identifier = this.#parseIdentifierExpression();

        leftExpression = new ast.MemberExpression(
          leftExpression,
          ":",
          identifier,
        );

        this.#tokenCursor.advance();

        const args = this.#parseArgs();

        leftExpression = this.#createFunctionCallExpression(
          leftExpression,
          args,
        );
      }

      if (
        this.#tokenCursor.someMatchNext(
          StringLiteral,
          OpenParenthesis,
          OpenBrace,
        )
      ) {
        this.#tokenCursor.advance();

        const args = this.#parseArgs();

        leftExpression = this.#createFunctionCallExpression(
          leftExpression,
          args,
        );
      }
    }

    return leftExpression;
  }

  #createFunctionCallExpression(
    base: ast.Expression,
    args: ast.Expression[],
  ): ast.Expression {
    return this.#chainFunctionCalls(
      new ast.FunctionCallExpression(base, args),
    );
  }

  //////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Expressions //////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  #parseIdentifierExpression(): ast.Identifier {
    return new ast.Identifier(this.#tokenCursor.current);
  }

  #parseNumericLiteralExpression(): ast.Expression {
    return new ast.NumericLiteral(this.#tokenCursor.current);
  }

  #parseStringLiteralExpression(): ast.Expression {
    return new ast.StringLiteral(this.#tokenCursor.current);
  }

  #parseBooleanLiteralExpression(): ast.Expression {
    return new ast.BooleanLiteral(this.#tokenCursor.current);
  }

  #parseNilLiteralExpression(): ast.Expression {
    return new ast.NilLiteral(this.#tokenCursor.current);
  }

  #parseVarargLiteralExpression(): ast.Expression {
    return new ast.VarargLiteral(this.#tokenCursor.current);
  }

  #parseCommentLiteralExpression(): ast.Expression {
    return new ast.CommentLiteral(this.#tokenCursor.current);
  }

  #parseFunctionExpression(): ast.Expression {
    this.#expect(Function).advance();

    const [parlist, block] = this.#parseFuncbody();

    return new ast.FunctionExpression(parlist, block);
  }

  // tableconstructor ::= ‘{’ [fieldlist] ‘}’
  #parseTableConstructorExpression(): ast.Expression {
    this.#expect(OpenBrace).advance();

    if (this.#tokenCursor.match(ClosedBrace)) {
      return new ast.TableConstructor([]);
    }

    const fieldlist = this.#parseFieldlist();

    this.#tokenCursor.advance();

    this.#expect(ClosedBrace);

    return new ast.TableConstructor(fieldlist);
  }

  #parseUnaryExpression(): ast.Expression {
    const operatorToken = this.#tokenCursor.current;

    // Skip over the operator.
    this.#tokenCursor.advance();

    // Get the right expression to attach to the operator.
    const rightExpression = this.parseExpression(
      Precedence.getUnaryPrecedence(operatorToken),
    );

    return new ast.UnaryExpression(operatorToken, rightExpression);
  }

  #parseBinaryExpression(
    leftExpression: ast.Expression,
  ): ast.Expression {
    const operatorToken = this.#tokenCursor.current;

    // Skip over the operator.
    this.#tokenCursor.advance();

    // Retrieve the right expression.
    const rightExpression = this.parseExpression(
      Precedence.getBinaryPrecedence(operatorToken),
    );

    return new ast.BinaryExpression(
      leftExpression,
      operatorToken,
      rightExpression,
    );
  }

  // NOTE: Grouping expression implicitly will have the highest precedence.
  #parseGroupingExpression(): ast.Expression {
    // Skipping over the OpenParenthesis
    this.#expect(OpenParenthesis).advance();

    // We gather the expression that can be found within the parenthesis.
    const expression = this.parseExpression();

    // Skip over the last token that the expression ended on.
    this.#tokenCursor.advance();

    this.#expect(ClosedParenthesis);

    return new ast.GroupingExpression(expression);
  }

  // exp ::= (unop exp | primary | prefixexp ) { binop exp }
  // primary ::= nil | false | true | Number | String | '...' |
  //             functiondef | tableconstructor
  parseExpression(
    precedence: Precedence = Precedence.Lowest,
  ): ast.Expression {
    // For future me, checkout comments in the link below to refresh your memory on how pratt parsing works:
    //   - https://github.com/tanvirtin/tslox/blob/09209bc1b5025baa9cbbcfe85d03fca9360584e6/src/Parser.ts#L311

    const tokenType = this.#tokenCursor.current.type;

    let leftExpression: Expression;

    switch (tokenType) {
      case NumericLiteral:
        leftExpression = this.#parseNumericLiteralExpression();
        break;

      case StringLiteral:
        leftExpression = this.#parseStringLiteralExpression();
        break;

      case BooleanLiteral:
        leftExpression = this.#parseBooleanLiteralExpression();
        break;

      case NilLiteral:
        leftExpression = this.#parseNilLiteralExpression();
        break;

      case VarargLiteral:
        leftExpression = this.#parseVarargLiteralExpression();
        break;

      case CommentLiteral:
        leftExpression = this.#parseCommentLiteralExpression();
        break;

      case Not:
        leftExpression = this.#parseUnaryExpression();
        break;

      case HashTag:
        leftExpression = this.#parseUnaryExpression();
        break;

      case Tilda:
        leftExpression = this.#parseUnaryExpression();
        break;

      case Minus:
        leftExpression = this.#parseUnaryExpression();
        break;

      case Function:
        leftExpression = this.#parseFunctionExpression();
        break;

      case OpenBrace:
        leftExpression = this.#parseTableConstructorExpression();
        break;

      case Identifier:
        leftExpression = this.#parseVar();
        break;

      case OpenParenthesis:
        leftExpression = this.#parseVar();
        break;

      default:
        ParserException.raiseExpectedError(
          this.#scanner,
          "<expression>",
          this.#tokenCursor.next,
        );
    }

    // If we encounter an operator whos precedence is greater than
    // the last token's precedence, then the new operator will pull
    // the previous operator's intentended right expression as it's left.
    // This means that the last operator's right will be the expression
    // tied to the new operator with higher precedence.
    // Demonstrating what I mean for the expression: 1 + 2 * 3
    //                   AST
    //                    +
    //                  /   \
    //                 1     * <-- Operator precendece in action.
    //                      / \
    //                     2   3
    while (
      !this.#tokenCursor.eofToken &&
      precedence < Precedence.getPrecedence(this.#tokenCursor.next)
    ) {
      this.#tokenCursor.advance();

      const tokenType = this.#tokenCursor.current.type;

      switch (tokenType) {
        case Plus:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Minus:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Star:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Divide:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case DoubleDivide:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case And:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Or:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case GreaterThan:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case LessThan:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case GreaterThanEqual:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case LessThanEqual:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case DoubleEqual:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case TildaEqual:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Pipe:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Tilda:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Ampersand:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case DoubleGreaterThan:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case DoubleLessThan:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case Carrot:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        case DoubleDot:
          leftExpression = this.#parseBinaryExpression(leftExpression);
          break;
        default:
          ParserException.raiseExpectedError(
            this.#scanner,
            "<expression>",
            this.#tokenCursor.next,
          );
      }
    }

    return leftExpression;
  }

  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Statements //////////////////////////////
  ////////////////////////////////////////////////////////////////////////

  // local ::= 'local' 'function' Name funcdecl |
  //           'local' Name {',' Name} ['=' exp {',' exp}]
  parseLocalStatement(): ast.Statement {
    this.#expect(Local).advance();

    if (this.#tokenCursor.match(Function)) {
      return this.parseLocalFunctionStatement();
    }

    if (this.#tokenCursor.match(Identifier)) {
      const namelist = this.#parseNamelist();

      // NOTE: We can have local a, b, c = 1, 2, 3 or just local a, b, c.
      if (this.#tokenCursor.consumeNext(Equal)) {
        const explist = this.#parseExplist();

        return new ast.LocalStatement(namelist, explist);
      }

      return new ast.LocalStatement(namelist, []);
    }

    // Replicating the lua REPL error.
    ParserException.raiseExpectedError(
      this.#scanner,
      "<name>",
      this.#tokenCursor.next,
    );
  }

  // label ::= '::' Name '::'
  parseLabelStatement(): ast.Statement {
    this.#expect(DoubleColon).advance();

    const name = this.#parseIdentifierExpression();

    // We advance over identifier token.
    this.#tokenCursor.advance();

    this.#expect(DoubleColon);

    return new ast.LabelStatement(name);
  }

  // if ::= 'if' exp 'then' block {elseif} ['else' block] 'end'
  // elseif ::= 'elseif' exp 'then' block
  parseIfStatement(): ast.Statement {
    this.#expect(If).advance();

    const ifCondition = this.parseExpression();

    this.#tokenCursor.advance();

    this.#expect(Then).advance();

    const ifBlock = this.parseBlock();
    const elifBlocks: ast.Block[] = [];
    const elifConditions: ast.Expression[] = [];

    while (this.#tokenCursor.consume(Elseif)) {
      elifConditions.push(this.parseExpression());
      this.#tokenCursor.advance();

      this.#tokenCursor.advance();

      elifBlocks.push(this.parseBlock());
    }

    let elseBlock: ast.Block | null = null;

    if (this.#tokenCursor.consume(Else)) {
      elseBlock = this.parseBlock();
    }

    this.#expect(End);

    return new ast.IfStatement(
      ifCondition,
      ifBlock,
      elifConditions,
      elifBlocks,
      elseBlock,
    );
  }

  // retstat ::= 'return' [exp {',' exp}] [';']
  parseReturnStatement(): ast.Statement {
    this.#expect(Return).advance();

    if (this.#tokenCursor.consume(SemiColon) || this.#tokenCursor.eofToken) {
      return new ast.ReturnStatement([]);
    }

    const expressions = this.#parseExplist();

    this.#tokenCursor.consume(SemiColon);

    return new ast.ReturnStatement(expressions);
  }

  parseLocalFunctionStatement(): ast.Statement {
    this.#expect(Function).advance();

    const name = this.#parseIdentifierExpression();

    this.#tokenCursor.advance();

    const [parlist, block] = this.#parseFuncbody();

    return new ast.FunctionLocalStatement(name, parlist, block);
  }

  parseGlobalFunctionStatement(): ast.Statement {
    this.#expect(Function).advance();

    const funcname = this.#parseFuncname();

    this.#tokenCursor.advance();

    const [parlist, block] = this.#parseFuncbody();

    return new ast.FunctionGlobalStatement(funcname, parlist, block);
  }

  // while ::= 'while' exp 'do' block 'end'
  parseWhileStatement(): ast.Statement {
    this.#expect(While).advance();

    const condition = this.parseExpression();

    this.#expect(Do).advance();

    const block = this.parseBlock();

    this.#expect(End);

    return new ast.WhileStatement(block, condition);
  }

  // for ::= Name '=' exp ',' exp [',' exp] 'do' block 'end'
  // for ::= namelist 'in' explist 'do' block 'end'
  // namelist ::= Name {',' Name}
  // explist ::= exp {',' exp}
  parseForStatement(): ast.Statement {
    this.#expect(For).advance();

    this.#expect(Identifier);

    const variable = this.#parseIdentifierExpression();

    // Parse for generic statement
    if (this.#tokenCursor.matchNext(Comma)) {
      const variables: ast.Identifier[] = [variable];

      while (
        !this.#tokenCursor.consumeNext(In) &&
        this.#tokenCursor.consumeNext(Comma)
      ) {
        variables.push(this.#parseIdentifierExpression());
      }

      const iterators = this.#parseExplist();

      this.#tokenCursor.advance();

      this.#expect(Do).advance();

      const block = this.parseBlock();

      this.#expect(End);

      return new ast.ForGenericStatement(variables, iterators, block);
    }

    this.#tokenCursor.advance();

    this.#expect(Equal).advance();

    const start = this.parseExpression();

    this.#tokenCursor.advance();

    this.#expect(Comma).advance();

    const end = this.parseExpression();

    let step;
    // Rule obligation: We are at the last token parseExpression ended on,
    // so we have to consumeNext not consume.
    if (this.#tokenCursor.consumeNext(Comma)) {
      step = this.parseExpression();
    }

    this.#tokenCursor.advance();

    this.#expect(Do).advance();

    const block = this.parseBlock();

    this.#expect(End);

    return new ast.ForNumericStatement(variable, start, end, step, block);
  }

  // repeat ::= 'repeat' block 'until' exp
  parseRepeatStatement(): ast.Statement {
    this.#expect(Repeat).advance();

    const block = this.parseBlock();

    this.#expect(Until).advance();

    const condition = this.parseExpression();

    return new ast.RepeatStatement(block, condition);
  }

  // break ::= 'break'
  parseBreakStatement(): ast.Statement {
    return new ast.BreakStatement();
  }

  // do ::= 'do' block 'end'
  parseDoStatement(): ast.Statement {
    this.#expect(Do).advance();

    const block = this.parseBlock();

    this.#expect(End);

    return new ast.DoStatement(block);
  }

  // goto ::= 'goto' Name
  parseGotoStatement(): ast.Statement {
    this.#expect(Goto).advance();

    this.#expect(Identifier);

    const identifier = this.#parseIdentifierExpression();

    return new ast.GotoStatement(identifier);
  }

  //     assignment ::= varlist '=' explist
  //     var ::= Name | prefixexp '[' exp ']' | prefixexp '.' Name
  //     varlist ::= var {',' var}
  //     explist ::= exp {',' exp}
  //
  //     call ::= callexp
  //     callexp ::= prefixexp args | prefixexp ':' Name args
  parseAssignmentOrFunctionCallStatement(): ast.Statement {
    const varlist = this.#parseVarlist();

    if (varlist.length === 0) {
      ParserException.raiseUnexpectedTokenError(
        this.#scanner,
        this.#tokenCursor.current,
        this.#tokenCursor.next,
      );
    }

    // First argument could either be a function call or an identifier
    const [functionCallOrIdentifier] = varlist;

    if (
      functionCallOrIdentifier instanceof ast.Identifier || varlist.length > 1
    ) {
      this.#tokenCursor.advance();

      this.#expect(Equal).advance();

      const explist = this.#parseExplist();

      return new ast.AssignmentStatement(varlist, explist);
    }

    // This is just a function call statement
    const [functionCallExpression] = varlist;

    const functionCallStatement = new ast.FunctionCallStatement(
      functionCallExpression,
    );

    return functionCallStatement;
  }

  // stat ::=  ‘;’ |
  //         varlist ‘=’ explist |
  //         local function Name funcbody |
  //         local namelist [‘=’ explist]
  //         function funcname funcbody |
  //         label |
  //         break |
  //         goto Name |
  //         do block end |
  //         while exp do block end |
  //         repeat block until exp |
  //         if exp then block {elseif exp then block} [else block] end |
  //         for Name ‘=’ exp ‘,’ exp [‘,’ exp] do block end |
  //         for namelist in explist do block end |
  //         functioncall |
  parseStatement(): ast.Statement | null {
    const token = this.#tokenCursor.current;

    switch (token.type) {
      // @@ TODO: For a true lossless parser,
      // I need to take this into consideration in the future.
      case SemiColon:
        return null;
      case DoubleColon:
        return this.parseLabelStatement();
      case Break:
        return this.parseBreakStatement();
      case Goto:
        return this.parseGotoStatement();
      case Do:
        return this.parseDoStatement();
      case While:
        return this.parseWhileStatement();
      case Repeat:
        return this.parseRepeatStatement();
      case Return:
        return this.parseReturnStatement();
      case If:
        return this.parseIfStatement();
      case For:
        return this.parseForStatement();
      case Function:
        return this.parseGlobalFunctionStatement();
      case Local:
        return this.parseLocalStatement();
      default:
        return this.parseAssignmentOrFunctionCallStatement();
    }
  }

  // block ::= {stat} [retstat]
  parseBlock(): ast.Block {
    // A lua source file should essentially contain an array of statements.

    const statements: ast.Statement[] = [];

    // After a statement has been consumed we advance the cursor.
    // NOTE: Neither expression or statement parser methods should not advance
    //       the token cursor any more than they should.

    // Only continue this loop if:
    //  - We don't encounter an EOF token.
    //  - And we don't encounter a block that is a follow.
    while (!this.#tokenCursor.eofToken && !this.#tokenCursor.isBlockFollow()) {
      if (this.#tokenCursor.current.value === Return) {
        const statement = this.parseStatement();

        if (statement) {
          statements.push(statement);
        }

        this.#tokenCursor.advance();
        this.#tokenCursor.consume(SemiColon);

        break;
      }

      const statement = this.parseStatement();

      if (statement) {
        statements.push(statement);
      }

      this.#tokenCursor.advance();
      this.#tokenCursor.consume(SemiColon);
    }

    return new ast.Block(statements);
  }

  // chunk ::= block
  parseChunk(): ast.Chunk {
    const block = this.parseBlock();

    // A chunk must end on an EOF token, if any other token is there
    // after we are done with parsing a chunk other than EOF it's invalid.
    this.#assertToken(EOF);

    return new ast.Chunk(block);
  }

  parse(): ast.Chunk {
    return this.parseChunk();
  }
}

export { Parser };
