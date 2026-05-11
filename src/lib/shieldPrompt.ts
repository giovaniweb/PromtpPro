import type { StyleFeatures } from './gemini';

/**
 * Constrói o "shield prompt" a partir das features extraídas do estilo de referência.
 * Usado pelo Copyright Shield para recriar a imagem sem o sujeito original.
 */
export function buildShieldPrompt(styleFeatures: StyleFeatures): string {
  const isPainting = styleFeatures.medium && (
    styleFeatures.medium.includes('paint') ||
    styleFeatures.medium.includes('illustr') ||
    styleFeatures.medium.includes('digital art') ||
    styleFeatures.medium.includes('concept art') ||
    styleFeatures.medium.includes('anime') ||
    styleFeatures.medium.includes('watercolor')
  );

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
    isPainting
      ? `[Qualidade] Resolução de galeria. Pinceladas e texturas de pintura preservadas. 8K. Riqueza cromática fiel ao original. Negativo: CGI, render 3D, pele plástica, super-retocado, borrado.`
      : `[Qualidade] Fotorrealismo puro — fotografia de câmera real, NÃO render CGI. f/2, 85mm portrait prime, profundidade de campo rasa, detalhe de pele macro (poros visíveis, textura natural com imperfeições sutis), fios de cabelo realistas individuais, HDR, sem suavização de pele, sem filtro de beleza. 8K. Negativo: pele plástica, CGI, pele super-lisa, filtro de beleza, super-retocado, olhos de vidro, rosto distorcido, baixo detalhe, borrado, render 3D genérico.`,
    `[Mood] ${styleFeatures.mood || 'editorial, confident'}.`,
  ].filter(Boolean).join('\n');
}
