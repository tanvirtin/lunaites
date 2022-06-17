import { Server as HTTPServer } from "https://deno.land/std@0.107.0/http/server.ts";
import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.1/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { gql } from "https://deno.land/x/graphql_tag@0.0.1/mod.ts";
import { Token, Tokenizer, TokenType } from "./mod.ts";

class Graphiql {
  private static typeDefs = gql`
    enum TokenType {
      EOF
      StringLiteral
      Keyword
      Identifier
      NumericLiteral
      Punctuator
      BooleanLiteral
      NilLiteral
      VarargLiteral
      Comment
    }

    type Token {
      type: TokenType!
      value: String!
      lnum: Int!
      lnumStartIndex: Int!
      range: [Int!]
    }

    type Query {
      tokens(source: String): [Token]
    }
  `;
  private static resolvers = {
    TokenType: {
      EOF: TokenType.EOF,
      StringLiteral: TokenType.StringLiteral,
      Keyword: TokenType.Keyword,
      Identifier: TokenType.Identifier,
      NumericLiteral: TokenType.NumericLiteral,
      Punctuator: TokenType.Punctuator,
      BooleanLiteral: TokenType.BooleanLiteral,
      NilLiteral: TokenType.NilLiteral,
      VarargLiteral: TokenType.VarargLiteral,
      Comment: TokenType.Comment,
    },
    Query: {
      tokens: (_: unknown, args: Record<string, string>): Token[] => {
        const tokenizer = new Tokenizer(args.source);
        return tokenizer.getTokens();
      },
    },
  };

  static start(addr = "localhost:3000") {
    const httpServer = new HTTPServer({
      handler: async (req) => {
        const { pathname } = new URL(req.url);

        switch (pathname) {
          case "/graphql": {
            const { resolvers, typeDefs } = this;
            const schema = makeExecutableSchema({ resolvers, typeDefs });

            return await GraphQLHTTP<Request>({
              schema,
              graphiql: true,
            })(req);
          }
          default:
            return new Response("Not Found", { status: 404 });
        }
      },
      addr,
    });

    console.info(`Lunaites development server: ${addr}/graphql`);

    httpServer.listenAndServe();
  }
}

Graphiql.start();

export { Graphiql };
