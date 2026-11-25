import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OAuthClient from "../../src/auth/OAuthClient.js";
import useOAuth from "../../src/auth/useOAuth.js";
import { fakeFetch } from "../helpers.js";

const SETTINGS = { baseUrl: "https://auth.example", clientId: "the-client", scope: "openid" };

describe("useOAuth", () => {
  it("does nothing on a plain load with no kept token", () => {
    const { result } = renderHook(() => useOAuth(new OAuthClient(SETTINGS)));
    expect(result.current.accessToken).toBeNull();
    expect(result.current.authError).toBeNull();
    expect(result.current.restoredOnLoad).toBe(false);
  });

  it("signs back in on load with a kept token, saying it was restored", () => {
    const client = new OAuthClient(SETTINGS);
    client.storeToken({ access_token: "kept", expires_in: 60 });
    const { result } = renderHook(() => useOAuth(client));
    expect(result.current.accessToken).toBe("kept");
    expect(result.current.restoredOnLoad).toBe(true);
  });

  it("completes a callback landing: checks state, exchanges the code, keeps the token", async () => {
    const fetch = fakeFetch({ body: { access_token: "fresh", expires_in: 60 } });
    const client = new OAuthClient({ ...SETTINGS, fetch });
    const state = new URL(client.buildAuthorizeUrl()).searchParams.get("state");
    window.history.replaceState({}, "", `/callback?code=abc&state=${state}`);

    const { result } = renderHook(() => useOAuth(client));

    await waitFor(() => expect(result.current.accessToken).toBe("fresh"));
    expect(result.current.restoredOnLoad).toBe(false);
    expect(window.location.search).toBe("");
    expect(client.getStoredToken()).toBe("fresh");
  });

  it("refuses a callback whose state doesn't match, without exchanging", () => {
    const fetch = fakeFetch();
    const client = new OAuthClient({ ...SETTINGS, fetch });
    client.buildAuthorizeUrl();
    window.history.replaceState({}, "", "/callback?code=abc&state=forged");

    const { result } = renderHook(() => useOAuth(client));

    expect(result.current.authError).toBe("state mismatch");
    expect(fetch).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });

  it("reports the sign-in server's error", () => {
    window.history.replaceState({}, "", "/callback?error=access_denied");
    const { result } = renderHook(() => useOAuth(new OAuthClient(SETTINGS)));
    expect(result.current.authError).toBe("access_denied");
    expect(window.location.search).toBe("");
  });

  it("reports a refused exchange", async () => {
    const client = new OAuthClient({ ...SETTINGS, fetch: fakeFetch({ status: 400, body: { error: "invalid_grant" } }) });
    const state = new URL(client.buildAuthorizeUrl()).searchParams.get("state");
    window.history.replaceState({}, "", `/callback?code=abc&state=${state}`);

    const { result } = renderHook(() => useOAuth(client));
    await waitFor(() => expect(result.current.authError).toBe("invalid_grant"));
    expect(result.current.accessToken).toBeNull();
  });

  it("checkStoredToken puts a kept token into play, not as restored", () => {
    const client = new OAuthClient(SETTINGS);
    const { result } = renderHook(() => useOAuth(client));
    act(() => { expect(result.current.checkStoredToken()).toBeNull(); });

    client.storeToken({ access_token: "kept", expires_in: 60 });
    act(() => { expect(result.current.checkStoredToken()).toBe("kept"); });
    expect(result.current.accessToken).toBe("kept");
    expect(result.current.restoredOnLoad).toBe(false);
  });

  it("clearToken discards the kept token; dropToken only stops using it", () => {
    const client = new OAuthClient(SETTINGS);
    client.storeToken({ access_token: "kept", expires_in: 60 });
    const { result } = renderHook(() => useOAuth(client));

    act(() => result.current.dropToken());
    expect(result.current.accessToken).toBeNull();
    expect(client.getStoredToken()).toBe("kept");

    act(() => { result.current.checkStoredToken(); });
    act(() => result.current.clearToken());
    expect(result.current.accessToken).toBeNull();
    expect(client.getStoredToken()).toBeNull();
  });

  it("redirectToLogin clears the error and hands over to the client", () => {
    window.history.replaceState({}, "", "/callback?error=access_denied");
    const client = new OAuthClient(SETTINGS);
    const redirect = vi.spyOn(client, "redirectToLogin").mockImplementation(() => {});
    const { result } = renderHook(() => useOAuth(client));

    act(() => result.current.redirectToLogin());
    expect(redirect).toHaveBeenCalledOnce();
    expect(result.current.authError).toBeNull();
  });
});
