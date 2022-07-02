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
  source: string;
  result: string | Record<string, unknown>;
  only?: boolean;
  options?: Options;
}

interface Specs {
  priority: Record<string, Suite[]>;
  regular: Record<string, Suite[]>;
}

export type { Options, Specs, Suite };
export * from "./integration_spec_generator.ts";
export * from "./e2e_spec_generator.ts";
export * from "./test.ts";
