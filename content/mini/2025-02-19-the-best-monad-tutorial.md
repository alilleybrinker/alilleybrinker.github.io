---
title: "The Best Monad Tutorial Ever Written"
taxonomies:
  type:
    - Mini
  topics:
    - Rust
    - Programming
---

When [Rain] mentioned recently they had a draft monad tutorial that explains
them _without mathematical jargon_, with _practical examples_, and as a
_design pattern_, I knew it was going to be good. Of course, it is __even
better than I hoped__.

["Demystifying monads in Rust through property-based testing"][article] is an
undersell of a title. If you've floated around the world of functional
programming long, you've probably seen one of the many attempts at explaining
monads. Many are from the perspective of a formalism—the monad laws—and
written with Haskell—the language that made them a central feature with
syntactic sugar and a direct to how IO is done.

Rain instead introduces monads with a practical example of how their
flexibility actually makes some work harder, motivated with a concrete example
of how "shrinking," a core operation for doing practical property-based
testing, becomes much more difficult when monadic operations are used to
generate test inputs. Instead of Haskell, the tutorial uses Rust.

Thanks Rain for the best monad tutorial I've ever read!

[Rain]: https://bsky.app/profile/sunshowers.io
[article]: https://sunshowers.io/posts/monads-through-pbt/
