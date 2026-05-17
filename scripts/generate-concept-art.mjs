/**
 * Generate 5 Nano Banana fantasy concept art images using Gemini's image generation.
 *
 * Usage:
 *   node scripts/generate-concept-art.mjs
 *
 * Requires:
 *   GEMINI_API_KEY in .env.local or environment
 *
 * Output:
 *   assets/concept-art/nano-banana-v{1..5}.png
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load API key from .env.local
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found — need GEMINI_API_KEY");
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^=]+?)\s*=\s*(.+)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

const env = loadEnv();
const API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("GEMINI_API_KEY not found");

const OUTPUT_DIR = path.join(ROOT, "assets", "concept-art");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Image generation models available on this API key
const MODELS = {
  flash: "gemini-2.5-flash-image",          // "Nano Banana"
  pro: "gemini-3-pro-image-preview",         // "Nano Banana Pro"
  flash2: "gemini-3.1-flash-image-preview",  // "Nano Banana 2"
};

// Use the model the user requested, with fallback chain
const PRIMARY_MODEL = MODELS.flash2; // gemini-3.1-flash-image-preview

function apiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
}

// Base prompt elements shared across all versions
const BASE_CONTEXT = `Create a hand-drawn fantasy illustration of a tiny "Nano Banana" civilization hidden within a magical ecosystem. The Nano Banana characters are miniature banana-shaped beings with charming hand-sketched features, living harmoniously inside an enormous enchanted environment. Their world is integrated into giant glowing mushrooms, ancient tree roots, waterfalls, floating islands, crystal caves, moss-covered ruins, and luminous plants.

The Nano Banana society should appear whimsical and storybook-like with tiny bridges made from vines, lanterns glowing with magical energy, small fantasy houses carved into giant fruits or tree trunks, miniature travelers exploring the landscape, floating magical creatures nearby, and ancient environmental structures partially reclaimed by nature.

Mood: Wonder, mystery, adventure, serenity — a hidden magical civilization untouched by humans.
Art style: Traditional hand-drawn illustration. Visible pencil strokes, ink outlines, and watercolor washes. Imperfect organic linework with natural texture variations. The image must look like it was drawn by hand on paper — NOT digitally rendered, NOT photorealistic, NOT AI-generated. Think illustrated children's book, field journal sketch, or hand-painted storybook art. Visible paper grain texture, soft blended edges, slightly uneven coloring typical of watercolor and colored pencil work.`;

// 5 distinct style variations — each uses a model for variety
const STYLE_VARIANTS = [
  {
    name: "v1-bioluminescent-jungle",
    model: MODELS.flash2,
    prompt: `${BASE_CONTEXT}

STYLE VERSION 1 — BIOLUMINESCENT JUNGLE:
Set the scene in a dense bioluminescent jungle at twilight. Giant glowing mushrooms tower overhead casting cyan and magenta light. Nano Banana villagers walk across vine bridges between enormous luminous flower petals. Firefly-like magical particles fill the air. A massive waterfall of liquid light cascades in the background. The foreground shows a detailed Nano Banana market with tiny lantern-lit stalls carved into moss-covered bark.

Style: Hand-drawn bioluminescent jungle, ink and watercolor on textured paper. Deep greens and electric blues applied with visible brush strokes. Soft pencil underdrawing visible beneath watercolor washes. Light rendered with white gouache highlights. Inspired by naturalist field journal illustrations meets Studio Ghibli hand-painted backgrounds. Imperfect, organic, human-made feel.`,
  },
  {
    name: "v2-crystal-cavern",
    model: MODELS.pro,
    prompt: `${BASE_CONTEXT}

STYLE VERSION 2 — CRYSTAL CAVERN KINGDOM:
The scene is set inside a vast underground crystal cavern. Enormous amethyst and quartz formations create cathedral-like spaces. Nano Banana engineers have built an intricate city within the crystals — tiny staircases spiraling up crystal spires, suspension bridges between geode chambers, and workshops where they harvest crystal energy. Soft prismatic light refracts through the crystals creating rainbow caustics across the cavern walls. Underground rivers glow with mineral-rich bioluminescence.

Style: Hand-drawn underground crystal fantasy, colored pencil and ink on cream paper. Purple and gold palette applied with visible hatching and cross-hatching strokes. Prismatic light effects rendered with soft pastel overlays. Mineral textures drawn with fine pen detail. Reminiscent of vintage fantasy book illustrations and naturalist cave sketches. Warm, tactile, handcrafted aesthetic.`,
  },
  {
    name: "v3-floating-islands",
    model: MODELS.flash,
    prompt: `${BASE_CONTEXT}

STYLE VERSION 3 — FLOATING ISLAND ARCHIPELAGO:
An aerial view of a floating island archipelago in a golden-hour sky. Massive chunks of earth and ancient trees float in mid-air connected by rope bridges and vine networks. Nano Banana airship pilots navigate tiny leaf-sail vessels between islands. Waterfalls cascade from floating islands into clouds below. The main island features a grand Nano Banana temple carved from a giant ancient tree stump, with spiral staircases and observation decks. Magical aurora-like energy streams connect the islands.

Style: Hand-drawn floating island fantasy, watercolor and ink on aged parchment. Warm golden and amber washes with soft blue sky rendered in wet-on-wet watercolor technique. Visible pencil construction lines and ink outlines. Epic sense of scale drawn with loose, expressive brushwork. Inspired by Hayao Miyazaki's hand-painted concept sketches and vintage adventure book illustrations. Dreamy, nostalgic, hand-painted warmth.`,
  },
  {
    name: "v4-ancient-ruins",
    model: MODELS.flash2,
    prompt: `${BASE_CONTEXT}

STYLE VERSION 4 — ANCIENT MOSS RUINS:
A vast ancient ruin complex reclaimed by nature, now home to the Nano Banana civilization. Massive crumbling stone columns covered in glowing moss and vines frame the scene. Nano Banana archaeologists explore carved stone passages, while others have built cozy homes inside hollow pillars. Giant tree roots have grown through the ruins creating natural archways. Morning mist drifts through the scene with soft god rays. A giant ancient stone face, partially covered in moss, watches over the settlement. Tiny gardens grow on ledges and in cracks of the ancient stones.

Style: Hand-drawn ancient ruins fantasy, sepia ink and earth-tone watercolors on textured paper. Earthy greens and warm stone tones with visible brushstroke texture. Soft atmospheric fog rendered with diluted washes. Detailed weathered stone textures drawn with fine-nib pen crosshatching. Inspired by archaeological field sketches meets Lord of the Rings illustrated edition artwork by Alan Lee. Organic, hand-inked, traditional illustration feel.`,
  },
  {
    name: "v5-enchanted-waterfall",
    model: MODELS.pro,
    prompt: `${BASE_CONTEXT}

STYLE VERSION 5 — ENCHANTED WATERFALL SANCTUARY:
A massive enchanted waterfall sanctuary where water falls from impossible heights into a mystical pool. Behind the waterfall curtain, a hidden Nano Banana city glows with warm amber light. Giant lily pads serve as platforms and docks for tiny leaf boats. Luminous fish and water spirits swim in the crystalline waters. The Nano Banana village extends up the cliff face behind the waterfall, with homes carved into the rock and connected by wooden walkways and rope ladders. Rainbow mist from the waterfall creates permanent magical auroras.

Style: Hand-drawn enchanted waterfall fantasy, wet watercolor and ink on cold-pressed paper. Turquoise and amber color palette with visible pigment granulation and soft color bleeds. Dramatic water effects rendered with splattered white gouache and wet brush techniques. Lush tropical vegetation drawn with loose expressive linework. Inspired by classic fantasy storybook watercolor paintings and hand-illustrated fairy tale art. Flowing, organic, unmistakably hand-painted.`,
  },
];

async function generateImage(variant, index) {
  const model = variant.model || PRIMARY_MODEL;
  const label = `[${index + 1}/5] ${variant.name} (${model})`;
  console.log(`${label}: Sending request to Gemini...`);

  const body = {
    contents: [
      {
        parts: [{ text: variant.prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  try {
    const res = await fetch(apiUrl(model), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`${label}: API error ${res.status}: ${errorText}`);
      return null;
    }

    const data = await res.json();

    // Extract image from response
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const imgBuffer = Buffer.from(part.inlineData.data, "base64");
          const mimeType = part.inlineData.mimeType || "image/png";
          const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
          const filename = `nano-banana-${variant.name}.${ext}`;
          const outPath = path.join(OUTPUT_DIR, filename);
          fs.writeFileSync(outPath, imgBuffer);
          console.log(`${label}: Saved -> ${outPath} (${(imgBuffer.length / 1024).toFixed(1)} KB)`);
          return outPath;
        }
      }
    }

    // If no image, log the text response
    const textParts = candidates
      .flatMap((c) => c.content?.parts || [])
      .filter((p) => p.text)
      .map((p) => p.text);
    console.error(
      `${label}: No image in response. Text: ${textParts.join(" ").slice(0, 200)}`
    );
    return null;
  } catch (err) {
    console.error(`${label}: Request failed: ${err.message}`);
    return null;
  }
}

// Run all 5 generations (sequentially to avoid rate limits)
async function main() {
  console.log("=== Nano Banana Concept Art Generator ===");
  console.log(`Models: ${Object.values(MODELS).join(", ")}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Generating 5 style variations...\n`);

  const results = [];

  for (let i = 0; i < STYLE_VARIANTS.length; i++) {
    const result = await generateImage(STYLE_VARIANTS[i], i);
    results.push({ variant: STYLE_VARIANTS[i].name, path: result });

    // Small delay between requests to avoid rate limiting
    if (i < STYLE_VARIANTS.length - 1) {
      console.log("  (waiting 3s before next request...)\n");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("\n=== Generation Complete ===");
  console.log("Results:");
  for (const r of results) {
    console.log(`  ${r.variant}: ${r.path ? "SUCCESS" : "FAILED"}`);
  }

  const successCount = results.filter((r) => r.path).length;
  console.log(`\n${successCount}/5 images generated successfully.`);

  if (successCount > 0) {
    console.log(`\nImages saved to: ${OUTPUT_DIR}`);
    console.log(
      "Add your chosen image to README.md with:"
    );
    console.log(
      '  ![Nano Banana Civilization](assets/concept-art/<chosen-file>.png)'
    );
  }
}

main().catch(console.error);
