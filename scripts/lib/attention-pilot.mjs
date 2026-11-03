export function boxIoU(a, b) {
  const intersection = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return Math.max(0, Math.min(1, intersection / (a.width * a.height + b.width * b.height - intersection)))
}

// Maximum-total-IoU one-to-one assignment, not independently selecting the same
// box twice. Five boxes maximum keeps exhaustive assignment small.
export function matchBoxes(left, right) {
  let best = { total: -1, pairs: [] }
  function visit(index, used, pairs, total) {
    if (index === left.length) { if (total > best.total || (total === best.total && pairs.length > best.pairs.length)) best = { total, pairs }; return }
    visit(index + 1, used, pairs, total)
    for (let j = 0; j < right.length; j++) if (!used.has(j)) {
      const iou = boxIoU(left[index], right[j])
      visit(index + 1, new Set([...used, j]), [...pairs, { left: index, right: j, iou }], total + iou)
    }
  }
  visit(0, new Set(), [], 0)
  return best.pairs
}

export function validateReview(packet, review) {
  if (packet.format !== 'palette-lab-attention-pilot' || packet.split !== 'development-pilot' || packet.qualification !== false || packet.entries.length !== 30) throw new Error('Expected a 30-image development pilot packet')
  if (review.format !== 'palette-lab-attention-review' || review.protocol !== packet.protocol || review.packetId !== packet.packetId || review.split !== packet.split || review.qualification !== false || !['A', 'B'].includes(review.reviewer) || review.method !== 'independent-human-regions') throw new Error('Review identity/protocol mismatch')
  if (!Array.isArray(review.entries) || review.entries.length > packet.entries.length) throw new Error('Invalid review entries')
  const seen = new Set()
  for (const row of review.entries) {
    const source = packet.entries.find(entry => entry.id === row.id)
    if (!source || source.sha256 !== row.sha256 || source.file !== row.file || seen.has(row.id)) throw new Error('Unknown/duplicate image or checksum mismatch')
    seen.add(row.id)
    if (typeof row.complete !== 'boolean' || typeof row.uncertain !== 'boolean' || typeof row.notes !== 'string' || row.notes.length > 2000 || !Array.isArray(row.targets) || row.targets.length > 5) throw new Error('Invalid annotation structure')
    for (const box of row.targets) if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || box.x < 0 || box.y < 0 || box.width <= 0 || box.height <= 0 || box.x + box.width > 1.000001 || box.y + box.height > 1.000001) throw new Error('Invalid normalized box')
    if (row.complete && (!['single', 'multiple', 'uniform', 'distributed'].includes(row.state) || (row.state === 'single' && row.targets.length !== 1) || (row.state === 'multiple' && row.targets.length < 2) || (['uniform', 'distributed'].includes(row.state) && row.targets.length !== 0) || (row.uncertain && !row.notes.trim()))) throw new Error('Confirmed state/boxes/uncertainty disagree')
  }
  const complete = packet.entries.every(entry => review.entries.some(row => row.id === entry.id && row.complete))
  if (review.complete !== complete) throw new Error('Completion claim does not match entries')
  return review
}

export function compareReviews(packet, first, second) {
  validateReview(packet, first); validateReview(packet, second)
  if (first.reviewer === second.reviewer) throw new Error('Two distinct independent human reviewers are required')
  const results = packet.entries.map(source => {
    const a = first.entries.find(row => row.id === source.id && row.complete), b = second.entries.find(row => row.id === source.id && row.complete)
    if (!a || !b) return { id: source.id, file: source.file, status: 'incomplete', missing: [!a ? first.reviewer : null, !b ? second.reviewer : null].filter(Boolean) }
    const pairs = matchBoxes(a.targets, b.targets), minimumIoU = pairs.length ? Math.min(...pairs.map(pair => pair.iou)) : null
    const stateAgreement = a.state === b.state, countAgreement = a.targets.length === b.targets.length
    const reasons = [!stateAgreement && 'state', !countAgreement && 'box-count', minimumIoU !== null && minimumIoU < .5 && 'box-overlap', (a.uncertain || b.uncertain) && 'uncertain'].filter(Boolean)
    return { id: source.id, file: source.file, category: source.category, status: reasons.length ? 'needs-discussion' : 'agreement', stateAgreement, countAgreement, minimumIoU, pairs, reasons, reviews: [a, b] }
  })
  const compared = results.filter(row => row.status !== 'incomplete')
  return { format: 'palette-lab-attention-pilot-comparison', protocol: packet.protocol, packetId: packet.packetId, split: packet.split, qualification: false, reviewers: [first.reviewer, second.reviewer], generatedAt: new Date().toISOString(), summary: {
    images: packet.entries.length, compared: compared.length, incomplete: results.length - compared.length,
    stateAgreementRate: compared.length ? compared.filter(row => row.stateAgreement).length / compared.length : null,
    countAgreementRate: compared.length ? compared.filter(row => row.countAgreement).length / compared.length : null,
    needsDiscussion: compared.filter(row => row.status === 'needs-discussion').length,
    boxIoUDiscussionThreshold: .5,
  }, results }
}
