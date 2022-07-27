import { Parser } from "./mod.ts";
import { TestRunner, TestType } from "../core/mod.ts";
import { assertSnapshot } from "./deps.ts";
import { path } from "../core/test_runner/deps.ts";

async function getSpecPaths(path: string) {
  const names: string[] = [];

  for await (const dirEntry of Deno.readDir(path)) {
    const entryPath = `${path}/${dirEntry.name}`;
    names.push(entryPath);
  }

  return names;
}

interface Suite {
  source: string;
  path: string;
}

let sources: Suite[] = [];
const testRunner = new TestRunner({
  name: "Parser",
  type: TestType.Snapshot,
  importMeta: import.meta,
});

const dirname = testRunner.getCurrentTestPath();
const snapshotsDir = path.join(
  testRunner.getTestdataPath(),
  "snapshot_dump",
  "parser",
);

const paths = await getSpecPaths(dirname);

sources = paths.map((path) => {
  return {
    path: path,
    source: Deno.readTextFileSync(path),
  };
});

sources.forEach(({ path: p, source }) => {
  const name = path.basename(p);

  Deno.test(name, async function (t): Promise<void> {
    const parser = new Parser(source);

    await assertSnapshot(t, parser.parse(), {
      path: path.join(snapshotsDir, name),
    });
  });
});
