import { Parser, ToJSONVisitor } from "./mod.ts";
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
      let result;
      const parser = new Parser(suite.source);

      try {
        result = parser.parse();
      } catch (err) {
        result = err.message;
      }

      if (typeof suite.result === "string") {
        return assertStrictEquals(result, "");
      }

      const toJSONVisitor = new ToJSONVisitor();
      assertObjectMatch(
        toJSONVisitor.visit(result) as Record<string, unknown>,
        suite.result,
      );
    });

  test.run();
}

await main();
