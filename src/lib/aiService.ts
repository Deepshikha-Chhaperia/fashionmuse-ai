import {
  PROMPTS,
  DEFAULT_PRESENTATION,
  HERO_RULE,
  USE_CONFIG,
  type GenerationMode,
  type Use,
} from './prompts';

export interface GenerationOptions {
  mode: GenerationMode;
  images: string[];
  numImages?: 1 | 2 | 3 | 4 | 5;
  variationIndex?: number;
  application?: Use;
  showOnModelOrRoom?: boolean;
  targetBuyers?: string;
  complexityLevel?: 'simple' | 'moderate' | 'intricate' | 'ultra-complex';
  materialCount?: number;
  patternType?: 'all-over' | 'half-drop' | 'diamond-lattice' | 'directional-flow' | 'border-trim';
  customInstructions?: string;
  onDesignGenerated?: (design: GeneratedDesign) => void;
}

export interface GeneratedDesign {
  id: string;
  image: string;
  title: string;
  timestamp: string;
  mode: GenerationMode;
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

const TARGET_BUYERS_MAP: Record<string, string> = {
  europe: 'Europe: muted tonal palette, clean composition, restrained density.',
  us: 'United States: bold high-sparkle statement look, strong contrast.',
  'middle-east': 'Middle East: rich gold tones, dense opulent coverage, bridal-ready.',
};

export const MODE_LABELS: Record<GenerationMode, string> = {
  variations: 'Variation',
  'new-ip': 'Original Concept',
  material: 'Material Design',
  'statement-piece': 'Hero Piece',
  pattern: 'Pattern',
};

const compressImage = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1024;
      let { width: w, height: h } = img;
      if (w > max || h > max) {
        if (w > h) { h = Math.round((h * max) / w); w = max; }
        else { w = Math.round((w * max) / h); h = max; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

export const buildPrompt = (mode: GenerationMode, opts: GenerationOptions) => {
  const use: Use = opts.application || 'garment';
  const baseFabric = use === 'furnishing'
    ? 'heavy linen furnishing fabric, motif scaled for a cushion cover or curtain panel'
    : 'silk organza garment fabric';

  let prompt = PROMPTS[mode];

  if (mode === 'statement-piece') {
    prompt = prompt.replace('{{MATERIAL_COUNT}}', opts.materialCount ? String(opts.materialCount) : '6');
  }

  if (mode === 'pattern') {
    const isBorder = opts.patternType === 'border-trim';
    const patternBlock = isBorder
      ? 'Design one continuous hand-embroidery border, 3-8 cm wide, for necklines, cuffs, hemlines, dupatta and veil edges. Show at least 3 repeats in a row so the connection between repeats is clearly visible. Even rhythm, delicate small-scale materials, works on straight and gently curved edges.'
      : 'Design one seamless repeating hand-embroidery pattern for fabric sold by the meter. The pattern must tile perfectly in both directions. Show a 2x2 tile so the repeat is clearly visible. Each repeat unit: 3-8 small motifs, 30-50% empty fabric, even density so craftsmen can produce it at scale.';
    prompt = prompt.replace('{{PATTERN_BLOCK}}', patternBlock);
  }

  const presentation = opts.showOnModelOrRoom
    ? USE_CONFIG[use].presentation
    : DEFAULT_PRESENTATION.replace('{{BASE_FABRIC}}', baseFabric);

  const buyerText = opts.targetBuyers ? (TARGET_BUYERS_MAP[opts.targetBuyers] || opts.targetBuyers) : TARGET_BUYERS_MAP.europe;

  const hasClientDirection = Boolean(opts.customInstructions?.trim());

  const variationFocus =
    mode === 'variations' &&
    typeof opts.variationIndex === 'number' &&
    (opts.numImages || 1) >= 2
      ? getVariationFocus(opts.variationIndex, opts.numImages || 1)
      : '';

  const parts = [
    prompt,
    variationFocus,
    presentation,
    opts.showOnModelOrRoom && !hasClientDirection ? HERO_RULE : '',
    mode === 'pattern' && opts.patternType && opts.patternType !== 'border-trim' ? PATTERN_MAP[opts.patternType] : '',
    COMPLEXITY_MAP[opts.complexityLevel || 'intricate'],
    `Target buyers: ${buyerText}`,
    hasClientDirection ? `Client direction: ${opts.customInstructions!.trim()}` : '',
    hasClientDirection ? 'If the client direction says how to show the design, follow it over the presentation above.' : '',
    hasClientDirection ? HERO_RULE : '',
  ].filter(Boolean);

  return parts.join('\n\n');
};

export const VARIATION_FOCUSES = [
  "Variation focus: Layout — explore an entirely different shape and arrangement for the motif.",
  "Variation focus: Elements — introduce different flower or motif element types and details.",
  "Variation focus: Colour — use a fresh colour mix and tonal rebalancing while keeping the core materials.",
  "Variation focus: Silhouette and scale — shift between clustered focal points and airy trailing lines.",
  "Variation focus: Elements and relief — vary the dimensional structural elements and beadwork fills.",
];

export const getVariationFocus = (index: number, total: number): string => {
  if (total < 2) return '';
  return VARIATION_FOCUSES[index % VARIATION_FOCUSES.length];
};

export const VARIATIONS_REFERENCE_PREFIX =
  "The following images are a craft and technique reference only. Create a new original motif made with the same craft and materials, with a different layout, different element types, and a new colour mix.";

export const buildContentParts = (
  mode: GenerationMode,
  compressedImages: string[],
  finalText: string
) => [
  ...(mode === 'variations' ? [{ text: VARIATIONS_REFERENCE_PREFIX }] : []),
  ...compressedImages.map((img) => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: img.includes(',') ? img.split(',')[1] : img,
    },
  })),
  { text: finalText },
];

export async function generateDesigns(
  options: GenerationOptions
): Promise<{ designs: GeneratedDesign[] }> {
  const { mode, images, numImages = 2, onDesignGenerated } = options;
  const compressedImages = await Promise.all(images.slice(0, 10).map(compressImage));
  const designs: GeneratedDesign[] = [];

  for (let i = 0; i < numImages; i++) {
    const prompt = buildPrompt(mode, { ...options, variationIndex: i });
    const finalText = `${prompt}\n\nGenerate design ${i + 1} of ${numImages}. Respond with one image only.`;
    const requestBody = {
      contents: [{
        role: 'user',
        parts: buildContentParts(mode, compressedImages, finalText),
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        responseModalities: ['IMAGE'],
      },
    };

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw new Error("Couldn't generate the design. Please try again.");
    }

    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data?: string }; inline_data?: { data?: string } }) => p.inlineData || p.inline_data
    );
    const b64 = part?.inlineData?.data || part?.inline_data?.data;
    if (!b64) throw new Error("Couldn't generate the design. Please try again.");

    const design: GeneratedDesign = {
      id: `design-${Date.now()}-${i}`,
      image: `data:image/png;base64,${b64}`,
      title: `${MODE_LABELS[mode]} ${i + 1}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    };

    designs.push(design);
    onDesignGenerated?.(design);

    if (i < numImages - 1) await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return { designs };
}
