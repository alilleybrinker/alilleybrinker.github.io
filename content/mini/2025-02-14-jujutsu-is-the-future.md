---
title: "Jujutsu is the Future"
taxonomies:
  topics:
    - Jujutsu
---

I'd like to stake a radical position: the [Git] Version Control System (VCS)
will be declining in popularity in 5 years, and [Jujutsu] (`jj`) will be
gaining popularity in its place.

Of course, Git is the most popular VCS today by a wide margin, with a large
ecosystem of companies and tools built around it.

However, I believe Jujutsu will displace it for three reasons:

1. __Jujutsu can be adopted locally on Git projects.__ You can use Jujutsu as
   an individual contributor on a project that doesn't use it. It can be
   adopted incrementally by teams, and does not require a cutover from one
   VCS to another, which history has shown to be a slow, expensive, and
   difficult process.
2. __Jujutsu's design makes dev work easier.__ Jujutsu has learned from Git,
   Mercurial, and others, and features a model which is, to paraphrase Steve
   Klabnik, ["simpler and more powerful"][steve] than Git's. By removing edge
   cases and sources of complexity from Git, Jujutsu's features compose better
   together, allow more powerful control over your commit history, and make
   day-to-day operations on collaborative software projects easier.
3. __Jujutsu's interface is easier to use.__ Not only is Jujutsu's data model
   simpler and more powerful, but its Command Line Interface (CLI) is also
   much easier to understand than Git's. This is both _because_ the data model
   is simpler (so fewer flags to handle edge cases are needed), and because
   the CLI itself is better designed. Flags are more consistent across
   commands, terminology is more consistent, undoing operations is predictable
   and much easier.

Of course, I may be wrong. Jujutsu is production ready for many users, but it
has not reached version 1.0 yet. Displacing an entrenched technology is also
difficult, and there are many ways it could go wrong.

Yet using Jujutsu, I have the same feeling I had writing Rust in 2014 as a C++
programmer: this is better. This is a system that makes many of the failure
cases I've encountered impossible, and makes the few remaining tough cases much
easier to resolve. Day-to-day, I find myself less worried about managing my
changes to reduce the likelihood of possible merge conflicts; in fact I am
rarely worried about conflicts at all. It's easier to use, easier to teach,
and lets me move faster and with more confidence.

One of Rust's historic taglines was ["Fearless Concurrency."][fearless] Maybe
Jujutsu's should be "Fearless Collaboration."

[Git]: https://git-scm.com/
[Jujutsu]: https://github.com/jj-vcs/jj
[steve]: https://steveklabnik.github.io/jujutsu-tutorial/introduction/what-is-jj-and-why-should-i-care.html
[fearless]: https://doc.rust-lang.org/book/ch16-00-concurrency.html
