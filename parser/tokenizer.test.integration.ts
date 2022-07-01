import { Scanner, Tokenizer } from "./mod.ts";
import { Suite, Test, TestType } from "../core/mod.ts";

import { assertObjectMatch, assertStrictEquals } from "./deps.ts";

async function main() {
  const test = new Test({
    name: "tokenizer",
    type: TestType.Integration,
    importMeta: import.meta,
  });

  await test
    .registerIntegration((suite: Suite) => {
      let expectedResult;
      const scanner = new Scanner(suite.source);
      const tokenizer = new Tokenizer(scanner);

      try {
        expectedResult = tokenizer.getTokens();
      } catch (err) {
        expectedResult = err.message;
      }

      if (typeof suite.result === "string") {
        assertStrictEquals(expectedResult, suite.result);
      } else {
        assertObjectMatch(expectedResult, suite.result);
      }
    });

  test.run();
}

await main();
