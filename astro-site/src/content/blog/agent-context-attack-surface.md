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

But there's a different class of attack that hasn't received the same attention. Where prompt injection manipulates instructions, context poisoning manipulates the fundamental assumptions an agent reasons over. The difference is subtle but profound. An agent with poisoned context doesn't execute malicious instructions. It executes perfectly reasonable instructions based on false premises. Its reasoning is sound. Its conclusions follow logically from its inputs. The problem is that its inputs have been corrupted.

Consider an agent that negotiates pricing based on customer tier. If the agent believes a customer is an Enterprise account when they're actually a Startup, it will offer Enterprise pricing—not because it was tricked into doing so, but because it genuinely believes that's the appropriate action given the customer's status. The agent behaves correctly according to its context. The context is wrong.

This makes context poisoning particularly insidious. The agent's behavior appears normal under inspection. Its decision-making process is valid. The corruption isn't in the logic; it's in the premises the logic operates on.

The pattern isn't new. The [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) identifies related attack vectors: [LLM04: Data and Model Poisoning](https://genai.owasp.org/llmrisk/llm042025-data-and-model-poisoning/) covers training data poisoning, fine-tuning poisoning, and RAG poisoning; [LLM08: Vector and Embedding Weaknesses](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/) addresses retrieval-augmented generation security. RAG poisoning—where malicious documents injected into a retrieval corpus manipulate model outputs—is one instance of the broader problem.

But the multi-agent context exchange introduces attack surfaces these categories don't fully address. When agents exchange structured context across organizational boundaries via protocols like A2A, the attack surface extends beyond the retrieval corpus. It includes DataParts exchanged between agents, context graphs composed from multiple sources, and the trust relationships between enterprises. The same pattern—corrupt the data source downstream systems depend on—but applied to inter-agent communication rather than retrieval pipelines.

## Threat Model

Before examining specific vulnerabilities, we need to establish who we're defending against and what they're trying to achieve.

**Adversary classes:**

*Malicious counterparty.* An organization you're doing business with that wants to manipulate transactions in their favor. They control their own agents legitimately but send falsified context. This is the most likely adversary in inter-enterprise scenarios—not a compromise, just dishonesty.

*Compromised intermediary.* A routing layer, orchestration service, or message queue that's been breached. The adversary can observe and modify context in transit but doesn't control the endpoints.

*Malicious insider.* Someone with legitimate access to a context source (CRM, contract system, identity provider) who modifies records for personal gain or on behalf of an external party.

*Supply chain attacker.* An adversary who compromises an upstream context source—not the enterprise itself, but a SaaS provider or data vendor the enterprise depends on.

**Adversary capabilities:**

In the malicious counterparty case, the adversary has full control over their own infrastructure. They can craft arbitrary messages, sign them with their own credentials, and send them through legitimate channels. They're not breaking in; they're lying through proper interfaces.

In the compromised intermediary case, the adversary can read, modify, drop, replay, or inject messages. They cannot forge signatures from endpoints they don't control, assuming proper cryptographic implementation.

**Adversary objectives:**

The goal is typically to cause the target agent to take actions beneficial to the adversary: approve unauthorized discounts, misroute payments, release goods without proper authorization, leak confidential information to unauthorized parties, or simply cause operational disruption.

Understanding these adversaries shapes the defense. Transport security helps against network-level attackers but does nothing against malicious counterparties. Endpoint authentication helps against impersonation but does nothing against legitimate parties sending false claims. The defense must address all three dimensions: network, endpoint, and content.

## How A2A Carries Context

A2A structures communication around messages containing Parts. These Parts are the atomic units of information exchange. A TextPart carries natural language. A FilePart references binary artifacts via URI. And a DataPart carries structured data as JSON objects.

DataPart is where business-critical context lives. When an agent needs factual information to make a decision—a customer's spending history, a contract's renewal date, whether someone is authorized to approve a discount—that information arrives as structured JSON in a DataPart. The agent parses this JSON, extracts the relevant values, and uses them as the factual basis for its reasoning.

In practice, these DataParts often carry not just isolated facts but entire context graphs. A customer context isn't simply a tier designation; it's a web of interconnected information represented as JSON-LD. The organization connects to contracts, which have values and renewal dates. The organization connects to contacts, who have roles and decision-making authority. All of this arrives as a graph that agents can traverse to answer complex questions.

