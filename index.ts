// Server-side entry (no-op). Required by the plugin discovery layout;
// all the logic lives in tui.ts (TUI-only plugin).
//
// Note: the v2 loader requires a bare default export of { id, setup } —
// importing "@opencode/plugin" is not resolvable for plugins discovered
// in the global config directory.
export default {
  id: "luok.send-now",
  setup() {},
}
