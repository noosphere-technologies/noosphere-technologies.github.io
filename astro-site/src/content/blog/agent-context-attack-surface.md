---
title: "Agent Context: The New Attack Surface"
description: "A2A defines how agents exchange messages. It doesn't define how to verify them. Context poisoning exploits this gap."
pubDate: "Mar 2 2026"
author: "Andrew Brown"
---

![Agent Context Attack Surface](/images/blog-images/context-poisoning.jpg)

Google's Agent-to-Agent protocol represents a significant step toward standardizing how AI agents communicate across organizational boundaries. It defines message formats, task lifecycles, streaming patterns, and discovery mechanisms. What it doesn't define—and what no agent protocol currently defines—is how agents should verify the context they receive from one another.

This gap creates an attack surface that will only grow more significant as agent systems become more prevalent in enterprise environments. The attacks that exploit this surface don't target the agents themselves. They target the knowledge agents rely on to make decisions.

## The Distinction That Matters

Security researchers have spent considerable effort on prompt injection—techniques that manipulate what an agent is instructed to do. These attacks insert malicious instructions into prompts, tricking agents into executing unintended actions. Defenses have emerged: input sanitization, output filtering, sandboxed execution.

But there's a different class of attack that hasn't received the same attention. Where prompt injection manipulates instructions, context poisoning manipulates beliefs. The difference is subtle but profound. An agent with poisoned context doesn't execute malicious instructions. It executes perfectly reasonable instructions based on false premises. Its reasoning is sound. Its conclusions follow logically from its inputs. The problem is that its inputs have been corrupted.

Consider an agent that negotiates pricing based on customer tier. If the agent believes a customer is an Enterprise account when they're actually a Startup, it will offer Enterprise pricing—not because it was tricked into doing so, but because it genuinely believes that's the appropriate action given the customer's status. The agent behaves correctly according to its context. The context is wrong.

This makes context poisoning particularly insidious. The agent's behavior appears normal under inspection. Its decision-making process is valid. The corruption isn't in the logic; it's in the premises the logic operates on.

## How A2A Carries Context

To understand where the vulnerabilities lie, we need to examine how A2A actually moves information between agents.

A2A structures communication around messages containing Parts. These Parts are the atomic units of information exchange. A TextPart carries natural language—the kind of conversational content you'd see in a chat interface. A FilePart references binary artifacts like documents or images via URI. And a DataPart carries structured data as JSON objects.

Of these three, DataPart is where the real action happens. When an agent needs factual information to make a decision—a customer's spending history, a contract's renewal date, whether someone is authorized to approve a discount—that information arrives as structured JSON in a DataPart. The agent parses this JSON, extracts the relevant values, and uses them as the factual basis for its reasoning.

In practice, these DataParts often carry not just isolated facts but entire context graphs. A customer context isn't simply a tier designation; it's a web of interconnected information. The organization connects to contracts, which have values and renewal dates. The organization connects to contacts, who have roles and decision-making authority. The organization has a spending history, a support tier, outstanding issues. All of this arrives as a JSON-LD graph that agents can traverse to answer complex questions.

When an agent receives this graph, it treats every claim within it as factual. The customer is Enterprise tier. The annual spend is half a million dollars. Jane Smith is the decision maker. The agent accepts these claims and reasons over them because that's what agents do—they operate on the context they're given.

But nothing in the protocol verifies these claims. The JSON is syntactically valid. It arrived over a proper HTTPS connection. The schema matches what the agent expected. None of that proves the claims are true.

## The Inter-Enterprise Reality

A2A isn't designed for agents within a single organization talking to each other. That problem is comparatively simple—you control all the agents, you can audit their behavior, you can update them when problems arise. A2A is designed for something much harder: agents from different organizations collaborating across trust boundaries.

Your sales agent communicates with a customer's procurement agent. Your procurement agent negotiates with a vendor's fulfillment agent. Your compliance agent queries a partner's audit agent. Each of these agents operates within its own organizational context, governed by its own policies, controlled by parties with their own interests.

When context flows across these boundaries, it crosses not just network segments but trust domains. Acme's sales agent sends pricing context to Contoso's procurement agent, which forwards relevant information to Globex's fulfillment agent. Each organization maintains its own infrastructure, its own security posture, its own incentives.

The question becomes: when Globex's agent receives context that claims to originate from Acme, how does it verify that claim? The answer, in current A2A implementations, is that it doesn't. It can verify that the message arrived over a valid TLS connection from Contoso. But TLS authenticates endpoints, not content. Contoso's endpoint was authenticated. The content that endpoint sent? That's a different matter entirely.

## Why TLS Isn't the Answer

The instinctive response to security concerns in web protocols is to point to HTTPS. TLS encrypts traffic, authenticates endpoints, and ensures data integrity in transit. These are genuine, valuable properties. They're also insufficient for inter-enterprise agent communication.

TLS creates an encrypted tunnel between two endpoints. For the duration of that connection, the data flowing through it is protected from eavesdropping and tampering. An attacker monitoring the network sees only encrypted bytes. Attempts to modify traffic in transit are detectable because they break the cryptographic integrity checks.

But TLS's protections exist only while data is in the pipe. The moment data arrives at an endpoint, the TLS connection terminates, the payload is decrypted, and the application takes over. From that point forward, TLS provides no guarantees whatsoever.

In point-to-point communication, this is fine. Agent A talks to Agent B over TLS. The connection is secure. The data arrives intact. Agent B processes it and that's the end of the story.

