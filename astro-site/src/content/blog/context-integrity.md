---
title: "Context Integrity: The Missing Layer for Trusted AI Agents"
description: "Content authenticity solved the problem of verifying images. Context integrity solves the problem of verifying the knowledge AI agents act on."
pubDate: "Feb 25 2026"
author: "Andrew Brown"
---

We've solved content authenticity. C2PA lets you verify that a photo wasn't AI-generated, that a video hasn't been tampered with, that media can be traced back to its source.

But here's what we haven't solved: **context authenticity**.

When an AI agent receives a piece of knowledge—a fact, a policy, a customer preference—how does it know that information is legitimate? Where did it come from? Who authored it? Has it been modified? Is it current?

Today, agents trust blindly. That's fine for demos. It's catastrophic for enterprise.

## The Problem: Unverified Context

Consider what happens when Agent A tells Agent B that "the customer prefers enterprise pricing":

- Where did that information originate?
- Who authorized it?
- When was it last updated?
- Has anyone modified it in transit?
- Is Agent A even authorized to make that claim?

In current architectures, Agent B has no way to answer these questions. It simply trusts the context it receives and acts accordingly.

This is the equivalent of running a web application without SSL—transmitting sensitive data with no encryption, no verification, no chain of trust.

We would never do that for data in transit. Why do we accept it for knowledge in action?

## Content vs. Context

The distinction matters:

**Content authenticity** answers: "Is this image real?"
**Context integrity** answers: "Is this knowledge trustworthy?"

Content authenticity protects humans from synthetic media. Context integrity protects AI agents from acting on unverified information.

C2PA gave us cryptographic manifests for images and video. We need the same infrastructure for the knowledge graphs, context windows, and semantic data that AI agents consume.

## What Context Integrity Requires

A context integrity system must provide:

**1. Provenance**
Every piece of context must trace back to its origin. Not just "where did this come from?" but "what was it derived from?" and "who touched it along the way?"

**2. Versioning**
Context changes over time. The customer preference that was true last week may not be true today. Agents need to know not just what the context says, but when it was authored and whether it's been superseded.

**3. Cryptographic Verification**
Provenance claims are worthless without proof. Context must be signed by identifiable parties, with signatures that can be verified independently.

**4. Policy Enforcement**
Not all context should be trusted equally. Agents need policies that govern what sources they trust, what signatures they require, and what freshness guarantees they demand.

**5. Runtime Validation**
Verification can't happen only at ingestion time. As agents compose context from multiple sources, integrity must be validated continuously—at runtime, before action.

## The Architecture

Context integrity requires a new layer in the AI stack:

```
┌─────────────────────────────────────────┐
│           AI Agent / LLM                │
├─────────────────────────────────────────┤
│         Context Integrity Layer         │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │Provenance│ │ Policy  │ │ Runtime   │ │
│  │Verification│ │ Engine │ │ Validation│ │
│  └─────────┘ └─────────┘ └───────────┘ │
├─────────────────────────────────────────┤
│     Context Sources (RAG, APIs, MCP)    │
└─────────────────────────────────────────┘
```

This layer sits between context sources and the AI systems that consume them. Every piece of context passes through verification before it reaches the agent.

The building blocks exist:

- **C2PA** for cryptographic manifests
- **in-toto** for supply chain attestations
- **DIDs** for decentralized identity
- **Verifiable Credentials** for capability assertions
- **Cedar** for policy-as-code

What's been missing is the integration layer that brings these together for AI agent context.

## The Stakes

The agent economy is coming. Google's A2A protocol, Anthropic's MCP, OpenAI's Assistants API—the infrastructure for autonomous agents is being built now.

These agents will:
- Make purchasing decisions
- Provision infrastructure
- Negotiate with other agents
- Act on behalf of organizations

When agents operate on unverified context, every one of these actions becomes a vector for manipulation. Feed an agent bad context, and it will faithfully execute bad decisions.

This isn't a theoretical risk. It's the natural consequence of building autonomous systems without integrity guarantees.

## The Opportunity

Content authenticity became critical infrastructure because we recognized that synthetic media threatens trust in what we see.

Context integrity will become critical infrastructure because autonomous agents threaten trust in what systems do.

The organizations that solve this problem—that provide the PKI for the agent economy—will own a foundational layer of the AI stack.

C2PA solved content authenticity for humans.

Context integrity solves context authenticity for agents.

---

*We're building the infrastructure layer for trusted AI agent ecosystems. Context graphs with cryptographic provenance. If you're working on agent systems and thinking about trust, [let's talk](/contact).*
