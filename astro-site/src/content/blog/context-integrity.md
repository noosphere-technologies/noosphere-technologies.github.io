---
title: "Context Integrity: The Missing Layer for Trusted AI Agents"
description: "Content authenticity solved the problem of verifying images. Context integrity solves the problem of verifying the knowledge AI agents act on."
pubDate: "Mar 1 2026"
author: "Andrew Brown"
---

![Context Integrity](/images/blog-images/context-integrity-2.jpg)

Content authenticity solved individual artifacts. C2PA lets you verify that a photo wasn't AI-generated, that a video hasn't been tampered with, that a document can be traced to its source. For discrete media files, the problem is solved.

But AI agents don't consume discrete files. They consume *context graphs*—interconnected webs of knowledge that span multiple sources, evolve over time, and get composed, transformed, and passed between systems.

Content authenticity asks: "Is this image real?"

Context integrity asks: "Is this knowledge graph trustworthy?"

The difference isn't just scale. It's structural. And it requires different techniques.

## From Artifacts to Graphs

C2PA works beautifully for a photograph. The image is a discrete artifact. You hash it, sign it, embed credentials. Done.

Now consider what an AI agent actually consumes when reasoning about a customer:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://crm.acme.com/customers/contoso",
  "name": "Contoso Industries",
  "industry": "Manufacturing",
  "contracts": [
    {
      "@type": "Contract",
      "@id": "https://docusign.com/contracts/abc123",
      "tier": "Enterprise",
      "annualValue": 250000,
      "renewalDate": "2026-09-01"
    }
  ],
  "contacts": [
    {
      "@type": "Person",
      "@id": "https://linkedin.com/in/janesmith",
      "name": "Jane Smith",
      "role": "VP Engineering",
      "decisionMaker": true
    }
  ],
  "recentSignals": [
    {
      "@type": "Signal",
      "source": "slack",
      "timestamp": "2026-02-28T14:30:00Z",
      "content": "Asked about volume pricing"
    }
  ]
}
```

This isn't a file. It's a *graph*—nodes connected by relationships, spanning multiple source systems (CRM, DocuSign, LinkedIn, Slack), with temporal elements (signals, timestamps, renewal dates).

You can't just hash this and call it verified. The questions multiply:

- The contract data came from DocuSign—is that node attested?
- The contact came from LinkedIn—who verified that relationship?
- The signal arrived yesterday—is it still valid?
- The graph was composed from four sources—who attests the composition?

Content authenticity handles the leaves. Context integrity handles the tree.

## Context Poisoning: The Attack Vector

Prompt injection gets the headlines. But context poisoning is the deeper threat.

Prompt injection manipulates what the agent is *told to do*. Context poisoning manipulates what the agent *believes to be true*. An agent with poisoned context will faithfully execute correct instructions—and still produce catastrophic outcomes.

**Attack vectors:**

- **Source injection**: Compromise a data source the agent trusts. If the CRM says the customer's tier is "Enterprise" when it's actually "Startup," every pricing decision is wrong.

- **Transit tampering**: Intercept context as it flows between systems. Modify the contract renewal date. Add a fake decision-maker. Remove a risk flag.

- **Composition attacks**: The sources are clean, but the merge is malicious. A legitimate contract from DocuSign gets associated with the wrong customer. The graph looks valid; the relationships are fabricated.

- **Temporal manipulation**: Replay stale context as current. The pricing policy changed last week, but the agent is acting on last month's version—which happens to be more favorable to the attacker.

**Why attestation chains matter:**

Without provenance, the agent can't distinguish legitimate context from poisoned context. Both look like valid JSON. Both claim to be authoritative.

With attestation chains, every node and every transformation has cryptographic proof. The agent doesn't trust the data—it verifies the chain. Poisoned context fails verification because the attacker can't produce valid attestations from trusted builders.

Context poisoning is the supply chain attack of the agent economy. The defenses are the same: attestations, provenance, policy-based verification.

## Context Graphs Have a Temporal Dimension

Static knowledge graphs are one thing. But agent context isn't static—it's a *stream*. New signals arrive. Facts become stale. Relationships change.

A context graph is a knowledge graph plus time:

```
t=0:  Customer.tier = "Startup"
t=1:  Customer.tier = "Growth"
t=2:  Customer.tier = "Enterprise"
```

Which version does the agent trust? The answer depends on:

- **Freshness requirements**: How old can context be before it's rejected?
- **Supersession**: Has this fact been explicitly replaced by a newer one?
- **Validity windows**: Was this context attested for a specific time range?

Content authenticity doesn't model time. A signed image is either valid or not. Context integrity must handle versioning, expiration, and temporal validity—the same patterns you see in software supply chain security.

## Supply Chain Attestation for Context

Here's the insight: context flows through a pipeline, just like software artifacts. It gets produced, transformed, composed, and consumed. Each step is an opportunity for tampering or corruption.

Software supply chain security solved this problem with attestations. In-toto and SLSA define how to:

- Attest that a build step produced a specific output
- Chain attestations across a multi-step pipeline
- Verify that an artifact's provenance matches expected policy

Context integrity applies the same patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Pipeline                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Source     │   Transform   │   Compose    │   Consume     │
│  (CRM API)   │  (Normalize)  │  (Merge)     │   (Agent)     │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ attestation₁ │ attestation₂  │ attestation₃ │  verification │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

Each stage produces an attestation. The final consumer verifies the chain. If any link is missing or invalid, the context is rejected.

**In-toto attestation for context extraction:**

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [{
    "name": "customer-context",
    "digest": { "sha256": "e3b0c44298fc1c149afbf4c8996fb924..." }
  }],
  "predicateType": "https://slsa.dev/provenance/v1",
  "predicate": {
    "buildDefinition": {
      "buildType": "https://noosphere.tech/context-extraction/v1",
      "externalParameters": {
        "source": "salesforce://accounts/contoso",
        "query": "SELECT Id, Name, Industry, Contracts FROM Account"
      }
    },
    "runDetails": {
      "builder": { "id": "did:web:etl.acme.com" },
      "metadata": {
        "invocationId": "ctx-2026-03-01-001",
        "startedOn": "2026-03-01T10:00:00Z",
        "finishedOn": "2026-03-01T10:00:03Z"
      }
    }
  }
}
```

