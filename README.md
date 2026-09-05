# TABOK — True 3D Board Alpha

Version: **v0.46.1 True 3D Alpha — Continuous Portal**

## Living board interactions

- A single GPU-driven energy surface now glows through the narrow hex seams and sends rare branching lightning beneath the board. When the Major Monster is present, the illumination strengthens, pulses faster, and lightning strikes more frequently. Ultra Performance retains a static glow and disables streak animation.
- Grey network stones now retain a darker charcoal-taupe value under bright moonlight and temple lighting, matching the visual weight of the teal and purple networks.
- Local host movement resolves directly from the true-3D hex under the pointer, fixing legal movement selections that could be swallowed by the multiplayer click bridge.

- Riftwalk destinations can be selected directly on the interactive 3D board, including from a remote Human player's device.
- Travelers and Monsters glide across the floor instead of hopping above it.
- Every occupied hex receives a restrained, color-matched glow beneath its actor.
- Rune Dice use textured astral stone, luminous inner crystal, and metallic edge detailing.
- Modeled Armor and Shield pickups now rotate and hover gently like the Rune Dice.

## Private turn rolls

- The full dice-roll presentation appears only on the device controlling the active Human Traveler.
- Other Human players receive the synchronized result without seeing that Traveler's popup.
- CPU rolls resolve globally without interrupting Human screens with a dice popup.
Build: **2026.09.04.V1**

### Veil Dome and modeled tokens

- Narrows the Portal architecture to a slim segmented bezel so it no longer obscures nearby playable hexes.
- Removes the four oversized square keystones and centers twenty brighter rune glyphs within the new bezel.
- Adds a translucent half-sphere force field with Fresnel edge glow, branching energy traces, and seven tiny procedural lightning arcs.
- Replaces neon Traveler and Monster bases with grounded, textured stone hex plinths and restrained metallic color inlays.
- Replaces flat Armor and Shield sprites with compact illuminated 3D models that receive the Temple lighting and cast real shadows.
- Scales dome lightning by the board quality setting to preserve the Ultra Performance target.

### Dramatic Temple Light pass

- Rebalances the arena around deep ambient shadow, a sharp cold overhead key, and a violet opposing rim light.
- Adds six localized warm entrance torches with subtle non-random flame and glow animation.
- Adds a color-reactive overhead Portal spotlight that changes with rejection, Reckoning, and Crossing states.
- Uses soft contact shadows and filmic highlight control while preserving tile readability.
- High Fidelity 60 activates three real torch lights while preserving all six visible flames and glows; Cinematic maximum restores all six real lights.

### Living Stone material pass

- Preserves the exact point-top hex meshes, coordinates, spacing, and movement hit areas from Hex Lock.
- Replaces flat-looking tile color with optimized limestone, oxidized teal stone, and corrupted obsidian materials.
- Uses six deterministic rotations and tiny tone variations per material to break visible repetition without changing multiplayer state.
- Adds texture-driven roughness, stronger stone relief, dark beveled sides, worn brass traces, and restrained portal corruption.

### Hex Lock correction

- Board tiles and Character/Monster plinths now preserve TABOK's original point-top orientation, with a vertex at the top and bottom.
- Legal-movement outlines are rotated around the board's vertical world axis to match those point-top hexes at every camera angle.
- Verified against the original point-top reference in both direct top view and low 3D perspective.

### Displaced Ruins upgrade

- Portal ring caps now use true geometry displacement for uneven carved stone, chipped height variation, and recessed cracks.
- Portal keystones use subdivided geometry with restrained physical displacement.
- Hex tiles, the chamber floor, outer ruin columns, portal walls, and raised portal lips use lightweight bump relief for detail without multiplying board geometry.
- Movement, Action, and Rune dice faces now carry subtle raised relief across their frames, symbols, cracks, and pips.
- Ultra-performance mode automatically reduces true portal displacement strength; Full and automatic quality retain the complete depth treatment.

### Abyssal Portal upgrade

