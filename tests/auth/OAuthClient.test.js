import { describe, expect, it, vi } from "vitest";
import OAuthClient from "../../src/auth/OAuthClient.js";
import { fakeFetch } from "../helpers.js";

const SETTINGS = { baseUrl: "https://auth.example", clientId: "the-client", scope: "openid profile" };

function landOn(search) {
  window.history.replaceState({}, "", `/callback${search}`);
}

describe("OAuthClient", () => {
  it("builds the authorize URL with a fresh state it stashes", () => {
    const client = new OAuthClient(SETTINGS);
    const url = new URL(client.buildAuthorizeUrl());

    expect(`${url.origin}${url.pathname}`).toBe("https://auth.example/auth/authorize");
    expect(url.searchParams.get("client_id")).toBe("the-client");
    expect(url.searchParams.get("scope")).toBe("openid profile");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe(`${window.location.origin}/callback`);
    expect(url.searchParams.get("state")).toBe(window.sessionStorage.getItem("oauth_state"));
  });

  it("takes the redirect path and storage keys it's given", () => {
    const client = new OAuthClient({ ...SETTINGS, redirectPath: "/signed-in", stateKey: "s" });
    const url = new URL(client.buildAuthorizeUrl());
    expect(url.searchParams.get("redirect_uri")).toBe(`${window.location.origin}/signed-in`);
    expect(window.sessionStorage.getItem("s")).toBe(url.searchParams.get("state"));
  });

  it("accepts the stashed state once", () => {
    const client = new OAuthClient(SETTINGS);
    const state = new URL(client.buildAuthorizeUrl()).searchParams.get("state");
    expect(client.consumeStashedState(state)).toBe(true);
    expect(client.consumeStashedState(state)).toBe(false);
  });

  it("refuses a state it didn't stash, and drops the stashed one", () => {
    const client = new OAuthClient(SETTINGS);
    client.buildAuthorizeUrl();
    expect(client.consumeStashedState("forged")).toBe(false);
    expect(window.sessionStorage.getItem("oauth_state")).toBeNull();
    expect(new OAuthClient(SETTINGS).consumeStashedState(null)).toBe(false);
  });

  it("reads the callback's code, state and error, and strips them off the URL", () => {
    landOn("?code=abc&state=xyz&keep=1");
    const client = new OAuthClient(SETTINGS);
    expect(client.parseCallbackParams()).toEqual({ code: "abc", state: "xyz", error: null });

    client.stripCallbackParams();
    expect(window.location.search).toBe("?keep=1");
    expect(client.parseCallbackParams()).toEqual({ code: null, state: null, error: null });
  });

  it("exchanges a code at its token URL", async () => {
    const fetch = fakeFetch({ body: { access_token: "t", token_type: "Bearer", expires_in: 60 } });
    const client = new OAuthClient({ ...SETTINGS, tokenUrl: "/auth/token", fetch });

    await expect(client.exchangeCodeForToken("abc")).resolves.toEqual({ access_token: "t", token_type: "Bearer", expires_in: 60 });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/auth/token");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ code: "abc", redirect_uri: `${window.location.origin}/callback` });
  });

  it("defaults the token URL to /oauth/token", async () => {
    const fetch = fakeFetch({ body: { access_token: "t", expires_in: 60 } });
    await new OAuthClient({ ...SETTINGS, fetch }).exchangeCodeForToken("abc");
    expect(fetch.mock.calls[0][0]).toBe("/oauth/token");
  });

  it("says why an exchange was refused", async () => {
    const refused = new OAuthClient({ ...SETTINGS, fetch: fakeFetch({ status: 400, body: { error: "invalid_grant" } }) });
    await expect(refused.exchangeCodeForToken("abc")).rejects.toThrow("invalid_grant");

    const bare = new OAuthClient({ ...SETTINGS, fetch: fakeFetch({ status: 502, rawBody: "<html>" }) });
    await expect(bare.exchangeCodeForToken("abc")).rejects.toThrow("Token exchange failed (502)");
  });

  it("keeps a token until it expires", () => {
    vi.useFakeTimers({ now: 1_000_000 });
    try {
      const client = new OAuthClient(SETTINGS);
      client.storeToken({ access_token: "t", expires_in: 60 });
      expect(client.getStoredToken()).toBe("t");

      vi.setSystemTime(1_000_000 + 59_999);
      expect(client.getStoredToken()).toBe("t");

      vi.setSystemTime(1_000_000 + 60_000);
      expect(client.getStoredToken()).toBeNull();
      expect(window.localStorage.getItem("oauth_token")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops a kept token it can't read", () => {
    window.localStorage.setItem("oauth_token", "not json");
    expect(new OAuthClient(SETTINGS).getStoredToken()).toBeNull();
    expect(window.localStorage.getItem("oauth_token")).toBeNull();
  });

  it("clears the kept token", () => {
    const client = new OAuthClient(SETTINGS);
    client.storeToken({ access_token: "t", expires_in: 60 });
    client.clearStoredToken();
    expect(client.getStoredToken()).toBeNull();
  });

  it("uses the stores it's given", () => {
    const store = () => {
      const map = new Map();
      return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k), map };
    };
    const sessionStore = store();
    const tokenStore = store();
    const client = new OAuthClient({ ...SETTINGS, sessionStore, tokenStore });
    client.buildAuthorizeUrl();
    client.storeToken({ access_token: "t", expires_in: 60 });
    expect(sessionStore.map.has("oauth_state")).toBe(true);
    expect(tokenStore.map.has("oauth_token")).toBe(true);
    expect(window.localStorage.getItem("oauth_token")).toBeNull();
  });

  it("touches no browser API when it's made", () => {
    expect(() => new OAuthClient()).not.toThrow();
  });
});
