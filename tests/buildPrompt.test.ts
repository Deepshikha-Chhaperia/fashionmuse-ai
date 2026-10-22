import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrompt,
  buildContentParts,
  VARIATIONS_REFERENCE_PREFIX,
} from '../src/lib/aiService';
import {
  HERO_RULE,
  MODEL_PRESENTATION,
  ROOM_PRESENTATION,
  DEFAULT_PRESENTATION,
} from '../src/lib/prompts';
import { buildImageConfig, resolveImageSize } from '../api/generate';

test('buildPrompt - Toggle ON, garment, no client direction', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: true,
    application: 'garment',
  });

  assert.ok(prompt.includes(MODEL_PRESENTATION));
  assert.ok(prompt.includes('Full face visible. Natural skin with visible pores'));
  assert.ok(prompt.includes(HERO_RULE));
  assert.ok(prompt.includes('Render the motif at believable couture scale, never oversized.'));
  assert.ok(!prompt.includes('Show the finished embroidery as a photorealistic close-up'));
  assert.ok(!prompt.includes('Client direction:'));
});

test('buildPrompt - Toggle ON, garment, with client direction naming a size', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: true,
    application: 'garment',
    customInstructions: 'neckline motif about 6 inches',
  });

  assert.ok(prompt.includes(MODEL_PRESENTATION));
  assert.ok(prompt.includes('Client direction: neckline motif about 6 inches'));
  assert.ok(prompt.includes('If the client direction says how to show the design, follow it over the presentation above.'));
  assert.ok(prompt.includes(HERO_RULE));
  // Ensure HERO_RULE is included only once
  const matches = prompt.match(new RegExp(HERO_RULE.slice(0, 30), 'g'));
  assert.equal(matches?.length, 1);
});

test('buildPrompt - Toggle OFF, garment, with client direction naming a size', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: false,
    application: 'garment',
    customInstructions: 'neckline motif about 6 inches',
  });

  assert.ok(prompt.includes('silk organza garment fabric'));
  assert.ok(!prompt.includes(MODEL_PRESENTATION));
  assert.ok(prompt.includes('Client direction: neckline motif about 6 inches'));
  assert.ok(prompt.includes('If the client direction says how to show the design, follow it over the presentation above.'));
  assert.ok(prompt.includes(HERO_RULE));
});

test('buildPrompt - Toggle OFF, garment, no client direction', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: false,
    application: 'garment',
  });

  assert.ok(prompt.includes('silk organza garment fabric'));
  assert.ok(!prompt.includes(MODEL_PRESENTATION));
  assert.ok(!prompt.includes(HERO_RULE));
  assert.ok(!prompt.includes('Client direction:'));
});

test('buildPrompt - Toggle ON, furnishing, no client direction', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: true,
    application: 'furnishing',
  });

  assert.ok(prompt.includes(ROOM_PRESENTATION));
  assert.ok(prompt.includes(HERO_RULE));
  assert.ok(!prompt.includes(MODEL_PRESENTATION));
});

test('buildPrompt - Toggle OFF, furnishing, no client direction', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: false,
    application: 'furnishing',
  });

  assert.ok(prompt.includes('heavy linen furnishing fabric'));
  assert.ok(!prompt.includes(ROOM_PRESENTATION));
  assert.ok(!prompt.includes(HERO_RULE));
});

test('buildPrompt - Variations includes what must change/stay and no forbidden words with toggle ON', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: true,
    application: 'garment',
  });

  const positiveIntro = 'Create a new original motif made with the same craft and materials, with a different layout and different elements.';
  const staySentence = 'Keep the craft technique, materials, bead and thread style, and overall richness.';
  const changeSentence = 'Change the shape and arrangement of the motif, the main flower or element types, and the colour mix.';

  assert.ok(prompt.includes(positiveIntro));
  assert.ok(prompt.includes(staySentence));
  assert.ok(prompt.includes(changeSentence));
  assert.ok(!prompt.toLowerCase().includes('same design'));
  assert.ok(!prompt.toLowerCase().includes('keep every embellishment'));
});

test('buildPrompt - Variations includes what must change/stay and no forbidden words with toggle OFF', () => {
  const prompt = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    showOnModelOrRoom: false,
    application: 'garment',
  });

  const positiveIntro = 'Create a new original motif made with the same craft and materials, with a different layout and different elements.';
  const staySentence = 'Keep the craft technique, materials, bead and thread style, and overall richness.';
  const changeSentence = 'Change the shape and arrangement of the motif, the main flower or element types, and the colour mix.';

  assert.ok(prompt.includes(positiveIntro));
  assert.ok(prompt.includes(staySentence));
  assert.ok(prompt.includes(changeSentence));
  assert.ok(!prompt.toLowerCase().includes('same design'));
  assert.ok(!prompt.toLowerCase().includes('keep every embellishment'));
});

