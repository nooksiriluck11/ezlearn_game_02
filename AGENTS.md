# kukkukkoo

A static web game: **Phaser 4** on one canvas, **Vite** for the build, no backend
and no UI framework. The Expo/React Native version it grew out of is gone.

Phaser 4 ships its own docs inside the package — read the relevant
`node_modules/phaser/skills/*/SKILL.md` before writing Phaser code, and
`v3-to-v4-migration/SKILL.md` before trusting any Phaser 3 example you find
online. The API moved.

Two things about this project that are easy to break:

- `src/game/` is pure logic. It must not draw, play sound, or reach for a Scene.
  `engine.ts` emits events; `GameScene` renders and plays audio in response.
- The canvas is sized in device pixels and each Scene camera zooms by `DPR`
  (`src/ui/viewport.ts`). Scene code works in CSS pixels — do not mix the two.
