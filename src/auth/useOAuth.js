import { useEffect, useState } from "react";

// The sign-in flow's life in a React client, over an OAuthClient made once at
// module level. Knows no API: finding out whose token it is stays the client's
// own call.
//
// On mount: a callback landing (code or error in the URL) completes the
// redirect flow, since that already took one click. Any other page load signs
// straight back in with a still-valid kept token; with none, nothing happens
// until the client calls redirectToLogin(). `restoredOnLoad` says the token in
// play came from that load-time check, so a client can drop a refused one
// quietly: the user didn't ask to sign in.
export default function useOAuth(client) {
  const [accessToken, setAccessToken] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [restoredOnLoad, setRestoredOnLoad] = useState(false);

  useEffect(() => {
    const { code, state, error } = client.parseCallbackParams();

    if (error) {
      client.stripCallbackParams();
      setAuthError(error);
      return;
    }

    if (code) {
      const stateOk = client.consumeStashedState(state);
      client.stripCallbackParams();
      if (!stateOk) {
        setAuthError("state mismatch");
        return;
      }
      client.exchangeCodeForToken(code)
        .then(token => {
          client.storeToken(token);
          setAccessToken(token.access_token);
        })
        .catch(err => setAuthError(err.message));
      return;
    }

    const kept = client.getStoredToken();
    if (kept) {
      setRestoredOnLoad(true);
      setAccessToken(kept);
    }
  }, [client]);

  // A still-valid kept token, or null. On a hit it's also put into play (a
  // "Sign in" click that needs no redirect).
  function checkStoredToken() {
    const kept = client.getStoredToken();
    if (kept) {
      setRestoredOnLoad(false);
      setAccessToken(kept);
    }
    return kept;
  }

  function redirectToLogin() {
    setAuthError(null);
    client.redirectToLogin();
  }

  // Discards a token a server refused, so a stale kept token doesn't keep
  // blocking the next sign-in.
  function clearToken() {
    client.clearStoredToken();
    setAccessToken(null);
  }

  // Stops using the token without discarding it: the server couldn't be
  // reached, which says nothing about the token, so the next try uses it again.
  function dropToken() {
    setAccessToken(null);
  }

  return { accessToken, authError, restoredOnLoad, redirectToLogin, clearToken, dropToken, checkStoredToken };
}
