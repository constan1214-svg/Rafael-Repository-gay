# ECHOBOUND

**You are alone. Your past doesn't have to be.**

A complete compact first-person puzzle game set on a drifting research station. Built with Three.js, JavaScript, and Vite. All geometry, holograms, particles, and Web Audio sounds are generated locally. No backend, downloaded assets, paid APIs, or runtime network requests.

## Launch

Requires Node.js 22.12+ (tested with Node 24) and a current desktop browser with WebGL, keyboard, and mouse.

```sh
npm ci
npm run dev
```

Open the address printed by Vite (normally http://localhost:5173). Click **Enter the station** to start and capture the mouse. Escape releases the cursor and pauses. For a production build:

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static host. No secrets or environment variables are required.

## Controls

| Input | Action |
| --- | --- |
| WASD / mouse | Move / look |
| Space / Shift | Jump / sprint |
| R | Start or stop a recording (maximum 10 seconds) |
| E | Manifest the current recording |
| F | Pulse a switch, take a core, read a fragment, or exit |
| X | Dismiss all echoes, preserving the recording |
| Escape | Pause / release cursor |

Echoes replay the captured position, facing, and switch interactions once, then **hold their final position**. Up to three coexist; creating a fourth replaces the oldest. A new recording does not change existing echoes. Echoes cannot retrieve cores for you. Pause freezes simulation time.

## The station

- **Central atrium:** checkpoint, departure portal, suspended industrial architecture.
- **Memory lab (west):** a recorded echo holds a pressure plate while you cross a mechanical energy door. Taking the core permanently opens the door and unlocks the east bridge.
- **Resonance chamber (east):** two switches must pulse within 1.5 seconds. Record an interaction at A; replay it while you interact with B. Synchronization permanently releases the second core and unlocks the north bridge.
- **Observatory (north):** a patrolling sentinel detects and pursues nearby players. Echoes take targeting priority. Lure it away to release the last core.
- **Departure:** retrieve all three cores and interact with the atrium ring to finish.

Three optional archive fragments tell the station's story. Falls and drone captures return you to the atrium while preserving cores and solved puzzles. The north maintenance lift moves and supports the player; it is optional. Settings offer graphics quality, audio volume, and mouse sensitivity, saved locally. Progress is session-only.

<details>
<summary>Puzzle walkthrough</summary>

1. Walk west. Stand on the cyan plate at the near side of the room. Press R, wait a second, press R again. Step off, press E, walk through the door, and press F near the core. The echo holds the plate indefinitely.
2. Walk east. At switch A (the north pedestal), press R and then F. Wait eight seconds, then press R. Walk to B (the south pedestal). Press E then immediately F. The echo repeats the recorded A pulse while you pulse B. Collect the core at the far side of the room.
3. Walk north. On the purple decoy pad to your left, record a short stationary memory. Spawn it, then move toward the core at the back wall. Wait until the drone reaches the decoy and the core prompt appears. Press F.
4. Return to the central atrium's departure ring and press F.

</details>

## Validation

```sh
npm test
npm run build
# In another terminal with npm run dev already running:
npm run test:browser
```

The browser check uses `/usr/bin/chromium`; set `CHROMIUM_PATH` to your installed Chromium executable on other machines. The six simulation tests cover recording limits, interpolation, rotation wrapping, replayed interactions, snapshot independence, echo capacity, puzzle success and failure cases, collisions, jumping, landing, and void falls.

The Chromium integration test renders the menu, moves and jumps with keyboard input, records and manifests echoes, solves all three puzzles, collects all cores, and reaches victory. It uses a development-only `?test=1` inspection hook to reposition between puzzle stations; this is not a full manual traversal test. The hook is excluded from production builds. Screenshots are written to `/tmp/echobound-*.png`.

## Scope and limitations

This is a short finished first version, not a large campaign. Desktop input only; no touch controls, controller support, or persistent saves. Drone AI is intentionally simple and distance-based (no line-of-sight occlusion or navigation mesh). Echo playback is kinematic, so it follows recorded paths even if a door later closes. No external physics engine or expensive postprocessing is used.

Rendering uses shared box geometry, capped device pixel ratio, one shadow map, and inexpensive fog and particles. Low graphics disables shadows and particles. Browser validation ran with software-rendered Chromium; the requested integrated-Radeon 720p performance target has **not** been measured on physical hardware. Vite reports a nonfatal chunk-size advisory for the bundled Three.js renderer (~132 KB gzip for the main bundle).

Potential next steps: a manual hardware performance pass, controller/accessibility options, save checkpoints, occlusion-aware drone navigation, additional chambers, and authored music.

## Project layout

- `src/main.js`: scene, input, audio, drone, UI, progression loop.
- `src/simulation.js`: pure replay, collision, and puzzle logic.
- `src/style.css` / `index.html`: menus and HUD.
- `tests/`: simulation and real-browser regression checks.

## GitHub Pages

A self-contained playable build is included in `docs/index.html`. To publish it, open this repository on GitHub, go to **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/docs**, and save. GitHub supplies the live URL after deployment. `docs/ECHOBOUND-Windows.zip` is the standalone offline download.

The `docs` build is a snapshot: regenerate it when changing the source game. The normal Vite build in `dist` remains available for other static hosts.
