<script lang="ts">
  import { router } from '../lib/router.svelte';
  import { keyStore } from '../lib/auth/keystore.svelte';

  const links = [
    { href: '#/tracks', label: 'Tracks', match: /^\/(tracks|track)/ },
    { href: '#/ledger', label: 'Ledger', match: /^\/ledger/ },
  ];
</script>

<header>
  <nav class="wrap bar">
    <a href="#/" class="wordmark">
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="var(--green)" />
        <g fill="var(--paper)">
          <ellipse cx="16" cy="7.5" rx="3" ry="5" />
          <ellipse cx="16" cy="24.5" rx="3" ry="5" />
          <ellipse cx="7.5" cy="16" rx="5" ry="3" />
          <ellipse cx="24.5" cy="16" rx="5" ry="3" />
        </g>
        <circle cx="16" cy="16" r="4" fill="var(--gold-bright)" />
      </svg>
      Cashflower
    </a>
    <div class="links">
      {#each links as l (l.href)}
        <a href={l.href} class:active={l.match.test(router.path)}>{l.label}</a>
      {/each}
      <a href="#/connect" class="key-badge" class:connected={keyStore.connected}>
        <span class="dot" aria-hidden="true"></span>
        {#if keyStore.connected}
          <span class="mono">{keyStore.masked}</span>
        {:else}
          Connect pollen
        {/if}
      </a>
    </div>
  </nav>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: color-mix(in srgb, var(--paper) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 62px;
  }

  .wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 21px;
    color: var(--green-deep);
    text-decoration: none;
    letter-spacing: -0.01em;
  }

  .links {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .links > a {
    text-decoration: none;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 14.5px;
    padding: 8px 14px;
    border-radius: 999px;
    transition: background 0.15s, color 0.15s;
  }

  .links > a:hover {
    background: rgba(30, 77, 54, 0.07);
    color: var(--green-deep);
  }

  .links > a.active {
    color: var(--green-deep);
    background: rgba(30, 77, 54, 0.1);
  }

  .key-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1.5px solid var(--line-strong);
    font-size: 13px !important;
  }

  .key-badge .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--poppy);
  }

  .key-badge.connected .dot {
    background: #3f8d4e;
    box-shadow: 0 0 0 3px rgba(63, 141, 78, 0.2);
  }

  .key-badge.connected {
    border-color: rgba(63, 141, 78, 0.45);
  }

  @media (max-width: 640px) {
    .links > a {
      padding: 8px 10px;
      font-size: 13.5px;
    }
  }
</style>
