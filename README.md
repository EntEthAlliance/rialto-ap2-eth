# Rialto: an exploratory AP2–Ethereum profile

An exploratory discussion draft asking how versioned Agent Payments Protocol (AP2) artifacts might compose with Ethereum settlement, optional trust attestations, and optional ERC-20 job escrow.

**Why “Rialto”:** a working name that evokes Venice's historic bridge and market district. It is not meant to imply ownership of the underlying work.

**Exploratory discussion draft · September 2026 · Specification text CC BY 4.0 · Code Apache 2.0**

Enterprise Ethereum Alliance · [entethalliance.org](https://entethalliance.org)

Published draft: [entethalliance.github.io/eea-rnd-ap2-ethereum-adapter](https://entethalliance.github.io/eea-rnd-ap2-ethereum-adapter/) ([`index.html`](index.html)).

Illustrative demo: [entethalliance.github.io/eea-rnd-ap2-ethereum-adapter/demo.html](https://entethalliance.github.io/eea-rnd-ap2-ethereum-adapter/demo.html) ([`demo.html`](demo.html)).

> [!IMPORTANT]
> Rialto is a tentative contribution to an active field. It is not an adopted AP2, FIDO, EEA, EAS, or Ethereum standard, a deployed reference implementation, or a claim of consensus. It does not claim originality over the underlying protocols or endorsement by the projects cited here. ERC-8004 and ERC-8183 are Draft ERCs and may change. The uppercase requirement terms below describe candidate safeguards if a profile were adopted; they are not current obligations for AP2 or Ethereum implementations.

## 1. Scope

AP2 defines authorization artifacts and verification responsibilities for agent-initiated payments. It intentionally leaves payment-instrument implementation, artifact retrieval, evidence retention, and adjudication mechanisms extensible or out of scope. AP2 v0.2 standardization continues in the FIDO Alliance following Google's April 2026 contribution.

Rialto explores four separately discussable candidate workstreams:

1. **AP2 Artifact Commitment** — examines how to commit a versioned AP2 artifact to a fixed-size value suitable for Ethereum.
2. **EVM Settlement Authorization** — examines authorization of one settlement action using a chain- and contract-bound EIP-712 signature.
3. **EAS Trust Resolution** — considers optional institutional attestations through EAS and a Shibui-style policy adapter.
4. **ERC-8183 Escrow** — considers mapping compatible ERC-20 service-job transactions into optional evaluator-mediated escrow.

This draft should not be represented as a general solution for card, ACH, SEPA, FedNow, or other non-EVM rails. Those rails may reuse AP2 artifacts and governance concepts, but they do not share Ethereum addresses, EIP-712 signatures, ERC-20 escrow, or Ethereum state.

### 1.1 Non-goals

This draft does not attempt to:

- replace AP2's SD-JWT and selective-disclosure verification;
- create a universal or objective root of trust;
- make EAS attestations trustworthy merely by placing them on-chain;
- make cumulative spending globally enforceable across chains;
- turn a deliverable hash into proof of physical delivery or quality;
- replace card-network rules, courts, consumer-protection rights, or existing dispute processes;
- standardize ERC-8004 or ERC-8183 ahead of their respective ERC processes.

### 1.2 Relationship to existing work

Rialto begins from substantial work already underway. It should align with, test, and credit that work rather than position itself as the owner or arbiter of AP2–Ethereum integration:

- **Authorization and intent:** AP2 v0.2 and the FIDO Alliance provide the authorization foundation. FIDO and Mastercard's Verifiable Intent work addresses related proofs of user intent. Rialto does not replace either effort.
- **Payment-rail integration:** AP2's `a2a-x402` sample demonstrates a human-present flow using an x402-compatible payment method, while its README says the AP2-compatible x402 extension is still forthcoming and must be enhanced to create all key AP2 mandates. Core x402 is a payment protocol, not by itself an AP2 mandate-binding profile. Rialto's possible role is limited to studying a compatible EVM authorization and commitment profile.
- **Delegation and permissions:** MetaMask's Delegation Framework, EIP-7702, and Draft ERC-7715 provide important account-delegation and wallet-permission primitives. Rialto should reuse or interoperate with those mechanisms where appropriate, not invent a competing wallet permission system or treat a permission request as proof of the permission actually granted.
- **Attestations and policy:** EAS supplies general attestation infrastructure. Shibui, an EEA R&D project, already explores registered attestation UIDs, trusted-attester policies, and institutional trust patterns. The candidate resolver workstream builds on those patterns.
- **Agent identity and escrow:** ERC-8004 develops agent identity, reputation, and validation concepts; ERC-8183 develops an ERC-20 service-job escrow state machine. Both remain Draft ERCs and retain their own governance and authorship.
- **AP2 community proposals:** issue #255 on mandate binding, #224 on PactEscrow, #280 on BlindOracle, #265 on conformance vectors, #290 on post-checkout records, and #293 on proof-of-when are relevant prior art and demand signals. Their inclusion here does not imply adoption or endorsement.

Rialto's tentative contribution is narrower: examine whether these pieces compose safely, make gaps and assumptions explicit, and offer testable candidate EVM mappings for discussion. Where an existing proposal already addresses a requirement, this work should prefer convergence and attribution over a Rialto-specific alternative.

### 1.3 How to read requirement language

The words **MUST**, **SHOULD**, and **MAY** identify candidate interoperability or security requirements inside this discussion draft. They become binding only for an implementation that voluntarily claims conformance to a future, explicitly versioned Rialto profile. They do not modify AP2, EAS, Ethereum, Shibui, ERC-8004, ERC-8183, or any other cited specification.

## 2. Dependency status and terminology

Implementations MUST pin dependency versions and MUST NOT infer normative behavior from unversioned `main` branches.

| Dependency | Rialto usage | Status relevant to this draft |
| --- | --- | --- |
| AP2 v0.2 | Checkout and Payment Mandates, receipts, constraints, SD-JWT processing | Public specification contributed to FIDO; future normative development occurs at FIDO |
| x402 v2 | Optional payment protocol and EVM payment schemes | Published protocol; the AP2 sample still labels the AP2-compatible x402 extension as forthcoming |
| EIP-712 | Typed EVM settlement authorization | Final |
| EIP-1271 | Contract-account signature validation | Final |
| EIP-7702 | EOA code delegation | Live protocol feature; does not itself define Rialto authorization policy |
| ERC-7715 | Wallet execution-permission request and discovery RPCs | Draft; permission/rule support and the returned grant are wallet-dependent |
| EAS | Attestation storage and revocation | Deployed infrastructure; trust policy remains application-defined |
| Shibui | Reference pattern for registered attestation UIDs, topic policies, and attester authorization | EEA R&D implementation, not an AP2 standard |
| ERC-8004 | Optional agent identity and reputation linkage | Draft |
| ERC-8183 | Optional ERC-20 service-job escrow | Draft |

AP2 v0.2 defines **Checkout Mandates** and **Payment Mandates**. Older SDK material may still refer to `IntentMandate` and `CartMandate`; Rialto implementations MUST use the vocabulary and schemas of the explicitly selected AP2 version.

## 3. Working hypothesis: one AP2 authority, one settlement authorization

The working hypothesis does not introduce a second interpretation of user intent. An implementation first verifies the applicable AP2 credential chain according to AP2. Only after that verification succeeds may it construct an EVM settlement authorization containing the minimum data needed to execute settlement.

```text
AP2 presentation
  → AP2 verification and selective disclosure
  → versioned artifact commitment
  → chain-specific settlement authorization
  → optional trust-policy check
  → direct settlement or optional ERC-8183 escrow
```

If AP2 verification and the EVM authorization disagree, settlement MUST fail. An EVM signature MUST NOT make an invalid AP2 presentation valid.

## 4. Candidate workstream A — AP2 Artifact Commitment

### 4.1 Do not invent a second canonicalization rule

Rialto MUST preserve the hash algorithm, serialization rule, and artifact semantics defined by the selected AP2 version. In AP2 v0.2:

- a closed Checkout Mandate contains `checkout_hash`, normally a SHA-256 digest of the merchant-signed `checkout_jwt`;
- a Payment Mandate contains `transaction_id`, binding it to the checkout;
- proposed `open_mandate_hash` conformance work currently uses `SHA-256(JCS_RFC8785(unsigned open-checkout-mandate body))` and is not yet normative for every AP2 artifact.

Rialto therefore MUST NOT define `keccak256(canonical CartMandate / IntentMandate JSON)` as an AP2 hash.

### 4.2 Commitment

An `AP2ArtifactCommitment` carries explicit provenance:

| Field | Type | Meaning |
| --- | --- | --- |
| `ap2Version` | `bytes32` | Hash of the pinned AP2 version identifier, for example `keccak256("ap2-v0.2")` |
| `artifactType` | `bytes32` | Hash of the exact `vct`, for example `keccak256("mandate.payment.1")` |
| `digestAlgorithm` | `uint8` | Registry value identifying SHA-256, Keccak-256, or a future algorithm |
| `artifactDigest` | `bytes32` | The digest produced by the selected AP2 rule |
| `transactionIdDigest` | `bytes32` | Fixed-size representation of the AP2 transaction identifier, where applicable |

The conversion from AP2's base64url or textual representation to `bytes32` MUST be defined byte-for-byte and covered by test vectors. Implementations MUST NOT hash a displayed string when the AP2 field represents raw digest bytes.

### 4.3 Privacy

Only a commitment and the disclosures required by the verifier SHOULD be placed on-chain. Implementations MUST analyze dictionary attacks against low-entropy artifacts, linkability across merchants, public payer–agent–merchant graphs, and long-term evidence retention. A salted or hiding commitment MAY be required; if used, its construction and disclosure rules MUST be standardized and tested.

## 5. Candidate workstream B — EVM Settlement Authorization

### 5.1 EIP-712 domain

The same struct definition may be implemented across EVM chains, but a signature MUST be bound to its execution domain. The EIP-712 domain MUST contain:

| Domain field | Required value |
| --- | --- |
| `name` | `RialtoSettlement` |
| `version` | Major version of this profile |
| `chainId` | Chain on which settlement executes |
| `verifyingContract` | Contract that consumes the authorization and its nonce |

A signature valid on one chain or verifying contract MUST NOT be accepted on another. A cross-chain implementation requires a separate interoperability design and MUST NOT claim a global cumulative cap without shared, authenticated state.

### 5.2 Proposed typed structure

```solidity
struct SettlementAuthorization {
    bytes32 ap2Version;
    bytes32 artifactType;
    uint8 digestAlgorithm;
    bytes32 artifactDigest;
    bytes32 transactionIdDigest;
    address payer;
    address agent;
    address payee;
    address asset;
    uint256 amount;
    uint256 perTransactionCap;
    uint256 cumulativeCap;
    bytes32 capScope;
    uint256 executionNonce;
    uint64 deadline;
}
```

`payee` is the settlement recipient and is not assumed to be identical to the AP2 Merchant. The mapping from the AP2 payee/merchant identity to `payee` MUST be verified by policy.

`asset` identifies the ERC-20 token. Native currency support, fee-on-transfer tokens, rebasing tokens, and tokens with unusual decimal behavior require separate explicit rules. Amounts MUST use atomic token units; user interfaces MUST obtain decimals from a trusted token definition and MUST NOT include floating-point values in signed data.

### 5.3 Nonces and caps

EIP-712 defines typed-data hashing, signing, and domain separation; it explicitly does not provide replay protection. The verifying contract MUST atomically consume `executionNonce` before external settlement effects. Nonce state MUST be scoped at least by payer and verifying contract.

If `cumulativeCap` is non-zero, `capScope` MUST unambiguously identify the payer, mandate, asset, chain, and accounting contract whose stored spend is authoritative. The contract MUST update spent state atomically. A cap enforced independently on two chains is two local caps, not one global cap.

### 5.4 Signers

The profile MUST specify which AP2 role authorizes `payer` and how the AP2 `cnf` proof-of-possession key maps to `agent`.

- EOAs use normal ECDSA recovery with canonical-signature checks.
- Contract accounts use EIP-1271 and MUST return the required magic value.
- EIP-7702 accounts MUST be treated according to their current delegated code; EIP-7702 alone is not proof that a particular agent is authorized.
- Because EIP-1271 validity may depend on mutable contract state, implementations MUST define the time at which validity is authoritative.

An additional agent signature MAY be required by policy, but it MUST NOT substitute for the AP2 credential chain or payer authorization.

### 5.5 Delegation and wallet permissions

An account-delegation primitive does not establish AP2 identity, validate AP2 credentials, or guarantee a particular spending policy. A Rialto implementation using ERC-7715 MUST:

- treat ERC-7715 as Draft and discover the permission and rule types supported by the selected wallet;
- compare the full permission response with the request, because ERC-7715 states that returned values are not guaranteed to equal requested values;
- reject a grant whose chain, account, delegate, permission, amount, asset, target, calldata scope, or expiry is broader than policy allows; and
- validate the granted permission again when it is redeemed rather than treating successful RPC return as settlement authorization.

MetaMask's Delegation Framework states that a delegation permits any on-chain action by default and therefore strongly recommends caveats. Implementations using it MUST pin an audited tagged release, define and test every required caveat, and MUST NOT infer safety from the package name or from EIP-7702 alone.

### 5.6 Settlement-rail selection

x402 v2 defines payment requirements, payloads, verification, settlement, and several payment-flow orderings. Its exact EVM example carries EIP-3009 authorization fields such as payer, recipient, amount, validity window, and nonce; those fields do not inherently carry an AP2 artifact commitment. A future composition MUST define a versioned x402 extension or other authenticated binding between the AP2 transaction and the selected x402 payment.

The AP2 `a2a-x402` sample is useful prior art, but its own README says that the AP2-compatible x402 extension is coming soon and that the current extension must be enhanced to create all key AP2 mandates. This draft therefore MUST NOT describe AP2-to-x402 mandate binding as already complete.

For a single payment amount, an implementation MUST select its custody path before service execution:

- a direct x402 flow follows the ordering and reconciliation rules of its selected x402 scheme; or
- an ERC-8183 flow prefunds the ERC-8183 job and releases or refunds that escrow under its evaluator policy.

x402 v2 also names one scheme-level payment flow `escrow`; that name does not make it ERC-8183 or give it ERC-8183 semantics. An adapter MAY use an x402 transport or scheme to initiate ERC-8183 funding only if the authenticated binding, custody, and settlement responses are specified. Directly transferring the same funds to a merchant and only afterward creating an ERC-8183 job cannot give that job custody of, or refund authority over, the earlier transfer.

### 5.7 Refusal reasons

A reference implementation SHOULD define stable custom errors for at least:

- invalid AP2 artifact commitment;
- unsupported AP2 version or digest algorithm;
- invalid payer or agent signature;
- expired authorization;
- used nonce;
- wrong chain or verifying contract;
- asset mismatch;
- per-transaction or cumulative-cap violation;
- missing, expired, revoked, or untrusted attestation;
- payee binding failure.

## 6. Candidate workstream C — EAS Trust Resolution

EAS records claims; consumers decide which claim issuers and policies they trust. A shared EAS deployment improves interoperability and auditability but does not eliminate trust configuration.

### 6.1 EAS-native identity fields

An authorization attestation SHOULD use EAS-native fields rather than duplicate them:

- EAS `recipient` is the subject address;
- EAS `attester` is the issuer;
- EAS `expirationTime` is the expiry;
- EAS `revocable` and `revocationTime` define revocation behavior.

If duplicated inside schema data for another protocol, equality with the EAS-native value MUST be enforced by a resolver.

### 6.2 Proposed schema data

The schema payload SHOULD be limited to claims not already represented by EAS:

| Field | Type | Meaning |
| --- | --- | --- |
| `role` | `bytes32` | Versioned, namespaced AP2 role identifier |
| `ap2AgentCardURI` | `string` | Optional URI; mutable HTTPS content SHOULD also have a digest commitment |
| `agentRegistry` | `string` | Optional ERC-8004 registry identifier `{namespace}:{chainId}:{identityRegistry}` |
| `agentId` | `uint256` | Optional ERC-8004 ID, meaningful only with `agentRegistry` |
| `assuranceProfile` | `bytes32` | Versioned policy/assurance profile evaluated by the attester |
| `evidenceURI` | `string` | Optional encrypted or access-controlled evidence location |
| `evidenceHash` | `bytes32` | Integrity commitment for evidence |

The relationship between an address, Agent Card, AP2 signing key, and optional ERC-8004 registration MUST be proven; merely placing an `ethereumAddress` in mutable metadata is insufficient.

### 6.3 Implementable lookup

Core EAS resolves an attestation by UID, not by `(counterparty, schema)`.

A resolver conforming to this candidate workstream would therefore need an indexer or Shibui-style registry:

```text
resolve(subject, topic)
  → obtain registered attestation UID(s)
  → EAS.getAttestation(uid)
  → verify UID, schema, recipient, attester, expiration, revocation and payload
  → verify attester authorization and local trust policy
```

Shibui's current pattern registers a UID for `(identity, topic, attester)`, iterates the trusted attesters for a topic, and requires an issuer-authorization attestation when `addTrustedAttester(address, topics, authUID)` is called. Any Rialto prototype should reuse or generalize that pattern rather than document a nonexistent EAS overload.

Revocation is not an instantaneous broadcast to every verifier. A verifier observes a revocation only after the revocation transaction is included under its chosen finality rule and the verifier reads sufficiently fresh chain state. If it uses an EAS indexer, cache, RPC replica, or cross-chain copy, it MUST define acceptable lag, fail-closed behavior, and invalidation rules. A cached pre-revocation result MUST NOT be described as current merely because the underlying EAS record is on-chain.

### 6.4 Governance requirements

Before a registry is described as “recognized,” a future profile would need governance rules covering:

- who can authorize, suspend, and remove attesters or evaluators;
- assurance levels, jurisdiction, claim scope, and policy versioning;
- key rotation and emergency compromise response;
- quorum, administrator separation, and change delays;
- erroneous-attestation correction and appeals;
- audit logs and public decision criteria;
- synchronization and finality assumptions across deployments.

Publishing registries independently on mainnet and Base creates two governance and state domains unless a synchronization mechanism is specified.

## 7. Candidate workstream D — optional ERC-8183 escrow

ERC-8183 defines an ERC-20-funded service job with `Open`, `Funded`, `Submitted`, `Completed`, `Rejected`, and `Expired` states. “Terminal” is a category covering the last three, not a separate stored state.

This draft considers ERC-8183 only when the commerce flow is compatible with prefunded ERC-20 job escrow. It should not be presented as unchanged settlement for card or bank rails.

### 7.1 Mapping

| ERC-8183 element | Rialto binding |
| --- | --- |
| `client` | Payer or an explicitly authorized escrow client |
| `provider` | Verified EVM payee; not assumed from a merchant name |
| `evaluator` | Address selected and accepted under the applicable evaluator policy |
| `description` | Versioned URI or compact reference to the AP2 artifact commitment |
| `deliverable` | Commitment to the submitted work or delivery evidence |
| `reason` | Commitment to structured completion/rejection evidence |

The binding MUST be enforced by a hook, adapter, or reference contract; merely mentioning a mandate hash in a description does not create a unique or verified relationship.

The core ERC-8183 lifecycle is not `createJob` followed immediately by `fund`. The client calls `createJob(provider, evaluator, expiredAt, description, hook?)`, the client or provider calls `setBudget(jobId, amount, optParams?)`, and the client calls `fund(jobId, expectedBudget, optParams?)`. `fund` checks that the stored budget equals `expectedBudget`. A mandate commitment therefore belongs in the string `description`, in authenticated hook parameters, or in a separately specified adapter—not in a nonexistent `createJob(mandateHash)` overload.

### 7.2 Required higher-level policy

An evaluator-mediated flow MUST specify:

- evaluator selection, acceptance, fees, conflicts, and key rotation;
- evidence format, access, availability, retention, and confidentiality;
- an evaluation window distinct from delivery and mandate expiry;
- behavior when expiry is reached after submission;
- fallback or appeal behavior when an evaluator is unavailable or compromised;
- reason codes and the effect of partial, late, or unverifiable delivery;
- interaction with mandatory consumer rights and external adjudication.

ERC-8183 permits an expiry refund while a job is Funded or Submitted. Implementations MUST make that race visible and MUST NOT describe escrow as guaranteeing payment or recourse without specifying the applicable timing and evaluator policy.

A deliverable hash proves that later evidence matches a commitment. It does not by itself prove that goods arrived, services conformed, or evidence remains retrievable.

### 7.3 ERC-8004 feedback

Any ERC-8004 integration is optional and Draft-dependent. Feedback MUST identify the complete `(agentRegistry, agentId)` pair and SHOULD reference the job, terminal state, evaluator, reason commitment, and applicable policy. A terminal ERC-8183 state MUST NOT automatically be interpreted as globally valid reputation without reviewer filtering and anti-Sybil policy.

## 8. AP2 dispute evidence and backward compatibility

AP2 v0.2 states that Checkout artifacts may be provided by the Shopping Agent or Merchant, while Payment artifacts may be provided by the Shopping Agent, Credential Provider, Network, or Merchant Payment Processor. It leaves retrieval, retention, and actual dispute-resolution procedure outside its present scope.

Rialto supplements that evidence for opted-in EVM flows; it does not replace it. Implementations MUST retain the AP2 artifacts needed for AP2 verification and MUST NOT claim that an on-chain digest makes off-chain evidence independently available.

Candidate workstreams A and B require an explicit AP2-to-EVM mapping and therefore are not achieved merely by adding an optional address to an Agent Card. Candidate workstreams C and D are independently optional.

## 9. Security and privacy requirements

A reference implementation and review MUST cover at least:

- cross-chain and cross-contract replay;
- nonce reuse, concurrent execution, and atomic cap accounting;
- AP2/EVM identity-binding substitution;
- ECDSA malleability and EIP-1271 state changes;
- EIP-7702 delegated-code replacement;
- token decimals, fee-on-transfer, rebasing, callback, and return-value behavior;
- attestation expiry, revocation, replacement, stale indexing, and attester removal;
- conflicting attestations and policy-version changes;
- evaluator compromise, censorship, conflicts, outage, and expiry races;
- missing or inaccessible off-chain evidence;
- privacy leakage, dictionary attacks, graph correlation, and metadata permanence;
- L2 sequencing, reorganization, finality, and multi-deployment divergence;
- upgrade authorization and storage compatibility, if contracts are upgradeable.

Contracts MUST follow checks-effects-interactions, use reentrancy protection where external token or hook calls occur, and define upgrade and administrator powers explicitly.

## 10. Research and possible conformance deliverables

Any future implementation or standards proposal would require at least:

1. Versioned JSON schemas for all off-chain Rialto objects.
2. Solidity interfaces and an executable reference implementation.
3. Exact EIP-712 type strings, domain rules, and known-answer vectors.
4. AP2 artifact conversion vectors covering base64url/raw-byte handling and pinned AP2 schemas.
5. Cross-language verification in at least Solidity, JavaScript/TypeScript, and Python.
6. Positive and negative vectors for replay, expiry, nonces, caps, signer types, and payee binding.
7. EAS/Shibui tests for registration, multiple attesters, revocation, expiry, de-trusting, and conflicting claims.
8. ERC-8183 tests for completion, rejection, submitted-job expiry, evaluator failure, and evidence unavailability.
9. A threat model, privacy analysis, governance specification, and deployment runbook.
10. Independent smart-contract security review before handling real value.

The interactive demo is illustrative only. It should use the same field names and call shapes as this draft and clearly label simulated actions, candidate behavior, and Draft dependencies.

## 11. Possible research and standards path

A suggested research sequence is:

1. Agree scope and terminology with AP2/FIDO contributors, including alignment with other FIDO contributions such as Verifiable Intent.
2. Prototype candidate workstreams A and B against a pinned AP2 v0.2 fixture set on one EVM testnet.
3. Adapt Shibui's UID-registration and attester-authorization pattern for candidate workstream C.
4. Prototype candidate workstream D separately for a service-job use case; do not make escrow a prerequisite for AP2 settlement.
5. Publish the conformance and security deliverables in §10.
6. Submit AP2-facing extension text through the applicable FIDO process and Ethereum-facing interface changes through the relevant ERC processes.

This sequence is neither a commitment by the cited projects nor a claim that a new standard is necessary. Existing community proposals are useful prior art, not adopted standards. Reuse requires technical validation, attribution, and compliance with the source contribution and licensing terms.

## 12. References and acknowledgements

Rialto depends on ideas, specifications, implementations, and public discussion from the projects and contributors below. Listing a source acknowledges that contribution; it does not imply endorsement of this draft.

- [AP2 v0.2 specification](https://github.com/google-agentic-commerce/AP2/blob/main/docs/ap2/specification.md)
- [AP2 Checkout Mandate](https://github.com/google-agentic-commerce/AP2/blob/main/docs/ap2/checkout_mandate.md)
- [AP2 Payment Mandate](https://github.com/google-agentic-commerce/AP2/blob/main/docs/ap2/payment_mandate.md)
- [AP2 contribution scope](https://github.com/google-agentic-commerce/AP2/blob/main/CONTRIBUTING.md)
- [AP2 `a2a-x402` sample](https://github.com/google-agentic-commerce/AP2/tree/main/code/samples/python/scenarios/a2a/human-present/x402)
- [x402 protocol specification v2](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md)
- [AP2 issue #224: PactEscrow proposal](https://github.com/google-agentic-commerce/AP2/issues/224)
- [AP2 issue #255: mandate-binding proposal](https://github.com/google-agentic-commerce/AP2/issues/255)
- [AP2 issue #265: proposed open-mandate conformance vectors](https://github.com/google-agentic-commerce/AP2/issues/265)
- [AP2 issue #280: BlindOracle proposal](https://github.com/google-agentic-commerce/AP2/issues/280)
- [AP2 issue #290: post-checkout record proposal](https://github.com/google-agentic-commerce/AP2/issues/290)
- [AP2 issue #293: proof-of-when proposal](https://github.com/google-agentic-commerce/AP2/issues/293)
- [FIDO Alliance: AP2 and Verifiable Intent](https://fidoalliance.org/building-the-trust-layer-for-agentic-payments-with-ap2-and-verifiable-intent/)
- [MetaMask Delegation Framework](https://github.com/MetaMask/delegation-framework)
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)
- [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)
- [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715)
- [Ethereum Attestation Service](https://docs.attest.org/docs/core--concepts/attestations)
- [EAS Indexing Service](https://github.com/ethereum-attestation-service/eas-indexing-service)
- [Shibui](https://github.com/EntEthAlliance/rnd-rwa-erc3643-eas)
- [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8183](https://eips.ethereum.org/EIPS/eip-8183)
- [FIDO Alliance AP2 announcement](https://fidoalliance.org/google-donates-agent-payments-protocol-to-fido-alliance/)

---

Enterprise Ethereum Alliance · [entethalliance.org](https://entethalliance.org) · Exploratory discussion draft, September 2026 · Specification text: CC BY 4.0 · Code: Apache License 2.0
