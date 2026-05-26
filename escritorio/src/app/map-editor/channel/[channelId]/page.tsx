'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n';
import MapEditorLayout from '@/components/map-editor/MapEditorLayout';

function EditorContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const channelId = params.channelId as string;
  const returnTo = searchParams.get('returnTo');

  return <MapEditorLayout channelId={channelId} returnTo={returnTo} />;
}

export default function MapEditorChannelPage() {
  const t = useT();

  return (
    <Suspense
      fallback={
        <div className="h-screen bg-bg flex items-center justify-center text-text-muted text-body">
          {t('common.loading')}
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
