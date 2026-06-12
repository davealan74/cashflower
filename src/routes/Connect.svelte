<script lang="ts">
  import { keyStore } from '../lib/auth/keystore.svelte';
  import { settings } from '../lib/settings.svelte';
  import { buildAuthorizeUrl, looksLikeKey, makeState, parseAuthFragment } from '../lib/auth/byop';
  import { PollinationsClient } from '../lib/api/client';
  import { formatPollen } from '../lib/costs';

  const STATE_KEY = 'cashflower.byop.state';

  let pasted = $state('');
  let remember = $state(false);
  let flash = $state('');
  let balance = $state<number | null>(null);
  let tier = $state<string | null>(null);

  const client = new PollinationsClient(() => keyStore.key);

  // Returning from the authorize flow: the key arrives in the URL fragment.
  $effect(() => {
    const fragment = parseAuthFragment(location.hash);
    if (fragment) {
      const expected = sessionStorage.getItem(STATE_KEY);
      if (expected && fragment.state !== expected) {
        flash = 'Authorization state mismatch — the connect link was stale. Please try again.';
      } else {
        keyStore.set(fragment.apiKey, false);
        flash = 'Connected. Your pollen is live — pick a track and start growing.';
      }
      sessionStorage.removeItem(STATE_KEY);
      history.replaceState(null, '', `${location.pathname}#/connect`);
    }
  });

  $effect(() => {
    if (keyStore.connected) {
      client.balance().then((b) => (balance = b));
      client.account('profile').then((p) => (tier = typeof p?.tier === 'string' ? p.tier : null));
    } else {
      balance = null;
      tier = null;
    }
  });

  function authorize(): void {
    const state = makeState();
    sessionStorage.setItem(STATE_KEY, state);
    // Must byte-match the registered redirect URI (bare origin, no fragment).
    location.href = buildAuthorizeUrl({
      clientId: settings.byopClientId,
      redirectUri: `${location.origin}/`,
      state,
    });
  }

  function pasteKey(e: Event): void {
    e.preventDefault();
    const key = pasted.trim();
    if (!looksLikeKey(key)) {
      flash = 'That does not look like a Pollinations key (pk_… or sk_…).';
      return;
    }
    keyStore.set(key, remember);
    pasted = '';
    flash = 'Connected. Your pollen is live — pick a track and start growing.';
  }
</script>

<section class="wrap head fade-up">
  <span class="eyebrow">Bring your own pollen</span>
  <h1>Connect your Pollinations account</h1>
  <p class="sub">
    Cashflower has no servers. Your key is held in this browser, requests go straight from you to
    Pollinations, and your ledger lives in local storage. Bring your own pollen, keep your own harvest.
  </p>
</section>

