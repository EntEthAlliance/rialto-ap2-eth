# The AP2-Ethereum Trust Adapter

A neutral trust and adjudication layer for the Agent Payments Protocol, built on Ethereum attestation and escrow standards.

**Draft Specification · August 2026 · Spec text CC BY 4.0 · Code Apache 2.0**
Enterprise Ethereum Alliance · [entethalliance.org](https://entethalliance.org)

Published version: [ap2-ethereum-trust-adapter.html](https://entethalliance.github.io/ops-finance/ap2-ethereum-trust-adapter.html) (part of the [EEA Resource Hub](https://entethalliance.github.io/ops-finance/agents.html))

Interactive demo: [entethalliance.github.io/eea-rnd-ap2-ethereum-adapter](https://entethalliance.github.io/eea-rnd-ap2-ethereum-adapter/) — a clickable simulation of the adapter ([`index.html`](index.html), single file, no dependencies). Four scenarios: happy path, revoked attestation, cap exceeded, disputed delivery. The three refusals are the point — trust infrastructure is proven by what it blocks.

This is the canonical spec. It supersedes the earlier v0.1 and v0.2 drafts previously in this repo.

## Why this matters

AP2 has become the convergence point for agent payments, and its own community is now filing proposal after proposal for the two things it still lacks: a neutral trust registry and on-chain dispute adjudication. Every proposal is single-vendor. None has a home. That is a standards-body problem, and the EEA is the standards body.

The Agent Payments Protocol, launched by Google with 60+ partners and donated to the FIDO Alliance in April 2026, is the most widely backed standard for authorizing what an AI agent may buy on a human's behalf. Its partner list already includes MetaMask, Coinbase, and EigenLayer. Its payment layer already treats Ethereum rails as first-party: x402 stablecoin settlement ships as an official extension co-built with Coinbase and the Ethereum Foundation, and MetaMask's production delegation stack already grants agents scoped, revocable spending power over AP2 flows.

Two pieces are still missing, and AP2's specification says so itself: a trust registry beyond "manually curated allow-lists" (§ 3.2), and a root-of-trust mechanism it calls "a critical area for innovation" (§ 9), plus a dispute-evidence model that today amounts to the merchant holding a JSON file (§ 7.3). These are not engineering gaps. Coinbase and MetaMask closed the engineering gaps months ago. These two are governance gaps: whose attestation counts, and who both sides accept as judge. No vendor can answer those questions for its own competitors.

This document specifies the adapter that closes both, using the Ethereum Attestation Service, the EEA's Shibui framework, and the ERC-8183 escrow standard, and lays out the concrete path to land it: normative text to the FIDO AP2 working group, reference implementation to the AP2 repository, with the EEA carrying proposals the community is already writing but has no standing to submit.

**Three takeaways**

1. AP2 and Ethereum are already one stack at the payment layer. The remaining work is the trust layer, and it is narrow, specific, and specifiable today.
2. Demand is documented in AP2's own issue tracker: independent builders are proposing on-chain mandate binding, escrow with proof-of-delivery, and attestation providers, all vendor-specific, all parked, because normative work must go through FIDO and individual contributors lack standing there.
3. The EEA's deliverable is two schemas and two registries, small enough to ship this quarter, neutral enough that competitors can all adopt them.

## Part I — Where AP2 x Ethereum stands today

### Already shipped, already merged

- **Payment execution.** AP2's documentation names x402 as a payment method the protocol is "specifically designed to accommodate," and the a2a-x402 extension, co-built with Coinbase and the Ethereum Foundation, is the maintained integration. Ethereum stablecoin settlement is a first-party AP2 rail, not a bridge proposal.
- **Delegated authorization.** MetaMask's Delegation Framework stacks EIP-7702 (an EOA delegates code in place, live since Pectra, May 2025), ERC-7710 (the delegation interface), and ERC-7715 (the wallet permission-request standard). The wallet prompts once; the agent redeems scoped, capped, time-bound permission repeatedly. Production proof: Clawnch agents earned $1.2M in fees by February 2026, every dollar spent inside on-chain-enforced caveats on this exact stack, composed with AP2 and x402.
- **Mandate signing.** EIP-712 typed signing, with EIP-1271 fall-through for smart accounts, is already the default pattern across the wallet infrastructure AP2's partners ship. Community work on mandate-hash conformance (AP2 issue #265) is standardizing exactly the hash-derivation this depends on.

### Adoption, measured honestly

| Standard | Status | Adoption as of August 2026 |
| --- | --- | --- |
| ERC-8004 | Live, mainnet since Jan 29, 2026 | 200,000+ agent identities across 20+ chains in its first months. Raw registration count overstates depth of use, treat as reach. |
| x402 | Live since May 2025 | 160M+ agentic payments in the trailing year per Coinbase; 100M+ independently confirmed by Chainalysis through Q1 2026; over 90% of on-chain agentic stablecoin volume settles on Base. A March 2026 analysis flagged low organic daily volume and self-generated test traffic; the gap closed over subsequent months, but both figures circulate. |
| ERC-8183 | Draft, February 2026 | Not yet Review or Final. Primary deployment: Virtuals Protocol on Base and Arbitrum; claimed 2M+ transactions, independently unverified. |
| EIP-7702 | Live since Pectra, May 2025 | Foundation of MetaMask's and other wallets' in-place smart-account upgrades. Protocol-native account abstraction (EIP-7701 / 8141 / 8130) remains under debate for the Hegota upgrade, Considered not Scheduled, so 7702 is the primitive to build on now. |

## Part II — The demand signal in AP2's own issue tracker

The strongest evidence that the trust layer is the open frontier is not analysis, it is AP2's public issue tracker. Independent builders keep filing proposals for exactly this layer. A sample of currently open issues:

| Issue | What it proposes | What it maps to |
| --- | --- | --- |
| #255: On-chain settlement-side mandate binding | A normative MandateEnvelope EIP-712 typehash verified at the token contract: principal and agent signatures with EIP-1271 fall-through, per-transaction and cumulative caps, asset allowlist, expiry, sanctions and Travel Rule attestations, typed refusal reasons. Shipped as a reference stablecoin (RIVR). | Mandate binding, the cross-cutting primitive both open slots need |
| #224: PactEscrow settlement adapter | Trustless on-chain escrow for AP2: proof-of-delivery before payment release. | Slot B, dispute evidence, single-vendor version |
| #280: BlindOracle attestation provider | An agent-trust verification and attestation provider added to the AP2 ecosystem. | Slot A, trust registry, single-vendor version |
| #293: Bitcoin-anchored proof-of-when | Optional chain-anchored timestamping of signed mandates, outside the signed bytes. | Chain-anchored evidence, same instinct, different chain |
| #290: Post-checkout agent action record | A verifiable audit trail of agent actions after the Checkout Receipt. | Slot B, evidence chain beyond the payment moment |
| #265: Mandate-hash conformance vectors | Cross-implementation test vectors for open_mandate_hash derivation. | The hash-derivation layer on-chain binding depends on |
| #268 / #250 / #259: Signing-layer friction | JWT algorithm constraints forcing dual keys; a post-quantum (ML-DSA-65) extension; issuer-field enforcement in SD-JWT. | Signature agility, why an optional EIP-712 path fits AP2's direction |

### The pattern, and the blocker

Every one of these proposals is vendor-specific (PactEscrow, BlindOracle, RIVR) and every one is parked. The reason is structural, and issue #255 states it outright: the AP2 repository's scope is samples and SDK only; normative specification work belongs to the FIDO working group; and the author notes that FIDO liaison membership must wait until a legal entity exists, so the contribution sits filed "as an individual."

Read that again as a standards body: demand is proven, multiple independent parties are building the same two missing layers. Convergence is absent, each ships its own incompatible envelope. Standing is the bottleneck, the builders cannot carry their own work into the venue that decides. Those are precisely the three conditions under which a neutral standards organization exists to act.

The EEA's role is therefore not to invent the trust layer from zero. It is to converge what the community is already building into one neutral schema set, and to carry it, with institutional standing, into the FIDO AP2 working group where individual contributors cannot.

## Part III — The two open slots

The slots that closed, payment execution, delegation, signing, were engineering problems: one company with the incentive could ship the answer. The two that remain are different in kind.

- **Whose attestation counts?** A registry that only Google, or only Coinbase, or only one startup recognizes just relocates the lock-in AP2 was designed to avoid. Multiple institutions must agree on shared attestation rules, which is a negotiation, not a deployment.
- **Who is the judge?** A card network's adjudicator will not automatically recognize an on-chain evaluator one counterparty picked unilaterally. Mutual recognition of a judge is an institutional agreement; a smart contract can enforce the verdict, not the recognition.

AP2's specification leaves exactly these two open:

| AP2 section | Open slot | Current state |
| --- | --- | --- |
| § 3.2 | Trust registry | Manually curated allow-lists; bilateral trust, O(n²) relationships at scale. |
| § 9 | Root of trust | No defined mechanism for why a signing key should be trusted, "a critical area for innovation." |
| § 6 / § 7.3 | Dispute evidence | Merchant holds the signed JSON mandates and presents them during representment; sole custodian, no independent verification. |

## Part IV — Technical specification

Both slots resolve on shared infrastructure: the Ethereum Attestation Service (EAS), deployed across mainnet and major L2s, permissionless, token-free, with the EEA's Shibui framework providing the institutional semantics on top. One cross-cutting primitive, the mandate binding, serves both.

### Cross-cutting primitive: the MandateEnvelope binding

Everything on-chain keys off one artifact: a canonical, chain-agnostic binding of the AP2 mandate. Community work has already converged on the shape: issue #255 proposes a normative MandateEnvelope EIP-712 typehash so agents can target multiple chains without reshaping the mandate, and issue #265 is building the cross-implementation conformance vectors for mandate-hash derivation it depends on.

| Field | Type | Description |
| --- | --- | --- |
| `mandateHash` | bytes32 | keccak256 of the canonical AP2 CartMandate / IntentMandate JSON, per the #265 conformance derivation |
| `payer` | address | Principal's address: EOA, EIP-7702-delegated EOA, or smart account (EIP-1271 verification fall-through) |
| `agent` | address | Executing agent's address; resolvable against ERC-8004 identity |
| `merchant` | address | Merchant's attested address |
| `maxAmount` | uint256 | Per-transaction cap, smallest currency unit |
| `cumulativeCap` | uint256 | Total cap across the mandate's lifetime |
| `deadline` | uint64 | Unix expiry, the AP2 TTL |
| `nonce` | uint256 | Replay protection |

The EEA's contribution here is standardization, not invention: adopt the community shape, publish it as the neutral normative typehash with test vectors, and align the AP2 SDK's emitted schema against it so one envelope serves every compliant chain and every rail.

### Slot A — Trust registry and root of trust

**Interface.** A Shibui-based EAS schema, `AgentAuthorizationSchema`, lets any recognized institution publish one signed, revocable, on-chain claim about an address. Trust resolution becomes a single read instead of a bilateral agreement.

| Field | Type | Description |
| --- | --- | --- |
| `agentAddress` | address | The AP2 participant's Ethereum address |
| `agentRole` | bytes32 | `SHOPPING_AGENT` \| `CREDENTIALS_PROVIDER` \| `MERCHANT` |
| `ap2AgentCardURI` | string | URI of the AP2 agent card JSON |
| `erc8004Id` | uint256 | Optional link to the agent's ERC-8004 identity token |
| `authorizedBy` | address | Attesting institution: card network, EEA member, regulator-recognized body |
| `validUntil` | uint64 | Expiry |
| `revocable` | bool | Whether the attester may revoke |
| `extensionData` | bytes | Optional agent-attestation payload: model id and version, TEE attestation hash, policy-compliance proof, aligned with the taxonomy proposed in issue #255 |

Resolution mirrors Shibui's existing ERC-3643 border check. A Shopping Agent calls `EAS.getAttestation(counterparty, AgentAuthorizationSchema)`; the check passes if the attestation exists, is unexpired and unrevoked, and its issuer is in the agent's trusted-attester set. `addTrustedAttester()`, already defined in Shibui for token issuers, plays the identical role for AP2 participants: each institution keeps sovereign control of its own trust perimeter while sharing one registry.

**Root of trust, same mechanism, one level up.** AP2 § 9 asks why any signing key should be trusted. The answer is an attestation about the key's address, issued by whichever root the ecosystem recognizes: a card network, a government authority, or the EEA as trust-anchor registrar. A governance decision, not new cryptography.

**Backward compatibility.** AP2 agent cards gain one optional `ethereumAddress` field. Participants without Ethereum infrastructure keep their allow-lists untouched; the message format does not change.

### Slot B — Dispute evidence and adjudication

**Interface.** ERC-8183 (Draft, February 2026, Ethereum Foundation dAI team and Virtuals Protocol) defines the needed shape exactly: a Client funds a Job, a Provider submits work, and a single Evaluator alone marks it complete or rejected, across four states. For an AP2 transaction using Ethereum signing, the Shopping Agent optionally opens a Job keyed to the MandateEnvelope's `mandateHash`.

| ERC-8183 state | Trigger | AP2 equivalent |
| --- | --- | --- |
| Open | `mandateHash` published; funds not yet locked | Cart created, not yet authorized |
| Funded | Tokens escrowed, linked to the PaymentMandate | Payment authorized |
| Submitted | Merchant posts the delivery attestation as deliverable | Order fulfilled |
| Terminal | Evaluator confirms or rejects; funds release or return | Dispute resolved |

The Evaluator is the governance object: a role both sides recognize in advance, a card network's dispute service, an EEA-recognized arbitration provider, or for narrow cases a rules-bound smart contract. The EEA maintains the recognized-evaluator registry as an EAS attestation set, exactly as it maintains the trusted-attester registry in Slot A. Community discussion on ERC-8183 is already proposing that an Evaluator's `complete()` call write into ERC-8004's Reputation Registry; the EEA should formalize that link, so every resolved AP2 dispute feeds the same on-chain track record any future counterparty checks.

**Draft status, stated plainly.** ERC-8183 has not reached Review or Final. Its one meaningful production deployment is Virtuals Protocol's marketplace. Building on it now is the right call, Ethereum specs converge in public and early engagement shapes the terms, but it should be presented as co-development, not adoption of settled infrastructure.

**Backward compatibility.** Job creation is at the Shopping Agent's discretion, per transaction. Every existing AP2 flow keeps merchant-held JSON evidence unchanged.

## Part V — Governance path

### Two tracks, per AP2's own rules

AP2's contribution rules split the work cleanly, and the adapter follows the split rather than fighting it:

- **Normative track (FIDO).** The MandateEnvelope typehash, the AgentAuthorizationSchema, and the evaluator-registry model go to the FIDO Alliance AP2 working group as a proposed official extension, submitted with EEA institutional standing.
- **Implementation track (GitHub).** An open-source reference implementation and SDK-alignment evidence go to the AP2 repository, whose scope is exactly samples and SDK. This is also where the EEA picks up the community's existing work, #255's envelope, #265's conformance vectors, rather than duplicating it.

### Working group

Four seats define the minimum viable table: AP2 implementors from the FIDO working group; MetaMask (delegation stack); Coinbase (x402 and the a2a-x402 extension); Virtuals Protocol (the ERC-8183 production deployment). Independent builders already contributing, the authors of #255, #224, and #280, are invited in with the standing they currently lack. All outputs publish under the EEA IPR Policy's open terms — specification text under CC BY 4.0, software under Apache 2.0 — implementable by any party without fee, under the EEA's existing antitrust-safe process.

### Deliverables and sequence

1. Publish the `AgentAuthorizationSchema` and the recognized-evaluator registry schema on Ethereum mainnet and Base. Small, concrete, shippable this quarter.
2. Publish the normative `MandateEnvelope` typehash with cross-implementation test vectors, aligned with the #265 conformance work and validated against the AP2 SDK's emitted schemas.
3. Convene the working group and submit the extension proposal to the FIDO AP2 working group.
4. Engage ERC-8183's public review process directly, including the 8183-to-8004 reputation write-back, so the standard finalizes with the adapter's requirements built in.

**The one-line version for a board slide:** AP2's community is already building the trust layer in fragments. The EEA converges the fragments into one neutral standard and carries it into the room where it becomes official. Two schemas, two registries, one submission.

---

Enterprise Ethereum Alliance · [entethalliance.org](https://entethalliance.org) · Draft, August 2026 · Specification text: CC BY 4.0 · Code: Apache License 2.0 (see [LICENSE](LICENSE) and [CONTRIBUTING.md](CONTRIBUTING.md))
