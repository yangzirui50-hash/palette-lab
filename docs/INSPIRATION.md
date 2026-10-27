# Online Inspiration and AI Comparison

## Workflow

1. The user first completes an AI analysis.
2. The Worker derives a content-aware query from subjects, style tags and domain.
3. A deterministic palette mapper selects a supported Unsplash color filter.
4. Unsplash returns attributed reference photos; images are hotlinked from official URLs.
5. DeepSeek compares the original image with up to four candidates.
6. The interface shows fit, rationale, what to borrow and what not to copy.

## API

`POST /api/inspiration` accepts the same image/domain/palette/assignments fields as analysis plus a schema-validated `analysis` report. Responses include query, source, photos, comparison and optional comparisonError.

## Providers

- Mock mode uses self-generated local SVG fixtures and is labeled `Mock / 测试素材`.
- Real search uses Unsplash `GET /search/photos` with `Client-ID` authorization on the Worker.
- Real API keys are never exposed to frontend code or committed to Git.

## Attribution and content use

Reference cards link to the photographer and Unsplash source. The product teaches comparison and design reasoning; it does not offer bulk downloading or republish unlicensed assets. Do not remove attribution or replace hotlinked URLs with copied image files.

## Cost and reliability

AI comparison is limited to four candidates. Search and comparison have bounded timeouts. Search results can remain usable if AI comparison fails. Mock mode is isolated from production builds and is restored to the owner's real environment after tests.

## Verification

- Query and color-filter unit tests
- Mock Worker tests for photos, attribution and comparison
- Browser workflow from image → analysis → reference comparison
- Real Unsplash verification remains pending until the owner configures an access key
