import type { GenJob, Inputs, Track } from './types';

const COPY_SYSTEM =
  'You are a senior e-commerce copywriter who has sold thousands of digital products. ' +
  'Write tight, specific, benefit-led copy. Never use hype words like "stunning", "elevate" or "unleash". ' +
  'Output clean markdown with the exact sections requested and nothing else.';

function n(inputs: Inputs, id: string, fallback: string): string {
  const v = (inputs[id] ?? '').trim();
  return v || fallback;
}

function imageSet(
  count: number,
  idPrefix: string,
  labelPrefix: string,
  build: (i: number) => string,
  width: number,
  height: number,
): GenJob[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    label: `${labelPrefix} ${i + 1} of ${count}`,
    kind: 'image' as const,
    model: 'flux',
    prompt: () => build(i),
    width,
    height,
    filename: `${idPrefix}-${i + 1}.jpg`,
  }));
}

/* ------------------------------------------------------------------ */

const printableArt: Track = {
  id: 'printable-art',
  no: 'No. 01',
  title: 'Printable Art Studio',
  tagline: 'Wall-art bundles for Etsy, a cent of pollen at a time.',
  description:
    'Generate a coherent set of gallery-wall prints around one theme, plus ready-to-paste Etsy listing copy with tags. Printables are the classic zero-inventory product: buyers download, you keep everything.',
  earnings: {
    priceLow: 4,
    priceHigh: 12,
    effortMins: 45,
    market: 'Etsy, Creative Market, Gumroad',
    firstSale: [
      'Pick a narrow theme buyers actually search ("boho desert nursery", not "abstract art").',
      'List the set as a bundle AND each print individually — bundles win on value, singles win on search.',
      'Upload at least 3 listings before judging results; Etsy search needs a few days to find you.',
      'Use the generated tags verbatim — they are written for Etsy\'s 13-tag limit.',
    ],
  },
  inputs: [
    { id: 'theme', label: 'Theme', kind: 'text', placeholder: 'e.g. Mediterranean citrus kitchen', required: true },
    {
      id: 'style',
      label: 'Art style',
      kind: 'select',
      options: [
        'minimal botanical line art',
        'vintage travel poster',
        'soft watercolour',
        'boho abstract shapes',
        'japandi ink wash',
        'art deco geometric',
      ],
      default: 'minimal botanical line art',
    },
    { id: 'palette', label: 'Palette (optional)', kind: 'text', placeholder: 'e.g. terracotta, sage, cream' },
    { id: 'count', label: 'Prints in the set', kind: 'select', options: ['4', '6', '8'], default: '6' },
  ],
  recipe(inputs) {
    const theme = n(inputs, 'theme', 'botanical garden');
    const style = n(inputs, 'style', 'minimal botanical line art');
    const palette = n(inputs, 'palette', 'a restrained, harmonious palette');
    const count = parseInt(n(inputs, 'count', '6'), 10);
    const jobs = imageSet(
      count,
      'print',
      'Print',
      (i) =>
        `${style} wall art print, ${theme}, variation ${i + 1} of a matching gallery set, ${palette}, ` +
        'clean composition with generous margins, flat illustration, no text, no watermark, no frame, ' +
        'high resolution printable poster',
      1024,
      1280,
    );
    jobs.push({
      id: 'listing',
      label: 'Etsy listing copy',
      kind: 'text',
      model: 'openai',
      prompt: () =>
        `${COPY_SYSTEM}\n\nWrite an Etsy listing for a downloadable wall-art set: ${count} prints, theme "${theme}", style "${style}".\n` +
        'Sections:\n## Title\n(one line, under 140 chars, front-loaded keywords)\n' +
        '## Tags\n(exactly 13 comma-separated tags, each under 20 chars)\n' +
        '## Description\n(150-220 words: what is included, sizes/ratio 4:5, instant download, suggested rooms)\n' +
        '## Bundle price suggestion\n(one line with a price and why)',
      filename: 'etsy-listing.md',
    });
    return jobs;
  },
};

