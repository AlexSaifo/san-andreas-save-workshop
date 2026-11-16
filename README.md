# San Andreas Save Workshop

**Edit a classic PC GTA San Andreas save in your browser.** Change CJ’s stats, equipment, clothes, mission counters, and more. Review what changed, then download a checksum-verified copy. Your original save stays untouched.

> Unofficial fan project by [Alex Saifo](https://alex.saifo.se). For the original PC release.

## What you can do

| Feature | What it covers |
| --- | --- |
| Player and stats | Health, armor, cash, skills, body stats, and 305 statistics |
| Missions | Supported mission counters and flags, plus school results |
| World and vehicles | Garages, weapons, tags, collectibles, gang territories, and more |
| Dressing room | CJ’s clothes, accessories, hair, and tattoos with a live 3D preview |
| Save tools | Original backup, undo/redo, byte comparison, slot selection, and checksum verification |
| 100% sample | Open or download Alex’s “End Of The Line” save as Slot 1 |

The editor reads saves locally using the browser’s file APIs. It does not need an account, database, or upload server. It supports the recognized **202,752-byte classic PC save format**. Mobile, console, and Definitive Edition saves are unsupported. Named mission controls require a standard PC v1 or v2 script.

Editing a counter changes stored mission state; it does not replay a mission or run its rewards. Back up first, keep the game closed while replacing a file, and test the edited save in an unused slot.

## Run locally

You only need a recent browser and a static file server. With Python 3, run from the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory public
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/). Choose **Open save editor** to load your own `.b`, or **Open this save in editor** to try the bundled 100% sample. For an export, select the target slot in **Overview** and click **Download edited save**.

## Local edition and public source

This local checkout contains the complete fan-site experience: CJ’s bundled 3D assets, classic loading-screen postcards, character portraits, a memories card, and a radio with 186 original music and talk clips across 11 stations. The radio starts at 10% when autoplay is allowed; the site offers a manual start otherwise.

**Do not push this checkout, its deployment ZIP, or its Git history to a public repository.** Git history already contains game models, textures, artwork, and the soundtrack. A new commit deleting those files does not remove them from older commits.

Use the separate **public-source starter** ZIP. It starts from the editor before the bundled game assets were added. It includes the editor, the 100% sample, the save guide, and the Vercel and SEO setup. Its dressing room reads visitors’ own `player.img` locally. The bundled soundtrack, portraits, and loading-screen art are omitted. Start a new repository from the extracted files; do not copy the old `.git` directory.

## Checks and contributions

From the repository root, run:

```sh
node tests/check.cjs
node tests/radio.cjs
node build.cjs
```

The package check validates the 100% sample, checksum, static paths, and wardrobe assets. The radio check verifies bundled track paths and station art. Pass the path to a local classic PC installation to additionally compare the radio clips to the installed originals.

`public/` is the website source, `tests/` holds verification scripts, and `build.cjs` generates deployment metadata into `dist/`. Report issues with the game edition, browser, and steps to reproduce. Share a minimal test case with pull requests; leave private saves and game files out of issues and PRs.

## Deploy the public-source edition

1. Import the new GitHub repository into [Vercel](https://vercel.com/docs/git/vercel-for-github). Leave the root directory at the repository root.
2. The included `vercel.json` runs `node build.cjs` without installing dependencies and serves `dist/`. Keep [Vercel system environment variables enabled](https://vercel.com/docs/environment-variables/system-environment-variables#enable-system-environment-variables), or set `SEO_SITE_URL` to your production HTTPS origin.
3. [Verify ownership](https://support.google.com/webmasters/answer/9008080) in Google Search Console and submit `/sitemap.xml`. For HTML-tag verification, set `GOOGLE_SITE_VERIFICATION` to the token value and redeploy.

The complete local edition exceeds Vercel Hobby’s [100 MB CLI source-upload limit](https://vercel.com/docs/limits#static-file-uploads). The public-source starter omits those large assets.

## Credits and licensing

- [libsavegame](https://github.com/gtasa-savegame-editor/libsavegame) and [GTA:SA Savegame Editor](https://github.com/gtasa-savegame-editor/gtasa-savegame-editor) for save format research and wardrobe metadata.
- [Sanny Builder data](https://github.com/sannybuilder/data), [Plugin-SDK](https://github.com/DK22Pac/plugin-sdk), and [gta-reversed](https://github.com/gta-reversed/gta-reversed) for game data references.
- [Three.js](https://threejs.org/) for 3D rendering. The applicable upstream notices are in `public/editor.html`.
- [SA Radio Generator](https://github.com/TheLuciano354/gta-sa-radio-generator) for reference on the original PC radio lookup format.

A project-wide source license has not been selected. Add a license for the code you own before calling the project open source; MIT is one option. Keep upstream notices intact. Rockstar’s game assets and third-party music are not included in any project source-code license.
