# AP2 for Ethereum Settlement

## Canonical research specification

**Working name:** Rialto<br>
**Version:** 0.1.0-research<br>
**Date:** 3 September 2026<br>
**Author:** Redwan Meslem, Executive Director, Enterprise Ethereum Alliance<br>
**License:** CC BY 4.0

> **Thesis:** Ethereum settlement is an optional AP2-compatible profile, not a universal first-party AP2 rail.

## Executive summary

1. **What is the problem?** AP2 can establish that a user authorized an agent payment. Ethereum still needs an interoperable way to bind that verified authorization to the exact settlement action.
2. **What is missing today?** There is no agreed AP2-to-EVM artifact binding, typed settlement authorization, replay and cap policy, institutional trust resolver, or delivery-conditional custody mapping.
3. **What could Rialto provide?** A narrow profile with four separable workstreams: artifact reference, settlement authorization, trust resolution, and optional job escrow.
4. **What needs to be tested?** Known-answer vectors and negative cases for the first two workstreams come first. Cross-language verification, resolver tests, escrow tests, and security review follow.
5. **What does the industry need to work on together?** The open questions span AP2, wallets, payment protocols, Ethereum contracts, institutional policy, and standards governance. No one project can answer them alone.

## Document control

This file is the canonical technical source for this repository. `README.md` and `index.html` explain the work; `demo.html` illustrates it. If any of them conflicts with this file on technical behavior, this file controls.

This is an individual research contribution by Redwan Meslem. It is not an EEA standard, EEA position, EEA member work product, statement of member consensus, or adopted work of AP2, FIDO, EAS, x402, or Ethereum. No implementation may claim conformance to this research version because the required vector suites do not yet exist.

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** describe candidate requirements for an implementation that explicitly targets this version. They do not modify any dependency.

### Audience

This specification addresses:

- AP2 implementers producing or verifying Checkout and Payment Mandates;
- wallet, smart-account, payment, and contract teams executing on EVM chains; and
- institutional architects defining counterparty, attester, evaluator, evidence, and operational policy.

### Dependency snapshot

Research results are reproducible only against named versions. Implementations MUST pin dependencies and MUST NOT infer stable behavior from an unversioned `main` branch.