const podDesigns: Track = {
  id: 'pod-designs',
  no: 'No. 02',
  title: 'Print-on-Demand Designs',
  tagline: 'T-shirt and mug graphics for niches that already buy.',
  description:
    'Bold, isolated graphics built for print-on-demand catalogs, with titles and tags per design. Redbubble, TeePublic and Amazon Merch print, ship and pay you a royalty — you only upload.',
  earnings: {
    priceLow: 3,
    priceHigh: 8,
    effortMins: 40,
    market: 'Redbubble, TeePublic, Amazon Merch',
    firstSale: [
      'Niches beat art: "veterinary nurse humour" outsells "cool design" every time.',
      'Upload each design to every product type the platform offers — it is free reach.',
      'Royalty per sale is small ($2-6); the play is a growing catalog, 5 designs at a time.',
      'Check the niche on the platform first: some sales but not thousands = room for you.',
    ],
  },
  inputs: [
    { id: 'niche', label: 'Niche', kind: 'text', placeholder: 'e.g. sourdough baking humour', required: true },
    {
      id: 'vibe',
      label: 'Design vibe',
      kind: 'select',
      options: ['bold retro badge', 'cute kawaii', 'distressed vintage', 'minimal typographic', 'detailed illustration'],
      default: 'bold retro badge',
    },
    { id: 'count', label: 'Designs', kind: 'select', options: ['3', '5'], default: '5' },
  ],
  recipe(inputs) {
    const niche = n(inputs, 'niche', 'plant lovers');
    const vibe = n(inputs, 'vibe', 'bold retro badge');
    const count = parseInt(n(inputs, 'count', '5'), 10);
    const jobs = imageSet(
      count,
      'design',
      'Design',
      (i) =>
        `${vibe} t-shirt graphic about ${niche}, concept ${i + 1}, bold flat vector style, thick outlines, ` +
        'high contrast, centered single motif isolated on plain solid background, no mockup, no shirt, ' +
        'no watermark, screen-print ready',
      1024,
      1024,
    );
    jobs.push({
      id: 'listings',
      label: 'Titles & tags per design',
      kind: 'text',
      model: 'openai',
      prompt: () =>
        `${COPY_SYSTEM}\n\nI have ${count} print-on-demand graphics in niche "${niche}", vibe "${vibe}".\n` +
        `For each design 1-${count} write:\n## Design N\n- **Title:** (under 60 chars, niche keyword first)\n` +
        '- **Tags:** (15 comma-separated tags)\n- **Description:** (one selling sentence)\n' +
        'Then add:\n## Niche check\n(3 bullet points: who buys this, what occasions, one adjacent niche to try next)',
      filename: 'pod-listings.md',
    });
    return jobs;
  },
};

