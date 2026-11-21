<script lang="ts">
	import { cardsInSet, setById, type SetId } from '#lib/catalog.ts';
	import { progress } from '#lib/progress.svelte.ts';

	const groups: { title: string; note?: string; sets: SetId[] }[] = [
		{ title: 'Begin here', sets: ['today', 'start'] },
		{ title: 'Single sounds', sets: ['consonants', 'digraphs', 'vowels'] },
		{ title: 'Blends', note: 'Two or more sounds slid together.', sets: ['two-sound', 'three-plus', 'blends'] },
		{ title: 'Everything', sets: ['all', 'practiced'] }
	];
	const ctx = $derived({ today: progress.today, practiced: progress.practiced });
	const levelText: Record<string, string> = { beginner: 'Beginner', core: 'Core', challenge: 'Extra challenge', mixed: 'Mixed levels' };
</script>

<svelte:head><title>Sounds · Sound Garden</title></svelte:head>

<div class="wrap">
	<h1 tabindex="-1">Pick your sounds</h1>
	<p class="muted lead">Choose a set. New learners do best with <a href="/sounds/start">Start here</a>.</p>

	{#each groups as g (g.title)}
		<section aria-labelledby="g-{g.title}">
			<h2 id="g-{g.title}">{g.title}</h2>
			{#if g.note}<p class="muted">{g.note}</p>{/if}
			<ul class="sets">
				{#each g.sets as id (id)}
					{@const s = setById.get(id)!}
					<li>
						<a href="/sounds/{id}" class="set">
							<span class="se" aria-hidden="true">{s.emoji}</span>
							<span class="body">
								<strong>{s.label}</strong>
								<span class="muted">{s.blurb}</span>
								<span class="row">
									<span class="pill" class:challenge={s.level === 'challenge'}>{levelText[s.level]}</span>
									<span class="n">{cardsInSet(id, ctx).length} cards</span>
								</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.lead {
		margin-bottom: 20px;
	}
	section {
		margin-top: 24px;
	}
	.sets {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 12px;
	}
	.set {
		display: flex;
		gap: 14px;
		height: 100%;
		padding: 18px;
		border-radius: var(--radius);
		background: var(--surface);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		color: var(--ink);
		text-decoration: none;
		transition: transform 0.15s var(--ease);
	}
	.set:hover {
		transform: translateY(-3px);
	}
	.se {
		font-size: 2.2rem;
		line-height: 1;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.body strong {
		font-size: 1.2rem;
	}
	.row {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-top: 6px;
	}
	.n {
		font-size: 0.95rem;
		color: var(--muted);
	}
</style>
