export type ImageLayout = {
  fit: 'cover' | 'contain';
  focalPoint: { x: number; y: number };
  frame: { x: number; y: number; width: number; height: number };
  transform: { scale: number; offsetX: number; offsetY: number };
};
export type LegacyImageLayouts = Record<string, Record<string, ImageLayout>>;
const n = (minimum: number, maximum: number) => ({ type: 'number', minimum, maximum });
const obj = (properties: Record<string, unknown>) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
export const imageLayoutSchema = obj({
  fit: { enum: ['cover', 'contain'] },
  focalPoint: obj({ x: n(0, 1), y: n(0, 1) }),
  frame: obj({ x: n(0, 1), y: n(0, 1), width: n(0.1, 1.5), height: n(0.1, 1.5) }),
  transform: obj({ scale: n(0.25, 3), offsetX: n(-1, 1), offsetY: n(-1, 1) }),
});
export const legacyImageLayoutsSchema = { type: 'object', maxProperties: 6, propertyNames: { pattern: '^[a-z][a-z0-9-]{0,63}$' }, additionalProperties: { type: 'object', maxProperties: 12, propertyNames: { pattern: '^[a-z][a-z0-9_-]{0,63}$' }, additionalProperties: imageLayoutSchema } };
export function defaultImageLayout(fit: 'cover' | 'contain' = 'cover'): ImageLayout {
  return { fit, focalPoint: { x: 0.5, y: 0.5 }, frame: { x: 0.5, y: 0.5, width: 1, height: 1 }, transform: { scale: 1, offsetX: 0, offsetY: 0 } };
}
export const legacySceneImageRoles: Record<string, Record<string, string[]>> = {
  'bim-personal-intro': { infrastructure: ['infrastructure'], services: ['structural', 'technology'], brand: ['portrait'] },
  'bim-motion-study': { network: ['structural'], comparison: ['before', 'after'], cta: ['logo'] },
};