When an agent receives this graph, it treats every claim within it as factual. The customer is Enterprise tier. The annual spend is half a million dollars. Jane Smith is the decision maker. The agent accepts these claims and reasons over them because that's what agents do—they operate on the context they're given.

Nothing in the protocol verifies these claims. The JSON is syntactically valid. It arrived over a proper connection. The schema matches expectations. None of that proves the claims are true. None of that proves they weren't modified in transit. None of that proves they're current rather than replayed from an earlier, more favorable state.

## The Inter-Enterprise Reality

A2A isn't designed for agents within a single organization talking to each other. That problem is comparatively simple—you control all the agents, you can audit their behavior, you can enforce policies uniformly. A2A is designed for something much harder: agents from different organizations collaborating across trust boundaries.

Your sales agent communicates with a customer's procurement agent. Your procurement agent negotiates with a vendor's fulfillment agent. Your compliance agent queries a partner's audit agent. Each of these agents operates within its own organizational context, governed by its own policies, controlled by parties with their own interests—interests that may not align with yours.

When context flows across these boundaries, it crosses not just network segments but trust domains. Acme's sales agent sends pricing context to Contoso's procurement agent, which forwards relevant information to Globex's fulfillment agent. Each organization maintains its own infrastructure, its own security posture, its own incentives.

The question becomes: when Globex's agent receives context that claims to originate from Acme, how does it verify that claim? The answer, in current A2A implementations, is that it doesn't. It can verify that the message arrived over a valid TLS connection from Contoso. But TLS authenticates the connection, not the content. Contoso's endpoint was authenticated. The content that endpoint sent? That's a different matter entirely.

## Why TLS Isn't the Answer

The instinctive response to security concerns in web protocols is to point to HTTPS. TLS encrypts traffic, authenticates endpoints, and ensures data integrity in transit. These are genuine, valuable properties. They're also insufficient for inter-enterprise agent communication, and it's worth being precise about why.

**What TLS actually provides:**

In standard HTTPS, TLS provides *server authentication*. The client verifies the server's certificate against trusted root CAs and confirms the server possesses the corresponding private key. This proves the client is talking to the domain it intended to reach. The server, by default, does not authenticate the client—the connection is one-way authenticated.

Mutual TLS (mTLS) adds client authentication: both parties present certificates, both verify. This is stronger but not standard in A2A deployments and requires certificate management infrastructure that many organizations lack.

In either case, TLS provides *confidentiality* (encryption) and *integrity* (tampering detection) for data in transit between the two endpoints of the connection.

**What TLS doesn't provide:**

TLS's protections exist only while data is in the pipe. The moment data arrives at an endpoint, the TLS connection terminates, the payload is decrypted, and the application takes over. From that point forward, TLS provides no guarantees.

This matters because agent communication is rarely point-to-point. Context flows through multiple hops: context routers, orchestration layers, caches, message queues. At every intermediary, TLS terminates. The content is decrypted, processed, potentially modified, and re-encrypted for the next hop.

Even with mTLS at every hop, you authenticate each connection but not the content. Each intermediary is authenticated to its neighbors. That doesn't prevent any intermediary from modifying the content before forwarding it. The final recipient can verify the last hop was authenticated. It cannot verify anything about prior hops or the content's integrity across the full path.

**The authentication gap:**

TLS authenticates connections. It doesn't authenticate content. It doesn't authenticate claims. It doesn't provide non-repudiation—the sender can deny having sent a particular message since TLS session keys are ephemeral and not bound to the payload.

For a malicious counterparty scenario, TLS is irrelevant. The counterparty controls their own endpoint. Their TLS certificate is valid. Their connection is properly authenticated. They're simply lying about the content they send. TLS has no mechanism to detect or prevent this.

## The Composition Problem

Context in agent systems has another characteristic that complicates verification: it's typically composed from multiple sources.

An agent building customer context doesn't simply retrieve a single record from a single system. It queries the CRM for account information. It queries the contract management system for agreement details. It queries the identity provider to verify contacts. It queries the signals pipeline for recent activity. Then it merges all of this into a unified context graph.

Each source might properly attest to its own data. The CRM signs its account records. The contract system signs its agreements. The identity provider signs its verifications. But the act of composition—merging these separate attestations into a single graph—is itself a transformation. The resulting graph is a new artifact that no single source created.

