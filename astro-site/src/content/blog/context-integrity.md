---
title: "Applications Need Software Integrity. Agents Need Context Integrity."
description: "Context is becoming a category. VCs see trillion-dollar opportunity. Analysts see 'Context as a Service.' But nobody's talking about integrity for the knowledge layer agents reason over."
pubDate: "Mar 2 2026"
author: "Andrew Brown"
---

![Context Integrity](/images/blog-images/context-integrity-2.jpg)

*This is Part 2 of our series on agent security. [Part 1: Agent Context: The New Attack Surface](/blog/agent-context-attack-surface/) established the threat model. This post introduces the solution.*

---

Your agent just approved a $2.4M enterprise contract at startup pricing. The decision logic was flawless. The reasoning was sound. The customer context was poisoned three hops upstream.

This isn't prompt injection. This is something worse.

---

## The Integrity Gap

We've spent a decade building integrity guarantees for different layers of the stack:

- **Content Authenticity** (C2PA): *"Is this image what it claims to be?"*
- **Software Integrity** (SLSA, in-toto, SBOMs): *"Is this binary what it claims to be?"*

These aren't theoretical concerns. We've seen deepfakes undermine elections. We've seen supply chain attacks compromise thousands of organizations through a single poisoned dependency. The response was cryptographic: sign the content, attest the provenance, verify before trust.

But as AI agents become the new runtime—negotiating contracts, approving purchases, coordinating across organizational boundaries—we've left a critical gap.

**Who verifies the context they reason over?**

Google's Agent-to-Agent (A2A) protocol standardizes how agents communicate across enterprises: message formats, task lifecycles, discovery mechanisms. What it doesn't define is how to verify that context received from other agents is authentic, unmodified, and from authoritative sources.

This isn't a protocol bug. It's a missing layer.

---

## Context Is Becoming a Category

We're not the only ones seeing this.