| Dependency | Snapshot used here | Status and role |
| --- | --- | --- |
| AP2 | [`e1ea56d`](https://github.com/google-agentic-commerce/AP2/tree/e1ea56db72a6385bce3e5c1112b3a56ce60acb43) | v0.2 source for mandates, verification, constraints, and receipts |
| x402 | [`7488a46`](https://github.com/x402-foundation/x402/tree/7488a46fb7fa411e4b1e34c4b0f670cd357eb05e) | v2 payment transport and scheme reference; AP2 binding remains separate |
| EIP-712 | [`94f5a3e`](https://github.com/ethereum/EIPs/blob/94f5a3e3c146c28625d9ab2f8a7c0a848530a13a/EIPS/eip-712.md) | Final typed structured data signing |
| ERC-7715 | [`bb48e3a`](https://github.com/ethereum/ERCs/blob/bb48e3add1097f5a80df1d70947a823b1d506c01/ERCS/erc-7715.md) | Draft wallet execution-permission request |
| EAS contracts | [`e6e9702`](https://github.com/ethereum-attestation-service/eas-contracts/tree/e6e970286ff18bbdfc5d8eff2742c5ece46040e4) | Attestation creation, UID lookup, expiry, and revocation |
| Shibui | [`9a0edd7`](https://github.com/EntEthAlliance/rnd-rwa-erc3643-eas/tree/9a0edd7241a5b49303c01f2bda60d4e2778c7c9d) | Reference pattern for registered UIDs and attester authorization |
| ERC-8004 | [`bb48e3a`](https://github.com/ethereum/ERCs/blob/bb48e3add1097f5a80df1d70947a823b1d506c01/ERCS/erc-8004.md) | Draft agent identity, reputation, and validation registries |
| ERC-8183 | [`bb48e3a`](https://github.com/ethereum/ERCs/blob/bb48e3add1097f5a80df1d70947a823b1d506c01/ERCS/erc-8183.md) | Draft ERC-20 job escrow |

Later dependency changes require a new Rialto research version and new vectors.

# 1. What is the problem?

## 1.1 The handoff is undefined

AP2 defines how participants create and verify authorization artifacts for agent payments. It deliberately permits different payment instruments and commerce protocols. Ethereum defines programmable accounts, signatures, tokens, and contracts. Neither one alone specifies the handoff between a successfully verified AP2 presentation and one exact EVM execution.

The minimum handoff must answer:

- Which AP2 version and artifact were verified?
- Which AP2-defined digest or transaction identifier is being referenced?
- Who authorized the EVM payer and agent?
- Which chain and contract may consume the authorization?
- Which address is the verified payee?
- Which asset and atomic amount may move?
- Which time, nonce, and spending limits apply?
- Which counterparty or evaluator policy, if any, must pass?
- Did the funds move directly, or were they placed in escrow before delivery?

Without a common answer, two implementations can both say "AP2 plus Ethereum" while signing different bytes, accepting different counterparties, or enforcing different replay and custody assumptions.

## 1.2 Scope

This research covers an optional settlement profile for EVM-compatible chains:

1. verify AP2 according to the selected AP2 version;
2. derive a versioned reference without replacing AP2 hash semantics;
3. authorize one EVM settlement action;
4. apply optional institutional trust policy; and
5. execute either direct settlement or explicitly selected escrow.

The profile does not make Ethereum a first-party or universal AP2 rail. It does not apply unchanged to cards, ACH, SEPA, FedNow, or other non-EVM systems.

## 1.3 Authority boundary

AP2 remains authoritative for:

- mandate types, versioning, signatures, selective disclosure, and verification;
- the meaning of Checkout and Payment Mandate constraints;
- the roles and evidence defined by AP2; and
- AP2 receipts.

An EVM integration is authoritative only for:

- the chain-specific execution authorization;
- on-chain replay and accounting state;
- the mapping from a verified AP2 payee or merchant identity to an EVM recipient;
- optional local trust policy; and
- direct or escrow custody on the selected chain.

An EVM signature MUST NOT make an invalid AP2 presentation valid. An EVM implementation MUST reject settlement if the verified AP2 context and signed settlement fields disagree.

## 1.4 Non-goals

This research does not:

- replace AP2 SD-JWT processing;
- create a universal root of trust;
- treat an EAS attestation as trustworthy solely because it is on-chain;
- make local spending state global across chains;
- turn a digest into proof of physical delivery, service quality, or legal sufficiency;
- add chargeback rights to a final direct transfer;
- replace courts, regulation, card-network rules, or consumer-protection rights;
- standardize Draft ERCs outside the Ethereum process; or
- assert that a new standard is necessary before implementation evidence exists.

# 2. What is missing today?

## 2.1 Six interoperability gaps

| Gap | Why it matters |
| --- | --- |
| AP2 artifact reference | A contract needs a fixed, versioned reference, but the integration must not reinterpret or silently replace AP2 digest rules. |
| Settlement authorization | Chain, contract, payer, agent, payee, asset, amount, validity, nonce, and limits need one authenticated interpretation. |
| Replay and cap state | EIP-712 signs data but does not consume it or maintain spending state. |
| Counterparty trust | EAS records claims, but it does not decide which attester is authorized for which topic. |
| Custody and delivery | Direct settlement and escrow have different ownership, release, refund, and timing semantics. |
| Evidence and operations | Retrieval, retention, freshness, evaluator failure, appeals, and external rights remain higher-layer responsibilities. |

## 2.2 Five corrections are protocol invariants

### 2.2.1 EAS resolves by UID

Core EAS exposes:

```solidity
function getAttestation(bytes32 uid) external view returns (Attestation memory);
```

It does not expose `getAttestation(counterparty, schema)`. A verifier that begins with a subject and topic needs a trusted indexer, a registry of known UIDs, or both. The result still needs full EAS verification.

### 2.2.2 ERC-8183 has no mandate-hash constructor

The Draft ERC-8183 interface does not define `createJob(mandateHash)`. It creates a job using provider, evaluator, expiry, description, and optional hook data. A mandate binding therefore requires an adapter, hook, or specified description reference with enforceable validation.

At the pinned snapshot, ERC-8183's normative prose describes `fund(jobId, expectedBudget, optParams?)` while one reference hooked contract implements `fund(jobId, bytes optParams)`. Rialto MUST NOT freeze an ERC-8183 ABI until the upstream Draft is internally consistent and pinned.

### 2.2.3 EIP-712 does not stop replay

EIP-712 provides typed hashing, signing, and domain separation. The specification explicitly says it does not include replay protection. A consuming contract must scope, check, and atomically consume nonce state.

### 2.2.4 Cumulative caps do not become cross-chain caps

A cumulative cap is only as broad as the authenticated state that accounts for spend. If two chains keep independent counters, the user has two local caps. A global cap needs a separate shared-state or cross-chain protocol with its own trust and finality model.

### 2.2.5 Escrow cannot refund funds it never held

A direct merchant transfer gives the recipient custody. Creating an ERC-8183 job later does not give that job custody of the earlier payment or the ability to reverse it. The direct or escrow path must be selected before the relevant funds move.

## 2.3 AP2 hash semantics must survive the handoff

Rialto MUST NOT define `keccak256(canonical CartMandate JSON)` or an equivalent generic AP2 hash.

In the pinned AP2 v0.2 snapshot:

- a closed Checkout Mandate uses `mandate.checkout.1`;
- `checkout_hash` is the base64url-encoded hash of the exact `checkout_jwt` value;
- the digest algorithm matches the SD-JWT `_sd_alg`, or `sha-256` if `_sd_alg` is absent;
- a closed Payment Mandate uses `mandate.payment.1` and contains `transaction_id`; and
- a community proposal for `open_mandate_hash` vectors exists in AP2 issue #265, but a proposal is not a general normative hash rule for every AP2 artifact.

The settlement profile must preserve the selected AP2 version's exact artifact, byte, encoding, and digest semantics. When AP2 has no native digest for the exact object that an EVM implementation needs to bind, the correct result is an explicit open issue, not an invented canonicalization rule.

# 3. What could Rialto provide?

## 3.1 Profile shape

Rialto separates four workstreams:

| Workstream | Required for minimum direct settlement? | Purpose |
| --- | --- | --- |
| A. AP2 artifact reference | Yes | Carry a fixed-size, versioned reference to the verified AP2 context |
| B. EVM settlement authorization | Yes | Bind and enforce the exact EVM action |
| C. Institutional trust resolution | No | Apply named attester and freshness policy |
| D. ERC-20 job escrow | No | Hold funds before delivery for compatible service jobs |

An implementation can test A and B without C or D. It can use C with direct settlement. It can use D only when the payment is placed into escrow before performance.

## 3.2 Processing model

A candidate implementation performs these steps in order:

1. Pin and load the selected AP2 version.
2. Verify the AP2 presentation and all required disclosures, signatures, temporal rules, constraints, and role responsibilities.
3. Produce an internal `VerifiedAP2Context`.
4. Construct an AP2 reference using a registered mapping for that AP2 version and artifact type.
5. Construct the chain-specific settlement authorization.
6. Verify payer and any required agent authority.
7. Resolve optional counterparty and evaluator policy at the required freshness.
8. Atomically consume nonce and cap state.
9. Execute the preselected direct or escrow path.
10. Record the settlement result and preserve retrievable AP2 evidence under the applicable retention policy.

Failure at any step MUST prevent later execution.

## 3.3 Workstream A: AP2 artifact reference

### 3.3.1 Internal verified context

`VerifiedAP2Context` is an implementation concept, not a new AP2 object. It should retain at least:

| Value | Source |
| --- | --- |
| Selected AP2 version | Verifier configuration |
| Exact `vct` artifact type | Verified AP2 artifact |
| AP2 transaction identifier | Verified Payment Mandate, when present |
| AP2-native digest fields and algorithms | Verified artifact |
| Verified payer, agent, payee, and role bindings | AP2 verification result and local policy |
| Relevant amount, asset, recurrence, and time constraints | Verified disclosures |
| Verification time and dependency snapshot | Verifier record |

The settlement layer MUST consume this verified context. It MUST NOT reconstruct AP2 meaning from unverified JSON supplied beside a transaction.

### 3.3.2 Candidate fixed-size reference

The following is a design target. Its exact ABI and type strings remain unfrozen until vectors are published.

```solidity
struct AP2Reference {
    bytes32 ap2Version;
    bytes32 artifactType;
    bytes32 digestProfile;
    bytes32 artifactDigest;
    bytes32 transactionId;
}
```

| Field | Meaning |
| --- | --- |
| `ap2Version` | Identifier for the pinned AP2 release or source snapshot |
| `artifactType` | Identifier derived from the exact verified `vct` |
| `digestProfile` | Identifier for the registered AP2-to-bytes mapping |
| `artifactDigest` | Raw digest bytes produced by that mapping |
| `transactionId` | Fixed-size encoding of AP2 `transaction_id` when the mapping defines one |

A mapping registry MUST state:

- the AP2 version and artifact type;
- the exact source field or exact byte sequence;
- the digest algorithm;
- whether an encoded value represents raw digest bytes or text;
- base64url padding behavior;
- rejection rules for length or alphabet errors; and
- positive and negative vectors.

### 3.3.3 AP2 v0.2 mapping status

| Artifact | What can be mapped now | What remains open |
| --- | --- | --- |
| Closed Checkout Mandate | Decode `checkout_hash` as base64url digest bytes using the AP2-selected algorithm. Its meaning is the digest of `checkout_jwt`. | Confirm the version identifier and fixed encoding through vectors. |
| Closed Payment Mandate | Carry the verified `transaction_id` under an explicit encoding rule. | AP2 v0.2 does not supply a general native digest of the exact Payment Mandate for this EVM purpose. |
| Open Checkout or Payment Mandate | Preserve any AP2-defined reference semantics. | Do not adopt issue #265 or any other proposed canonicalization as normative until the owning process does so. |

The unresolved Payment Mandate binding blocks a final Workstream A wire format.

### 3.3.4 Privacy

Only the minimum fixed-size reference and required disclosures SHOULD reach public chain state. A design review MUST cover:

- low-entropy dictionary attacks;
- correlation of payer, agent, merchant, and recurring purchases;
- linkability from reusing the same digest or transaction identifier;
- permanent publication of trust or evidence metadata; and
- whether a hiding or salted commitment is necessary.

Any hiding construction needs its own disclosure protocol and vectors.

## 3.4 Workstream B: EVM settlement authorization

### 3.4.1 Candidate signed fields

The following field set is a design target, not a frozen EIP-712 type.

```solidity
struct SettlementAuthorization {
    AP2Reference ap2;
    address payer;
    address agent;
    address payee;
    address asset;
    uint256 amount;
    uint256 perTransactionCap;
    uint256 cumulativeCap;
    bytes32 capScope;
    uint256 nonce;
    uint64 validAfter;
    uint64 deadline;
    bytes32 settlementMode;
}
```

The EIP-712 domain MUST contain:

| Field | Requirement |
| --- | --- |
| `name` | Profile name fixed by the eventual vector release |
| `version` | Major wire-format version |
| `chainId` | Chain where the authorization is consumed |
| `verifyingContract` | Contract that consumes the authorization and nonce |

The consumer MUST reject:

- a different chain or verifying contract;
- a payer, agent, payee, asset, or amount inconsistent with the verified AP2 context;
- execution before `validAfter` or after `deadline`;
- an unknown settlement mode;
- a used or invalid nonce;
- a per-transaction or cumulative-cap violation; or
- an unresolved AP2 reference mapping.

### 3.4.2 Identity and role binding

`payee` is the settlement recipient. It MUST NOT be assumed to equal a human-readable AP2 Merchant identity. A verifier needs an authenticated mapping from the verified AP2 payee or merchant to the EVM address.

The profile must also define:

- which AP2 role or account authorizes `payer`;
- how the AP2 proof-of-possession key or authorized agent maps to `agent`;
- whether payer authorization alone is sufficient;
- when a separate agent signature is required; and
- how key rotation between AP2 verification and EVM execution is handled.

Until those mappings are versioned and tested, an implementation MUST describe them as local policy.

### 3.4.3 Signer types

- An EOA signature must use canonical ECDSA validation.
- A contract account must be checked under EIP-1271 and return the required magic value.
- An EIP-7702 account must be evaluated under its current delegated code. EIP-7702 alone does not authorize an agent.
- The verifier must define when state-dependent EIP-1271 validity is authoritative.
- Signature validity must be checked before external settlement effects.

### 3.4.4 Replay protection and caps

Nonce state MUST be scoped by at least payer and verifying contract. It SHOULD also be scoped by the authorization or AP2 reference where the execution model permits.

The contract MUST:

1. verify the complete authorization;
2. check the nonce and cap state;
3. mark the nonce consumed and update spend state; and
4. perform external token or hook calls;

all within one atomic transaction. Reentrancy MUST NOT permit a second execution against the old state.

If `cumulativeCap` is non-zero, `capScope` must identify the payer, authorization or mandate, asset, chain, and accounting contract whose stored total is authoritative. A separate authorization and state protocol is required for a cross-chain cap.

### 3.4.5 Assets and amounts

Amounts MUST use integer atomic token units. The authorization MUST identify the token contract. The implementation MUST define support or rejection for:

- native currency;
- fee-on-transfer tokens;
- rebasing tokens;
- tokens that return no Boolean value;
- callback-enabled tokens; and
- decimal metadata changes or mismatches.

Display decimals MUST NOT be signed as floating-point values.

### 3.4.6 Wallet permissions

ERC-7715 is a Draft request interface, not proof that a requested permission was granted unchanged. The pinned specification says the response is not guaranteed to contain values equivalent to the request.

An integration MUST compare the returned grant with the request and reject broader or different:

- chain scope;
- account or delegate;
- asset or amount;
- target or calldata;
- recurrence or cap;
- validity interval; and
- permission type or rule set.

The grant must be validated again when redeemed. Wallet success alone is not AP2 verification or EVM settlement authorization.

### 3.4.7 Direct settlement and x402

x402 can carry and settle EVM payments, but the pinned AP2 `a2a-x402` sample says the AP2-compatible extension is forthcoming and that the current extension must be enhanced to create the key AP2 mandates.

A direct-settlement adapter therefore MUST define an authenticated binding between:

- the verified AP2 reference;
- the x402 payment requirements and selected scheme;
- payer and payee;
- asset and amount;
- validity and nonce; and
- the eventual settlement response.

An x402 payment authorization does not automatically contain an AP2 reference. A future x402 extension may solve this, but this specification does not describe that binding as complete.

## 3.5 Workstream C: institutional trust resolution

This is the most differentiated research workstream. AP2 verification relies on verifiers deciding which credential issuers and keys they trust. EAS supplies claims without deciding which attester a relying party should trust for a particular topic. A neutral, portable resolver could make that boundary explicit.

### 3.5.1 Trust question

The resolver answers:

> Under policy P, at observation point B, is attester A authorized to make claim T about subject S, and is there a current EAS attestation that satisfies that policy?

It does not answer whether the claim is objectively true.

### 3.5.2 Resolver inputs and result

| Input | Meaning |
| --- | --- |
| `subject` | Address or versioned subject identifier being evaluated |
| `topic` | Namespaced claim topic, such as a role or assurance profile |
| `policyId` | Exact relying-party policy and version |
| `observationChain` | Chain containing the authoritative registry and EAS deployment |
| `minimumFinality` | Required inclusion or finality rule |
| `maximumAge` | Maximum permitted age of the state read or index |

The resolver returns one of:

| Result | Meaning |
| --- | --- |
| `ACCEPT` | A qualifying, current claim from an authorized attester was verified |
| `REJECT` | Authoritative current state proves the policy is not satisfied |
| `INDETERMINATE` | Freshness, finality, availability, or conflict prevents a safe decision |

The result SHOULD include the policy version, selected UID, attester, observation block, block hash, timestamp, and reason code. A payment policy should normally fail closed on `INDETERMINATE`.

### 3.5.3 EAS-native fields

The resolver MUST use EAS-native fields where they already exist:

- `recipient` as the subject address;
- `attester` as the issuer;
- `schema` as the schema UID;
- `expirationTime` for expiry;
- `revocable` and `revocationTime` for revocation; and
- `refUID` where a parent or authorization relationship is specified.

Duplicating those values inside schema data creates two possible truths. If a schema duplicates one for external compatibility, its resolver MUST enforce equality.

### 3.5.4 Candidate claim payload

The data payload should contain only claims that EAS does not already represent:

| Field | Type | Purpose |
| --- | --- | --- |
| `topic` | `bytes32` | Versioned, namespaced claim topic |
| `role` | `bytes32` | Optional AP2 or commerce role |
| `assuranceProfile` | `bytes32` | Policy or assurance definition used by the attester |
| `agentCardURI` | `string` | Optional discovery document |
| `agentCardDigest` | `bytes32` | Integrity binding for mutable URI content |
| `agentRegistry` | `bytes32` | Optional namespaced ERC-8004 registry reference |
| `agentId` | `uint256` | Optional ID, meaningful only with the registry reference |
| `evidenceURI` | `string` | Optional access-controlled supporting evidence |
| `evidenceDigest` | `bytes32` | Integrity commitment for that evidence |

A URI or registry ID alone does not prove control of the address, AP2 key, Agent Card, or optional ERC-8004 identity. The binding proof must be specified.

### 3.5.5 UID discovery

Because core EAS resolves by UID, a practical resolver needs a discovery mechanism. The Shibui pattern is a useful starting point:

1. register one or more attestation UIDs for a subject, topic, and attester;
2. enumerate attesters authorized for that topic under a named policy;
3. retrieve each candidate with `EAS.getAttestation(uid)`;
4. verify UID, schema, recipient, attester, expiry, revocation, and payload;
5. verify that the attester authorization is current; and
6. apply conflict and assurance rules.

An indexer MAY accelerate discovery. It MUST NOT replace verification against authoritative chain state at the required freshness.

### 3.5.6 Attester authorization

Attester authorization is separate from the subject claim. A policy model must identify:

- the authority that admits and removes attesters;
- the exact topics and assurance profiles each attester may issue;
- jurisdiction or relying-party scope;
- validity interval;
- authorization UID or other evidence;
- key rotation and successor rules;
- suspension and emergency revocation;
- administrator separation, quorum, and change delay; and
- audit and appeal procedure.

An attester authorized for one topic MUST NOT be accepted for another. An attester's own subject claim MUST NOT bootstrap its authority.

### 3.5.7 Freshness, finality, and revocation

On-chain publication does not make every verifier instantly current. Revocation is observable only after:

1. the revocation transaction is included;
2. the verifier's required finality rule is satisfied; and
3. the verifier reads that state directly or through a sufficiently fresh service.

The policy must set:

- minimum block confirmation or finality;
- maximum RPC, replica, cache, and indexer lag;
- behavior during reorganization;
- cache invalidation triggers;
- acceptable clock skew;
- cross-chain synchronization rules, if any; and
- fail-closed behavior when freshness cannot be proven.

A cached pre-revocation result MUST NOT be labeled current.

### 3.5.8 Conflicts and decision records

The resolver must define behavior for multiple current attestations, conflicting claims, policy version changes, and removal of a formerly trusted attester. It SHOULD preserve a decision record sufficient to reproduce:

- the policy used;
- all candidate UIDs considered;
- the authoritative block reference;
- the selected claim or conflict rule;
- the reason for `ACCEPT`, `REJECT`, or `INDETERMINATE`; and
- the relation between decision time and settlement time.

Sensitive evidence should remain off-chain or access-controlled. The decision record should reveal no more than is necessary for audit.

### 3.5.9 ERC-8004 relationship

ERC-8004 is optional and Draft. Its identity registry may provide a portable agent identifier. Its reputation or validation data MUST NOT replace named attester authorization or local relying-party policy. The pinned ERC-8004 text states that payments are orthogonal to that protocol.

## 3.6 Workstream D: optional ERC-20 job escrow

### 3.6.1 When it applies

ERC-8183 models a service job funded with ERC-20 value. It is relevant when funds must be held before a provider performs work and released or refunded under a defined evaluation policy.

It is not the default settlement path for every AP2 payment. It does not apply unchanged to card or bank rails.

### 3.6.2 Semantic mapping

| ERC-8183 concept | Candidate AP2/EVM mapping |
| --- | --- |
| Client | Payer or explicitly authorized escrow client |
| Provider | Verified EVM payee |
| Evaluator | Address accepted under the named evaluator policy |
| Description | Versioned URI or compact reference carrying the AP2 binding |
| Budget | Atomic ERC-20 amount consistent with settlement authorization |
| Deliverable | Commitment to submitted work or evidence |
| Reason | Commitment to structured completion or rejection evidence |

The adapter or hook MUST enforce the AP2 relationship. Text in a description field alone is not an enforceable binding.

### 3.6.3 Custody rule

For one payment obligation, the implementation must select one custody path:

- **Direct:** value moves to the payee under the direct settlement rules. No ERC-8183 refund is implied.
- **Escrow:** value moves into the pinned ERC-8183-compatible contract before performance. Release and refund follow that job state and evaluator policy.

The same payment MUST NOT be represented as both a completed direct transfer and a still-refundable escrow deposit.

### 3.6.4 Draft API rule

Rialto pins ERC-8183 semantics, not the current unfinalized ABI. A prototype MUST:

- identify the exact ERC-8183 source commit and contract deployed;
- document deviations between normative prose and reference code;
- avoid any nonexistent `createJob(mandateHash)` call;
- make the AP2 binding explicit in an adapter or hook; and
- regenerate integration tests whenever the Draft ABI changes.

### 3.6.5 Evaluator and dispute policy

Before handling value, an escrow profile needs rules for:

- evaluator selection, consent, scope, compensation, conflicts, and rotation;
- evidence format, access, integrity, availability, confidentiality, and retention;
- delivery deadline, submission time, evaluation window, and escrow expiry;
- the race between evaluation and expiry refund;
- evaluator outage, compromise, refusal, and censorship;
- fallback, escalation, appeal, or external adjudication;
- partial, late, or unverifiable performance; and
- mandatory consumer and legal rights.

A deliverable digest proves that later bytes match a commitment. It does not prove that goods arrived, that work met its specification, or that the evidence remains available.

# 4. What needs to be tested?

Testing is the roadmap. Later governance work does not compensate for an ambiguous byte mapping.

## 4.1 Sequenced release gates

| Gate | Deliverable | Exit condition |
| --- | --- | --- |
| 0. Freeze inputs | Pinned AP2 artifacts, dependency commits, and expected verifier context | Every fixture identifies exact source bytes and version |
| 1. Artifact vectors | Positive and negative AP2 reference vectors | TypeScript and Python produce identical bytes and rejection results |
| 2. Settlement vectors | Exact EIP-712 types, domains, digests, and signatures | Solidity, TypeScript, and Python agree on every known-answer vector |
| 3. Negative execution tests | Replay, expiry, cap, identity, payee, asset, and permission failures | Every failure is deterministic and value cannot move |
| 4. Trust resolver tests | UID registration, attester authorization, revocation, staleness, conflict, and finality cases | Resolver produces reproducible three-state decisions |
| 5. Escrow tests | Custody, state transitions, expiry races, evaluator failure, and evidence availability | Funds follow only the documented path under every tested transition |
| 6. Adversarial review | Threat model, privacy review, contract audit, and operational exercises | Critical findings are resolved before real-value deployment |

Workstreams A and B MUST pass Gates 0 through 3 before their wire format is frozen. A trust profile must also pass Gate 4. An escrow profile must also pass Gate 5.

## 4.2 Required artifact vectors

Vectors must cover:

- exact signed bytes versus decoded JSON;
- base64url with and without padding;
- raw digest bytes versus the text encoding of a digest;
- wrong digest length or alphabet;
- wrong AP2 version or `vct`;
- altered disclosure or transaction identifier;
- Unicode and numeric edge cases only where the selected AP2 rule actually canonicalizes them; and
- unsupported artifacts for which no mapping is registered.

Each vector should include input bytes, expected intermediate values, expected output, and expected refusal code.

## 4.3 Required settlement vectors

Positive vectors must freeze:

- all EIP-712 type strings and dependency ordering;
- domain separator;
- struct hash;
- final digest;
- EOA signature and recovered signer;
- EIP-1271 call and expected magic value; and
- encoded contract calldata.

Negative vectors must include:

- wrong chain;
- wrong verifying contract;
- wrong AP2 reference;
- payer, agent, or payee substitution;
- wrong asset or atomic amount;
- execution before `validAfter` or after `deadline`;
- exact nonce replay and concurrent replay;
- per-transaction cap exceeded;
- cumulative cap reached and exceeded;
- separate chains each enforcing a local cap;
- malicious token callback and reentrancy attempt;
- EIP-1271 validity changing with account state; and
- ERC-7715 response broader than the request.

## 4.4 Required trust vectors

Trust tests must include:

- correct UID, subject, schema, attester, topic, and payload;
- nonexistent UID;
- correct claim from an unauthorized attester;
- authorized attester for the wrong topic;
- expired or revoked subject claim;
- expired, revoked, suspended, or replaced attester authorization;
- stale indexer returning a pre-revocation result;
- RPC or indexer unavailable;
- reorganization before required finality;
- conflicting valid claims;
- policy upgrade between authorization and settlement; and
- two chains with unsynchronized registries.

Tests must distinguish `REJECT` from `INDETERMINATE`.

## 4.5 Required escrow vectors

Escrow tests must include:

- direct transfer incorrectly presented as refundable;
- job funded before required AP2 binding;
- wrong provider, evaluator, token, or budget;
- submit, complete, reject, and expiry transitions;
- submission near expiry;
- evaluator completion racing with refund;
- evaluator outage or malicious decision;
- hook failure and reentrancy;
- missing or altered off-chain evidence; and
- upstream ERC-8183 ABI change.

## 4.6 Conformance language

This research version defines no conformance badge or production profile. A future claim must identify:

- Rialto version;
- AP2 version and artifact mappings;
- EVM chain and contract;
- supported signer and wallet-permission types;
- whether Workstream C is implemented and under which policy;
- whether Workstream D is implemented and against which ERC-8183 snapshot;
- vector-suite version and results; and
- security review status.

# 5. What does the industry need to work on together?

Rialto should make coordination questions precise enough for the correct owners to answer. It should not answer them unilaterally.

## 5.1 Questions already visible in the AP2 community

| Community signal | Industry question |
| --- | --- |
| [AP2 issue #255](https://github.com/google-agentic-commerce/AP2/issues/255), settlement-side mandate binding | What minimum verified AP2 context must an on-chain settlement consume, and which parts belong in AP2, an EVM profile, or implementation guidance? |
| [AP2 issue #265](https://github.com/google-agentic-commerce/AP2/issues/265), open-mandate vectors | Which byte and digest rules are normative, and where should official cross-language conformance fixtures live? |
| [AP2 issue #280](https://github.com/google-agentic-commerce/AP2/issues/280), counterparty trust credentials | How does a relying party discover a credential, authorize its issuer for a topic, and decide freshness without creating a proprietary root of trust? |
| [AP2 issue #224](https://github.com/google-agentic-commerce/AP2/issues/224), delivery-before-release escrow | When is direct settlement sufficient, when is prefunded escrow required, and what evidence and adjudication can release funds? |
| [AP2 issue #290](https://github.com/google-agentic-commerce/AP2/issues/290), post-checkout action record | Which actions after checkout need a verifiable record, who retains it, and how does it relate to AP2 receipts and settlement evidence? |
| [AP2 issue #293](https://github.com/google-agentic-commerce/AP2/issues/293), proof of when | When is signer-asserted time insufficient, what independent time evidence is useful, and which exact artifact bytes does it cover? |

These issues are prior art and demand signals. They are not adopted AP2 requirements.

## 5.2 Decisions requiring joint work

The industry needs agreement on:

1. the AP2 artifact or verified context that settlement references;
2. the exact AP2-to-bytes mappings and vector ownership;
3. payer, agent, merchant, payee, and EVM address binding;
4. nonce lifecycle and the boundary of cumulative accounting;
5. authenticated AP2-to-x402 composition;
6. the minimum trust-resolver interface and result semantics;
7. attester authorization, revocation, finality, and staleness policy;
8. when identity, validation, or transaction-grounded feedback from ERC-8004 is useful;
9. direct settlement versus escrow selection;
10. evaluator, evidence, expiry, fallback, appeal, and external-rights policy;
11. retrieval and retention of AP2 and settlement evidence; and
12. whether each output belongs in FIDO/AP2, an Ethereum standard, an implementation report, or no standard.

## 5.3 Division of responsibility

| Participant | Contribution |
| --- | --- |
| AP2 and FIDO contributors | Confirm AP2 artifact semantics, verification outputs, extension boundaries, and official vectors |
| Wallet and smart-account teams | Test permission grants, signer mappings, EIP-1271 behavior, and user-visible constraints |
| x402 and payment providers | Specify authenticated transport and settlement binding without weakening AP2 |
| EAS, Shibui, and Ethereum implementers | Test UID discovery, attester authorization, chain state, and Draft ERC integration |
| Merchants and agent developers | Supply real flows, failure cases, evidence needs, and operational constraints |
| Banks, networks, and institutional risk teams | Define assurance, counterparty, freshness, retention, liability, and escalation requirements |
| Security reviewers | Challenge byte mappings, contract state, custody, privacy, and governance assumptions |

## 5.4 Standards posture

The first engagement with FIDO should be an implementation report:

> We composed a pinned AP2 version with EVM settlement. These parts aligned, these assumptions diverged, and these vectors reproduce the result.

That creates evidence for the working group without presenting an external extension as a finished answer. Ethereum-facing contract or interface changes should follow the relevant EIP/ERC process. Trust-policy work should first prove a portable resolver and governance model before anyone claims institutional consensus.

# Appendix A. Candidate refusal vocabulary

A reference implementation should define stable errors for at least:

| Code | Meaning |
| --- | --- |
| `AP2_VERIFICATION_FAILED` | AP2 verification did not succeed |
| `AP2_MAPPING_UNSUPPORTED` | No registered mapping exists for the version and artifact |
| `AP2_REFERENCE_MISMATCH` | Settlement reference disagrees with verified AP2 context |
| `SIGNER_INVALID` | Required payer or agent authority failed |
| `NOT_YET_VALID` | Authorization is early |
| `EXPIRED` | Authorization is late |
| `NONCE_USED` | Nonce has already been consumed |
| `DOMAIN_MISMATCH` | Chain or verifying contract is wrong |
| `PAYEE_MISMATCH` | EVM recipient is not bound to the verified AP2 party |
| `ASSET_MISMATCH` | Asset is not authorized |
| `AMOUNT_INVALID` | Amount is inconsistent or malformed |
| `CAP_EXCEEDED` | Per-transaction or cumulative cap would be exceeded |
| `PERMISSION_MISMATCH` | Wallet grant differs from permitted request |
| `TRUST_REJECTED` | Current authoritative trust state fails policy |
| `TRUST_INDETERMINATE` | Trust state is not fresh, final, available, or unambiguous |
| `CUSTODY_MISMATCH` | Claimed direct or escrow path does not match fund custody |
| `ESCROW_STATE_INVALID` | Requested job transition is not permitted |

# Appendix B. Threat review minimum

A threat model must address:

- cross-chain and cross-contract replay;
- nonce races and cap-accounting reentrancy;
- AP2-to-EVM identity substitution;
- ECDSA malleability and EIP-1271 state change;
- EIP-7702 delegated-code replacement;
- malicious or non-standard token behavior;
- payee resolution compromise;
- attestation replacement, revocation, stale reads, and conflicting claims;
- registry administrator and attester compromise;
- evaluator conflict, censorship, outage, and expiry races;
- inaccessible off-chain evidence;
- public metadata correlation and low-entropy digest attacks;
- L2 sequencing, reorganization, finality, and cross-deployment divergence; and
- upgrade authorization and storage compatibility.

# Appendix C. References

- [AP2 v0.2 specification](https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/docs/ap2/specification.md)
- [AP2 Checkout Mandate](https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/docs/ap2/checkout_mandate.md)
- [AP2 Payment Mandate](https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/docs/ap2/payment_mandate.md)
- [AP2 security and privacy considerations](https://github.com/google-agentic-commerce/AP2/blob/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/docs/ap2/security_and_privacy_considerations.md)
- [AP2 `a2a-x402` sample](https://github.com/google-agentic-commerce/AP2/tree/e1ea56db72a6385bce3e5c1112b3a56ce60acb43/code/samples/python/scenarios/a2a/human-present/x402)
- [x402 specification v2](https://github.com/x402-foundation/x402/blob/7488a46fb7fa411e4b1e34c4b0f670cd357eb05e/specs/x402-specification-v2.md)
- [x402 exact EVM scheme](https://github.com/x402-foundation/x402/blob/7488a46fb7fa411e4b1e34c4b0f670cd357eb05e/specs/schemes/exact/scheme_exact_evm.md)
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)
- [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702)
- [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715)
- [Ethereum Attestation Service](https://github.com/ethereum-attestation-service/eas-contracts)
- [Shibui](https://github.com/EntEthAlliance/rnd-rwa-erc3643-eas)
- [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8183](https://eips.ethereum.org/EIPS/eip-8183)

# Appendix D. Practical publication sequence

1. **Five things people get wrong when connecting AP2 to Ethereum.** Publish the correction artifact first. It is independently useful and establishes the implementation boundary.
2. **AP2 for Ethereum settlement: vectors and negative tests.** Publish known-answer fixtures, cross-language verification, and failure cases before freezing the profile.
3. **FIDO implementation report.** Bring the composition results to FIDO as evidence of where AP2 and EVM settlement aligned or broke, not as a pre-decided extension.
4. **Institutional trust resolution for agent payments.** Split Workstream C into its own draft and lead with registered-UID discovery, attester authorization, finality, staleness, and conflict policy.
5. **Decide whether a formal profile is justified.** Use implementation evidence and industry review to choose an AP2 profile, Ethereum standard, implementation guidance, or no new standard.

---

Redwan Meslem | Independent research | September 2026<br>
Affiliation: Enterprise Ethereum Alliance
