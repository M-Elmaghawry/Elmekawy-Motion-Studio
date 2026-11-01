import React, { useEffect, useState } from 'react';
import type { Project } from '@elmekawy/shared';
import type { FlexibleProject } from '@elmekawy/shared/flexible';
import { api } from './api';
type Document = Project | FlexibleProject;
export function ProjectBackups({
  project,
  base,
  disabled,
  prepare,
  onRestored,
  onError,
}: {
  project: Document;
  base: string;
  disabled: boolean;
  prepare: () => Promise<Document | null>;
  onRestored: (value: Document) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const [history, setHistory] = useState<{ revision: number; name: string; updatedAt: string }[]>(
      [],
    ),
    [target, setTarget] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void api<typeof history>(base + '/history')
      .then((value) => {
        if (active) {
          setHistory(value);
          setTarget(String(value[0]?.revision ?? ''));
        }
      })
      .catch(onError);
    return () => {
      active = false;
    };
  }, [base, project.revision]);
  async function download() {
    setBusy(true);
    try {
      const current = await prepare();
      if (current) {
        const link = document.createElement('a');
        link.href = base + '/archive';
        link.download = current.id + '.zip';
        link.click();
      }
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    setBusy(true);
    try {
      const current = await prepare();
      if (!current) return;
      const restored = await api<Document>(base + '/restore', {
        method: 'POST',
        headers: { 'If-Match': '"r' + current.revision + '"' },
        body: JSON.stringify({ revision: Number(target) }),
      });
      await onRestored(restored);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel recovery-panel" id="project-backups">
      <h2>النسخ الاحتياطي واسترجاع الإصدارات</h2>
      <p className="inline-note">
        نسخة ZIP تشمل البيانات والوسائط والخطوط والإصدارات المحفوظة. استيرادها ينشئ مشروعًا مستقلًا.
      </p>
      <button
        data-testid="project-archive-download"
        disabled={disabled || busy}
        onClick={() => void download()}
      >
        حفظ وتنزيل نسخة المشروع ZIP
      </button>
      <label className="field">
        <span>إصدار سابق محفوظ</span>
        <select
          data-testid="history-revision"
          value={target}
          disabled={!history.length || disabled || busy}
          onChange={(event) => setTarget(event.target.value)}
        >
          <option value="">اختر إصدارًا</option>
          {history.map((item) => (
            <option key={item.revision} value={item.revision}>
              الإصدار {item.revision} · {item.name}
            </option>
          ))}
        </select>
      </label>
      <button
        data-testid="restore-revision"
        disabled={!target || disabled || busy}
        onClick={() => void restore()}
      >
        استعادة كإصدار جديد
      </button>
      <p className="inline-note">الاستعادة تحفظ الحالة الحالية في التاريخ أولًا.</p>
    </section>
  );
}
export function ArchiveImportButton({
  disabled,
  onImported,
  onError,
}: {
  disabled: boolean;
  onImported: (result: { format: 'legacy' | 'flexible'; project: Document }) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api<{ format: 'legacy' | 'flexible'; project: Document }>(
        '/api/project-archives/import',
        { method: 'POST', body: form },
      );
      await onImported(result);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <label className="upload-button archive-import">
      {busy ? 'جاري التحقق والاستيراد…' : 'استيراد مشروع ZIP'}
      <input
        data-testid="project-archive-import"
        type="file"
        accept=".zip,application/zip"
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />
    </label>
  );
}
