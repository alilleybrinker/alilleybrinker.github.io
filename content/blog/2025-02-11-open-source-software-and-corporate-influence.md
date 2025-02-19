---
title: Open Source Software and Corporate Influence
taxonomies:
  type:
    - Blog
  topics:
    - Open Source
extra:
  toc: true
---

Open source software projects are frequently enmeshed with the interests of
corporations. We should update mental models of _who_ works on open source
accordingly, and build or modify power structures to be more resilient to
corporate capture.

<!-- more -->

---

The goal of this article is to make clear that the large scale engagement of
corporations in open source has happened and is continuing to happen, that it
is fueled by natural incentives, and that it must be treated seriously because
it is having and will continue to have negative consequences even if every
individual involved is participating in good faith.

Additionally, I want to remove from this topic the ethical angle which so often
comes to dominate discussions of open source. It's not that ethics aren't
important (ethics are extremely important) but that ethical entreaties to
corporations or open source participants are ineffective when the underlying
incentives and the mechanisms of hard and soft power do not change.

## A Brief History

Open source software originated in the late 1990's as an outgrowth of and
response to the free software movement, with a particular focus on being more
appealing to commercial interests. Free software, both in attitude and in the
terms of its common licenses, was unusable for many corporations; copyleft
virality would in many cases require companies to release code which represented
the result of substantial research and development investment, held trade
secrets, or was itself constrained by agreements with other companies.

The term "open source," originated by [Christine Peterson], became the focal
point for a loose coalition of ideologues who believed in the virtues of free
(now "open") software, and saw pursuit of corporate adoption as a means to
achieve an impact which license isolationism, while idealistic, would fail to
reach.

Over the next 10 years, through the early 2000's, open source saw massive
growth as an ecosystem of projects, and as an _idea_ with a shared definition
and commonly-held social norms. The ["Open Source Definition,"] managed by the [Open Source Initiative], was codified in 1997, establishing clearly what qualifies a
project as "open source."

