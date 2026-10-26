export type DomainId = 'web-ui' | 'art-poster'

export type DomainProfile = {
  id: DomainId
  label: string
  colorRoles: string[]
  previewTemplate: string
  exportAdapters: Array<'css' | 'json' | 'png'>
}

export const domainProfiles: Record<DomainId, DomainProfile> = {
  'web-ui': {
    id: 'web-ui',
    label: 'Web / UI',
    colorRoles: ['background', 'surface', 'textPrimary', 'textMuted', 'accent', 'focus', 'success', 'error'],
    previewTemplate: 'responsive-interface',
    exportAdapters: ['css', 'json', 'png'],
  },
  'art-poster': {
    id: 'art-poster',
    label: 'Art / Poster',
    colorRoles: ['canvas', 'primaryVisual', 'secondaryVisual', 'accent', 'displayText', 'bodyText'],
    previewTemplate: 'editorial-poster',
    exportAdapters: ['css', 'json', 'png'],
  },
}

export const v1Domains = Object.values(domainProfiles)
