tests:
	deno test -A --unstable

unit-tests:
	deno test -A --unstable ./*/*.test.ts

smoke-tests:
	deno test -A --unstable ./*/test/smoke/

integration-tests:
	deno test -A --unstable ./*/test/integration/

lint:
	deno lint

fmt:
	deno fmt --check

check: lint fmt tests

compile: 
	deno compile mod.ts

build: check compile