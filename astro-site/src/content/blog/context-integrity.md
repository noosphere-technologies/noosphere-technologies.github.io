---
title: "Context Integrity: The Missing Layer for Trusted AI Agents"
description: "Content authenticity solved the problem of verifying images. Context integrity solves the problem of verifying the knowledge AI agents act on."
pubDate: "Mar 1 2026"
author: "Andrew Brown"
---

![Context Integrity](/images/blog-images/context-integrity-2.jpg)

C2PA gives us cryptographic provenance for images and video. But AI agents don't just consume media—they consume *context*: JSON-LD graphs, API responses, tool outputs, facts passed between agents. None of that has integrity guarantees today.

When Agent A tells Agent B that "the customer prefers enterprise pricing," Agent B has no way to verify: Where did that claim originate? Who authorized it? Has it been modified? Is the source even in my trust graph?

This is the context integrity problem. And it's not theoretical—it's the natural consequence of building autonomous systems that act on unverified knowledge.

## Three Levels of Context Verification

Context integrity isn't binary. It exists on a spectrum of assurance, and different use cases require different levels:

**Level 1: Content Hashing**

The minimum viable integrity check: hash the content, store the hash, verify it hasn't changed.

```json
{
  "content": { "@type": "Policy", "maxDiscount": 0.15 },
  "hash": "sha256:e3b0c44298fc1c149afbf4c8996fb924...",
  "algorithm": "SHA-256"
}
```

This catches tampering but says nothing about provenance. You know the content hasn't changed since the hash was computed—you don't know who computed it or whether to trust them.

**Level 2: Manifest Claims**

Add structured metadata about the content's origin and chain of custody:

```json
{
  "content_hash": "sha256:e3b0c44298fc1c149afbf4c8996fb924...",
  "claim": {
    "author": "did:web:acme.com",
    "created": "2026-03-01T10:00:00Z",
    "derived_from": ["sha256:abc123..."],
    "assertions": [
      { "type": "c2pa.source", "value": "crm.acme.com/policies/pricing" }
    ]
  }
}
```

Now you have provenance. But claims are just assertions—anyone can write JSON. Without cryptographic binding, they're meaningless.

**Level 3: Cryptographic Signatures**

Sign the manifest with a verifiable identity:

```json
{
  "manifest": { ... },
  "signature": {
    "algorithm": "Ed25519",
    "signer": "did:web:acme.com",
    "value": "base64:Qm9va3MgYXJlIGEgdW5pcXVl..."
  }
}
```

Now you have verifiable provenance. The signature binds the claims to an identity. The identity resolves to a DID document with public keys. The agent can verify the signature and check whether `did:web:acme.com` is in its trust graph.

This is what we've built in [c2pa-artifact](https://github.com/noosphere-technologies/c2pa-artifact)—a service that applies C2PA's attestation model to any digital artifact, not just media files.

## MCP: Verification as a Tool

The Model Context Protocol gives agents access to tools. For context integrity, that means exposing verification as something agents can invoke autonomously:

```
┌─────────────────────────────────────────────┐
│              AI Agent / LLM                 │
├─────────────────────────────────────────────┤
│            MCP Tool Interface               │
│  ┌────────────┐ ┌────────────────────────┐  │
│  │attest_hash │ │ verify_attestation     │  │
│  │attest_artifact│ │ check_trust_graph   │  │
│  └────────────┘ └────────────────────────┘  │
├─────────────────────────────────────────────┤
│    Context Sources (APIs, RAG, A2A)         │
└─────────────────────────────────────────────┘
```

The c2pa-artifact MCP server exposes these tools:

- **`attest_hash`** — Create a signed attestation for any content hash
- **`attest_artifact`** — Hash and attest arbitrary content in one call
- **`attest_provenance`** — Create attestations with derivation chains
- **`verify_attestation`** — Verify a signed attestation against a trust root
- **`list_attestations`** — Query attestations by hash, signer, or time range

When an agent receives context from another system, it doesn't trust blindly. It calls `verify_attestation()`:

```python
result = verify_attestation(
    attestation=incoming_context["attestation"],
    trust_root="did:web:myorg.com"
)

if not result["valid"]:
    # Reject the context
    return {"error": "Context failed integrity check", "reason": result["reason"]}

# Context verified - proceed
```

