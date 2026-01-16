---
title: "Rust's Culture of Semantic Precision"
taxonomies:
  type:
    - Mini
  topics:
    - Rust
---

Last week, LWN published ["`READ_ONCE()`, `WRITE_ONCE()`, but not for Rust"][lwn],
which described an issue encountered as part of integrating more Rust into
the Linux kernel: namely that the `READ_ONCE` and `WRITE_ONCE` macros are in
practice used for diverging purposes in different contexts, implicitly encoding
an inconsistent set of semantic guarantees. The article then describes how the
Rust contributors to Linux are working to determine how to more accurately
express the _specific_ semantic guarantees associated with the Rust-side of
APIs which use these macros on the C-side.

This situation, of identifying an API which is implicitly encoding multiple
distinct semantic guarantees, and thereafter wanting to disentangle them, is
a familiar one for Rust developers. One little-discussed cultural norm in the
Rust ecosystem is that APIs should be designed to encode semantic guarantees
_as precisely as possible_.

This is shown in things like the design of container types, such as Rust's
various "cell" types (`Cell`, `RefCell`, `OnceCell`, etc.), as well as
pointer-associated types such as `Unique` (internal to the Rust standard
library, where it is used heavily) or `NonNull` (part of the `std::ptr` API).
As Manish Goregaokar described in ["Wrapper Types in Rust: Choosing Your
Guarantees"][manish], Rust tries to disentangle unique semantic guarantees
which users can then compose together to express _precisely_ what they need.

It also appears in Rust's ongoing discussion around [amending the `Copy` /
`Clone` trait hierarchy to enable more precision][handle]. `Copy` is a trait
intended for types which are trivially-copyable, meaning their full contents
can be copied with a single `memcpy`. `Clone` is intended for more "expensive"
copies, for example copies which require duplication of data on the heap and
adjustment of pointers to point to the copied data. Over time, Rust developers
have identified types with a different sort of copy semantics, such as `Rc` or
`Arc`, where cloning the data in fact means cloning _the handle_ to the
underlying data, not the data itself.

The Rust community's desire for precise semantics, in the long run, leads to
more robust software systems. In the short run, as the Linux devs are
encountering, it can be challenging to introduce greater semantic precision in
systems which were previously more ambiguous about guarantees and requirements.
Personally, I'm glad Rust has this norm, and it's something I find appealing
about Rust as a _culture_, not just a language, and I remain optimistic that
Linux will be better off because of it.

[lwn]: https://lwn.net/SubscriberLink/1053142/8ec93e58d5d3cc06/
[manish]: https://manishearth.github.io/blog/2015/05/27/wrapper-types-in-rust-choosing-your-guarantees/
[handle]: https://smallcultfollowing.com/babysteps/blog/2025/10/07/the-handle-trait/
