# The Platform Constitution

**Excellon Enterprise Platform**
Status: Foundational · supersedes nothing, governs everything · v1.0 (amendable per §9)
Purpose: define the immutable principles that govern every architectural decision, *before* architecture is designed. This is law, not design.

---

## 0. Preamble — the identity this constitution governs

A constitution must know what it governs. This one governs a platform that **is, today, an internal divergence-management capability**: a metadata-driven enterprise platform on which a small number of transaction-heavy applications (DMS-class) are built once and diverged heavily across many tenant organizations (OEMs) and their sub-organizations (dealers), across geographies.

It is **architected so it could become** a category-defining commercial platform — the internal-tool-to-billion-dollars path (AWS, Slack) — but it does not pretend to be one yet. Where the commercial path would force a different law, this constitution **marks the fork** (⚑) rather than blurring it. Commercialization is a future amendment (§9), not a present assumption.

This honesty is the first constitutional act: **we will not write aspirational law we are not living.**

---

## 1. Mission

**The problem we are truly solving.** Enterprises whose business runs through many semi-independent organizations — manufacturers and their dealers, brands and their franchisees, groups and their subsidiaries — face an unsolved dilemma: every organization needs *almost* the same application, but each diverges in ways that matter. Today they either fork the app per organization (unmaintainable) or force one rigid app on everyone (rejected by the field). Both fail. Every existing low-code platform manages *apps*; none manages *divergence*.

**The category we are creating.** Not "low-code." Not "app builder." A **divergence-managed enterprise application platform** — where one governed model is projected into many organizations, each customizing freely through inheritance, without forking and without a customization cliff.

**Why the platform must exist.** Because the incumbents (OutSystems, Mendix, Appian, Retool, Salesforce, Power Apps) all bolt UI onto separately-modeled data and treat per-customer variation as a copy-and-edit problem. The unsolved problem in the entire mature field — customization without a regeneration/fork cliff across many tenants — is precisely the problem this platform is built to solve. That gap is the reason to exist.

**Challenge to this mission:** if your real divergence is shallow (branding only), this mission is over-built and you should build a configurable app, not a platform. The mission is valid *only* because divergence is heavy. Re-test that assumption annually.

---

## 2. Core Principles (with mandatory/rejected rulings)

A principle is **mandatory** only if violating it breaks the platform's identity. Everything else is contextual and must not masquerade as foundational.

### Mandatory (immutable)
- **Metadata-First** — every application is data describing intent, not hand-written artifacts. *The thesis.*
- **One Canonical Model** — UI, rules, and workflows are projections of a single shared model, never parallel definitions. *(Wedge 1.)*
- **Cascade-Native** — inheritance/overlay (Platform→Vertical→Tenant→Org) is the one customization mechanism. *This, not "low-code," is our differentiator; we elevate it to a founding principle the generic list omits.*
- **Multi-Tenant by Design** — tenancy is structural, not retrofitted; data isolated, definitions shared.
- **Secure Tenant Isolation** — cross-tenant access is impossible by construction. *Non-negotiable.*
- **Design-System-Driven** — one design system is the sole UI vocabulary.
- **API-First** — every capability exists as an API before it exists as UI; engines are headless.
- **Governed-by-Default** — versioning, audit, approval, promotion are intrinsic, not administrative add-ons.
- **Accessibility-by-Default** — accessible output is the default; authors opt out visibly, never in.
- **Artifact-as-Truth** — a compiled, immutable, versioned artifact is the sole runtime read source.
- **Composable & Replaceable** — the runtime is replaceable; the artifact format is the contract; components are versioned.
- **Region/Residency-Aware** — geography is a first-class placement dimension; data never leaves its region.
- **AI-Ready** — the model is declarative and validated so AI *could* author into it later, safely.

### Contextual (true, but not foundational)
- **Cloud-Native-Capable** — deployment-agnostic; we don't dogmatize a single cloud.
- **Responsive-Web-First, Native-Capable** — the honest replacement for "Mobile First" (see rejected).

