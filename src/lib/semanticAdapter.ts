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
        body_dynamics: string;
        pose_hands_detail: string;
        body_type: string;
      };
    };
    camera_framing: string;
    environment: string;
    scenario_styling: string;
    lighting_mood: string;
    lighting_exact: string;
    texture_details: string;
    visual_signature: string;
    mood: string;
    medium: string;
    magical_elements: string;
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
    `A high-resolution face identity source of the specific person provided in the identity_reference_image.`,
    identity.hairStyle ? `Hair color/type: ${identity.hairStyle}` : '',
    identity.skinTone  ? `Skin tone: ${identity.skinTone}` : '',
    ``,
    `=== MEDIUM & ARTISTIC STYLE — CRITICAL ===`,
    style.medium ? `Render medium: ${style.medium}` : `Render medium: photorealistic editorial photography`,
    `REPLICATE this exact artistic medium. Do NOT substitute with photorealistic 3D rendering.`,
    `Do NOT output a photograph if the reference is a painting. Do NOT output a painting if the reference is a photograph.`,
    ``,
    `=== CAMERA & FRAMING ===`,
    style.cameraAngle  ? `Shot type: ${style.cameraAngle}` : '',
    `PRESERVE this exact framing. Do NOT reinterpret framing distance or vertical angle.`,
    ``,
    `=== CLOTHING (adapted for ${targetGender === 'male' ? 'Male' : 'Female'}) ===`,
    `Outfit: ${outfitFinal}`,
    transmutedFootwear ? `Footwear: ${transmutedFootwear}` : '',
    colorsStr          ? `Color palette: ${colorsStr}` : '',
    genderMismatch     ? `Adaptation: ${adaptationLogic}` : '',
    ``,
    `=== BODY & POSE ===`,
    style.pose            ? `Orientation: ${style.pose}` : '',
    style.bodyDynamics    ? `Body dynamics: ${style.bodyDynamics}` : '',
    style.poseHandsDetail ? `Hands & arms detail: ${style.poseHandsDetail}` : '',
    identity.bodyType     ? `Subject build: ${identity.bodyType}` : '',
    `CLONE this exact pose and body dynamics. Do NOT change body orientation, axis tilt, or limb placement.`,
    ``,
    `=== SCENE & ENVIRONMENT ===`,
    style.environment     ? `Location: ${style.environment}` : '',
    style.scenarioStyling ? `Set details: ${style.scenarioStyling}` : '',
    style.aesthetic       ? `Aesthetic: ${style.aesthetic}` : '',
    style.mood            ? `Mood: ${style.mood}` : '',
    ``,
    `=== LIGHTING — CRITICAL ===`,
    style.lightingExact
      ? `Lighting fingerprint: ${style.lightingExact}`
      : style.lighting ? `Lighting: ${style.lighting}` : '',
    `PRESERVE this lighting exactly. Replicate color temperature, direction, intensity, and shadow pattern.`,
    `DO NOT substitute generic studio lighting. DO NOT neutralize warm/cool tones.`,
    ``,
    style.textureDetails ? `=== TEXTURE & MATERIALS ===` : '',
    style.textureDetails ? `Material inventory: ${style.textureDetails}` : '',
    style.textureDetails ? `PRESERVE all fabric weaves, hardware finishes, and surface details listed above.` : '',
    style.textureDetails ? `` : '',
    style.magicalElements ? `=== MAGICAL & ATMOSPHERIC ELEMENTS ===` : '',
    style.magicalElements ? `Visual effects: ${style.magicalElements}` : '',
    style.magicalElements ? `PRESERVE all glowing, luminescent, and magical effects exactly as described.` : '',
    style.magicalElements ? `` : '',
    `=== TECHNICAL ===`,
    style.medium ? `Render in the EXACT medium: ${style.medium}.` : `Photorealistic editorial photography.`,
    `${targetGender === 'male' ? 'Male' : 'Female'} subject.`,
    `CRITICAL: Face identity is paramount. Use the provided identity_reference_image facial geometry and features ONLY. Do NOT reproduce, blend, or borrow any facial features from the style reference person.`,
    `The style reference is exclusively for: clothing, pose, body dynamics, environment, lighting, texture detail, and artistic medium.`,
    `DO NOT reinterpret the pose — clone it structurally.`,
    `DO NOT reinterpret the camera angle — match framing distance and vertical angle exactly.`,
    `DO NOT neutralize or replace the lighting — preserve its color temperature, direction, and intensity.`,
    `DO NOT simplify materials or textures — reproduce surface detail at the level described above.`,
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
          body_dynamics: style.bodyDynamics,
          pose_hands_detail: style.poseHandsDetail,
          body_type: identity.bodyType,
        },
      },
      camera_framing:   style.cameraAngle,
      environment:      style.environment,
      scenario_styling: style.scenarioStyling,
      lighting_mood:    style.lighting,
      lighting_exact:   style.lightingExact,
      texture_details:  style.textureDetails,
      visual_signature: style.aesthetic,
      mood:             style.mood,
      medium:           style.medium,
      magical_elements: style.magicalElements,
    },
    technical_overrides: {
      force_face_consistency: true,
      preserve_identity_weight: 1.0,
      style_transfer_weight: 1.0,
    },
    fusionPrompt,
  };
}