The agent gets a deterministic answer. Proceed or don't. No vibes. No heuristics.

## A2A: Context in Agent-to-Agent Communication

Google's Agent-to-Agent protocol introduced a structured approach to context in multi-agent systems. Two concepts matter for integrity:

**contextId**: A session identifier that groups related messages. When Agent A and Agent B exchange messages within a contextId, they're operating on shared conversational context. But the protocol doesn't verify the integrity of that context—it just groups it.

**Parts**: The payload structure for agent messages:

```json
{
  "parts": [
    { "type": "text", "text": "Customer prefers enterprise pricing" },
    { "type": "data", "data": { "@type": "Policy", "maxDiscount": 0.15 } }
  ]
}
```

A2A supports `TextPart`, `FilePart`, and `DataPart`. The `DataPart` type is where structured context lives—JSON objects that agents pass to each other.

Here's the gap: A2A defines the transport. It doesn't define integrity. A `DataPart` arrives, and the receiving agent has no cryptographic assurance about its origin.

Context integrity fills this gap. Wrap the `DataPart` in an attestation:

```json
{
  "parts": [
    {
      "type": "data",
      "data": {
        "content": { "@type": "Policy", "maxDiscount": 0.15 },
        "attestation": {
          "hash": "sha256:...",
          "signer": "did:web:acme.com",
          "signature": "base64:..."
        }
      }
    }
  ]
}
```

Now the receiving agent can verify. The contextId groups the conversation; the attestation verifies the content.

## The Canonicalization Problem

JSON isn't stable. The same object can serialize differently:

```json
{"a": 1, "b": 2}
{"b": 2, "a": 1}
```

If you hash JSON naively, identical content produces different hashes. For context integrity, this breaks verification.

The solution is canonicalization—transforming content to a deterministic form before hashing. For JSON-LD (the lingua franca of semantic context), that means RDFC-1.0:

```python
from pyld import jsonld

# Canonicalize to N-Quads (deterministic format)
canonical = jsonld.normalize(context, {"algorithm": "RDFC-1.0"})

# Hash the canonical form
hash = hashlib.sha256(canonical.encode()).hexdigest()
```

This is how c2pa-artifact handles JSON-LD context: canonicalize first, hash second, sign the hash. Identical semantic content always produces identical hashes, regardless of serialization differences.

## Trust Graphs and Policy

Verification alone isn't enough. A perfectly valid signature from an unknown party is still untrusted. Agents need policies that govern:

- **Trust anchors**: Which DIDs are in my trust graph?
- **Signature requirements**: Do I require Level 3 (signed) or accept Level 1 (hashed)?
- **Freshness**: How old can an attestation be before I reject it?
- **Derivation depth**: How many hops from the original source do I allow?

These policies should be declarative and machine-readable—Cedar, OPA, or simple JSON schemas. The agent evaluates context against policy and gets a deterministic answer.

```yaml
trust_anchors:
  - did:web:acme.com
  - did:web:trusted-vendor.com

context_policy:
  require_signature: true
  max_age_hours: 24
  allowed_derivation_depth: 2
```

When context arrives, the agent checks: Is the signer in my trust graph? Does the attestation meet my policy requirements? Yes or no.

## Why This Matters Now

The agent economy is coming. Google's A2A, Anthropic's MCP, OpenAI's Assistants API—the infrastructure for autonomous agents is being built. These agents will:

- Make purchasing decisions
- Provision infrastructure
- Negotiate with other agents
- Act on behalf of organizations

When agents operate on unverified context, every action becomes a vector for manipulation. Feed an agent bad context, and it will faithfully execute bad decisions.

Content authenticity became critical infrastructure because synthetic media threatened trust in what we see. Context integrity becomes critical infrastructure because autonomous agents threaten trust in what systems *do*.

C2PA solved content authenticity for humans.

Context integrity solves context authenticity for agents.

---

*We're building infrastructure for trusted AI agent ecosystems—context graphs with cryptographic provenance. The [c2pa-artifact](https://github.com/noosphere-technologies/c2pa-artifact) service is open source. If you're working on agent systems and thinking about trust, [let's talk](/contact).*