### Rejected as principles (and why — challenging your examples)
- **"Mobile First"** — ✗. The core is transaction-heavy desktop-dense B2B. Mobile-first would distort layout, density, and archetype priorities. Correct principle: *Responsive-Web-First, Native-Capable.*
- **"Offline Capable"** — ✗. Explicitly out of scope; offline-write/sync is a different platform. Correct principle: *Online-First.*
- **"AI Native"** — ✗ *as mandatory*. You chose no-AI-for-v1. Declaring AI-Native would be living a lie. Correct principle: *AI-Ready* now; *AI-Native* is a §9 amendment when earned.

---

## 3. Architectural Laws (60, non-negotiable)

These are testable invariants. A pull request that violates one is rejected; a deadline that requires one is escalated to amendment (§9), never silently broken (Law 60).

### Model & metadata
1. There is one canonical model; UI, rules, and workflows are projections of it, never parallel definitions.
2. All UI is metadata-driven; no hand-built screen exists outside the metamodel.
3. Metadata is declarative and serializable; anything an author can express must be representable as data.
4. Business logic never lives in UI components; logic lives in the Rule/Expression engines.
5. The UI projects and invokes the engines; it never reimplements their logic.
6. Bindings are first-class references into the shared registry — never copied schemas, never string IDs.
7. A definition exists once and is customized by overlay; copying a definition to modify it is forbidden.
8. Separation of concerns is structural: no metadata object embeds another object's responsibility.

### Cascade & multi-tenancy
9. The cascade is the single customization mechanism for all metadata types (entities, rules, workflows, UI).
10. Overrides are node-scoped operations on stably-identified nodes; positional/coordinate override is forbidden.
11. Cascade resolution is deterministic and most-specific-wins; ambiguous resolution is a build error.
12. Reuse and customization are the same mechanism; forking an application to customize it is prohibited.
13. An actor may affect only their cascade level and below-by-inheritance; upward edits are structurally impossible.
14. Higher levels are adopted, never force-pushed; downstream pins versions and adopts deliberately.
15. Tenant data is physically isolated; definitions are shared.
16. Tenant identity is resolved exclusively from a verified token claim.
17. No code path may derive tenant from a request parameter, header, body, or URL.
18. Cross-tenant data access is impossible by construction and alarmed if ever attempted.

### Build & compilation
19. The compiled artifact is the sole runtime read source; the runtime never reads the registry.
20. Compiled artifacts are immutable and versioned; any change produces a new version.
21. Validation fails loud at build time; nothing invalid reaches runtime.
22. Broken bindings and orphaned overrides are build failures, never runtime surprises.
23. Compilation is incremental and dependency-graph-driven; a change recompiles only what it affects.
24. Schema evolution is designed into the compiler; data migration/version-read is never bolted on later.
25. Rollback is re-pinning a prior artifact version and must always be available.

### Runtime & rendering
26. One generic runtime interprets all apps; per-application generated code is forbidden.
27. The runtime is replaceable; the artifact format is the contract, not any particular renderer.
28. The artifact is rendering-target-agnostic; renderers map semantic components to platform components.
29. Performance is a feature; defined SLAs gate release and the heaviest screens are load-tested before ship.
30. Analytics never run on the transactional store; data-dense reads are served by read models.
31. Authoritative logic (security, integrity, business rules) executes server-side; client evaluation is UX-only.

### Design system & UI
32. There is one design system; foreign components may not enter the runtime vocabulary. ⚑(commercial fork)
33. Brand variation is achieved by tokens/themes, never by component substitution.
34. Layout is flow/constraint-based; absolute pixel positioning is forbidden.
35. Accessibility is default-on; authors opt out visibly and deliberately, never opt in.
36. Responsiveness is declared in metadata, never hand-coded per screen.
37. Components are versioned; a component's contract is stable within a major version.

