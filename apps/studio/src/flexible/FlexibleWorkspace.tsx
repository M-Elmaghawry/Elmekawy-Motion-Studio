import React from 'react';
import type { FlexibleProject } from '@elmekawy/shared/flexible';
import { NewProjectWizard } from './NewProjectWizard';
import { FlexibleEditor } from './FlexibleEditor';
import './flexible.css';
export default function FlexibleWorkspace({
  projectId,
  onOpen,
  onBack,
  onDirtyChange,
  onProjectsChanged,
  note,
}: {
  projectId: string | null;
  onOpen: (project: FlexibleProject, note?: string) => void;
  onBack: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onProjectsChanged: () => Promise<unknown>;
  note: string;
}) {
  return projectId ? (
    <FlexibleEditor
      key={projectId}
      id={projectId}
      onBack={onBack}
      onDirtyChange={onDirtyChange}
      onProjectsChanged={onProjectsChanged}
      onOpen={onOpen}
      note={note}
    />
  ) : (
    <NewProjectWizard onCreated={onOpen} onBack={onBack} />
  );
}