Who attests to the composition? The merging agent, presumably. But now we have a different problem: the receiving agent needs to verify not just that individual components are authentic, but that they were properly composed.

Consider the attack: an adversary takes a valid, signed contract belonging to Customer A and attaches it to the context graph of Customer B. Both the contract attestation and the customer record attestation verify correctly. The composition is the attack. The relationship between nodes is falsified even though the nodes themselves are authentic.

This is why context integrity is fundamentally harder than content integrity. Verifying a single signed document is straightforward. Verifying a graph where composition must itself be attested, where relationships between nodes are as important as the nodes themselves, where the same authentic component can be maliciously recontextualized—that requires a different approach.

## Replay and Freshness

Signed content can be replayed. If an adversary captures a legitimately signed context from last month—when the customer's discount was higher, when a different person was authorized, when a now-revoked policy was in effect—they can resubmit it as current.

Timestamps in signatures help but don't fully solve the problem. They prove when the signature was created, not whether the content is still valid. A contract signed yesterday might have been superseded today. A policy attested this morning might have been revoked this afternoon.

This creates a freshness problem: how recent must context be to be trusted? The answer depends on the use case, which means freshness requirements must be part of verification policy. A pricing decision might require context attested within the last hour. A compliance check might accept context from the last week. A historical audit might specifically need context from a past date.

The verification system must support these distinctions. It must allow policies that reject stale context—and that means defining what "stale" means for each context type. It also means that context sources must be able to signal validity periods and that consuming agents must respect them.

Related is the time-of-check-time-of-use (TOCTOU) problem. Context verified at receipt might be stale by the time the agent acts on it. In fast-moving scenarios—real-time bidding, time-limited offers, rapidly changing inventory—the gap between verification and action becomes an attack window. An adversary who can predict when you'll check and when you'll act can potentially exploit that gap.

There's no perfect solution to TOCTOU; it's a fundamental tension in distributed systems. But acknowledging it shapes the architecture: minimize the gap, re-verify before critical actions, design for eventual consistency where possible, and accept that some residual risk remains.

## The Web PKI Limitation

One might argue that Agent Cards—the discovery mechanism A2A uses to advertise agent capabilities—solve part of this problem. Agents publish their capabilities at well-known URLs, and other agents discover them via HTTPS.

But this inherits all the limitations of Web PKI, which was designed for a different problem: helping browsers verify they're talking to the right website.

In 2014, Moxie Marlinspike and the SSL Observatory project documented just how broken this system was. They found CAs issuing certificates improperly, intermediate certificates being misused, and a trust model that concentrated enormous power in entities with little accountability. The system's fundamental flaw was architectural: any of the hundreds of trusted CAs could issue a certificate for any domain, creating a weakest-link problem where the security of the entire ecosystem depended on the least trustworthy CA.

That was over a decade ago. Remarkably little has changed. Certificate Transparency has added some visibility, but the underlying trust model remains the same. Over a hundred root CAs are still trusted by default in most browsers and operating systems. Any of these CAs can still issue a certificate for any domain. The compromise of any single CA—or coercion of any CA by a government—can still undermine the entire system. DigiNotar, Symantec, and others have demonstrated this isn't theoretical.

More fundamentally, domain-level trust doesn't map to agent authorization needs. You might trust acme.com in the sense that you're willing to visit their website. That doesn't mean you trust every service on that domain to make claims about contract terms or customer status. It doesn't mean you trust every employee with access to publish to that domain. It doesn't mean you trust claims from acme.com about contoso.com.

An agent might need to trust claims from a specific service within an organization, not the entire domain. It might need to trust claims made by a specific role, not anyone who can post to an endpoint. It might need to trust claims up to a certain value threshold, or only within certain time windows, or only when countersigned by a second party.

Web PKI asks: "Am I talking to the domain I think I'm talking to?" That's the wrong question for agent systems. The right question is: "Is this specific claim, made by this specific entity, about this specific subject, within this specific scope, something I should act on?" Web PKI has no mechanism for answering that question.

## The Pattern: Message-Level Security

The fundamental insight is that content must carry its own integrity. When context crosses trust boundaries, when it traverses intermediaries you don't control, when it might be cached or queued or forwarded, the only thing you can verify at the point of consumption is what traveled with the content itself.

This means embedding cryptographic proof directly in the payload. The structure needs to support:

