// Canonical public schemas must also resolve from a downloaded JSON file.
export const schemaUrl = (name: 'design-tokens' | 'series-tokens' | 'series-report') =>
  `https://palette-lab.3476554092.workers.dev/schemas/${name}/v1.json`
