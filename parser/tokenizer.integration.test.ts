import { Scanner, Tokenizer } from "./mod.ts";
import { Suite, TestRunner, TestType } from "../core/mod.ts";

import { assertObjectMatch, assertStrictEquals } from "./deps.ts";

async function main() {
  const testRunner = new TestRunner({
    name: "tokenizer",
    type: TestType.Integration,
    importMeta: import.meta,
  });

  await testRunner
    .registerIntegration((suite: Suite) => {
      let result;
      const scanner = new Scanner(suite.source);
      const tokenizer = new Tokenizer(scanner);

      try {
        result = tokenizer.getTokens();
      } catch (err) {
        result = err.message;
      }

      if (typeof suite.result === "string") {
        assertStrictEquals(result, suite.result);
      } else {
        assertObjectMatch(result, suite.result);
      }
    });

  testRunner.run();
}

await main();
