'use client';

import { useState } from 'react';
import UploadArea from '@/components/UploadArea';
import type { FidelityScore } from '@/lib/gemini';

type Room = 'editorial' | 'corporativo' | 'social' | 'artistico' | 'produto';
type Step = 'upload' | 'analyzing' | 'review' | 'generating' | 'compare' | 'saving' | 'done';

const ROOM_LABELS: Record<Room, string> = {
  editorial:   '📸 Foto de Estúdio',
  corporativo: '💼 Foto Profissional',
  social:      '📱 Foto Lifestyle',
  artistico:   '🎨 Ilustração & 3D',
  produto:     '🛍️ Produtos',
};

interface CreatedStyle {
  id: string;
  name: string;
  thumbnail_url: string;
  room: string;
}

const STEP_LABELS: Partial<Record<Step, string>> = {
  upload:  '1. Upload',
  review:  '2. Revisar Prompt',
  compare: '3. Comparar & Salvar',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 rounded-full bg-white/10 h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className={`w-8 text-right font-mono ${value >= 80 ? 'text-green-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{value}</span>
    </div>
  );
}

export default function AdminStylesPage() {
  // Form fields
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [room, setRoom] = useState<Room>('editorial');
  const [originalPrompt, setOriginalPrompt] = useState('');

  // Flow state
  const [step, setStep] = useState<Step>('upload');
  const [shieldPrompt, setShieldPrompt] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [generatedBase64, setGeneratedBase64] = useState('');
  const [fidelity, setFidelity] = useState<FidelityScore | null>(null);
  const [result, setResult] = useState<CreatedStyle | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(f: File, url: string) {
    setFile(f); setPreview(url); setResult(null); setError(null);
  }

  function reset() {
    setFile(null); setPreview(null); setName(''); setOriginalPrompt('');
    setShieldPrompt(''); setResolvedName(''); setGeneratedBase64('');
    setFidelity(null); setResult(null); setError(null); setStep('upload');
  }

  async function handleAnalyze() {
    if (!file) return;
    setStep('analyzing'); setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name.trim());
    formData.append('room', room);
    if (originalPrompt.trim()) formData.append('originalPrompt', originalPrompt.trim());
    try {
      const res = await fetch('/api/admin/analyze-style', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar referência');
      setShieldPrompt(data.shieldPrompt);
      setResolvedName(data.resolvedName);
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      setStep('upload');
    }
  }

  async function handleGenerate() {
    setStep('generating'); setError(null); setFidelity(null);
    try {
      // Convert reference file to base64 for fidelity scoring
      let referenceBase64: string | undefined;
      let referenceMime: string | undefined;
      if (file) {
        const buf = await file.arrayBuffer();
        referenceBase64 = Buffer.from(buf).toString('base64');
        referenceMime = file.type || 'image/jpeg';
      }

      const res = await fetch('/api/admin/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shieldPrompt, referenceBase64, referenceMime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar preview');
      setGeneratedBase64(data.imageBase64);
      if (data.fidelity) setFidelity(data.fidelity);
      setStep('compare');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      setStep('review');
    }
  }

  async function handleSave() {
    setStep('saving'); setError(null);
    try {
      const res = await fetch('/api/admin/save-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: generatedBase64, shieldPrompt, resolvedName, room }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar estilo');
      setResult(data.style);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      setStep('compare');
    }
  }

  const activeStepLabel = STEP_LABELS[
    step === 'analyzing' ? 'upload' : step === 'generating' ? 'review' : step === 'saving' ? 'compare' : step
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Copyright Shield</h1>
        <p className="text-gray-400 text-sm mt-1">
          Faça upload de uma referência (Pinterest/Instagram). O sistema extrai o estilo via IA,
          recria com um modelo virtual fictício e salva na galeria. A foto original nunca é salva.
        </p>
      </div>

      {/* Progress indicator */}
      {step !== 'done' && (
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
          {Object.entries(STEP_LABELS).map(([s, label], i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className={activeStepLabel === label ? 'text-amber-400 font-semibold' : 'text-gray-600'}>
                {label}
              </span>
              {i < arr.length - 1 && <span className="text-gray-700">→</span>}
            </span>
          ))}
        </div>
      )}

      {/* ── STEP 1: Upload ── */}
      {(step === 'upload' || step === 'analyzing') && (
        <div className="space-y-5 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div>
            <p className="text-sm text-gray-400 mb-2">Imagem de referência <span className="text-gray-600">(será descartada após análise)</span></p>
            <UploadArea preview={preview} onFile={handleFile} onClear={() => { setFile(null); setPreview(null); }} />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Prompt original da imagem <span className="text-gray-600">(opcional — Midjourney, Stable Diffusion, etc.)</span>
            </label>
            <textarea
              value={originalPrompt}
              onChange={e => setOriginalPrompt(e.target.value)}
              placeholder="Cole aqui o prompt usado para criar a imagem de referência (se disponível). Melhora significativamente a precisão da análise."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Nome do estilo <span className="text-gray-600">(opcional — IA gera automaticamente)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Deixe vazio para gerar automaticamente"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-amber-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ROOM_LABELS) as Room[]).map(r => (
                <button key={r} onClick={() => setRoom(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer ${room === r ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'}`}>
                  {ROOM_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</p>}

          <button
            disabled={!file || step === 'analyzing'}
            onClick={handleAnalyze}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${file && step === 'upload' ? 'bg-amber-500 text-black hover:bg-amber-400 cursor-pointer' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}>
            {step === 'analyzing'
              ? <><span className="inline-block animate-spin">↻</span> <span className="text-sm">Analisando referência com IA...</span></>
              : '🔍 Analisar Referência'
            }
          </button>
        </div>
      )}

      {/* ── STEP 2: Review & edit prompt ── */}
      {(step === 'review' || step === 'generating') && (
        <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-blue-300">Análise concluída — Revise o Shield Prompt</h2>
            <button
              onClick={() => setStep('upload')}
              className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
              ← Voltar ao upload
            </button>
          </div>

          <div className="flex items-start gap-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Referência" className="w-20 rounded-xl object-cover aspect-[3/4] shrink-0 ring-1 ring-white/10" />
            )}
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-1 block">Nome do estilo</label>
              <input
                type="text"
                value={resolvedName}
                onChange={e => setResolvedName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Shield Prompt <span className="text-gray-600">(gerado pela IA — edite se necessário)</span>
            </label>
            <textarea
              value={shieldPrompt}
              onChange={e => setShieldPrompt(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-xl text-xs text-gray-200 font-mono outline-none focus:ring-1 focus:ring-blue-500 resize-y"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {error && <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</p>}

          <button
            disabled={!shieldPrompt.trim() || step === 'generating'}
            onClick={handleGenerate}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${shieldPrompt.trim() && step === 'review' ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}>
            {step === 'generating'
              ? <><span className="inline-block animate-spin">↻</span> <span className="text-sm">Gerando preview e avaliando fidelidade...</span></>
              : '🎨 Gerar Preview'
            }
          </button>
        </div>
      )}

      {/* ── STEP 3: Compare & approve ── */}
      {(step === 'compare' || step === 'saving') && (
        <div className="p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-violet-300">Compare: Referência vs. Imagem Gerada</h2>
            <button
              onClick={() => setStep('review')}
              className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
              ← Editar prompt
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-center text-gray-500">Original (Referência)</p>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Referência original" className="w-full rounded-xl object-cover aspect-[3/4] ring-1 ring-white/10" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-center text-gray-500">Gerada pelo sistema</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${generatedBase64}`}
                alt="Imagem gerada"
                className="w-full rounded-xl object-cover aspect-[3/4] ring-1 ring-white/10"
              />
            </div>
          </div>

          {/* Fidelity score */}
          {fidelity && (
            <div className={`p-4 rounded-xl border space-y-3 ${fidelity.overall >= 70 ? 'border-green-500/20 bg-green-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Fidelidade</span>
                <span className={`text-2xl font-bold ${fidelity.overall >= 80 ? 'text-green-400' : fidelity.overall >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {fidelity.overall}%
                </span>
              </div>
              <div className="space-y-1.5">
                <ScoreBar label="Meio Artístico" value={fidelity.medium} />
                <ScoreBar label="Iluminação"     value={fidelity.lighting} />
                <ScoreBar label="Vestuário"      value={fidelity.costume} />
                <ScoreBar label="Pose"           value={fidelity.pose} />
                <ScoreBar label="Cenário"        value={fidelity.environment} />
              </div>
              {fidelity.feedback && (
                <p className={`text-xs ${fidelity.regenerate ? 'text-amber-400' : 'text-gray-400'}`}>
                  {fidelity.regenerate ? '⚠ ' : '✓ '}{fidelity.feedback}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 text-sm text-gray-500 border-t border-white/5 pt-3">
            <span>Nome: <span className="text-gray-300">{resolvedName}</span></span>
            <span>·</span>
            <span>Categoria: <span className="text-gray-300">{ROOM_LABELS[room]}</span></span>
          </div>

          {error && <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button
              disabled={step === 'saving'}
              onClick={handleSave}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${step === 'compare' ? 'bg-green-600 text-white hover:bg-green-500 cursor-pointer' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}>
              {step === 'saving'
                ? <><span className="inline-block animate-spin">↻</span> <span className="text-sm">Salvando...</span></>
                : '✓ Aprovar e Salvar'
              }
            </button>
            <button
              disabled={step === 'saving'}
              onClick={handleGenerate}
              className="px-5 py-3 rounded-xl font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              ↺ Regenerar
            </button>
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-green-500/30 bg-green-500/5">
            <p className="text-green-400 font-medium mb-3">✓ Estilo criado com sucesso!</p>
            <div className="flex gap-4 items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.thumbnail_url} alt={result.name} className="w-24 rounded-xl object-cover aspect-[3/4]" />
              <div>
                <p className="font-medium">{result.name}</p>
                <p className="text-sm text-gray-400">{result.room}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {result.id}</p>
              </div>
            </div>
          </div>
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl font-medium bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer">
            + Criar outro estilo
          </button>
        </div>
      )}
    </main>
  );
}
