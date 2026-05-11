import type { StyleFeatures } from './gemini';

function cleanMJFlags(prompt: string): string {
  return prompt
    .replace(/--ar\s+\S+/g, '')
    .replace(/--v\s*\d+/g, '')
    .replace(/--chaos\s+\d+/g, '')
    .replace(/--stylize\s+\d+/g, '')
    .replace(/--style\s+\S+/g, '')
    .replace(/--q\s+[\d.]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function stripPersonDescriptors(prompt: string): string {
  return prompt
    .replace(/\b\d+\s+years?\s+old\b/gi, '')
    .replace(/\b(male|female|man|woman|boy|girl|person|writer|photographer|model|athlete|CEO|executive|journalist|director|actor|actress)\b/gi, '[FICTIONAL MODEL]')
    .replace(/\b(European|Asian|African|Latino|Hispanic|American|Brazilian|Italian|French|German|British|Spanish|Russian|Japanese)\b/gi, '')
    .replace(/\bwith\s+(gray|grey|blonde|brunette|dark|light|curly|straight|short|long)\s+hair\b/gi, '')
    .replace(/\bwith\s+(short|long|full|thick|trimmed|neat)\s+beard\b/gi, '')
    .replace(/\b(thoughtful|pensive|contemplative|melancholic|cheerful|stern|stoic)\b/gi, '')
    .replace(/(\[FICTIONAL MODEL\]\s*){2,}/g, '[FICTIONAL MODEL] ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function buildShieldPrompt(styleFeatures: StyleFeatures, originalPrompt?: string): string {
  const isPainting = styleFeatures.medium && (
    styleFeatures.medium.includes('paint') ||
    styleFeatures.medium.includes('illustr') ||
    styleFeatures.medium.includes('digital art') ||
    styleFeatures.medium.includes('concept art') ||
    styleFeatures.medium.includes('anime') ||
    styleFeatures.medium.includes('watercolor')
  );

  const qualityBlock = isPainting
    ? `[Qualidade] Resolução de galeria. Pinceladas e texturas de pintura preservadas. 8K. Riqueza cromática fiel ao original. Negativo: CGI, render 3D, pele plástica, super-retocado, borrado.`
    : `[Qualidade] Fotorrealismo cinemático — lente cine f/1.8, aberração cromática, poros na pele visíveis, micro-pelos, textura de tecido e desgaste realista de materiais, HDR, sem filtro de beleza. Negativo: pele plástica, CGI, pele super-lisa, filtro de beleza, olhos de vidro, render 3D genérico.`;

  if (originalPrompt) {
    const cleanedScene = stripPersonDescriptors(cleanMJFlags(originalPrompt));
    return [
      `[MISSÃO — CLONE CINEMÁTICO] A imagem de referência está visível acima. Clone-a com precisão cinemática. Substitua SOMENTE a pessoa por um modelo virtual fictício, comercialmente atraente e não rastreável. NADA mais muda: roupa, cores, materiais, texturas, logos, pose, mãos, objetos, fundo, iluminação, temperatura de cor, enquadramento, ângulo de câmera.`,
      `[Protagonista] Modelo virtual fictício, feições universais e comercialmente atraentes, não rastreável.`,
      `[Cena — baseada no prompt original da criação]\n${cleanedScene}`,
      `[Iluminação — CRÍTICO] ${styleFeatures.lightingExact || styleFeatures.lighting || 'iluminação de estúdio cinemática'}. Preservar temperatura de cor, direção, intensidade e padrão de sombras exatamente como na referência.`,
      qualityBlock,
      `[Mood] ${styleFeatures.mood || 'editorial, confiante'}.`,
    ].filter(Boolean).join('\n');
  }

  return [
    `[MISSÃO — CLONE COM TROCA DE ROSTO] A imagem de referência está visível acima. Clone-a com precisão forense: mesma pose, mesmo enquadramento, mesmo ângulo de câmera, mesmo fundo, mesma iluminação (temperatura de cor, direção e intensidade idênticas), mesmo vestuário com todas as cores e texturas exatas. Substitua SOMENTE o rosto e identidade da pessoa por um modelo virtual fictício, comercialmente atraente e não rastreável. NADA mais muda.`,
    `[Protagonista] Modelo virtual fictício, feições universais e comerciais, olhar cativante, identidade visual única e não rastreável.`,
    `[Meio Artístico — CRÍTICO] ${styleFeatures.medium || 'photorealistic editorial photography'}. Replicar exatamente este meio artístico. NÃO substituir por render 3D fotorrealista se o original for uma pintura. NÃO substituir por fotografia se o original for uma pintura ou ilustração.`,
    `[Câmera] ${styleFeatures.cameraAngle || 'eye-level, 50mm prime'}. Preservar EXATAMENTE: distância de framing, ângulo vertical (se eye-level na referência → eye-level no output, NÃO contre-plongée), rotação e crop. NÃO reinterpretar o ângulo.`,
    `[Pose e Mãos] ${styleFeatures.bodyDynamics || 'natural, relaxed confidence'}${styleFeatures.poseHandsDetail ? `. ${styleFeatures.poseHandsDetail}` : ''}. NÃO reinterpretar a pose — clonar estruturalmente.`,
    `[Cenário] ${styleFeatures.scenarioStyling || styleFeatures.environment || 'studio profissional, backdrop neutro'}.`,
    `[Iluminação — CRÍTICO] ${styleFeatures.lightingExact || styleFeatures.lighting || 'soft studio lighting'}. Preservar exatamente: temperatura de cor, direção, intensidade e padrão de sombras. NÃO substituir por iluminação de estúdio genérica. NÃO neutralizar tons quentes ou frios. NÃO aumentar saturação de cores. NÃO adicionar halos ou blooms extras. Manter relação key/fill/rim exatamente como na referência.`,
    `[Vestuário] ${styleFeatures.outfitDescription}. Cores: ${styleFeatures.colors.join(', ') || 'neutro'}.`,
    styleFeatures.textureDetails
      ? `[Texturas e Materiais] ${styleFeatures.textureDetails}. Preservar todos os detalhes de tecido, acabamentos de hardware e superfícies.`
      : '',
    styleFeatures.magicalElements
      ? `[Elementos Mágicos/Atmosféricos] ${styleFeatures.magicalElements}. PRESERVAR todos os efeitos de brilho, luminescência e magia exatamente como descrito.`
      : '',
    `[Framing] Proporção vertical 9:16 exata, enquadramento editorial otimizado para formato stories mobile.`,
    qualityBlock,
    `[Mood] ${styleFeatures.mood || 'editorial, confident'}.`,
  ].filter(Boolean).join('\n');
}
