# Bloom Brigade design brief

## Direction

Preserve the appeal of resource gathering, team building, unit roles, and direct character control in a side-view strategy game. Create original characters, mechanics, setting, art, and audio. The theme is garden restoration: no war, weapons, enemy combat, or base destruction.

Target platforms: iOS, Android, and web. Keyboard and mouse must be easy to use; connected controllers are optional. Mobile touch controls must support the same core actions.

## Core loop

Gather seeds and water, recruit helpers at a nursery, assign tasks, combine abilities to overcome environmental obstacles, and restore the Great Tree. Weather and resource allocation can introduce strategic choices without violence.

## Original helpers

| Helper | Appearance | Role |
| --- | --- | --- |
| Seed Sprout | Lime green, leaf ears, peach satchel | Collect seeds and plant flowers |
| Pebble Pal | Rounded lavender stone, moss tuft | Repair bridges and paths |
| Dew Dancer | Sky-blue droplet, petal skirt | Gather water and water plants |
| Glow Moth | Golden body, peach wings | Light dark paths and guide creatures |

## Visual direction

Keep mint green, coral peach, lavender, sky blue, and soft golden yellow. Use rounded 3D forms, gentle lighting, restrained effects, spacious backgrounds, and clear silhouettes. Present one focal task per scene and a minimal interface. Avoid dense scenery, persistent particles, excessive decoration, and competing animations.

The storyboard is generated concept artwork, recreated after the earlier simplified image was unavailable as a workspace file. It illustrates the six story beats; production scenes should simplify background detail further to honor the requested calm presentation. It is not an implemented game screenshot or a performance benchmark.

## Storyboard

![Six-panel storyboard](assets/bloom-brigade-storyboard.png)

1. **Discover:** A Seed Sprout finds a drooping flower in a sleeping garden.
2. **Grow a team:** Recruit a Pebble Pal at the nursery.
3. **Gather:** Collect seeds and water for restoration.
4. **Work together:** Repair a bridge and open the path.
5. **Bring back color:** Water a small flower bed with help from a Glow Moth.
6. **A garden renewed:** Restore the Great Tree and celebrate quietly.

## Proposed controls

Bindings are provisional and need prototype testing. All menus and gameplay actions should work without switching input devices.

| Action | Keyboard / mouse | Controller | Touch |
| --- | --- | --- | --- |
| Move selected helper | A/D or arrow keys | Left stick | On-screen movement control |
| Select helper | Click character | Shoulder buttons cycle | Tap character |
| Assign task | Click object or destination | Select target, A / Cross confirms | Tap object or destination |
| Use ability | Space or ability button | X / Square | Ability button |
| Recruit | Click button or 1–4 | Recruit menu and D-pad | Recruit buttons |
| Move camera | Drag or Q/E | Right stick | Swipe camera area |
| Pause | Escape | Menu / Start | Pause button |

Include keyboard remapping, visible controller focus, and prompts that match the active device. Validate target selection and recruitment with children-friendly usability testing. Controller support in browsers and on phones needs device-specific testing.

## Proposed first playable milestone

Build one short garden-restoration level with gathering, recruitment, distinct helper tasks, a bridge obstacle, and a clear completion condition. Verify keyboard/mouse, controller, and touch play before expanding the campaign.

Next work: select and test a 3D engine across web and mobile; implement the core loop with placeholders; test input and readability; produce optimized original assets; validate representative devices; then prepare hosting and store releases. Unity is a candidate, not a committed choice. iOS release tooling requires macOS/Xcode access and mobile store distribution requires developer accounts.

Accounts, multiplayer, ads, and purchases are outside the proposed initial milestone. Privacy, age rating, accessibility, and store requirements must be assessed before release.
