---
title: "Tracking Software ID Schemes"
description: "Introducing a small tracker for known software ID schemes such
  as Package URLs, CPEs, and more."
taxonomies:
  type:
    - Mini
  topics:
    - Software ID
---

Part of my life is working on the problem of software identification. I'm on
the Core Team for [OmniBOR], a reproducible software identifier scheme, and my
other work in software supply chain security and vulnerability management often
bumps up against challenges with identifying software at differing levels of
granularity, mapping vulnerabilities or SBOMs (Software Bills of Material) to
specific software.

It may surprise you to learn there are a lot of software identifier schemes.
Some of them are general purpose and used across different ecosystems, while
some are ecosystem or even tool- or API-specific.

To help track those identifiers and link to their specifications, I've made a
new [Software ID tracker][tracker]. It's [up on GitHub][github] and
contributions are welcome!

[OmniBOR]: https://omnibor.io/
[tracker]: https://www.alilleybrinker.com/softwareids/
[github]: https://github.com/alilleybrinker/softwareids
