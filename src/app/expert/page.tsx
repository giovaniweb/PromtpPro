'use client';

import { useState } from 'react';

const ROOMS = [
  { key: 'editorial', icon: '📸', name: 'Editorial', desc: 'Moda, beauty, revista' },
  { key: 'corporativo', icon: '👔', name: 'Corporativo', desc: 'LinkedIn, CV, site' },
  { key: 'social', icon: '📱', name: 'Social Media', desc: 'Instagram, TikTok' },
  { key: 'artistico', icon: '🎨', name: 'Artístico', desc: '3D, animação, fantasia' },
  { key: 'produto', icon: '🎁', name: 'Produto', desc: 'E-commerce, fotos de loja' },
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

  function copyPrompt() {
    navigator.clipboard.writeText(generatePrompt());
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Expert — Crie seu prompt</h1>

      {/* Progress bar */}
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

      {/* Steps */}
      <div className="fade-in" key={step}>
        {step === 0 && <Step1 value={state.room} onChange={(v) => setState({ ...state, room: v })} />}
        {step === 1 && <Step2 value={state.description} onChange={(v) => setState({ ...state, description: v })} />}
        {step === 2 && <Step3 value={state.style} onChange={(v) => setState({ ...state, style: v })} />}
        {step === 3 && <Step4 value={state.lighting} onChange={(v) => setState({ ...state, lighting: v })} />}
        {step === 4 && <Step5 prompt={generatePrompt()} onCopy={copyPrompt} />}
      </div>

      {/* Navegação */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white cursor-pointer hover:bg-white/15">
            Voltar
          </button>
        )}
        {step < 4 && (
          <button onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className={`px-6 py-2.5 rounded-xl font-medium ml-auto cursor-pointer ${
              canNext ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}>
            Próximo
          </button>
        )}
        {step === 4 && (
          <button onClick={() => setStep(0)}
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

function Step5({ prompt, onCopy }: { prompt: string; onCopy: () => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Seu prompt está pronto!</h2>
      <pre className="bg-black/40 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap break-words mb-4">
        {prompt}
      </pre>
      <div className="flex gap-3">
        <button onClick={onCopy}
          className="px-6 py-2.5 rounded-xl bg-violet-600 text-white cursor-pointer hover:bg-violet-700 font-medium">
          Copiar prompt
        </button>
        <button disabled className="px-6 py-2.5 rounded-xl bg-white/10 text-gray-500 cursor-not-allowed font-medium">
          Gerar imagem (em breve)
        </button>
      </div>
    </div>
  );
}
