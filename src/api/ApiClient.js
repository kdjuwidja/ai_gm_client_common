import ApiError from "./ApiError.js";

// One HTTP surface of the platform (e.g. "/hub/api", "/cms/api"): every call
// sends the signed-in user's token, a JSON or form body, and turns a refusal
// into an ApiError. A client makes one per surface, at module level, and
// builds its own named calls on request():
//
//   const hub = new ApiClient({ base: "/hub/api", getToken: () => oauth.getStoredToken() });
//   export const fetchMe = () => hub.request("GET", "/me");
export default class ApiClient {
  // base: the surface's path prefix (or a full origin and prefix).
  // getToken: returns the token to send, or null to send none.
  // statusMessages: wording for a refusal whose body gives no reason, by
  // status (e.g. { 413: "The file is too large to upload." }).
  // fetch: defaults to the global one.
  constructor({ base = "", getToken = () => null, statusMessages = {}, fetch: fetchImpl } = {}) {
    this.base = base;
    this.getToken = getToken;
    this.statusMessages = statusMessages;
    this._fetch = fetchImpl;
  }

  // method, path (after `base`), and:
  //   json:  a body sent as JSON;
  //   form:  a FormData body (the browser sets its content type);
  //   raw:   true to get the Response itself (a download), not its JSON;
  //   token: the token to send instead of getToken()'s; null sends none
  //          (a signed-out call).
  // Resolves to the answer's JSON, or null for 204 No Content.
  async request(method, path, { json, form, raw = false, token } = {}) {
    const sent = token === undefined ? this.getToken() : token;
    const headers = {};
    if (sent) headers.Authorization = `Bearer ${sent}`;
    let body;
    if (json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form) {
      body = form;
    }
    const url = `${this.base}${path}`;
    const init = { method, headers, body };
    const res = await (this._fetch ? this._fetch(url, init) : globalThis.fetch(url, init));
    if (!res.ok) throw await ApiError.fromResponse(res, this.statusMessages);
    if (raw) return res;
    return res.status === 204 ? null : res.json();
  }
}
