<script lang="ts">
  import EarningsMath from '../components/EarningsMath.svelte';
  import { getTrack } from '../lib/tracks';
  import { estimateRunCost, paybackMultiple, type GenJob } from '../lib/tracks/types';
  import { estimateCost, formatMoney, formatPollen } from '../lib/costs';
  import { PollinationsClient, chunkScript } from '../lib/api/client';
  import { ApiError } from '../lib/api/errors';
  import { keyStore } from '../lib/auth/keystore.svelte';
  import { settings } from '../lib/settings.svelte';
  import { ledger } from '../lib/ledger/store.svelte';
  import { renderMd } from '../lib/markdown';
  import { buildZip, download, slugify, type ExportFile } from '../lib/export';
  import type { Project } from '../lib/ledger/roi';

  let { trackId }: { trackId: string } = $props();

  const track = $derived(getTrack(trackId));
  const client = new PollinationsClient(() => keyStore.key);

  interface JobState {
    job: GenJob;
    status: 'pending' | 'running' | 'done' | 'error';
    text?: string;
    mediaUrl?: string;
    mediaBlob?: Blob;
    throttled?: boolean;
    error?: string;
    errorKind?: string;
  }

  let inputs = $state<Record<string, string>>({});
  let jobStates = $state<JobState[]>([]);
  let running = $state(false);
  let project = $state<Project | null>(null);
  let incomeAmount = $state('');
  let incomeSource = $state('');
  let incomeLogged = $state(false);
  let exporting = $state(false);

  $effect(() => {
    if (track) {
      inputs = Object.fromEntries(track.inputs.map((i) => [i.id, i.default ?? '']));
      jobStates = [];
      project = null;
      incomeLogged = false;
    }
  });

  const estimate = $derived(track ? estimateRunCost(track, inputs, settings.costs) : 0);
  const payback = $derived(track ? paybackMultiple(track, estimate) : 0);
  const missingRequired = $derived(
    track ? track.inputs.filter((i) => i.required && !(inputs[i.id] ?? '').trim()).map((i) => i.label) : [],
  );
  const spentSoFar = $derived(
    project ? ledger.gens.filter((g) => g.projectId === project!.id).reduce((s, g) => s + g.costEst, 0) : 0,
  );
  const allDone = $derived(jobStates.length > 0 && jobStates.every((s) => s.status === 'done'));

  function results(): Record<string, string> {
    return Object.fromEntries(jobStates.filter((s) => s.status === 'done' && s.text).map((s) => [s.job.id, s.text!]));
  }

  async function runJob(state: JobState): Promise<void> {
    if (!track || !project) return;
    state.status = 'running';
    state.error = undefined;
    state.throttled = false;
    try {
      const prompt = state.job.prompt(results());
      if (state.job.kind === 'text') {
        state.text = await client.text(prompt);
        await ledger.logGen(project.id, 'text', state.job.model, state.job.label, estimateCost('text', state.job.model, settings.costs));
      } else if (state.job.kind === 'image') {
        const res = await client.image(prompt, {
          model: state.job.model,
          width: state.job.width,
          height: state.job.height,
          seed: Math.floor(Math.random() * 1e9),
        });
        state.mediaUrl = res.url;
        state.mediaBlob = res.blob;
        state.throttled = res.throttled;
        await ledger.logGen(project.id, 'image', state.job.model, state.job.label, estimateCost('image', state.job.model, settings.costs));
      } else {
        const chunks = chunkScript(prompt);
        if (!chunks.length) throw new ApiError('other', 'The script came back empty — regenerate the script first.');
        const blobs: Blob[] = [];
        for (const chunk of chunks) {
          blobs.push(await client.tts(chunk, state.job.voice ?? 'nova'));
        }
        const merged = new Blob(blobs, { type: 'audio/mpeg' });
        state.mediaUrl = URL.createObjectURL(merged);
        state.mediaBlob = merged;
        await ledger.logGen(
          project.id,
          'audio',
          state.job.model,
          state.job.label,
          estimateCost('audio', state.job.model, settings.costs, chunks.length),
        );
      }
      state.status = 'done';
    } catch (e) {
      state.status = 'error';
      state.error = e instanceof Error ? e.message : String(e);
      state.errorKind = e instanceof ApiError ? e.kind : 'other';
    }
  }

  async function run(): Promise<void> {
    if (!track || running || missingRequired.length) return;
    running = true;
    try {
      if (!project) {
        const firstReq = track.inputs.find((i) => i.required);
        const title = (firstReq && inputs[firstReq.id]?.trim()) || track.title;
        project = await ledger.addProject(track.id, title.slice(0, 80));
      }
      jobStates = track.recipe(inputs).map((job) => ({ job, status: 'pending' as const }));
      for (const state of jobStates) {
        await runJob(state);
        if (state.status === 'error' && (state.errorKind === 'payment' || state.errorKind === 'auth')) break;
      }
    } finally {
      running = false;
    }
  }

  async function regen(state: JobState): Promise<void> {
    if (running) return;
    running = true;
    try {
      await runJob(state);
    } finally {
      running = false;
    }
  }

  async function exportZip(): Promise<void> {
    if (!track || exporting) return;
    exporting = true;
    try {
      const files: ExportFile[] = [];
      for (const s of jobStates) {
        if (s.status !== 'done') continue;
        if (s.text) files.push({ name: s.job.filename, data: s.text });
        else if (s.mediaBlob) files.push({ name: s.job.filename, data: new Uint8Array(await s.mediaBlob.arrayBuffer()) });
      }
      const briefLines = track.inputs.map((i) => `- **${i.label}:** ${inputs[i.id] || '—'}`).join('\n');
      files.push({
        name: 'README.md',
        data:
          `# ${track.title} — ${project?.title ?? ''}\n\nProduced with Cashflower (cashflower.cru2.net) on ${new Date().toDateString()}.\n\n` +
          `## Brief\n${briefLines}\n\n## Pollen spent\n${formatPollen(spentSoFar)} (≈ ${formatMoney(spentSoFar)})\n\n` +
          `## Where to sell\n${track.earnings.market}\n`,
      });
      download(buildZip(files), `${slugify(project?.title ?? track.id)}-cashflower.zip`);
    } finally {
      exporting = false;
    }
  }

  async function logIncome(): Promise<void> {
    const amount = parseFloat(incomeAmount);
    if (!project || !amount || amount <= 0) return;
    await ledger.logIncome(project.id, amount, incomeSource.trim() || track?.earnings.market.split(',')[0] || 'sale');
    incomeLogged = true;
    incomeAmount = '';
    incomeSource = '';
  }
