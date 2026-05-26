"use client";

import { BookOpen, Layers } from "lucide-react";
import type { LibraryItem, MetaData, ViewMode } from "./LibraryStorybook";

interface LibraryDocsViewProps {
  items: LibraryItem[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onSelect: (id: string) => void;
}

export default function LibraryDocsView({ items, viewMode, setViewMode, onSelect }: LibraryDocsViewProps) {
  const designItems = items.filter((i) => i.layer === "design");
  const colors = designItems.filter((i) => i.category.startsWith("color-"));
  const logos = designItems.filter((i) => i.category.startsWith("logo-"));
  const fonts = designItems.filter((i) => i.category.startsWith("font-"));
  const components = designItems.filter((i) => !i.category.startsWith("color-") && !i.category.startsWith("logo-") && !i.category.startsWith("font-"));
  const docs = items.filter((i) => i.layer === "documents");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="h-10 bg-gray-900/50 border-b border-gray-800 flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("canvas")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "canvas" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Canvas
          </button>
          <button
            onClick={() => setViewMode("docs")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "docs" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Docs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-8 space-y-16">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white">Design System</h1>
            <p className="text-sm text-gray-500 mt-2">Documentacao visual completa da marca</p>
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-pink-500 rounded-full" />
                Paleta de Cores
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {colors.map((c) => {
                  const meta = (c.metadata ?? {}) as MetaData;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { onSelect(c.id); setViewMode("canvas"); }}
                      className="group"
                    >
                      <div
                        className="w-full aspect-square rounded-xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: meta.cssValue || "#000" }}
                      />
                      <p className="text-xs text-white font-medium mt-2">{c.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{meta.cssValue}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Logos */}
          {logos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                Logos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {logos.map((logo) => (
                  <button
                    key={logo.id}
                    onClick={() => { onSelect(logo.id); setViewMode("canvas"); }}
                    className="group"
                  >
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 group-hover:border-indigo-500/50 transition-colors">
                      {logo.content?.startsWith("data:image") ? (
                        <img src={logo.content} alt={logo.name} className="w-full h-20 object-contain" />
                      ) : (
                        <div className="w-full h-20 flex items-center justify-center text-gray-600 text-xs">(sem imagem)</div>
                      )}
                    </div>
                    <p className="text-xs text-white mt-2">{logo.name}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Typography */}
          {fonts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-sky-500 rounded-full" />
                Tipografia
              </h2>
              <div className="space-y-8">
                {fonts.map((font) => {
                  const meta = (font.metadata ?? {}) as MetaData;
                  const family = meta.fontFamily || "sans-serif";
                  return (
                    <button
                      key={font.id}
                      onClick={() => { onSelect(font.id); setViewMode("canvas"); }}
                      className="w-full text-left group"
                    >
                      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 group-hover:border-sky-500/50 transition-colors">
                        <p className="text-xs text-gray-500 mb-2">{font.name}</p>
                        <p className="text-3xl text-white" style={{ fontFamily: family }}>
                          Aa Bb Cc Dd Ee Ff Gg 0123456789
                        </p>
                        <p className="text-xs text-gray-600 mt-2 font-mono">{family} {meta.fontWeight ? `- ${meta.fontWeight}` : ""}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Components */}
          {components.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                Componentes
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {components.map((comp) => {
                  const meta = (comp.metadata ?? {}) as MetaData;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => { onSelect(comp.id); setViewMode("canvas"); }}
                      className="group text-left"
                    >
                      <div className="bg-white rounded-xl p-6 border border-gray-200 group-hover:shadow-lg transition-shadow min-h-[80px] flex items-center justify-center">
                        {comp.content ? (
                          <div dangerouslySetInnerHTML={{ __html: comp.content }} />
                        ) : (
                          <div
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                            style={{ backgroundColor: meta.cssValue || "#6366f1" }}
                          >
                            {comp.name}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white mt-2">{comp.name}</p>
                      {meta.componentType && <p className="text-[10px] text-gray-600">{meta.componentType}</p>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Documents summary */}
          {docs.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full" />
                Documentos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => { onSelect(doc.id); setViewMode("canvas"); }}
                    className="text-left bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-green-500/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-white">{doc.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{doc.category}</p>
                    <p className="text-xs text-gray-600 mt-3 line-clamp-3">
                      {doc.content?.slice(0, 200) || "(vazio)"}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {items.length === 0 && (
            <div className="text-center py-20 text-gray-600">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Biblioteca vazia</p>
              <p className="text-xs mt-1">Adicione itens pela sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
