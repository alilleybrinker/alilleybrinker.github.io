---
title: The “xz” Backdoor
taxonomies:
  topics:
    - Supply Chain Security
---

Another big security event happened.

This time, it’s that the “xz” project was backdoored. The full details
and impact of the attack are still being understood, with Linux distros
and other systems that have integrated the malicious code now raising
their antibodies and responding. This will continue as we figure out the scope,
and secondary impacts and recommended next steps like rotating SSH keys and
detecting if individual systems have been compromised will no doubt come as
well.

<!-- more -->

When big security events like this happen, people often quickly try to identify
causes, and (more importantly) fixes to make sure it doesn’t happen again.
Often, individuals are working on systems, tools, or standards which are in
some way relevant, and rush to explain how their preferred solution is actually
the right solution for this exact thing. People may also look for how this new
story validates their prior beliefs about systemic problems, like
underinvestment in security or poor support for open source software
maintainers.

Of course, security is in many ways like any other complex system failure, and
complex systems do not fail for one reason. They fail for many reasons, and
they generally operate in states of partial failure at all times. This means
there is no one cause, and no one solution. It also means ideas for single
solutions generally end up being reductive, and arguments collapse into ideas
for singular fix-alls, followed by nitpicking about all the little cases that
aren’t solved. Little progress ends up being made.

In this situation, it’s likely there are many things we could do to make the
complex system of open source software more secure and resilient to this kind
of failure. Some solutions may not themselves fix immediate problems, but might
make other solutions more viable by standardizing or simplifying processes in
ways that enable automated detection.

SBOMs, reproducible builds, trusted builds in CI, provenance attestations are
all things that exist in this general space of making the supply chain more
intelligible, especially for automated analysis.

On the human side, we have issues like supporting projects financially to
avoid burnout in maintainers, identifying and raising alarms for deeper
auditing when maintainers change on trusted open source projects, continuing
investment in analysis and improvement to “critical” open source projects
like “xz” which are incorporated widely.

I won’t pretend to have a silver bullet for this situation, and if anyone
else IS pretending they’ve found the solution, they’re likely selling you
something. Especially when the software community is still hard at work
reconstructing the timeline of factual events and understanding the scope
of the impact, it’s too soon to say what all the fixes or systemic
improvements would be. As for counterfactual claims of what “would have”
avoided it, these are slippery swords in the best of times.

At the end of the day, I think we’re best off slowing down on speculation,
focusing on the facts of what happened, what the impact is, and how to
respond to it to mitigate risk and harden systems. As we learn more, we
can also prompt useful discussions of systemic change for better security,
especially where we can enable better scalable discovery or prevention, or
raise auditing alarms earlier. All with the recognition that there is no
one cause, and no single solution.
