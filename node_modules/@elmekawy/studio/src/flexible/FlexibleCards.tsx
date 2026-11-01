import React from 'react';
import type { FlexibleProject } from '@elmekawy/shared/flexible';
export function FlexibleCards({
  projects,
  onOpen,
  onDuplicate,
  disabled,
}: {
  projects: FlexibleProject[];
  onOpen: (project: FlexibleProject) => void;
  onDuplicate: (project: FlexibleProject) => void;
  disabled: boolean;
}) {
  return (
    <>
      {projects.map((project) => (
        <article
          className="project-card"
          data-testid="flexible-project-card"
          data-project-id={project.id}
          key={project.id}
        >
          <div
            className="project-art"
            style={{
              background: `linear-gradient(135deg, ${project.brand.colors.surface}, ${project.brand.colors.background})`,
            }}
          >
            <bdi style={{ color: project.brand.colors.accent }}>{project.brand.displayName}</bdi>
            <strong style={{ color: project.brand.colors.foreground }}>
              {('headline' in project.scenes[0].content
                ? project.scenes[0].content.headline
                : project.brief.objective
              ).slice(0, 70)}
            </strong>
            <span>
              {Number((project.targetDurationFrames / project.outputProfile.fps).toFixed(2))} ثانية
              · {project.scenes.length} مشاهد
            </span>
          </div>
          <div className="project-body">
            <h2>{project.name}</h2>
            <p>{project.brief.client}</p>
            <div className="metadata">
              <bdi>
                {project.outputProfile.width} × {project.outputProfile.height}
              </bdi>
              <bdi>{project.outputProfile.fps} FPS</bdi>
              <span>الإصدار {project.revision}</span>
            </div>
            <small className="muted">مشاهد مرنة · نصوص وصور قابلة للتحرير</small>
            <div className="actions">
              <button
                data-testid="open-flexible-project"
                className="primary"
                disabled={disabled}
                onClick={() => onOpen(project)}
              >
                فتح المشروع
              </button>
              <button disabled={disabled} onClick={() => onDuplicate(project)}>
                نسخ المشروع
              </button>
            </div>
          </div>
        </article>
      ))}
    </>
  );
}