- Rebuilt the Portal as real perspective-correct 3D architecture with twenty individual stone ring segments, raised inner and outer lips, and four heavy keystones.
- Added a continuously animated GPU vortex with a dark abyss, spiraling violet currents, drifting sparks, turbulent energy around the rim, and levitating stone fragments.
- Added twenty luminous hand-drawn runes and two pulsing energy seams without adding any large image or video download.
- Portal colors now transition by event: violet while idle, pink on rejection, blood-magenta during Reckoning, and spectral cyan during a successful Crossing.
- The Portal remains clickable and centered as the board's camera axis from every viewing angle.

This build fixes two perspective-alignment issues:

- Minor Monsters now use an exact single-frame crop from their four-frame sheet and are foot-anchored to the center of their 3D plinth.
- Take, Give, Steal, and Grand Plunder treasure flights now aim at the Traveler's live camera-projected 3D position, so the target remains accurate after orbiting or zooming the board.

The normal turn-roll popup uses physical beveled 3D dice in a ritual casting tray. The obsidian Movement die uses glowing amber pips; the violet Action die uses wordless Take, Give, and Steal sigils. A Traveler bonded to a Rune casts a third cyan 3D die beside them, with six unique engraved power symbols. This three-die presentation remains physical even when the device requests reduced motion, using a shortened cast instead of reverting to the old flat popup. Results remain authoritative and deterministic. Monster dice retain their established interface in this focused pass.

## Starting the actual 3D version on a Mac

Do not double-click `index.html`. Browsers block the local JavaScript modules and will show the flat compatibility board.

1. Double-click `START-TABOK.command`.
2. Keep the Terminal window open while playing.
3. The game opens at `http://127.0.0.1:8773/index.html`.

GitHub Pages also serves the actual 3D version correctly. When 3D is active, the header says **True 3D ruins ready · drag to orbit**. Drag anywhere over the arena, use the mouse wheel to zoom, or use the ↶ and ↷ camera buttons.

## Actual 3D board space

- The board is rebuilt as real extruded hex geometry in a Three.js scene.
- The Portal is the world origin and permanent camera orbit axis.
- Hold the primary mouse button and drag to rotate around the arena. Use the
  mouse wheel to zoom. On touchscreens, drag to rotate and pinch to zoom.
- Hex selection uses 3D ray-picking, so legal movement remains clickable from
  every camera angle.
- Travelers, Monsters, equipment, Rune Dice, the ruin floor, perimeter walls,
  lighting, shadows, fog, and the animated Portal all occupy 3D world space.
- Traveler and Monster artwork is presented as grounded camera-facing game
  miniatures, while their bases, tiles, items, and Portal are geometric objects.
- The existing SVG board is retained as an automatic compatibility fallback if
  WebGL or JavaScript modules cannot start.

Three.js 0.185.1 and OrbitControls are vendored inside `vendor/`, so GitHub Pages
does not need a runtime CDN for the 3D engine.

## Ground-contact correction

- Legal and route highlights are vertically compressed to follow the board's
  photographed floor perspective instead of displaying as upright hexagons.
- The black inset circles and separate black contact ellipses beneath Travelers
  have been removed.
- Traveler artwork is anchored six pixels lower and the remaining metallic base
  is shallower, placing the feet directly against the ground plane.

## Perspective calibration

- Traveler miniatures now occupy approximately one projected board hex instead
  of spanning several spaces.
- The Eclipse Well is flattened into the floor plane and scaled to the central
  opening in the supplied board artwork.
- Rune Dice, equipment, legal-destination glyphs, step reactions, and Monster
  threat marks use smaller grounded footprints matched to the board projection.
- All six starting anchors are registered directly to the illuminated white
  entrance plinths painted into the new board, rather than inferred from the old
  flat board grid.
- Minor Monsters fit one hex. The Major Monster remains visibly larger, but no
  longer reads as a separate oversized interface element.

## Spatial depth system

- Board locations are projected through a perspective-aware coordinate system.
- Travelers, Monsters, equipment, and Rune Dice scale continuously with depth:
  smaller at the far wall and larger toward the foreground.
- Moving pieces interpolate position and physical scale together, with a slight
  lifted midpoint so each step reads as movement through space.
- Actors are depth-sorted after every render, preventing a distant piece from
  incorrectly painting over a nearer one.
- Floor highlights change size with perspective, and every standing object has
  a contact shadow anchored to its floor coordinate.

## New board plate

