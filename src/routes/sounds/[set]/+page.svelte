<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Tile from '#lib/components/Tile.svelte';
	import {
		SETS,
		cards,
		cardsInSet,
		familiesIn,
		familyLabel,
		filterCards,
		matchesQuery
	} from '#lib/catalog.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const set = $derived(data.set);

	const ctx = $derived({ today: progress.today, practiced: progress.practiced });
	const inSet = $derived(cardsInSet(set.id, ctx));
	const families = $derived(familiesIn(inSet));

	const family = $derived(page.url.searchParams.get('family'));
	const activeFamily = $derived(family && families.includes(family as never) ? family : null);
	const q = $derived(page.url.searchParams.get('q') ?? '');
	const shown = $derived(filterCards(inSet, activeFamily, q));
	const elsewhere = $derived(q && shown.length === 0 ? cards.filter((c) => matchesQuery(c, q)).length : 0);

	/** Query string carried into card links and back again. */
	function query(f: string | null, text: string) {
		const p = new URLSearchParams();
		if (f) p.set('family', f);
		if (text.trim()) p.set('q', text.trim());
		const s = p.toString();
		return s ? `?${s}` : '';
	}

	let input = $state('');
	// Follow the URL (Back button, chip links) without fighting the typist.
	$effect.pre(() => {
		const fromUrl = q;
		untrack(() => {
			if (fromUrl !== input.trim()) input = fromUrl;
		});
	});
	let timer: ReturnType<typeof setTimeout>;
	function onInput() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			goto(`/sounds/${set.id}${query(activeFamily, input)}`, { replace: true, reset: false });
		}, 180);
	}
	function clearSearch(el: HTMLInputElement | null) {
		input = '';
		goto(`/sounds/${set.id}${query(activeFamily, '')}`, { replace: true, reset: false });
		el?.focus();
	}
	let searchEl: HTMLInputElement | null = $state(null);

	const scope = $derived([set.label, activeFamily ? familyLabel(activeFamily) : null].filter(Boolean).join(' › '));
</script>

<svelte:head><title>{set.label} · Sound Garden</title></svelte:head>

<div class="wrap">
	<div class="head">
		<div>
			<p class="crumb"><a href="/sounds">All sets</a></p>
			<h1 tabindex="-1"><span aria-hidden="true">{set.emoji}</span> {set.label}</h1>
			<p class="muted">{set.blurb}</p>
		</div>
	</div>

	<nav aria-label="Sets">
		<div class="chips">
			{#each SETS as s (s.id)}
				<a class="chip" href="/sounds/{s.id}" aria-current={s.id === set.id ? 'page' : undefined}>
					<span aria-hidden="true">{s.emoji}</span>{s.label}
				</a>
			{/each}
		</div>
	</nav>

	{#if families.length > 1}
		<nav aria-label="Blend families">
			<div class="chips">
				<a class="chip" href="/sounds/{set.id}{query(null, q)}" aria-current={!activeFamily ? 'true' : undefined}
					>All families</a
				>
				{#each families as f (f)}
					<a class="chip" href="/sounds/{set.id}{query(f, q)}" aria-current={activeFamily === f ? 'true' : undefined}>
						{familyLabel(f)}
						<span class="n">{inSet.filter((c) => c.blend?.family === f).length}</span>
					</a>
				{/each}
			</div>
		</nav>
	{/if}

	<div class="tools">
		<div class="search">
			<label for="q">Search in {scope}</label>
			<div class="field">
				<input
					id="q"
					type="search"
					bind:this={searchEl}
					bind:value={input}
					oninput={onInput}
					placeholder="Letters or a picture word"
					autocomplete="off"
					enterkeyhint="search"
				/>
				{#if input}
					<button type="button" class="clear" onclick={() => clearSearch(searchEl)} aria-label="Clear search">✕</button>
				{/if}
			</div>
		</div>
		<p class="count" aria-live="polite">
			{shown.length}
			{shown.length === 1 ? 'card' : 'cards'}{q ? ` matching “${q}”` : ''}
		</p>
	</div>

	{#if shown.length}
		<ul class="grid" aria-label="{scope} cards">
			{#each shown as c (c.id)}
				<li>
					<Tile card={c} status={progress.status(c.id)} href="/sounds/{set.id}/{c.id}{query(activeFamily, q)}" />
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty panel">
			{#if set.id === 'practiced' && !q}
				<p>No practiced cards yet. Press <strong>I tried it!</strong> on a card to add a star.</p>
				<a class="btn primary" href="/sounds/today">Go to today's practice</a>
			{:else if q}
				<p>No cards match “{q}” in {scope}.</p>
				{#if elsewhere}
					<a class="btn primary" href="/sounds/all?q={encodeURIComponent(q)}">
						Show {elsewhere} {elsewhere === 1 ? 'match' : 'matches'} in All sounds
					</a>
				{/if}
			{:else}
				<p>Nothing here yet.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.crumb {
		margin: 0 0 4px;
		font-weight: 700;
	}
	nav {
		margin-top: 8px;
	}
	.tools {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px 24px;
		flex-wrap: wrap;
		margin: 16px 0;
	}
	.search label {
		display: block;
		font-weight: 700;
		margin-bottom: 6px;
	}
	.field {
		position: relative;
		width: min(360px, calc(100vw - 32px));
	}
	input {
		width: 100%;
		min-height: var(--tap);
		padding: 10px 52px 10px 16px;
		border-radius: 14px;
		border: 1.5px solid var(--line);
		background: var(--surface);
	}
	input::-webkit-search-cancel-button {
		display: none;
	}
	.clear {
		position: absolute;
		right: 4px;
		top: 50%;
		translate: 0 -50%;
		width: 42px;
		height: 42px;
		border: 0;
		border-radius: 10px;
		background: var(--surface-2);
	}
	.count {
		margin: 0;
		color: var(--muted);
	}
	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(168px, 44vw), 1fr));
		gap: 12px;
	}
	.grid li {
		display: grid;
	}
	.empty {
		text-align: center;
	}
</style>
