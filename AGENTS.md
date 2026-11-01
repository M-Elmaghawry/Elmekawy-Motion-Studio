# Repository instructions

## GitHub uploads

The owner explicitly requests complete uploads of this repository, including all local project data, assets, generated builds, dependencies, caches, verification outputs and other workspace files. This preference applies to future upload requests too.

- Keep the root `.gitignore` free of exclusion rules. Do not introduce new file exclusions unless the owner explicitly changes this preference.
- Use `npm.cmd run github:sync -- "Commit message"` for complete uploads. Its script stages all additions, modifications and deletions with `git add --all --force`, so nested or global ignore files cannot silently omit content.
- Use Git LFS for files at least 50 MiB; include the resulting `.gitattributes` updates. Do not omit a large file just because ordinary Git cannot upload it.
- Upload to the current branch. Do not switch branches, merge into `main`, rewrite published history or force-push unless requested.
- Git's own metadata directory remains managed by Git; it is not workspace content to add to the repository.

## Existing compositions and data

Preserve frozen legacy composition versions, historical originals, archives and saved project revisions. Add new versions for rendering behavior changes; do not rewrite originals or delete data to prepare an upload.
