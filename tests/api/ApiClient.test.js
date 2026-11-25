import { describe, expect, it } from "vitest";
import ApiClient from "../../src/api/ApiClient.js";
import ApiError from "../../src/api/ApiError.js";
import { fakeFetch } from "../helpers.js";

describe("ApiClient", () => {
  it("sends the token and a JSON body to its surface", async () => {
    const fetch = fakeFetch({ body: { ok: true } });
    const api = new ApiClient({ base: "/hub/api", getToken: () => "tok", fetch });

    await expect(api.request("PUT", "/me/profile", { json: { display_name: "Ana" } })).resolves.toEqual({ ok: true });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/hub/api/me/profile");
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ Authorization: "Bearer tok", "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual({ display_name: "Ana" });
  });

  it("sends a form as it is, leaving its content type to the browser", async () => {
    const fetch = fakeFetch();
    const form = new FormData();
    form.append("version", "1.0");
    await new ApiClient({ getToken: () => "tok", fetch }).request("POST", "/campaigns", { form });

    const init = fetch.mock.calls[0][1];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("sends no token when there is none, or when told to send none", async () => {
    const fetch = fakeFetch();
    await new ApiClient({ fetch }).request("GET", "/campaigns/playable");
    await new ApiClient({ getToken: () => "tok", fetch }).request("GET", "/campaigns/playable", { token: null });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(fetch.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });

  it("sends a token it's given instead of its own", async () => {
    const fetch = fakeFetch();
    await new ApiClient({ getToken: () => "own", fetch }).request("GET", "/x", { token: "given" });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer given");
  });

  it("reads the token on every call", async () => {
    const fetch = fakeFetch();
    let token = "first";
    const api = new ApiClient({ getToken: () => token, fetch });
    await api.request("GET", "/x");
    token = "second";
    await api.request("GET", "/x");
    expect(fetch.mock.calls.map(c => c[1].headers.Authorization)).toEqual(["Bearer first", "Bearer second"]);
  });

  it("answers null for 204 and the Response itself when raw", async () => {
    expect(await new ApiClient({ fetch: fakeFetch({ status: 204 }) }).request("DELETE", "/x")).toBeNull();
    const res = await new ApiClient({ fetch: fakeFetch({ body: { a: 1 } }) }).request("GET", "/x", { raw: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ a: 1 });
  });

  it("throws an ApiError for a refusal", async () => {
    const api = new ApiClient({ fetch: fakeFetch({ status: 404, body: { detail: "Session not found" } }) });
    const err = await api.request("GET", "/sessions/x").catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe("Session not found");
  });

  it("words a bare refusal by its status when it's told how", async () => {
    const api = new ApiClient({ statusMessages: { 413: "Too large." }, fetch: fakeFetch({ status: 413, rawBody: "<html>" }) });
    await expect(api.request("POST", "/campaigns")).rejects.toMatchObject({ status: 413, message: "Too large." });
  });
});

describe("ApiError.fromResponse", () => {
  const response = (status, body) => ({ status, json: async () => body });

  it("keeps every reason of a validation report", async () => {
    const err = await ApiError.fromResponse(response(422, { detail: { errors: ["No title.", "No zones."] } }));
    expect(err.status).toBe(422);
    expect(err.message).toBe("No title. No zones.");
    expect(err.errors).toEqual(["No title.", "No zones."]);
  });

  it("takes a single reason as the message, with no list", async () => {
    const err = await ApiError.fromResponse(response(403, { detail: "Admins only." }));
    expect(err.message).toBe("Admins only.");
    expect(err.errors).toEqual([]);
  });

  it("falls back to the status for a body with no reason", async () => {
    const unreadable = { status: 500, json: async () => { throw new SyntaxError("bad json"); } };
    expect((await ApiError.fromResponse(unreadable)).message).toBe("Request failed (500)");
    expect((await ApiError.fromResponse(response(422, { detail: [{ loc: ["body"] }] }))).message).toBe("Request failed (422)");
  });

  it("is an Error named ApiError", () => {
    const err = new ApiError(400, "No.");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
  });
});
