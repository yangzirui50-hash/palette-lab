import type { SpatialRegionEvidence, SpatialRoi } from './spatial'

// Positions map to the source; area/edge/component shares still describe the ROI.
export function sourceCoordinates(regions: SpatialRegionEvidence[], roi: SpatialRoi | null): SpatialRegionEvidence[] {
  if (!roi) return regions
  const point = (value: { x: number; y: number }) => ({ x: roi.x + value.x * roi.width, y: roi.y + value.y * roi.height })
  return regions.map(region => ({
    ...region, centroid: point(region.centroid), dominantCentroid: point(region.dominantCentroid),
    bounds: { ...point(region.bounds), width: region.bounds.width * roi.width, height: region.bounds.height * roi.height },
  }))
}
