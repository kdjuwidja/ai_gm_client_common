// A refused request. `status` is the HTTP status; `message` the reason;
// `errors` every reason when the service gives several (a validation report),
// with `message` joining them.
export default class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  // The error for a refused Response, read from the platform services' error
  // body (FastAPI's `detail`): `{ detail: { errors: [...] } }` gives every
  // reason, `{ detail: "..." }` the one. With neither, `statusMessages[status]`
  // when the caller has a wording for that status, else "Request failed (N)".
  static async fromResponse(res, statusMessages = {}) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    if (Array.isArray(detail?.errors)) return new ApiError(res.status, detail.errors.join(" "), detail.errors);
    if (typeof detail === "string") return new ApiError(res.status, detail);
    const worded = statusMessages[res.status];
    if (worded) return new ApiError(res.status, worded);
    return new ApiError(res.status, `Request failed (${res.status})`);
  }
}
