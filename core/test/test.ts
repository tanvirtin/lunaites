import {
  E2ESpecGenerator,
  IntegrationSpecGenerator,
  Specs,
  Suite,
} from "./mod.ts";
import {
  afterAll,
  describe,
  exec,
  globToRegExp,
  it,
  path,
  relative,
  WalkEntry,
  walkSync,
} from "../deps.ts";

enum TestType {
  E2E = "E2E",
  Integration = "Integration",
  Unit = "Unit",
  Smoke = "Smoke",
}

interface TestOptions {
  name: string;
  type: TestType;
  importMeta: ImportMeta;
}

interface IntegrationSuite {
  computation: (suite: Suite) => void;
  specs: Specs;
}

interface SmokeSuite {
  computation: (path: string) => void;
  ls: () => IterableIterator<WalkEntry>;
  repositories: string[];
}

interface E2ESuite {
  computation: (suite: Suite) => void;
  suites: Suite[];
}

class Test {
  private name: string;
  private type: TestType;
  private importMeta: ImportMeta;
  private integrationSuite?: IntegrationSuite;
  private smokeSuite?: SmokeSuite;
  private e2eSuite?: E2ESuite;

  constructor({ type, name, importMeta }: TestOptions) {
    this.type = type;
    this.name = name;
    this.importMeta = importMeta;
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

  private isDir(filename: string): boolean {
    return Deno.statSync(filename).isDirectory;
  }

  private cloneGitRepository(link: string) {
    return exec(
      ["git", "clone", link, this.getSmokeRepoPath(link)].join(" "),
    );
  }

  private deleteGitRepository(link: string) {
    return exec(["rm", "-rf", this.getSmokeRepoPath(link)].join(" "));
  }

  private async fetchLuaSources(repositories: string[]) {
    await Promise.all(
      repositories.map((link) => {
        console.info(`Cloning ${link}`);

        return this.cloneGitRepository(link);
      }),
    );

    const files = walkSync(this.getTestdataPath(), {
      match: [globToRegExp("*/**/*.lua")],
    });

    // files are bound by closure, in other words the closure acts as a getter for the private variable files.
    return () => files;
  }

  private deleteLuaSources(repositories: string[]) {
    return Promise.all(
      repositories.map((link) => this.deleteGitRepository(link)),
    );
  }

  getModuleDir(): string {
    return path.resolve(path.dirname(path.fromFileUrl(this.importMeta.url)));
  }

  getTestdataPath() {
    return `${this.getModuleDir()}/testdata/${this.type.toLowerCase()}/${this.name.toLowerCase()}`;
  }

  getSmokeRepoPath(repoName: string) {
    function getRepoName(link: string) {
      const fragments = link.split("/");

      return fragments[fragments.length - 1];
    }

    return `${this.getTestdataPath()}/${getRepoName(repoName)}`;
  }

  async registerE2E(computation: (suite: Suite) => void) {
    this.assertType(TestType.E2E);

    const specGenerator = new E2ESpecGenerator(this.getTestdataPath());
    this.e2eSuite = {
      computation: computation,
      suites: await specGenerator.generate(),
    };
  }

  async registerIntegration(computation: (suite: Suite) => void) {
    this.assertType(TestType.Integration);

    const specGenerator = new IntegrationSpecGenerator(this.getTestdataPath());
    this.integrationSuite = {
      computation: computation,
      specs: await specGenerator.generate(),
    };
  }

  async registerSmoke(
    repositories: string[],
    computation: (path: string) => void,
  ) {
    this.assertType(TestType.Smoke);

    await this.deleteLuaSources(repositories);
    const ls = await this.fetchLuaSources(repositories);

    this.smokeSuite = {
      ls: ls,
      computation: computation,
      repositories: repositories,
    };
  }

  private runE2ETests() {
    this.assertType(TestType.E2E);

    const runTests = (suites: Suite[], computation: (suite: Suite) => void) => {
      return suites.forEach((suite: Suite) =>
        it(`${suite.source}`, computation.bind(null, suite))
      );
    };

    if (!this.e2eSuite) {
      return;
    }

    const { suites, computation } = this.e2eSuite;

    describe(this.name, () => {
      runTests(suites, computation);
    });
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

    if (!this.integrationSuite) {
      return;
    }

    const { specs, computation } = this.integrationSuite;

    if (Object.keys(specs.priority).length > 0) {
      return describe(this.name, () => {
        runTests(specs.priority, computation);
      });
    }

    describe(this.name, () => {
      runTests(specs.regular, computation);
    });
  }

  runSmokeTests() {
    this.assertType(TestType.Smoke);

    const runTests = (smokeSuite: SmokeSuite) => {
      describe(this.name, () => {
        const { ls, computation, repositories } = smokeSuite;

        afterAll(async () => {
          await this.deleteLuaSources(repositories);
        });

        for (const { path } of ls()) {
          if (this.isDir(path)) {
            continue;
          }

          it(
            relative(this.getTestdataPath(), path),
            computation.bind(null, path),
          );
        }
      });
    };

    if (!this.smokeSuite) {
      return;
    }

    runTests(this.smokeSuite);
  }

  run() {
    switch (this.type) {
      case TestType.Integration:
        return this.runIntegrationTests();
      case TestType.Smoke:
        return this.runSmokeTests();
      case TestType.E2E:
        return this.runE2ETests();
    }
  }
}

export { Test, TestType };
export type { TestOptions };
