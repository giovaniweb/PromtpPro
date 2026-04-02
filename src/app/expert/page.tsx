'use client';

import { useState, useRef } from 'react';

const ROOMS = [
  { key: 'editorial', icon: '📸', name: 'Editorial', desc: 'Moda, beauty, revista', ratio: '9:16' },
  { key: 'corporativo', icon: '👔', name: 'Corporativo', desc: 'LinkedIn, CV, site', ratio: '1:1' },
  { key: 'social', icon: '📱', name: 'Social Media', desc: 'Instagram, TikTok', ratio: '9:16' },
  { key: 'artistico', icon: '🎨', name: 'Artístico', desc: '3D, animação, fantasia', ratio: '9:16' },
  { key: 'produto', icon: '🎁', name: 'Produto', desc: 'E-commerce, fotos de loja', ratio: '1:1' },
];

const STYLES = ['Cinematográfico', 'Animação 3D', 'Minimalista', 'Fantasia', 'Documentário'];
const LIGHTS = ['Luz natural suave', 'Golden hour', 'Estúdio profissional', 'Neon urbano', 'Dramática'];

interface WizardState {
  room: string;
  description: string;
  style: string;
  lighting: string;
}

export default function ExpertPage() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({ room: '', description: '', style: '', lighting: '' });
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const canNext = [
    state.room !== '',
    state.description.trim().length > 10,
    state.style !== '',
    state.lighting !== '',
    true,
  ][step];

  function generatePrompt() {
    const room = ROOMS.find(r => r.key === state.room);
    return `[Sujeito] Fotografia ${room?.name || ''}: ${state.description}. ` +
      `[Ação] Pose natural e expressiva adequada ao contexto. ` +
      `[Cenário] Ambiente condizente com o estilo ${room?.name?.toLowerCase() || ''}, detalhes realistas. ` +
      `[Composição] Enquadramento profissional, regra dos terços, equilíbrio visual. ` +
      `[Iluminação] ${state.lighting}, com nuances que valorizam o sujeito. ` +
      `[Estética] Estilo visual ${state.style.toLowerCase()}, cores harmônicas, mood envolvente. ` +
      `[Câmera] Lente profissional com profundidade de campo adequada ao contexto.`;
  }

  function handleSelfie(file: File) {
    setSelfie(file);
    setSelfiePreview(URL.createObjectURL(file));
    setResult(null);
    setGenError(null);
  }

  async function handleGenerate() {
    if (!selfie) return;
    setGenerating(true);
    setGenError(null);

    const room = ROOMS.find(r => r.key === state.room);
    const prompt = generatePrompt();

    const form = new FormData();
    form.append('file', selfie);
    form.append('promptEn', prompt);
    form.append('precomputedPrompt', prompt);
    form.append('aspectRatio', room?.ratio ?? '9:16');
    form.append('styleId', `expert-${state.room}`);

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem');
      setResult(data.imageDataUrl);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Expert — Crie seu prompt</h1>

      <div className="flex items-center justify-between mb-8">
        {['Tipo', 'Cena', 'Estilo', 'Luz', 'Resultado'].map((label, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= step ? 'bg-violet-600 text-white' : 'bg-white/10 text-gray-500'
            }`}>
              {i + 1}
            </div>
            {i < 4 && <div className={`w-8 sm:w-16 h-0.5 ${i < step ? 'bg-violet-600' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <div className="fade-in" key={step}>
        {step === 0 && <Step1 value={state.room} onChange={(v) => setState({ ...state, room: v })} />}
        {step === 1 && <Step2 value={state.description} onChange={(v) => setState({ ...state, description: v })} />}
        {step === 2 && <Step3 value={state.style} onChange={(v) => setState({ ...state, style: v })} />}
        {step === 3 && <Step4 value={state.lighting} onChange={(v) => setState({ ...state, lighting: v })} />}
        {step === 4 && (
          <Step5
            prompt={generatePrompt()}
            onCopy={() => navigator.clipboard.writeText(generatePrompt())}
            selfiePreview={selfiePreview}
            onSelfie={handleSelfie}
            onGenerate={handleGenerate}
            generating={generating}
            result={result}
            error={genError}
          />
        )}
      </div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white cursor-pointer hover:bg-white/15">
            Voltar
          </button>
        )}
        {step < 4 && (
          <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext}
            className={`px-6 py-2.5 rounded-xl font-medium ml-auto cursor-pointer ${
              canNext ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}>
            Próximo
          </button>
        )}
        {step === 4 && (
          <button onClick={() => { setStep(0); setResult(null); setGenError(null); setSelfie(null); setSelfiePreview(null); }}
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white cursor-pointer hover:bg-white/15 ml-auto">
            Voltar e ajustar
          </button>
        )}
      </div>
    </main>
  );
}

function Step1({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">O que você quer criar?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ROOMS.map((r) => (
          <button key={r.key} onClick={() => onChange(r.key)}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              value === r.key ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-white/20'
            }`}>
            <div className="text-2xl mb-2">{r.icon}</div>
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-gray-400">{r.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Descreva a cena</h2>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5}
        placeholder="Ex: Uma mulher elegante tomando café em um café parisiense com luz da tarde entrando pela janela..."
        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm resize-none outline-none focus:border-violet-500" />
      <p className="text-xs text-gray-500 mt-2">Quanto mais detalhes, melhor o resultado</p>
    </div>
  );
}

function Step3({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Escolha o estilo visual</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STYLES.map((s) => (
          <button key={s} onClick={() => onChange(s)}
            className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
              value === s ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-white/20'
            }`}>
            <p className="font-medium text-sm">{s}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step4({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Escolha a iluminação</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LIGHTS.map((l) => (
          <button key={l} onClick={() => onChange(l)}
            className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
              value === l ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-white/20'
            }`}>
            <p className="font-medium text-sm">{l}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Step5Props {
  prompt: string;
  onCopy: () => void;
  selfiePreview: string | null;
  onSelfie: (f: File) => void;
  onGenerate: () => void;
  generating: boolean;
  result: string | null;
  error: string | null;
}

function Step5({ prompt, onCopy, selfiePreview, onSelfie, onGenerate, generating, result, error }: Step5Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-3">Seu prompt está pronto!</h2>
        <pre className="bg-black/40 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap break-words">
          {prompt}
        </pre>
        <button onClick={onCopy} className="mt-2 text-xs text-violet-400 hover:text-violet-300 cursor-pointer">
          Copiar prompt
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Sua foto (selfie)</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onSelfie(f); }} />

        {!selfiePreview ? (
          <button onClick={() => inputRef.current?.click()}
            className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-violet-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
            <span className="text-2xl">🤳</span>
            <span className="text-sm text-gray-400">Clique para enviar sua foto</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfiePreview} alt="selfie" className="w-16 h-16 rounded-xl object-cover" />
            <button onClick={() => inputRef.current?.click()}
              className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer">
              Trocar foto
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</p>}

      <button onClick={onGenerate} disabled={!selfiePreview || generating}
        className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          selfiePreview && !generating
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 cursor-pointer'
            : 'bg-white/10 text-gray-500 cursor-not-allowed'
        }`}>
        {generating ? (
          <><span className="spinner" /><span>Gerando...</span></>
        ) : (
          '✨ Gerar imagem'
        )}
      </button>

      {result && (
        <div className="fade-in">
          <p className="text-sm font-medium text-green-400 mb-3">Imagem gerada!</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt="resultado" className="w-full rounded-2xl" />
          <a href={result} download="expert-result.png"
            className="block mt-3 text-center py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15 cursor-pointer">
            Baixar imagem
          </a>
        </div>
      )}
    </div>
  );
}
