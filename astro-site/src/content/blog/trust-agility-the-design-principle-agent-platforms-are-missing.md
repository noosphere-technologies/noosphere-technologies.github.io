---
title: "Trust Agility: The Design Principle Agent Platforms Are Missing"
description: "The Web PKI failed not because cryptography is hard, but because it eliminated trust agility. Agent platforms are repeating the mistake."
pubDate: "Feb 20 2026"
author: "Andrew Brown"
---

In 2011, Moxie Marlinspike gave a talk called "SSL and the Future of Authenticity" that should be required viewing for anyone building agent infrastructure today. His core critique wasn't about encryption or key lengths—it was about *trust agility*.

Trust agility is the ability to choose who you trust, and to change that choice when circumstances warrant. The Web PKI systematically eliminated it.

When you open a browser, you inherit over 100 root certificate authorities. Governments you've never heard of. Companies whose due diligence you can't verify. Any of them can issue a certificate for any domain. You didn't choose these trust anchors. You can't remove them without breaking the web. You have no agility.

This isn't a theoretical concern. When DigiNotar was compromised, attackers issued fraudulent certificates for Google, Microsoft, Yahoo, and the Tor Project. The Iranian government used them for surveillance. DigiNotar was just one CA among hundreds. Users had no way to know, no way to opt out, and no recourse until browser vendors—months later—pushed updates to remove DigiNotar from their root stores.

Moxie's point was architectural: the PKI model traded trust agility for convenience, and the tradeoff was catastrophic.

## The Pattern Repeating

OpenClaw is the fastest-growing agent platform in history—180,000 GitHub stars in three months. Its security model relies on pairing codes, session tokens, and OAuth scopes. When you ask "who can this agent talk to?" the answer is: anyone in the session allowlist. When you ask "which skills can it install?" the answer is: anything on ClawHub.

This is trust without agility. Users inherit whatever trust decisions the platform made. There's no mechanism to say "I trust agents from my organization but not from this vendor." There's no way to require that skills come from publishers in my trust network. The platform decides; users comply.

The same pattern appears across the agent ecosystem. MCP servers authenticate via API keys. LangChain agents inherit permissions from their runtime environment. The assumption is always the same: trust is configured once, at the platform level, and inherited by everyone downstream.

We've seen where this leads.

## Why Trust Agility Matters More for Agents

The Web PKI authenticated servers to humans. A person could, in theory, inspect a certificate, notice something wrong, and navigate away. The cost of a mistake was visiting the wrong website.

Agent systems have no human in the loop. Agents spawn agents. Agents delegate to agents. Three hops deep, who authorized what? The padlock icon doesn't exist here. The cost of a mistake isn't a phishing page—it's an agent with shell access acting on fabricated authority.

Worse, agent ecosystems are compositional. A workflow might involve agents from multiple vendors, skills from multiple publishers, credentials from multiple issuers. In the web model, you visit one site at a time. In the agent model, you're trusting a supply chain on every invocation.

If trust agility mattered for websites, it's existential for agents.

## What Trust Agility Requires

Trust agility isn't a feature—it's a design constraint. Systems that provide it share certain properties:

**Explicit trust anchors.** You declare who you trust. Not inherited from a platform. Not pre-installed by a vendor. Your organization specifies its trust roots, and those roots are the only ones that matter.

**Composable trust relationships.** Trust isn't binary. You might trust Acme Corp for procurement agents but not for security tooling. You might trust a vendor's agents but not their skills. The system must express these distinctions.

**Revocable without disruption.** If you discover a trust anchor is compromised, you remove it. Immediately. Without waiting for a platform vendor to push an update. Without breaking every workflow that doesn't depend on that anchor.

**Transparent reasoning.** When an agent is denied access, you can see why. When trust is granted, you can trace the chain. No black-box decisions.

**Decentralized authority.** No single entity should be able to revoke your identity or prevent you from proving who you are. This is what Moxie meant when he talked about the problem of "anybody can sign for anybody." The fix isn't better CAs—it's eliminating the need for CAs.

## The trust.txt Hypothesis

One approach we've been exploring is trust.txt—a simple, DNS-like mechanism for declaring organizational trust relationships:

```
# trust.txt for acme.com
member=subsidiary.acme.com
belongto=industry-consortium.org
vendor=trusted-supplier.com
```

The file lives at `/.well-known/trust.txt`. It's crawlable, machine-readable, and under the domain owner's control. No certificate authority required.

From these declarations, you can build a graph. Nodes are organizations. Edges are relationships. When an agent from `newvendor.com` wants to interact with your system, you query the graph: is there a path from my trust anchors to this entity? What's the path length? What relationship types does it traverse?

This isn't a complete solution—it's a foundation for trust agility. Organizations choose their anchors. Relationships are explicit. Revocation is immediate (delete the line). Reasoning is transparent (traverse the graph).

## The Harder Problem: Capabilities

Trust agility for identity is necessary but not sufficient. Even if you can verify that an agent is who it claims to be, you still need to answer: what is it authorized to do?

The Web PKI never solved this. A certificate proves you're talking to `bank.com`—it says nothing about what `bank.com` is allowed to do with your data. Identity and authorization were always separate concerns, bolted together awkwardly through application-level logic.

For agents, we can't repeat this mistake. An agent's identity must be bound to its capabilities: what actions it can take, under what constraints, with what limits. Verifiable Credentials offer one path—cryptographically signed assertions about what an agent is authorized to do, issued by entities you've chosen to trust, verifiable without consulting a central authority.

But that's a topic for another post.

## Conclusion

The lesson from PKI isn't that cryptography is hard or that security is expensive. The lesson is that architectural decisions about trust have long-term consequences. The CA model traded trust agility for deployment convenience, and we spent two decades patching the damage.

Agent platforms are at the same inflection point. The expedient path—OAuth scopes, session tokens, platform-managed trust—will work for demos. It won't work for production systems where organizations need to control who they trust, revoke that trust when needed, and understand why their agents behave as they do.

Trust agility isn't a feature request. It's a design constraint. Systems that ignore it will face their own DigiNotar moment. The only question is when.
