// ai_gm_client_common: what every ai_gm product's client and the platform
// admin client share. Behaviour only; each client keeps its own look.

// Sign-in: the OAuth Authorization Code Flow and its React hook.
export { default as OAuthClient } from "./auth/OAuthClient.js";
export { default as useOAuth } from "./auth/useOAuth.js";

// The request helper for a platform HTTP surface, and its refusal.
export { default as ApiClient } from "./api/ApiClient.js";
export { default as ApiError } from "./api/ApiError.js";

// Behaviour-only UI: dialogs, menus, pop-ups, the combobox wiring.
export { default as useDialogClose } from "./ui/useDialogClose.js";
export { default as useDismissOutside } from "./ui/useDismissOutside.js";
export { default as useMenuKeyboard } from "./ui/useMenuKeyboard.js";
export { default as Popout } from "./ui/Popout.jsx";
export { comboboxProps, optionId } from "./ui/combobox.js";

// Notices and busy flags.
export { default as useNotices, INFO_NOTICE_MS } from "./feedback/useNotices.js";
export { default as useBusyFlags } from "./feedback/useBusyFlags.js";

// General hooks.
export { default as useAsyncData } from "./hooks/useAsyncData.js";
export { default as useMediaQuery } from "./hooks/useMediaQuery.js";