### Engines & integration
38. The Entity, Rule, and Workflow engines are authoritative and headless; the UI is one consumer among possible many.
39. Workflows are loosely coupled; the UI binds to workflow state and transitions and never embeds process logic.
40. Integrations enter as governed data sources/connectors, never as arbitrary UI plugins.
41. Every engine capability is available via API before it is exposed via UI.

### Security, governance & compliance
42. Security is modeled from day one and enforced server-side, even while authentication is stubbed in development.
43. Every definition change is audited: who, what, which level, when.
44. Change is governed by blast radius; model/entity changes are gated harder than UI tweaks.
45. High-blast-radius changes require impact analysis before publish.
46. Data never leaves its region; the control plane replicates to regions read-only.
47. Compliance scope is bounded per tenant by physical data isolation.
48. Promotion flows dev→staging→prod; data never promotes — only definitions and artifacts.
49. Governance is part of the authoring loop, not a separate administrative afterthought.

### Extensibility & evolution
50. Extensibility is curated, not open; custom components are reviewed and design-system-based. ⚑(commercial fork)
51. The escape hatch is narrow and governed; arbitrary code on a page is forbidden.
52. The metamodel is versioned and artifact backward-compatibility is a stated, enforced policy.
53. No law is violated for expedience; deviation requires a formal amendment, never a workaround.

### Observability & operations
54. Every request is traceable to tenant, region, artifact version, and cascade scope.
55. Any rendered screen is explainable — traceable back to its artifact, cascade level, and source overrides.
56. The platform is operable by few; onboarding a tenant is a repeatable governed flow, not a project.

### Product discipline
57. Scope is defended; the platform does few things excellently rather than many adequately.
58. We do not build for hypothetical users; every capability serves a named persona at a named cascade level.
59. Elegance the customer cannot perceive is not a feature; internal beauty must convert to user value or be cut.
60. When a law and a deadline conflict, the law wins or the law is amended — never silently broken.

---

## 4. Product Philosophy

### What we will build
- A metadata-driven projection of one unified model into many organizations.
- The cascade as the mechanism for governed divergence without forking.
- A governed, compiled, interpreted runtime with loud failure and instant rollback.
- DMS-class transaction-heavy archetypes, done excellently.
- A cascade-aware authoring studio — *after* the model is proven.
- Physically isolated, region-aware, per-tenant data.

### What we will never build (under this constitution)
- A freeform pixel canvas (violates the projection thesis).
- Business logic embedded in UI components.
- Per-application generated code that forks and drifts.
- An ungoverned open plugin/component marketplace. ⚑(commercial fork)
- Offline-first complexity, while offline is out of scope.
- Twelve application types adequately instead of the few that matter excellently.
- Any feature whose only beneficiary is internal elegance (Law 59).

---

## 5. Competitive Positioning

### Where we will beat them
- **Divergence management** — the cascade. No incumbent treats per-tenant variation as a first-class inheritance mechanism; they copy-and-edit. This is the wedge.
- **Customization without a cliff** — the field's universal unsolved problem; our overlay model is built for it.
- **The unified model** — "the screen is the model," eliminating the UI-vs-data drift that plagues Salesforce/SAP-style stacks.
- **Fast, governed multi-org onboarding** — inherit-the-baseline, live day one.

### Where we will not compete (deliberately)
- **Breadth of connectors / marketplace** — not against Power Apps/Mendix ecosystems; not now.
- **Freeform design fidelity** — not against Figma; we are a projection platform, not a design tool.
- **General-purpose citizen-dev ubiquity** — not against Power Apps' M365 distribution.
- **Being everything to everyone** — we win a wedge (multi-org, high-divergence, transaction-heavy enterprises) and expand from strength, never by frontal assault on entrenched breadth.

**Challenge:** incumbents are deeply entrenched and well-funded. A frontal "exceed OutSystems/Mendix" strategy loses. The only credible billion-dollar path is *dominate the divergence wedge in a set of multi-org verticals, then expand.* Position accordingly.

---

## 6. Platform Success Metrics

Targets are directional and must be calibrated to your data; the *choice* of metric is the constitutional part.

