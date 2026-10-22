export const DEFAULT_PRESENTATION =
  "Show the finished embroidery as a photorealistic close-up on {{BASE_FABRIC}}, shot on Fujifilm, soft studio light, plain off-white background.";

export const MODEL_PRESENTATION =
  "Show the embroidery worn on a model in a luxury fashion campaign. Choose the garment, setting and pose that suit this design best. Full face visible. Natural skin with visible pores and fine texture, subtle sheen on the high points, no retouching, no smoothing, no plastic skin.";

export const ROOM_PRESENTATION =
  "Show the embroidery on a furnishing in a luxury interior. Choose the furnishing, room and styling that suit this design best.";

export const HERO_RULE =
  "The embroidery stays the hero: sharp bead and crystal detail, natural fabric drape, shot on Fujifilm, no cropping of the embroidery. Render the motif at believable couture scale, never oversized. If the client direction gives a size or placement, follow it exactly.";

export type Use = 'garment' | 'furnishing';

export const USE_CONFIG: Record<Use, { label: string; presentation: string }> = {
  garment: {
    label: "Show on a model",
    presentation: MODEL_PRESENTATION,
  },
  furnishing: {
    label: "Show in a room",
    presentation: ROOM_PRESENTATION,
  },
};

export const PROMPTS = {
  variations:
    "Create a new original motif made with the same craft and materials, with a different layout and different elements. Keep the craft technique, materials, bead and thread style, and overall richness. Change the shape and arrangement of the motif, the main flower or element types, and the colour mix. The design must be hand-stitchable by a skilled embroiderer, with clear negative space, and must not use any recognizable designer motif, logo or protected symbol. No text, numbers, labels or watermarks anywhere in the image.",

  "new-ip":
    "Invent one completely original hand-embroidery motif. Use the attached reference only for the general quality level, not for shapes. Do not use common patterns: no paisley, mandala, standard floral repeats, damask, or art deco sunbursts. Invent a new shape language: abstract and architectural, one strong silhouette, clear movement. Hand-stitchable, balanced density with breathing space, nothing traceable to a known fashion house. No text, numbers, labels or watermarks anywhere in the image.",

  material:
    "The attached photos show raw embroidery materials: beads, crystals, sequins and threads. Design one finished hand-embroidery motif that uses only these materials. Place the largest crystals or beads as focal points, small beads as fills and gradients, sequins where directional shine is needed. The arrangement must be physically possible to hand-stitch: stable, with attachment space, and a weight the fabric can support, with clear negative space. No text, numbers, labels or watermarks anywhere in the image.",

  "statement-piece":
    "Design one large centerpiece hand-embroidery, 25-40 cm, the hero element of an evening gown bodice, jacket back or bridal ensemble. Composition: one strong focal point, supporting elements radiating outward, dense center easing into lighter edges, 3-5 visible layers of depth from base beadwork to top crystal highlights. Use {{MATERIAL_COUNT}} material types: large crystals as hero pieces, small beads and metallic thread for detail. Hand-stitchable, fully original, no known couture-house motifs. No text, numbers, labels or watermarks anywhere in the image.",

  pattern:
    "{{PATTERN_BLOCK}} Hand-stitchable at consistent density, original, no known designer patterns. No text, numbers, labels or watermarks anywhere in the image.",
};

export type GenerationMode = keyof typeof PROMPTS;
