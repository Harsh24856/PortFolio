/* The board, as data. A 65% layout in key units (1u = 19.05 mm, one world
   unit): five rows of sixteen units, the arrow cluster tucked into the
   bottom right and a column of navigation keys down the right edge. */

export const UNIT_MM = 19.05

export type KeyKind = "alpha" | "mod" | "accent"

export type KeyDef = {
  /** KeyboardEvent.code, so a real keystroke presses the same key here */
  code: string
  label: string
  /** the shifted legend, drawn above the main one */
  shift?: string
  w: number
  row: number
  /** left edge, in units from the board's left edge */
  x: number
  kind: KeyKind
}

type Spec = [code: string, label: string, w?: number, kind?: KeyKind, shift?: string]

const ROWS: Spec[][] = [
  [
    ["Escape", "Esc", 1, "accent"],
    ["Digit1", "1", 1, "alpha", "!"],
    ["Digit2", "2", 1, "alpha", "@"],
    ["Digit3", "3", 1, "alpha", "#"],
    ["Digit4", "4", 1, "alpha", "$"],
    ["Digit5", "5", 1, "alpha", "%"],
    ["Digit6", "6", 1, "alpha", "^"],
    ["Digit7", "7", 1, "alpha", "&"],
    ["Digit8", "8", 1, "alpha", "*"],
    ["Digit9", "9", 1, "alpha", "("],
    ["Digit0", "0", 1, "alpha", ")"],
    ["Minus", "-", 1, "alpha", "_"],
    ["Equal", "=", 1, "alpha", "+"],
    ["Backspace", "Backspace", 2, "mod"],
    ["Delete", "Del", 1, "mod"],
  ],
  [
    ["Tab", "Tab", 1.5, "mod"],
    ...("QWERTYUIOP".split("").map((c) => [`Key${c}`, c] as Spec)),
    ["BracketLeft", "[", 1, "alpha", "{"],
    ["BracketRight", "]", 1, "alpha", "}"],
    ["Backslash", "\\", 1.5, "alpha", "|"],
    ["PageUp", "PgUp", 1, "mod"],
  ],
  [
    ["CapsLock", "Caps", 1.75, "mod"],
    ...("ASDFGHJKL".split("").map((c) => [`Key${c}`, c] as Spec)),
    ["Semicolon", ";", 1, "alpha", ":"],
    ["Quote", "'", 1, "alpha", '"'],
    ["Enter", "Enter", 2.25, "mod"],
    ["PageDown", "PgDn", 1, "mod"],
  ],
  [
    ["ShiftLeft", "Shift", 2.25, "mod"],
    ...("ZXCVBNM".split("").map((c) => [`Key${c}`, c] as Spec)),
    ["Comma", ",", 1, "alpha", "<"],
    ["Period", ".", 1, "alpha", ">"],
    ["Slash", "/", 1, "alpha", "?"],
    ["ShiftRight", "Shift", 1.75, "mod"],
    ["ArrowUp", "↑", 1, "mod"],
    ["End", "End", 1, "mod"],
  ],
  [
    ["ControlLeft", "Ctrl", 1.25, "mod"],
    ["AltLeft", "Opt", 1.25, "mod"],
    ["MetaLeft", "Cmd", 1.25, "mod"],
    ["Space", "", 6.25, "alpha"],
    ["MetaRight", "Cmd", 1, "mod"],
    ["AltRight", "Opt", 1, "mod"],
    ["Fn", "Fn", 1, "mod"],
    ["ArrowLeft", "←", 1, "mod"],
    ["ArrowDown", "↓", 1, "mod"],
    ["ArrowRight", "→", 1, "mod"],
  ],
]

export const BOARD_W = 16
export const BOARD_D = 5

export const KEYS: KeyDef[] = ROWS.flatMap((row, r) => {
  let x = 0
  return row.map(([code, label, w = 1, kind = "alpha", shift]) => {
    const k: KeyDef = { code, label, shift, w, row: r, x, kind }
    x += w
    return k
  })
})

export const keyIndex = new Map(KEYS.map((k, i) => [k.code, i]))

/** a key's centre on the board, in world units, board centred on the origin */
export const keyCenter = (k: KeyDef) => ({ x: k.x + k.w / 2 - BOARD_W / 2, z: k.row + 0.5 - BOARD_D / 2 })

/* The toolkit's groups, each wired to a cluster of keys that light up and
   take the tools' names when its tab is chosen. Order matches the content
   file's groups. */
export const TOOL_KEYS: string[][] = [
  ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"],
  ["ArrowLeft", "ArrowUp", "ArrowRight"],
  ["KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft"],
  ["KeyA", "KeyS", "KeyD", "KeyF"],
]

/* The physical layers, bottom up, as the assembly chapter names them. */
export const LAYERS = ["tray", "diffuser", "switches", "case", "caps"] as const
export type Layer = (typeof LAYERS)[number]
/** gap between neighbouring layers when fully apart, in units */
export const LAYER_GAP = 1.8
