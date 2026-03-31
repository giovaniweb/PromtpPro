import { IdentityFeatures, StyleFeatures } from './gemini';

// Regras de transmutação de roupas femininas → masculinas
// Preserva cor e material, adapta silhueta e peça
const TRANSMUTATION_MAP: Array<[RegExp, string]> = [
  [/cropped hoodie/gi,       'oversized hoodie'],
  [/cropped\b/gi,            'oversized'],
  [/crop top/gi,             'fitted t-shirt'],
  [/blusa curta/gi,          'camiseta'],
  [/saia midi/gi,            'calça chino'],
  [/saia mini/gi,            'shorts masculino'],
  [/saia\b/gi,               'calça jogger'],
  [/vestido longo/gi,        'conjunto streetwear calça+casaco'],
  [/vestido\b/gi,            'conjunto calça e camisa'],
  [/macacão/gi,              'macacão masculino'],
  [/legging/gi,              'calça de moletom slim'],
  [/salto alto/gi,           'tênis premium cano alto'],
  [/scarpin/gi,              'tênis chunky'],
  [/bota de salto/gi,        'bota masculina cano médio'],
  [/ankle boot.*salto/gi,    'bota masculina cano baixo'],
  [/sandalia de salto/gi,    'tênis de couro'],
  [/sandalia/gi,             'sandália slide masculina'],
  [/clutch/gi,               'pochete masculina'],
  [/bolsa de mão/gi,         'mochila compacta'],
  [/bolsa\b/gi,              'mochila urbana'],
];

function transmuteText(text: string, targetGender: 'male' | 'female'): string {
  if (targetGender !== 'male' || !text) return text;
  let result = text;
  for (const [pattern, replacement] of TRANSMUTATION_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export interface FusionPayload {
  project_metadata: {
    workflow: string;
    target_gender: string;
    gender_mismatch_detected: boolean;
    adaptation_applied: boolean;
  };
  creative_direction: {
    identity: {
      facial_identity_fidelity: number;
      description: string;
      facialFeatures: string;
      skinTone: string;
      hairStyle: string;
    };
    visual_attributes: {
      apparel: {
        outfit: string;
        footwear: string;
        colors: string;
        gender_adaptation_logic: string;
      };
      pose: {
        description: string;
        body_type: string;
      };
    };
    environment: string;
    lighting_mood: string;
    visual_signature: string;
    mood: string;
  };
  technical_overrides: {
    force_face_consistency: boolean;
    preserve_identity_weight: number;
    style_transfer_weight: number;
  };
  fusionPrompt: string;
}

export function adaptPayload(identity: IdentityFeatures, style: StyleFeatures): FusionPayload {
  const targetGender = identity.gender !== 'unknown' ? identity.gender : 'male';
  const genderMismatch =
    style.referenceGender !== 'unknown' && style.referenceGender !== targetGender;

  const originalItems = style.outfitItems;
  const transmutedItems = originalItems.map(item => transmuteText(item, targetGender));
  const transmutedFootwear = transmuteText(style.footwear, targetGender);
  const transmutedOutfitDesc = transmuteText(style.outfitDescription, targetGender);

  const adaptationLogic = genderMismatch
    ? `Gender mismatch detected (reference: ${style.referenceGender} → target: ${targetGender}). ` +
      `Adapted items: ${originalItems.map((o, i) => `"${o}" → "${transmutedItems[i]}"`).filter((_, i) => originalItems[i] !== transmutedItems[i]).join('; ') || 'silhouette adjusted'}.`
    : `No gender adaptation needed (reference and target are both ${targetGender}).`;

  const colorsStr = style.colors.join(', ');
  const outfitFinal = transmutedItems.length > 0
    ? `${transmutedItems.join(', ')}${colorsStr ? ` in ${colorsStr}` : ''}`
    : transmutedOutfitDesc;

  const fusionPrompt = [
    `=== IDENTITY SOURCE (preserve face exactly — fidelity 1.0) ===`,
    `A high-resolution, photorealistic face identity source of the specific person provided in the identity_reference_image.`,
    identity.hairStyle ? `Hair color/type: ${identity.hairStyle}` : '',
    identity.skinTone  ? `Skin tone: ${identity.skinTone}` : '',
    ``,
    `=== CLOTHING (adapted for ${targetGender === 'male' ? 'Male' : 'Female'}) ===`,
    `Outfit: ${outfitFinal}`,
    transmutedFootwear ? `Footwear: ${transmutedFootwear}` : '',
    colorsStr          ? `Color palette: ${colorsStr}` : '',
    genderMismatch     ? `Adaptation: ${adaptationLogic}` : '',
    ``,
    `=== SCENE ===`,
    style.pose        ? `Pose: ${style.pose}` : '',
    style.environment ? `Environment: ${style.environment}` : '',
    style.lighting    ? `Lighting: ${style.lighting}` : '',
    style.aesthetic   ? `Aesthetic: ${style.aesthetic}` : '',
    style.mood        ? `Mood: ${style.mood}` : '',
    ``,
    `=== TECHNICAL ===`,
    `Photorealistic editorial photography. ${targetGender === 'male' ? 'Male' : 'Female'} subject.`,
    `CRITICAL: Face identity is paramount. Use the provided identity_reference_image facial geometry and features ONLY. Do NOT reproduce, blend, or borrow any facial features from the style reference person.`,
    `The style reference is exclusively for: clothing, pose, environment, lighting, and color palette.`,
    genderMismatch ? `Gender-adapt the clothing while preserving the original colors and materials.` : '',
  ].filter(Boolean).join('\n');

  return {
    project_metadata: {
      workflow: 'Identity Fusion with Genderized Adaptation',
      target_gender: targetGender === 'male' ? 'Male' : 'Female',
      gender_mismatch_detected: genderMismatch,
      adaptation_applied: genderMismatch && transmutedItems.some((t, i) => t !== originalItems[i]),
    },
    creative_direction: {
      identity: {
        facial_identity_fidelity: 1.0,
        description: identity.description,
        facialFeatures: identity.facialFeatures,
        skinTone: identity.skinTone,
        hairStyle: identity.hairStyle,
      },
      visual_attributes: {
        apparel: {
          outfit: outfitFinal,
          footwear: transmutedFootwear || style.footwear,
          colors: colorsStr,
          gender_adaptation_logic: adaptationLogic,
        },
        pose: {
          description: style.pose,
          body_type: identity.bodyType,
        },
      },
      environment: style.environment,
      lighting_mood: style.lighting,
      visual_signature: style.aesthetic,
      mood: style.mood,
    },
    technical_overrides: {
      force_face_consistency: true,
      preserve_identity_weight: 1.0,
      style_transfer_weight: 1.0,
    },
    fusionPrompt,
  };
}
