<script lang="ts">
  import Flower from '../components/Flower.svelte';
  import { TRACKS } from '../lib/tracks';
  import { estimateRunCost, paybackMultiple } from '../lib/tracks/types';
  import { formatMoney } from '../lib/costs';
  import { settings } from '../lib/settings.svelte';
  import { keyStore } from '../lib/auth/keystore.svelte';

  const sampleCosts = TRACKS.map((t) => {
    const defaults = Object.fromEntries(t.inputs.map((i) => [i.id, i.default ?? 'sample']));
    const cost = estimateRunCost(t, defaults, settings.costs);
    return { track: t, cost, payback: paybackMultiple(t, cost) };
  });

  const bundle = sampleCosts.find((c) => c.track.id === 'printable-art')!;
</script>

<section class="hero wrap">
  <div class="hero-copy">
    <span class="eyebrow fade-up">A bring-your-own-pollen hothouse</span>
    <h1 class="fade-up" style="animation-delay:.08s">
      Plant pollen.<br /><em>Harvest income.</em>
    </h1>
    <p class="lede fade-up" style="animation-delay:.16s">
      Six guided money tracks turn fractions of a cent of Pollinations pollen into products people
      actually pay for — art bundles, content packs, voiceovers, winning proposals. And one honest
      ledger proves, in your own numbers, that you earned more than you spent.
    </p>
    <div class="cta fade-up" style="animation-delay:.24s">
      <a class="btn gold" href="#/tracks">Browse the tracks</a>
      {#if !keyStore.connected}
        <a class="btn ghost" href="#/connect">Connect your pollen</a>
      {:else}
        <a class="btn ghost" href="#/ledger">Open your ledger</a>
      {/if}
    </div>
    <p class="proof mono fade-up" style="animation-delay:.32s">
      a full {bundle.track.title.toLowerCase()} run ≈ {formatMoney(bundle.cost)} of pollen ·
      sells from ${bundle.track.earnings.priceLow} · one sale repays {bundle.payback.toLocaleString()}×
    </p>
  </div>

  <div class="hero-art fade-up" style="animation-delay:.2s" aria-hidden="true">
    <Flower petals={12} size={300} />
    <div class="stamp mono">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <path id="ring" d="M60 12 a48 48 0 1 1 -0.01 0" />
        </defs>
        <text>
          <textPath href="#ring" startOffset="0">YOUR KEY NEVER LEAVES YOUR BROWSER · BYOP ·</textPath>
        </text>
      </svg>
    </div>
  </div>
</section>

<section class="band">
  <div class="wrap band-grid">
    <div>
      <span class="figure mono">$0.001</span>
      <p>a print-ready artwork on flux — the seed</p>
    </div>
    <div>
      <span class="figure mono">$4–500</span>
      <p>what one finished deliverable sells for — the harvest</p>
    </div>
    <div>
      <span class="figure mono">100–4,000×</span>
      <p>payback on a single low-end sale, before your time</p>
    </div>
  </div>
</section>

<section class="wrap tracks-preview">
  <span class="eyebrow">The seed catalogue</span>
  <h2>Six tracks, each ending in something sellable</h2>
  <div class="grid">
    {#each sampleCosts as { track, cost, payback } (track.id)}
      <a class="card track-card" href="#/track/{track.id}">
        <span class="no mono">{track.no}</span>
        <h3>{track.title}</h3>
        <p>{track.tagline}</p>
        <div class="card-foot mono">
          <span>{formatMoney(cost)} / run</span>
          <span class="payback">{payback.toLocaleString()}× payback</span>
        </div>
      </a>
    {/each}
  </div>
</section>

<section class="wrap how">
  <span class="eyebrow">How it works</span>
  <h2>Three steps, no servers, no subscriptions</h2>
  <ol>
    <li>
      <span class="step mono">01</span>
      <h3>Bring your own pollen</h3>
      <p>
        Connect your Pollinations account in one click (or paste a key). Generation runs on
        <em>your</em> pollen, from your browser, on your terms.
      </p>
    </li>
    <li>
      <span class="step mono">02</span>
      <h3>Run a track</h3>
      <p>
        Fill in a short brief, watch the pipeline produce the artwork, copy, audio and pitch
        messages — then export the whole deliverable as a zip.
      </p>
    </li>
    <li>
      <span class="step mono">03</span>
      <h3>Sell it, log it, prove it</h3>
      <p>
        List it where the track tells you. When money lands, log it. The ledger sets every cent
        of income against every micro-cent of pollen — and blooms.
      </p>
    </li>
  </ol>
</section>

<section class="wrap ledger-pitch card">
  <div class="pitch-copy">
    <span class="eyebrow">The harvest receipt</span>
    <h2>The app that pays for itself — and shows its working</h2>
    <p>
      Every generation is priced and recorded. Every sale you log is set against it. When your
      multiplier passes break-even the flower opens its first petal; at 1,000× it's in full bloom —
      and you can download a receipt card to prove it.
    </p>
    <a class="btn" href="#/ledger">Open the ledger</a>
  </div>
  <div class="pitch-flower" aria-hidden="true">
    <Flower petals={8} size={210} />
  </div>
</section>

<style>
  .hero {
    display: grid;
    grid-template-columns: 1.3fr 0.7fr;
    align-items: center;
    gap: 40px;
    padding-top: 84px;
    padding-bottom: 70px;
  }

  h1 {
    font-size: clamp(46px, 7vw, 84px);
    font-weight: 640;
    color: var(--green-deep);
  }

  h1 em {
    font-style: italic;
    font-weight: 480;
    color: var(--gold);
  }

  .lede {
    font-size: 18.5px;
    max-width: 56ch;
    color: var(--ink-soft);
  }

  .cta {
    display: flex;
    gap: 14px;
    margin: 30px 0 22px;
    flex-wrap: wrap;
  }

  .proof {
    font-size: 12.5px;
    color: var(--ink-faint);
    letter-spacing: 0.02em;
  }

  .hero-art {
    position: relative;
    justify-self: center;
  }

  .stamp {
    position: absolute;
    right: -26px;
    bottom: -18px;
    transform: rotate(12deg);
    animation: spin 40s linear infinite;
  }

  .stamp text {
    font-size: 10.5px;
    letter-spacing: 0.22em;
    fill: var(--poppy);
  }

  @keyframes spin {
    to {
      transform: rotate(372deg);
    }
  }

  .band {
    background: var(--green-deep);
    color: var(--paper);
    padding: 46px 0;
    border-top: 3px solid var(--gold);
    border-bottom: 3px solid var(--gold);
  }

  .band-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    text-align: center;
  }

  .figure {
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 600;
    color: var(--gold-bright);
    display: block;
  }

  .band p {
    margin: 8px 0 0;
    font-size: 14px;
    opacity: 0.85;
  }

  .tracks-preview,
  .how {
    padding-top: 90px;
  }

  .tracks-preview h2,
  .how h2 {
    font-size: clamp(28px, 4vw, 40px);
    color: var(--green-deep);
    max-width: 24ch;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 36px;
  }

  .track-card {
    padding: 26px 24px 20px;
    text-decoration: none;
    color: var(--ink);
    transition: transform 0.22s var(--ease-bloom), box-shadow 0.22s;
    display: flex;
    flex-direction: column;
  }

  .track-card:hover {
    transform: translateY(-5px) rotate(-0.4deg);
    box-shadow: 0 2px 2px rgba(28, 42, 33, 0.06), 0 22px 44px -14px rgba(28, 42, 33, 0.32);
  }

  .no {
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--poppy);
  }

  .track-card h3 {
    font-size: 21px;
    margin: 10px 0 6px;
    color: var(--green-deep);
  }

  .track-card p {
    font-size: 14px;
    color: var(--ink-soft);
    margin: 0 0 18px;
    flex: 1;
  }

  .card-foot {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    border-top: 1px dotted var(--line-strong);
    padding-top: 12px;
    color: var(--ink-faint);
  }

  .payback {
    color: var(--gold);
    font-weight: 600;
  }

  .how ol {
    list-style: none;
    padding: 0;
    margin: 36px 0 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  .step {
    font-size: 13px;
    color: var(--poppy);
    letter-spacing: 0.2em;
    display: block;
    margin-bottom: 10px;
  }

  .how h3 {
    font-size: 20px;
    color: var(--green-deep);
  }

  .how p {
    font-size: 14.5px;
    color: var(--ink-soft);
  }

  .ledger-pitch {
    margin-top: 100px;
    padding: 50px;
    display: grid;
    grid-template-columns: 1.5fr 0.5fr;
    align-items: center;
    gap: 30px;
    background: var(--paper-2);
  }

  .ledger-pitch h2 {
    font-size: clamp(26px, 3.4vw, 36px);
    color: var(--green-deep);
  }

  .ledger-pitch p {
    color: var(--ink-soft);
    max-width: 58ch;
    margin-bottom: 24px;
  }

  .pitch-flower {
    justify-self: center;
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
      padding-top: 50px;
    }

    .hero-art {
      order: -1;
      margin-bottom: -20px;
    }

    .band-grid,
    .grid,
    .how ol {
      grid-template-columns: 1fr;
    }

    .ledger-pitch {
      grid-template-columns: 1fr;
      padding: 32px 26px;
    }
  }
</style>
