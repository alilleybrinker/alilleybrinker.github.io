// Front end for the local writing UI. Talks to the small API in server.mjs,
// which reads and writes the Markdown files in content/blog/.

const CURSOR = '\u0000';
const WRAP_COLUMNS = 80;
const AUTOSAVE_DELAY = 1200;

const state = {
  config: null,
  posts: [],
  post: null,
  topics: [],
  types: [],
  dirty: false,
  saving: false,
  raw: false,
  problems: [],
};

const el = (id) => document.getElementById(id);
const body = el('body');
const form = el('frontmatter-form');

/* API ------------------------------------------------------------------- */

async function api(path, { method = 'GET', payload } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: payload ? { 'content-type': 'application/json', 'x-writer-app': '1' } : { 'x-writer-app': '1' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(data.error ?? `${method} ${path} failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

/* Banners --------------------------------------------------------------- */

function showBanner(key, message, actions = [], tone = 'warn') {
  clearBanner(key);
  const banner = document.createElement('div');
  banner.className = 'banner';
  banner.dataset.key = key;
  banner.dataset.tone = tone;
  const text = document.createElement('p');
  text.textContent = message;
  banner.append(text);
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      clearBanner(key);
      action.run();
    });
    banner.append(button);
  }
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'icon-button';
  dismiss.title = 'Dismiss';
  dismiss.textContent = '✕';
  dismiss.addEventListener('click', () => clearBanner(key));
  banner.append(dismiss);
  el('banners').append(banner);
  el('banners').hidden = false;
}

function clearBanner(key) {
  el('banners').querySelector(`[data-key="${key}"]`)?.remove();
  el('banners').hidden = el('banners').children.length === 0;
}

/* Post list ------------------------------------------------------------- */

async function loadPosts() {
  const { posts } = await api('/posts');
  state.posts = posts;
  renderPostList();
}

function renderPostList() {
  const query = el('search').value.trim().toLowerCase();
  const list = el('post-list');
  list.replaceChildren();
  const matches = state.posts.filter((post) => {
    if (!query) return true;
    return [post.title, post.id, post.description, ...post.topics].join(' ').toLowerCase().includes(query);
  });
  for (const post of matches) {
    const item = document.createElement('li');
    if (state.post?.id === post.id) item.setAttribute('aria-current', 'true');
    const button = document.createElement('button');
    button.type = 'button';
    const title = document.createElement('span');
    title.className = 'post-title';
    title.textContent = post.title;
    const sub = document.createElement('span');
    sub.className = 'post-sub';
    sub.textContent = `${post.date} · ${post.words} words`;
    if (post.unlisted) sub.append(tag('unlisted'));
    if (post.externalUrl) sub.append(tag('external'));
    if (!post.readable) sub.append(tag('unparsed'));
    button.append(title, sub);
    button.addEventListener('click', () => openPost(post.id));
    item.append(button);
    list.append(item);
  }
  el('post-count').textContent = `${matches.length} of ${state.posts.length} post${state.posts.length === 1 ? '' : 's'}`;
}

function tag(text) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = text;
  return span;
}

/* Opening and rendering a post ------------------------------------------ */

async function openPost(id, { keepBanners = false, raw } = {}) {
  if (state.dirty && !confirmDiscard()) return;
  if (!keepBanners) {
    clearBanner('conflict');
    clearBanner('external-change');
  }
  const { post, problems } = await api(`/posts/${encodeURIComponent(id)}`);
  state.post = post;
  state.problems = problems;
  // Front matter this editor cannot round-trip forces raw editing; otherwise the
  // caller decides, and a freshly opened post starts in the structured view.
  state.raw = !post.structured || raw === true;
  el('raw-mode').checked = state.raw;
  el('raw-mode').disabled = !post.structured;
  fillForm(post);
  body.value = state.raw ? post.raw : post.body;
  el('empty-state').hidden = true;
  el('workspace').hidden = false;
  setDirty(false);
  setSaveState('Opened');
  renderPostList();
  renderProblems();
  updateCounts();
  updatePreview();
  location.hash = post.id;
  document.title = `${post.data.title ?? post.id} · Writer`;
}

function fillForm(post) {
  const data = post.data ?? {};
  form.elements.title.value = data.title ?? '';
  form.elements.description.value = data.description ?? '';
  form.elements.date.value = post.date;
  form.elements.slug.value = post.slug;
  form.elements.externalUrl.value = data.externalUrl ?? '';
  form.elements.publication.value = data.publication ?? '';
  form.elements.publicationTitle.value = data.publicationTitle ?? '';
  form.elements.readingTime.value = data.readingTime ?? '';
  form.elements.unlisted.checked = data.unlisted === true;
  form.elements.toc.checked = data.extra?.toc === true;
  state.topics = [...(data.taxonomies?.topics ?? [])];
  state.types = [...(data.taxonomies?.type ?? [])];
  renderChips();
  el('frontmatter').hidden = state.raw;
  el('frontmatter').open = localStorage.getItem('writer.frontmatter') === 'open';
  updateSlugNote();
  updateFrontmatterSummary();
}

function renderChips() {
  renderChipGroup(el('topics'), state.topics, (value) => {
    state.topics = state.topics.filter((topic) => topic !== value);
    renderChips();
    markDirty();
  });
  renderChipGroup(el('types'), state.types, (value) => {
    state.types = state.types.filter((type) => type !== value);
    renderChips();
    markDirty();
  });
  updateFrontmatterSummary();
}

function renderChipGroup(container, values, remove) {
  container.replaceChildren();
  for (const value of values) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.append(document.createTextNode(value));
    const button = document.createElement('button');
    button.type = 'button';
    button.title = `Remove ${value}`;
    button.textContent = '✕';
    button.addEventListener('click', () => remove(value));
    chip.append(button);
    container.append(chip);
  }
}

function updateFrontmatterSummary() {
  if (state.raw) {
    el('frontmatter-summary').textContent = '';
    return;
  }
  const parts = [];
  if (form.elements.unlisted.checked) parts.push('unlisted');
  if (form.elements.externalUrl.value.trim()) parts.push('cross-post');
  if (form.elements.toc.checked) parts.push('toc');
  parts.push(state.topics.length > 0 ? state.topics.join(', ') : 'no topics');
  el('frontmatter-summary').textContent = `— ${parts.join(' · ')}`;
}

function updateSlugNote() {
  const slug = form.elements.slug.value.trim();
  const changed = state.post && slug !== state.post.slug;
  el('slug-note').textContent = changed ? '— saving renames the file' : `— /blog/${slug}/`;
}

/* Gathering what to save ------------------------------------------------ */

function frontmatterFromForm() {
  // Start from the loaded front matter so keys this form does not manage
  // (anything outside the collection schema) survive a save.
  const data = { ...(state.post?.data ?? {}) };
  const text = (name) => form.elements[name].value.trim();
  data.title = text('title');
  setOrDelete(data, 'description', text('description'));
  setOrDelete(data, 'externalUrl', text('externalUrl'));
  setOrDelete(data, 'publication', text('publication'));
  setOrDelete(data, 'publicationTitle', text('publicationTitle'));
  const readingTime = Number(text('readingTime'));
  if (Number.isInteger(readingTime) && readingTime > 0) data.readingTime = readingTime;
  else delete data.readingTime;
  if (form.elements.unlisted.checked) data.unlisted = true;
  else delete data.unlisted;
  data.taxonomies = { type: [...state.types], topics: [...state.topics] };
  if (form.elements.toc.checked) data.extra = { ...(data.extra ?? {}), toc: true };
  else delete data.extra;
  return data;
}

function setOrDelete(data, key, value) {
  if (value) data[key] = value;
  else delete data[key];
}

function savePayload({ force = false } = {}) {
  const payload = force ? {} : { expectedMtimeMs: state.post.mtimeMs };
  if (state.raw) return { ...payload, raw: body.value };
  return {
    ...payload,
    data: frontmatterFromForm(),
    body: body.value,
    date: form.elements.date.value,
    slug: form.elements.slug.value.trim() || undefined,
  };
}

/* Saving ---------------------------------------------------------------- */

let autosaveTimer = null;

function setSaveState(text, level = '') {
  el('save-state').textContent = text;
  el('save-state').dataset.state = level;
}

function setDirty(dirty) {
  state.dirty = dirty;
  el('save').disabled = !dirty || state.saving;
  if (dirty) setSaveState('Unsaved changes', 'dirty');
}

function markDirty() {
  if (!state.post) return;
  setDirty(true);
  scheduleValidation();
  updateCounts();
  if (el('autosave').checked) {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => save().catch(() => {}), AUTOSAVE_DELAY);
  }
}

async function save({ force = false } = {}) {
  if (!state.post || state.saving) return;
  if (!state.raw && !form.elements.title.value.trim()) {
    setSaveState('Title required', 'error');
    return;
  }
  clearTimeout(autosaveTimer);
  state.saving = true;
  el('save').disabled = true;
  setSaveState('Saving…');
  const previousId = state.post.id;
  try {
    const { post, problems } = await api(`/posts/${encodeURIComponent(previousId)}`, { method: 'PUT', payload: savePayload({ force }) });
    state.post = post;
    state.problems = problems;
    if (state.raw) body.value = post.raw;
    if (post.id !== previousId) {
      fillForm(post);
      location.hash = post.id;
    }
    setDirty(false);
    setSaveState(`Saved ${new Date().toLocaleTimeString()}`, 'saved');
    clearBanner('conflict');
    await loadPosts();
    renderProblems();
    updatePreview();
  } catch (error) {
    setSaveState('Not saved', 'error');
    if (error.status === 409) {
      showBanner('conflict', error.message, [
        { label: 'Reload from disk', run: () => { setDirty(false); openPost(previousId); } },
        { label: 'Overwrite', run: () => save({ force: true }) },
      ], 'error');
    } else {
      showBanner('save-error', error.message, [], 'error');
    }
    throw error;
  } finally {
    state.saving = false;
    el('save').disabled = !state.dirty;
  }
}

/* Validation and counts -------------------------------------------------- */

let validationTimer = null;

function scheduleValidation() {
  clearTimeout(validationTimer);
  validationTimer = setTimeout(async () => {
    if (!state.post || state.raw) return;
    try {
      const { problems } = await api('/validate', { method: 'POST', payload: { id: state.post.id, data: frontmatterFromForm(), body: body.value } });
      state.problems = problems;
      renderProblems();
    } catch {
      /* validation is advisory; ignore transient failures */
    }
  }, 400);
}

function renderProblems() {
  const list = el('problems');
  list.replaceChildren();
  const problems = state.problems.length > 0 ? state.problems : [{ level: 'ok', message: 'No problems found.' }];
  for (const problem of problems) {
    const item = document.createElement('li');
    item.dataset.level = problem.level;
    item.append(document.createTextNode(problem.message));
    list.append(item);
  }
  const errors = state.problems.filter((problem) => problem.level === 'error').length;
  const warnings = state.problems.filter((problem) => problem.level === 'warn').length;
  const summary = errors > 0 ? `Checks: ${errors} to fix` : warnings > 0 ? `Checks: ${warnings} to look at` : 'Checks: clear';
  el('toggle-problems').textContent = summary;
}

function updateCounts() {
  const text = state.raw ? body.value.replace(/^---[\s\S]*?\n---\n/, '') : body.value;
  const words = text.match(/\S+/g)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  el('counts').textContent = `${words} word${words === 1 ? '' : 's'} · ${minutes} min read · ${text.length} characters`;
  el('current-title').textContent = state.raw ? state.post.id : form.elements.title.value || '(untitled)';
  el('current-meta').textContent = state.post ? `${state.post.id}${state.post.data?.externalUrl ? ' · cross-post' : ''}` : '';
  updateCursorPosition();
}

function updateCursorPosition() {
  const upTo = body.value.slice(0, body.selectionStart);
  const lines = upTo.split('\n');
  el('cursor-position').textContent = `Ln ${lines.length}, Col ${lines.at(-1).length + 1}`;
}

/* Preview --------------------------------------------------------------- */

function updatePreview() {
  const frame = el('preview-iframe');
  const empty = el('preview-empty');
  const devUrl = state.config.devUrl;
  state.previewToken = null;
  if (!devUrl) {
    frame.hidden = true;
    empty.hidden = false;
    empty.textContent = 'No dev server. Restart with "npm run write" (or pass --dev-url) to see the live preview.';
    el('preview-url').textContent = '';
    return;
  }
  if (!state.post) return;
  if (state.post.data?.externalUrl) {
    frame.hidden = true;
    empty.hidden = false;
    empty.textContent = 'This post links out to another site, so it has no page of its own. The blog index shows it as a cross-post.';
    el('preview-url').textContent = state.post.data.externalUrl;
    el('preview-open').href = state.post.data.externalUrl;
    return;
  }
  const url = `${devUrl}${state.post.url}`;
  el('preview-url').textContent = state.post.url;
  el('preview-open').href = url;
  if (frame.dataset.url === url) return;
  showPreviewWhenReady(state.post.url, url);
}

// Waits for the dev server to actually serve the page before pointing the iframe
// at it: a just-created post 404s for a moment, and a 404 in the frame would sit
// there until someone reloaded it by hand.
async function showPreviewWhenReady(path, url) {
  const frame = el('preview-iframe');
  const empty = el('preview-empty');
  const token = Symbol('preview');
  state.previewToken = token;
  frame.hidden = true;
  empty.hidden = false;
  empty.textContent = 'Waiting for the dev server to build this page…';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { ready } = await api(`/preview-status?path=${encodeURIComponent(path)}`).catch(() => ({ ready: false }));
    if (state.previewToken !== token) return;
    if (ready) {
      frame.dataset.url = url;
      frame.src = url;
      frame.hidden = false;
      empty.hidden = true;
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  empty.textContent = 'The dev server is not serving this page yet. Use ⟳ to try again.';
}

function reloadPreview() {
  const frame = el('preview-iframe');
  if (!state.post || !state.config.devUrl || state.post.data?.externalUrl) return;
  frame.dataset.url = '';
  frame.src = 'about:blank';
  showPreviewWhenReady(state.post.url, `${state.config.devUrl}${state.post.url}`);
}

/* Text insertion -------------------------------------------------------- */

function insertText(text, { block = false } = {}) {
  const start = body.selectionStart;
  const end = body.selectionEnd;
  let prefix = body.value.slice(0, start);
  let suffix = body.value.slice(end);
  let payload = text;
  if (block) {
    if (prefix !== '' && !prefix.endsWith('\n\n')) prefix += prefix.endsWith('\n') ? '\n' : '\n\n';
    if (suffix !== '' && !suffix.startsWith('\n\n')) suffix = suffix.startsWith('\n') ? `\n${suffix}` : `\n\n${suffix}`;
  }
  const cursorAt = payload.indexOf(CURSOR);
  payload = payload.replace(CURSOR, '');
  body.value = prefix + payload + suffix;
  const caret = prefix.length + (cursorAt === -1 ? payload.length : cursorAt);
  body.setSelectionRange(caret, caret);
  body.focus();
  markDirty();
}

function appendAtEnd(text) {
  const trimmed = body.value.replace(/\s+$/, '');
  const lastLine = trimmed.split('\n').at(-1) ?? '';
  const separator = /^\[[^\]]+\]:\s/.test(lastLine) ? '\n' : '\n\n';
  body.value = `${trimmed}${separator}${text}\n`;
}

function wrapSelection(before, after, placeholder) {
  const start = body.selectionStart;
  const end = body.selectionEnd;
  const selected = body.value.slice(start, end) || placeholder;
  body.value = body.value.slice(0, start) + before + selected + after + body.value.slice(end);
  const caretStart = start + before.length;
  body.setSelectionRange(caretStart, caretStart + selected.length);
  body.focus();
  markDirty();
}

function prefixLines(prefix) {
  const start = body.selectionStart;
  const end = body.selectionEnd;
  const lineStart = body.value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = body.value.indexOf('\n', end) === -1 ? body.value.length : body.value.indexOf('\n', end);
  const block = body.value.slice(lineStart, lineEnd);
  const isOrdered = /^\d+\. /.test(prefix);
  const updated = block
    .split('\n')
    .map((line, index) => {
      const bare = line.replace(/^(#{1,6} |[-*] |\d+\. |> )/, '');
      return `${isOrdered ? `${index + 1}. ` : prefix}${bare}`;
    })
    .join('\n');
  body.value = body.value.slice(0, lineStart) + updated + body.value.slice(lineEnd);
  body.setSelectionRange(lineStart + updated.length, lineStart + updated.length);
  body.focus();
  markDirty();
}

// Rewraps the selection, or the paragraph around the caret, to 80 columns —
// the width the posts in this repo are written to.
function rewrap() {
  const value = body.value;
  let start = body.selectionStart;
  let end = body.selectionEnd;
  if (start === end) {
    const before = value.lastIndexOf('\n\n', Math.max(0, start - 1));
    start = before === -1 ? 0 : before + 2;
    const after = value.indexOf('\n\n', end);
    end = after === -1 ? value.length : after;
  }
  const block = value.slice(start, end);
  if (block.trim() === '') return;
  const rewrapped = block
    .split(/\n{2,}/)
    .map((paragraph) => {
      const indentMatch = paragraph.match(/^(\s*(?:[-*>]\s+|\d+\.\s+)?)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const hanging = ' '.repeat(indent.length);
      const words = paragraph.trim().replace(/^(?:[-*>]\s+|\d+\.\s+)/, '').split(/\s+/);
      const lines = [];
      let current = indent;
      let isFirst = true;
      for (const word of words) {
        const candidate = isFirst ? `${current}${word}` : `${current} ${word}`;
        if (!isFirst && candidate.length > WRAP_COLUMNS) {
          lines.push(current);
          current = `${hanging}${word}`;
        } else {
          current = candidate;
        }
        isFirst = false;
      }
      lines.push(current);
      return lines.join('\n');
    })
    .join('\n\n');
  body.value = value.slice(0, start) + rewrapped + value.slice(end);
  body.setSelectionRange(start, start + rewrapped.length);
  body.focus();
  markDirty();
}

/* Containers and snippets ------------------------------------------------ */

const FILTERS = {
  html: (value) => escapeHtml(value),
  slug: (value) => slugify(value),
  paragraphs: (value) => (value.trim() === '' ? '  <p></p>' : value.trim().split(/\n{2,}/).map((part) => `  <p>${escapeHtml(part.trim())}</p>`).join('\n')),
  quoted: (value) => `&ldquo;${escapeHtml(value.trim())}&rdquo;`,
  blockquote: (value) => value.trim().split('\n').map((line) => `> ${line}`.trimEnd()).join('\n'),
  indent: (value) => value.split('\n').map((line) => `  ${line}`.trimEnd()).join('\n'),
};

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'"“”]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PLACEHOLDER = /\{\{(\w+)(?:\|([\w-]+))?\}\}/g;

function fillPlaceholders(text, values) {
  return text.replace(PLACEHOLDER, (match, name, filter) => {
    if (name === 'cursor') return CURSOR;
    const value = values[name] ?? '';
    if (!filter) return value;
    const apply = FILTERS[filter];
    return apply ? apply(value) : value;
  });
}

// Renders a template, dropping lines that held nothing but placeholders which
// came out empty — an optional field left blank should not leave a blank line.
function renderTemplate(template, values) {
  return template
    .split('\n')
    .map((line) => {
      const rendered = fillPlaceholders(line, values);
      const isOnlyPlaceholders = line.trim() !== '' && line.replace(PLACEHOLDER, '').trim() === '';
      return isOnlyPlaceholders && rendered.replace(CURSOR, '').trim() === '' ? null : rendered;
    })
    .filter((line) => line !== null)
    .join('\n');
}

function renderInsertControls() {
  const buttons = el('container-buttons');
  buttons.replaceChildren();
  for (const container of state.config.containers ?? []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool';
    button.textContent = container.label;
    button.title = container.hint ?? '';
    if (container.shortcut) button.title += ` (⌘⇧${container.shortcut})`;
    button.addEventListener('click', () => openInsertDialog(container));
    buttons.append(button);
  }

  const menu = el('insert-menu');
  menu.replaceChildren();
  for (const snippet of state.config.snippets ?? []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.append(document.createTextNode(snippet.label));
    if (snippet.hint) {
      const hint = document.createElement('small');
      hint.textContent = snippet.hint;
      button.append(hint);
    }
    button.addEventListener('click', () => {
      toggleInsertMenu(false);
      openInsertDialog(snippet);
    });
    menu.append(button);
  }
}

function toggleInsertMenu(show) {
  const menu = el('insert-menu');
  const open = show ?? menu.hidden;
  menu.hidden = !open;
  el('more-inserts').setAttribute('aria-expanded', String(open));
}

let pendingInsert = null;

function openInsertDialog(definition) {
  const fields = definition.fields ?? [];
  const selection = body.value.slice(body.selectionStart, body.selectionEnd);
  if (fields.length === 0) {
    applyInsert(definition, {});
    return;
  }
  pendingInsert = definition;
  el('insert-title').textContent = definition.label;
  el('insert-hint').textContent = definition.hint ?? '';
  const container = el('insert-fields');
  container.replaceChildren();
  for (const field of fields) {
    const label = document.createElement('label');
    label.className = 'field field-wide';
    const caption = document.createElement('span');
    caption.textContent = field.label ?? field.name;
    const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (field.type === 'textarea') input.rows = 5;
    else input.type = 'text';
    input.name = field.name;
    input.placeholder = field.placeholder ?? '';
    if (field.required) input.required = true;
    input.value = (field.useSelection && selection) || field.default || '';
    label.append(caption, input);
    container.append(label);
  }
  el('insert-dialog').showModal();
  container.querySelector('input, textarea')?.focus();
}

function applyInsert(definition, values) {
  const resolved = { ...values };
  for (const field of definition.fields ?? []) {
    if (resolved[field.name]) continue;
    const fallback = field.fallback;
    if (!fallback) continue;
    const source = resolved[fallback.from] ?? '';
    resolved[field.name] = fallback.filter ? (FILTERS[fallback.filter]?.(source) ?? source) : source;
  }
  const text = renderTemplate(definition.template, resolved);
  if (definition.appendTemplate) {
    insertText(text, { block: !definition.inline });
    const definitionText = fillPlaceholders(definition.appendTemplate, resolved).replace(CURSOR, '');
    const caret = body.selectionStart;
    appendAtEnd(definitionText);
    body.setSelectionRange(caret, caret);
  } else {
    insertText(text, { block: !definition.inline });
  }
}

/* New post -------------------------------------------------------------- */

function openNewPostDialog() {
  const dialog = el('new-post-dialog');
  const newForm = el('new-post-form');
  newForm.reset();
  newForm.elements.date.value = state.config.today;
  newForm.elements.unlisted.checked = true;
  newForm.dataset.slugEdited = 'false';
  el('new-post-error').hidden = true;
  updateNewPostPath();
  dialog.showModal();
}

function updateNewPostPath() {
  const newForm = el('new-post-form');
  const slug = newForm.dataset.slugEdited === 'true' ? newForm.elements.slug.value : slugify(newForm.elements.title.value);
  const date = newForm.elements.date.value || state.config.today;
  el('new-post-path').textContent = slug ? `Creates ${state.config.contentDir}/${date}-${slug}.md` : 'The file name comes from the date and the title.';
}

async function createPost(event) {
  event.preventDefault();
  const newForm = el('new-post-form');
  const payload = {
    title: newForm.elements.title.value,
    date: newForm.elements.date.value,
    slug: newForm.dataset.slugEdited === 'true' ? newForm.elements.slug.value : '',
    description: newForm.elements.description.value,
    unlisted: newForm.elements.unlisted.checked,
  };
  try {
    const { post } = await api('/posts', { method: 'POST', payload });
    el('new-post-dialog').close();
    await loadPosts();
    state.dirty = false;
    await openPost(post.id);
    body.focus();
  } catch (error) {
    const message = el('new-post-error');
    message.textContent = error.message;
    message.hidden = false;
  }
}

/* Live reload of external edits ----------------------------------------- */

function watchServer() {
  const events = new EventSource('/api/events');
  events.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'file-changed') handleFileChange(data);
    else if (data.type === 'post-created') loadPosts();
  });
  events.addEventListener('error', () => setSaveState('Writer offline', 'error'));
}

let listRefreshTimer = null;

function handleFileChange({ id, exists }) {
  clearTimeout(listRefreshTimer);
  listRefreshTimer = setTimeout(() => loadPosts(), 250);
  if (!state.post || id !== state.post.id) return;
  if (!exists) {
    showBanner('external-change', `${id} was removed or renamed outside the writer.`, [], 'error');
    return;
  }
  if (state.saving) return;
  api(`/posts/${encodeURIComponent(id)}`)
    .then(({ post }) => {
      if (post.mtimeMs <= state.post.mtimeMs) return;
      if (!state.dirty) {
        state.dirty = false;
        openPost(id);
        setSaveState('Reloaded from disk');
        return;
      }
      showBanner('external-change', `${id} changed on disk while you were editing.`, [
        { label: 'Reload from disk', run: () => { setDirty(false); openPost(id); } },
        { label: 'Keep mine', run: () => { state.post.mtimeMs = post.mtimeMs; } },
      ]);
    })
    .catch(() => {});
}

/* Layout ---------------------------------------------------------------- */

function restoreLayout() {
  const library = localStorage.getItem('writer.libraryWidth');
  const preview = localStorage.getItem('writer.previewWidth');
  if (library) document.documentElement.style.setProperty('--library-width', library);
  if (preview) document.documentElement.style.setProperty('--preview-width', preview);
  if (localStorage.getItem('writer.library') === 'hidden') setPane('library', false);
  if (localStorage.getItem('writer.preview') === 'hidden') setPane('preview', false);
  if (localStorage.getItem('writer.autosave') === 'off') el('autosave').checked = false;
}

function setPane(name, visible) {
  el('layout').dataset[name] = visible ? 'visible' : 'hidden';
  el(`toggle-${name}`).setAttribute('aria-pressed', String(visible));
  localStorage.setItem(`writer.${name}`, visible ? 'visible' : 'hidden');
}

function wireGutters() {
  for (const gutter of document.querySelectorAll('.gutter')) {
    const which = gutter.dataset.resize;
    gutter.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      gutter.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const total = el('layout').clientWidth;
        if (which === 'library') {
          const width = Math.min(Math.max(moveEvent.clientX, 140), total - 400);
          document.documentElement.style.setProperty('--library-width', `${width}px`);
        } else {
          const width = Math.min(Math.max(total - moveEvent.clientX, 220), total - 420);
          document.documentElement.style.setProperty('--preview-width', `${width}px`);
        }
      };
      const up = () => {
        gutter.removeEventListener('pointermove', move);
        gutter.removeEventListener('pointerup', up);
        localStorage.setItem('writer.libraryWidth', getComputedStyle(document.documentElement).getPropertyValue('--library-width'));
        localStorage.setItem('writer.previewWidth', getComputedStyle(document.documentElement).getPropertyValue('--preview-width'));
      };
      gutter.addEventListener('pointermove', move);
      gutter.addEventListener('pointerup', up);
    });
    gutter.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 48 : 16;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const property = which === 'library' ? '--library-width' : '--preview-width';
      const current = Number.parseFloat(getComputedStyle(el(which)).width);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const delta = which === 'library' ? direction * step : -direction * step;
      document.documentElement.style.setProperty(property, `${Math.max(140, current + delta)}px`);
    });
  }
}

/* Events ---------------------------------------------------------------- */

function confirmDiscard() {
  return confirm('This post has unsaved changes. Discard them?');
}

function wireEvents() {
  el('search').addEventListener('input', renderPostList);
  el('new-post').addEventListener('click', openNewPostDialog);
  el('empty-state').querySelector('[data-action="new-post"]').addEventListener('click', openNewPostDialog);
  el('save').addEventListener('click', () => save().catch(() => {}));
  el('autosave').addEventListener('change', (event) => {
    localStorage.setItem('writer.autosave', event.target.checked ? 'on' : 'off');
    if (event.target.checked && state.dirty) markDirty();
  });
  el('toggle-library').addEventListener('click', () => setPane('library', el('layout').dataset.library === 'hidden'));
  el('toggle-preview').addEventListener('click', () => setPane('preview', el('layout').dataset.preview === 'hidden'));
  el('toggle-problems').addEventListener('click', (event) => {
    const list = el('problems');
    list.hidden = !list.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!list.hidden));
  });

  body.addEventListener('input', markDirty);
  body.addEventListener('keyup', updateCursorPosition);
  body.addEventListener('click', updateCursorPosition);
  form.addEventListener('input', (event) => {
    if (event.target.name === 'slug' || event.target.name === 'title') updateSlugNote();
    updateFrontmatterSummary();
    markDirty();
  });
  el('frontmatter').addEventListener('toggle', (event) => {
    localStorage.setItem('writer.frontmatter', event.target.open ? 'open' : 'closed');
  });

  el('topic-input').addEventListener('keydown', (event) => addChipOnEnter(event, state.topics));
  el('type-input').addEventListener('keydown', (event) => addChipOnEnter(event, state.types));

  el('raw-mode').addEventListener('change', async (event) => {
    const wantRaw = event.target.checked;
    if (state.dirty && !confirmDiscard()) {
      event.target.checked = state.raw;
      return;
    }
    setDirty(false);
    await openPost(state.post.id, { raw: wantRaw });
  });

  el('more-inserts').addEventListener('click', () => toggleInsertMenu());
  document.addEventListener('click', (event) => {
    if (!el('insert-menu').hidden && !event.target.closest('#insert-menu, #more-inserts')) toggleInsertMenu(false);
  });

  for (const button of document.querySelectorAll('[data-inline]')) {
    button.addEventListener('click', () => {
      const kind = button.dataset.inline;
      if (kind === 'bold') wrapSelection('**', '**', 'bold text');
      else if (kind === 'italic') wrapSelection('_', '_', 'emphasis');
      else if (kind === 'code') wrapSelection('`', '`', 'code');
      else if (kind === 'link') wrapSelection('[', '](https://)', 'link text');
    });
  }
  for (const button of document.querySelectorAll('[data-prefix]')) {
    button.addEventListener('click', () => prefixLines(button.dataset.prefix));
  }
  el('rewrap').addEventListener('click', rewrap);

  el('preview-reload').addEventListener('click', reloadPreview);
  el('preview-width').addEventListener('click', (event) => {
    const frame = el('preview-frame');
    const next = frame.dataset.width === 'phone' ? 'full' : 'phone';
    frame.dataset.width = next;
    event.currentTarget.textContent = next === 'phone' ? 'Phone' : 'Full';
  });

  const newForm = el('new-post-form');
  newForm.addEventListener('submit', createPost);
  newForm.elements.title.addEventListener('input', updateNewPostPath);
  newForm.elements.date.addEventListener('input', updateNewPostPath);
  newForm.elements.slug.addEventListener('input', () => {
    newForm.dataset.slugEdited = newForm.elements.slug.value.trim() === '' ? 'false' : 'true';
    updateNewPostPath();
  });

  el('insert-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(el('insert-form')).entries());
    el('insert-dialog').close();
    if (pendingInsert) applyInsert(pendingInsert, values);
    pendingInsert = null;
  });

  for (const button of document.querySelectorAll('[data-close]')) {
    button.addEventListener('click', (event) => event.currentTarget.closest('dialog').close());
  }

  document.addEventListener('keydown', (event) => {
    const meta = event.metaKey || event.ctrlKey;
    if (!meta) return;
    const key = event.key.toLowerCase();
    if (key === 's') {
      event.preventDefault();
      save().catch(() => {});
      return;
    }
    if (event.shiftKey && key === 'f') {
      event.preventDefault();
      rewrap();
      return;
    }
    if (document.activeElement !== body) return;
    if (key === 'b') {
      event.preventDefault();
      wrapSelection('**', '**', 'bold text');
    } else if (key === 'i') {
      event.preventDefault();
      wrapSelection('_', '_', 'emphasis');
    } else if (key === 'k') {
      event.preventDefault();
      wrapSelection('[', '](https://)', 'link text');
    } else if (event.shiftKey) {
      const container = (state.config.containers ?? []).find((entry) => entry.shortcut?.toLowerCase() === key);
      if (container) {
        event.preventDefault();
        openInsertDialog(container);
      }
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

function addChipOnEnter(event, collection) {
  if (event.key !== 'Enter' && event.key !== ',') return;
  event.preventDefault();
  const value = event.target.value.trim();
  if (!value) return;
  if (!collection.includes(value)) collection.push(value);
  event.target.value = '';
  renderChips();
  markDirty();
}

/* Start ----------------------------------------------------------------- */

async function init() {
  state.config = await api('/config');
  el('content-dir').textContent = state.config.contentDir;
  fillDatalist('topic-options', state.config.topics);
  fillDatalist('type-options', state.config.types);
  renderInsertControls();
  restoreLayout();
  wireGutters();
  wireEvents();
  await loadPosts();
  watchServer();
  const wanted = location.hash.slice(1);
  const initial = state.posts.find((post) => post.id === wanted) ?? null;
  if (initial) await openPost(initial.id);
  else updatePreview();
}

function fillDatalist(id, entries) {
  const list = el(id);
  list.replaceChildren();
  for (const entry of entries) {
    const option = document.createElement('option');
    option.value = entry.name;
    option.label = `${entry.count} post${entry.count === 1 ? '' : 's'}`;
    list.append(option);
  }
}

init().catch((error) => {
  document.body.innerHTML = `<p style="padding:2rem">The writer could not start: ${error.message}</p>`;
});
