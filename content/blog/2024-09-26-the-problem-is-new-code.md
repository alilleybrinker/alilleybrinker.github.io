---
title: "The Problem is New Code"
taxonomies:
  type:
    - Blog
  topics:
    - Memory Safety
---

Folks at Google explain how to think about the move to memory safe languages:
"the problem is new code."

<!-- more -->

---

The Google Security Blog has an article, out yesterday, titled
["Eliminating Memory Safety Vulnerabilities at the Source"][1], which explains
something in very clear detail which I think is essential for understanding
software security:

> The problem is new code

When I published ["C++ Must Become Safer"][2] back in July, I tried to explain
this fact through a small case study of the `curl` codebase, referencing some
analysis done by Daniel Stenberg, creator of `curl`. To wit:

> For any software project, we should expect that over time, if the code
> doesn't change substantially and the project receives some rate of bugfixes,
> the number of vulnerabilities latent in the codebase will decrease.

This was _correct_ but much less _clear_ than the phrase chosen by Andrew
Vander Stoep and Alex Rebert in the Google post.

Defects in code, and thus vulnerabilities, are overwhelmingly introduced when
code is written. We expect that memory safe languages reduce the number and
severity of defects in code at the time of writing by enforcing more static
checks which eliminate classes of defects. So for _new_ code, they ought to
be the default. Yet for existing code, it's entirely possible that the benefits
of a rewrite are minimal if enough time has passed.

The Google post also provides a formula for the density of vulnerabilities
in code given some "average vulnerability lifetime." For some projects, where
assurance techniques, including bugfixes, are minimal, we might nonetheless
expect this lifetime to be quite long. We should very much care about reducing
this lifetime through techniques which reduce defects in code and which
discover vulnerabilities. Not all projects will have an average lifetime as
short as ones we'd expect Google to be able to achieve.

I really hope that this phrase, "the problem is new code" enters the lexicon
of common phrases in software, diffusing out into the community and becoming
commonly-held folk knowledge. I will certainly be using it myself.

[1]: https://security.googleblog.com/2024/09/eliminating-memory-safety-vulnerabilities-Android.html
[2]: https://www.alilleybrinker.com/blog/cpp-must-become-safer/
