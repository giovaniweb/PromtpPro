export interface StyleItem {
  id: string;
  title: string;
  room: 'editorial' | 'corporativo' | 'social' | 'artistico' | 'produto';
  tags: string[];
  thumbnail: string;
  prompt_pt: string;
  prompt_en: string;
  aspect_ratio: string;
}

export const styles: StyleItem[] = [
  {
    id: 'editorial-01',
    title: 'Moda Editorial de Luxo',
    room: 'editorial',
    tags: ['moda', 'luxo', 'editorial'],
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    aspect_ratio: '2:3',
    prompt_pt: '[Sujeito] Modelo feminina vestindo roupa de alta costura, com expressão confiante e postura elegante. [Ação] Posando com as mãos na cintura, queixo levemente elevado, olhar direto para a câmera. [Cenário] Estúdio profissional com fundo infinito branco puro. [Composição] Corpo inteiro centralizado, regra dos terços, espaço negativo generoso. [Iluminação] Key light de softbox grande à esquerda a 45 graus, fill sutil à direita, rim light separando o sujeito do fundo. [Estética] Fotografia editorial de alta moda, cores naturais com contraste médio, pele retocada mas natural. [Câmera] Lente 85mm portrait f1.8, profundidade de campo rasa com bokeh suave.',
    prompt_en: '[Subject] Female model wearing haute couture, confident expression and elegant posture. [Action] Posing with hands on waist, chin slightly raised, direct gaze at camera. [Setting] Professional studio with pure white seamless backdrop. [Composition] Full body centered, rule of thirds, generous negative space. [Lighting] Large softbox key light at 45 degrees left, subtle fill right, rim light separating subject from background. [Aesthetic] High fashion editorial photography, natural colors with medium contrast, retouched but natural skin. [Camera] 85mm portrait lens f1.8, shallow depth of field with soft bokeh.',
  },
  {
    id: 'editorial-02',
    title: 'Retrato Beauty Close-up',
    room: 'editorial',
    tags: ['beauty', 'close-up', 'maquiagem'],
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop',
    aspect_ratio: '4:5',
    prompt_pt: '[Sujeito] Rosto feminino com maquiagem editorial impecável, pele perfeita e lábios marcantes. [Ação] Olhar penetrante direto para a câmera, expressão serena e poderosa. [Cenário] Fundo neutro degradê cinza suave. [Composição] Close-up extremo do rosto, enquadramento de ombros para cima. [Iluminação] Beauty dish frontal com difusor, dois pontos de luz laterais para contorno facial. [Estética] Fotografia beauty de revista, alta definição em cada detalhe da pele e maquiagem. [Câmera] Lente macro 100mm f2.8, foco preciso nos olhos.',
    prompt_en: '[Subject] Female face with flawless editorial makeup, perfect skin and striking lips. [Action] Penetrating gaze directly at camera, serene and powerful expression. [Setting] Neutral soft grey gradient background. [Composition] Extreme face close-up, shoulders-up framing. [Lighting] Frontal beauty dish with diffuser, two lateral lights for facial contouring. [Aesthetic] Magazine beauty photography, high definition in every skin and makeup detail. [Camera] 100mm macro lens f2.8, precise focus on eyes.',
  },
  {
    id: 'editorial-03',
    title: 'Ensaio Minimalista',
    room: 'editorial',
    tags: ['minimalista', 'clean', 'ensaio'],
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=700&fit=crop',
    aspect_ratio: '4:7',
    prompt_pt: '[Sujeito] Modelo em roupa monocromática minimalista, linhas limpas e silhueta definida. [Ação] Pose natural e relaxada, mãos ao lado do corpo, leve inclinação da cabeça. [Cenário] Ambiente todo branco com sombras suaves e geométricas. [Composição] Corpo inteiro com muito espaço negativo, assimetria intencional. [Iluminação] Luz natural difusa vinda de janela lateral grande, sem flash. [Estética] Minimalismo escandinavo, tons neutros, textura sutil nos tecidos. [Câmera] Lente 50mm f2.0, exposição levemente alta para manter o tom etéreo.',
    prompt_en: '[Subject] Model in monochromatic minimalist clothing, clean lines and defined silhouette. [Action] Natural relaxed pose, hands at sides, slight head tilt. [Setting] All-white environment with soft geometric shadows. [Composition] Full body with generous negative space, intentional asymmetry. [Lighting] Diffused natural light from large side window, no flash. [Aesthetic] Scandinavian minimalism, neutral tones, subtle fabric texture. [Camera] 50mm lens f2.0, slightly high exposure to maintain ethereal tone.',
  },
  {
    id: 'editorial-04',
    title: 'Fashion Street',
    room: 'editorial',
    tags: ['street', 'urbano', 'fashion'],
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    aspect_ratio: '2:3',
    prompt_pt: '[Sujeito] Modelo urbano com look streetwear contemporâneo, atitude confiante. [Ação] Caminhando em direção à câmera com passos decididos, mãos nos bolsos. [Cenário] Rua urbana com grafites e arquitetura industrial ao fundo desfocado. [Composição] Plano americano, modelo no terço esquerdo, linha da rua guiando o olhar. [Iluminação] Golden hour com luz lateral quente, sombras longas no chão. [Estética] Street photography editorial, cores vibrantes com tom quente. [Câmera] Lente 35mm f1.4, foco rápido para capturar movimento.',
    prompt_en: '[Subject] Urban model with contemporary streetwear look, confident attitude. [Action] Walking towards camera with decisive steps, hands in pockets. [Setting] Urban street with graffiti and industrial architecture in blurred background. [Composition] American shot, model on left third, street line guiding the eye. [Lighting] Golden hour with warm side light, long shadows on ground. [Aesthetic] Editorial street photography, vibrant colors with warm tone. [Camera] 35mm lens f1.4, fast focus to capture movement.',
  },
  {
    id: 'editorial-05',
    title: 'Retrato Artístico P&B',
    room: 'editorial',
    tags: ['preto-e-branco', 'artístico', 'retrato'],
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
    aspect_ratio: '4:5',
    prompt_pt: '[Sujeito] Retrato masculino com expressão introspectiva, traços faciais marcantes e textura de pele visível. [Ação] Olhar desviado para o lado, mão tocando levemente o queixo. [Cenário] Fundo completamente escuro, sem elementos distrativos. [Composição] Busto centralizado, corte justo acima da cabeça, simetria forte. [Iluminação] Rembrandt lighting com único ponto de luz a 45 graus, triângulo de luz na bochecha oposta. [Estética] Preto e branco de alto contraste, grão de filme analógico. [Câmera] Lente 85mm f1.4, abertura ampla para separar sujeito do fundo escuro.',
    prompt_en: '[Subject] Male portrait with introspective expression, striking facial features and visible skin texture. [Action] Gaze averted to the side, hand lightly touching chin. [Setting] Completely dark background, no distracting elements. [Composition] Centered bust, tight crop above head, strong symmetry. [Lighting] Rembrandt lighting with single light point at 45 degrees, light triangle on opposite cheek. [Aesthetic] High contrast black and white, analog film grain. [Camera] 85mm lens f1.4, wide aperture to separate subject from dark background.',
  },
];
