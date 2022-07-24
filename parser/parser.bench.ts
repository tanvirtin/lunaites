import { Parser } from "./mod.ts";

const source = `
  break;
  local foo
  local bar
  local x, y, z
  local j, k, l = 1, 2, 3
  local m, n, o = true, "hello", foo
  local a = 3;
  local b = 4;
  break;

  do
    local a = 3;
  end

  if 3 == 4 then
    local a = 3;
  elseif 4 == 5 then
    local b = 4;
  else
    local c = 5;
  end

  function foo(x, y, z, ...)
    local a = x + y;
  end

  local function bar()
  end

  return 4 + 5;
`;

const epoch = 10e7;
const parser = new Parser(source);

console.time(`Parser on ${epoch} iterations`);
for (let i = 0; i < epoch; ++i) {
  parser.parse();
}
console.timeEnd(`Parser on ${epoch} iterations`);
