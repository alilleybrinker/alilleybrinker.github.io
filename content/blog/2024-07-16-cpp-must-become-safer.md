---
title: C++ Must Become Safer
description: "Not everything will be rewritten in Rust, so C++ must become
  safer, and we should all care about C++ becoming safer."
taxonomies:
  type:
    - Blog
  topics:
    - Memory Safety
extra:
  toc: true
---

Not everything will be rewritten in Rust, so C++ _must_ become safer, and we
should all care about C++ becoming safer.

<!-- more -->

---

It has become increasingly apparent that not only do many programmers see
the benefits of memory safety, but policymakers do as well. The concept of
"memory safety" has gone from a technical term used in discussions by the
builders and users of programming languages to a term known to
[Consumer Reports][consumer-reports] and the
[White House][memory-safety-report]. The key contention is that software
weaknesses and vulnerabilities have important societal impacts — software
systems play critical roles in nearly every part of our lives and society
— and so making software more _secure_ matters, and improving memory
safety has been identified as a high-leverage means to do so.

Policymakers believe it's high leverage because of quality reporting
from a number of software companies, including [Microsoft][microsoft],
[Apple][apple], and [Google][google], showing that a large portion of the
vulnerabilities they track for their own software are derived from
memory _unsafety_. This reporting was then aggregated by
[Alex Gaynor][alex-gaynor], [Yael Grauer][yael-grauer], and
others to make a compelling case that you could achieve meaningful reduction
in software vulnerabilities, and importantly in the _severity_ of
vulnerabilities, by improving memory safety.

It's important to pause here and note that many existing popular languages are
already, at least partially, memory safe. In fact, the US government's
["Case for Memory Safe Roadmaps,"][roadmaps] published in December of 2023,
lists C♯, Go, Java, Python, and Swift as memory safe languages, all _garbage
collected_ languages which cover an enormous number of devices today. C♯ is
an extremely popular language for Windows machines with the .NET runtime, Go
is used for many web servers and pieces of "cloud native" software run by
popular cloud hosts, Java is the language of Android and a great deal of
widely-deployed software used by large enterprises, Python is the most
popular language today for many data science applications, and Swift is the
recommended language for all iOS applications today (though Objective-C
remains supported and widely used as well). All of these languages are
already delivering meaningful memory safety, though many still present at
least some memory safety–related issues like permitting dereferencing of
`null` pointers.

The one other language on the list from the "Case for Memory Safe Roadmaps" is
Rust, and Rust is unique in that list for being the only memory safe language
_without_ garbage collection. I believe _this_ fact is part of why so much
movement is happening around memory safety _now_. Rust has enabled memory
safety in contexts where garbage collection is not generally accepted, and
therefore languages which require it do not generally see adoption. In those
spaces, the overwhelming majority of existing code is written in C or C++.

It is _this_ code to which Rust presents an intruiguing possibility: could we
rewrite that code from C or C++ into Rust, and thereby gain the benefits of
memory safety where they were not previously feasible? It has become a common
joke both inside and outside of the Rust community that, for any project,
people should [Rewrite It In Rust][riir], and that the
[Rust Evangelism Strike Force][resf] stands ready to make this recommendation
to any project it observes, especially when memory safety–related
vulnerabilities arise.

## Not Everything Will be Rewritten in Rust

Despite the jokes, not everything will be rewritten in Rust, and in fact, many
things that are in C and C++ today _should not_ be rewritten in Rust. This is
also the position of many major tech corporations and foundations,
including&hellip;

