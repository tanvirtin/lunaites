import { Tokenizer } from "../../mod.ts";
import { SpecGenerator, Suite } from "./spec_generator.ts";
import { assertEquals, describe, it } from "../../deps.ts";

function getTestdataPath() {
  return `${Deno.cwd()}/test/integration/testdata/tokenizer`;
}

function runTest(suite: Suite, computation: (suite: Suite) => void) {
  it(`${suite.source}`, computation.bind(null, suite));
}

function runTests(
  tests: Record<string, Suite[]>,
  computation: (suite: Suite) => void,
) {
  const testNames = Object.keys(tests);

  return testNames.forEach((name) => {
    describe(`${name}`, () => {
      tests[name].forEach((suite: Suite) => runTest(suite, computation));
    });
  });
}

function computation(suite: Suite) {
  let expectedResult;
  const tokenizer = new Tokenizer(suite.source);

  try {
    expectedResult = tokenizer.getTokens();
  } catch (err) {
    expectedResult = err.message;
  }

  assertEquals(expectedResult, suite.result);
}

const specs = await new SpecGenerator(getTestdataPath()).generate();

function main() {
  if (
    Object.keys(specs.priority).length > 0
  ) {
    describe("tokenizer", () => {
      runTests(specs.priority, computation);
    });

    return;
  }

  describe("tokenizer", () => {
    runTests(specs.regular, computation);
  });
}

main();