- `assets/board-new-2_5d.jpg` is the authoritative visual ground plane.
- The interactive SVG layer uses a projected coordinate map aligned to the six
  illuminated entrance plinths, the perspective hex field, and central opening.
- Duplicate procedural hex rendering is disabled. Only gameplay overlays—legal
  routes, equipment, Rune Dice, threats, Travelers, Monsters, and the animated
  Portal—render above the supplied board art.
- The static high-resolution ground plane eliminates continuous GPU board draws
  while preserving animated game pieces and effects.

## What changed from the first redesign

- The supplied September 3 mockup is now the composition reference, not merely a
  color reference.
- A new high-resolution isometric ritual chamber forms the environmental plate:
  volcanic masonry, warm shrine light, violet fissures, vegetation, and carved
  ruin architecture frame the playable hex field.
- Board Travelers are full-body animated miniatures standing on colored metallic
  plinths instead of small cropped portrait badges.
- The right Traveler rail includes recognizable portrait medallions and expands
  the active Traveler, matching the mockup's roster hierarchy more closely.
- Raised 2.5D hex rendering, a shallow isometric board tilt, a larger central
  Crossing, compact active-Traveler HUD, expandable Rules & Codex, and a
  board-integrated dice altar create a more coherent tabletop composition.
- Safari-safe nested Portal rune transforms preserve the floating glyphs across
  Safari, Chrome, and Firefox.

The build remains a browser-native 2.5D interpretation. It does not pretend the
characters or dice are real-time 3D models; the goal is the mockup's hierarchy,
depth, illumination, and legibility while retaining the complete multiplayer game.

## Performance modes

- **High Fidelity 60** is the default for local and multiplayer rooms.
- The HTML interface remains Retina-sharp while only the 3D framebuffer adapts between 72% and 125% density to protect frame pacing.
- Repeated board tiles render as GPU-instanced batches, and invisible tile shadow casting is removed without changing the tile artwork.
- Performance 60+ disables costly secondary effects; High Fidelity 60 retains the full atmosphere and adapts before removing visible detail.
- Important gameplay animation remains: movement, dice, treasure transfers, Portal judgment, Crossing, Last Breath, and Answer-or-Die.
- The live FPS meter is always visible and can report high-refresh rates up to 240 FPS. Actual FPS follows the browser, device, refresh rate, and power settings.
- Cinematic maximum, Performance 60+, and Battery saver remain available for comparison.

## Multiplayer alpha

- One player hosts a browser room and shares its short room code.
- The host can mix connected Humans and host-controlled CPU Travelers in any 1–6 player room. Open slots can be assigned individually or filled with CPU companions in one click.
- Human and CPU names and characters remain editable in the lobby. The host may also convert every active slot to CPU and run a fully automated spectator match with no Human seat required.
- The pre-game roll-off uses a shrinking pool of starting positions from `1` through the active Traveler count. Every Human or CPU roll locks one unused position permanently, removes it from later results, and makes ties impossible. Highest position acts first and lowest acts last.
- Every normal in-game Traveler turn now opens a character-focused dice scene. Human Travelers click to cast Movement, Action, and an owned Rune Die; CPU Travelers visibly prepare and automatically cast the same animated dice. The scene and raffle results synchronize to every connected device.
- The turn-roll scene exists only during the active Traveler's roll phase. Once the dice land, their final results remain on screen for approximately two seconds before movement begins.
- Turn dice brake dramatically before the final reveal: rapid raffle cycling eases into increasingly slow beats, then lands on “Fate has decided.” The result now holds for two seconds.
- The central Portal is now the lightweight vector **Eclipse Well**. Its colors and motion shift globally through Idle, Judgment, Crossing, Rejection, and Reckoning, with the authoritative host synchronizing the current state to every connected device.
- Host-controlled CPU Travelers now resolve Portal judgment, Last Breath, Answer-or-Die, and Major Monster message scenes automatically. The host may also tap their Continue button as a mobile-browser fallback; remote guests still cannot resolve another Traveler's decision.
- Sound controls are now local on every multiplayer device and can no longer be blocked or forwarded by game-turn ownership. Mobile Safari resumes audio on the next touch after interruptions. Master output is 50% louder, with a dynamics limiter preventing overload distortion.
- Dice-roll popup portraits now use an isolated, tighter vertical crop. Justin, Sue, and Wanday are anchored lower inside the hex so the source sheet's unused bottom strip never appears, without changing lobby, board, or character-preview portraits.
- The host is authoritative: remote devices send their legal clicks and challenge typing to the host, then receive the synchronized board, controls, Portal scenes, and results.
- The global room chat is fixed at the lower-left beneath the compact, independently scrollable guide.
- Refreshing a guest browser reserves and reclaims its slot using a local device token while the host remains online.
- PeerJS now receives Cloudflare STUN and optional TURN/TLS relay routes. The lobby reports whether TURN is ready, and a 15-second connection diagnostic explains failures instead of loading forever.
- `turn-relay/` contains the deployable Cloudflare Worker that safely issues 24-hour TURN credentials. Configure its public endpoint in `network-config.js`; never place the permanent TURN key in the game files.

