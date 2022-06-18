import { Token } from "./mod.ts";

interface Expression {
  token?: Token;
  left?: Token | Expression;
  right?: Token | Expression;
}

export type { Expression };
