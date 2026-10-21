import { PROMPTS, type GenerationMode } from './prompts';

export interface GenerationOptions {
  mode: GenerationMode;
  images: string[];
  numImages?: 1 | 2 | 3 | 4 | 5;
  application?: 'garment' | 'furnishing';
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

const MODE_LABELS: Record<GenerationMode, string> = {
  variations: 'Variation',
  'new-ip': 'Original Concept',
  material: 'Material Design',
  'statement-piece': 'Statement Piece',
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

const buildPrompt = (mode: GenerationMode, opts: GenerationOptions) => {
  const baseFabric = opts.application === 'furnishing'
    ? 'heavy linen furnishing fabric, motif scaled for a cushion cover or curtain panel'
    : 'silk organza garment fabric';

  let prompt = PROMPTS[mode].replace('{{BASE_FABRIC}}', baseFabric);

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

  const buyerText = opts.targetBuyers ? (TARGET_BUYERS_MAP[opts.targetBuyers] || opts.targetBuyers) : TARGET_BUYERS_MAP.europe;

  const notes = [
    mode === 'pattern' && opts.patternType && opts.patternType !== 'border-trim' ? PATTERN_MAP[opts.patternType] : '',
    COMPLEXITY_MAP[opts.complexityLevel || 'intricate'],
    `Target buyers: ${buyerText}`,
    opts.customInstructions?.trim() ? `Client Specifications: ${opts.customInstructions.trim()}` : '',
  ].filter(Boolean);

  return [prompt, ...notes].join('\n\n');
};

export async function generateDesigns(
  options: GenerationOptions
): Promise<{ designs: GeneratedDesign[] }> {
  const { mode, images, numImages = 2, onDesignGenerated } = options;
  const prompt = buildPrompt(mode, options);
  const compressedImages = await Promise.all(images.slice(0, 10).map(compressImage));
  const designs: GeneratedDesign[] = [];

  for (let i = 0; i < numImages; i++) {
    const requestBody = {
      contents: [{
        parts: [
          ...compressedImages.map((img) => ({
            inline_data: {
              mime_type: 'image/jpeg',
              data: img.split(',')[1],
            },
          })),
          { text: `${prompt}\n\nGenerate design ${i + 1} of ${numImages}. Respond with a photorealistic image only.` },
        ],
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
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const b64 = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData?.data;
    if (!b64) throw new Error(`Response did not contain image data for design ${i + 1}`);

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
