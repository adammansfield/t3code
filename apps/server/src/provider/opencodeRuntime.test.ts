import assert from "node:assert/strict";

import { describe, it, vi } from "vitest";

const childProcessMock = vi.hoisted(() => ({
  execFileSync: vi.fn((command: string, args: ReadonlyArray<string>) => {
    if (command === "which" && args[0] === "opencode") {
      return "/opt/homebrew/bin/opencode\n";
    }
    if (command === "where.exe" && args[0] === "opencode") {
      return "C:\\Users\\testuser\\.bun\\bin\\opencode.exe\r\n";
    }
    return "";
  }),
  spawn: vi.fn(),
}));

vi.mock("node:child_process", () => childProcessMock);

describe("resolveOpenCodeBinaryPath", () => {
  it("returns absolute binary paths without PATH lookup", async () => {
    const { resolveOpenCodeBinaryPath } = await import("./opencodeRuntime.ts");

    assert.equal(resolveOpenCodeBinaryPath("/usr/local/bin/opencode"), "/usr/local/bin/opencode");
    assert.equal(childProcessMock.execFileSync.mock.calls.length, 0);
  });

  it("resolves command names through PATH", async () => {
    const { resolveOpenCodeBinaryPath } = await import("./opencodeRuntime.ts");

    if (process.platform === "win32") {
      assert.equal(
        resolveOpenCodeBinaryPath("opencode"),
        "C:\\Users\\testuser\\.bun\\bin\\opencode.exe",
      );
      assert.deepEqual(childProcessMock.execFileSync.mock.calls[0], [
        "where.exe",
        ["opencode"],
        {
          encoding: "utf8",
          timeout: 3_000,
        },
      ]);
      return;
    }

    assert.equal(resolveOpenCodeBinaryPath("opencode"), "/opt/homebrew/bin/opencode");
    assert.deepEqual(childProcessMock.execFileSync.mock.calls[0], [
      "which",
      ["opencode"],
      {
        encoding: "utf8",
        timeout: 3_000,
      },
    ]);
  });
});
