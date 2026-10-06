# opencode-send-now

**Claude Code-style `Ctrl+Enter` "Send now" for the [OpenCode](https://opencode.ai) TUI.**

While the model is working, type your addition and press `Ctrl+Enter`: the running turn is
interrupted immediately and your draft goes in right away — as an update to the task, not a
message queued for later.

```text
┃  Napisz 10 zdaniu o morzu, kazde w nowej linii
┃     + Thought · 259ms
┃     Build · GLM 5.3 Flash · 1.6s · interrupted     ← turn killed mid-stream
┃  STOP: odpowiedz tylko STOP                        ← draft submitted instantly
┃     STOP                                           ← model answers the addition
```

In OpenCode, `Enter` while busy *steers* — your text is delivered at the next step boundary,
so the model has to finish its current reasoning/tool step before it reads you.
Claude Code (v2.1.275+) ships this as the `chat:sendNow` action. This plugin brings that UX
to OpenCode as a small TUI plugin.

## Behavior

| State | `Ctrl+Enter` does |
| --- | --- |
| Model is working, draft has text | Interrupts the turn, then submits the draft as a fresh prompt |
| Model is working, draft is empty | Interrupts the turn (same as `Esc`) |
| Session is idle | Submits the draft (same as `Enter`) |

The draft — including attachments — is submitted through the native submit path, and the
partial output of the interrupted turn stays in the transcript.

Fallback: `Ctrl+P` → **"Send now (interrupt and submit)"** works regardless of what your
terminal does with `Ctrl+Enter`.

## Install

OpenCode discovers plugins in the global config directory:

```bash
mkdir -p ~/.config/opencode/plugins/send-now
git clone https://github.com/Lukas-tek-no-logic/opencode-send-now /tmp/opencode-send-now
cp /tmp/opencode-send-now/{tui.ts,index.ts} ~/.config/opencode/plugins/send-now/
```

Restart the TUI (sessions live on the shared server, so nothing is lost).

Optionally remove the `ctrl+return` conflict with the built-in newline binding in
`~/.config/opencode/cli.json` (Shift+Enter / Alt+Enter / Ctrl+J still insert a newline):

```json
{
  "keybinds": {
    "input.newline": "shift+return,alt+return,ctrl+j"
  }
}
```

## How it works

1. A global keymap layer binds `ctrl+return` to a `luok.send_now` command (palette: on).
2. When the session status is `running`, it calls `client.session.interrupt({ sessionID })`.
3. It waits (up to ~3 s) for the status to return to `idle`, so the submit lands as a new
   turn instead of a steer into the dying one.
4. Then it dispatches the built-in `input.submit`, keeping the composer's native semantics
   (attachments, slash commands, shell mode).

No third-party imports — the v2 loader expects a bare default export of `{ id, setup }`
for plugins discovered in the global config directory.

## Terminal support

OpenCode's TUI enables `modifyOtherKeys` (xterm-style enhanced keys), and the plugin was
tested with the real `Ctrl+Enter` sequence (`CSI 27;5;13~`) under a pty. Most modern
terminals report it (Ghostty, WezTerm, kitty, Alacritty, foot, recent GNOME Terminal…).
If yours doesn't, use the palette fallback — or rebind the command.

## Requirements

- OpenCode **v2** (tested on `2.0.24`)

## Related keys (unchanged)

- `Enter` while busy — steer (deliver at the next step boundary)
- `Ctrl+X`, `Enter` — queue the prompt for later
- `Esc` — hard interrupt without submitting

## License

[MIT](LICENSE) © Łukasz Okarmus
