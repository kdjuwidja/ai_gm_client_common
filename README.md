# ai_gm_client_common

The client code every ai_gm product's client and the platform admin client share
([workspace ADR 001](https://github.com/kdjuwidja/ai_gm_workspace/blob/main/docs/adr/001-platform-split.md)).
Behaviour only: each product keeps its own look.

## What's in it

| Folder | Exports | What it is |
|---|---|---|
| `src/auth/` | `OAuthClient`, `useOAuth` | The sign-in flow: OAuth redirect, code exchange, keeping the token |
| `src/api/` | `ApiClient`, `ApiError` | The request helper for a platform HTTP surface: token, JSON or form body, the refused-request error with its reasons |
| `src/ui/` | `useDialogClose`, `useDismissOutside`, `useMenuKeyboard`, `Popout`, `comboboxProps`, `optionId` | Behaviour-only UI: hooks and logic, no markup that carries a look, no CSS |
| `src/feedback/` | `useNotices`, `useBusyFlags`, `INFO_NOTICE_MS` | The notices' state (errors stay, others leave after 6 s) and busy flags; how they look is the client's |
| `src/hooks/` | `useAsyncData`, `useMediaQuery` | Load-with-retry; follow a media query |

## What belongs here

- Code that every product's client, or a product's client and the admin client, would otherwise copy.
- Behaviour only: no CSS, no art, no fonts, no animation library, no styled components.
- Nothing about one product: no product id, no campaign or game code. Callers pass their own settings
  (the OAuth client's settings, an API surface's base path, wording for a status).
- No environment reads: the package never reads `window.__ENV__` or `import.meta.env`. Clients read
  their own settings and pass them in.

## Using it

```js
import { ApiClient, OAuthClient, useOAuth } from "ai_gm_client_common";

export const oauth = new OAuthClient({
  baseUrl: window.__ENV__?.OAUTH_BASE_URL || import.meta.env.VITE_OAUTH_BASE_URL,
  clientId: window.__ENV__?.OAUTH_CLIENT_ID || import.meta.env.VITE_OAUTH_CLIENT_ID,
  scope: window.__ENV__?.OAUTH_SCOPE || import.meta.env.VITE_OAUTH_SCOPE,
});
const hub = new ApiClient({ base: "/hub/api", getToken: () => oauth.getStoredToken() });
export const fetchMe = () => hub.request("GET", "/me");
// in a component: const { accessToken, redirectToLogin } = useOAuth(oauth);
```

React and react-dom are peer dependencies (^19): the client supplies them.

## Installing it in a client

```
npm install github:kdjuwidja/ai_gm_client_common#v1.0.0
```

`package-lock.json` pins the commit. npm runs the package's `prepare` script when it installs from
git, which builds `dist/`. `dist/` is not committed. Docker builds need read access to this
repository through a build secret.

## Releasing

1. Merge the change to `main`.
2. Bump `version` in `package.json` (semver), merge that, then tag it: `git tag v1.1.0 && git push origin v1.1.0`.
3. Each client bumps its dependency to the new tag when it's ready.

To test a change before it's released, a client branch can depend on a branch or a commit
(`github:kdjuwidja/ai_gm_client_common#<branch-or-sha>`).

## Developing against a local checkout

Either `npm link` (run `npm link` here, then `npm link ai_gm_client_common` in the client), or a
`file:` path in the client's `package.json`: `"ai_gm_client_common": "file:../ai_gm_client_common"`.

- Both make a symlink, so `prepare` doesn't run: build here with `npm run build`, or
  `npm run dev` to rebuild on every save.
- Through the symlink, the package's code would find React in this checkout's own `node_modules`
  (its dev dependencies), and two copies of React break hooks ("Invalid hook call"). The client's
  `vite.config.js` must dedupe React:

  ```js
  resolve: { dedupe: ["react", "react-dom"] },
  ```

## Working on it

```
npm install
npm test        # vitest, happy-dom
npm run build   # dist/index.js
```
