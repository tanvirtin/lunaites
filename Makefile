lint:
	deno lint

fmt:
	deno fmt --check

unit-tests:
	deno test -A --unstable ./*/*.unit.test.ts

smoke-tests:
	deno test -A --unstable ./*/*.smoke.test.ts

integration-tests:
	deno test -A --unstable ./*/*.test.integration.ts

e2e-tests:
	deno test -A --unstable ./*/*.e2e.test.ts

tests:
	deno test -A --unstable ./*/*.*.test.ts

check: lint fmt tests

compile: 
	deno compile -A -o ./bin/lunaites mod.ts

build: check compile