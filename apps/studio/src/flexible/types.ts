import type { BrandProfile, TemplateManifest } from '@elmekawy/shared/flexible';
export type FlexibleOptions = {
  manifest: TemplateManifest;
  brandProfiles: BrandProfile[];
  images: { id: string; name: string; sha256: string; url: string }[];
};
