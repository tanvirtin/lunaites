import { gql, GraphQLHTTP, HTTPServer, makeExecutableSchema } from "./deps.ts";
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