This is a SLSA provenance attestation for context. It records: what was extracted, from where, by whom, when. The consuming agent can verify the entire chain—from source system to final graph.

## Graph Integrity: Nodes, Edges, Subgraphs

Individual attestations aren't enough. Graphs have structure, and that structure must be verified.

**Node-level integrity**: Each node in the graph has its own attestation. The contract node is attested by DocuSign. The contact node is attested by the identity provider. The signal node is attested by Slack.

**Edge integrity**: The relationships between nodes must also be verified. Did someone add a fake contact to a real organization? Is this contract actually associated with this customer? Edges are claims that need attestation too.

**Composition integrity**: When you merge context from multiple sources, you create a new graph. The composition itself is a transformation step that requires attestation. Who performed the merge? What was the merge policy? Were there conflicts?

**Merkle DAGs for graph integrity:**

Represent the graph as a Merkle DAG where each node's hash includes its children:

```
Organization (hash: abc123)
├── contracts[] (hash: def456)
│   └── Contract (hash: 789xyz)
├── contacts[] (hash: fed321)
│   └── Person (hash: cba987)
└── signals[] (hash: 456fed)
    └── Signal (hash: sig001)
```

Now integrity is compositional. Change any node, and the root hash changes. Attest the root, and you've implicitly attested the entire structure.

**Subgraph extraction with proofs:**

Agents often need only part of a graph. With Merkle proofs, you can extract a subgraph and prove it belongs to the attested whole:

