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
    `[Protagonista] Modelo virtual fictício, feições universais e comerciais, olhar cativante, identidade visual única e não rastreável.`,
    `[Meio Artístico — CRÍTICO] ${styleFeatures.medium || 'photorealistic editorial photography'}. Replicar exatamente este meio artístico. NÃO substituir por render 3D fotorrealista se o original for uma pintura. NÃO substituir por fotografia se o original for uma pintura ou ilustração.`,
    `[Câmera] ${styleFeatures.cameraAngle || 'eye-level, 50mm prime'}. Preservar exatamente este enquadramento — distância de framing e ângulo vertical idênticos.`,
    `[Pose e Mãos] ${styleFeatures.bodyDynamics || 'natural, relaxed confidence'}${styleFeatures.poseHandsDetail ? `. ${styleFeatures.poseHandsDetail}` : ''}. NÃO reinterpretar a pose — clonar estruturalmente.`,
    `[Cenário] ${styleFeatures.scenarioStyling || styleFeatures.environment || 'studio profissional, backdrop neutro'}.`,
    `[Iluminação — CRÍTICO] ${styleFeatures.lightingExact || styleFeatures.lighting || 'soft studio lighting'}. Preservar exatamente: temperatura de cor, direção, intensidade e padrão de sombras. NÃO substituir por iluminação de estúdio genérica. NÃO neutralizar tons quentes ou frios.`,
    `[Vestuário] ${styleFeatures.outfitDescription}. Cores: ${styleFeatures.colors.join(', ') || 'neutro'}.`,
    styleFeatures.textureDetails
      ? `[Texturas e Materiais] ${styleFeatures.textureDetails}. Preservar todos os detalhes de tecido, acabamentos de hardware e superfícies.`
      : '',
    styleFeatures.magicalElements
      ? `[Elementos Mágicos/Atmosféricos] ${styleFeatures.magicalElements}. PRESERVAR todos os efeitos de brilho, luminescência e magia exatamente como descrito.`
      : '',
    `[Framing] Proporção vertical 9:16 exata, enquadramento editorial otimizado para formato stories mobile.`,
    isPainting
      ? `[Qualidade] Resolução de galeria, pinceladas e texturas de pintura preservadas, 8k detalhe, riqueza cromática fiel ao original.`
      : `[Qualidade] f/2.8, nitidez impecável, 8k resolution, ray-traced shadows, comercial de alto padrão.`,
    `[Mood] ${styleFeatures.mood || 'editorial, confident'}.`,
  ].filter(Boolean).join('\n');
}
