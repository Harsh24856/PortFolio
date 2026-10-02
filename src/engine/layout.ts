/* The site plan of the die, in metres. The camera walks in along +z → −z:
   over the I/O edge, up the avenue between the memory banks, up the metal
   stack, through the gate and onto the plateau before the core, with the
   wafer hanging in the sky beyond. Everything that builds geometry or draws
   the floorplan reads these, so they cannot drift apart. */

export const DIE = { x0: -34, x1: 34, z0: -64, z1: 8 }
export const DIE_W = DIE.x1 - DIE.x0
export const DIE_D = DIE.z1 - DIE.z0

export const PODIUM = { y: 3.6, x0: -14, x1: 14, z0: -56, z1: -24 }
export const STAIRS = { zFront: -8, zBack: -24, w: 9, steps: 12 }
export const GATE = { zs: [-27, -30.6, -34.2], span: 4.6, height: 5.6 }
export const FINS = { z0: -37, z1: -25, xs: [-3.1, -1.55, 1.55, 3.1], h: 1.25, w: 0.34 }
export const CORE = { z: -46.5 }

export const SRAM_L = { x0: -27, x1: -8.5, z0: -24, z1: -5 }
export const SRAM_R = { x0: 8.5, x1: 27, z0: -24, z1: -5 }
export const SYSTOLIC = { x0: 17, x1: 29, z0: -52, z1: -31 }
export const HEATSINK = { x0: -30, x1: -17, z0: -54, z1: -30 }

export const WAFER = { x: 21, y: 31, z: -86, r: 12.5 }
export const WORD_Z = 3.4

/** world (x, z) → floorplan uv, shared by every surface that shows the die */
export const dieU = (x: number) => (x - DIE.x0) / DIE_W
export const dieV = (z: number) => 1 - (z - DIE.z0) / DIE_D
