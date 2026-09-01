# The AP2-Ethereum Trust Adapter

**Draft Specification v0.2 · August 2026 · Supersedes v0.1 (May 2026)**
Enterprise Ethereum Alliance · [entethalliance.org](https://entethalliance.org)

Published version: [ap2-ethereum-trust-adapter.html](https://entethalliance.github.io/ops-finance/ap2-ethereum-trust-adapter.html) (part of the [EEA Resource Hub](https://entethalliance.github.io/ops-finance/agents.html))

This repo is the source of truth for the spec going forward, and the home for the concrete artifacts (EAS schemas, working-group tracking) once they exist.

## What changed since v0.1

**In one line:** the market moved faster than the spec. Coinbase, MetaMask, and the Ethereum Foundation have already shipped three of the five gaps v0.1 proposed bridging. Two remain, and they are governance problems, not engineering problems, which is exactly where the EEA has standing that no vendor does.

v0.1 of this document (May 2026) treated all five of AP2's open slots as unsolved and proposed Ethereum-based resolvers for each. Deeper research since, into the AP2 repository itself, the Ethereum Foundation's and MetaMask's shipped infrastructure, and the current Ethereum upgrade roadmap, shows that three of those five slots are no longer open. They shipped, in production, months ago:

- **Payment execution**: AP2 already treats x402 as an official, first-party payment method through the a2a-x402 extension, co-built with Coinbase and the Ethereum Foundation. Not a hypothetical bridge, a merged one.
- **Delegated authorization**: MetaMask's Smart Accounts Kit already grants agents scoped, time-bound spending permission, using EIP-7702, ERC-7710, and ERC-7715, and already composes this with both AP2 and x402.
- **Mandate signing**: EIP-712 typed signing is already the default signing pattern across the wallet infrastructure AP2's own partners ship. There was never a real gap here to bridge.

What remains open is narrower and more specific than v0.1 suggested, but also more clearly the EEA's to own. This version replaces the five-slot proposal with a two-slot one, and reframes the argument around why those two slots specifically resist vendor solutions.

## Part I — Production status check

### Payment execution: already merged

AP2's own documentation describes x402 as "a type of emerging payment method that AP2 is specifically designed to accommodate and support securely within the agentic payments ecosystem." The integration point is a real, maintained repository, `google-agentic-commerce/a2a-x402`, built jointly with Coinbase, with AP2's team stating they will keep aligning it closely over time so any payment method, including digital currencies, composes cleanly with the core protocol.

This closes what v0.1 called Slot 3 (payment execution). There is nothing left for the EEA to specify here: the two organizations with the standing to build it already have.

### Delegated authorization: already shipping

MetaMask's Delegation Framework, internally called the Gator, lets a user upgrade an existing externally owned account in place, with no fund migration, to gain scoped, revocable, time-bound permission-granting. The mechanism stacks three primitives cleanly:

- **EIP-7702**: an EOA delegates its code to a smart-contract implementation, live since the Pectra upgrade in May 2025. No new wallet, no migration, same address.
- **ERC-7710**: the standard interface smart accounts use to grant capabilities to another account or contract.
- **ERC-7715**: the standard for a dApp or agent to request scoped execution permission directly from the wallet. The wallet prompts once, signs internally, and hands back a permission context the agent redeems repeatedly without further prompts.

This is not a lab prototype. Clawnch, an AI-agent launchpad, already runs production agents that earned $1.2M in fees by early February 2026, every dollar spent inside on-chain-enforced caveats set through this exact stack. MetaMask states plainly that combining AP2 and x402 with this delegation layer gives users full composability and choice while keeping true self-custody.

**What this replaces:** v0.1's Slot 4 proposed ERC-4337 session keys as the delegation mechanism. The production answer that actually shipped is EIP-7702 plus ERC-7710 and ERC-7715. ERC-4337's EntryPoint remains usable as an execution backend underneath it, but it is not the user-facing mechanism. This document corrects that.

### Adoption, measured

| Standard | Status | Adoption as of August 2026 |
| --- | --- | --- |
| ERC-8004 | Live, mainnet since Jan 29, 2026 | 200,000+ agent identities registered across 20+ chains within its first months. Registration count alone is a weak signal of real usage, treat as reach, not depth. |
| x402 | Live since May 2025 | 160M+ agentic payments in the trailing year per Coinbase; 100M+ independently confirmed by Chainalysis through Q1 2026. Over 90% of on-chain agentic stablecoin volume settles on Base. |
| ERC-8183 | Draft, published Feb 2026 | Not yet Review or Final. Primary production deployment is Virtuals Protocol's ACP, live on Base and Arbitrum, claimed 2M+ transactions, independently unverified. |
| EIP-7702 | Live since Pectra, May 2025 | Default mechanism behind MetaMask's and other wallets' smart-account upgrades; foundational to the delegation stack above. |

**One honest caveat on x402:** a March 2026 analysis found daily on-chain volume as low as $28,000 with roughly half of transactions potentially self-generated test activity, against a headline $7B ecosystem valuation. The subsequent growth to 100M+ transactions by Q1 and 160M+ by mid-year, independently confirmed by Chainalysis, suggests the gap has since closed, but the discrepancy is worth knowing if the number comes up in a room that has seen both figures.

## Part II — The two slots that remain

### Why these two survived

The three slots that closed, payment execution, delegation, signing, are engineering problems. They have a right answer, a company with the incentive to build it, and a clear way to know when it is done. Coinbase wanted x402 to move value; it built the AP2 bridge. MetaMask wanted its wallet to grant agent permissions; it built the delegation stack. Neither needed anyone's permission or coordination to ship.

The two that remain are different in kind, not just in progress.

- **Trust registry and root of trust**: whose attestation counts as trustworthy? A registry that only Google, or only Coinbase, or only MetaMask recognizes is not neutral, it just relocates the lock-in AP2's own spec is trying to avoid. This requires multiple institutions agreeing on shared rules, not one vendor shipping a good SDK.
- **Dispute evidence and adjudication**: when a transaction is disputed, who is recognized by both sides as the judge? A card network's adjudicator will not automatically recognize an on-chain evaluator that some counterparty picked unilaterally. Establishing that recognition is an institutional negotiation, not a smart-contract deployment.

**The pattern:** a single company can always ship the technical plumbing faster than a consortium can. A single company can never credibly be the neutral referee for institutions that compete with it. That is the fixed line between what vendors solve and what a standards body solves, and it is why these two slots, specifically, are still open eight months after AP2 shipped.

### What AP2's own spec still says

| AP2 section | Open slot | What the spec says |
| --- | --- | --- |
| § 3.2 | Trust registry | Manually curated allow-lists; real-time discovery standards needed long-term. |
| § 9 | Root of trust | "A critical area for innovation": no defined mechanism for why a signing key should be trusted. |
| § 6 / § 7.3 | Dispute evidence | Merchant holds signed JSON mandates and presents them to the adjudicator during representment. |

## Part III — Technical specification

Both remaining slots resolve to the same underlying infrastructure: the Ethereum Attestation Service (EAS), with the EEA's Shibui framework layered on top for institutional-grade eligibility and authorization semantics. What follows is the concrete interface for each.

### Slot A — Trust registry and root of trust

**Current behavior.** Each Shopping Agent and each Credentials Provider maintains its own private allow-list. Trust does not transfer: institution A trusting institution B tells institution C nothing. At scale this requires bilateral agreements between every pair of participants, 100 participants need up to 4,950 separate relationships.

**The Ethereum interface.** A Shibui-based EAS schema, `AgentAuthorizationSchema`, lets any recognized institution publish a signed, on-chain claim about a wallet address once. Anyone else resolves trust with a single read call instead of a bilateral negotiation.

| Field | Type | Description |
| --- | --- | --- |
| `agentAddress` | address | Ethereum address of the AP2 agent, or the EIP-7702-delegated EOA |
| `agentRole` | bytes32 | `SHOPPING_AGENT` \| `CREDENTIALS_PROVIDER` \| `MERCHANT` |
| `ap2AgentCardURI` | string | URI of the AP2 agent card JSON |
| `authorizedBy` | address | Attesting institution's address (e.g. a card network, an EEA member) |
| `validUntil` | uint64 | Unix timestamp expiry |
| `revocable` | bool | Whether the attester can revoke this attestation |

Resolution mirrors Shibui's existing ERC-3643 border check: a Shopping Agent calls `EAS.getAttestation(counterpartyAddress, AgentAuthorizationSchema)`; if it exists, has not expired or been revoked, and was issued by an attester in the agent's trusted-attester set, trust is established. `addTrustedAttester()`, already defined in Shibui for token issuers, plays the identical role here for AP2 participants.

**Root of trust, same mechanism:** AP2 § 9 asks why a signing key should be trusted at all. The answer is the same attestation, issued by whichever institution the ecosystem already recognizes as a root: a card network, a government authority, or the EEA acting as trust-anchor registrar. No new cryptography, just a governance decision about who gets to attest.

**Backward compatibility.** AP2 agent cards gain an optional `ethereumAddress` field. Participants not using Ethereum keep using allow-lists exactly as today. Nothing in AP2's message format changes.

### Slot B — Dispute evidence and adjudication

**Current behavior.** AP2 § 7.3: in a dispute, the merchant's copy of the signed `CartMandate` and `IntentMandate` JSON is shared with the adjudicating authority as evidence. The merchant is the sole custodian of that evidence, a single point of failure with no independent verification that the copy matches what was originally signed.

**The Ethereum interface.** ERC-8183 (Draft, published February 2026 by the Ethereum Foundation's dAI team and Virtuals Protocol) defines exactly this shape: a Client funds a Job, a Provider submits work, and a single Evaluator alone may mark it complete or rejected. Four states: Open, Funded, Submitted, Terminal.

For an AP2 transaction using Ethereum signing, the Shopping Agent optionally opens an ERC-8183 Job keyed to the `CartMandate` hash. The Evaluator is a role both sides recognize in advance: a card network's dispute service, an EEA-recognized arbitration service, or in narrower cases a smart contract applying pre-agreed rules.

| State | Trigger | AP2 equivalent |
| --- | --- | --- |
| Open | `CartMandate` hash published on-chain, funds not yet locked | Cart created, not yet authorized |
| Funded | Payment tokens escrowed, linked to `PaymentMandate` | Payment authorized |
| Submitted | Merchant submits delivery attestation as the deliverable | Order fulfilled |
| Terminal | Evaluator confirms or rejects; funds release or return | Dispute resolved |

The community building on ERC-8183 is already discussing exactly the connective step this adapter needs: extending an Evaluator's `complete()` call to write directly into ERC-8004's Reputation Registry, so a resolved AP2 dispute feeds the same on-chain reputation record any future counterparty checks. That is not yet standardized, it is a natural next step the EEA is positioned to formalize.

**The honest caveat:** ERC-8183 is a Draft. It has not reached Review or Final status, and its only meaningful production deployment is Virtuals Protocol's ACP marketplace. Building on it now means building on a standard still being revised in public. Worth doing, because Ethereum's spec process converges in public and the EEA can shape the terms early, but not worth presenting as settled infrastructure.

**Backward compatibility.** The ERC-8183 Job is created at the Shopping Agent's discretion for transactions using Ethereum signing. Every existing AP2 transaction keeps using merchant-held JSON evidence exactly as today; nothing is required to change.

## Part IV — Where the EEA fits

### Repositioning against the EEA's own existing message

The EEA already publishes a related page, [Building Agents with Ethereum](https://entethalliance.github.io/ops-finance/agents.html), naming ERC-8004, x402, ERC-8183, and EAS as a complete open stack and framing it explicitly as "the antidote to proprietary lock-in," citing OpenAI and Stripe's ACP by name as the closed alternative. That page does not mention AP2 at all.

That omission is worth closing deliberately, not by accident. AP2's own partner list already includes MetaMask, Coinbase, and EigenLayer, the Ethereum ecosystem already has a seat at that table. Positioning Ethereum as competing with AP2 undersells what is actually true: AP2's own infrastructure partners are the same organizations shipping the Ethereum-native stack. The more accurate, more defensible position is that AP2 and the Ethereum stack are converging into one thing, and the EEA's job is to formalize the two seams that convergence has not yet closed.

**The reframe in one line:** not "Ethereum vs. AP2." Not even "Ethereum plugs into AP2." AP2's own backers are already building the Ethereum stack, the EEA's job is the two pieces of governance no vendor in that partner list can self-serve.

### The deliverable

A published AP2-Ethereum Trust Adapter, not a competing protocol, not a full re-specification, a narrow extension covering exactly Slots A and B. Two EAS schema definitions, a trusted-attester registry the EEA administers, and a recognized-evaluator registry for ERC-8183 disputes. Antitrust-safe by construction, because it defines shared rules rather than picking a vendor.

### Immediate next steps

1. Publish the `AgentAuthorizationSchema` on Ethereum mainnet and Base as the first concrete, shippable artifact.
2. Convene a working group spanning AP2 implementors, MetaMask, Coinbase, and Virtuals Protocol, the four organizations already closest to the two open seams.
3. Propose the trust-anchor and evaluator-registry model to the FIDO Alliance's AP2 working group as an official extension path.
4. Track ERC-8183 through Review and Final status rather than building on a moving Draft without engagement in its public process.

---

Enterprise Ethereum Alliance · [entethalliance.org](https://entethalliance.org) · Draft v0.2, August 2026
