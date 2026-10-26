import { describe, expect, it } from 'vitest'
import { domainProfiles, v1Domains } from './profiles'

describe('domain profiles', () => {
  it('ships exactly two V1 domains', () => {
    expect(v1Domains.map((domain) => domain.id)).toEqual(['web-ui', 'art-poster'])
  })

  it('uses different color roles for different design goals', () => {
    expect(domainProfiles['web-ui'].colorRoles).toContain('focus')
    expect(domainProfiles['art-poster'].colorRoles).toContain('primaryVisual')
    expect(domainProfiles['web-ui'].colorRoles).not.toEqual(domainProfiles['art-poster'].colorRoles)
  })

  it('keeps exports available without AI providers', () => {
    v1Domains.forEach((domain) => {
      expect(domain.exportAdapters).toEqual(expect.arrayContaining(['css', 'json', 'png']))
    })
  })
})
