---
title: Postscript on "Open Source Software and Corporate Influence"
description: "Some additional notes based on responses to 'Open Source Software
  and Corporate Influence'"
taxonomies:
  type:
    - Blog
  topics:
    - Open Source
---

Sharing additional thoughts arising from discussions around ["Open Source Software and Corporate Influence."](@/blog/2025-02-11-open-source-software-and-corporate-influence.md)

<!-- more -->

---

As happens when you write something on the internet, people will reply and share their own analyses and disagreements. I was very lucky in this case to get feedback and critique from some very knowledgeable folks in the open source space, and I wanted to take a minute to address some specific items that I think expand the aperture to include important topics and perspectives not covered in the original article.


## Trademarks and Patents

First, for reasons of length, I did not get into issues of trademark or patents in the article, focusing solely on copyright instead. In practice, copyright is the most prominent of the three kinds of intellectual property in open source; it is the basis for OSS licenses and thus for the open source definition, but trademark and patents _are_ still relevant.

In the intersection of OSS and corporate interests, issues can arise around corporate ownership of trademarks. For example, Firefox has had a long-standing back-and-forth with Debian and other open source operating system projects which wanted to carry their own patches to the software, resulting in an extended period of time where Debian's Firefox derivative needed to carry its own name and logo as Iceweasel. More recently, the Rust Foundation (a 501(c)(6) foundation representing its member companies' interests in promoting and sustaining the Rust programming language) received substantial negative feedback in 2023 when they previewed a new trademark policy which was substantially more restrictive than prior policy in ways that would turn many existing community uses of the name "Rust" into trademark violations. This policy was eventually rolled back, with a less restrictive policy being promulgated late last year.

Similar problems can arise with patents. Some, but not all, open source licenses include explicit patent grants to the software users, meaning it is possible in some cases to use OSS legally under the terms of the license for the relevant _copyright_ while still being in violation of _patent rights_ associated with the software. This has at times opened open source projects and their users up to legal challenges, and the state of case law today is complex. Google's [breakdown of the history and current legal status here](https://google.github.io/opencasebook/patents/) is a good introduction and reference to the topic.

## Fair Source

In the article, I identified relicensing risk, and the potential growth of this risk throughout open source, as a net negative associated with increased corporate involvement, and something against which we should become more resilient. More specifically, I recommended against contributing to projects with unaddressed relicensing risk like single corporate ownership and a permissive license, or a requirement for Contributor License Agreements from contributors.

This trend toward relicensing for previously "open core" or similar companies has coalesced around the term ["Fair Source"](https://fair.io/) to describe the category of licenses and the philosophical approach, similar to how "free software" and "open source" identify their own philosophies and sets of licenses.

While I am skeptical of Fair Source as a net-positive, I am glad they've branded the concept and do think they've made some arguments in their favor which are worth considering. The most compelling one I've seen is from [Dirk Riehle](https://dirkriehle.com/2023/10/12/lets-celebrate-relicensing-from-an-open-source-to-a-proprietary-license/), who argues that the availability of "open source to fair source" as a path has resulted in the creation of open source forks of the original software (like OpenTofu for Terraform or OpenSearch for ElasticSearch) which would not have existed without the Venture Capital (VC) funding and eventual commercially-motivated relicensing toward Fair Source.

In essence, this is an argument that _some_ software which is highly valuable to the commons _needs_ a large amount of external investment which is only achievable through VC's and startup economics. This may be true, and I think the value judgment here is between this effect of net-new open source sustained through independent forks begun at the open source to fair source transition, versus the effect of net-negative investment of labor or adoption of open source due to fear of relicensing rugpulls.

## Forking

[Adam Jacob has also argued](https://bsky.app/profile/adamhjk.me/post/3lhz2texvc227) that forks should become more normalized, and the potential need to invest in a fork as a user should be factored into the calculus of adopting a single-vendor open source project. This is a compelling point, that also gels with the community and participatory nature of open source.

I think this also fits with the movement toward viewing open source software as ["free as in puppy"](https://conferences.oreilly.com/velocity/vl-eu/public/schedule/detail/78420.html) rather than "free as in beer." When you adopt open source, you should consider and be prepared to handle the possibility of maintaining a fork of the software yourself, and of engaging as a participant with that software project when you need something. Besides increasing users' resilience to relicensing risk, I think this increase in the understanding of the implicit contract of an open source user could also help lessen maintainer burnout by changing mindsets from "make demands" to "get involved."
## Good Links Folks Have Shared

Open source is a *big* world, and since publishing the article some folks have pointed me to additional articles and organizations that are worth shouting out, including:

- [Craig Kerstiens shouting out PostgreSQL as an example of a project with anti-corporate-capture governance rules](https://www.linkedin.com/posts/craigkerstiens_postgres-is-built-different-postgres-is-activity-7293357147428425728-8Uw4/)
- [Thanks.dev](https://thanks.dev/home) as another platform for funding open source software developers.
- Vlad-Stefan Harbuz's talk ["Why and How Companies Should Pay Open Source Maintainers"](https://opensourcepledge.com/blog/why-companies-should-pay-open-source-maintainers-FOSDEM/) from FOSDEM 2025.
- A [more in-depth history of the history of the term "open source,"](https://dieter.plaetinck.be/posts/open-source-undefined-part-1-the-alternative-origin-story/) by Dieter Plaetinck, which I summarized only briefly near the beginning of the article. I'm thankful to Dieter for the investigation into prior art.
