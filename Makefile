tests:
	deno test -A --unstable

lint:
	deno lint

fmt:
	deno fmt --check

check: lint fmt tests
