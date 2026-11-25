import { describe, expect, it } from "vitest";
import * as pkg from "../src/index.js";

describe("the package's entry", () => {
  it("exports everything it holds, and nothing else", () => {
    expect(Object.keys(pkg).sort()).toEqual([
      "ApiClient",
      "ApiError",
      "INFO_NOTICE_MS",
      "OAuthClient",
      "Popout",
      "comboboxProps",
      "optionId",
      "useAsyncData",
      "useBusyFlags",
      "useDialogClose",
      "useDismissOutside",
      "useMediaQuery",
      "useMenuKeyboard",
      "useNotices",
      "useOAuth",
    ]);
  });
});