Foundation Capital calls context graphs ["AI's trillion-dollar opportunity"](https://foundationcapital.com/context-graphs-ais-trillion-dollar-opportunity/)—the structured knowledge layers that let AI systems reason over relationships, not just retrieve documents. RAG gave us retrieval. Context graphs give us *understanding*.

Gartner sees it too. Their February 2026 report identifies "Context as a Service" as the next AI revenue surge, with MCP servers enabling a new generation of context infrastructure.[^1]

A new category of memory and context layer startups has emerged—systems that maintain persistent context graphs across agent sessions, enabling continuity and personalization at scale.

The market agrees: context is infrastructure.

But infrastructure without integrity is an attack surface. And right now, **none of these context systems carry cryptographic provenance.**

Every context graph is an unsigned artifact. Every memory layer is an unattested claim. Every "Context as a Service" offering delivers content without credentials.

---

## Beyond Prompt Injection

Security discourse around AI systems focuses heavily on prompt injection—manipulating agent instructions to cause unintended actions. The defenses are familiar: input sanitization, output filtering, instruction hierarchies.

Context poisoning is different. It doesn't manipulate what agents *do*. It corrupts what agents *know*.

A prompt-injected agent executes malicious instructions. A context-poisoned agent executes *legitimate* instructions based on *false premises*. The agent believing Acme Corp is an enterprise customer will offer enterprise pricing—not because it was tricked into a malicious action, but because its foundational understanding of Acme Corp was wrong.

This is what makes context poisoning particularly insidious: the agent's behavior appears completely normal under inspection. Its decision-making process is valid. Its reasoning is sound. Only its inputs are lies.

> *Prompt injection corrupts what agents do.*
> *Context poisoning corrupts what agents know.*
> *The first is a bug. The second is an epistemological attack.*

---

## The Shape of Context

Modern agent context isn't flat. It's structured as **context graphs**—JSON-LD knowledge graphs that represent entities, relationships, and claims.

A pricing decision might traverse:

```
Customer → Contract → Volume Commitment → Discount Tier → Price
```

Each node is an entity. Each edge is a relationship. The agent walks this graph to answer: *"What should Acme Corp pay?"*

This structure is powerful—and dangerous. Attack surfaces multiply:

| Attack | Description |
|--------|-------------|
| **Relationship Fabrication** | Creating false edges between authentic nodes |
| **Authority Injection** | Adding nodes with fabricated permissions |
| **Relationship Severance** | Removing edges to hide constraints |
| **Subgraph Recontextualization** | Embedding authentic subgraphs in malicious frames |

Individual node signatures don't protect against these attacks. The *structure itself* requires attestation.

---

## The Inter-Enterprise Reality

A2A's value proposition is cross-organizational agent collaboration. Your procurement agent negotiates with a supplier's sales agent. Your compliance agent coordinates with a partner's audit agent.

Each interaction crosses trust boundaries.

When context flows from Acme's CRM through Contoso's integration layer to Globex's procurement system, each organization maintains distinct infrastructure, security postures, and incentives. The recipient cannot verify that context originated from the claimed source. They can only authenticate the immediate sender via TLS.

Three organizations. Three security perimeters. Zero end-to-end context verification.

---

## Why TLS Isn't the Answer

TLS provides real security guarantees: server authentication, confidentiality, in-transit integrity. But its threat model doesn't match agent context flows:

**Connection vs. Content Authentication**
TLS authenticates *endpoints*, not *payloads*. A malicious counterparty with a valid certificate can send completely false context through a perfectly secure connection.

**Hop-by-Hop Protection**
Content decrypts at each intermediary. TLS protection ends at every hop.

**No Non-Repudiation**
Ephemeral session keys mean no cryptographic proof binding senders to messages.

**Wrong Question**
TLS answers: *"Am I connected to the right domain?"*
Agents need: *"Should I trust this specific claim from this specific entity?"*

---

## Introducing Context Integrity

**Context Integrity** is cryptographic verification that the semantic context an AI agent reasons over is authentic, unmodified, and attributable to authoritative sources.

It's the application of the same pattern—content binding, signer identification, provenance chains—to the knowledge layer.

| Layer | Question | Established Solution |
|-------|----------|---------------------|
| **Software Integrity** | Is this code trustworthy? | SLSA, in-toto, SBOMs |
| **Content Authenticity** | Is this media real? | C2PA manifests |
| **Context Integrity** | Is this context authentic? | *What we're building* |

Context Integrity isn't a new primitive. It's the convergence of proven patterns, applied to the artifacts agents actually depend on: JSON-LD context graphs, capability tokens, session state, business facts.

---

## The Properties

Context Integrity requires five properties:

### 1. Content Binding
Context graphs must be cryptographically bound to a hash. We use RDF canonicalization (URDNA2015) to ensure identical graphs produce identical hashes regardless of serialization.

### 2. Signer Identification
Signatures bind to Decentralized Identifiers (DIDs)—cryptographic identifiers supporting granular delegation. *This key signs pricing claims; that key signs identity assertions.*

### 3. Provenance Chains
Composed context carries full provenance. Each component's attestation travels with the composition. Verifiers evaluate trust at every link.

### 4. Temporal Validity
Attestations carry trusted timestamps. Freshness policies prevent replay. A valid signature on stale context is still a vulnerability.

### 5. Policy Integration
Trust isn't binary. Policy engines evaluate: *Which signers? For which claims? Under what conditions?*

---

## Building on Standards

We're not inventing cryptography. Context Integrity assembles proven components:

| Component | Standard |
|-----------|----------|
| Attestation format | SLSA / in-toto |
| Identity | W3C DIDs |
| Signatures | COSE / JWS |
| Canonicalization | URDNA2015 (RDF) |
| Capabilities | W3C Verifiable Credentials |
| Timestamps | RFC 3161 |

The work is integration—making these standards compose cleanly in agent context flows.

---

## The Cost of Inaction

Context is becoming a category. Investment is flowing. Infrastructure is being built.

But without integrity, every context graph is an unverified claim. Every memory layer is a potential attack vector. Every "Context as a Service" is a trust-me proposition.

The attack surface isn't the agent. It isn't the protocol. It's the unsigned context flowing through both.

---

## Conclusion

We've proven we can sign media. Content Authenticity is shipping in cameras and social platforms.

We've proven we can sign software. Software Integrity is a federal procurement requirement.

Now we sign the truth agents act on.

Context Integrity isn't optional. As agents become the primary interface for cross-organizational collaboration, unattested context becomes the primary attack vector.

The primitives exist. The standards exist. The patterns are proven.

**We're building the integration layer.**

---

## Build With Us

We're developing Context Integrity infrastructure for A2A and MCP—message-level security for the knowledge layer agents reason over.

If you're building agent systems that cross trust boundaries, we should talk.

<a href="https://www.noosphere.tech/contact" style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; font-size: 18px; font-weight: 600; text-decoration: none; border-radius: 8px; margin: 24px 0;">Get in Touch →</a>

---

[^1]: All Gartner quotes sourced from "Emerging Tech: AI Vendor Race: MCP Servers Will Fuel the Next AI Revenue Surge — 'Context as a Service,'" Gartner Research, 19 February 2026. Gartner clients can access the report [here](https://www.gartner.com).