</script>

{#if !track}
  <section class="wrap"><p style="padding:80px 0">Unknown track. <a href="#/tracks">Back to the catalogue.</a></p></section>
{:else}
  <section class="wrap head fade-up">
    <a class="crumb mono" href="#/tracks">← catalogue</a>
    <span class="no mono">{track.no}</span>
    <h1>{track.title}</h1>
    <p class="desc">{track.description}</p>
  </section>

  <section class="wrap cols">
    <div class="left">
      <form
        class="card brief"
        onsubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <span class="eyebrow">Your brief</span>
        {#each track.inputs as input (input.id)}
          <label class="field">
            <span class="field-label">{input.label}{input.required ? ' *' : ''}</span>
            {#if input.kind === 'textarea'}
              <textarea bind:value={inputs[input.id]} placeholder={input.placeholder}></textarea>
            {:else if input.kind === 'select'}
              <select bind:value={inputs[input.id]}>
                {#each input.options ?? [] as opt (opt)}
                  <option value={opt}>{opt}</option>
                {/each}
              </select>
            {:else}
              <input type="text" bind:value={inputs[input.id]} placeholder={input.placeholder} />
            {/if}
            {#if input.help}<small class="help">{input.help}</small>{/if}
          </label>
        {/each}

        <div class="run-row">
          {#if !keyStore.connected}
            <a class="btn gold" href="#/connect">Connect your pollen first</a>
          {:else}
            <button class="btn gold" type="submit" disabled={running || missingRequired.length > 0}>
              {#if running}Growing…{:else if jobStates.length}Run again{:else}Generate{/if}
            </button>
          {/if}
          <span class="cost mono">
            this run ≈ {formatPollen(estimate)} pollen ({formatMoney(estimate)})
          </span>
        </div>
        {#if missingRequired.length && keyStore.connected}
          <p class="need mono">needs: {missingRequired.join(', ')}</p>
        {/if}
      </form>

      {#if jobStates.length}
        <div class="jobs">
          {#each jobStates as state, i (state.job.id)}
            <article class="card job" class:err={state.status === 'error'}>
              <header class="job-head">
                <span class="mono job-no">{String(i + 1).padStart(2, '0')}</span>
                <h3>{state.job.label}</h3>
                <span class="status mono {state.status}">
                  {#if state.status === 'running'}<span class="spinner" aria-hidden="true"></span> growing
                  {:else if state.status === 'done'}done
                  {:else if state.status === 'error'}failed
                  {:else}queued{/if}
                </span>
              </header>

              {#if state.status === 'done'}
                {#if state.job.kind === 'image' && state.mediaUrl}
                  <img src={state.mediaUrl} alt={state.job.label} loading="lazy" />
                  {#if state.throttled}
                    <p class="warn">
                      Pollinations sent a throttle placeholder instead of your image (wrong dimensions detected).
                      Wait a few seconds and regenerate this one.
                    </p>
                  {/if}
                {:else if state.job.kind === 'audio' && state.mediaUrl}
                  <audio controls src={state.mediaUrl}></audio>
                {:else if state.text}
                  <div class="md">{@html renderMd(state.text)}</div>
                {/if}
                <div class="job-actions">
                  <button class="btn ghost small" onclick={() => regen(state)} disabled={running}>Regenerate</button>
                  {#if state.text}
                    <button class="btn ghost small" onclick={() => navigator.clipboard.writeText(state.text ?? '')}>Copy text</button>
                  {/if}
                </div>
              {:else if state.status === 'error'}
                <p class="error-msg">{state.error}</p>
                <div class="job-actions">
                  {#if state.errorKind === 'auth'}
                    <a class="btn ghost small" href="#/connect">Reconnect</a>
                  {:else}
                    <button class="btn ghost small" onclick={() => regen(state)} disabled={running}>Try again</button>
                  {/if}
                </div>
              {/if}
            </article>
          {/each}
        </div>

        {#if allDone}
          <div class="card harvest fade-up">
            <span class="eyebrow">Harvest</span>
            <h3>Your deliverable is ready</h3>
            <p class="mono spent">actual pollen logged: {formatPollen(spentSoFar)} (≈ {formatMoney(spentSoFar)})</p>
            <div class="harvest-actions">
              <button class="btn" onclick={exportZip} disabled={exporting}>
                {exporting ? 'Packing…' : 'Export zip'}
              </button>
              <a class="btn ghost" href="#/ledger">View in ledger</a>
            </div>
            <hr class="rule-dotted" />
            {#if incomeLogged}
              <p class="sold">Income logged — your flower just grew. <a href="#/ledger">See it bloom →</a></p>
            {:else}
              <form
                class="income"
                onsubmit={(e) => {
                  e.preventDefault();
                  logIncome();
                }}
              >
                <span class="income-label">Sold it? Log the income:</span>
                <input type="number" min="0.01" step="0.01" placeholder="$" bind:value={incomeAmount} />
                <input type="text" placeholder="source (e.g. Etsy)" bind:value={incomeSource} />
                <button class="btn small" type="submit">Log sale</button>
              </form>
            {/if}
          </div>
        {/if}
      {/if}
    </div>

    <div class="right">
      <EarningsMath {track} runCost={estimate} {payback} />
    </div>
  </section>
{/if}

<style>
  .head {
    padding: 56px 0 28px;
  }

  .crumb {
    font-size: 12px;
    text-decoration: none;
    color: var(--ink-faint);
    display: inline-block;
    margin-bottom: 22px;
  }

  .no {
    display: block;
    font-size: 12px;
    letter-spacing: 0.2em;
    color: var(--poppy);
    margin-bottom: 6px;
  }

  h1 {
    font-size: clamp(34px, 4.6vw, 52px);
    color: var(--green-deep);
  }

  .desc {
    max-width: 68ch;
    color: var(--ink-soft);
  }

  .cols {
    display: grid;
    grid-template-columns: 1.6fr 0.9fr;
    gap: 28px;
    align-items: start;
  }

  .right {
    position: sticky;
    top: 86px;
  }

  .brief {
    padding: 26px 28px;
  }

  .help {
    font-size: 12px;
    color: var(--ink-faint);
  }

  .run-row {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
    margin-top: 6px;
  }

  .cost {
    font-size: 12.5px;
    color: var(--ink-faint);
  }

  .need {
    font-size: 12px;
    color: var(--poppy);
    margin: 10px 0 0;
  }

  .jobs {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
  }

  .job {
    padding: 20px 24px;
  }

  .job.err {
    border-color: rgba(185, 68, 46, 0.5);
  }

  .job-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .job-no {
    color: var(--poppy);
    font-size: 11px;
  }

  .job-head h3 {
    font-size: 17px;
    margin: 0;
    flex: 1;
    color: var(--green-deep);
  }

  .status {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .status.done {
    color: #3f8d4e;
  }

  .status.error {
    color: var(--poppy);
  }

  .spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid var(--gold);
    border-top-color: transparent;
    border-radius: 50%;
    animation: rot 0.7s linear infinite;
    vertical-align: -1px;
  }

  @keyframes rot {
    to {
      transform: rotate(360deg);
    }
  }

  img {
    width: 100%;
    border-radius: 10px;
    margin-top: 14px;
    border: 1px solid var(--line);
  }

  audio {
    width: 100%;
    margin-top: 14px;
  }

  .md {
    margin-top: 10px;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 6px 18px 14px;
    max-height: 420px;
    overflow: auto;
  }

  .job-actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
  }

  .warn {
    background: rgba(184, 137, 43, 0.12);
    border: 1px solid rgba(184, 137, 43, 0.4);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    margin: 12px 0 0;
  }

  .error-msg {
    color: var(--poppy);
    font-size: 14px;
    margin: 10px 0 0;
  }

  .harvest {
    margin-top: 22px;
    padding: 26px 28px;
    background: var(--paper-2);
  }

  .harvest h3 {
    font-size: 22px;
    color: var(--green-deep);
  }

  .spent {
    font-size: 12.5px;
    color: var(--ink-faint);
  }

  .harvest-actions {
    display: flex;
    gap: 12px;
    margin: 16px 0 20px;
    flex-wrap: wrap;
  }

  .income {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 18px;
    flex-wrap: wrap;
  }

  .income-label {
    font-weight: 600;
    font-size: 14px;
  }

  .income input[type='number'] {
    width: 110px;
  }

  .income input[type='text'] {
    width: 180px;
  }

  .sold {
    margin-top: 18px;
    font-weight: 600;
    color: var(--green);
  }

  @media (max-width: 900px) {
    .cols {
      grid-template-columns: 1fr;
    }

    .right {
      position: static;
      order: -1;
    }
  }
</style>
