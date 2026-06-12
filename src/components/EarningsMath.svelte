<script lang="ts">
  import type { Track } from '../lib/tracks/types';
  import { formatMoney, formatPollen } from '../lib/costs';

  let { track, runCost, payback }: { track: Track; runCost: number; payback: number } = $props();
</script>

<aside class="math card">
  <span class="eyebrow">The honest math</span>
  <dl>
    <div>
      <dt>Pollen per run</dt>
      <dd class="mono">{formatPollen(runCost)} <small>≈ {formatMoney(runCost)}</small></dd>
    </div>
    <div>
      <dt>Sells for</dt>
      <dd class="mono">${track.earnings.priceLow}–{track.earnings.priceHigh}</dd>
    </div>
    <div>
      <dt>One low-end sale repays</dt>
      <dd class="mono gold">{payback.toLocaleString()}×</dd>
    </div>
    <div>
      <dt>Your time</dt>
      <dd class="mono">~{track.earnings.effortMins} min</dd>
    </div>
  </dl>
  <hr class="rule-dotted" />
  <p class="market">Sell on: <strong>{track.earnings.market}</strong></p>
  <details>
    <summary>Path to the first sale</summary>
    <ul>
      {#each track.earnings.firstSale as tip (tip)}
        <li>{tip}</li>
      {/each}
    </ul>
  </details>
  <p class="estimate-note">Estimates use conservative per-model pollen prices; your ledger records every run.</p>
</aside>

<style>
  .math {
    padding: 22px 24px;
    background: var(--paper-2);
  }

  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 18px;
    margin: 0 0 16px;
  }

  dt {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: 3px;
  }

  dd {
    margin: 0;
    font-size: 19px;
    font-weight: 600;
    color: var(--green-deep);
  }

  dd small {
    font-size: 12px;
    color: var(--ink-faint);
    font-weight: 400;
  }

  dd.gold {
    color: var(--gold);
  }

  .market {
    font-size: 13.5px;
    margin: 14px 0 10px;
  }

  details {
    font-size: 13.5px;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--green);
  }

  details ul {
    padding-left: 18px;
    margin: 8px 0 0;
  }

  details li {
    margin-bottom: 6px;
  }

  .estimate-note {
    font-size: 11.5px;
    color: var(--ink-faint);
    margin: 14px 0 0;
  }
</style>
