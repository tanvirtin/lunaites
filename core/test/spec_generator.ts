interface Options {
  wait?: boolean;
  comments?: boolean;
  scope?: boolean;
  locations?: boolean;
  ranges?: boolean;
  luaVersion?: string;
  encodingMode?: string;
  extendedIdentifiers?: boolean;
}

interface Suite {
  only?: boolean;
  source: string;
  result: string | Record<string, unknown>;
  options?: Options;
}

interface Specs {
  priority: Record<string, Suite[]>;
  regular: Record<string, Suite[]>;
}

class SpecGenerator {
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

  async generate(): Promise<Specs> {
    const priority: Record<string, Suite[]> = {};
    const regular: Record<string, Suite[]> = {};

    const specPaths = await this.getSpecPaths();

    for await (const name of specPaths) {
      JSON.parse(
        await Deno.readTextFile(name),
      ).forEach((suite: Suite) => {
        if (suite.only === true) {
          if (!(name in priority)) {
            priority[name] = [];
          }

          priority[name].push(suite);

          return;
        }

        if (!(name in regular)) {
          regular[name] = [];
        }

        regular[name].push(suite);
      });
    }

    return {
      priority,
      regular,
    };
  }
}

export { SpecGenerator };
export type { Specs, Suite };