<ul>
<li>
Google
<figure>
<blockquote>
&ldquo;We expect that rewriting large, existing unsafe codebases will often be
impractical. and recommend that old, unsafe codebases be updated gradually
via interoperability or by enforcement of safer coding patterns rather than
entirely rewritten.&rdquo;
</blockquote>
<figcaption>
<a href="https://www.regulations.gov/comment/ONCD-2023-0002-0074">Google&rsquo;s
response</a>
response to the 2023 Request for Input (RFI) on Open Source Software Security
from the United States Office of the National Cyber Director (ONCD)
</figcaption>
</figure>
</li>
<li>
The Open Source Security Foundation (OpenSSF)
<figure>
<blockquote>
&ldquo;[R]efactoring large existing code bases into a new language is typically
non-trivial. It can introduce new bugs and vulnerabilities, and in some cases
it is difficult to redeploy new object code (e.g., in OT/ICS devices). We
encourage new development to occur in memory-safe languages where practical.
Organizations should take a risk-based approach for existing code, focusing
their refactoring efforts where it will be the most beneficial; it would be
too costly and risky to try to rewrite all software currently in memory-unsafe
languages. Focusing on rewriting the riskiest components of the most important
software is a practical approach for existing software.&rdquo;
</blockquote>
<figcaption>
The <a href="https://www.regulations.gov/comment/ONCD-2023-0002-0046">OpenSSF</a> response to the ONCD RFI.
</figcaption>
</figure>
</li>
<li>
Trail of Bits
<figure>
<blockquote>
&ldquo;Unfortunately, the majority of OSS that is still used, maintained, and extended
for critical web and operating system infrastructure predates widespread
adoption of memory safe programming languages. Over 65% of websites are served
by an open source server written in an unsafe programming language like C or
C++. The cost (both monetary and logistically) of migrating all or any
significant portion of OSS to memory safe programming languages is substantial.
A cost-benefit analysis is therefore necessary.<br><br>
When performing this analysis, it is important to observe that pre-existing
testing should be considered a security property and as important as any core
feature: rewriting a piece of software in Rust can actually introduce security
problems if, for example, the previous implementation’s tests are not included
in the rewrite. Thus, these rewrites need to be performed carefully and
holistically, with consideration for existing tests and undocumented
invariants.&rdquo;
</blockquote>
<figcaption>
The <a href="https://www.regulations.gov/comment/ONCD-2023-0002-0076">Trail of Bits</a> response to the ONCD RFI.
</figcaption>
</figure>
</li>
<li>
GitHub
<figure>
<blockquote>
&ldquo;Supporting rewrites of the most critical open-source software
components in memory safe languages can produce valuable experience for
developers and funders. If rewritten components are adopted at scale, they
will reduce the vulnerability of the software ecosystem. However, rewrites
are also acknowledged by developers to be very expensive, bear the risk of
introducing new non-memory safety errors, and are, ultimately, a long-term
project. Therefore, additional strategies should also be prioritized, both
to foster the adoption of memory safe programming languages for new code and
to increase the efficiency and impact of increasing the safety of existing
components, including through rewrites.&rdquo;
</blockquote>
<figcaption>
<a href="https://www.regulations.gov/comment/ONCD-2023-0002-0084">GitHub&rsquo;s</a> response to the ONCD RFI.
</figcaption>
</figure>
</li>
</ul>


To understand, we'll need to do a cost-benefit analysis of rewrites like this.

The benefits of rewriting software from a memory unsafe language like C or C++
into a memory safe language like Rust seem clear: you introduce memory safety,
and eliminate vulnerabilities related to it! Since we have the reporting from
Apple, Google, Microsoft, and others showing that many of their vulnerabilities
are related to memory safety, and in fact the _percentages_ of vulnerabilities
they've observed which are memory safety–related seem stable across
organizations, we should expect that moving to memory safety should in general
result in similar reductions in vulnerabilities!

However, let's step back: the reported proportions of vulnerabilities assigned
to memory safety issues are for _actively developed_ projects, which means
these are projects which are being maintained and for which new lines of code
are being written.

Software defects, including weaknesses and vulnerabilities, can be thought of
in relation to the lines of code produced at a given time. Per 1,000 lines of
code, you have an expected "defect rate." Some of those defects may be
weaknesses, which are not exploitable, while others may be vulnerabilities,
which are exploitable. Either way, they are "born" with the introduction of
new code. While changes over time may convert weaknesses to vulnerabilities,
by making something exploitable which previously wasn't exploitable, and new
interactions between systems may make assumptions in existing code no longer
valid and thus introduce vulnerabilities, in both cases over time we can assume
that defect rates decrease because we expect the rate of fixing defects in
a fixed segment of code to outpace the introduction of new vulnerabilities
from changing system interactions.

To put it more plainly: __if you don't rewrite the code substantially, and you
periodically fix bugs, over time the number of vulnerabilities in the code
falls.__

If you're familiar with the idea of "systems thinking" and more specifically
of modeling "stocks and flows," that's basically what we're doing here. In
this context, the "stocks" are _amount of code_ and _number of detects_,
and the "flows" are _introduction of new code_, and _discovery of defects_.
I am not going to do a more detailed stocks and flows breakdown here, but this
kind of thinking is a good approach for modeling the considerations here.

Any project can use assurance techniques like code review, testing, code
analysis, defensive programming, and more to reduce the defect rate or increase
the rate that defects are identified and fixed.

