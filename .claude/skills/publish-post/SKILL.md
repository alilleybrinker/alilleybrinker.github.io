---
name: publish-post
description: Turn a Markdown draft Andrew sends (often from his phone) into a finished blog post and a draft PR, with its front matter filled in and the site checked. Use when he shares a draft and asks to publish, post, or "make a PR" for it.
---

# Publishing a post from a draft

Andrew drafts a post, often on his phone, and sends it. This turns it into a
post in `content/blog/`, checks it, and opens a draft PR he can review and
merge from his phone. Merging deploys it, and the deploy also publishes it to
Standard.site.

## The rule that matters most

**The site's words are Andrew's** (see the AI policy on `/about/`). Never
write, rewrite, shorten or "improve" anything a reader will see:

- **The description** (the one line under the title, in lists, feeds, search
  results and share cards) must come from him. If the draft doesn't give one,
  stop and ask him for it before creating the post. Never write one, and never
  lift a sentence from the post to stand in for one.
- **The body** goes in exactly as he wrote it. The build curls quotes and
  closes up em dashes, so straight quotes and ` -- ` are fine as they are. If
  something looks like a typo or broken Markdown, say so in the PR and let him
  decide; don't fix it.
- **Image alt text** is his too: ask for it if an image comes without one.

## 1. Read the draft

He may send front matter, or just Markdown. Take from it:

- **Title**: the first `# ` heading, or a `title:` line. If there's neither,
  ask.
- **Description**: a `description:` line, a line starting `Description:`, or
  an opening blockquote he marks as the description. If none, ask (above).
- **Topics**, if he names them.
- **Body**: everything else, with the title heading and description line
  removed. Sections start at `## `.

Anything else he says about the post (a date, "unlisted", "no table of
contents") wins over the defaults below.

## 2. Fill in the rest

- **Date**: today in California (`TZ=America/Los_Angeles date +%F`) unless he
  gives one. It's the post's publish date and the start of its file name.
- **Slug**: made from the title by the writer's `slugify`; it must not match
  an existing post's. Keep it short if the title is long, and mention it.
- **Topics**: pick from the existing ones (`collectTopics()` in
  `scripts/writer/lib/posts.mjs`, or the topics page), usually one to three.
  Add a new topic only if he names it; a new one gets its own page and feed.
- **Table of contents**: on (`toc: true`) when the body has four or more `##`
  sections, as on the long posts; off otherwise.
- **Listed**: posts are listed unless he says unlisted.
- **Images**: put them in `public/image/blog/<slug>/` and link them from the
  post with his alt text.

## 3. Create it

Write the body to a file and a spec beside it, then:

```sh
node scripts/writer/new-post.mjs spec.json
```

with `spec.json` like
`{"title": "…", "date": "2026-10-30", "description": "…", "topics": ["Rust"], "toc": false, "bodyFile": "body.md"}`.
It creates `content/blog/<date>-<slug>.md` with front matter in the house
style and prints the writing UI's checklist. Any `error` stops here; read
each `warn` and either fix the metadata or mention it in the PR.

## 4. Check it

On a branch named `post/<slug>`:

- `npm run build` must pass. Without network access, the reading page's
  Bluesky fetch fails: stub `getReadingItems` locally to return `[]` and put
  it back before committing.
- `npx playwright test` must pass.
- Look at the built post: `dist/blog/<slug>/index.html` exists, its title and
  description are right, and `dist/social/<slug>.png` (the share image) was
  made. Take a phone-width screenshot of the post and send it to him.

## 5. Open the PR

Commit only the new post (and any images), then open a **draft** PR titled
with the post's title. In the body, for reading on a phone:

- The post's URL once live: `https://www.alilleybrinker.com/blog/<slug>/`.
- Date, topics (saying which are new), table of contents on or off, and the
  estimated reading time.
- His description, quoted, so he can see it is what he gave.
- Anything he should look at: a possible typo, broken Markdown, a link that
  looked wrong. Say what and where; don't change it.

Merge only when he says "merge", once CI is green. The merge deploys the post
and publishes it to Standard.site.