const socialPack: Track = {
  id: 'social-pack',
  no: 'No. 03',
  title: 'Social Pack Factory',
  tagline: 'A month of content, sold to a local business near you.',
  description:
    'Build a 30-day social media pack — branded image posts plus a full caption calendar — for a specific local business type, then use the included pitch message to sell it. Small businesses pay real money to not think about Instagram.',
  earnings: {
    priceLow: 50,
    priceHigh: 150,
    effortMins: 90,
    market: 'Local businesses, direct outreach',
    firstSale: [
      'Make the pack for a business type, then pitch five of them in your town with one sample image.',
      'The pitch message in your export is written to send as-is via DM or email.',
      'Charge per pack, not per hour. $80 for a month of posts is cheap to them, huge to you.',
      'Land one client and it recurs monthly — same pollen cost, same price, every month.',
    ],
  },
  inputs: [
    { id: 'business', label: 'Business type', kind: 'text', placeholder: 'e.g. independent coffee shop', required: true },
    { id: 'place', label: 'Town / area', kind: 'text', placeholder: 'e.g. Sliema, Malta' },
    {
      id: 'tone',
      label: 'Brand tone',
      kind: 'select',
      options: ['warm & neighbourly', 'premium & minimal', 'playful & cheeky', 'rustic & artisan'],
      default: 'warm & neighbourly',
    },
  ],
  recipe(inputs) {
    const business = n(inputs, 'business', 'coffee shop');
    const place = n(inputs, 'place', 'your town');
    const tone = n(inputs, 'tone', 'warm & neighbourly');
    const jobs: GenJob[] = [
      {
        id: 'calendar',
        label: '30-day caption calendar',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nWrite a 30-day Instagram caption calendar for a ${business} in ${place}. Tone: ${tone}.\n` +
          'Format as:\n## Day N — (post type: promo / behind the scenes / tip / community / product)\n' +
          '(caption 2-4 lines, then one line of 5 hashtags)\n' +
          'Mix post types through the month. Mondays are promos. Include 4 posts that explicitly invite visits.',
        filename: 'caption-calendar.md',
      },
      ...imageSet(
        8,
        'post',
        'Post image',
        (i) =>
          `instagram post background for a ${tone} ${business}, scene ${i + 1}: ` +
          [
            'inviting storefront exterior at golden hour',
            'close-up product hero shot on textured surface',
            'cosy interior with natural window light',
            'flat lay of products from above',
            'hands at work, craft in progress, shallow depth of field',
            'seasonal product arrangement with props',
            'detail shot with steam or texture, moody light',
            'welcoming staff-eye view of the counter',
          ][i],
        1024,
        1024,
      ),
      {
        id: 'pitch',
        label: 'Client pitch message',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nWrite a short outreach message (under 120 words) I can DM to a ${business} owner in ${place}, ` +
          'offering a ready-made 30-day social pack (30 captions + 8 branded images) for a flat fee. ' +
          'Friendly, zero corporate-speak, one clear call to action, mention I will customise it to their brand. ' +
          'Sections:\n## DM version\n## Email version (with subject line)',
        filename: 'pitch.md',
      },
    ];
    return jobs;
  },
};

const voiceover: Track = {
  id: 'voiceover',
  no: 'No. 04',
  title: 'Voiceover Studio',
  tagline: 'Scripts and finished narration, ready to deliver.',
  description:
    'Write the script and render the narration in one run — radio spots, guided meditations, explainers. Deliver the audio file itself, or use it as the demo reel that wins you the gig.',
  earnings: {
    priceLow: 15,
    priceHigh: 60,
    effortMins: 30,
    market: 'Fiverr, Upwork, local radio & podcasts',
    firstSale: [
      'List a tightly-scoped gig: "60-second ad read, 24h delivery" beats "voiceover services".',
      'Attach the generated audio as your gig demo — buyers click play before they read.',
      'Meditations and sleep stories are evergreen: longer, calmer, higher prices.',
      'Always offer one free revision; the script regenerates in seconds anyway.',
    ],
  },
  inputs: [
    {
      id: 'kind',
      label: 'Production type',
      kind: 'select',
      options: ['30-second radio ad', '2-minute guided meditation', '60-second product explainer', 'podcast intro & outro'],
      default: '30-second radio ad',
    },
    { id: 'brief', label: 'Brief', kind: 'textarea', placeholder: 'What is it for? Product, audience, key message…', required: true },
    {
      id: 'voice',
      label: 'Voice',
      kind: 'select',
      options: ['nova', 'alloy', 'onyx', 'shimmer', 'echo', 'fable'],
      default: 'nova',
      help: 'Voice names are Pollinations TTS voices.',
    },
  ],
  recipe(inputs) {
    const kind = n(inputs, 'kind', '30-second radio ad');
    const brief = n(inputs, 'brief', 'a friendly local business');
    const voice = n(inputs, 'voice', 'nova');
    return [
      {
        id: 'script',
        label: 'Script',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nWrite the spoken script for a ${kind}. Brief: ${brief}\n` +
          'Rules: plain spoken prose only — no stage directions, no sound-effect notes, no speaker labels, ' +
          'no markdown, no quotation marks. Natural pacing for read-aloud. ' +
          (kind.includes('meditation')
            ? 'Calm, slow, second person, with natural pause points as sentence breaks. 220-280 words.'
            : 'Punchy and warm with one clear call to action. 70-90 words.'),
        filename: 'script.txt',
      },
      {
        id: 'narration',
        label: 'Narration audio',
        kind: 'audio',
        model: 'openai-audio',
        voice,
        prompt: (results) => results['script'] ?? '',
        filename: 'narration.mp3',
      },
      {
        id: 'gig',
        label: 'Fiverr gig copy',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nWrite a Fiverr gig listing for delivering productions like this: ${kind}, example brief: "${brief}".\n` +
          'Sections:\n## Gig title\n(starts with "I will", under 80 chars)\n## Three packages\n' +
          '(Basic / Standard / Premium: name, price in USD, what is included, delivery time)\n' +
          '## Gig description\n(120-160 words)\n## FAQ\n(3 short Q&As)',
        filename: 'fiverr-gig.md',
      },
    ];
  },
};