**Content binding.** A hash of the content, computed using a canonicalization algorithm that ensures semantic equivalence produces identical hashes. For JSON-LD, this means RDF canonicalization before hashing—otherwise, semantically identical graphs with different serializations produce different hashes.

**Signer identification.** Not just a key, but an identifier that can be resolved to a key and to metadata about the signer. Decentralized Identifiers (DIDs) serve this purpose: `did:web:crm.acme.com` resolves to a DID document containing public keys, service endpoints, and other metadata. The signer is identified independently of the transport.

**Signature.** A cryptographic signature over the content hash, verifiable using the signer's public key. Standard algorithms apply: Ed25519 for speed, ECDSA for compatibility, RSA if you must.

**Timestamp.** When the signature was created. This should be from a trusted time source or a timestamp authority if non-repudiation matters. The timestamp binds the signature to a moment in time, enabling freshness checks.

**Provenance chain.** For composed context, the attestation must include the attestations of its components. This creates a Merkle-like structure: the composition's hash covers the component hashes, the composition's signature covers the composition's hash, and verification can recurse down the tree.

**Policy hooks.** The attestation should include enough metadata for the verifier to evaluate policy: what builder created this, what materials went into it, what assertions does the signer make about the content. This aligns with SLSA provenance and in-toto attestation frameworks.

The transport becomes irrelevant. TLS can protect the pipe or not. Intermediaries can process and forward. The signature remains valid or it doesn't. The receiving agent verifies the attestation at the moment of consumption, regardless of how the content arrived.

Verification then becomes a policy evaluation: Is the signature valid? Is the signer in my trust graph? Is the timestamp within my freshness window? Does the provenance chain satisfy my requirements for this context type?

## Key Management Realities

Any cryptographic solution is only as strong as its key management, and this is where many systems fail in practice.

**Issuance.** Who can create a DID and start signing context? If it's too easy, adversaries create legitimate-looking signers. If it's too hard, adoption stalls. The answer is usually hierarchical: organizational DIDs are registered through a governance process, and those organizations then issue DIDs to their services and agents.

**Rotation.** Keys must be rotatable without invalidating existing signatures. DID documents support this by including key validity periods and allowing multiple keys with different purposes. But this means verifiers must resolve DIDs at verification time, not just cache the keys—which has performance implications.

**Revocation.** When a key is compromised, it must be revocable, and verifiers must check revocation status. This is where Web PKI struggles (CRL and OCSP checking is inconsistent at best). DID-based systems can do better with versioned DID documents or explicit revocation registries, but the infrastructure must exist and must be checked.

**Compromise recovery.** If a signing key is compromised, what happens to context signed with it? Potentially, an adversary has been signing false context for some time before detection. There's no perfect answer—you can't un-ring the bell—but audit logs, anomaly detection, and bounds on damage (limiting what a single key can sign) help contain the blast radius.

These aren't theoretical concerns. They're the operational realities that determine whether a message-level security system actually works in production.

## What This Means for A2A

A2A is well-designed for agent interoperability. It provides clear message formats, sensible lifecycle semantics, useful streaming capabilities. What it needs is a security layer that addresses the inter-enterprise reality.

Every Part should carry a signature from its source. DataParts derived from multiple sources should carry the full provenance chain. Session identifiers should be signed capabilities, not bare identifiers that anyone who knows them can inject into. File artifacts should include content hashes, not just URIs that can be substituted.

The building blocks exist. SLSA defines attestation formats for software artifacts; the same patterns apply to context. In-toto defines provenance chains with explicit materials and products. DIDs provide cryptographic identity independent of domain ownership. JSON-LD canonicalization enables deterministic hashing of semantic graphs.

The work is integration: bringing these patterns to A2A's message model so that agents can verify the context they receive before acting on it. This isn't a research problem; it's an engineering problem. The cryptographic primitives are mature. The attestation formats are standardized. What's needed is the protocol binding and the tooling to make it practical.

Until that integration happens, every A2A message is an unverified claim. Every DataPart is context that might be authentic or might be poisoned. Every inter-enterprise agent interaction is a potential vector for manipulation.

The agents themselves might be secure. The protocol might be sound. The context remains the vulnerability.

---

*We're building attestation infrastructure for A2A and MCP—message-level security for agent context.*

<a href="/contact" class="cta-button">Let's Talk</a>
