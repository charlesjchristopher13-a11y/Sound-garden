<script lang="ts">
	import { to } from '#lib/paths.ts';
	import { tick } from 'svelte';
	import SoundButton from '#lib/components/SoundButton.svelte';
	import { player } from '#lib/audio.svelte.ts';
	import { POOLS, makeRounds, poolCards, type PoolId, type Round } from '#lib/hunt.ts';
	import type { Card } from '#lib/catalog.ts';
	import { progress } from '#lib/progress.svelte.ts';

	const ROUNDS = 5;

	let poolId = $state<PoolId>('singles');
	let picturesOnly = $state(false);
	let rounds = $state<Round[]>([]);
	let index = $state(0);
	let missed = $state(false);
	let found = $state(false);
	let firstTries = $state(0);
	let feedback = $state('');
	let phase = $state<'setup' | 'round' | 'done'>('setup');

	const pool = $derived(POOLS.find((p) => p.id === poolId)!);
	const available = $derived(
		Object.fromEntries(POOLS.map((p) => [p.id, makeRounds(poolCards(p.id, progress.today), 1).length > 0]))
	);
	const round = $derived(rounds[index]);

	let headingEl: HTMLElement | null = $state(null);
	let nextEl: HTMLElement | null = $state(null);

	const say = (c: Card) => player.play(c.audio.main, 'the mystery sound');

	async function start() {
		rounds = makeRounds(poolCards(poolId, progress.today), ROUNDS);
		index = 0;
		firstTries = 0;
		phase = 'round';
		await beginRound();
	}

	async function beginRound() {
		missed = false;
		found = false;
		feedback = '';
		await tick();
		headingEl?.focus();
		player.preload(round.options.map((o) => o.audio.main));
		if (player.ready) say(round.target);
	}

	async function choose(c: Card) {
		if (found) return;
		if (c.id !== round.target.id) {
			missed = true;
			feedback = 'Not that one. Listen again. You can do it! 🌱';
			say(round.target);
			return;
		}
		found = true;
		if (!missed) firstTries++;
		progress.recordHunt(round.target.id, !missed);
		feedback = `You found it: ${round.target.picture.word}! Say the sounds! ⭐`;
		say(round.target);
		await tick();
		nextEl?.focus();
	}

	async function next() {
		if (index + 1 >= rounds.length) {
			phase = 'done';
			player.stop();
			await tick();
			headingEl?.focus();
			return;
		}
		index++;
		await beginRound();
	}
</script>

<svelte:head><title>Sound Hunt · Sound Garden</title></svelte:head>

