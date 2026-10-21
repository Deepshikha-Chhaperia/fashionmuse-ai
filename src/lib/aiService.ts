import { PROMPTS, type GenerationMode } from './prompts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface GenerationOptions {
  mode: GenerationMode;
  images: string[];
  customInstructions?: string;
  numImages?: number; // 1 or 2
  marketStyle?: string;
  complexityLevel?: 'simple' | 'moderate' | 'intricate' | 'ultra-complex';
  includeComplexity?: boolean;
  materialCount?: number;
  patternType?: 'all-over' | 'half-drop' | 'diamond-lattice' | 'directional-flow';
  onDesignGenerated?: (design: GeneratedDesign) => void;
}

export interface GeneratedDesign {
  id: string;
  image: string;
  title: string;
  timestamp: string;
  mode: GenerationMode;
  cost: number;
}

const COMPLEXITY_MAP: Record<string, string> = {
  simple: 'Simple: Clean, minimal composition with 2-3 materials and generous negative space.',
  moderate: 'Moderate: Balanced density with 3-5 materials and sophisticated composition.',
  intricate: 'Intricate: Rich couture detailing with 5-7 materials, multiple layers, and complex beadwork.',
  'ultra-complex': 'Ultra-Complex: Runway maximum luxury with 6-8+ materials and museum-quality detail density.',
};

const PATTERN_MAP: Record<string, string> = {
  'all-over': 'Repeat Structure: Seamless all-over scatter repeat with 30-50% negative space.',
  'half-drop': 'Repeat Structure: Half-drop repeat pattern with fluid vertical offset.',
  'diamond-lattice': 'Repeat Structure: Geometric diamond lattice repeat with anchored nodes.',
  'directional-flow': 'Repeat Structure: Directional one-way repeat maintaining continuous flow.',
};

const MODE_LABELS: Record<GenerationMode, string> = {
  variations: 'Variation',
  'new-ip': 'Original Concept',
  material: 'Material Design',
  custom: 'Custom Concept',
  'dress-reference': 'Couture Motif',
  'statement-piece': 'Statement Piece',
  'by-the-meter': 'By-the-Meter Pattern',
  'border-trim': 'Border & Trim',
};

const buildPrompt = (mode: GenerationMode, opts: GenerationOptions) => {
  let prompt = PROMPTS[mode]
    .replace('{{MARKET_STYLE}}', opts.marketStyle?.trim() || 'Ultra-luxury couture')
    .replace('{{COLOR_CODES}}', 'Harmonious couture palette selected for maximum luxury and depth')
    .replace('{{COMPLEXITY_LEVEL}}', opts.complexityLevel ? opts.complexityLevel.charAt(0).toUpperCase() + opts.complexityLevel.slice(1) : 'Intricate')
    .replace('{{MATERIAL_COUNT}}', opts.materialCount ? String(opts.materialCount) : '6');

  const notes = [
    opts.complexityLevel && opts.includeComplexity !== false ? COMPLEXITY_MAP[opts.complexityLevel] : '',
    mode === 'statement-piece' && opts.materialCount ? `Material Selection: Focus on ${opts.materialCount} harmonious materials.` : '',
    mode === 'by-the-meter' && opts.patternType ? PATTERN_MAP[opts.patternType] : '',
    opts.customInstructions?.trim() ? `Client Specifications: ${opts.customInstructions.trim()}` : '',
  ].filter(Boolean);

  return [prompt, ...notes].join('\n\n');
};

export async function generateDesigns(
  options: GenerationOptions
): Promise<{ designs: GeneratedDesign[]; totalCost: number; provider: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  const { mode, images, numImages = 2, onDesignGenerated } = options;
  const prompt = buildPrompt(mode, options);
  const limitedImages = images.slice(0, 3);
  const designs: GeneratedDesign[] = [];

  for (let i = 0; i < numImages; i++) {
    const requestBody = {
      contents: [{
        parts: [
          ...limitedImages.map((img) => ({
            inline_data: {
              mime_type: img.split(';')[0].replace('data:', '') || 'image/jpeg',
              data: img.split(',')[1],
            },
          })),
          { text: `${prompt}\n\nGenerate design ${i + 1} of ${numImages}. Respond with a photorealistic image only.` },
        ],
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        responseModalities: ['IMAGE'],
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const b64 = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData?.data;
    if (!b64) throw new Error(`Gemini response did not contain image data for design ${i + 1}`);

    const design: GeneratedDesign = {
      id: `gemini-${Date.now()}-${i}`,
      image: `data:image/png;base64,${b64}`,
      title: `${MODE_LABELS[mode]} ${i + 1}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
      cost: 0.03,
    };

    designs.push(design);
    onDesignGenerated?.(design);

    if (i < numImages - 1) await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return { designs, totalCost: designs.reduce((sum, d) => sum + d.cost, 0), provider: 'Gemini Pro' };
}

export const isGeminiConfigured = () => Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== '');
