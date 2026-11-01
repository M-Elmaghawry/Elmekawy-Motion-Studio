import React, { useState } from 'react';
import type {
  FlexibleProject,
  AudioTimeline as Timeline,
  AudioTrack,
} from '@elmekawy/shared/flexible';
export function AudioTimeline({
  project,
  media,
  disabled,
  onChange,
  onUpload,
  onReview,
}: {
  project: FlexibleProject;
  media: Record<string, string>;
  disabled: boolean;
  onChange: (project: FlexibleProject) => void;
  onUpload: (file: File) => void;
  onReview: (assetId: string, note: string, approved: boolean) => void;
}) {
  const [assetId, setAssetId] = useState(''),
    [role, setRole] = useState<'voiceover' | 'music'>('voiceover'),
    [beatText, setBeatText] = useState('');
  const fps = project.outputProfile.fps,
    timeline: Timeline =
      project.audio.mode === 'timeline'
        ? project.audio
        : { mode: 'timeline', tracks: [], beats: [], pauses: [] };
  const assets = project.assets.filter(
    (asset) => asset.metadata?.hasAudio && ['audio', 'video'].includes(asset.kind),
  );
  const chosen = assets.find((asset) => asset.id === assetId) ?? assets[0];
  const change = (value: Timeline) => onChange({ ...project, audio: value });
  const update = (id: string, value: Partial<AudioTrack>) =>
    change({
      ...timeline,
      tracks: timeline.tracks.map((track) => (track.id === id ? { ...track, ...value } : track)),
    });
  const seconds = (
    label: string,
    value: number,
    onSet: (frames: number) => void,
    max = project.targetDurationFrames,
  ) => (
    <label className="field">
      <span>{label} · ثانية</span>
      <input
        type="number"
        min={0}
        max={max / fps}
        step={1 / fps}
        value={Number((value / fps).toFixed(3))}
        onChange={(event) => onSet(Math.round(Number(event.target.value) * fps))}
      />
    </label>
  );
  return (
    <section className="panel" id="audio-timeline" data-testid="audio-timeline">
      <h2>الوسائط والتعليق الصوتي والموسيقى</h2>
      <fieldset disabled={disabled}>
        <label className="upload-button">
          رفع ملف صوت أو فيديو
          <input
            data-testid="timeline-media-upload"
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp4,video/mp4,.m4a"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = '';
            }}
          />
        </label>
        <p className="inline-note">
          MP4/H.264 حتى 250 MB، صوت حتى 100 MB، ومدة الملف حتى 180 ثانية. صوت فيديو المشهد يُضاف هنا
          كمسار مستقل.
        </p>
        <div className="form-grid">
          <label className="field">
            <span>ملف الصوت أو صوت الفيديو</span>
            <select
              data-testid="audio-asset"
              value={chosen?.id ?? ''}
              onChange={(event) => setAssetId(event.target.value)}
            >
              <option value="">اختر ملفًا</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.sourceNote.slice(0, 65)} · {asset.metadata?.durationSeconds.toFixed(1)}{' '}
                  ثانية
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>نوع المسار</span>
            <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              <option value="voiceover">تعليق صوتي</option>
              <option value="music">موسيقى</option>
            </select>
          </label>
        </div>
        <button
          data-testid="add-audio-track"
          disabled={!chosen || timeline.tracks.length >= 24}
          onClick={() => {
            if (!chosen) return;
            change({
              ...timeline,
              tracks: [
                ...timeline.tracks,
                {
                  id: 'track-' + crypto.randomUUID().replaceAll('-', ''),
                  assetId: chosen.id,
                  assetSha256: chosen.sha256,
                  role,
                  startFrame: 0,
                  trimStartFrame: 0,
                  durationFrames: Math.min(
                    project.targetDurationFrames,
                    Math.floor(chosen.metadata!.durationSeconds * fps),
                  ),
                  volume: role === 'music' ? 0.25 : 1,
                  fadeInFrames: 0,
                  fadeOutFrames: 0,
                },
              ],
            });
          }}
        >
          ＋ إضافة مسار
        </button>
        {timeline.tracks.map((track, index) => (
          <div className="audio-track" data-testid="audio-track" key={track.id}>
            <div className="sectionhead">
              <h3>
                {track.role === 'voiceover' ? 'تعليق صوتي' : 'موسيقى'} {index + 1}
              </h3>
              <button
                onClick={() =>
                  change({
                    ...timeline,
                    tracks: timeline.tracks.filter((item) => item.id !== track.id),
                  })
                }
              >
                حذف المسار
              </button>
            </div>
            <div className="form-grid">
              {seconds('البداية في الفيديو', track.startFrame, (value) =>
                update(track.id, { startFrame: value }),
              )}
              {seconds('المدة', track.durationFrames, (value) =>
                update(track.id, { durationFrames: value }),
              )}
              {seconds(
                'القص من بداية الملف',
                track.trimStartFrame,
                (value) => update(track.id, { trimStartFrame: value }),
                5400,
              )}
              {seconds(
                'دخول تدريجي',
                track.fadeInFrames,
                (value) => update(track.id, { fadeInFrames: value }),
                300,
              )}
              {seconds(
                'خروج تدريجي',
                track.fadeOutFrames,
                (value) => update(track.id, { fadeOutFrames: value }),
                300,
              )}
              <label className="field">
                <span>مستوى الصوت</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={track.volume}
                  onChange={(event) => update(track.id, { volume: Number(event.target.value) })}
                />
              </label>
            </div>
          </div>
        ))}
        <label className="field">
          <span>إيقاعات Beats بالثواني، مفصولة بفاصلة</span>
          <input
            data-testid="audio-beats"
            value={beatText}
            placeholder="0, 2, 4, 6"
            onChange={(event) => setBeatText(event.target.value)}
          />
        </label>
        <button
          onClick={() => {
            const beats = [
              ...new Set(
                beatText
                  .split(/[,،\s]+/)
                  .filter(Boolean)
                  .map((value) => Math.round(Number(value) * fps)),
              ),
            ].sort((a, b) => a - b);
            if (
              beats.every(
                (value) =>
                  Number.isInteger(value) && value >= 0 && value < project.targetDurationFrames,
              )
            )
              change({ ...timeline, beats });
          }}
        >
          تطبيق علامات الإيقاع
        </button>
        <p className="inline-note">
          الإيقاعات المحفوظة:{' '}
          {timeline.beats.map((value) => (value / fps).toFixed(2)).join('، ') || 'لا توجد'}
        </p>
        {timeline.pauses.map((pause) => (
          <div className="audio-track" key={pause.id}>
            <label className="field">
              <span>وصف الصمت أو الوقفة</span>
              <input
                maxLength={120}
                value={pause.label}
                onChange={(event) =>
                  change({
                    ...timeline,
                    pauses: timeline.pauses.map((item) =>
                      item.id === pause.id ? { ...item, label: event.target.value } : item,
                    ),
                  })
                }
              />
            </label>
            <div className="form-grid">
              {seconds('بداية الصمت', pause.startFrame, (value) =>
                change({
                  ...timeline,
                  pauses: timeline.pauses.map((item) =>
                    item.id === pause.id ? { ...item, startFrame: value } : item,
                  ),
                }),
              )}
              {seconds('مدة الصمت', pause.durationFrames, (value) =>
                change({
                  ...timeline,
                  pauses: timeline.pauses.map((item) =>
                    item.id === pause.id ? { ...item, durationFrames: value } : item,
                  ),
                }),
              )}
            </div>
            <button
              onClick={() =>
                change({
                  ...timeline,
                  pauses: timeline.pauses.filter((item) => item.id !== pause.id),
                })
              }
            >
              حذف الوقفة
            </button>
          </div>
        ))}
        <button
          data-testid="add-silence-marker"
          onClick={() =>
            change({
              ...timeline,
              pauses: [
                ...timeline.pauses,
                {
                  id: 'pause-' + crypto.randomUUID().replaceAll('-', ''),
                  startFrame: project.targetDurationFrames - fps,
                  durationFrames: fps,
                  label: 'وقفة مقصودة',
                },
              ],
            })
          }
        >
          ＋ علامة صمت أو وقفة مقصودة
        </button>
        <p className="inline-note">
          علامة الصمت يجب ألا تتداخل مع مسار مسموع. قصّر المسار أو حرّكه لتحديد الوقفة.
        </p>
        <h3>مكتبة ملفات الصوت والفيديو</h3>
        {project.assets
          .filter((asset) => ['audio', 'video'].includes(asset.kind))
          .map((asset) => (
            <article className="asset" key={asset.id}>
              <div className="asset-description">
                <strong>{asset.sourceNote}</strong>
                <small>
                  {asset.metadata?.durationSeconds.toFixed(2)} ثانية ·{' '}
                  {(asset.byteSize / 1024 / 1024).toFixed(2)} MB ·{' '}
                  {asset.approval === 'approved' ? 'معتمد' : 'بانتظار المراجعة'}
                </small>
                {asset.kind === 'audio' ? (
                  <audio controls src={media[asset.id]} preload="none" />
                ) : (
                  <video
                    controls
                    src={media[asset.id]}
                    preload="metadata"
                    style={{ maxWidth: 240, maxHeight: 150 }}
                  />
                )}
                <button
                  onClick={() =>
                    onReview(asset.id, asset.sourceNote, asset.approval !== 'approved')
                  }
                >
                  {asset.approval === 'approved' ? 'إلغاء الاعتماد' : 'اعتماد الملف بعد المراجعة'}
                </button>
              </div>
            </article>
          ))}
      </fieldset>
    </section>
  );
}
