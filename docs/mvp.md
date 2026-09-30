# The First Garden MVP

## Implemented

- One complete, peaceful restoration level with renewable seeds and water.
- Four original procedural 3D helpers with distinct roles and selectable movement.
- Resource-cost recruitment, a repairable bridge, three flower beds, and a tree-awakening completion scene.
- A guided next-step flow plus manual helper selection and task assignment.
- Mouse, keyboard, responsive touch controls, and standard Gamepad API controller input.
- Pause/resume, confirmation before resetting progress, local saves, invalid-save recovery, reduced motion, optional synthesized sounds, and movement/interaction key remapping.
- Bundled fonts and assets: no runtime third-party requests, analytics, accounts, or backend.
- Production web build and repeatable Capacitor Android/iOS project generation and synchronization.

## Visual approach

Spacious mint-and-cream surfaces surround a small, side-view 3D garden. Peach, blue, lilac, and gold distinguish the helpers and resources. Simple geometry replaces the storyboard's ornate scenery. The procedural models are first-playable art, not final animated production assets.

Desktop shows the whole garden. Narrow screens follow the selected helper. The player can pan the view or center it again. Restoration changes are persistent; idle motion is gentle and can be turned off.

## Validation boundaries

Current checks passed: 7 gameplay unit tests, 3 browser tests, a follow-up mobile-label check, a frozen-lockfile install, the production build, and Android/iOS project generation and repeated asset synchronization. The production bundle was also exercised in Chromium through recruitment and bridge restoration, with no runtime errors or failed asset requests.

Unit tests cover role restrictions, resource accounting, progression gates, renewable gathering, completion, and corrupted saves. Browser tests exercise the actual rendered level, keyboard movement, controller input simulation, pause, settings, save/reload, reset, and touch-sized layout.

Controller simulation verifies input handling; it does not verify Bluetooth/USB pairing or an actual controller. Mobile Chromium emulation verifies responsive layout and touch events; it does not verify iOS Safari, a native WebView, or phone performance. Capacitor synchronization produces projects and assets; it does not compile a signed APK/AAB or an iOS archive.

## Before wider playtesting

1. Play on physical Android and iOS devices, Safari, and representative desktop browsers.
2. Test real controllers on desktop and mobile, including disconnection and button mappings.
3. Observe children using the tutorial and adjust readability, task clarity, and pacing.
4. Measure rendering performance, memory, battery use, and initial download on lower-powered phones.
5. Expand accessibility checks, tune contrast and touch targets, and add better navigation prompts as needed.

## Before release

Choose production identifiers and hosting, create store accounts, compile native builds with the appropriate toolchains, configure signing, supply original icons and screenshots, complete privacy and age-rating disclosures, and run store beta distribution. App-store approval and public hosting have not been performed by generating this MVP.

The current milestone does not include multiplayer, campaigns, weather simulation, cloud saves, ads, purchases, or final artwork. Those can follow testing of the restoration loop.
