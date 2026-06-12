<script lang="ts">
  import { settings } from '../lib/settings.svelte';
  import { keyStore } from '../lib/auth/keystore.svelte';
  import { ledger } from '../lib/ledger/store.svelte';

  let saved = $state(false);
  let wipeArmed = $state(false);

  function save(): void {
    settings.save();
    saved = true;
    setTimeout(() => (saved = false), 1800);
  }

  async function wipeAll(): Promise<void> {
    if (!wipeArmed) {
      wipeArmed = true;
      setTimeout(() => (wipeArmed = false), 4000);
      return;
    }
    keyStore.clear();
    for (const p of [...ledger.projects]) await ledger.removeProject(p.id);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    wipeArmed = false;
  }
</script>

<section class="wrap head fade-up">
  <span class="eyebrow">Settings</span>
  <h1>Under the counter</h1>
</section>

<section class="wrap grid">
  <div class="card panel">
    <h3>Pollen cost table</h3>
    <p>
      Conservative per-generation estimates used by the ledger and the honest-math panels, in
      pollen (≈ USD). Tune them if your <span class="mono">/account/usage</span> shows different real costs.
    </p>
    <div class="costs">
      {#each Object.keys(settings.costs.image) as model (model)}
        <label class="field">
          <span class="field-label">image · {model}</span>
          <input type="number" step="0.0001" min="0" bind:value={settings.costs.image[model]} class="mono" />
        </label>
      {/each}
      {#each Object.keys(settings.costs.text) as model (model)}
        <label class="field">
          <span class="field-label">text · {model}</span>
          <input type="number" step="0.0001" min="0" bind:value={settings.costs.text[model]} class="mono" />
        </label>
      {/each}
      <label class="field">
        <span class="field-label">audio · per chunk</span>
        <input type="number" step="0.0001" min="0" bind:value={settings.costs.audio} class="mono" />
      </label>
    </div>
    <div class="actions">
      <button class="btn small" onclick={save}>{saved ? 'Saved ✓' : 'Save'}</button>
      <button class="btn ghost small" onclick={() => settings.resetCosts()}>Reset to defaults</button>
    </div>
  </div>

  <div class="card panel">
    <h3>BYOP app id</h3>
    <p>
      The publishable <span class="mono">pk_</span> client id registered for Cashflower at
      <span class="mono">enter.pollinations.ai</span>. When set, the one-click "Connect with
      Pollinations" button appears on the connect page.
    </p>
    <label class="field">
      <span class="field-label">client id</span>
      <input type="text" placeholder="pk_…" bind:value={settings.byopClientId} class="mono" />
    </label>
    <button class="btn small" onclick={save}>{saved ? 'Saved ✓' : 'Save'}</button>
  </div>

  <div class="card panel danger">
    <h3>Start over</h3>
    <p>Disconnects your key and erases the entire ledger from this browser. There is no undo — this data exists nowhere else.</p>
    <button class="btn small wipe" class:armed={wipeArmed} onclick={wipeAll}>
      {wipeArmed ? 'Click again to erase everything' : 'Erase key & ledger'}
    </button>
  </div>
</section>

<style>
  .head {
    padding: 64px 0 26px;
  }

  h1 {
    font-size: clamp(34px, 4.6vw, 50px);
    color: var(--green-deep);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
    align-items: start;
  }

  .panel {
    padding: 26px 28px;
  }

  .panel h3 {
    font-size: 21px;
    color: var(--green-deep);
  }

  .panel p {
    font-size: 14px;
    color: var(--ink-soft);
  }

  .costs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0 16px;
    margin-top: 14px;
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .danger {
    border-color: rgba(185, 68, 46, 0.4);
    grid-column: span 2;
  }

  .wipe {
    background: var(--paper);
    color: var(--poppy);
    border-color: var(--poppy);
    box-shadow: 0 2px 0 var(--poppy);
  }

  .wipe.armed,
  .wipe:hover:not(:disabled) {
    background: var(--poppy);
    color: var(--paper);
    box-shadow: 0 2px 0 #7e2c1d;
    border-color: #7e2c1d;
  }

  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }

    .danger {
      grid-column: span 1;
    }
  }
</style>
