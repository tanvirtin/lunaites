tests:
	deno test -A --unstable

unit-tests:
	deno test -A --unstable ./*/*.test.unit.ts

smoke-tests:
	deno test -A --unstable ./*/*.test.smoke.ts

integration-tests:
	deno test -A --unstable ./*/*.test.integration.ts

lint:
	deno lint

fmt:
	deno fmt --check

check: lint fmt tests

compile: 
	deno compile mod.ts

build: check compile