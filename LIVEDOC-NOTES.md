# Live Doc Redesign Notes

## Naming

The screen is labeled `Context` in the app chrome while keeping the `/live-doc` route. The route remains stable for the existing app, but the screen copy reframes it as a current-truth context layer rather than a wiki page.

## Curation Rule

The context layer keeps only current, load-bearing truth: architecture boundaries, API contracts, tenant/security decisions, rollout gates, and agent handoff instructions. Stale or superseded material stays auditable through sources, but it is removed from the curated body and excluded from exports.

## Update Mode

`Auto` means non-contradictory source changes can flow into the curated claim and regenerate downstream exports. `Confirm` means source changes are staged as a diff before becoming current truth. In both modes, any incoming source that contradicts an accepted load-bearing decision is forced into the visible `NEEDS REVIEW` diff and cannot silently overwrite the doc.

## Mock vs Real

Mock: Northstar Cloud sources, PR #418, Slack/Linear/Figma/Notion evidence, inline source drill-down, update cascade timing, export previews, copy buttons, and Mermaid diagram export. Would be real: source watchers, semantic contradiction detection, provenance indexing, export generation, clipboard guarantees, persisted update mode, and accepted-diff writes.

## Export Consistency Risk

Each export is a lens over the same mock `LiveDocPayload.exports` shape. An export would contradict the doc if it included a stale direct-Stripe entitlement path, CSV-only invoice review, or any claim not present in the curated current-truth body.

## Compression

The Live Doc is now a curated Northstar Cloud context layer: dense current truth, source-linked claims, and exports generated from that truth. It proves +3 agent-context because the same source-backed decisions become Cursor/Claude Code context, backend/frontend markdown, a payments-specific lens, or a diagram. The demo beat is pressing `PR #418 merged` and watching source changed -> doc line flash -> exports regenerated. The biggest risk is curation decay into wiki-rot if stale source material accumulates instead of being dropped. The pitch interaction to rehearse is opening a source from a highlighted claim, switching Socrates to `Payments relevant`, then triggering the PR #418 cascade.
