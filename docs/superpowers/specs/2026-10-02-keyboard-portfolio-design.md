# Keyboard portfolio: design

The theme follows the Kestrel 65 product-page reference the owner chose. The board, its geometry and every shader are our own; no template code is used.

## Direction

A product page for a person, with a 65% mechanical keyboard as the product.

- **Palette:** black, white and a little blue. Off-white alpha caps and dark modifiers. The case is dark anodised with bright chamfers, and blue is used only as light: the underglow, the x-ray cut and lit keys.
- **Type:** Archivo (variable width) for display and text, B612 Mono for labels and readouts.
- **Chrome:** a top bar (name, Menu, a solid "Get in touch" button) and a numbered rail (00–05) down the left edge. Every chapter opens on a number and a name.

## Scene (`src/engine/`)

| Module | Role |
|--------|------|
| `board.ts` | 68-key 65% layout as data, wired to `KeyboardEvent.code`. Also holds the toolkit key clusters and the layer list. |
| `keycap.ts` | Lofted cap: rounded footprint, draft, rim fillet, cylindrical dish. Top-face UVs carry the legend. |
| `legends.ts` | One atlas holding two cells per key: the printed legend and the tool name shown when the key is lit. |
| `keyboard.ts` | Builds tray, diffuser ring, PCB, plate and switches, top case, and the caps as InstancedMeshes. Per-key springs handle presses and hover. Every solid material is cut at a scan plane; past the cut, instanced edge lines draw the board as blue wireframe. |
| `backdrop.ts` | One full-screen pass: hex tiles, a pool of underglow under the board, and the chapter word in bevelled brushed metal (height field from a blurred glyph). |
| `rig.ts` | One station per chapter: camera position and aim, where the cut sits, and where the word sits. Pinned sections hold their station across the pin. |

## Chapters

| # | Section | Behaviour |
|---|---------|-----------|
| 00 | Hero | Three-quarter view; left quarter in x-ray; HARSH behind. The board types H-A-R-S-H on arrival. |
| 01 | About | Pinned. Copy about me, then five strengths walked one at a time with a count on the right; the board parts and reseats behind. |
| 02 | Toolkit | Pinned, top-down. The toolkit tablist and scroll are one control; the chosen group's keys light and show tool names. |
| 03 | Work | Macro pass over the caps behind the cloth project cards. |
| 04 | Datasheets | Side view with half the board in x-ray. The book is white paper with black ink and blue accents behind a black cover; resting on the right-hand page for 5 s turns it, with a blue rule filling as it counts. |
| 05 | Contact | Real keystrokes press their twins on the board; sending a message runs a wave out from Enter. |

## Kept from before

- Case studies, cloth cards, the datasheet book, the contact form.
- The tiers (`?tier=`), `?shot=N` and `?perf`.
- Reduced-motion camera cuts and the WCAG 2.2.2 pause control.
- The page↔engine event bus, renamed from `die:*` to `scene:*`.