As documented in ["The New Kingmakers" by Stephen O'Grady], developers saw open
source software as an expression of their power as a labor group, an
opportunity to build skills and engage socially on topics of shared interest,
and a place of freedom from the demands and constraints that exist in
commercial engineering which degrade commitment to rigor or quality. Open
source developers could _build good software_.

At the same time, exactly as intended, corporations [saw the value of adopting open source software as a way to cut costs][facebook_oss]. Google, Facebook, and
others have long been open about the enormous value open source software gave
them, and how it enabled them to establish successful products _quickly_ by
eliminating investment in languages, tools, libraries, and systems for which
they'd otherwise have needed to pay.

What _didn't_ happen at scale in those early years was corporate investment
back into open source. It was a tragedy of the commons; a massively valuable
shared resource which could be extracted from with no requirement beyond
social norms to contribute back. While consumers of open source software do not
deprive others of the software itself (it's not like a community garden which,
when stripped clean, can't be harvested by others), they do strain the capacity
of the _people_ making that software.

This can be seen clearly in the [Heartbleed vulnerability], which was reported
publicly in 2014. Heartbleed was a critical severity vulnerability in OpenSSL,
an extremely popular open source software library used for securing an enormous
number of websites across the internet. During the response to Heartbleed, it
became clear that the OpenSSL project was massively under-resourced. At the
time, it had only two full time software developers working on it, for a
codebase which included roughly 500,000 lines of source code. Despite the use
of OpenSSL by deep-pocketed businesses in mission-critical systems, OpenSSL had
not received much if any investment back.

In the wake of Heartbleed, open source as an ecosystem resolved a new common
community goal: to get corporate consumers of open source to give back. To
fix the tragedy of the commons leaving open source maintainers at times
struggling to make ends meet or failing to meet the needs of their users
despite a benevolent desire to do so. This was a noble goal and (as
we'll see) they have in many ways succeeded, though perhaps not in the ways
they intended.

## How Corporations Invest in Open Source

### The Ideal of Paying Maintainers

For many, the vision of corporate investment in open source was captured in
the common refrain to "pay maintainers." In this model, corporations would
provide grants to the existing maintainers of open source software, to do the
work they're already doing and perhaps to enable them to do that work _more_,
ideally transitioning from part-time to full-time. It would grow open source by
empowering the true believers who were already doing it for free.

This is a beautiful and clean vision; one which rewards good people by
providing payment and recognition for their creation of valuable tools and
libraries for others. It is _ethical_ and _just_. However, the reality of
paying maintainers is more complicated than this vision can capture.

### The Legibility Gap

In ["Seeing Like a State,"] James C. Scott coined the term "legibility" to
describe the ability of a government to understand the people and systems it
governs. We can use the term here to, by anology, describe the ability of
corporations to understand the people and systems with which they interact. In
the context of open source software, one of the major challenges of the "pay
maintainers" model is that maintainers are generally not legible to corporations.

Corporations have many mechanisms to give money to others. They can sign
contracts with suppliers to acquire parts, with contractors and employees to
secure labor, and with customers to supply a product or service. What corporations
generally struggle with are one-time small dollar payments to individuals who
are not under a contractual relationship with the company. Corporate finance
is optimized to deal with large amounts of money and with contracts.

We can see this challenge of legibility for investing in open source software
in the rise of an ecosystem of go-betweens and experimental structures around
the problem.

[Tidelift], for example, is a company which aims to bridge this legibility
problem by signing contracts with corporations and then handling paying the
open source maintainers itself. There are also platforms like [GitHub Sponsors]
and [Open Collective] which can offer at least a mechanism to facilitate
payment, though they're not explicitly corporate-oriented.

At times, individual developers have also tried to work around the legibility
issue, generally by forming single-person or small team consultancies which can
be hired on contract. [Filippo Valsorda], a cryptography engineer and open
source maintainer, has written extensively about his experiences with pursuing
exactly this route. While the consultancy route is valid, it demands a cost in
complexity, business fees, and other overhead by the developer to bridge the
legibility gap.

Open source foundations have also courted corporate contribution under the
banner of funding open source development. In the case of 501(c)(3) foundations like [OWASP] this generally comes in the form of tax-deductible donations which may be distributed to open source projects. For 501(c)(6) foundations like the [Linux Foundation],  also called "common interest" non-profits, this comes in the form of corporate memberships, and membership fees may be distributed to support open source.

One additional wrinkle in the 501(c)(6) model, common across many open source
foundations, is the tension of constituency. While these foundations have a
core mission around supporting open source, they are institutionally
accountable to their member companies, and corporate priorities can and do
come into tension with the needs of open source projects.

In either case, corporate investment in open source foundations, which
themselves then invest some portion of that funding into open source
maintainers, has offered another path to legibility besides go-between
for-profit corporations like Tidelift or the consultancy model.

One additional wrinkle is that not all maintainers _want_ to be paid. Reasons
can include a desire to remain a hobbyist maintainer, to not take on the
expectations and commitment inherent in receiving funding, or a desire to
retain independence in the direction and cadence of their project. Whatever
the reason, there is a persistent group of maintainers for whom payment is
an untenable option for support.

### Employee Contributors, a Legible Alternative

Of course, there is way for corporations to invest in open source which
sidesteps this legibility issue: they can [pay their own employees to work on open source software][oss_report_2024].

The mechanics of doing so are easy. Open source projects are frequently
participatory; whoever shows up gets a say in what gets built. The hard part is
the motivation for this investment. Developers are expensive; the cost of
developer labor represents a substantial fraction of the costs of running a
software-focused company. So choosing to invest this on a common good requires
a business case for that strategy and how it benefits the company.

The business case is multifaceted, and the specifics of what this form of
open source investment looks like do vary.

First, investment in open source software can help to buy down risk associated
with the use of that software. This is the case made to stop the "next
Heartbleed," that by investing in open source software, you can ensure that
the most important software you use won't have critical severity
vulnerabilities.

The case for doing this by contributing to the open source projects themselves,
rather than maintaining internal patches, is easy. By contributing upstream,
you get the additional leverage of the project's other contributors who can
build on your work. Maintaining patches for upstream projects which you do not
control and in which you're not actively engaged is generally time consuming,
costly, and error prone. In that context, engaging in public is sensible.

Second, and relatedly, engagement in open source software projects lets you
add new features while leveraging the additional labor of the crowd. For
whatever investment you make with your own developers to add features, you
also get the benefit of labor from other project participants who will fix,
add to, test, and otherwise improve the work for which you're directly
paying. Adam Jacob calls this the ["open source lift."][oss_lift]

Third, engagement in open source has benefits for hiring, and for the social
perception of your company among software developers. Many software developers
are interested in being able to contribute to open source software; not
being able to do so (as is still the case at some technology companies) can be
a mark against considering working for a company. Open source engagement also
allows you to identify skilled developers you would like to hire, not just
through the shallow process of interviewing, but through active long-term
direct engagement.

So far, all of these cases have been about motivating investment in existing
open source projects. There is another salient case to consider: [corporations releasing their own first-party open source software][adam_fair]. Again, there
are many models for how this relates to the business of the corporation
releasing the software. The late 2000s and into the 2010s saw the rise of
"open core" companies which release open source software around which they
build the core value of their business. There are also companies for whom the
open source software they release is not _central_ to their value proposition.

In either case, it's extremely important to know: open sourcing software
strongly pushes the market price for that category of software to $0.

This is _extremely valuable_ to many companies. It is not _price fixing_ per
se, as it does not involve an explicit agreement between parties to set the
price for a good or service, but by making valuable software available for
free, backed by the investment of a corporation, that corporation can
undercut the bottom line of their competitors.

This power is a strong incentive to release open source software where that
software doesn't represent a core source of business value for _you_ as a
business, but does represent a source of value for your competitors. Mark
Zuckerberg, during [a recent interview for the podcast "Acquired,"][acquired]
explicitly stated this reasoning motivated a great deal of Facebook's open
source software releases, specifically undercutting Google.

A key to strategic success for any company is to capture the most value in
their product's value chain. Microsoft famously, in their deal with IBM for
the IBM PC, rode a wave of commoditization of that PC by IBM PC clones made
by companies like Gateway and Compaq; Microsoft could sell to the clones
as well; while the value of IBM's own PC business dwindled in the face of
stiff competition which drove margins downward in the PC market.

In that case, Microsoft correctly predicted that IBM clones would arise and
turn the IBM PC into a commodity with dwindling margins. Now, imagine if
instead Microsoft had the ability to selectively force those margins of the
step before them in the value chain downward, such that they captured more
value in the chain?

Open source can offer such a power.

So, corporations can be strongly incentivized to release their own software as
open source, and there is a compelling business case for engaging in existing
open source software projects. Because of the legibility gap for the "pay
maintainers" model, corporations engaging in open source are much more likely
to engage by having their own employees participate in open source projects.

We also have evidence this _is_ how the investment happens in practice. In
their ["2024 Open Source Software Funding Report,"][oss_report_2024] a group
of researchers affiliated with Harvard University, the Linux Foundation,
GitHub, Georgia Tech, and the University of Lausanne concluded that 86% of
identifiable open source funding from corporations came in the form of
labor, with 56% of _that_ (48% of all funding) in the form of employee labor.

### Who Has Time Has Power

In theory, this could be fine. Corporate employees contributing to open source
software projects fulfill the key goal of the post-Heartbleed reassessment.
In practice, corporate employees participating in open source projects have a
tendency to wield outsized influence which distorts the priorities and
perceptions of those projects.

In ["The Tyranny of Structurelessness,"] Jo Freeman described how projects
which operate without formal structure are not inherently equitable, but are
instead prone to the establishment of hidden structure based on social power
and, most relevant here, available time.

As [Ashley Williams identified][ashley] on the Oxide and Friends podcast episode "Open
Source Governance," many open source projects are, in effect, structureless. It
is an easy default to treat open source projects, especially when they are
small, as participatory consensus-driven coalitions; people who want to
contribute can, and so long as they can gain some degree of consent from the
coalition to make changes, those changes will happen.

Even open source projects which are run under the Benevolent Dictator For Life
(BDFL) model are susceptible to the risks of structurelessness, because
although the BDFL model organizes under an authoritarian final decider, that
authoritarian often for reasons of expediency will delegate decisions or
accept the contributions of those who show up, so long as those contributions
do not violate the BDFL's sensibilities for the project.

Unfortunately, contributors who are employed professionally to work on open
source software often have more time than contributors who aren't. For
volunteer contributors, their work on the project may happen only in the
evenings after their normal job, on weekends, or more sporadically.
Professional open source contributors, by contrast, can devote some portion of
their work week, on the order of tens of hours, to open source.

When projects lack structure, this incongruity can easily result in the
professional contributors accruing more power within the project because they
are consistently contributing. This is not inherently _bad_, but it is a
pervasive dynamic which impacts the open source projects where it occurs.

Even beyond those projects, when incongruous accrual of power in open source
goes to representatives of corporations, the ecosystem perspective of what open
source _is_ and _ought to be_ can itself change in subtle and important ways.

## Ecosystem Effects

There are _many_ effects from the pervasive accrual of power by corporate open
source maintainers, and I won't attempt to enumerate them all here. Instead,
I'll identify several salient effects visible today:

1. Greater minimum expectations for open source projects.
2. Greater systemic exposure to relicensing risk.
3. Fragmenting and privatizing governance.
4. Greater componentization risk.
5. Favoring corporate needs in project priorities.

Before we explore these in detail, I want to reiterate that while I think these
are negative impacts of the influence held by corporations in open source
software across the ecosystem, I am not addressing whether such systemic
influence is net-bad or net-good for society. Such a scope is too great for me
to address here.

That said, let's explore each of these impacts in greater detail.

### Greater Minimum Expectations for Open Source Projects

Open source projects exist under a social contract between the maintainers who
produce the software and the users who consume and who may contribute back to
it. While maintainers do not _owe_ anything to their users — to quote the
popular MIT license "THE SOFTWARE IS PROVIDED 'AS IS,' WITHOUT WARRANTY OF ANY
KIND" — most maintainers do try to meet an implied social contract of the
minimum expectations of an open source software project.

Generally, this can include practices like:

- Providing a usable library in the form expected by the relevant languages or
  ecosystems involved,
- Providing documentation,
- Having tests associated with the software which users can run,
- Providing pre-built binaries for popular architectures if the project is
  producing an executable tool,
- Having a place to report bugs,
- Having a place to discuss changes to the products maintained by the project,
  whether in the form of an issue tracker, a forum, a chat-like platform, or
  something else.

All of these are _good_ practices, but they are also each pieces of additional
work which would be required of a project's maintainers to establish, maintain,
and monitor.

Expectations around these are not uniform, either across open source software
as a whole, or across specific language ecosystems, but generally the norms
are driven by the perceived practices of the "average" project in an
ecosystem, and can also be subject to a form of induced demand when the tooling
in an ecosystem reduces the friction required to follow one of these practices.
For example, a language ecosystem which makes it easy to produce shareable API
documentation can induce ecosystem demand for API documentation.

These demands on open source maintainers have a psychic weight to them. For
example, in the [social engineering campaign against Lasse Collin][xz], maintainer
of the popular `xz-utils` open source library, one of the attackers' personas
made aggressive demands of Lasse's productivity and responsiveness, and
leveraged the anxiety created by these attacks to manipulate Lasse into
accepting Jia Tan, another attacker persona, as a maintainer of the library.
These attacks by the malicious persona were public, and while they were
aggressive, they were not out of the norm for how open source maintainers
may be commonly treated by users of their software.

This can also come in a more pedestrian form, where tools intended to check
for best practices by open source projects can be used against maintainers
instead of being used to support maintainers. The [Open Source Security Foundation's][openssf] (OpenSSF's) [Scorecard] tool has at times faced this
challenge. Scorecard is intended to be a tool to empower maintainers to
understand their own projects and improve their practices. Nonetheless, and
against the express wishes of the Scorecard project, users have at times used
the results of a Scorecard analysis of a project as a way to berate or demand
work from maintainers.

It is an unfortunate reality that, in an ecosystem filled with volunteers
operating in good faith to produce quality software for free, often beyond the
terms promised by the licenses under which that software is provided, increases
in the perception of minimum quality across an ecosystem can drive increases in
harassment or general anxiety for maintainers.

### Greater Systemic Exposure to Relicensing Risk

One of the more recent trends in open source software has been for corporations
which control the intellectual property for, or are the majority contributors
to, an open source project to [relicense the project away from an open source license][relicense].

This relicensing is harmful both because it removes rights users of the
software had previously, but also because the repetition of the relicensing
pattern may lead to long-term reductions in the availability of open source
software. We previously discussed why corporations may decide to open source
software which they've produced; open source software offers the opportunity
for a "lift" of community engagement through more rapid advancement of the
software, generation of leads for hiring, enhancement of the corporate brand,
and more.

Relicensing after having received the benefits of the open source lift permits
corporations to, in a sense, have their cake and eat it too. They can
use the lift of open source to grow their business, and then later relicense
to secure a greater portion of whatever market has grown around the open source
software they've established. In so doing, the corporation behind the
relicensing is also taking away rights the contributors had in their own
contributions (in the case of copyright assignment through a Contributor
License Agreement) or violating a social contract around the expected
perpetuity of access for the community to the contributions people
have made.

It's important to also say that relicensing efforts do not all require
copyright assignment. If a corporation employs the majority of productive
contributors to a project, and the project is under a permissive license which
permits users to more restrictively license the code, then that corporation may
"relicense" a project by forking it under a more restrictive license and
ceasing all contribution to the original open source project.

This is not an _ethical_ argument I am making, but is instead a material one.
The ecosystem suffers when the long-term societal benefit of open source
software is riskier due to the possibility of relicensing. This rise in risk
can discourage contribution generally, and as the scarce resource in open
source software is time, the growth of open source projects which will in
the future relicense pulls attention and developer investment away from
projects which will be open source long-term.

### Fragmenting and Privatizing Governance

When corporate contributors from a single corporation specifically become
a major segment of the contributor base for an open source project, it
becomes easy for important governance decisions for that project to happen
_inside_ of the company, in ways that are hidden from external contributors.

Backchanneling in general is one of the long-standing challenges of open
source governance; the formation of cliques among maintainers, which may or
may not on its own be sinister, leads to the accrual of power to the largest
clique as they coordinate outside of official channels to prepare and push
strategic actions.

This same problem can arise with corporate contributors, who may use
internal communication channels to coordinate work, discuss ideas, and
prepare actions outside of the eye of the public governance structures. When
an item _does_ come into the project's public venues, it may already carry
substantial support from the in-group who have been read-in to the change in
advance of the formal proposal, and carry with it the implied weight of
inevitability because of an existing broad base of support among active
maintainers.

This kind of subversion, even if unintentional and driven largely by the
convenience of corporate-internal communication, undermines open governance
goals. While some open source projects may be more resilient to this kind of
challenge (for example projects with substantive process to ensure open
comment and feedback on proposals), not all projects are prepared to
adequately defend against corporate-internal backchanneling.

### Greater Componentization Risk

It is generally easier, and in many ways preferable, for a corporation
to take ownership of a project over which they can have sole strategic
discretion; rather than participating as one among equals in a power
sharing structure. The trade-off of open governance, volunteer-based
organizations, and a preference for consensus is that decisions are
made more slowly, and timelines are often variable and difficult to
predict. This kind of uncertainty and delay is often anathema to the
needs of corporations to deliver features on defined schedules to
serve strategic priorities.

Because of this, it can often become preferable for corporations to
push open source projects toward greater modularization, so that
each participating company can lead the development of one component
in a broader ecosystem of interacting components. In this way, companies
collaborate on a shared system comprised organizationally of individual
fiefdoms, with some defined interface between them which delineates
both the technical and the governmental bounds.

This is a corrolary of the often-identified problem of corporate open
source being "too complicated," often attributed to hyperscale corporations
in the open source world needing levels of functionality or configurability
which are irrelevant for other users; this dynamic is real, and the
institutional incentives toward modularization exacerbate it by splitting
what may otherwise be singular "product" projects into ecosystems of
interoperating modules.

### Favoring Corporate Needs in Project Priorities

The final impact in this list is the most general and the most important.
When corporate employees are the majority, or wield substantial power in
open source projects, there is a pervasive distortion of project priorities
in favor of the needs of corporations.

One obvious way this can manifest is that corporate needs for software which
will be deployed in production often exist under constraints of scale that will
rarely if ever be relevant for individuals, small teams, or small businesses.

These constraints manifest in [ways big and small][typescript]; architectural decisions,
optimization, degrees of flexibility in an API. An API which would work for the
majority of non-corporate use cases, which may be shippable sooner or be easier
to use, may be denied or rewritten to support the needs of those corporate
users. This can delay timelines for landing improvements, or saddle smaller
consumers with levels of API or operational complexity which are not worthwhile
for them to overcome.

This change in the calculus of cost vs. reward for non-corporate users
experiencing changes in an open source project now subject to corporate capture
can form a vicious cycle. A project prioritizes corporate needs in ways which
harm the experience of non-corporate users, causing them to self-select out of
the project; this further tips the imbalance in representation toward corporate
participants, accelerating the shift in project community and priorities.

At Node Summit in 2017, Bryan Cantrill, then the CTO of Joyent, gave a talk
titled ["Platform as a Reflection of Values."][cantrill] In this talk, Bryan
outlined the history of the divergence and battle over governance of the
Node.js open source project which had come to a head in 2014, focusing on how
this conflagration arose from a disagreement about the _values_ underpinning
Node.

Prior to the key events, the Node project had been joined by distinct
constituencies of participants and users. This included Joyent, who sponsored
and led governance of the Node project, and many of Node's users and
contributors. As Bryan put it, the broader Node community had core values
including "approachability, performance, and simplicity," while Joyent's
corporate values included "compatibility, debuggability, integrity,
maintainability, resiliency, rigor, robustness, safety, security, stability,
thoroughness, and transparency."

All of these values are _good_ values in principal for an open source project
to have, but they are inconsistent. In fact, there is no overlap in these two
sets of core values. This disconnect unsurprisingly led to a crisis including
a fork of Node.js by the community. That it _did_ lead to a crisis which
resolved in a manner amenable to the community (with the fork, called Io.js,
being closed in favor of continued community collaboration on Node, and with
Joyent ceding stewardship of the project to a new independent foundation) is
itself an anomaly in the history of open source projects.

Despite forks often being cited as the major check users have against
disagreeable stewardship of open source software projects, they rarely succeed
in practice. Maintaining an open source project is difficult, time consuming,
and expensive. When forking an open source project, the new maintainers of the
fork need to not only steward the new project they've established, they may
also need to manage tracking or maintaining independent compatibility with
the original project from which they've split. They may even be doing this
under the strain of hostility and antagonism from the originating project.
Eventually, most values-based open source software fork attempts fail.

## Retrofitting Resilience

This may seem like a dire state for the health of the open source software
ecosystem. Many projects have simultaneously become captured by and dependent
on the interest and investment of corporations. While this has undoubtable
benefits from the additional developer labor, it carries with it substantial
drawbacks. Worse, open source as an ecosystem is often minimally cognizant of
this change in the status quo.

So, what can we do?

I will not attempt to outline a complete and comprehensive program for making
open source immune to corporate capture. First, I am not sure that expulsion of
corporate investment in open source is either possible or desirable. Rather, I
will make here some recommendations for how open source can become more
resilient to corporate influence, to mitigate some of the negative
externalities described in the last section.

Specifically, I think the following steps would help establish a more equitable
playing field for open source software project contributors of all stripes,
and reduce the systemic risks arising from dependence on corporate
contributors.

- Update open source governance models to protect against corporate capture.
- Continue to grow alternate paths to legibility for open source maintainers.
- Reject contributing to open source projects with unaddressed relicensing risk.
- Establish a shared definition of Open Governance for open source projects.

### Update Governance Models to Protect Against Corporate Capture

Today, many open source projects do not place limits on the ability of
corporations to capture their governance structures. For example, a project
may permit a majority of individuals in positions of governance, or on key
teams within a governance structure, to come from a single company.

Placing these limits, for example that only a fixed proportion or maximum
number of individuals in positions of project authority may work for the same
company, can help limit the ability of any one company to unduly influence
the direction of a project. Even if projects work under a consensus-based,
rather than voting-based, governance model, permitting disproportionate
governance representation for a single company permits accrual of too much
centralized power.

This may need to be done over the objection of individuals who worry that they
may, for example, need to cede their own position of governance authority if
their employer wants to add a different contributor to a governance position,
or if they change jobs and come to violate the same-company limit. While this
can be frustrating for an individual, the benefits of limiting the risk of
corporate capture outweigh the harms of removing governance authority from an
individual who would otherwise retain it.

### Grow Paths to Legibility for Open Source Maintainers

As mentioned previously, there _are_ other existing paths individuals have
taken to become more legible to corporations looking to invest in open source
software. We should continue to systemically invest in and grow those paths.
This includes expanding the scope of projects like Tidelift which can
intermediate the process of funding individual maintainers, further documenting
and supporting the establishment of consultancies by individual maintainers, and
seeking to identify alternate paths to secure funding for maintainers.

While paying employees to engage in open source software projects will likely
remain the _most_ legible option for corporations, it does not need to be
their _only_ option. Improvements in the scope and ease of funding developers
through these alternative paths could help to shave the proportion of open
source funding alloted to employees contributing to open source.

### Reject Open Source Projects with Unaddressed Relicensing Risk

Relicense risk in open source projects will likely continue, as the spate of
successful (from the corporate perspective) relicensings over the past several
years will motivate imitators in the future.

As the relicensing maneuver is made valuable by the presence of an early "open
source lift" which benefits the corporation, its value can be reduced by
refusing to provide the lift. Withholding labor from relicense-risky projects
helps to deny the opportunity in the future and to discourage long-term bad
faith engagement with open source by corporatations.

To achieve this, there must be a clear understanding of what unaddressed
relicensing risk looks like. To wit, there are two flavors we can identify
thus far:

- Projects which require all contributors to assign copyright to a corporate
  owner (usually through a Contributor License Agreement \[CLA\]).
- Projects with single corporate backers who provide most of the developer
  labor, or who maintain sole access to the infrastructure underlying the
  development and distribution of the software, and which carry permissive
  licenses which permit relicensing by forks.

The first is clear-cut: if the corporate maintainer owns all copyright
associated with the software, they can freely relicense the project no matter
what license is used to distribute it. This is because licenses are downstream
of copyright; the copyright holder is not bound by the license, they offer the
license to define the terms under which the copyrighted work may be used by
others.

The second case may be surprising to some. If a project is licensed under a
permissive license like the MIT or Apache 2.0 licenses, it may be forked by
anyone under a more restrictive license. If a corporation does this, and they
are the major source of labor, or the sole administrator of infrastructure
for that project, they can force the original permissively-licensed project
to wither even without relicensing the existing code.

With these cases enumerated, we can see the warning signs which ought to be
cause for developers to refuse their collaboration for an open source project,
or to demand changes in governance to mitigate relicensing risk:

- Any requirement of a Contributor License Agreement for contribution to an
  open source project.
- The use of a permissive open source license for a [single vendor or majority single vendor][single-vendor] open source project.

### Establish a Shared Definition of Open Governance

The Open Source Definition has been around for decades, but it only addresses
the requirements of the terms under which the software is licensed to the
public. This is a laudable achievement, but it does not ensure community
access to the levers of power in the production of that software.

Just as the Open Source Definition set the minimum requirements for user
freedoms which must be preserved for a project to qualify as open source, an
Open Governance Definition would set the minimum requirements for user
power which must be available for a project to quality as open governance.

It would not need to specify the governance rules under which projects must
operate. Instead, it could focus on ensuring that users, regardless of their
background, have equitable access to power in open source projects which
want to call themselves "open governance." The combination of open source plus
open governance would become the highest signal of user freedom and equitable
access a project could pursue, and would help incentivize developer investment
in projects which meet this standard.

## Conclusion

For better or worse, corporations will continue to be involved in and to invest
in open source software. While that degree of investment may wax and wane with
changes in economic forces, the underlying calculus of benefits which can
accrue to corporations from investment in open source will not change any time
soon.

This means that the negative externalities identified in this piece, including
ecosystem-wide increases in minimum expectations and the pressure this places
on maintainers, greater systemic exposure to relicensing risk, and persistent
bias in project priorities toward corporate needs, will continue as well.

To manage these issues, we should as an ecosystem work to enact the resilience
efforts I've identified here. We should also go beyond them, to identify
further ways we can retrofit our governance and social structures to limit
the power which accrues to corporate contributors in open source projects.

Perhaps most importantly, we should update our collective mental models of
_who participates in open source_. It is not only an association of motivated
individuals, volunteering their time and labor, or an independent values-based
collective. It is awash with developers whose hours are paid for, and whose
energies are incentivized in the direction of their employers' needs. Even
if these developers may themselves be open source true believers, the
ecosystem-wide impacts of their participation may still carry the harms
outlined here. The problem is not one of insufficient developer ethics, it is
of insufficient institutional defenses and a lack of mitigating social norms.

Open source is a beautiful thing, which has empowered an enormous number of
individual developers, and lowered barriers to entry for new companies which
provide valuable services to the world. The long-running efforts of many
good-natured open source believers to incentivize corporate investment were
good, and their benefits should be preserved. The death of corporate investment
in open source, even if it were achievable, would not be in our collective best
interest.

It is my hope, in writing this, that we can wake up to the reality that the
mission of growing corporate investment in open source has succeeded, but not
always in the ways we hoped, and to motivate conversations across the
ecosystem on how we can be more equitable and resilient to corporate capture.
This is not a cancer to be cut out, but a beautiful evolution to pressure in a
direction which better serves the common good.

Long live open source!

## Appreciation

Thank you to [Ashley Williams], former Executive Director of the [Rust Foundation]
and founder of [Axo.dev], and [Hazel Weakly], Board Member for the [Haskell Foundation]
and a [Nivenly Foundation Fellow], for reviewing this post and providing
feedback pre-publication. Your insights were instrumental both in shaping my
thinking as I wrote the post, and in clarifying and improving it once drafted.

## Disclaimer

Approved for Public Release; Distribution Unlimited. Public Release Case Number 25-0092.

The author's affiliation with The MITRE Corporation is provided for identification purposes only, and is not intended to convey or imply MITRE's concurrence with, or support for, the positions, opinions, or viewpoints expressed by the author. ©2025 The MITRE Corporation. ALL RIGHTS RESERVED.

[Christine Peterson]: https://foresight.org/our-team/christine-peterson-co-founder-past-president/
[Open Source Initiative]: https://opensource.org/about
["Open Source Definition,"]: https://opensource.org/osd
["The New Kingmakers" by Stephen O'Grady]: https://thenewkingmakers.com/
[Heartbleed vulnerability]: https://en.wikipedia.org/wiki/Heartbleed
["Seeing Like a State,"]: https://yalebooks.yale.edu/book/9780300078152/seeing-like-a-state/
[Tidelift]: https://tidelift.com/
[Filippo Valsorda]: https://words.filippo.io/full-time-maintainer/
[acquired]: https://www.acquired.fm/episodes/the-mark-zuckerberg-interview
["The Tyranny of Structurelessness,"]: https://www.jofreeman.com/joreen/tyranny.htm
[ashley]: https://oxide.computer/podcasts/oxide-and-friends/1367163
[openssf]: https://openssf.org/
[Scorecard]: https://scorecard.dev/
[relicense]: https://redmonk.com/jgovernor/2024/09/13/open-source-foundations-considered-helpful/
[cantrill]: https://www.youtube.com/watch?v=Xhx970_JKX4
[single-vendor]: https://opensource.net/why-single-vendor-is-the-new-proprietary/
[facebook_oss]: https://engineering.fb.com/2020/05/08/web/facebook-redesign/
[owasp]: https://owasp.org/
[Linux Foundation]: https://www.linuxfoundation.org/
[oss_report_2024]: https://opensourcefundingsurvey2024.com/#key-finding-organizations-invest-billions-sources-sinks
[GitHub Sponsors]: https://github.com/sponsors
[Open Collective]: https://opencollective.com/
[oss_lift]: https://changelog.com/friends/41
[adam_fair]: https://www.youtube.com/watch?v=rmhYHzJpkuo
[xz]: https://research.swtch.com/xz-timeline
[Ashley Williams]: https://bsky.app/profile/agdubs.bsky.social
[Hazel Weakly]: https://hazelweakly.me/
[typescript]: https://bsky.app/profile/macwright.com/post/3lgiqobidzc2u
[Nivenly Foundation Fellow]: https://nivenly.org/who/
[Axo.dev]: https://axo.dev/
[Rust Foundation]: https://rustfoundation.org/
[Haskell Foundation]: https://haskell.foundation/who-we-are/
