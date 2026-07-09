# OG Card Fonts

Vendored TTF files for `app/api/og/route.tsx` (satori / `next/og`).

Satori requires raw font data (TTF/OTF) and cannot resolve CSS variables or
load web fonts at render time, so these files are committed into the repo.

## Files

| File | Family | Weight | Source |
|---|---|---|---|
| `PlusJakartaSans-Bold.ttf` | Plus Jakarta Sans | 700 Bold | fonts.gstatic.com (OFL) |
| `PlusJakartaSans-ExtraBold.ttf` | Plus Jakarta Sans | 800 ExtraBold | fonts.gstatic.com (OFL) |
| `SpaceMono-Regular.ttf` | Space Mono | 400 Regular | google/fonts GitHub (OFL) |
| `SpaceMono-Bold.ttf` | Space Mono | 700 Bold | google/fonts GitHub (OFL) |
| `PlusJakartaSans-OFL.txt` | Plus Jakarta Sans license | — | google/fonts GitHub |
| `SpaceMono-OFL.txt` | Space Mono license | — | google/fonts GitHub |

## License

Both families are licensed under the SIL Open Font License 1.1.
Full text in `PlusJakartaSans-OFL.txt` and `SpaceMono-OFL.txt`.

Plus Jakarta Sans is designed by Tokotype.
Space Mono is designed by Colophon Foundry for Google Design.

## Why static instances instead of the variable font

Plus Jakarta Sans is only published as a variable font (`PlusJakartaSans[wght].ttf`)
in the google/fonts repository. Satori does not apply variable-font axis values —
it renders the default instance regardless of the registered weight. Static 700/800
instances were fetched from the Google Fonts CDN (fonts.gstatic.com) using a
truetype-requesting user agent. These are the same files served by Google Fonts for
the font weights used by the site.
