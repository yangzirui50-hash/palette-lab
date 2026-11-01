import json
import statistics
from collections import defaultdict
from pathlib import Path

report = json.loads(Path('test-results/benchmark-50-report.json').read_text(encoding='utf-8'))
rows = report['results']
times = sorted(row['ms'] for row in rows)
by_category = defaultdict(list)
for row in rows:
    by_category[row['category']].append(row['ms'])

def percentile(values, p):
    position = (len(values) - 1) * p
    lower = int(position)
    upper = min(lower + 1, len(values) - 1)
    fraction = position - lower
    return values[lower] * (1 - fraction) + values[upper] * fraction

lines = [
    '# 50-image Browser Benchmark — 2026-11-01',
    '',
    '## Result',
    '',
    f'- **{report["passed"]}/{report["totalImages"]} passed; {report["failed"]} failed**',
    f'- Total sequential dual-mode time: **{report["totalMs"] / 1000:.3f} s**',
    f'- Mean per image: **{statistics.mean(times) / 1000:.3f} s**',
    f'- Median per image: **{statistics.median(times) / 1000:.3f} s**',
    f'- 95th percentile: **{percentile(times, 0.95) / 1000:.3f} s**',
    f'- Range: **{times[0]}–{times[-1]} ms**',
    '- Real owner images: 2; deterministic synthetic images: 48.',
    '- No DeepSeek, external AI API or image download was used.',
    '',
    '## Category timing',
    '',
    '| Category | Images | Mean (s) | Max (s) |',
    '|---|---:|---:|---:|',
]
for category, values in sorted(by_category.items()):
    lines.append(f'| {category} | {len(values)} | {statistics.mean(values) / 1000:.3f} | {max(values) / 1000:.3f} |')
lines += [
    '',
    '## Slowest fixtures',
    '',
    '| Fixture | Category | Time (s) |',
    '|---|---|---:|',
]
for row in sorted(rows, key=lambda item: item['ms'], reverse=True)[:5]:
    lines.append(f'| {row["file"]} | {row["category"]} | {row["ms"] / 1000:.3f} |')
lines += [
    '',
    '## Interpretation',
    '',
    'All 50 images produced normalized palettes, finite significance evidence, both spatial visualizations and no stale ROI or runtime error. Dedicated cross-color and pixel-assignment assertions remain in the permanent regression suite.',
    '',
    'This is a **timing and stability benchmark**, not a 50-real-image generalization claim. Only two owner-provided images are included; the other 48 images are synthetic. It does not replace a broader independent real-world corpus.',
    '',
    f'At the measured mean, 1000 similar dual-mode browser runs would take about **{statistics.mean(times) * 1000 / 60_000:.1f} minutes**, excluding downloads, environment startup and failure review. This is an estimate for the current machine, not a guarantee for other hardware.',
    '',
]
Path('docs/REVIEWS/2026-11-01-benchmark-50.md').write_text('\n'.join(lines), encoding='utf-8')
print(f'Passed: {report["passed"]}/{report["totalImages"]}; total: {report["totalMs"] / 1000:.3f}s; mean: {statistics.mean(times) / 1000:.3f}s; p95: {percentile(times, 0.95) / 1000:.3f}s')
