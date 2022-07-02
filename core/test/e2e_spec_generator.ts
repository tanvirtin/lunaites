import { basename } from "./deps.ts";
import type { Suite } from "./mod.ts";

class E2ESpecGenerator {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  async getSpecPaths() {
    const currentPath = this.path;

    const names: string[] = [];

    for await (const dirEntry of Deno.readDir(currentPath)) {
      const entryPath = `${currentPath}/${dirEntry.name}`;
      names.push(entryPath);
    }

    return names;
  }

  async generate(): Promise<Suite[]> {
    const specPaths = await this.getSpecPaths();

    const onlies = [];
    const rest = [];

    for await (let name of specPaths) {
      const text = await Deno.readTextFile(name);
      name = basename(name);
      const lines = text.split("\n");

      lines.shift(); // source
      lines.shift(); // ------

      const source = [];
      while (true) {
        const line = lines.shift();
        if (line == null) {
          break;
        }

        if (line === "result") {
          source.pop(); //
          lines.shift(); // ------
          break;
        }

        source.push(line);
      }

      const result = [];
      while (true) {
        const line = lines.shift();

        if (line == null) {
          break;
        }

        result.push(line);
      }

      const stringResult = result.join("\n");

      const suite = {
        source: source.join("\n"),
        result: stringResult && JSON.parse(stringResult) || stringResult,
      };

      if (name.startsWith("+")) {
        onlies.push(suite);
      } else if (!name.startsWith("-")) {
        rest.push(suite);
      }
    }

    return onlies.length > 0 ? onlies : rest;
  }
}

export { E2ESpecGenerator };
