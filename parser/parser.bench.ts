import { Parser } from "./mod.ts";

const source = `
  local foo
  local bar
  local x, y, z
  local j, k, l = 1, 2, 3
  local m, n, o = true, "hello", foo
  local a = 3;
  local b = 4;
  local c = '1'

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

  local xzy = function(a, b, c)
    ;
  end

  for i = 1, i < 4 do
  end

  for i = 1, i < 4, i < 3 do
  end

  for a, b, c in a < 3, b < 4, c < 4, d < 5 do
  end

  a = 3

  a, b, c = true, 9, "Hello, world!";

  a = {
    [3] = 3,
    b = 3;
    nil,
    3 + 4
  }

  local a = {
    [a] = b;
  }

  a = {
    nil;
  }

  b = {}

  local c = {}

  local a = {
    b = {
      c = {
        d = {
          nil
        }
      }
    }
  }

  a "3"
  a:b()
  a:b(1, 2, 3)
  x.y()
  x.y(true, 'foo', 3)
  foo()
  foo(1, true, 'foo', 4.1)
  bar {
    1,
    b = {
      true,
      c = {
        'sup',
        d = {
          nil
        }
      }
    }
  }

  x "Hello, world!"

  i = 3

  (1 + 5):c()

  return 4 + 5;
`;

const epoch = 10e7;
const parser = new Parser(source);

console.time(`Parser on ${epoch} iterations`);
for (let i = 0; i < epoch; ++i) {
  parser.parse();
}
console.timeEnd(`Parser on ${epoch} iterations`);
