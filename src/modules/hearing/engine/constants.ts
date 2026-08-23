/** Audiogram frequencies, Hz — the eight standard test frequencies. */
export const AUDIOGRAM_FREQS_HZ = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000] as const;

/** Frequencies averaged for the pure-tone average (PTA). */
export const PTA_FREQS_HZ = [500, 1000, 2000] as const;

/** Conversational speech sits near 50 dB HL across roughly 500 Hz to 4 kHz; this band carries
 * almost all intelligibility, which is why a high-frequency loss can spare conversation while
 * a low-frequency one cannot. */
export const SPEECH = {
  BAND_FREQS_HZ: [500, 1000, 2000, 4000] as const,
  CONVERSATIONAL_LEVEL_DB_HL: 50,
  DYNAMIC_RANGE_DB: 30,
} as const;

export const COCHLEA = {
  /** Outer hair cells supply most of the ear's active amplification near threshold and its
   * compressive behaviour at higher levels. Losing them raises thresholds AND removes the
   * compression — loudness then grows abnormally fast: recruitment. */
  NORMAL_LOUDNESS_EXPONENT: 0.3,
  RECRUITED_LOUDNESS_EXPONENT: 0.75,
  /** Broad threshold rise per unit of outer-hair-cell deficit, dB. */
  OHC_BROAD_LOSS_DB: 18,
  OHC_HIGHFREQ_EXTRA_DB: 14,
  /** Inner hair cells ARE the transducers: losing them costs transmission outright, dB per
   * unit deficit. Their loss also distorts, degrading discrimination even when amplified. */
  IHC_LOSS_DB: 72,
  IHC_DISTORTION_PENALTY_PCT: 32,
} as const;

export const NOISE = {
  /** Noise damage is centred near 4 kHz — the classic audiometric notch — with a width of
   * about an octave either side. */
  NOTCH_CENTRE_HZ: 4000,
  NOTCH_WIDTH_OCTAVES: 0.75,
  /** Temporary threshold shift from a single exposure, dB, decaying over simulated hours. */
  EXPOSURE_TTS_DB: 12,
  MAX_TTS_DB: 30,
  DECAY_TAU_SECONDS: 3600,
} as const;

export const PRESBYCUSIS = {
  /** Sloping loss above 1 kHz: roughly 9 dB per kHz of age-severity, sparing the lows. */
  DB_PER_KHZ: 11,
  LOW_FREQ_RESIDUAL_DB: 3,
} as const;

export const MENIERES = {
  LOW_CENTRE_HZ: 250,
  LOW_WIDTH_OCTAVES: 1.2,
} as const;

/** The stapedius reflex contracts above roughly 85 dB HL and buys up to 10 dB of attenuation,
 * mostly at low frequencies — the ear's own compressor, absent in conductive disease. */
export const STAPEDIUS = {
  ONSET_DB_HL: 85,
  SATURATION_DB_HL: 105,
  MAX_ATTENUATION_DB: 10,
  TAU_SECONDS: 0.15,
} as const;

export const CLINICAL = {
  SIGNIFICANT_GAP_DB: 15,
  SIGNIFICANT_SNHL_DB: 20,
  NORMAL_DISCRIMINATION_PCT: 88,
} as const;

export const HEARING_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Temporary threshold shift recovers over hours; compressed so it is watchable. */
  TIME_SCALE: 240,
} as const;
