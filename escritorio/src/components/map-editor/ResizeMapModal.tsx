'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';

interface ResizeMapModalProps {
  open: boolean;
  width: number;
  height: number;
  onClose: () => void;
  onSubmit: (width: number, height: number) => void;
}

const MIN_MAP_SIZE = 1;
const MAX_MAP_SIZE = 200;

function clampSize(value: number): number {
  if (!Number.isFinite(value)) return MIN_MAP_SIZE;
  return Math.min(MAX_MAP_SIZE, Math.max(MIN_MAP_SIZE, Math.floor(value)));
}

export default function ResizeMapModal({
  open,
  width,
  height,
  onClose,
  onSubmit,
}: ResizeMapModalProps) {
  const t = useT();
  const [nextWidth, setNextWidth] = useState(width);
  const [nextHeight, setNextHeight] = useState(height);

  const handleSubmit = () => {
    onSubmit(clampSize(nextWidth), clampSize(nextHeight));
  };

  return (
    <Modal open={open} onClose={onClose} title={t('mapEditor.project.resizeMap')}>
      <div className="space-y-4 p-4">
        <div>
          <p className="text-sm text-text-secondary">{t('mapEditor.project.resizeMapDescription')}</p>
          <p className="mt-2 text-xs text-text-dim">
            {t('mapEditor.project.currentSize', { width, height })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              {t('mapEditor.newMap.width')}
            </label>
            <input
              type="number"
              min={MIN_MAP_SIZE}
              max={MAX_MAP_SIZE}
              value={nextWidth}
              onChange={(e) => setNextWidth(clampSize(Number.parseInt(e.target.value, 10) || MIN_MAP_SIZE))}
              className="w-full rounded border border-border bg-surface-raised px-3 py-2 text-sm text-text"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              {t('mapEditor.newMap.height')}
            </label>
            <input
              type="number"
              min={MIN_MAP_SIZE}
              max={MAX_MAP_SIZE}
              value={nextHeight}
              onChange={(e) => setNextHeight(clampSize(Number.parseInt(e.target.value, 10) || MIN_MAP_SIZE))}
              className="w-full rounded border border-border bg-surface-raised px-3 py-2 text-sm text-text"
            />
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t('mapEditor.project.resizeWarning')}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-dim hover:text-text"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            {t('mapEditor.project.resizeApply')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
