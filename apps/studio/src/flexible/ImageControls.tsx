import React, { useState } from 'react';
import { defaultBinding, resizeImageFrame } from '@elmekawy/shared/flexible';
import type { MediaBinding } from '@elmekawy/shared/flexible';
function Slider({
  label,
  testId,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  testId: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field range-field">
      <span>
        {label} <bdi>{Math.round(value)}%</bdi>
      </span>
      <input
        data-testid={testId}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
export function ImageControls({
  binding,
  onChange,
  disabled,
}: {
  binding: MediaBinding;
  onChange: (value: MediaBinding) => void;
  disabled: boolean;
}) {
  const [lock, setLock] = useState(true);
  const frame = (axis: 'x' | 'y', value: number) =>
    onChange({ ...binding, frame: { ...binding.frame, [axis]: value / 100 } });
  const offset = (axis: 'offsetX' | 'offsetY', value: number) =>
    onChange({ ...binding, transform: { ...binding.transform, [axis]: value / 100 } });
  return (
    <fieldset disabled={disabled} className="image-controls" data-testid="image-controls">
      <legend>حجم الصورة وموضعها</legend>
      <label className="check">
        <input
          data-testid="image-aspect-lock"
          type="checkbox"
          checked={lock}
          onChange={(event) => setLock(event.target.checked)}
        />
        الحفاظ على نسبة أبعاد الإطار
      </label>
      <Slider
        label="عرض الإطار"
        testId="image-width"
        value={binding.frame.width * 100}
        min={10}
        max={150}
        onChange={(value) => onChange(resizeImageFrame(binding, 'width', value / 100, lock))}
      />
      <Slider
        label="ارتفاع الإطار"
        testId="image-height"
        value={binding.frame.height * 100}
        min={10}
        max={150}
        onChange={(value) => onChange(resizeImageFrame(binding, 'height', value / 100, lock))}
      />
      <Slider
        label="موضع الإطار أفقيًا"
        testId="image-x"
        value={binding.frame.x * 100}
        min={0}
        max={100}
        onChange={(value) => frame('x', value)}
      />
      <Slider
        label="موضع الإطار رأسيًا"
        testId="image-y"
        value={binding.frame.y * 100}
        min={0}
        max={100}
        onChange={(value) => frame('y', value)}
      />
      <Slider
        label="تكبير الصورة داخل الإطار"
        testId="image-zoom"
        value={binding.transform.scale * 100}
        min={25}
        max={300}
        onChange={(value) =>
          onChange({ ...binding, transform: { ...binding.transform, scale: value / 100 } })
        }
      />
      <label className="field">
        <span>طريقة عرض الصورة</span>
        <select
          data-testid="image-fit"
          value={binding.fit}
          onChange={(event) =>
            onChange({ ...binding, fit: event.target.value as MediaBinding['fit'] })
          }
        >
          <option value="cover">ملء الإطار مع قص الأطراف</option>
          <option value="contain">إظهار الصورة كاملة</option>
        </select>
      </label>
      <details>
        <summary>القص ونقطة التركيز</summary>
        <Slider
          label="تحريك الصورة أفقيًا"
          testId="image-offset-x"
          value={binding.transform.offsetX * 100}
          min={-100}
          max={100}
          onChange={(value) => offset('offsetX', value)}
        />
        <Slider
          label="تحريك الصورة رأسيًا"
          testId="image-offset-y"
          value={binding.transform.offsetY * 100}
          min={-100}
          max={100}
          onChange={(value) => offset('offsetY', value)}
        />
        <Slider
          label="نقطة التركيز أفقيًا"
          testId="image-focus-x"
          value={binding.focalPoint.x * 100}
          min={0}
          max={100}
          onChange={(value) =>
            onChange({ ...binding, focalPoint: { ...binding.focalPoint, x: value / 100 } })
          }
        />
        <Slider
          label="نقطة التركيز رأسيًا"
          testId="image-focus-y"
          value={binding.focalPoint.y * 100}
          min={0}
          max={100}
          onChange={(value) =>
            onChange({ ...binding, focalPoint: { ...binding.focalPoint, y: value / 100 } })
          }
        />
      </details>
      <button
        data-testid="image-reset"
        type="button"
        onClick={() => onChange(defaultBinding(binding.assetId, binding.assetSha256))}
      >
        إعادة الحجم والموضع للوضع الافتراضي
      </button>
      <p className="inline-note">
        الحجم يغيّر إطار العرض، والـZoom يكبّر الصورة داخل الإطار. الإعدادات تخص هذا المشهد فقط.
      </p>
    </fieldset>
  );
}
