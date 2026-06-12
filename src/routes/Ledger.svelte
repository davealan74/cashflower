<script lang="ts">
  import Flower from '../components/Flower.svelte';
  import { ledger } from '../lib/ledger/store.svelte';
  import { bloomPetals } from '../lib/ledger/roi';
  import { formatMoney, formatPollen } from '../lib/costs';
  import { renderReceipt } from '../lib/receipt';
  import { download } from '../lib/export';
  import { getTrack } from '../lib/tracks';

  let amount = $state('');
  let source = $state('');
  let projectId = $state('');
  let makingReceipt = $state(false);
  let armedDelete = $state('');

  function deleteProject(id: string): void {
    if (armedDelete !== id) {
      armedDelete = id;
      setTimeout(() => {
        if (armedDelete === id) armedDelete = '';
      }, 4000);
      return;
    }
    armedDelete = '';
    ledger.removeProject(id);
  }

  const petals = $derived(bloomPetals(ledger.totals.multiplier));

  async function logIncome(e: Event): Promise<void> {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!projectId || !value || value <= 0) return;
    await ledger.logIncome(projectId, value, source.trim() || 'sale');
    amount = '';
    source = '';
  }

  async function receipt(): Promise<void> {
    makingReceipt = true;
    try {
      const blob = await renderReceipt(ledger.totals, ledger.projects.length);
      download(blob, 'cashflower-harvest-receipt.png');
    } finally {
      makingReceipt = false;
    }
  }

  function fmtDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
</script>

<section class="wrap head fade-up">
  <span class="eyebrow">The ledger</span>
  <h1>Proof of harvest</h1>
  <p class="sub">
    Every pollen planted, every euro-cent harvested, recorded in this browser and nowhere else.
    Break even and the flower opens; hit 1,000× and it's in full bloom.
  </p>
</section>

