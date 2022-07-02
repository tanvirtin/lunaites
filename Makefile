lint:
	deno lint

fmt:
	deno fmt --check

unit-tests:
	deno test -A --unstable ./*/*.test.unit.ts

smoke-tests:
	deno test -A --unstable ./*/*.test.smoke.ts

integration-tests:
	deno test -A --unstable ./*/*.test.integration.ts

e2e-tests:
	deno test -A --unstable ./*/*.test.e2e.ts

tests:
	deno test -A --unstable ./*/*.test.*.ts

check: lint fmt tests

compile: 
	deno compile -A -o ./bin/lunaites mod.ts

build: check compile