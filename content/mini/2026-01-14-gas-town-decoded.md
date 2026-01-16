---
title: "Gas Town Decoded"
description: "Explaining Gas Town's insular language to help demystify Steve
  Yegge's experimental AI agent orchestration system."
taxonomies:
  type:
    - Mini
  topics:
    - AI
---

On January 1st, Steve Yegge published ["Welcome to Gas Town,"][welcome] an
introduction to his new AI agent orchestration tool written in a loose and
chaotic mode, and accompanied by AI-generated images depicting a fictional
industrial city populated with weasels (yes, really).

Reactions were swift, mostly agog at the scale and hubris of such a
(self-admittedly) wasteful and obscenely _expensive_ system, and alternately
confused or amazed at the amount of new, _insular language_ tailor-made to
describe it.

In the interest of making Gas Town intelligible (because, despite the prose,
the idea of agent orchestration it describes will be important), I'd like to
share a quick decoder for the many new terms Steve introduces. His article
itself offers definitions, but those definitions reuse his insular terms,
making by-hand decoding tedious. Here, I've done the work for you.

| Steve's Term | Real-World Definition | Alternative Term |
|:-------------|:----------------------|:-----------------|
| Town | Top-level folder containing your individual projects. The `gt` binary manages projects under this folder. | Workspace |
| Rig | A project. It's a folder tracked by a unique Git repository within your workspace. | Project |
| Overseer | The user (you). You have an "inbox" to receive notifications from agents in your projects. | User |
| Mayor | The managing agent for a project. Usually you send this agent messages, and it coordinates the work of other agents in the project. | Manager Agent |
| Polecat | Worker agent, taking commands from the mayor, doing some work, submitting a Merge Request, and then stopping. | Worker Agent |
| Refinery | Merge agent, who coordinates and makes decisions about merge requests coming from Worker Agents. | Merge Agent |
| Witness | Fixer agent, that watches the worker agents and tries to fix any that are stuck. | Fixer Agent |
| Deacon | Maintenance agent, runs a consistent workflow in a loop, unlike "worker agents" who do arbitrary tasks and then die. | Maintenance Manager Agent |
| Dogs | Maintenance worker agents who do cleanup tasks, directed by the Maintenance Agent. | Maintenance Worker Agents |
| Boot the Dog | Maintenance Manager checker agent, just checks on the Maintenance Manager Agent periodically to see if it needs a reboot or anything else. | Maintenance Manager Checker Agent |
| Crew | Persistent Worker Agents, which you talk to directly (not through the Mayor), and which persist after their tasks are done, to be reused. These are per-Project. | Persistent Worker Agents. |
| Beads | System for tracking work history across the system. | Work Tracker |
| Rig Beads | Project-specific work, tracked in the Work Tracker. | Project Work |
| Town Beads | Whole-workspace work, tracked in the Work Tracker. | Workspace Work |

Even with these definitions and alternative terms, Gas Town is still a bit of
a mess, with watchers-on-watchers at times (do we really need a Maintenance
Manager Checker Agent?). That said, hopefully this decoder at least makes
understanding _what Gas Town is_ easier.

[welcome]: https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04
