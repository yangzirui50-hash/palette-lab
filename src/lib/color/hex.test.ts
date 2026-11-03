import { describe, expect, it } from 'vitest'
import { normalizeHex, retainedSwatch } from './hex'

describe('explicit HEX colors', () => {
  it.each([{ input: '#AbC', expected: '#aabbcc' }, { input: 'ABCDEF', expected: '#abcdef' }, { input: ' #123456 ', expected: '#123456' }, { input: '000', expected: '#000000' }])('normalizes $input', ({ input, expected }) => {
    expect(normalizeHex(input)).toBe(expected)
  })
  it.each(['', '#1234', '#12345678', 'red', 'rgb(0,0,0)', '#xxffff'])('rejects unsupported or invalid color %s', value => {
    expect(normalizeHex(value)).toBeNull()
  })
  it('retains a six-digit color without inventing measured image area', () => {
    expect(retainedSwatch('#AbC')).toMatchObject({ hex: '#aabbcc', rgb: [170, 187, 204], share: 0 })
    expect(() => retainedSwatch('invalid')).toThrow('HEX')
  })
})