Daniel Stenberg, the creator of `curl`, the popular "command line tool and
library for transferring data with URLs" (to quote the project), covers this
idea quite nicely in his 2022 blog post
["Increased CVE Activity in curl?"][curl]. In the "Finding vs. Introducing"
section, he notes that over time, the `curl` project has reduced the rate
at which new vulnerabilities are introduced. 75% of the CVEs reported against
the project at the time the article was written were from before March 2014,
when the project was much smaller in terms of code size. While the introduction
of new code has stayed relatively linear over time, the rate of vulnerabilities
per 1,000 lines of code has decreased through the use of assurance techniques
like rigorous testing.

For any software project, we should expect that over time, if the code doesn't
change substantially and the project receives some rate of bugfixes, the number
of vulnerabilities latent in the codebase will decrease.

For inactively developed projects, which we should not expect to be introducing
new vulnerabilities at substantial rates, a rewrite may actually be counter-
productive. While a rewrite to a new language could eliminate memory safety
vulnerabilities, it also is likely to introduce many new vulnerabilities of
_other types_. If the expected rate of latent memory safety vulnerabilities
in the code is low, this tradeoff may not be worthwhile.

In this analysis I've so far ignored the economic considerations, but those are
also important. Code rewrites are _expensive_, because (as any employer can
tell you), _staff time_ is expensive, especially for programmers who tend to
fetch high pay relative to many other professions. For legacy software which is
currently in maintenance mode with minimal staff support, and thus cheap to run,
the cost/value proposition of a rewrite may not make sense, and may in fact
change the calculus around the legacy systems entirely. Often a system becomes a
legacy system because it is not valuable enough to maintain, but too costly to
decomission and replace. If a cheap-to-maintain legacy system is faced with the
proposition of an expensive rewrite, it may instead be eliminated. The
externalities of this kind of change are difficult to consider in advance and
in general.

## C++ Must Become Safer

However, this does not mean we ought to throw in the towel for codebases
already written in C or C++ which may not be worth rewriting in Rust. Those
codebases _matter_, or else they would not be preserved in operation, and
that means these are codebases whose function in some way impacts people's
lives, and that vulnerabilities in them may result in real harm. Throwing
up our collective hands for these languages when there exists the possibility
of reducing harm is unacceptable.

<aside class="info-callout" aria-labelledby="why-just-cpp">
  <p id="why-just-cpp" class="info-callout-title">Why Just C++?</p>
  <p>For the remainder of this post, I'll be focusing only on C++. I believe we should want both C and C++ to become safer languages, but I think there is more appetite to pursue this in the C++ community and standards group than there is for C, and that C++ already has a number of language affordances which prime it to be able to introduce safety-providing abstractions which would likely be more difficult in C. My general recommendation in favor of advancing safety applies to both, but I am going to focus on C++ here.</p>
</aside>

So, what should we do? To quote [Steve Klabnik on this issue][steve]:

> \[I\]t seems (to me) like there are now four camps in the "how do we
> make C++ safer" category. I'm listing these in an order, I'll explain
> that after:
>
> 1. contracts
> 2. profiles
> 3. successor languages
> 4. borrow checking

This tweet thread is in response to a vote from a recent C++ standards
committee meeting about further exploration of opportunities for memory
safety in C++, and the rest of the thread goes on to explain Steve's
understanding of the current state of each of the four approaches.

These are being pursued, to varying degrees, by people in the C++ standards
process, and outside of it. Herb Sutter, Chair of the ISO C++ Standards
Committee, published an article in March of this year titled ["C++ Safety,
in Context,"][herb] (disclosure: I was a pre-release reviewer for that
article, for which I provided feedback on its descriptions of Rust's
guarantees and the landscape of memory safety today). Herb's article
outlines his own view of what C++ can and should pursue for memory safety,
and falls in the "contacts" and "profiles" camps of Steve's list above.

"Profiles" are also the path recommended by Bjarne Stroustrup, creator
of C++, and the rest of the "C++ Directions Group" in
[their writing on the topic][cpp-dg]. In the "profiles" approach, C++
would support the activation of predefined opt-in sets of additional static
analyses which would restrict what C++ programs can _do_, but improve their
safety, while enabling interoperation with C++ written and compiled without
the same profiles.

That said, there _are_ critics of the "profiles" approach, and it's not
clear that this approach has yet borne fruit of producing a meaningfully
safe profile of C++ which approaches the memory safety of Rust, or indeed
of less memory-safe languages like Java.

