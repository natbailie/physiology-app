import { describe, expect, it } from 'vitest';
import { acuteBufferDriveTarget } from './acuteBuffer';

describe('acuteBufferDriveTarget', () => {
  it('is 0 at baseline PaCO2', () => {
    expect(acuteBufferDriveTarget(40)).toBeCloseTo(0, 5);
  });

  it('scales roughly linearly with PaCO2 deviation', () => {
    const small = acuteBufferDriveTarget(50);
    const large = acuteBufferDriveTarget(60);
    expect(large).toBeGreaterThan(small);
    expect(small).toBeGreaterThan(0);
  });

  it('saturates at +1 for a large PaCO2 deviation', () => {
    expect(acuteBufferDriveTarget(150)).toBe(1);
  });

  it('is negative but only partially deviated at the lowest physiologic PaCO2 (10 mmHg is only a 30 mmHg drop)', () => {
    expect(acuteBufferDriveTarget(10)).toBeCloseTo(-0.5, 5);
  });
});
