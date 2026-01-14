---
title: "Passkey PRFs and the Passkey Loss Blast Radius"
taxonomies:
  type:
    - Mini
  topics:
    - Authentication
---

Yesterday, [Ars Technica reported][ars] on [Confer][confer], an AI company
created by [Moxie Marlinspike][moxie], who also created the secure messaging
app/protocol [Signal][signal].

In Confer's blog post ["Making end-to-end encrypted AI chat feel like logging
in,"][blog_post] Moxie writes about how Confer uses passkey PRFs to encrypt
chats. As the blog post describes, the PRF extension allows Confer to derive
a new key deterministically from a user's passkey, so they can then use this
new key to encrypt other material.

While passkey PRFs are powerful, and have legitimate uses, they carry a real
risk: __passkey PRFs increase the blast radius of passkey loss.__

When a passkey PRF is used to encrypt material associated with a user, and
that user loses their passkey, the encrypted material is also lost. Today, if
a user loses a passkey used to log in to a service, they can usually recover
their account _somehow_, but if materials tied to that account were encrypted
with a passkey PRF, those materials are gone even when the user regains account
access.

Passkey loss can happen for many reasons! Loss of a device or hardware token
for keys that aren't synced, lockout from a platform (such as an Apple ID)
for passkeys kept in a platform-specific keystore, or even a user's death for
passkeys whose decryption mechanism expects biometrics. The fact that people
have repeatedly lost cryptocurrency keys worth enormous sums of money shows that
even with strong financial incentives, mistakes happen and keys get lost.

So while passkey PRFs are _powerful_ (they let you tie encryption material to
an authenticated user's private key), they also require platforms to prepare
users for what they'd lose if their passkey is lost.

The Confer article lists alternatives, such as giving the user a long passphrase
to remember (which many will forget or store insecurely), encrypting based on a
user's password (which is phishable), or using a device-key (which blocks
cross-device access). These trade-offs make passkey PRFs compelling! It's just
worth remembering it's not a free lunch.

[ars]: https://arstechnica.com/security/2026/01/signal-creator-moxie-marlinspike-wants-to-do-for-ai-what-he-did-for-messaging/
[confer]: https://confer.to/
[moxie]: https://en.wikipedia.org/wiki/Moxie_Marlinspike
[signal]: https://signal.org/
[blog_post]: https://confer.to/blog/2025/12/passkey-encryption/
