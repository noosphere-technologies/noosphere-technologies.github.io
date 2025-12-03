---
title: "Rethinking Agentic Trust: Why \"Delegation\" Might Be the Wrong Model"
description: "In today's conversations about AI agents, the prevailing paradigm is delegation. But this framing is misleading. Agents are autonomous, and we need to design trust accordingly."
pubDate: "Apr 05 2025"
author: "Andrew Brown"
---

Delegation has long been the default metaphor for how we hand authority to machines. In its simplest form, the model is one-to-one: a human empowers a system to act on their behalf. Think of OAuth: I grant Google or GitHub a token that lets them fetch data tied directly to my account. Or JWTs: a signed blob that encodes the human identity, the roles, and the rights being delegated. In both cases, the assumption is the same—authority is rooted in a person, and the protocol exists to extend that person's identity into a system.

The canonical AI example follows the same logic: an agent that can book an airline ticket for you. The workflow is bounded, transactional, and tightly tethered to the human who initiated it. It's delegation as proxy, nothing more.

But autonomous agents blow this assumption to smithereens. Instead of a single bounded act, we're moving into swarms: tens or hundreds of agents, spawned on demand, coordinating with each other to solve problems without direct human oversight. The delegation model—identity rooted in a single human—falls apart here. You don't "delegate" to a swarm. You don't hand over your OAuth token. Instead, you have to think about agent-to-agent (A2A) protocols, where authority and trust emerge from contracts, not inherited human identity.

Here's the problem with the delegation metaphor in a way humans can feel: it's like giving your kid your driver's license and credit card and sending them to the corner store to buy beer. The task may get done, but only by misusing your identity — and the risks multiply with every interaction.

## From Delegation to Hiring

A more realistic model is hiring. You don't hand someone your license and bank card; you evaluate their skills, verify their background, and establish a contractual arrangement that defines the scope of their authority.

The hiring model acknowledges:

- Every agent is an instance of an implementation.
- Agent behavior is non-deterministic — two instances of the same implementation may not act the same way.
- Autonomy is irreducible — once launched, an agent acts independently.

This shift is not just semantic. It realigns trust around what agents are — autonomous digital entities — instead of what they borrow from humans.

## From Security to Trust

Current security models, bound up with delegation, ask: is this agent allowed to act with these permissions?

But in an autonomous world, the better question is: is this agent trustworthy enough to act at all?

That requires a richer trust fabric, where every agent carries:

- Its own credentials (e.g., cryptographically verifiable attestations).
- Its own reputation (performance, compliance, reliability over time).
- Its own history (a track record portable across contexts).

Think of it as LinkedIn for agents — trust profiles that allow humans and other agents to decide who to engage with.

## Trust Handshakes: Agent-to-Agent Collaboration

Most agent workflows will not look like "a single agent acting for a single human." That's already too narrow. Instead, we are entering a world of agent-to-agent (A2A) ecosystems, where tens, hundreds, or even thousands of agents — often orchestrated by frameworks like LangChain or LangGraph — interact to accomplish complex goals.

In these environments, delegation makes no sense. There is no single human identity being passed around. Instead, trust emerges through handshakes between agents:

- Establishing mutual recognition of credentials.
- Evaluating trust signals in real time.
- Deciding whether collaboration is acceptable in the moment.

This looks less like OAuth delegation and JWT impersonation, and more like B2B trust networks, where contracts, attestations, and negotiated agreements govern interactions.

## Implications: Designing for Trust in Agentic Systems

If we pivot from delegation to autonomy, the design of agent ecosystems changes in profound ways:

- **Identity** → Every agent needs its own strong, verifiable identity, distinct from its human sponsor.
- **Hiring Model** → Humans select agents based on credentials, reputation, and history — not by delegating authority.
- **Reputation Systems** → Agents must accrue trust signals over time in robust, portable ways.
- **Runtime Trust Handshakes** → Multi-agent interactions require dynamic trust establishment, not static permissions.
- **Policy Shifts** → Policies should govern who an agent can hire or collaborate with, not just what actions they can take.
- **Auditability** → Agent decisions must be logged, verifiable, and portable across ecosystems.
- **Resilience** → Because behavior is non-deterministic, trust frameworks must tolerate variability and ensure graceful degradation.

## Conclusion

Delegation is a convenient metaphor, but it's the wrong one. OAuth and JWT, built around impersonation and borrowed identity, cannot scale into the world of agent swarms. Agents are autonomous; they require contractual trust, not delegated authority.

Treating agents as hires — entities with their own credentials, histories, and reputations — lets us design ecosystems that are realistic, resilient, and trustworthy. Just as human organizations evolved contracts, HR, and reputation networks, agent ecosystems will need their own. The sooner we abandon delegation and embrace autonomy, the sooner we can build agentic systems that are safe, scalable, and effective.