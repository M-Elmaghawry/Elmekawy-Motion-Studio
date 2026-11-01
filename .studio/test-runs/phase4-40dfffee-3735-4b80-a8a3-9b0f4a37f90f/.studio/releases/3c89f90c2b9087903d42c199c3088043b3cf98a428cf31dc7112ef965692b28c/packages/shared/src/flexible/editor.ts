import Ajv from 'ajv';
import {
  flexibleProjectSchema,
  FlexibleValidationError,
  audioTimelineSchema,
  promptsSchema,
} from './schema.ts';
import { compileTimeline } from './timeline.ts';
import { sceneRegistry, outputProfiles, portraitProfile } from './manifest.ts';
import type {
  FlexibleProject,
  FlexibleScene,
  SupportedSceneType as ImplementedType,
  MediaBinding,
} from './types.ts';

export type BrandProfile = Pick<
  FlexibleProject['brand'],
  'profileId' | 'displayName' | 'colors'
> & { label: string };
export const brandProfiles: BrandProfile[] = [
  {
    profileId: 'elmekawy-bim',
    label: 'Elmekawy BIM',
    displayName: 'ELMEKAWY BIM',
    colors: {
      background: '#030D1B',
      surface: '#003060',
      foreground: '#F3F8FC',
      accent: '#68BBE3',
      muted: '#9BB4C9',
    },
  },
  {
    profileId: 'khatwa-designs',
    label: 'Khatwa Designs',
    displayName: 'KHATWA DESIGNS',
    colors: {
      background: '#201B18',
      surface: '#3A3029',
      foreground: '#FFF6E9',
      accent: '#E4B47A',
      muted: '#CFBAA4',
    },
  },
  {
    profileId: 'custom-client',
    label: 'عميل مخصص',
    displayName: 'YOUR BRAND',
    colors: {
      background: '#17152A',
      surface: '#282343',
      foreground: '#F5F1FF',
      accent: '#C7B6FF',
      muted: '#B8AFD0',
    },
  },
];
export const sceneLabels: Record<ImplementedType, string> = {
  'ui-demo': 'واجهة تطبيق وموبايل',
  'product-hero': 'عرض منتج',
  'before-after': 'قبل وبعد',
  'data-explainer': 'شرح بيانات',
  'kinetic-title': 'عنوان متحرك',
  'stat-proof': 'رقم وإحصائية',
  'media-showcase': 'عرض صورة',
  'process-flow': 'خطوات العمل',
  'offer-cta': 'عرض وتواصل',
};
export type EditableFlexible = Pick<
  FlexibleProject,
  'name' | 'brief' | 'scenes' | 'targetDurationFrames'
> & {
  brand: Pick<FlexibleProject['brand'], 'profileId' | 'displayName' | 'colors'>;
  crf: number;
  outputProfileId?: string;
  audio?: FlexibleProject['audio'];
  prompts?: FlexibleProject['prompts'];
};
export type FlexibleCreate = {
  outputProfileId?: string;
  name: string;
  client: string;
  objective: string;
  brandProfileId: string;
  displayName: string;
  colors: FlexibleProject['brand']['colors'];
  durationFrames: number;
  sceneTypes: ImplementedType[];
  libraryImageId: string;
  approveImage: boolean;
  crf: number;
};
export type FlexibleDescriptor = {
  compositionId: 'FlexibleReel';
  projectRevision: number;
  metadata: {
    width: number;
    height: number;
    fps: number;
    durationFrames: number;
    aspectRatio: string;
  };
  inputProps: { project: FlexibleProject; media: Record<string, string> };
  warnings: string[];
};
const properties = flexibleProjectSchema.properties;
const propertiesOf = (value: unknown) =>
  (value as { properties: Record<string, unknown> }).properties;
const strict = (props: Record<string, unknown>, required = Object.keys(props)) => ({
  type: 'object',
  additionalProperties: false,
  required,
  properties: props,
});
const brand = propertiesOf(properties.brand);
export const editableFlexibleSchema = strict(
  {
    name: properties.name,
    brief: properties.brief,
    scenes: properties.scenes,
    targetDurationFrames: properties.targetDurationFrames,
    brand: strict({
      profileId: brand.profileId,
      displayName: brand.displayName,
      colors: brand.colors,
    }),
    crf: { type: 'integer', minimum: 0, maximum: 51 },
    outputProfileId: { enum: outputProfiles.map((profile) => profile.id) },
    audio: {
      oneOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['mode'],
          properties: { mode: { const: 'none' } },
        },
        audioTimelineSchema,
      ],
    },
    prompts: promptsSchema,
  },
  ['name', 'brief', 'scenes', 'targetDurationFrames', 'brand', 'crf'],
);
export const flexibleCreateSchema = strict(
  {
    name: properties.name,
    client: { type: 'string', minLength: 1, maxLength: 120 },
    objective: { type: 'string', minLength: 1, maxLength: 10000 },
    brandProfileId: { enum: brandProfiles.map((profile) => profile.profileId) },
    displayName: brand.displayName,
    colors: brand.colors,
    durationFrames: properties.targetDurationFrames,
    sceneTypes: {
      type: 'array',
      minItems: 3,
      maxItems: 8,
      items: { enum: Object.keys(sceneRegistry) },
    },
    libraryImageId: { type: 'string', pattern: '^[a-z][a-z0-9_-]{0,63}$' },
    approveImage: { type: 'boolean' },
    crf: { type: 'integer', minimum: 0, maximum: 51 },
    outputProfileId: { enum: outputProfiles.map((profile) => profile.id) },
  },
  [
    'name',
    'client',
    'objective',
    'brandProfileId',
    'displayName',
    'colors',
    'durationFrames',
    'sceneTypes',
    'libraryImageId',
    'approveImage',
    'crf',
  ],
);
const ajv = new Ajv({
  allErrors: true,
  strict: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
});
const validEdit = ajv.compile<EditableFlexible>(editableFlexibleSchema),
  validCreate = ajv.compile<FlexibleCreate>(flexibleCreateSchema);
