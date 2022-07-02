import { Parser } from "./mod.ts";
import { Suite, Test, TestType } from "../core/mod.ts";

import { assertObjectMatch, assertStrictEquals } from "./deps.ts";

async function main() {
  const test = new Test({
    name: "parser",
    type: TestType.E2E,
    importMeta: import.meta,
  });

  await test
    .registerE2E((suite: Suite) => {
      let ast;
      const parser = new Parser(suite.source);

      try {
        ast = parser.parse();
      } catch (err) {
        ast = err.message;
      }

      if (typeof suite.result === "string") {
        assertStrictEquals(ast, "");
      } else {
        assertObjectMatch(ast, suite.result);
      }
    });

  test.run();
}

await main();
