---
title: Softlocking APIs
taxonomies:
  type:
    - Blog
  topics:
    - API Design
---

We can learn from case studies of APIs forever trapped by past decisions. Just
like a video game can softlock and become impossible to progress, so too can
APIs become softlocked by technical and social commitments.

<!-- more -->

---

"Softlocking" is a term in the world of video games where a game is playable, but can't
make forward progress. Usually this means the game has a bug, or that the designers and
quality assurance testers missed some combination of steps that leads to an inability
to complete the game. It's basically a video game version of "livelock" failures in
concurrent programs, but "softlock" is (to me) the more fun term, so let's use it.

There are situations in API design where the API is softlocked into a broken design
which can't be fixed. This can happen for a few reasons:

1. The API makes specific guarantees around what is allowed to change, and one of the
   things that's not allowed to change would _have_ to change to fix the issue.
2. Changing the broken API would result in breaking some uses of it, and the API
   maintainers have a policy of not breaking users.
3. Changing the broken API would result in severe performance problems without much
   broader API changes which are untenable for reasons 1 or 2.

There are some interesting examples of this in the wild, including:

* The C standard can't fix the definition of `intmax_t`, because of how C linking
  works and C's guarantee not to break the Application Binary Interface (ABI). You
  can read [a good explanation of this from JeanHeyd Meneide][intmax_t].
* PowerShell can't fix its support for .NET classes, because of specific constraints
  on how PowerShell scripts are defined and executed, along with breakage issues. The
  [PowerShell issue tracker][pwsh] shows the extensive issues still open after more than 6
  years because of this.

In this situation, the tension basically arises between three remaining choices:

* Break users by changing the known-broken API _anyway_.
* Introduce a new thing that isn't broken and encourage users to migrate.
* Accept the brokenness and do your best to mitigate around the edges of it.

All of these have serious challenges associated with them.

First, breaking users is a big deal. People get very upset when software that works
today stops working tomorrow because something changed underneath them. Depending on
the scale of breakage, the required work to respond to it may also be substantial. In
the C case, breaking the ABI means all users of the changed API would need to recompile
their code in order to link successfully, and they might not even _know_ they need to do
that because the broken linked code may just silently do the wrong thing.

Breaking users puts software projects at risk of community fracture or project abandonment,
and should never be taken lightly.

Second, introducing a new API raises the question of how you tell people to move to the new
API. It becomes something you have to permanently document and direct people toward. In some
cases (looking at C again), you may also have a policy of not introducing new warnings for
people, so you may not even be able to mark the old broken API as deprecated to programatically
warn users away from it, relying _solely_ on documentation and public communication.

You often also end up beholden to supporting both the old known-broken thing _and_ the new
thing, forever (or at least for an extended period). This burden of double maintenance
can be substantial and may strain the resources of the software project.

Third, accepting the brokenness means the API _remains broken_, and you now have a wart
in your system which you will still likely want to warn people to stay away from through
documentation and socialization amongst software engineers. You basically decide not to
solve a problem because the solutions are _worse_. It also opens up the possibility that
the accumulation of unfixable problems may one day give rise to a completely different
alternative project that is not constrained by the limits of compatibility with poor
decisions from the past.

All of this is to say that making commitments about stability and API guarantees can
be a fraught issue, and that even if explicit commitments aren't made, users will often
rely on observable attributes of a design anyway, and thereby constrain you. There are
_no_ guarantees that you can avoid accidentally softlocking into a bad design, and
in the end the ways out of it are shaped both by the remaining flexibility you do have
to induce breakage, both _technically_ and (possibly more importantly) _socially_.

Systemic designs which promote modularity and interconnectedness, like the C model of
separately compiled object files which may be linked together, have many benefits,
but they also have the trade-off of locking in prior decisions in ways that can
substantially constrain future improvement. Care must be taken in API design to avoid
API softlocks, and more importantly to establish processes for managed evolution in
ways that mitigate pain for users while maximizing flexibility for API maintainers,
along with the social infrastructure for documentation and communication to manage
transitions. Only with those in place can you avoid the pain of API design softlocks.

[intmax_t]: https://thephd.dev/intmax_t-hell-c++-c
[pwsh]: https://github.com/PowerShell/PowerShell/issues/6652
