<script lang="ts">
  /** The ROI bloom: petals fill as the earnings multiplier grows. */
  let {
    petals = 0,
    total = 12,
    size = 180,
    label = '',
  }: { petals?: number; total?: number; size?: number; label?: string } = $props();

  const angles = $derived(Array.from({ length: total }, (_, i) => (360 / total) * i));
</script>

<div class="flower" style="width:{size}px;height:{size}px" role="img" aria-label={label || `${petals} of ${total} petals in bloom`}>
  <svg viewBox="-70 -70 140 140" width={size} height={size}>
    {#each angles as angle, i (angle)}
      <path
        d="M0 -9 C -13 -20, -13 -45, 0 -58 C 13 -45, 13 -20, 0 -9 Z"
        transform="rotate({angle})"
        class="petal"
        class:open={i < petals}
        style="transition-delay:{i * 70}ms"
      />
    {/each}
    <circle r="9.5" class="heart" />
    <circle r="4" class="heart-dot" />
  </svg>
</div>

<style>
  .flower {
    display: inline-block;
  }

  .petal {
    fill: transparent;
    stroke: var(--line-strong);
    stroke-width: 1.4;
    stroke-dasharray: 2 4;
    transition:
      fill 0.6s var(--ease-bloom),
      stroke 0.6s var(--ease-bloom),
      stroke-dasharray 0.6s;
  }

  .petal.open {
    fill: var(--green);
    stroke: var(--gold);
    stroke-dasharray: none;
  }

  .petal.open:nth-child(3n) {
    fill: var(--gold);
    stroke: var(--green-deep);
  }

  .heart {
    fill: var(--gold-bright);
    stroke: var(--green-deep);
    stroke-width: 1.4;
  }

  .heart-dot {
    fill: var(--green-deep);
  }
</style>
