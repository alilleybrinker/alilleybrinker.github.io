---
title: Renegotiating C
taxonomies:
  topics:
    - Rust
    - Memory Safety
---

Amid the move to memory safe languages, the people who build and build on C and
C++ ought to be recognized. Any of us could be hit by an upheaval of technology
in which we've invested.

<!-- more -->

---

I am tying myself in a knot.

It all started when I read "[You (Probably) Don't Need to Learn C][1]," a good article
which raises good points about the poor arguments people tend to make when defending
the choice of learning C in this day and age. First and foremost: "you should learn
C so you know how a computer really works." The article itself refers then to David
Chisnall's "[C is Not a Low-Level Language][2]," so I'll do the same because it makes the
case better than I can. C is not the computer. C is (maybe) the only interface to
syscalls exposed by the operating system, depending on the system. C is (definitely)
an important part of computing history and computing today.

And yet... "[Some Were Meant for C][3]." When I was an undergraduate I had a classmate
who insisted on doing every assignment, regardless of the class we were taking, in C.
This was in a program which used C++ almost exclusively, except for the "Software
Engineering" class in Java, the web development classes in the obligatory JavaScript,
or the delightful programming languages class which covered Java, Prolog, Scheme, and...
C.

Anyway, this classmate insisted C was the **best** language, the most elegant, the one
in which all of his ideas could be put to the machine in exactly the way he intended.
I didn't understand it at the time, why he would think that, how he _could_ think that.
I toiled in the sweatshop of C++, found slight solace in Haskell code I could appreciate
but neither write nor understand. Eventually I found Rust, and... well... [I like Rust][4].

Several years after I graduated, I was invited back to teach that same old programming
languages class after the prior professor, Dr. Richard Botting, had passed away. It was
essentially an emergency, as the Computer Science department didn't have enough faculty to
cover the number of sessions of the class they needed. They were hiring more, but it would
take time, and they needed someone fast.

By this point I was thoroughly Rust-brained. I'd written my fair share of Rust code, become
the sole Rust evangelist at work, presented at [Rust Belt Rust][5], and written most of the
[Rust Frequently Asked Questions][6] answers. I was, through and through, a Rustacean. So
when I was given the opportunity to teach a class, a class that included _C_ in its curriculum,
my only question was: "can I change the languages?"

I was told "yes," and so I swapped out Haskell for Scheme, and Rust for C.

The full details of this experience became the focus of [my talk at RustConf][7]. The important
bit is this... during the talk I made a joke: "I replaced C with Rust, because it's 2017."
Good joke. Everybody laugh. It was an easy jab at a language against which Rust was clearly
positioned as an alternative, said to an audience all too certain to appreciate it. After all,
who doesn't love being told they're doing the better thing?

However, in the intervening years, some context in the broader ecosystem has changed.
First, a number of companies, their materials dutifully collected by [Alex Gaynor][9]
and then [reported further by Consumer Reports][10], started to report about the prevalence of
memory safety vulnerabilities in their software. The numbers break down to roughly 70%
across many large organizations. That's a big number!

Consumer Reports bumping the news was also a big deal. It helped take the topic across the
barrier of "things the computer nerds talk about" and over to "things the policy world
talks about."

There also started to be bigger, more noticeable cyber security events where software
security in particular was in question (not just security from the interconnection of systems
and their surprising interactions, but literal "the software did an oopsie with memory"
kinds of vulnerabilities leading to exploitation). Heartbleed, a major vulnerability in OpenSSL.
Log4Shell, where people suddenly realized how _omnipresent_ and hard to identify or update some
of this software is.

Not _all_ of this is memory safety related, but I think the memory safety angle seems
appealing to policymakers because it seems both achievable, and relatively clear. If someone
says they have a new building technique for houses that means a substantial portion of houses
that would fall over today wouldn't fall over in the future, you as a policy maker would
probably find that pretty appealing?

So why did memory safety suddenly feel _possible_? I think the answer, unintentionally,
_is_ Rust.

Memory safety isn't _new_. Even in the [latest guidance from CISA][11] they list a number of
non-Rust memory safe languages, used on all sorts of widespread platforms. But crucially,
lots of the "big," "important," real-world stuff is written in C or C++. They're what
the grown-ups use. They weren't memory safe, and there wasn't really a _language_ which
bundled up all the assurance guarantees you might want into a package which is easy to use.

Yeah, some people would write secure C, they'd follow the [MISRA guidelines][12] or they'd run
a bunch of analyzers or they'd hire some consultants to audit the code and give them the
okay. At the end of the day, none of those things had the ease of what you get with a new
language that plays in the same sandbox and has memory safety right out of the gate. So
C and C++ retained their distinction, and their cool, by existing in a little exurb
outside of the megalopolis of memory safety, secure in the knowledge that no one could
_really_ do better without them.

Rust coming along doesn't just challenge that security, it upends that security. I think
this is part of why Bjarne Stroustrup and the C++ Directions Group have [written things
about security and safety][13] that have seemed, at best, difficult to follow, and at worst
filled with anxiety and defensive about the essential nature and continuing compelling
pitch of C++. They haven't been at risk before! To reference an old film, "Oh! I'm in
pain. I think this is what _pain_ feels like."