Indeed, Sean Baxter, who proposed the vote described above on the C++
standards committee pursuing memory, is also working on one of multiple
successor-language projects for C++: [Circle](https://www.circle-lang.org/site/intro/).
This is item 3 in Steve Klabnik's list, which includes (known to me, at least):

- Circle
- Carbon
- cppfront

[Circle](https://www.circle-lang.org/site/index.html), Sean's language, is "a
subset of a superset" of C++. This means you can intermix valid existing C++
code with code written in the safe extension of C++ which is _like-C++_ but
with limits placed to enforce memory safety.

[Carbon](https://github.com/carbon-language/carbon-lang/blob/trunk/README.md),
an "experimental successor to C++," aims for interoperation with C++
with more safety (though explicitly aiming for fewer safety guarantees than
Rust). Code written in Carbon is _not_ valid C++ code, but code written in
Carbon is intended to be able to easily call C++, and be easily called by C++
code.

[cppfront](https://github.com/hsutter/cppfront), being developed by Herb
Sutter, is an experimental syntax for C++ which compiles to "real" C++, and
essentially is intended to make it easier / the default to write safer C++
code with fewer footguns to remember not to fire.

As I am not a C++ programmer, I can't comment on which of these is the _right_
approach, and I have no idea which of these will persist or how this effort
will shake out over time. My point here is in fact not to make a case for or
against any of these approaches, but rather to say that anyone with an interest
in advancing memory safety and software security more broadly should care about
these efforts and what happens with C++ long-term.

## We Should All Care About C++ Becoming Safer

Which leads me to the crux of the whole point here: C++ isn't going anywhere.
As good as I think memory safety is (and I've been using and involved in Rust
projects since 2014, so it's 10 years of my career that I've committed to this
cause), it will not be universally achieved through rewriting existing code in
Rust.

The economic costs of these rewrites would be substantial, and in fact such
rewrites may be counterproductive in terms of vulnerability rates even if
pursued in some contexts (code which changes minimally over time and has
been assured well through alternative techniques already). We can't, and
shouldn't, even want a near-term future where Rust rewrites are pursued
across all or most software.

Using memory safe languages for new code is, of course, ideal. I do hope
that over time, the proportion of new code written in non-memory-safe languages
decreases. Yet code has a tendency to last a long time, far longer than we
often anticipate. We won't be getting rid of C++ any time soon.

So we should care enormously about what happens to the memory safety of
C++ as a language, and what opportunities may arise to pursue lower-cost and
lower-risk paths to improved memory safety besides full rewrites of existing
code into memory safe languages. Diversifying paths to memory safety through
profiles, contracts, and successor languages are all important to enable
_viable options_ in more contexts.

We should also not shame people working with and sustaining existing C and
C++ codebases, nor chide them to pursue rewrites in Rust. This does nothing
to help Rust, and in fact makes it look terrible as a community, and ignores
the often very real constraints holding back rewrites from starting.

Thank you to everyone involved in the C++ community who is working to make
the language safer. You are doing the hard and often thankless work of securing
something that's no longer new and shiny. I am sure as you do that you are also
dealing with challenging attitudes within the C++ community, from people who
may feel defensive or uncertain about a memory safe future and C++'s place in
it.

I hope we can all have a little more empathy, a little more nuance, and a
little less of an Evangelism Strike Force in the future.

[consumer-reports]: https://advocacy.consumerreports.org/research/report-future-of-memory-safety/
[memory-safety-report]: https://www.whitehouse.gov/oncd/briefing-room/2024/02/26/press-release-technical-report/
[roadmaps]: https://media.defense.gov/2023/Dec/06/2003352724/-1/-1/0/THE-CASE-FOR-MEMORY-SAFE-ROADMAPS-TLP-CLEAR.PDF
[microsoft]: https://msrc.microsoft.com/blog/2019/07/a-proactive-approach-to-more-secure-code/
[apple]: https://langui.sh/2019/07/23/apple-memory-safety/
[google]: https://android-developers.googleblog.com/2020/02/detecting-memory-corruption-bugs-with-hwasan.html
[alex-gaynor]: https://alexgaynor.net/2020/may/27/science-on-memory-unsafety-and-security/
[yael-grauer]: https://oxide.computer/podcasts/oxide-and-friends/1208089
[riir]: https://enet4.github.io/rust-tropes/rewrite-in-rust/
[resf]: https://enet4.github.io/rust-tropes/rust-evangelism-strike-force/
[curl]: https://daniel.haxx.se/blog/2022/08/22/increased-cve-activity-in-curl/
[steve]: https://bsky.app/profile/steveklabnik.com/post/3kwwqxuik2c2h
[herb]: https://herbsutter.com/2024/03/11/safety-in-context/
[cpp-dg]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/p2759r0.pdf
