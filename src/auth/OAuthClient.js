// The OAuth 2.0 Authorization Code Flow, browser side, with no React: the
// redirect to the sign-in server, the code exchange and keeping the token.
// One instance per client, made once at module level with that client's own
// settings: the package reads no environment and knows no product.
//
// The flow:
//   1. buildAuthorizeUrl() stashes a fresh CSRF `state` and gives the URL to
//      send the browser to (`<baseUrl>/auth/authorize?...`);
//   2. the sign-in server sends the browser back to `<origin><redirectPath>`
//      with `code` and `state` (or `error`); parseCallbackParams() reads them
//      and consumeStashedState() checks `state`, once;
//   3. exchangeCodeForToken(code) POSTs { code, redirect_uri } to `tokenUrl`,
//      the platform's own token endpoint (same origin), which holds the client
//      secret — it never reaches the browser;
//   4. storeToken() keeps the access token with its absolute expiry;
//      getStoredToken() returns it until then.
export default class OAuthClient {
  // baseUrl, clientId, scope: the sign-in server's address and this client's
  // registration there. tokenUrl: where the code is exchanged. redirectPath:
  // the path the sign-in server sends the browser back to. stateKey, tokenKey:
  // the storage keys. sessionStore and tokenStore default to the browser's
  // sessionStorage (the CSRF state lives for one flow in one tab) and
  // localStorage (the token outlives a reload); `fetch` to the global one.
  constructor({
    baseUrl,
    clientId,
    scope,
    tokenUrl = "/oauth/token",
    redirectPath = "/callback",
    stateKey = "oauth_state",
    tokenKey = "oauth_token",
    sessionStore,
    tokenStore,
    fetch: fetchImpl,
  } = {}) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.scope = scope;
    this.tokenUrl = tokenUrl;
    this.redirectPath = redirectPath;
    this.stateKey = stateKey;
    this.tokenKey = tokenKey;
    this._sessionStore = sessionStore;
    this._tokenStore = tokenStore;
    this._fetch = fetchImpl;
  }

  // Read lazily, so making the client at module level touches no browser API.
  get sessionStore() { return this._sessionStore ?? window.sessionStorage; }
  get tokenStore() { return this._tokenStore ?? window.localStorage; }

  _request(url, init) {
    return this._fetch ? this._fetch(url, init) : globalThis.fetch(url, init);
  }

  redirectUri() {
    return `${window.location.origin}${this.redirectPath}`;
  }

  // Step 1: stashes a fresh CSRF state value and builds the URL to send the
  // browser to.
  buildAuthorizeUrl() {
    const state = crypto.randomUUID();
    this.sessionStore.setItem(this.stateKey, state);
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri(),
      state,
      response_type: "code",
      scope: this.scope,
    });
    return `${this.baseUrl}/auth/authorize?${params.toString()}`;
  }

  // Sends the browser to the sign-in server, dropping any kept token first.
  redirectToLogin() {
    this.clearStoredToken();
    window.location.href = this.buildAuthorizeUrl();
  }

  // Step 2: code, state and error off the current URL, each null when absent.
  parseCallbackParams() {
    const params = new URLSearchParams(window.location.search);
    return { code: params.get("code"), state: params.get("state"), error: params.get("error") };
  }

  // Checks the returned state against the stashed one, and consumes it
  // (single use) whatever the outcome.
  consumeStashedState(state) {
    const stashed = this.sessionStore.getItem(this.stateKey);
    this.sessionStore.removeItem(this.stateKey);
    return !!stashed && stashed === state;
  }

  // Step 3: an authorization code for { access_token, token_type, expires_in }.
  // A refusal throws an Error with the server's `error` when it gives one.
  async exchangeCodeForToken(code) {
    const res = await this._request(this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: this.redirectUri() }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Token exchange failed (${res.status})`);
    }
    return res.json();
  }

  // Step 4: keeps the token with an absolute expiry (now + expires_in).
  storeToken({ access_token, expires_in }) {
    this.tokenStore.setItem(this.tokenKey, JSON.stringify({
      access_token,
      expires_at: Date.now() + expires_in * 1000,
    }));
  }

  // The kept access token while it's unexpired, else null. An expired or
  // unreadable one is dropped.
  getStoredToken() {
    const raw = this.tokenStore.getItem(this.tokenKey);
    if (!raw) return null;
    let kept;
    try {
      kept = JSON.parse(raw);
    } catch {
      kept = null;
    }
    if (!kept?.access_token || !(Date.now() < kept.expires_at)) {
      this.clearStoredToken();
      return null;
    }
    return kept.access_token;
  }

  clearStoredToken() {
    this.tokenStore.removeItem(this.tokenKey);
  }

  // Takes code, state and error off the URL once the callback is handled, so
  // a reload doesn't try to redeem the same code again.
  stripCallbackParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }
}