```json
{
  "subgraph": {
    "contracts": [{ "tier": "Enterprise", "renewalDate": "2026-09-01" }]
  },
  "proof": {
    "root_hash": "abc123",
    "merkle_path": ["def456", "789xyz"],
    "root_attestation": {
      "signer": "did:web:acme.com",
      "signature": "..."
    }
  }
}
```

The receiving agent verifies: the subgraph hashes correctly, the Merkle path connects to the root, the root is attested by a trusted signer. Minimal context, full integrity.

## MCP: Verification as a Tool

The Model Context Protocol gives agents access to tools. Context integrity means exposing attestation and verification as tools agents invoke autonomously:

```python
# Before acting on context, verify its provenance
result = verify_context_attestation(
    context=customer_graph,
    trust_anchors=["did:web:acme.com", "did:web:salesforce.com"],
    policy={
        "max_age_hours": 24,
        "require_slsa_level": 2,
        "allowed_builders": ["did:web:etl.acme.com"]
    }
)

if not result["valid"]:
    return {"error": "Context failed integrity check", "chain": result["failed_attestations"]}

# Context verified—proceed with action
```

The agent gets a deterministic answer. The entire attestation chain is verified against policy. Proceed or don't.

## A2A: Context Across Agent Boundaries

Google's A2A protocol defines how agents exchange messages. The `DataPart` type carries structured context between agents:

```json
{
  "parts": [
    {
      "type": "data",
      "data": { "@type": "CustomerContext", "tier": "Enterprise" }
    }
  ]
}
```

A2A defines the transport. It doesn't define integrity. When Agent B receives a `DataPart` from Agent A, it has no cryptographic assurance about origin or chain of custody.

Context integrity fills the gap. Wrap the data with its attestation chain:

```json
{
  "parts": [{
    "type": "data",
    "data": {
      "context": { "@type": "CustomerContext", "tier": "Enterprise" },
      "attestation_chain": [
        { "step": "extraction", "builder": "did:web:etl.acme.com", "signature": "..." },
        { "step": "transform", "builder": "did:web:agent-a.acme.com", "signature": "..." }
      ],
      "root_hash": "abc123"
    }
  }]
}
```

Agent B can verify the chain before acting. The contextId groups the conversation; the attestation chain verifies the content.

## Trust Policy

Verification without policy is incomplete. Agents need declarative rules:

```yaml
trust_anchors:
  - did:web:acme.com
  - did:web:salesforce.com
  - did:web:docusign.com

context_policy:
  require_attestation_chain: true
  min_slsa_level: 2
  max_context_age_hours: 24

  allowed_builders:
    extraction: ["did:web:etl.acme.com"]
    transform: ["did:web:*.acme.com"]

  node_policies:
    Contract:
      required_attestor: "did:web:docusign.com"
    Person:
      required_attestor: "did:web:identity.acme.com"
```

Context arrives. The agent evaluates against policy. Yes or no.

## The Evolution

Content authenticity solved verification for individual artifacts. Images, videos, documents—discrete files with embedded credentials.

Context integrity evolves this for the agent era:

| Content Authenticity | Context Integrity |
|---------------------|-------------------|
| Individual files | Knowledge graphs |
| Static artifacts | Temporal streams |
| Single attestation | Attestation chains |
| Embedded credentials | Supply chain provenance |
| Human verification | Autonomous agent verification |

C2PA gave us the foundation. Supply chain security (in-toto, SLSA) provides the patterns for pipelines and attestation chains. Context integrity brings them together for the knowledge graphs that agents actually consume.

The agent economy is coming. Google's A2A, Anthropic's MCP, OpenAI's Assistants API—the infrastructure for autonomous agents is being built now. When these agents act on unverified context, every action becomes a vector for manipulation.

Content authenticity protects humans from synthetic media.

Context integrity protects agents from synthetic knowledge.

---

*We're building infrastructure for trusted AI agent ecosystems—context graphs with supply chain attestations. If you're working on agent systems and thinking about trust, [let's talk](/contact).*
