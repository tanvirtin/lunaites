import { describe, it, path } from "../deps.ts";
import { SpecGenerator, Specs, Suite } from "./spec_generator.ts";

enum TestType {
  Integration = "Integration",
  Unit = "Unit",
  Smoke = "Smoke",
}

interface TestOptions {
  name: string;
  type: TestType;
  importMeta: ImportMeta;
}

type IntegrationComputation = (suite: Suite) => void;
type Computation = IntegrationComputation;

interface IntegrationSuite {
  computation: IntegrationComputation;
  specs: Specs;
}

class Test {
  private name: string;
  private type: TestType;
  private importMeta: ImportMeta;
  private integrationSuite: IntegrationSuite;

  constructor({ type, name, importMeta }: TestOptions) {
    this.type = type;
    this.name = name.toLowerCase();
    this.importMeta = importMeta;
    this.integrationSuite = {
      computation: () => {},
      specs: {
        regular: {},
        priority: {},
      },
    };
  }

  private raiseInvalidTypeError(type: TestType): never {
    throw new Error(
      `Invalid type, got ${this.type} expected ${type}`,
    );
  }

  private assertType(type: TestType) {
    if (this.type !== type) {
      this.raiseInvalidTypeError(type);
    }
  }

  private async registerIntegration(computation: Computation) {
    const specGenerator = new SpecGenerator(this.getTestdataPath());
    this.integrationSuite.computation = computation;
    this.integrationSuite.specs = await specGenerator.generate();
  }

  private runIntegrationTests() {
    this.assertType(TestType.Integration);

    const runTest = (suite: Suite, computation: (suite: Suite) => void) => {
      it(`${suite.source}`, computation.bind(null, suite));
    };
    const runTests = (
      tests: Record<string, Suite[]>,
      computation: (suite: Suite) => void,
    ) => {
      const testNames = Object.keys(tests);

      return testNames.forEach((name) => {
        describe(`${name}`, () => {
          tests[name].forEach((suite: Suite) => runTest(suite, computation));
        });
      });
    };

    const { specs, computation } = this.integrationSuite;

    if (Object.keys(specs.priority).length > 0) {
      return describe("tokenizer", () => {
        runTests(specs.priority, computation);
      });
    }

    describe("tokenizer", () => {
      runTests(specs.regular, computation);
    });
  }

  getModuleDir(): string {
    return path.resolve(path.dirname(path.fromFileUrl(this.importMeta.url)));
  }

  getTestdataPath() {
    return `${this.getModuleDir()}/testdata/${this.type}/${this.name}`;
  }

  register(computation: Computation) {
    switch (this.type) {
      case TestType.Integration: {
        return this.registerIntegration(computation);
      }
    }
  }

  run() {
    switch (this.type) {
      case TestType.Integration: {
        return this.runIntegrationTests();
      }
    }
  }
}

export { Test, TestType };
export type { TestOptions };
