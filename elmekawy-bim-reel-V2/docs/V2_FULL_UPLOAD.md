# Full V2 repository snapshot — 2026-10-31

The owner explicitly requested all V2 files, including dependencies and generated
outputs. This supersedes the earlier upload policy that excluded those folders.
V1 source, dependencies and output remain unchanged.

- `.gitignore` contains no exclusion patterns.
- `node_modules/` is included, with installed Windows binaries and the local
  Remotion Chrome Headless Shell runtime.
- `build/` is included, with the generated bundle, source maps and copied assets.
- `out/` is included, with the MP4, review images, render checks and FFprobe JSON.
- Source, public assets, fonts/licenses, instructions and documentation stay included.
- `.gitattributes` preserves installed/generated file bytes without text conversion.

Initial inventory before this upload preparation: 19,639 files / 702,597,731 bytes;
no symlinks or credential-file candidates. The full text credential-pattern scan
matched only private-key syntax examples in the dependency's `dotenv` README
translations, not personal credentials. Added documentation and verification tooling increase
the final count. The verification script checks current filesystem/index coverage.

## Large file handling

One file exceeds GitHub's regular Git limit of 100 MiB:

`node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe`

Actual size: 221,143,040 bytes. It is tracked through Git LFS. Its full bytes are
uploaded to GitHub LFS; Git stores a pointer at the original path. No paid plan or
billing setting is enabled by this change. All other files use regular Git.

Reference: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github

## Getting the complete copy

With Git LFS installed:

```console
git clone https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio.git
cd Elmekawy-Motion-Studio/elmekawy-bim-reel-V2
git lfs pull
node scripts/verify-full-upload.mjs
```

Use Git clone plus LFS to retrieve the browser binary. GitHub's generated ZIP
may contain an LFS pointer depending on repository archive settings.
The included installed dependencies are the Windows snapshot from this machine;
other platforms can reinstall using the existing lockfile.

Earlier QA/changelog statements about generated folders being excluded describe
the previous upload. This document records the owner's later full-upload request.
