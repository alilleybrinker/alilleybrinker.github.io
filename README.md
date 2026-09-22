# alilleybrinker.com

## Unlisted posts

Set `unlisted: true` in an article's front matter to keep its direct URL
available while excluding it from the home page, topic pages and feeds, and
topic post counts.

## Writing locally

`npm run write` starts a local writing UI at <http://localhost:4444> alongside
the Astro dev server, and opens it in a browser.

The editor is a plain Markdown pane on the left and a live preview of the real
page on the right. Saving writes `content/blog/*.md` directly, so the dev server
picks the change up and the preview reloads itself — there is no separate draft
store, and nothing about a post depends on having been written here.

Options (pass after `--`, e.g. `npm run write -- --port 5000`):

| Option | Effect |
| --- | --- |
| `--port <n>` | Port for the writing UI (default 4444, or `WRITER_PORT`). |
| `--dev-port <n>` | Port for the dev server (default 4321). An already-running dev server on that port is reused and left running on exit. |
| `--dev-url <url>` | Preview a dev server started elsewhere instead of starting one. |
| `--no-dev` | Do not start or expect a dev server; the preview pane stays empty. |
| `--no-open` | Do not open a browser. |

What it does beyond editing text:

- **Front matter as a form**, matching `src/content.config.ts`: title,
  description, topics and type, unlisted, table of contents, and the cross-post
  fields. Only the keys you change are rewritten, so untouched lines keep their
  exact formatting. Front matter this editor cannot round-trip safely (block
  scalars, anchors) drops the file into raw text editing rather than rewriting
  it.
- **Containers**, inserted with the right markup and a slugified
  `aria-labelledby`: the `info-callout` aside, a quotation figure with a
  citation, and an image figure. They are defined in
  `scripts/writer/containers.json` — add an entry there to teach the editor a
  new one. Templates take `{{field}}` placeholders with `|html`, `|slug`,
  `|paragraphs`, `|quoted`, `|blockquote` and `|indent` filters, and `{{cursor}}`
  marks where the caret lands.
- **Preview targets**: the pane follows the post by default, and the selector
  in its bar also shows the blog index, the home page, each of the post's topic
  pages, the generated social card, and the Atom feed — so a draft can be
  checked where it actually appears. A target the dev server will not serve
  (an unlisted post has no topic page) says so instead of hanging.
- **Checks** against the collection schema and house conventions: missing
  description, a slug that would collide with another post, a topic spelled
  differently than everywhere else, a level-1 heading in the body, a table of
  contents with no headings to list.
- **Renaming**: changing the date or slug renames the file on save, and
  **Delete** removes it after a confirmation naming the file. Deletes are real
  `rm`s — Git is the undo.
- **Rewrap** (⌘⇧F) reflows the paragraph or selection to 80 columns, the width
  the posts are written to.
- Edits made outside the UI are picked up automatically, and if the same post
  changed on disk while you were editing it, saving stops and offers the choice.

Other shortcuts: ⌘S saves, ⌘B/⌘I/⌘K wrap the selection, ⌘⇧K inserts an info
callout. The server binds to localhost only and is not meant to be exposed.

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