export function assertFlexibleEdit(value: unknown): asserts value is EditableFlexible {
  if (!validEdit(value)) throw new FlexibleValidationError(['INVALID_EDIT_FIELDS']);
}
export function assertFlexibleCreate(value: unknown): asserts value is FlexibleCreate {
  if (!validCreate(value)) throw new FlexibleValidationError(['INVALID_CREATE_FIELDS']);
  if (
    !value.name.trim() ||
    !value.client.trim() ||
    !value.objective.trim() ||
    !value.displayName.trim()
  )
    throw new FlexibleValidationError(['EMPTY_CREATE_FIELDS']);
}
export const flexibleEditableOf = (project: FlexibleProject): EditableFlexible =>
  structuredClone({
    ...(project.schemaVersion === '2.1.0'
      ? {
          outputProfileId: project.outputProfile.id,
          audio: structuredClone(project.audio),
          prompts: structuredClone(project.prompts ?? []),
        }
      : {}),
    name: project.name,
    brief: project.brief,
    brand: {
      profileId: project.brand.profileId,
      displayName: project.brand.displayName,
      colors: project.brand.colors,
    },
    scenes: project.scenes,
    targetDurationFrames: project.targetDurationFrames,
    crf: project.outputProfile.crf,
  });
export function applyFlexibleEdit(
  project: FlexibleProject,
  value: EditableFlexible,
): FlexibleProject {
  assertFlexibleEdit(value);
  if (!brandProfiles.some((profile) => profile.profileId === value.brand.profileId))
    throw new FlexibleValidationError(['UNKNOWN_BRAND_PROFILE']);
  if (
    project.schemaVersion === '2.0.0' &&
    (value.outputProfileId !== undefined ||
      value.audio !== undefined ||
      value.prompts !== undefined)
  )
    throw new FlexibleValidationError(['FEATURE_UPGRADE_REQUIRED']);
  const profile = value.outputProfileId
    ? outputProfiles.find((profile) => profile.id === value.outputProfileId)!
    : project.outputProfile;
  return {
    ...structuredClone(project),
    ...(project.schemaVersion === '2.1.0'
      ? {
          audio: structuredClone(value.audio ?? project.audio),
          prompts: structuredClone(value.prompts ?? project.prompts ?? []),
        }
      : {}),
    name: value.name.trim(),
    brief: structuredClone(value.brief),
    brand: {
      ...structuredClone(project.brand),
      ...structuredClone(value.brand),
      ...(profile.id !== project.outputProfile.id
        ? { safeArea: safeAreaFor(profile.aspectRatio) }
        : {}),
    },
    scenes: structuredClone(value.scenes),
    targetDurationFrames: value.targetDurationFrames,
    outputProfile: { ...profile, crf: value.crf },
  };
}
export function defaultBinding(assetId: string, assetSha256: string): MediaBinding {
  return {
    slot: 'image',
    assetId,
    assetSha256,
    fit: 'cover',
    focalPoint: { x: 0.5, y: 0.5 },
    frame: { x: 0.5, y: 0.5, width: 1, height: 1 },
    transform: { scale: 1, offsetX: 0, offsetY: 0 },
  };
}
export function newFlexibleScene(
  type: ImplementedType,
  id: string,
  image?: { id: string; sha256: string },
): FlexibleScene {
  const base = {
    schemaVersion: '1.0.0' as const,
    id,
    durationFrames: 132,
    direction: 'rtl' as const,
    motion: {
      id: sceneRegistry[type].motionPresetIds[0],
      version: '1.0.0' as const,
      enterFrames: 24,
      staggerFrames: 6,
      exitFrames: 12,
      easing: 'ease-out' as const,
      reducedMotion: false,
    },
    transitionOut: { type: 'cut' as const, durationFrames: 0 as const },
    mediaBindings: [] as MediaBinding[],
  };
  switch (type) {
    case 'kinetic-title':
      return {
        ...base,
        type,
        content: { headline: 'فكرتك تبدأ هنا', subtitle: 'خطوة واضحة نحو هدفك' },
      };
    case 'stat-proof':
      return {
        ...base,
        type,
        content: {
          label: 'خطوات في المثال',
          value: 3,
          prefix: '',
          suffix: '',
          sourceNote: 'رقم توضيحي قابل للتعديل، وليس نتيجة عميل.',
        },
      };
    case 'ui-demo':
      if (!image) throw Error('MISSING_IMAGE');
      return {
        ...base,
        type,
        content: {
          headline: 'تجربة واضحة',
          appName: 'اسم التطبيق',
          caption: 'شرح الخطوات',
          actions: ['افتح', 'اختر', 'ابدأ'],
        },
        mediaBindings: [defaultBinding(image.id, image.sha256)],
      };
    case 'product-hero':
      if (!image) throw Error('MISSING_IMAGE');
      return {
        ...base,
        type,
        content: { headline: 'منتجك في المقدمة', tagline: 'التفاصيل تصنع الفرق', badge: 'جديد' },
        mediaBindings: [defaultBinding(image.id, image.sha256)],
      };
    case 'before-after':
      if (!image) throw Error('MISSING_IMAGE');
      return {
        ...base,
        type,
        content: { headline: 'شاهد الفرق', beforeLabel: 'قبل', afterLabel: 'بعد' },
        mediaBindings: [
          { ...defaultBinding(image.id, image.sha256), slot: 'before' },
          { ...defaultBinding(image.id, image.sha256), slot: 'after' },
        ],
      };
    case 'data-explainer':
      return {
        ...base,
        type,
        content: {
          headline: 'الصورة في الأرقام',
          unit: '%',
          points: [
            { id: 'point-1', label: 'الأولى', value: 40 },
            { id: 'point-2', label: 'الثانية', value: 70 },
            { id: 'point-3', label: 'الثالثة', value: 90 },
          ],
        },
      };
    case 'media-showcase':
      if (!image) throw new Error('MISSING_IMAGE');
      return {
        ...base,
        type,
        content: { headline: 'شاهد التفاصيل', caption: 'صورة توضيحية · راجع الأصل قبل الاعتماد' },
        mediaBindings: [defaultBinding(image.id, image.sha256)],
      };
    case 'process-flow':
      return {
        ...base,
        type,
        content: {
          headline: 'كل خطوة متصلة',
          steps: [
            { id: 'step-1', label: 'الفكرة' },
            { id: 'step-2', label: 'التنفيذ' },
            { id: 'step-3', label: 'النتيجة' },
          ],
        },
      };
    case 'offer-cta':
      return {
        ...base,
        type,
        content: {
          headline: 'ابدأ خطوتك القادمة',
          action: 'تواصل معنا',
          contact: 'example.com',
          offer: '',
        },
      };
  }
}
export function fitScenesToDuration(scenes: FlexibleScene[], target: number): FlexibleScene[] {
  if (
    scenes.length < 3 ||
    scenes.length > 8 ||
    !Number.isInteger(target) ||
    target < 600 ||
    target > 1350
  )
    throw new Error('INVALID_STORYBOARD_DURATION');
  const next = structuredClone(scenes);
  next[next.length - 1].transitionOut = { type: 'cut', durationFrames: 0 };
  const total = target + next.reduce((sum, scene) => sum + scene.transitionOut.durationFrames, 0),
    base = Math.floor(total / next.length),
    remainder = total % next.length;
  next.forEach((scene, index) => {
    scene.durationFrames = base + (index < remainder ? 1 : 0);
  });
  compileTimeline(next);
  return next;
}
export function moveScene(scenes: FlexibleScene[], from: number, to: number): FlexibleScene[] {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to < 0 ||
    from >= scenes.length ||
    to >= scenes.length
  )
    throw new Error('INVALID_SCENE_POSITION');
  const next = structuredClone(scenes),
    boundaries = next.map((scene) => scene.transitionOut),
    [scene] = next.splice(from, 1);
  next.splice(to, 0, scene);
  next.forEach((item, index) => {
    item.transitionOut = boundaries[index];
  });
  return next;
}
export function resizeImageFrame(
  binding: MediaBinding,
  axis: 'width' | 'height',
  value: number,
  lock: boolean,
): MediaBinding {
  const next = structuredClone(binding),
    clamp = (v: number) => Math.min(1.5, Math.max(0.1, v));
  if (lock) {
    const factor = Math.min(
      1.5 / binding.frame.width,
      1.5 / binding.frame.height,
      Math.max(0.1 / binding.frame.width, 0.1 / binding.frame.height, value / binding.frame[axis]),
    );
    next.frame.width = Number((binding.frame.width * factor).toFixed(5));
    next.frame.height = Number((binding.frame.height * factor).toFixed(5));
  } else next.frame[axis] = clamp(value);
  return next;
}

export function safeAreaFor(aspect: string) {
  return aspect === '9:16'
    ? { left: 100, right: 180, top: 220, bottom: 360 }
    : { left: 70, right: 100, top: 100, bottom: 140 };
}
export function upgradeFlexibleDocument(project: FlexibleProject): FlexibleProject {
  return project.schemaVersion === '2.1.0'
    ? structuredClone(project)
    : {
        ...structuredClone(project),
        schemaVersion: '2.1.0',
        template: { id: 'flexible-reel', version: '1.1.0' },
        prompts: [],
      };
}
