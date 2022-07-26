import { Parser } from "./mod.ts";
import { TestRunner, TestType } from "../core/mod.ts";

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
  type: TestType.Integration,
  importMeta: import.meta,
});

const paths = await getSpecPaths(testRunner.getTestdataPath());

sources = paths.map((path) => {
  return {
    path: path,
    source: Deno.readTextFileSync(path),
  };
});

sources.forEach(({ path, source }) => {
  Deno.test(path, () => {
    const parser = new Parser(source);
    parser.parse();
  });
});
