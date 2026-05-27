"use client";

import { useState } from "react";

interface ContentPiece {
  id: string;
  title: string;
  caption: string | null;
  mediaUrls: string[] | null;
  platform: string;
  status: string;
  createdAt: Date;
}

interface PortalContentListProps {
  pieces: ContentPiece[];
}

export default function PortalContentList({ pieces }: PortalContentListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Set<string>>(new Set());

  async function handleApprove(pieceId: string) {
    setLoading(pieceId);
    try {
      await fetch("/api/portal/content/" + pieceId + "/approve", { method: "POST" });
      setDone((prev) => new Set(prev).add(pieceId));
    } finally {
      setLoading(null);
    }
  }

  async function handleRevision(pieceId: string) {
    const note = notes[pieceId] ?? "";
    if (!note.trim()) return;
    setLoading(pieceId);
    try {
      await fetch("/api/portal/content/" + pieceId + "/request-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      setDone((prev) => new Set(prev).add(pieceId));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      {pieces.map((piece) => {
        if (done.has(piece.id)) {
          return (
            <div key={piece.id} className="bg-white rounded-xl shadow-sm p-6 opacity-50">
              <p className="text-sm text-gray-500">Resposta enviada para: {piece.title}</p>
            </div>
          );
        }

        const thumb = piece.mediaUrls?.[0];
        const captionPreview = piece.caption
          ? piece.caption.slice(0, 120) + (piece.caption.length > 120 ? "..." : "")
          : null;

        return (
          <div key={piece.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex gap-4">
              {thumb && (
                <img
                  src={thumb}
                  alt={piece.title}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{piece.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {piece.platform}
                  </span>
                </div>
                {captionPreview && (
                  <p className="text-sm text-gray-600 mb-3">{captionPreview}</p>
                )}
                <button
                  onClick={() => handleApprove(piece.id)}
                  disabled={loading === piece.id}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading === piece.id ? "Enviando..." : "Aprovar"}
                </button>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <label className="block text-sm text-gray-600 mb-2">Solicitar revisão:</label>
              <textarea
                rows={2}
                value={notes[piece.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [piece.id]: e.target.value }))}
                placeholder="Descreva o que precisa ser ajustado..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleRevision(piece.id)}
                disabled={loading === piece.id || !notes[piece.id]?.trim()}
                className="mt-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                Solicitar Revisao
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
