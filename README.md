# San Andreas Save Workshop

**A browser-based save editor for the classic PC release of GTA San Andreas.**

**[Open the live site →](https://san-andreas-save-workshop.saifoa808.workers.dev/)**

Open a save, change CJ's stats, gear, clothes, mission counters and more, check what changed, then download a copy with a valid checksum. Your original file is never modified. Nothing is uploaded: every save is read and written in your browser.

> Unofficial fan project by [Alex Saifo](https://alex.saifo.se). Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.

## Features

| Area | What you can edit |
| --- | --- |
| **Player & stats** | Health, armor, cash, skills, body stats, and all 305 statistics |
| **Missions** | Supported mission counters and flags, plus school results |
| **World & vehicles** | Garages, weapons, tags, collectibles, gang territories, and more |
| **Dressing room** | Clothes, accessories, hair, and tattoos with a live 3D preview |
| **Save tools** | Original backup, undo/redo, byte-level diff, slot selection, checksum verification |
| **100% sample** | Open or download a completed "End Of The Line" save as Slot 1 |

The site also includes character portraits, loading-screen postcards, a memories card, and an in-browser radio covering 11 stations.

## Compatibility

- **Supported:** classic PC saves in the standard **202,752-byte** format (`GTASAsf*.b`).
- **Named mission controls** require a standard PC v1 or v2 script.
- **Not supported:** mobile, console, and Definitive Edition saves.

Changing a mission counter only changes the stored state. It does not replay the mission or give its rewards.

> [!TIP]
> Back up your saves first, keep the game closed while replacing a file, and test edited saves in an unused slot.

## Getting started

The quickest way is the [live site](https://san-andreas-save-workshop.saifoa808.workers.dev/). To run it locally, there is nothing to install: you need a recent browser and any static file server. With Python 3, run this from the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory public
```

Then open <http://127.0.0.1:8765/>:

1. Choose **Open save editor** and load your own `.b` file, or **Open this save in editor** to try the 100% sample.
2. Make your changes.
3. In **Overview**, pick the target slot and click **Download edited save**.

See the in-site **save file guide** (`public/save-file-guide.html`) for where PC saves are stored and how to install one.

## Project structure

```text
public/            Website source (HTML, CSS, JS, and static assets)
  assets/          Editor engine, UI modules, wardrobe pack, radio data
  downloads/       The bundled 100% sample save
tests/             Verification scripts
tools/             Helper scripts (e.g. importing radio clips from a local install)
build.cjs          Copies public/ to dist/ and adds SEO tags, sitemap.xml and robots.txt
vercel.json        Vercel build settings and security headers
```

## Tests

Requires [Node.js](https://nodejs.org/). No dependencies to install.

```sh
node tests/check.cjs   # 100% sample, checksum, static paths, wardrobe assets
node tests/radio.cjs   # radio track paths and station art
node build.cjs         # build the site into dist/
```

To also compare the bundled radio clips with your own installed game files, pass the path to a classic PC installation:

```sh
node tests/radio.cjs "C:/Path/To/GTA San Andreas"
```

## Deploying

The site is fully static and is live at <https://san-andreas-save-workshop.saifoa808.workers.dev/>, hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/). Every push to `main` deploys automatically.

| Setting | Value |
| --- | --- |
| Build command | `node build.cjs` |
| Deploy command | `npx wrangler deploy --name san-andreas-save-workshop --assets ./dist --compatibility-date 2026-11-01` |

`build.cjs` uses the live URL above for canonical links, Open Graph and Twitter cards, structured data, `sitemap.xml` and `robots.txt`. To use a custom domain, set `SEO_SITE_URL` to its HTTPS origin.

**Search Console (optional):** set `GOOGLE_SITE_VERIFICATION` to your HTML-tag token, redeploy, and submit `/sitemap.xml`.

`vercel.json` is also included if you prefer to deploy on Vercel.

## Contributing

Issues and pull requests are welcome.

- **Bug reports:** include your game edition, browser, and steps to reproduce.
- **Pull requests:** keep changes focused, run the checks above, and include a minimal test case where possible.
- **Privacy:** don't attach personal saves or game files to issues or PRs.

## Credits

- [libsavegame](https://github.com/gtasa-savegame-editor/libsavegame) and [GTA:SA Savegame Editor](https://github.com/gtasa-savegame-editor/gtasa-savegame-editor): save format research and wardrobe metadata.
- [Sanny Builder data](https://github.com/sannybuilder/data), [Plugin-SDK](https://github.com/DK22Pac/plugin-sdk), and [gta-reversed](https://github.com/gta-reversed/gta-reversed): game data references.
- [Three.js](https://threejs.org/): 3D rendering. Upstream notices are kept in `public/editor.html`.
- [SA Radio Generator](https://github.com/TheLuciano354/gta-sa-radio-generator): reference for the PC radio lookup format.

## License

The license for this project's original source code has not been chosen yet.

*Grand Theft Auto* and *San Andreas* are trademarks of Take-Two Interactive Software. All game assets, artwork, and music belong to their respective owners and are not covered by any license for this project's code.
