---
title: "Move Over Gas Town, Claude Has First-Party Agent Orchestration"
description: "Anthropic has announced an experimental system for first-party
  multi-agent orchestration, called 'Agent Teams'."
taxonomies:
  type:
    - Mini
  topics:
    - AI
---

While [Gas Town][gas_town], the hallucinatory fever dream / slopware project by
Steve Yegge, was first on the scene for agent orchestration, it was never going
to be the end. Gas Town, as Yegge himself admitted, is an experiment intended
to explore the limits and problems of agent orchestration without concern for
cost or quality. It would never work as a serious professional tool.

Today, Anthropic announced an experimental alternative for agent orchestration,
which they call ["Agent Teams."][agent_teams] This is actually the _second_
system Claude has grown for orchestration, the first being
["subagents."][subagents]

In Agent Teams, one agent oversees a collection of worker agents. The worker
agents all maintain their own independent context, and can message between
each other to coordinate work. Per Anthropic's documentation, Agent Teams
are best deployed in contexts where they can work on independent efforts on
a shared codebase without overlapping.

By contrast, subagents work serially, and share context, with each subagent
being specialized for specific tasks. They're intended to be used in contexts
where you have a single problem or series of tasks which benefit from
specialization, but which require coordination and shared state between agents.
Subagents, unlike Agent Teams, are not considered experimental.

I doubt that Agent Teams will be the final word from Anthropic on multi-agent
orchestration, but I am both glad to see Anthropic pursuing a first-party
solution in this space, and unsurprised.

Back in the era of containers, Docker had first-mover advantage and were in
position to develop a strong first-party solution for container orchestration.
Unfortunately, despite efforts in that area, they were unable to satisfy the
needs of their users, leaving room for Kubernetes to emerge and take pole
position, which limited Docker, Inc.'s ability to monetize that opportunity.

With that well-known example in mind, it was hard to imagine that Anthropic
would risk missing the train on agent orchestration by not developing
first-party solutions.

It's doubtful this is the last option we'll see in the agent orchestration
space. Users and AI companies are still figuring out the pitfalls and what
seems to work well for coordinating the work of multiple agents. As we've seen
with Gas Town, solutions which involve the application of ever more specialized
agents can become quite expensive!

Agent Teams certainly have fewer unique agent roles compared to Gas Town,
and we'll see what impact (if any) that has on the ability of the agents to
remain on-task over time and to coordinate on work.

[gas_town]: https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04
[agent_teams]: https://code.claude.com/docs/en/agent-teams
[subagents]: https://code.claude.com/docs/en/sub-agents
