<script lang="ts">
  import { TRACKS } from '../lib/tracks';
  import { estimateRunCost, paybackMultiple } from '../lib/tracks/types';
  import { formatMoney } from '../lib/costs';
  import { settings } from '../lib/settings.svelte';

  const rows = TRACKS.map((t) => {
    const defaults = Object.fromEntries(t.inputs.map((i) => [i.id, i.default ?? 'sample']));
    const cost = estimateRunCost(t, defaults, settings.costs);
    return { track: t, cost, payback: paybackMultiple(t, cost) };
  });
</script>

<section class="wrap">
  <header class="head fade-up">
    <span class="eyebrow">The seed catalogue</span>
    <h1>Pick your hustle</h1>
    <p>
      Each track is a complete pipeline: brief in, sellable deliverable out, with the listing copy
      and pitch messages included. The numbers under each card are the honest math — conservative
      pollen estimates against real market prices.
    </p>
  </header>

  <div class="list">
    {#each rows as { track, cost, payback }, i (track.id)}
      <a class="row card fade-up" style="animation-delay:{i * 0.07}s" href="#/track/{track.id}">
        <div class="row-no mono">{track.no}</div>
        <div class="row-main">
          <h2>{track.title}</h2>
          <p class="tagline">{track.tagline}</p>
          <p class="desc">{track.description}</p>
        </div>
        <div class="row-figures mono">
          <div><span class="k">run cost</span><span class="v">{formatMoney(cost)}</span></div>
          <div><span class="k">sells for</span><span class="v">${track.earnings.priceLow}–{track.earnings.priceHigh}</span></div>
          <div><span class="k">payback</span><span class="v gold">{payback.toLocaleString()}×</span></div>
          <div><span class="k">market</span><span class="v small">{track.earnings.market}</span></div>
        </div>
        <div class="row-go" aria-hidden="true">→</div>
      </a>
    {/each}
  </div>
</section>

<style>
  .head {
    padding: 64px 0 40px;
    max-width: 70ch;
  }

  h1 {
    font-size: clamp(38px, 5vw, 58px);
    color: var(--green-deep);
  }

  .head p {
    color: var(--ink-soft);
    font-size: 16.5px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .row {
    display: grid;
    grid-template-columns: 70px 1.5fr 1fr 40px;
    gap: 24px;
    align-items: center;
    padding: 28px 30px;
    text-decoration: none;
    color: var(--ink);
    transition: transform 0.2s var(--ease-bloom), box-shadow 0.2s;
  }

  .row:hover {
    transform: translateX(6px);
    box-shadow: 0 2px 2px rgba(28, 42, 33, 0.06), 0 20px 40px -16px rgba(28, 42, 33, 0.32);
  }

  .row-no {
    font-size: 12px;
    letter-spacing: 0.18em;
    color: var(--poppy);
    align-self: start;
    padding-top: 6px;
  }

  .row h2 {
    font-size: 24px;
    margin-bottom: 4px;
    color: var(--green-deep);
  }

  .tagline {
    font-weight: 600;
    font-size: 14.5px;
    margin: 0 0 8px;
    color: var(--gold);
  }

  .desc {
    font-size: 14px;
    color: var(--ink-soft);
    margin: 0;
  }

  .row-figures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
    border-left: 1.5px dotted var(--line-strong);
    padding-left: 24px;
  }

  .k {
    display: block;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .v {
    font-size: 16px;
    font-weight: 600;
    color: var(--green-deep);
  }

  .v.gold {
    color: var(--gold);
  }

  .v.small {
    font-size: 12px;
    font-weight: 400;
  }

  .row-go {
    font-size: 22px;
    color: var(--gold);
  }

  @media (max-width: 820px) {
    .row {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .row-figures {
      border-left: none;
      border-top: 1.5px dotted var(--line-strong);
      padding: 16px 0 0;
    }

    .row-go {
      display: none;
    }
  }
</style>
