# alilleybrinker.com

## Standard.site publishing

This site publishes the `blog` collection to Standard.site while keeping the
Markdown files as the source of truth.

1. Create an AT Protocol app password for the account named by `STANDARD_HANDLE`.
2. Copy `.env.example` to a private environment file, or configure those values
   as deployment secrets.
3. Run `npm run standard:publish` before `npm run build`.

The publisher upserts one publication record and each blog post using stable
record keys. Each post uses the `at.markpub.markdown` content type, with the
source Markdown as its body. It also writes the generated AT-URIs to
`src/data/standard-site.json` and the publication verification response to
`public/.well-known/site.standard.publication`. Commit those generated files
when publishing locally; in CI, run publishing before the static build.

To migrate existing PDS records from `textContent` to typed Markdown, run
`npm run standard:migrate`. It re-upserts every blog post at its existing stable
record key, replacing the old record body with `at.markpub.markdown` content.

The Astro layout reads this metadata to emit Standard.site publication and
document verification links. Do not commit `.env` or app passwords.