### Author/developer productivity
- **% of application expressible in metadata vs. custom code** — target > 95%. *The truest measure of the thesis.*
- Time for an author to build a standard screen (target: hours, not days).
- Author ramp time to first published overlay.

### Time-to-market
- **New-OEM onboarding time** (baseline-to-live) — target: days. *The onboarding wedge, measured.*
- Time to implement a divergence/override.
- Time to add a new entity (target: no DDL, minutes).

### UX quality
- Accessibility conformance — WCAG target met by construction, not by audit.
- Heaviest-screen render within SLA — % of sessions meeting target.
- Design-system adherence — 100% by construction (a non-metric: it cannot be violated).

### Enterprise adoption & health
- Number of OEMs and applications live.
- **% of divergence handled via cascade overlay vs. full `replace`/fork** — target: high. *If this is low, the cascade isn't earning its keep — the single most important platform-health metric.*
- Upgrade adoption rate (downstream adopting new baselines).
- Rollback frequency (low is healthy; spikes signal validation gaps).
- **Cross-tenant security incidents — target: zero, always.** *A breach here is existential.*

---

## 7. 10-Year Vision

**Years 1–2:** the internal divergence-management platform proves itself on a transaction-heavy DMS across the first heavily-divergent OEMs. The thesis is validated by the divergence-via-cascade metric, not by feature count.

**Years 3–5:** the platform becomes *the* way multi-org enterprises in automotive/paint/tyre/heavy-machinery build and diverge applications. Onboarding speed and governed customization become the reasons OEMs stay. The studio matures; authoring is self-served by OEM admins.

**Years 5–10 (the venture-scale fork, §9):** the cascade engine — the genuinely novel asset — is generalized beyond the founding verticals into the broader category of *multi-organization enterprises* (franchises, dealer networks, holding groups, public-sector multi-agency). The category "divergence-managed enterprise application platform" becomes recognized, and the platform is its definer. Billion-dollar scale comes from owning that category, not from out-featuring incumbents in theirs.

**The honest vision:** this becomes a billion-dollar company **if and only if** (a) divergence is genuinely heavy and the cascade genuinely solves it, and (b) you expand from a dominated wedge rather than attacking incumbent breadth. The differentiator is the cascade. Everything else is table stakes you must merely not fail at.

**Challenge to the vision:** the largest risk to billion-dollar scale is not the incumbents — it's that the founding use case (automotive OEMs/dealers) is too narrow to generalize, or that divergence proves shallow. Validate generalizability early by stress-testing the cascade against a *second, unrelated* multi-org structure before betting the company on category creation.

---

## 8. Constitutional tensions (named, not hidden)

1. **Internal vs. commercial identity.** Laws 32 and 50 and several philosophy points (single design system, curated extensibility) are *correct for an internal platform* and *wrong for a commercial category-definer*. They are marked ⚑. Commercialization requires amending them — and that amendment has real cost (an open ecosystem, multiple design systems, third-party governance). Do not commercialize without paying it consciously.
2. **"Immutable" vs. an evolving direction.** Your scope has legitimately changed several times in design. A constitution survives this only with an explicit amendment process (§9) and a clear immutable core (the security and model-integrity laws — 1, 4, 16–22, 24, 31, 42, 46 — which must never be amended).

---

## 9. Amendment clause

- **Immutable core (never amendable):** Laws 1, 4, 16, 17, 18, 19, 20, 21, 22, 24, 31, 42, 46. These protect model integrity and tenant security; amending them changes what the platform *is* and is forbidden.
- **Amendable with cause:** all other laws and principles, including the ⚑ commercial forks.
- **Amendment process:** a proposed change names the law, the reason, the blast radius, and the migration cost; it is reviewed by the architecture and security owners; it is recorded with a date and rationale. Silent deviation is not amendment — it is a defect (Law 53, 60).

---

*This is the Platform Constitution. No architecture in subsequent work may contradict it without an amendment recorded under §9. Architecture design may now proceed — governed by these principles, not in place of them.*
