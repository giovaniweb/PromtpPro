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
    .replace(/\b(male|female|man|woman|boy|girl|person|writer|photographer|athlete|CEO|executive|journalist|director|actor|actress)\b/gi, 'an anonymous adult')
    .replace(/\b(European|Asian|African|Latino|Hispanic|American|Brazilian|Italian|French|German|British|Spanish|Russian|Japanese)\b/gi, '')
    .replace(/\bwith\s+(gray|grey|blonde|brunette|dark|light|curly|straight|short|long)\s+hair\b/gi, '')
    .replace(/\bwith\s+(short|long|full|thick|trimmed|neat)\s+beard\b/gi, '')
    .replace(/\b(thoughtful|pensive|contemplative|melancholic|cheerful|stern|stoic)\b/gi, '')
    .replace(/(an anonymous adult\s*){2,}/g, 'an anonymous adult ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function buildShieldPrompt(styleFeatures: StyleFeatures, originalPrompt?: string): string {
  const isPhoto = styleFeatures.mediumType === 'photograph' ||
    (!styleFeatures.mediumType && !(
      styleFeatures.medium?.includes('paint') ||
      styleFeatures.medium?.includes('illustr') ||
      styleFeatures.medium?.includes('digital art') ||
      styleFeatures.medium?.includes('concept art') ||
      styleFeatures.medium?.includes('anime') ||
      styleFeatures.medium?.includes('watercolor')
    ));

  const qualitySpec = isPhoto
    ? {
        format: 'unedited photograph, raw camera output',
        camera_body: 'real cine camera (RED Komodo / ARRI Alexa / Sony FX6)',
        lens: '35mm or 50mm prime, f/1.8 or f/2',
        skin_texture_requirement: 'visible pores at 100% zoom, micro-hairs on face and arms, subtle skin oil sheen, mild redness on nose/ears/knuckles, NO smoothing, NO frequency separation, NO beauty filter',
        fabric_requirement: 'visible weave texture, real wrinkles, slight wear and pilling where appropriate',
        lighting_requirement: 'real bounce light with environmental color contamination — NOT studio-perfect',
        imperfections_welcome: ['slight chromatic aberration on highlight edges', 'mild film grain', 'asymmetric facial features', 'irregular small catchlight in eyes'],
        color_grading: 'slightly desaturated and naturally graded — NOT oversaturated AI look',
        resolution: '8K detail but documentary aesthetic — NOT glamour, NOT magazine cover',
        negative: ['plastic skin', 'CGI render', '3D illustration', 'over-smoothed skin', 'glass eyes', 'beauty filter', 'over-retouched', 'celebrity face', 'magazine cover model', 'AI-generated look', 'default AI face', 'perfect symmetry', 'frequency-separated skin', 'Instagram filter', 'render artifacts']
      }
    : {
        format: styleFeatures.mediumType || 'digital painting',
        preserve: 'all painterly brushstrokes, color layering, medium texture from the reference',
        resolution: '8K gallery quality',
        negative: ['CGI render', 'photorealistic substitution', 'plastic skin', 'over-retouched', 'blurry']
      };

  const cleanedScene = originalPrompt ? stripPersonDescriptors(cleanMJFlags(originalPrompt)) : '';

  const spec = {
    task: 'clone_scene_replace_subject',
    instruction: 'The reference image is visible above. Reproduce it with cinematic forensic fidelity. The ONLY change: replace the human subject with an anonymous, unremarkable everyday adult. Every other element — composition, clothing, colors, pose, hands, props, background, lighting, camera angle, framing — must be IDENTICAL to the reference.',
    preserve_from_reference: {
      composition: 'exact — do not reframe, do not crop differently',
      pose: styleFeatures.bodyDynamics || 'exact as shown in reference',
      pose_hands_detail: styleFeatures.poseHandsDetail || 'preserve exactly as in reference',
      clothing: styleFeatures.outfitDescription,
      colors: styleFeatures.colors,
      footwear: styleFeatures.footwear,
      accessories: styleFeatures.accessories,
      background: styleFeatures.scenarioStyling || styleFeatures.environment,
      lighting: styleFeatures.lightingExact || styleFeatures.lighting,
      camera: styleFeatures.cameraAngle || 'eye-level, 50mm prime',
      framing: 'vertical 9:16 editorial mobile-stories format',
      ...(styleFeatures.textureDetails ? { textures: styleFeatures.textureDetails } : {}),
      ...(styleFeatures.magicalElements ? { atmospheric_effects: styleFeatures.magicalElements } : {}),
    },
    subject_replacement: {
      description: 'an ordinary anonymous adult — the kind of unremarkable person you would see on public transit',
      hard_constraints: [
        'NOT a celebrity of any kind',
        'NOT a famous athlete (no Cristiano Ronaldo, no Messi, no LeBron, no Neymar)',
        'NOT a famous actor or actress',
        'NOT a politician or world leader',
        'NOT a social media influencer',
        'NOT a recognizable person from any media',
        'face must be forgettable and generic — not handsome in a model/celebrity way',
        'should look like a stock photo of a random person, not a cover model',
        'preserve approximate age range and ethnicity of the original if it fits the scene'
      ],
      scene_context: cleanedScene || styleFeatures.outfitDescription,
    },
    ...(cleanedScene ? { scene_source_prompt: cleanedScene } : {}),
    medium: styleFeatures.mediumDescription || styleFeatures.medium,
    quality: qualitySpec,
    mood: styleFeatures.mood || 'editorial, composed',
  };

  return [
    '[MISSION] Clone the reference image with forensic cinematic precision. Keep EVERYTHING except the person\'s identity. The new subject must be an anonymous everyday adult — NEVER a celebrity, NEVER a recognizable public figure.',
    '',
    'GENERATION SPEC:',
    JSON.stringify(spec, null, 2),
  ].join('\n');
}
