# Palette Lab — Product Contract

## Product promise

Palette Lab turns image color into editable, testable and exportable design decisions. It is a color-system workspace, not a generic image-captioning agent.

## Target users

- Developers building visual interfaces
- Independent designers and AI-art creators
- Students learning practical design systems
- Worldbuilding projects that need visual consistency

## V1 domains

### Web / UI

Priorities: semantic color roles, readable text, interaction states, responsive previews and implementation-ready tokens.

### Art / Poster

Priorities: visual hierarchy, emotional direction, color proportion, image-text relationships and exportable palette cards.

The domains share the color engine but use separate rules, previews, exports and AI prompts.

## V1 scope

- Local image import and preprocessing
- Deterministic global and regional palette extraction
- Color-role editing and color locking
- Faithful, balanced and expressive palette variants
- Web/UI and Art/Poster preview templates
- Contrast and basic usage checks
- CSS, JSON and PNG export
- Local-only operation without an AI key

## Explicit non-goals for V1

- Accounts, cloud database and collaboration
- Generic AI chat
- Pixel-perfect semantic segmentation
- Multiple stock-image providers
- Automatic aesthetic scoring presented as objective truth

## Acceptance criteria

1. The primary workflow works without network access after the app has loaded.
2. Imported images are not uploaded by default.
3. Users can move from image to useful export without reading an AI report.
4. Web/UI and Art/Poster produce visibly different recommendations and previews.
5. All generated colors remain editable and exportable.
6. Layout works at desktop, tablet and phone widths without horizontal overflow.
7. Deterministic color functions have automated tests.

## Product north star

A user can turn visual inspiration into a usable, explainable design color system while retaining control over every decision.
