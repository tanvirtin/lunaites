import { Scanner, Tokenizer } from "../../mod.ts";
import { SpecGenerator, Suite } from "./spec_generator.ts";
import {
  assertObjectMatch,
  assertStrictEquals,
  describe,
  it,
  path,
} from "../../deps.ts";

function getModuleDir(importMeta: ImportMeta): string {
  return path.resolve(path.dirname(path.fromFileUrl(importMeta.url)));
}

function getTestdataPath() {
  return `${getModuleDir(import.meta)}/testdata/`;
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