<section class="wrap top">
  <div class="card bloom-card fade-up">
    <Flower {petals} size={230} label="ROI bloom" />
    {#if ledger.totals.multiplier !== null}
      <p class="mult mono">{ledger.totals.multiplier.toLocaleString()}×</p>
      <p class="mult-sub">return on pollen</p>
    {:else}
      <p class="mult-sub">No pollen planted yet — <a href="#/tracks">run a track</a>.</p>
    {/if}
  </div>

  <div class="stats">
    <div class="card stat fade-up" style="animation-delay:.06s">
      <span class="k mono">pollen planted</span>
      <span class="v mono">{formatPollen(ledger.totals.spent)}</span>
      <span class="s mono">≈ {formatMoney(ledger.totals.spent)} · {ledger.gens.length} generations</span>
    </div>
    <div class="card stat fade-up" style="animation-delay:.12s">
      <span class="k mono">income harvested</span>
      <span class="v mono green">{formatMoney(ledger.totals.earned)}</span>
      <span class="s mono">{ledger.income.length} sales logged</span>
    </div>
    <div class="card stat fade-up" style="animation-delay:.18s">
      <span class="k mono">net</span>
      <span class="v mono" class:green={ledger.totals.net >= 0}>{formatMoney(ledger.totals.net)}</span>
      <span class="s mono">income minus pollen</span>
    </div>
    <button class="btn gold receipt-btn fade-up" style="animation-delay:.24s" onclick={receipt} disabled={makingReceipt}>
      {makingReceipt ? 'Pressing…' : 'Download harvest receipt'}
    </button>
  </div>
</section>

<section class="wrap log">
  <h2>Log a sale</h2>
  {#if ledger.projects.length === 0}
    <p class="empty">Run your first track and your projects appear here, ready to earn.</p>
  {:else}
    <form class="card income-form" onsubmit={logIncome}>
      <select bind:value={projectId} required>
        <option value="" disabled selected>project…</option>
        {#each ledger.byProject as row (row.project.id)}
          <option value={row.project.id}>{row.project.title}</option>
        {/each}
      </select>
      <input type="number" min="0.01" step="0.01" placeholder="amount $" bind:value={amount} required />
      <input type="text" placeholder="source (Etsy, client…)" bind:value={source} />
      <button class="btn small" type="submit">Log it</button>
    </form>
  {/if}
</section>

{#if ledger.byProject.length}
  <section class="wrap table-sec">
    <h2>Projects</h2>
    <div class="card table">
      <div class="thead mono">
        <span>project</span><span>track</span><span>planted</span><span>harvested</span><span>×</span><span></span>
      </div>
      {#each ledger.byProject as row (row.project.id)}
        <div class="trow">
          <span class="title">{row.project.title}<small class="mono"> {fmtDate(row.project.createdAt)}</small></span>
          <span class="mono small-col">{getTrack(row.project.trackId)?.title ?? row.project.trackId}</span>
          <span class="mono">{formatPollen(row.spent)}</span>
          <span class="mono" class:green={row.earned > 0}>{formatMoney(row.earned)}</span>
          <span class="mono gold">{row.multiplier === null ? '—' : `${row.multiplier.toLocaleString()}×`}</span>
          <button
            class="del"
            class:armed={armedDelete === row.project.id}
            title={armedDelete === row.project.id ? 'Click again to delete' : 'Delete project and its entries'}
            aria-label="Delete {row.project.title}"
            onclick={() => deleteProject(row.project.id)}>{armedDelete === row.project.id ? '!' : '×'}</button
          >
        </div>
      {/each}
    </div>
  </section>
{/if}

{#if ledger.income.length}
  <section class="wrap table-sec">
    <h2>Sales</h2>
    <div class="card table sales">
      {#each [...ledger.income].sort((a, b) => b.ts - a.ts) as entry (entry.id)}
        <div class="trow sale">
          <span class="mono">{fmtDate(entry.ts)}</span>
          <span>{ledger.projects.find((p) => p.id === entry.projectId)?.title ?? '—'}</span>
          <span>{entry.source}</span>
          <span class="mono green">{formatMoney(entry.amount)}</span>
          <button class="del" title="Remove entry" aria-label="Remove sale" onclick={() => ledger.removeIncome(entry.id)}>×</button>
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .head {
    padding: 64px 0 30px;
  }

  h1 {
    font-size: clamp(38px, 5vw, 56px);
    color: var(--green-deep);
  }

  .sub {
    max-width: 62ch;
    color: var(--ink-soft);
  }

  .top {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 24px;
    align-items: stretch;
  }

  .bloom-card {
    padding: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--paper-2);
  }

  .mult {
    font-family: var(--font-display);
    font-size: 52px;
    font-weight: 700;
    color: var(--gold);
    margin: 14px 0 0;
  }

  .mult-sub {
    font-size: 13px;
    color: var(--ink-faint);
    margin: 2px 0 0;
  }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .stat {
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
  }

  .k {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .v {
    font-size: 30px;
    font-weight: 600;
    color: var(--green-deep);
  }

  .v.green,
  .green {
    color: #2e7a40;
  }

  .gold {
    color: var(--gold);
  }

  .s {
    font-size: 11.5px;
    color: var(--ink-faint);
  }

  .receipt-btn {
    align-self: stretch;
    justify-content: center;
  }

  .log,
  .table-sec {
    margin-top: 54px;
  }

  h2 {
    font-size: 26px;
    color: var(--green-deep);
  }

  .empty {
    color: var(--ink-faint);
  }

  .income-form {
    display: flex;
    gap: 12px;
    padding: 18px 20px;
    flex-wrap: wrap;
    align-items: center;
  }

  .income-form select {
    width: 220px;
  }

  .income-form input[type='number'] {
    width: 130px;
  }

  .income-form input[type='text'] {
    width: 200px;
  }

  .table {
    overflow: hidden;
  }

  .thead,
  .trow {
    display: grid;
    grid-template-columns: 2fr 1.4fr 0.9fr 0.9fr 0.7fr 40px;
    gap: 12px;
    padding: 13px 22px;
    align-items: center;
  }

  .thead {
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-faint);
    border-bottom: 1.5px dotted var(--line-strong);
  }

  .trow {
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }

  .trow:last-child {
    border-bottom: none;
  }

  .trow .title small {
    color: var(--ink-faint);
    font-size: 11px;
  }

  .small-col {
    font-size: 12px;
    color: var(--ink-soft);
  }

  .sales .sale {
    grid-template-columns: 80px 2fr 1.2fr 1fr 40px;
  }

  .del {
    background: none;
    border: none;
    color: var(--ink-faint);
    font-size: 17px;
    cursor: pointer;
    border-radius: 6px;
    width: 28px;
    height: 28px;
  }

  .del:hover {
    background: rgba(185, 68, 46, 0.12);
    color: var(--poppy);
  }

  .del.armed {
    background: var(--poppy);
    color: var(--paper);
    font-weight: 700;
  }

  @media (max-width: 820px) {
    .top {
      grid-template-columns: 1fr;
    }

    .thead {
      display: none;
    }

    .trow {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