<div class="wrap">
	{#if phase === 'setup'}
		<div class="panel setup">
			<h1 tabindex="-1">🎯 Sound Hunt</h1>
			<p>Listen to the mystery sound, then tap the picture that has it. {ROUNDS} rounds.</p>

			<fieldset>
				<legend>Grown-up: choose the sounds</legend>
				<div class="pools">
					{#each POOLS as p (p.id)}
						<label class="pool" class:off={!available[p.id]}>
							<input type="radio" name="pool" value={p.id} bind:group={poolId} disabled={!available[p.id]} />
							<span aria-hidden="true">{p.emoji}</span>
							{p.label}
						</label>
					{/each}
				</div>
			</fieldset>

			<label class="check">
				<input type="checkbox" bind:checked={picturesOnly} />
				Pictures only (hide the letters, so it is all listening)
			</label>

			<button type="button" class="btn accent big" onclick={start}>▶ Start {pool.label}</button>
		</div>
	{:else if phase === 'round' && round}
		<div class="panel game">
			<div class="dots" aria-hidden="true">
				{#each rounds as _, i (i)}
					<span class:done={i < index || (i === index && found)} class:now={i === index}></span>
				{/each}
			</div>
			<h1 tabindex="-1" bind:this={headingEl}>
				<span class="sr-only">Round {index + 1} of {rounds.length}.</span>
				Find my {pool.id === 'singles' ? 'sound' : 'sounds'}!
			</h1>
			<p class="muted">{pool.prompt}</p>

			<SoundButton class="btn primary big" onplay={() => say(round.target)} playing={player.status.playing}>
				<span aria-hidden="true">🔊</span> Listen
			</SoundButton>

			<div class="choices" role="group" aria-label="Pictures">
				{#each round.options as c (c.id)}
					<button
						type="button"
						class="choice"
						class:right={found && c.id === round.target.id}
						class:dim={found && c.id !== round.target.id}
						onclick={() => choose(c)}
						aria-disabled={found}
					>
						<span class="pic" aria-hidden="true">{c.picture.emoji}</span>
						<span class="word">{c.picture.word}</span>
						{#if !picturesOnly}<span class="spell">{c.spelling}</span>{/if}
					</button>
				{/each}
			</div>

			<p class="feedback" role="status">{feedback}</p>

			{#if found}
				<button type="button" class="btn primary big" bind:this={nextEl} onclick={next}>
					{#if index + 1 < rounds.length}Next round <span aria-hidden="true">→</span>{:else}Finish <span aria-hidden="true">🌻</span>{/if}
				</button>
			{/if}
			<button type="button" class="btn ghost quit" onclick={() => ((phase = 'setup'), player.stop())}>
				Change sounds
			</button>
		</div>
	{:else}
		<div class="panel done">
			<p class="flowers" aria-hidden="true">🌻🌻🌻🌻🌻</p>
			<h1 tabindex="-1" bind:this={headingEl}>You grew {rounds.length} sound flowers!</h1>
			<p class="muted">For grown-ups: found on the first try in {firstTries} of {rounds.length} rounds. Results are saved to {progress.learner.name}'s progress.</p>
			<div class="row">
				<button type="button" class="btn accent big" onclick={start}>Play again</button>
				<button type="button" class="btn big" onclick={() => (phase = 'setup')}>Change sounds</button>
				<a class="btn ghost big" href={to(`/sounds`)}>Back to cards</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.panel {
		max-width: 780px;
		margin-inline: auto;
		text-align: center;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 16px 0;
	}
	legend {
		font-weight: 700;
		margin: 0 auto 10px;
	}
	.pools {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 8px;
	}
	.pool {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 56px;
		padding: 8px 14px;
		border-radius: 16px;
		border: 2px solid var(--line);
		background: var(--surface);
		font-weight: 700;
		cursor: pointer;
		text-align: left;
	}
	.pool:has(input:checked) {
		border-color: var(--leaf);
		background: var(--leaf-soft);
	}
	.pool.off {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.pool input,
	.check input {
		width: 22px;
		height: 22px;
		accent-color: var(--leaf);
	}
	.check {
		display: inline-flex;
		gap: 10px;
		align-items: center;
		margin-bottom: 20px;
		cursor: pointer;
		text-align: left;
	}
	.dots {
		display: flex;
		justify-content: center;
		gap: 8px;
		margin-bottom: 12px;
	}
	.dots span {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--line);
	}
	.dots .now {
		outline: 2px solid var(--leaf);
		outline-offset: 2px;
	}
	.dots .done {
		background: var(--leaf);
	}
	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
		margin: 22px 0 10px;
	}
	.choice {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 200px;
		padding: 16px;
		border-radius: var(--radius-lg);
		border: 3px solid var(--line);
		background: var(--surface);
		box-shadow: var(--shadow);
		transition:
			transform 0.15s var(--ease),
			opacity 0.2s,
			border-color 0.2s;
	}
	.choice:active {
		transform: scale(0.97);
	}
	.choice .pic {
		font-size: clamp(4rem, 14vw, 5.5rem);
		line-height: 1.1;
	}
	.choice .word {
		font-size: 1.25rem;
		color: var(--ink-soft);
	}
	.choice .spell {
		font-size: 1.6rem;
		font-weight: 700;
	}
	.choice.right {
		border-color: var(--leaf);
		background: var(--leaf-soft);
		animation: pop 0.4s var(--ease);
	}
	.choice.dim {
		opacity: 0.45;
	}
	@keyframes pop {
		50% {
			transform: scale(1.05);
		}
	}
	.feedback {
		min-height: 1.6em;
		font-weight: 700;
		font-size: 1.2rem;
	}
	.quit {
		display: flex;
		margin: 16px auto 0;
	}
	.flowers {
		font-size: 2.6rem;
		margin: 0;
	}
	.row {
		display: flex;
		gap: 10px;
		justify-content: center;
		flex-wrap: wrap;
	}
</style>
