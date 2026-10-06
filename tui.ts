// TUI plugin for OpenCode: Ctrl+Enter = "send now" (Claude Code chat:sendNow style).
//
// - session running: aborts the turn via the server API, waits for it to land,
//   then submits the composer draft immediately as the next prompt
// - session idle: submits like Enter
// - empty draft while running: plain interrupt (same as Esc)
//
// Fallback: the command is also available in the command palette (Ctrl+P → "Send now").
//
// Note: no imports on purpose — the v2 plugin loader requires a bare default
// export of { id, setup } for plugins discovered in the global config directory,
// and "@opencode/plugin" is not resolvable from there.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default {
  id: "luok.send-now",
  setup(context) {
    context.keymap.layer(() => ({
      mode: "global",
      priority: 1000,
      commands: [
        {
          id: "luok.send_now",
          title: "Send now (interrupt and submit)",
          description:
            "Interrupts the running turn and submits the draft immediately (Claude-style Ctrl+Enter). While idle it submits like Enter.",
          group: "Prompt",
          bind: "ctrl+return",
          palette: true,
          suggested: true,
          run: () => {
            const route = context.ui.router.current()
            if (route.type !== "session") return false
            const sessionID = route.sessionID
            void (async () => {
              try {
                if (context.data.session.status(sessionID) === "running") {
                  await context.client.session.interrupt({ sessionID })
                  // Wait for the abort to land (up to ~3s) so the submit becomes
                  // a fresh turn instead of a steer into the dying one.
                  for (let i = 0; i < 60; i++) {
                    await wait(50)
                    if (context.data.session.status(sessionID) !== "running") break
                  }
                }
              } catch (error) {
                context.ui.toast.show({
                  title: "send-now",
                  message: `Interrupt failed: ${error instanceof Error ? error.message : String(error)}`,
                  variant: "error",
                })
              }
              context.keymap.dispatch("input.submit")
            })()
          },
        },
      ],
    }))
  },
}
