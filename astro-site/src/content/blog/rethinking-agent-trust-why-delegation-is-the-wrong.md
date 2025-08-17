---
title: "Rethinking Agentic Trust: Why \"Delegation\" Might Be the Wrong Model"
description: "In today's conversations about AI agents, the prevailing paradigm is delegation. But this framing is misleading. Agents are autonomous, and we need to design trust accordingly."
pubDate: "Apr 05 2025"
author: "Andrew Brown"
---

The way we think about AI agents is fundamentally broken. We keep using the language of delegation—as if agents are just fancy tools we control. But agents don't follow orders; they make decisions. They're not extensions of our will; they're autonomous entities with their own logic, credentials, and failure modes. Until we accept this reality, we'll keep building the wrong security models.

The truth is: agents are autonomous. They are not simple extensions of human authority. They act on their own, with their own decision-making logic, their own credentials, and their own histories. To design safe, productive multi-agent ecosystems, we need to accept this autonomy and model trust accordingly.

## From Delegation to Hiring

Instead of delegating, think of working with agents the way you hire someone. You don't delegate your identity to them; you evaluate their skills, experience, and reputation, and then hire them to act on your behalf. The hiring model acknowledges:

- Every agent is an instance of an implementation.
- Agent behavior is non-deterministic: two instances of the same implementation may not act in exactly the same way.
- Autonomy is irreducible: once launched, an agent acts independently.

This is a more accurate metaphor than delegation, and it has critical design consequences.

## From Security to Trust

Current models focus on security in the context of delegation — verifying whether an agent is allowed to act with certain permissions. But if we accept autonomy, the emphasis shifts:

- It's not only about what the agent is allowed to do.
- It's about whether the agent is trustworthy enough to do it at all.

This means designing systems where each agent has:

- Its own credentials (e.g., verifiable attestations).
- Its own reputation (documented performance, reliability, compliance).
- Its own history (track record across contexts).

In other words, we need the equivalent of LinkedIn for agents: a system of trust profiles that let humans (and other agents) decide who to work with.

## Trust Handshakes: Agent-to-Agent Collaboration

At runtime, agents will often need to collaborate in multi-agent workflows. Here, too, delegation breaks down. Agents don't simply inherit human authority. Instead, they must engage in trust handshakes with other agents:

- Establishing mutual recognition of credentials.
- Evaluating trust signals in real time.
- Deciding whether collaboration is acceptable in the moment.

This is more like B2B trust networks than like a single hierarchy of delegated access.

## Implications: Designing for Trust in Agentic Systems

If we pivot from delegation to autonomy, the design of agent ecosystems changes in profound ways. A few key implications:

- **Identity** → Every agent needs its own strong, verifiable identity, distinct from its human sponsor.
- **Hiring Model** → Human users select agents based on credentials, reputation, and history — not just by delegating authority.
- **Reputation Systems** → We need robust reputation layers, where agents accrue trust signals over time.
- **Runtime Trust Handshakes** → Agent-to-agent interactions must be based on dynamic trust establishment, not static permission grants.
- **Policy Shifts** → Policies should govern who an agent can hire or collaborate with, not just what actions they can perform.
- **Auditability** → Histories of agent decisions need to be logged, verifiable, and portable across ecosystems.
- **Resilience** → Because agent behavior is non-deterministic, trust frameworks must tolerate variability and ensure graceful degradation.

## Conclusion

Delegation is a convenient metaphor, but it's the wrong one. Treating agents as autonomous — as hires rather than proxies — allows us to build more realistic, resilient, and trustworthy systems. Just as human organizations evolved HR, reputation, and trust networks, agent ecosystems will need their own. The sooner we adopt the right model, the sooner we can design agentic systems that are safe, scalable, and effective.