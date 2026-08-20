/** Stroke volume: what the ventricle actually ejected this beat. SV = EDV − ESV. */
export function strokeVolume(endDiastolicVolumeML: number, endSystolicVolumeML: number): number {
  return Math.max(0, endDiastolicVolumeML - endSystolicVolumeML);
}

/** Ejection fraction: the FRACTION of the filled ventricle ejected, which is why it can fall
 * even when stroke volume is preserved by a dilated ventricle. EF = SV / EDV. */
export function ejectionFractionPercent(strokeVolumeML: number, endDiastolicVolumeML: number): number {
  if (endDiastolicVolumeML <= 0) return 0;
  return (strokeVolumeML / endDiastolicVolumeML) * 100;
}

/** Cardiac output in L/min: CO = SV × HR. The bedside number the whole loop resolves to, and
 * the same quantity the Fick principle estimates from oxygen consumption. */
export function cardiacOutputLPerMin(strokeVolumeML: number, heartRateBpm: number): number {
  return (strokeVolumeML * heartRateBpm) / 1000;
}
