---
title: "Safety Hygiene"
taxonomies:
  topics:
    - Rust
---

I really like Jack Wrenn's new article ["The Three Basic Rules of Safety
Hygiene,"][jack] which covers how to handle unsafe code when you have to write it,
through a hygiene checklist for expressing and validating compliance with
safety conditions in the code.

Rust's goal is not to eliminate unsafe code, but to [contain it in isolated
modules][nomi] you [can audit][audit] and which provide safe interaces to
external users. Sometimes unsafety is necessary, and having a _process_ for
how to handle that unsafety is a key development.

Research on how to reduce things like industrial accidents, medical incidents,
and airplane crashes all consistently find that checklists and procedures
_work_. Humans are fallible, and being accountable to a checklist or a process
defends against our propensity to make mistakes.

[jack]: https://jack.wrenn.fyi/blog/safety-hygiene/
[nomi]: https://doc.rust-lang.org/nomicon/meet-safe-and-unsafe.html
[audit]: https://github.com/rust-secure-code/safety-dance