Agent communication rarely works that way. Context typically flows through multiple hops. It might pass through a context router that aggregates information from multiple sources. It might traverse an orchestration layer that coordinates multi-agent workflows. It might be stored in a cache or message queue before reaching its final destination. At every one of these intermediary points, TLS terminates. The content is decrypted, processed, and re-encrypted for the next hop. At every hop, the content is exposed. At every hop, it can be modified.

The receiving agent at the end of this chain can verify that the last hop was protected by TLS. It cannot verify anything about the hops before that. It cannot verify that the content wasn't modified along the way. It cannot verify that the content actually originated where it claims to have originated.

TLS authenticates connections. It doesn't authenticate content.

## The Composition Problem

Context in agent systems has another characteristic that complicates verification: it's typically composed from multiple sources.

An agent building customer context doesn't simply retrieve a single record from a single system. It queries the CRM for account information. It queries the contract management system for agreement details. It queries the identity provider to verify contacts. It queries the signals pipeline for recent activity. Then it merges all of this into a unified context graph that it can reason over.

Each of these sources might properly attest to its own data. The CRM signs its account records. The contract system signs its agreements. The identity provider signs its verifications. But the act of composition—merging these separate attestations into a single graph—is itself a transformation. The resulting graph is a new artifact that no single source created.

Who attests to the composition? The merging agent, presumably. But now we have a different problem: the receiving agent needs to verify not just that individual components are authentic, but that they were properly composed. A valid contract from one customer attached to a different customer's account is still composed of authentic parts. The composition itself is the attack.

This is why context integrity is fundamentally harder than content integrity. Verifying a single signed document is straightforward. Verifying a graph composed from multiple signed sources, where the composition itself must be attested, where relationships between nodes are as important as the nodes themselves—that requires a different approach.

## The Web PKI Limitation

One might argue that Agent Cards—the discovery mechanism A2A uses to advertise agent capabilities—solve part of this problem. Agents publish their capabilities at well-known URLs, and other agents discover them via HTTPS.

But this inherits all the limitations of Web PKI. The trust model is binary: you trust the certificate authority that signed the certificate, which means you trust the domain, which means you trust whatever content that domain serves. There's no gradation, no fine-grained authorization, no way to express that you trust this domain to make claims about pricing but not about contracts.

More fundamentally, domain-level trust doesn't align with the trust relationships agents actually need. An agent might need to trust claims from a specific service within an organization, not the organization's entire domain. It might need to trust claims made by a specific role, not anyone who can post to an endpoint. It might need to trust claims up to a certain value threshold, or only within certain time windows, or only when countersigned by a second party.

Web PKI's trust model was designed for browsers verifying websites. It asks: "Am I talking to the domain I think I'm talking to?" That's the wrong question for agent systems. The right question is: "Is this specific claim, made by this specific entity, about this specific subject, something I should act on?" Web PKI has no mechanism for answering that question.

## The Pattern We Need

The fundamental insight is that content must carry its own integrity. When context crosses trust boundaries, when it traverses intermediaries you don't control, when it might be cached or queued or forwarded, the only thing you can verify at the point of consumption is what traveled with the content itself.

This means embedding cryptographic proof directly in the JSON-LD payload. The content includes a hash of itself, demonstrating that it hasn't been modified since signing. It includes a signature from an identifiable party, demonstrating who vouches for this content. It includes a timestamp, demonstrating when the assertion was made. And it includes provenance information, demonstrating how this content was derived from upstream sources.

The transport becomes irrelevant. TLS can protect the pipe or not; it doesn't matter. Intermediaries can process and forward; the signature remains valid or it doesn't. The receiving agent verifies the attestation at the moment of consumption, regardless of how the content arrived.

This is message-level security rather than transport-level security. The signature travels with the message. Verification happens at the destination, not at each hop. Trust decisions are based on the content's cryptographic properties, not on the network path it traversed.

For composed context, the attestation chain extends deeper. Each component carries its own attestation. The composition itself is attested, recording which components were merged, by which process, at which time. The receiving agent can verify the entire provenance chain: this customer record came from the CRM, this contract came from DocuSign, they were composed by this ETL process, and the composition is signed by a builder I trust.

## What This Means for A2A

A2A is well-designed for agent interoperability. It provides clear message formats, sensible lifecycle semantics, useful streaming capabilities. What it needs is a security layer that addresses the inter-enterprise reality.

Every Part should carry a signature from its source. DataParts derived from multiple sources should carry the full provenance chain. Session identifiers should be signed capabilities, not bare identifiers that anyone who knows them can inject into. Agent Cards should be signed by verifiable identities, not just served over HTTPS. File artifacts should include content hashes, not just URIs.

The building blocks for this exist. SLSA defines attestation formats for software artifacts. In-toto defines provenance chains. Decentralized Identifiers provide cryptographic identity that doesn't depend on domain ownership. The work is integration—bringing these patterns to A2A's message model so that agents can verify the context they receive before acting on it.

Until that integration happens, every A2A message is an unverified claim. Every DataPart is context that might be authentic or might be poisoned. Every inter-enterprise agent interaction is a potential vector for manipulation.

The agents themselves might be secure. The protocol might be sound. The context remains the vulnerability.

---

*We're building attestation infrastructure for A2A and MCP—message-level security for agent context.*

<a href="/contact" class="cta-button">Let's Talk</a>
