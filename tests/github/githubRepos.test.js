import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchUserRepos,
  GithubUserNotFoundError,
  GithubRateLimitError,
} from "../../backend/src/services/githubRepos.js";

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function b64(obj) {
  return Buffer.from(typeof obj === "string" ? obj : JSON.stringify(obj)).toString("base64");
}

describe("fetchUserRepos", () => {
  let calls;

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(handler) {
    vi.stubGlobal("fetch", async (url) => {
      calls.push(url);
      return handler(url);
    });
  }

  it("returns repos with techStack built from package.json deps and languages", async () => {
    mockFetch((url) => {
      if (url.includes("/users/aditi/repos")) {
        return jsonResponse([
          {
            name: "tracker",
            description: "A placement tracker",
            html_url: "https://github.com/aditi/tracker",
            updated_at: "2026-01-01T00:00:00Z",
            fork: false,
            owner: { login: "aditi" },
          },
        ]);
      }
      if (url.includes("/contents/package.json")) {
        return jsonResponse({
          encoding: "base64",
          content: b64({ dependencies: { react: "^19.0.0", express: "^5.0.0" } }),
        });
      }
      if (url.includes("/contents/requirements.txt") || url.includes("/contents/go.mod")) {
        return jsonResponse({}, 404);
      }
      if (url.includes("/languages")) {
        return jsonResponse({ JavaScript: 12345 });
      }
      throw new Error(`unexpected url: ${url}`);
    });

    const repos = await fetchUserRepos("aditi");
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("tracker");
    expect(repos[0].url).toBe("https://github.com/aditi/tracker");
    expect(repos[0].techStack).toEqual(expect.arrayContaining(["react", "express", "JavaScript"]));
  });

  it("skips forked repos", async () => {
    mockFetch((url) => {
      if (url.includes("/users/aditi/repos")) {
        return jsonResponse([
          { name: "forked", fork: true, owner: { login: "aditi" }, html_url: "", updated_at: "" },
        ]);
      }
      throw new Error(`unexpected url: ${url}`);
    });
    const repos = await fetchUserRepos("aditi");
    expect(repos).toEqual([]);
  });

  it("falls back to languages when no manifest is found", async () => {
    mockFetch((url) => {
      if (url.includes("/users/aditi/repos")) {
        return jsonResponse([
          {
            name: "cli-tool",
            description: "",
            html_url: "https://github.com/aditi/cli-tool",
            updated_at: "2026-01-01T00:00:00Z",
            fork: false,
            owner: { login: "aditi" },
          },
        ]);
      }
      if (url.includes("/contents/")) return jsonResponse({}, 404);
      if (url.includes("/languages")) return jsonResponse({ Go: 999 });
      throw new Error(`unexpected url: ${url}`);
    });
    const repos = await fetchUserRepos("aditi");
    expect(repos[0].techStack).toEqual(["Go"]);
  });

  it("throws GithubUserNotFoundError for an unknown username", async () => {
    mockFetch(() => jsonResponse({}, 404));
    await expect(fetchUserRepos("nobody")).rejects.toBeInstanceOf(GithubUserNotFoundError);
  });

  it("throws GithubRateLimitError on 403", async () => {
    mockFetch(() => jsonResponse({}, 403));
    await expect(fetchUserRepos("aditi")).rejects.toBeInstanceOf(GithubRateLimitError);
  });

  it("caps the number of repos fetched", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      name: `repo${i}`,
      fork: false,
      owner: { login: "aditi" },
      html_url: "",
      updated_at: "",
      description: "",
    }));
    mockFetch((url) => {
      if (url.includes("/users/aditi/repos")) return jsonResponse(many);
      if (url.includes("/contents/")) return jsonResponse({}, 404);
      if (url.includes("/languages")) return jsonResponse({});
      throw new Error(`unexpected url: ${url}`);
    });
    const repos = await fetchUserRepos("aditi", { limit: 5 });
    expect(repos).toHaveLength(5);
  });
});
