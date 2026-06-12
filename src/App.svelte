<script lang="ts">
  import Nav from './components/Nav.svelte';
  import Landing from './routes/Landing.svelte';
  import Tracks from './routes/Tracks.svelte';
  import Workbench from './routes/Workbench.svelte';
  import Ledger from './routes/Ledger.svelte';
  import Connect from './routes/Connect.svelte';
  import Settings from './routes/Settings.svelte';
  import { router } from './lib/router.svelte';
  import { ledger } from './lib/ledger/store.svelte';

  ledger.load();

  const year = new Date().getFullYear();
</script>

<Nav />

<main>
  {#if router.parts[0] === 'tracks'}
    <Tracks />
  {:else if router.parts[0] === 'track' && router.parts[1]}
    <Workbench trackId={router.parts[1]} />
  {:else if router.parts[0] === 'ledger'}
    <Ledger />
  {:else if router.parts[0] === 'connect'}
    <Connect />
  {:else if router.parts[0] === 'settings'}
    <Settings />
  {:else}
    <Landing />
  {/if}
</main>

<footer>
  <div class="wrap foot">
    <p>
      <strong>Cashflower</strong> — grown by
      <a href="https://techmagic.info" target="_blank" rel="noopener">Dave Alan Caruana / Techmagic</a>
    </p>
    <p class="mono small">
      BYOP · powered by <a href="https://pollinations.ai" target="_blank" rel="noopener">pollinations.ai</a> ·
      <a href="#/settings">settings</a>
    </p>
    <p class="small">© {year} Dave Alan Caruana / Techmagic. Your key and your ledger never leave this browser.</p>
  </div>
</footer>

<style>
  main {
    min-height: calc(100vh - 220px);
  }

  footer {
    border-top: 1px solid var(--line);
    margin-top: 90px;
    background: var(--paper-2);
  }

  .foot {
    padding: 34px 24px 44px;
    font-size: 14px;
  }

  .foot p {
    margin: 0 0 6px;
  }

  .small {
    font-size: 12.5px;
    color: var(--ink-faint);
  }
</style>
