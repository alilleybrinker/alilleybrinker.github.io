---
title: “Implementation Selection” in Rust
taxonomies:
  topics:
    - Rust
---

A common problem in programming is when you want the path of options for "what happens
next" to split. In structured programming this would generally come in the form of
a series of `if`/`else if`/`else` (or whatever the syntax is in your preferred language),
or a `switch` if your language supports it. Maybe you have a ternary operator for a more
compact `if`/`else`. _Maybe_ you go whole-hog and have some array of function pointers
to embed the selection into data. Whatever way you slice it, you have paths of control
flow, and you want to choose between them in a structured fashion.

<!-- more -->

Another way to enable this kind of selection is through the use of polymorphism. In an
Object-Oriented framing, this might mean subtype polymorphism via the use of child classes
of some shared parent class. This notion is in some way an extension of the "array of
function pointers" approach, except instead of an explicit array of function pointers like
you might find in C, you instead have, for each object, an implicit set of function pointers
for the method implementations in each subclass, and the language dispatches to those
based on the concrete type being handled.

Depending on the language, the nature of overriding, method lookup, etc. may differ, but the
general notion is the same. Objects have some associated set of functions to which function
calls in the caller are dispatched according to the concrete type. We've elevated
implementation from the value level to the type level. This is convenient!

In Rust, my own preferred language, you have instead a nice little grid of four options
for "implementation selection," which vary based on whether dispatch is done at compile
time or run time, and whether the set of types which may be used is "open" (meaning
third-parties can use their own types) or "closed" (meaning only the types intended by the
original creator may be used).

|                     | Resolved at compile time          | Resolved at runtime |
|:--------------------|:----------------------------------|:--------------------|
| Open set of types   | Generics params with trait        | Trait objects       |
| Closed set of types | Generic params with sealed traits | Enum                |

Let's cover each of these in turn:

## 1. Generic Parameters with Traits

This is Rust's standard mechanism for parametric polymorphism. You have a generic function,
with the generic type bounded by some trait(s). In this case, the calls to the generic
function are resolved at compile time, meaning the generic function is monomorphized to produce
a non-generic copy of it specialized for each concrete type the function is called with,
and the newly-generated concrete functions are swapped in for the generic function at the callsite.

This gives you fast run time behavior (no dispatching / pointer chasing to do), but you
spend a bit more time on code generation during compilation, and the object file size generally
gets bigger. It also limits separate compilation, because the generic code needs to know the
concrete type(s) it's getting called with.

You also, crucially, don't control the types which can be passed to the generic function. In
this category, the trait(s) involved are public, so third-parties can implement them for their
own types. This is _usually_ desirable, as it lets you write flexible APIs that expand to fit
future needs or the needs of others which you can't predict.

## 2. Generic Parameters with Sealed Traits

In this quadrant, the trade-offs are the same as for generics with unsealed traits, with the
exception that you've now limited the set of types to be "closed." So now, the _only_ types
which can be passed to the generic function are _your own_ types which have implemented the
relevant trait.

This lets you have the benefits of generics in your own code without exposing a generic API
you don't actually intend to be generic.

On the other hand, consumers of your code may be put off by seeing a generic mechanism which
they can't actually use (we often want whatever we can't have), and it also means more complex
function signatures versus manually (or with the help of macros) writing out each version of
the function for the concrete types by hand.

## 3. Trait Objects

Trait objects work like generic parameters with traits, in that a function can be polymorphic
over the concrete type they're handling, but it moves function dispatch from compile time to
run time. There are some limitations here, namely that not all traits in Rust can be made into
trait objects (this limitation is based on "object safety," and the specific rules basically
codify that only traits whose dispatch _can_ be handled at run time can be made into trait
objects).

Trait objects are powerful, and I've actually written about them before. On Possible Rust I
write ["3 Things to Try When You Can't Make a Trait Object,"][pr_trait_object]. Looking back
at that article now, I realize the first two suggestions are literally suggestions to move
on step in either direction on the grid I shared at the start of this article. Option 1 is
"Try an enum" (meaning close the set of types which is currently open), Option 2 is
"try type erasure" (meaning use a trick from David Tolnay to span a non-object safe trait
into an object-safe equivalent trait so you _can_ make a trait object). So option 1 is
about moving down one in the quadrant, and option 2 is about moving to the left.

At any rate, trait objects are great, and powerful, though you pay a cost with run time
dispatch. You should benchmark and see if that cost is relevant for you.

## 4. Enumerations

Finally, `enum`s, one of Rust's most powerful features. Enums let you list a set of
data-carrying variants, one of which will be present at runtime. Then, when using
the enum type, you `match` (or use a `match`-equivalent) to select the right behavior.

This is, conceptually, similar to the good-old `if`/`else if`/`else` chaining, or to
`switch`, but with the added benefit of exhaustiveness checking. The compiler makes sure
you cover _all_ possible variants of the enum when selecting the right behavior, so you
don't miss any possibilities.

## Conclusion

Nothing said in this post is revelatory, but hopefully it provides a helpful description
of the option space here when you want to be able to have some "implementation selection"
in your program. Just remember the table:

|                     | Resolved at compile time          | Resolved at runtime |
|:--------------------|:----------------------------------|:--------------------|
| Open set of types   | Generics params with trait        | Trait objects       |
| Closed set of types | Generic params with sealed traits | Enum                |

[pr_trait_object]: https://www.possiblerust.com/pattern/3-things-to-try-when-you-can-t-make-a-trait-object
