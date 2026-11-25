import { vi } from "vitest";

// A fetch double answering every call with one Response-like answer, and
// keeping the calls it got.
export function fakeFetch({ status = 200, body = {}, rawBody } = {}) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (rawBody !== undefined) return JSON.parse(rawBody);
      return body;
    },
  }));
}
