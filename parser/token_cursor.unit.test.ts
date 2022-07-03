import { Scanner, TokenCursor, Tokenizer, TokenType } from "./mod.ts";
import { assert, assertObjectMatch, describe, it } from "./deps.ts";

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
        type: TokenType.Keyword,
        value: "local",
      });

      cursor.advance();

      assertObjectMatch(cursor.current, {
        type: TokenType.Keyword,
        value: "function",
      });
    });
  });

  describe("at", () => {
    it("should return the token at the given arbitary index", () => {
      const cursor = createTokenCursor();

      assertObjectMatch(cursor.at(2), {
        type: TokenType.Identifier,
        value: "main",
      });

      assertObjectMatch(cursor.at(0), {
        type: TokenType.Keyword,
        value: "local",
      });

      assertObjectMatch(cursor.at(0), {
        type: TokenType.Keyword,
        value: "local",
      });

      assertObjectMatch(cursor.at(6), {
        type: TokenType.Identifier,
        value: "foo",
      });

      assertObjectMatch(cursor.at(100), {
        type: TokenType.EOF,
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
        type: TokenType.Identifier,
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
        type: TokenType.Equal,
        value: "=",
      });

      assertObjectMatch(cursor.lookahead(1), {
        type: TokenType.Identifier,
        value: "main",
      });

      assertObjectMatch(cursor.lookahead(6), {
        type: TokenType.Equal,
        value: "=",
      });

      cursor
        .advance();

      assertObjectMatch(cursor.lookahead(5), {
        type: TokenType.Equal,
        value: "=",
      });

      assertObjectMatch(cursor.lookahead(1000), {
        type: TokenType.EOF,
        value: "<eof>",
      });
    });
  });

  describe("next", () => {
    it("should return the next token without moving the cursor", () => {
      const cursor = createTokenCursor();

      assertObjectMatch(cursor.next, {
        type: TokenType.Keyword,
        value: "local",
      });

      cursor
        .advance();

      assertObjectMatch(cursor.next, {
        type: TokenType.Keyword,
        value: "function",
      });

      cursor
        .advance();

      assertObjectMatch(cursor.next, {
        type: TokenType.Identifier,
        value: "main",
      });

      assertObjectMatch(cursor.lookahead(1000), {
        type: TokenType.EOF,
        value: "<eof>",
      });

      assertObjectMatch(cursor.next, {
        type: TokenType.Identifier,
        value: "main",
      });
    });
  });

  describe("match", () => {
    it("should return true if the current token is the token type provided, false otherwise", () => {
      const cursor = createTokenCursor();

      assert(!cursor.match(TokenType.Identifier));

      cursor
        .advance();

      assert(cursor.match(TokenType.Keyword));

      cursor
        .advance();

      assert(cursor.match(TokenType.Keyword));
    });
  });

  describe("consume", () => {
    it("should automatically advance the cursor if a token match is found", () => {
      const cursor = createTokenCursor();

      cursor
        .advance();

      assert(cursor.consume(TokenType.Keyword));
      assert(cursor.consume(TokenType.Keyword));
      assert(cursor.consume(TokenType.Identifier));
      assert(!cursor.consume(TokenType.Keyword));
      assert(cursor.consume(TokenType.OpenParenthesis));
    });
  });

  describe("consumeNext", () => {
    it("should automatically advance the cursor if next token match is found", () => {
      const cursor = createTokenCursor();

      cursor
        .advance();

      assert(cursor.consumeNext(TokenType.Keyword));
      assert(cursor.consumeNext(TokenType.OpenParenthesis));
      assert(cursor.consumeNext(TokenType.Keyword));
      assert(cursor.consumeNext(TokenType.Equal));
    });
  });
});