const proposalForge: Track = {
  id: 'proposal-forge',
  no: 'No. 05',
  title: 'Proposal Forge',
  tagline: 'Paste the job post. Send a proposal that gets read.',
  description:
    'Turn any freelance job post into a tailored proposal, smart clarifying questions, and a small work sample that proves you read the brief. Costs a third of a cent; wins jobs worth hundreds.',
  earnings: {
    priceLow: 50,
    priceHigh: 500,
    effortMins: 15,
    market: 'Upwork, Freelancer, PeoplePerHour',
    firstSale: [
      'Send proposals within the first hour of a post going live — speed is half the game.',
      'Edit the generated draft for 2 minutes so it sounds like you. Never send raw.',
      'The mini-sample is the differentiator: 95% of bidders attach nothing.',
      'Bid on 5 jobs a day for a week. The math works: one win pays for years of pollen.',
    ],
  },
  inputs: [
    { id: 'post', label: 'Job post', kind: 'textarea', placeholder: 'Paste the full job post here…', required: true },
    { id: 'name', label: 'Your name', kind: 'text', placeholder: 'e.g. Dave', required: true },
    { id: 'skills', label: 'Your relevant experience', kind: 'textarea', placeholder: '2-3 lines: what you have done that fits' },
  ],
  recipe(inputs) {
    const post = n(inputs, 'post', '');
    const name = n(inputs, 'name', 'I');
    const skills = n(inputs, 'skills', 'relevant hands-on experience');
    return [
      {
        id: 'proposal',
        label: 'Tailored proposal',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nJob post:\n"""${post}"""\n\nMy name is ${name}. My relevant experience: ${skills}\n\n` +
          'Write a freelance proposal (140-190 words) that:\n' +
          '- opens with their problem in their words, not "Dear sir" or "I am excited"\n' +
          '- names one specific detail from the post to prove it was read\n' +
          '- gives a concrete 3-step plan\n- ends with one low-friction question\n' +
          'Output sections:\n## Proposal\n## One-line bid summary',
        filename: 'proposal.md',
      },
      {
        id: 'questions',
        label: 'Clarifying questions',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nJob post:\n"""${post}"""\n\n` +
          'Write the 3 sharpest clarifying questions a senior freelancer would ask before quoting. ' +
          'Each question should expose scope, hidden work, or budget reality. Output as a markdown list with ' +
          'one line each explaining why the question matters.',
        filename: 'questions.md',
      },
      {
        id: 'sample',
        label: 'Mini work sample',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nJob post:\n"""${post}"""\n\n` +
          'Produce a SMALL work sample that proves capability for this exact job — e.g. if it is writing, ' +
          'the first 100 words; if it is a spreadsheet task, the column plan; if it is design, a creative brief. ' +
          'Pick the most convincing form yourself. Keep it under 150 words. Title the section "## Sample: (what it is)".',
        filename: 'sample.md',
      },
    ];
  },
};

const contentEngine: Track = {
  id: 'content-engine',
  no: 'No. 06',
  title: 'Content Engine',
  tagline: 'SEO articles with hero art, sold as a service.',
  description:
    'Outline, full article, meta copy and a hero image in one run. Package it as a content subscription for small businesses, or fill your own niche site that earns ad and affiliate revenue.',
  earnings: {
    priceLow: 30,
    priceHigh: 150,
    effortMins: 35,
    market: 'Freelance platforms, local businesses, your own sites',
    firstSale: [
      'Sell to businesses that blog monthly but badly — show them one finished sample.',
      'Always edit: add one real fact or local detail per section. That is your moat.',
      'Offer a 4-article monthly bundle; recurring beats one-off at the same effort.',
      'For your own sites: pick questions people ask, answer them better than page one does.',
    ],
  },
  inputs: [
    { id: 'topic', label: 'Topic / target keyword', kind: 'text', placeholder: 'e.g. how to overwinter olive trees in pots', required: true },
    { id: 'audience', label: 'Audience', kind: 'text', placeholder: 'e.g. hobby gardeners in northern Europe' },
    {
      id: 'tone',
      label: 'Tone',
      kind: 'select',
      options: ['practical & friendly', 'authoritative expert', 'conversational storyteller'],
      default: 'practical & friendly',
    },
    { id: 'length', label: 'Length', kind: 'select', options: ['~700 words', '~1200 words'], default: '~1200 words' },
  ],
  recipe(inputs) {
    const topic = n(inputs, 'topic', 'a practical how-to topic');
    const audience = n(inputs, 'audience', 'general readers');
    const tone = n(inputs, 'tone', 'practical & friendly');
    const length = n(inputs, 'length', '~1200 words');
    return [
      {
        id: 'outline',
        label: 'Article outline',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nCreate an SEO article outline for "${topic}", audience: ${audience}.\n` +
          'H2/H3 structure as a markdown list, with one line per section on what it must cover. ' +
          'Include an FAQ section with 3 real questions people search. No intro/outro fluff sections.',
        filename: 'outline.md',
      },
      {
        id: 'article',
        label: 'Full article',
        kind: 'text',
        model: 'openai',
        prompt: (results) =>
          `${COPY_SYSTEM}\n\nWrite the full article (${length}) for "${topic}", audience: ${audience}, tone: ${tone}.\n` +
          `Follow this outline exactly:\n${results['outline'] ?? ''}\n\n` +
          'Rules: specific and concrete, no filler paragraphs, no "in conclusion", markdown with H2/H3, ' +
          'short paragraphs, one practical tip per section the reader can act on today.',
        filename: 'article.md',
      },
      {
        id: 'meta',
        label: 'Meta title & description',
        kind: 'text',
        model: 'openai',
        prompt: () =>
          `${COPY_SYSTEM}\n\nFor an article on "${topic}", write:\n## Meta title\n(under 60 chars)\n` +
          '## Meta description\n(under 155 chars, includes the keyword, ends with a reason to click)\n' +
          '## Suggested URL slug\n(lowercase-hyphenated)',
        filename: 'meta.md',
      },
      {
        id: 'hero',
        label: 'Hero image',
        kind: 'image',
        model: 'flux',
        prompt: () =>
          `editorial blog hero photograph illustrating ${topic}, natural light, authentic and specific scene, ` +
          'shallow depth of field, no text, no watermark, magazine quality',
        width: 1280,
        height: 720,
        filename: 'hero.jpg',
      },
    ];
  },
};

export const TRACKS: Track[] = [printableArt, podDesigns, socialPack, voiceover, proposalForge, contentEngine];

export function getTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}
