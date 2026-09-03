# AP2 for Ethereum Settlement

## Rialto research project

> **Ethereum settlement is an optional AP2-compatible profile, not a universal first-party AP2 rail.**

Research by **Redwan Meslem**, Executive Director, Enterprise Ethereum Alliance.

## The project in five questions

1. **What is the problem?** AP2 can establish that a user authorized an agent payment. When that payment settles on Ethereum, there is no common profile that binds the verified AP2 authorization to the exact chain, contract, payer, payee, asset, amount, and execution.
2. **What is missing today?** Implementers still have to invent that binding, replay protection, cap accounting, counterparty trust policy, and any delivery-conditional custody model. Independent implementations can therefore make different security choices while all claiming to compose AP2 with Ethereum.
3. **What could Rialto provide?** A small, optional profile for AP2 artifact references, EVM settlement authorization, institutional trust resolution, and, only where needed, ERC-20 job escrow.
4. **What needs to be tested?** Digest and EIP-712 known-answer vectors, cross-language verification, negative cases, one-chain prototypes, and security review must come before a finished design or conformance claim.
5. **What does the industry need to work on together?** AP2 authors, wallet and payment teams, Ethereum infrastructure providers, institutions, and standards bodies need to agree on the binding rules, trust model, evidence boundaries, and correct standards venue.

## Status and authorship

Published as an individual research contribution by Redwan Meslem. This is not an EEA standard, EEA position, EEA member work product, or statement of member consensus. It is not an adopted AP2, FIDO, EAS, x402, or Ethereum standard. Draft dependencies may change.

## Who this is for

This work is written for three audiences:

- AP2 implementers deciding how a verified mandate reaches an EVM settlement system;
- Ethereum wallet, payment, and smart-account teams implementing authorization and execution; and
- institutional architects deciding which counterparties, attesters, evaluators, and evidence they can rely on.

## Start here

| Resource | Purpose |
| --- | --- |
| [Published overview](https://entethalliance.github.io/rialto-ap2-eth/) | Plain-language explanation of the problem and research direction |
| [Canonical technical specification](SPEC.md) | Source of truth for scope, requirements, open decisions, and dependency snapshots |
| [Illustrative flow demo](https://entethalliance.github.io/rialto-ap2-eth/demo.html) | Non-production walkthrough of direct settlement and optional escrow |
| [Contribution guidance](CONTRIBUTING.md) | How to propose corrections, tests, and implementation work |

**Canonicality rule:** [SPEC.md](SPEC.md) is the canonical technical document for this repository. The README, website, and demo are explanatory. If they conflict on technical behavior, `SPEC.md` controls.

Rialto is the working project name. The descriptive public title is **AP2 for Ethereum Settlement**.

## The core thesis

AP2 remains the authority for the authorization artifact and its verification. Ethereum settlement adds only the chain-specific facts needed to execute safely.

1. Verify the selected, versioned AP2 presentation.
2. Preserve the digest and artifact semantics defined by that AP2 version.
3. Bind the resulting settlement authorization to one chain and one consuming contract.
4. Apply explicit nonce, cap, payee, asset, and trust policies.
5. Choose direct transfer or escrow before funds move.

An Ethereum signature cannot repair an invalid AP2 presentation. An attestation cannot make an unknown issuer trustworthy. Escrow cannot refund funds it never held.

## Five corrections that implementations must preserve

These are security invariants, not editorial caveats:

1. **EAS lookup is UID-based.** Core EAS exposes `getAttestation(bytes32 uid)`. It does not expose `getAttestation(counterparty, schema)`. Subject or topic lookup needs an indexer or registry.
2. **ERC-8183 does not create a job from a mandate hash.** Its Draft interface has no `createJob(mandateHash)` overload. Any AP2 commitment needs an explicitly specified adapter, hook, or description binding.
3. **EIP-712 does not provide replay protection.** The consuming contract must enforce and atomically consume nonce state.
4. **A cumulative cap is local unless state is shared.** The same cap checked independently on two chains is two local caps, not one global cap.
5. **Refund authority follows custody.** An ERC-8183 job can refund value held by that escrow. It cannot reverse a direct merchant transfer that happened outside the escrow.

One more rule sits underneath all five: Rialto does not define `keccak256(canonical AP2 JSON)`. AP2's versioned hash, serialization, and artifact rules must be preserved. Where AP2 has not defined a binding, that gap stays visible until a versioned rule and vectors exist.

## Candidate workstreams

| Workstream | Question | Current priority |
| --- | --- | --- |
| A. Artifact reference | How does EVM settlement refer to the verified AP2 authorization without changing AP2 hash semantics? | Publish fixtures and conversion vectors |
| B. Settlement authorization | How are chain, contract, payer, payee, asset, amount, validity, nonce, and caps signed and enforced? | Publish EIP-712 and negative vectors |
| C. Trust resolution | Which attester is authorized for which topic, and how does a verifier handle revocation, finality, stale reads, and conflicting claims? | Develop as a separate draft |
| D. Optional escrow | When must funds be held before delivery, and how are evaluator, evidence, expiry, and appeal policies defined? | Prototype only after custody is explicit |

Workstreams A and B are the minimum settlement path. C is an optional institutional policy layer. D is an optional custody choice for suitable service-job transactions. None of them replaces AP2.

## What would count as progress

- Published AP2-to-EVM known-answer vectors with raw-byte and base64url cases.
- The same EIP-712 digest verified in Solidity, TypeScript, and Python.
- Negative tests for replay, expiry, wrong chain, wrong contract, payee substitution, cap exhaustion, stale trust state, and escrow timing races.
- A trust resolver draft with named attester authorization and testable freshness rules.
- A FIDO implementation report that records where AP2 and EVM settlement composed cleanly and where assumptions diverged.
- Independent review before any contract handles real value.

## Practical publication sequence

1. **Five things people get wrong when connecting AP2 to Ethereum.** Publish the five corrections above as a short standalone artifact.
2. **AP2 for Ethereum settlement: vectors and negative tests.** Publish fixtures before freezing more architecture.
3. **FIDO implementation report.** Report what happened when a pinned AP2 version was composed with EVM settlement. Present observed gaps, not a competing extension.
4. **Institutional trust resolution for agent payments.** Publish Workstream C separately, with attester authorization, registered-UID resolution, finality, staleness, and governance boundaries.
5. **Decide whether a formal profile is justified.** Only after implementation evidence and cross-industry review should the work seek an AP2 profile, Ethereum standard, implementation guide, or no new standard at all.

---

Redwan Meslem | Independent research | September 2026<br>
Affiliation: Enterprise Ethereum Alliance<br>
Specification text: CC BY 4.0 | Code: Apache License 2.0