This is not to say that either language has been resting on their laurels, or that Rust
is set to sweep them off the stage. Despite the imagined lurking of a Rust Evangelism
Strike Force prepared to assist C and C++ in shuffling off their mortal coils, I do
not think it is the expectation of technical leaders at major tech companies, nor
policy makers or thinktankers, to fully eliminate C and C++. There's too much of both
languages around today to get rid of, and we know that replacing old code with new code
has a tendency to introduce new vulnerabilities anyway. In the field of a settled
graveyard, we must be careful digging things up.

Instead, and you can see this borne out in [the responses to the recent ONCD Request
for Input on open source software security][14], many if not most of the respondents
recommend a transition of new code efforts from C and C++ into memory safe languages,
with caution, careful prioritization, and accompanied by other assurance techniques
when such a transition is not feasible or prudent, along with careful protection
and further assurance of the C and C++ code we already have.

Nor, as I think you'll find, do the policy documents, academic papers, and thinktank
recommendations floating around recommend that everyone transition to _Rust_ specifically.
Rust might be the language that helped break the dam on memory safety, but it is
not the _only_ memory safe language. There are many still who recall the mess of
Ada becoming a mandatory programming language in some contexts, and who do not
wish to repeat such an enforced monoculture.

So, to bring it back around, why am I in a knot? I have, through personal preference
and a happy accident of history, invested substantial personal time and energy
into building my knowledge and establishing a degree of personal branding around
a programming language that is now after many years _winning_. Rust is _winning_. It's
[being mentioned in Congressional hearings][15] and recommended by federal agencies.
It's used all over the globe. You can get real jobs in it now. Why am I troubled?

I think we're in the middle of a grand renegotiation of _what C means_ and
_what C++ means_, or what they are in the context of programming, now that they're
no longer hegemonic powers. To borrow from geopolitics a tad, this is the slow
decline of twin empires and the entrance of a new multipolar world. It is new,
and different, and exciting, but also... sad?

I think I'm in knots because I look at the people who have invested so much in C
or C++, who now wrestle with the challenges of what this new world means for them,
and I think that could well be me, down the line. None of us are guaranteed that we
back the right horse in our selections of technologies to learn or "teams" to
invest in. None of us are guaranteed that we win.

Which brings me back to the joke, and my discomfort with it now. Back then, I wanted
to win. I wanted to be superior; to be on the best side, with the best language.
I wanted to be better.

I'd like to [share a video][8]. It's of Simon Peyton Jones, a major contributor to Haskell,
sitting with other programming language geeks at a conference years ago. In the video
he explains, happily, that Haskell is useless, but is slowly becoming more useful.
In the video, the other participants, themselves major contributors to other languages,
jump in with their own funny anecdotes and comments. When I first watched this in my
early 20's I thought it was kinda silly, kinda funny. What I see now is that all of
these people were _friends_. They weren't competitors; in fact they readily copy
each other and learn from each other. In the video they talk about how Haskell
learned things from C#!

It's easy to form cliques, its easy to form monocultures. It's easy to want to win,
and when you win it's easy to gloat.

As the march toward memory safety policy moves closer, I see more and more _angst_
in the comments from C and C++ programmers who are fighting tooth and nail to
preserve the best parts of the thing they love, or to defend themselves and their
own prior choices. I see fear and concern that Rust will become the one true way
they will be forced to take.

Even as we admit that C and C++'s guarantees are no longer sufficient for the
security needs of the day, given the vast important of the software systems
we use and maintain, I don't think we need to condemn the people who have invested
in it, or further mock the C and C++ languages. There are good people involved in
them who are trying hard to improve things, and any work we do today is built on
the shoulders of people who came before and tried other things which may or may not
have worked. There wouldn't be Rust without C++, I imagine, to have paved the way
with many of its own design considerations and choices.

I don't know how this transition will work out. We're in the middle of a grand
renegotiation whose outcome is uncertain. I'm excited to see where it goes.

Yet as I look out across the vista, and see the shore and opportunity that
lies out of sight beyond it, as I board a ship and begin to sail, I can
look below me and remember, "[Some Were Meant for C][3]".

[1]: https://nedbatchelder.com/blog/202401/you_probably_dont_need_to_learn_c.html
[2]: https://dl.acm.org/doi/pdf/10.1145/3212477.3212479
[3]: https://www.humprog.org/~stephen/research/papers/kell17some-preprint.pdf
[4]: https://github.com/alilleybrinker
[5]: https://www.youtube.com/watch?v=Wz2oFEDwiOk
[6]: https://prev.rust-lang.org/en-US/faq.html
[7]: https://www.youtube.com/watch?v=0PhfaFkzdBA
[8]: https://www.youtube.com/watch?v=iSmkqocn0oQ
[9]: https://alexgaynor.net/2020/may/27/science-on-memory-unsafety-and-security/
[10]: https://advocacy.consumerreports.org/research/report-future-of-memory-safety/
[11]: https://www.cisa.gov/case-memory-safe-roadmaps
[12]: https://misra.org.uk/
[13]: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/p2759r0.pdf
[14]: https://www.regulations.gov/docket/ONCD-2023-0002/comments
[15]: https://www.c-span.org/video/?c4808083/user-clip-rust-language-chosen
