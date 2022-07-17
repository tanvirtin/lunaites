import { Scanner, TokenCursor, Tokenizer, TokenType } from "./mod.ts";
import { assert, assertObjectMatch, describe, it } from "./deps.ts";

const {
  Identifier,
  EOF,
  BooleanLiteral,
  Equal,
  Carrot,
  Ampersand,
  OpenParenthesis,
  Local,
  Function,
} = TokenType;

function createTokenCursor() {
  const source = `
local function main()
  local foo = 100;
  local bar = "Future";
  local baz = "Hello, world!";

  return string.format('%s, %s years from the %s', baz, foo, bar)
end
`;
  const scanner = new Scanner(source);

  return new TokenCursor(new Tokenizer(scanner));
}

describe("TokenCursor", () => {
  describe("advance", () => {
    it("advances the cursor to the next token", () => {
      const cursor = createTokenCursor();

      cursor.advance();

      assertObjectMatch(cursor.current, {
        type: Local,
        value: "local",
      });

      cursor.advance();

      assertObjectMatch(cursor.current, {
        type: Function,
        value: "function",
      });
    });
  });

  describe("at", () => {
    it("should return the token at the given arbitary index", () => {
      const cursor = createTokenCursor();

      assertObjectMatch(cursor.at(2), {
        type: Identifier,
        value: "main",
      });

      assertObjectMatch(cursor.at(0), {
        type: Local,
        value: "local",
      });

      assertObjectMatch(cursor.at(0), {
        type: Local,
        value: "local",
      });

      assertObjectMatch(cursor.at(6), {
        type: Identifier,
        value: "foo",
      });

      assertObjectMatch(cursor.at(100), {
        type: EOF,
        value: "<eof>",
      });
    });
  });

  describe("current", () => {
    it("should return the current token being pointed at", () => {
      const cursor = createTokenCursor();

      cursor
        .advance()
        .advance()
        .advance();

      assertObjectMatch(cursor.current, {
        type: Identifier,
        value: "main",
      });
    });
  });

  describe("lookahead", () => {
    it("should skip number of tokens provided and point the token without moving the cursor", () => {
      const cursor = createTokenCursor();

      cursor
        .advance()
        .advance();

      assertObjectMatch(cursor.lookahead(6), {
        type: Equal,
        value: "=",
      });

      assertObjectMatch(cursor.lookahead(1), {
        type: Identifier,
        value: "main",
      });

      assertObjectMatch(cursor.lookahead(6), {
        type: Equal,
        value: "=",
      });

      cursor
        .advance();

      assertObjectMatch(cursor.lookahead(5), {
        type: Equal,
        value: "=",
      });

      assertObjectMatch(cursor.lookahead(1000), {
        type: EOF,
        value: "<eof>",
      });
    });
  });

  describe("next", () => {
    it("should return the next token without moving the cursor", () => {
      const cursor = createTokenCursor();

      assertObjectMatch(cursor.next, {
        type: Local,
        value: "local",
      });

      cursor
        .advance();

      assertObjectMatch(cursor.next, {
        type: Function,
        value: "function",
      });

      cursor
        .advance();

      assertObjectMatch(cursor.next, {
        type: Identifier,
        value: "main",
      });

      assertObjectMatch(cursor.lookahead(1000), {
        type: EOF,
        value: "<eof>",
      });

      assertObjectMatch(cursor.next, {
        type: Identifier,
        value: "main",
      });
    });
  });

  describe("match", () => {
    it("should return true if the current token is the token type provided", () => {
      const cursor = createTokenCursor();

      assert(!cursor.match(Local));
      assert(!cursor.match("local"));

      cursor
        .advance();

      assert(cursor.match(Local));
      assert(cursor.match("local"));

      cursor
        .advance();

      assert(cursor.match(Function));
      assert(cursor.match("function"));
    });
  });

  describe("matchNext", () => {
    it("should return true if the next token is the token type provided", () => {
      const cursor = createTokenCursor();

      assert(cursor.matchNext(Local));
      assert(cursor.matchNext("local"));

      cursor
        .advance();

      assert(cursor.matchNext(Function));
      assert(cursor.matchNext("function"));

      cursor
        .advance();

      assert(cursor.matchNext(Identifier));
      assert(cursor.matchNext("main"));
    });
  });

  describe("multiMatch", () => {
    it("should return true if the current token is among one of the token types provided", () => {
      const cursor = createTokenCursor();

      cursor
        .advance();

      assert(
        cursor.multiMatch(
          Ampersand,
          BooleanLiteral,
          Carrot,
          Local,
        ),
      );

      assert(cursor.multiMatch("main", "a", "sup", "local"));
    });
  });

  describe("multiMatchNext", () => {
    it("should return true if the current token is among one of the token types provided", () => {
      const cursor = createTokenCursor();

      cursor
        .advance();

      assert(
        cursor.multiMatchNext(
          Ampersand,
          BooleanLiteral,
          Carrot,
          Function,
        ),
      );

      assert(cursor.multiMatchNext("main", "a", "sup", "function", "local"));
    });
  });

  describe("consume", () => {
    it("should automatically advance the cursor if a token match is found", () => {
      const cursor = createTokenCursor();

      cursor
        .advance();

      assert(cursor.consume(Local));
      assert(cursor.consume(Function));
      assert(cursor.consume(Identifier));
      assert(!cursor.consume(Local));
      assert(cursor.consume(OpenParenthesis));
    });
  });

  describe("consumeNext", () => {
    it("should automatically advance the cursor if next token match is found", () => {
      const cursor = createTokenCursor();

      cursor
        .advance();

      assert(cursor.consumeNext(Function));
      assert(cursor.consumeNext(OpenParenthesis));
      assert(cursor.consumeNext(Local));
      assert(cursor.consumeNext(Equal));
    });
  });
});