The build uses PeerJS/WebRTC for browser-to-browser room traffic. Host it over HTTPS (GitHub Pages is suitable) and keep the host tab open for the entire expedition. Deploy the included TURN credential Worker for reliable play across mobile carriers, restrictive routers, VPNs, and different networks. See `turn-relay/README.md`. No player account is required. This is a casual-play alpha rather than an anti-cheat competitive server.

Grand Plunder now plays as a readable sequential barrage: each chosen treasure completes its full flight, lands on the collector, and updates the inventory before the next treasure launches.

Open `index.html` through a secure web host such as GitHub Pages, or serve this
folder locally. The game remains browser-only and requires no installation.

## Renderer

- The game requests WebGPU first for its cached high-resolution board, haunting
  Portal, GPU particles, and Living Ruins atmosphere.
- If WebGPU is unavailable or initialization fails, the same build retries with
  WebGL automatically. SVG remains the final compatibility renderer.
- Firefox direct `file://` launches use the full SVG compatibility board because
  Firefox can expose a GPU canvas while refusing the cached board texture. All
  hexes and gameplay remain available. Hosted builds continue to use WebGPU or
  WebGL automatically.
- The active renderer is displayed in the game header. Add `?debug` to the URL
  to show the live frame-rate meter.
- All W7 gameplay remains. Ultra mode intentionally removes continuous camera
  emphasis and spectral ambience; other quality modes retain those effects.

## Procedural sound

The W8 soundscape is generated live through the Web Audio API. No MP3 or WAV
files are downloaded.

- Low ruin drone and filtered wind ambience
- Dice casting and raffle-roll impact
- Traveler footsteps and Monster movement
- Separate Take, Give, Steal, Resolve, Rune, Shield, and damage cues
- Portal judgment, rejection, crossing, death, and Major Monster signatures
- Answer-or-Die and Last Breath warning tone
- A persistent **Sound on/off** control in the header

Browsers require a click or key press before audio may begin. The first player
interaction unlocks the sound engine automatically. The mute preference is
remembered on that device.

## Performance controls

- Character movement now updates persistent 3D actors in place. It no longer destroys and recreates every Traveler, Monster, item, glow, material, and geometry after each step, eliminating the hitch that made the Portal appear to restart.
- Equipment and Rune meshes rebuild only when their actual board inventory changes; legal highlights rebuild only when legal destinations change.
- The Portal animation clock remains continuous across movement, board synchronization, and multiplayer snapshots. Remote clients now apply the host's 3D Portal state directly as well as its compatibility-layer state.
- **High Fidelity 60** is now the default. The interface stays Retina-sharp while the 3D board gently adapts its internal resolution between demanding and quiet scenes.
- Board hexes are GPU-instanced, reducing hundreds of separate tile submissions to a few dozen without changing their textures or geometry.
- Floor tiles receive shadows but no longer waste time casting nearly invisible shadows; characters, Monsters, equipment, the Portal, and ruins retain dimensional lighting.
- All six lantern flames and glows remain visible while High Fidelity uses three real scene lights. Cinematic restores all six.
- Portal lightning retains its full animation but updates its irregular geometry at 30 Hz while camera movement, dice, characters, and the final render remain at 60 Hz.
- **Cinematic maximum** preserves maximum render density and effects for stronger desktop hardware; **Performance 60+** and **Battery saver** provide fixed lower-cost profiles.
- Procedural audio uses a small number of native audio nodes and does not add
  network weight to the game.