<section class="wrap cols">
  <div class="left">
    {#if keyStore.connected}
      <div class="card panel connected fade-up">
        <span class="eyebrow">Connected</span>
        <p class="key-line mono">{keyStore.masked}</p>
        {#if tier || balance !== null}
          <p class="mono meta">
            {#if tier}tier: {tier}{/if}
            {#if balance !== null}
              · balance: {formatPollen(balance)} pollen{/if}
          </p>
        {:else}
          <p class="meta">This key keeps its balance private (no account permission) — generation works regardless.</p>
        {/if}
        <p class="meta">Stored {keyStore.remembered ? 'on this device until you disconnect' : 'for this session only'}.</p>
        <div class="actions">
          <a class="btn gold" href="#/tracks">Pick a track</a>
          <button class="btn ghost" onclick={() => keyStore.clear()}>Disconnect</button>
        </div>
      </div>
    {:else}
      {#if settings.byopClientId}
        <div class="card panel fade-up">
          <span class="eyebrow">One-click connect</span>
          <h3>Authorize with Pollinations</h3>
          <p>
            You'll approve Cashflower on <span class="mono">enter.pollinations.ai</span> and come
            straight back, connected. You set the budget and expiry; you can revoke it any time
            from your Pollinations dashboard.
          </p>
          <button class="btn gold" onclick={authorize}>Connect with Pollinations</button>
        </div>
      {/if}

      <div class="card panel fade-up" style="animation-delay:.08s">
        <span class="eyebrow">{settings.byopClientId ? 'Or paste a key' : 'Paste your key'}</span>
        <h3>Use an existing API key</h3>
        <p>
          Get one free at
          <a href="https://enter.pollinations.ai" target="_blank" rel="noopener">enter.pollinations.ai</a> —
          the hourly pollen grant on a free account is enough to run any track.
        </p>
        <form onsubmit={pasteKey}>
          <input type="text" placeholder="pk_… or sk_…" bind:value={pasted} class="mono" />
          <label class="remember">
            <input type="checkbox" bind:checked={remember} />
            Remember on this device
          </label>
          <button class="btn" type="submit" disabled={!pasted.trim()}>Connect</button>
        </form>
        <p class="warn-sk">
          Browser caution: <span class="mono">sk_</span> keys are server keys — prefer a
          <span class="mono">pk_</span> publishable key, or set a pollen budget on the key first.
        </p>
      </div>
    {/if}
    {#if flash}<p class="flash">{flash}</p>{/if}
  </div>

  <aside class="right">
    <div class="card fine">
      <span class="eyebrow">The fine print</span>
      <ul>
        <li><strong>Your key, your rules.</strong> It never leaves this browser — there is no backend to send it to.</li>
        <li><strong>Sequential by design.</strong> One request at a time, no retry storms, throttle placeholders detected.</li>
        <li>
          <strong>Aligned incentives.</strong> Cashflower enables Pollinations' app-earnings share: a small
          platform-paid bonus on usage, at no extra pollen cost to you. That's how this app earns —
          only when you do.
        </li>
        <li><strong>Leave anytime.</strong> Disconnect wipes the key; Settings wipes the ledger.</li>
      </ul>
    </div>
  </aside>
</section>

<style>
  .head {
    padding: 64px 0 30px;
  }

  h1 {
    font-size: clamp(34px, 4.6vw, 52px);
    color: var(--green-deep);
    max-width: 20ch;
  }

  .sub {
    max-width: 62ch;
    color: var(--ink-soft);
  }

  .cols {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 26px;
    align-items: start;
  }

  .panel {
    padding: 28px 30px;
    margin-bottom: 18px;
  }

  .panel h3 {
    font-size: 22px;
    color: var(--green-deep);
  }

  .panel p {
    font-size: 14.5px;
    color: var(--ink-soft);
  }

  .panel.connected {
    background: var(--paper-2);
  }

  .key-line {
    font-size: 22px;
    font-weight: 600;
    color: var(--green-deep);
    margin: 4px 0 8px;
  }

  .meta {
    font-size: 13px !important;
    color: var(--ink-faint) !important;
    margin: 4px 0;
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 18px;
    flex-wrap: wrap;
  }

  form {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  form input[type='text'] {
    flex: 1;
    min-width: 240px;
  }

  .remember {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13.5px;
    white-space: nowrap;
  }

  .remember input {
    width: auto;
  }

  .warn-sk {
    font-size: 12.5px !important;
    color: var(--ink-faint) !important;
    margin-top: 14px;
  }

  .flash {
    background: rgba(30, 77, 54, 0.1);
    border: 1px solid rgba(30, 77, 54, 0.3);
    border-radius: 10px;
    padding: 13px 18px;
    font-weight: 600;
    color: var(--green-deep);
  }

  .fine {
    padding: 24px 26px;
    background: var(--paper-2);
  }

  .fine ul {
    padding-left: 18px;
    margin: 0;
    font-size: 13.5px;
    color: var(--ink-soft);
  }

  .fine li {
    margin-bottom: 12px;
  }

  @media (max-width: 860px) {
    .cols {
      grid-template-columns: 1fr;
    }
  }
</style>