test('buildPrompt - Variations gives each generation a distinct focus when numImages >= 2', () => {
  const v1 = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    numImages: 3,
    variationIndex: 0,
  });
  const v2 = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    numImages: 3,
    variationIndex: 1,
  });
  const v3 = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    numImages: 3,
    variationIndex: 2,
  });

  assert.ok(v1.includes('Variation focus: Layout'));
  assert.ok(v2.includes('Variation focus: Elements'));
  assert.ok(v3.includes('Variation focus: Colour'));

  // When numImages is 1, no variation focus
  const single = buildPrompt('variations', {
    mode: 'variations',
    images: [],
    numImages: 1,
    variationIndex: 0,
  });
  assert.ok(!single.includes('Variation focus:'));

  // Other modes do not include variation focus
  const heroPiece = buildPrompt('statement-piece', {
    mode: 'statement-piece',
    images: [],
    numImages: 3,
    variationIndex: 0,
  });
  assert.ok(!heroPiece.includes('Variation focus:'));
});

test('buildContentParts - Reference text part comes before images in Variations mode only', () => {
  const fakeImages = ['data:image/jpeg;base64,abc123fake'];
  const finalText = 'Final prompt text';

  const variationParts = buildContentParts('variations', fakeImages, finalText);
  assert.equal(variationParts.length, 3);
  assert.deepEqual(variationParts[0], { text: VARIATIONS_REFERENCE_PREFIX });
  assert.deepEqual(variationParts[1], { inlineData: { mimeType: 'image/jpeg', data: 'abc123fake' } });
  assert.deepEqual(variationParts[2], { text: finalText });

  const otherModes = ['new-ip', 'material', 'statement-piece', 'pattern'] as const;
  for (const m of otherModes) {
    const parts = buildContentParts(m, fakeImages, finalText);
    assert.equal(parts.length, 2);
    assert.deepEqual(parts[0], { inlineData: { mimeType: 'image/jpeg', data: 'abc123fake' } });
    assert.deepEqual(parts[1], { text: finalText });
    assert.ok(!parts.some((p) => 'text' in p && p.text === VARIATIONS_REFERENCE_PREFIX));
  }
});

test('resolveImageSize - strictly allows 1K, falls back to 2K for any other value', () => {
  assert.equal(resolveImageSize('1K'), '1K');
  assert.equal(resolveImageSize('1k'), '1K');
  assert.equal(resolveImageSize('2K'), '2K');
  assert.equal(resolveImageSize('4K'), '2K');
  assert.equal(resolveImageSize(''), '2K');
  assert.equal(resolveImageSize(undefined), '2K');
  assert.equal(resolveImageSize(null), '2K');
  assert.equal(resolveImageSize(123), '2K');
});

test('buildImageConfig - default produces aspectRatio 1:1 and imageSize 2K', () => {
  const orig = process.env.IMAGE_SIZE;
  delete process.env.IMAGE_SIZE;
  try {
    const config = buildImageConfig();
    assert.deepEqual(config, { aspectRatio: '1:1', imageSize: '2K' });
  } finally {
    if (orig !== undefined) process.env.IMAGE_SIZE = orig;
  }
});

test('buildImageConfig - env override allows 1K', () => {
  const orig = process.env.IMAGE_SIZE;
  process.env.IMAGE_SIZE = '1K';
  try {
    const config = buildImageConfig();
    assert.deepEqual(config, { aspectRatio: '1:1', imageSize: '1K' });
  } finally {
    if (orig !== undefined) process.env.IMAGE_SIZE = orig;
    else delete process.env.IMAGE_SIZE;
  }
});

test('buildImageConfig - invalid size in env falls back to 2K', () => {
  const orig = process.env.IMAGE_SIZE;
  process.env.IMAGE_SIZE = '4K';
  try {
    const config = buildImageConfig();
    assert.deepEqual(config, { aspectRatio: '1:1', imageSize: '2K' });
  } finally {
    if (orig !== undefined) process.env.IMAGE_SIZE = orig;
    else delete process.env.IMAGE_SIZE;
  }
});

test('buildImageConfig - preserves existing config while clamping invalid imageSize to 2K', () => {
  const config = buildImageConfig({ aspectRatio: '16:9', imageSize: '4K', otherOption: true });
  assert.deepEqual(config, {
    aspectRatio: '16:9',
    imageSize: '2K',
    otherOption: true,
  });
});

test('buildImageConfig - preserves valid imageSize 1K from existing config', () => {
  const config = buildImageConfig({ imageSize: '1K' });
  assert.deepEqual(config, {
    aspectRatio: '1:1',
    imageSize: '1K',
  });
});
