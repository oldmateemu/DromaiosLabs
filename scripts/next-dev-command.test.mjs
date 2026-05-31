import assert from "node:assert/strict";
import test from "node:test";
import { buildNextDevArgs } from "./next-dev-command.mjs";

test("removes a leading literal separator before Next sees Codex host and port flags", () => {
  assert.deepEqual(
    buildNextDevArgs(["--", "--hostname", "127.0.0.1", "--port", "3000"], {
      defaultHost: "127.0.0.1",
      defaultPort: "3000"
    }),
    ["dev", "--hostname", "127.0.0.1", "--port", "3000"]
  );
});

test("adds local host and port defaults when no Next dev flags are provided", () => {
  assert.deepEqual(
    buildNextDevArgs([], {
      defaultHost: "127.0.0.1",
      defaultPort: "3003"
    }),
    ["dev", "-H", "127.0.0.1", "-p", "3003"]
  );
});

test("does not duplicate existing shorthand host and port flags", () => {
  assert.deepEqual(
    buildNextDevArgs(["-H", "127.0.0.1", "-p", "3003"], {
      defaultHost: "127.0.0.1",
      defaultPort: "3000"
    }),
    ["dev", "-H", "127.0.0.1", "-p", "3003"]
  );
});
