<script lang="ts">
	import { to } from '#lib/paths.ts';
	import { cards, type Category } from '#lib/catalog.ts';
	import { progress, today } from '#lib/progress.svelte.ts';

	const groups: { cat: Category; label: string }[] = [
		{ cat: 'consonant', label: 'Consonants' },
		{ cat: 'digraph', label: 'Digraphs' },
		{ cat: 'vowel', label: 'Vowels' },
		{ cat: 'blend', label: 'Blends' }
	];

	const byCat = $derived(
		groups.map((g) => {
			const list = cards.filter((c) => c.category === g.cat);
			const tried = list.filter((c) => progress.status(c.id) !== 'new').length;
			const secure = list.filter((c) => progress.status(c.id) === 'secure').length;
			return { ...g, total: list.length, tried, secure };
		})
	);
	const needs = $derived(cards.filter((c) => progress.status(c.id) === 'practice'));
	const secure = $derived(cards.filter((c) => progress.status(c.id) === 'secure'));
	const activity = $derived(progress.activity(14));
	const maxDay = $derived(Math.max(1, ...activity.map((a) => a.count)));

	let newName = $state('');
	let renaming = $state<string | null>(null);
	let renameText = $state('');
	let message = $state('');
	let confirmDialog: HTMLDialogElement | null = $state(null);
	let confirmText = $state('');
	let confirmAction: (() => void) | null = null;

	function ask(text: string, action: () => void) {
		confirmText = text;
		confirmAction = action;
		confirmDialog?.showModal();
	}

	function add(e: SubmitEvent) {
		e.preventDefault();
		if (!newName.trim()) return;
		progress.addLearner(newName);
		message = `Added ${newName.trim()}. They are now the active learner.`;
		newName = '';
	}

	function download() {
		const blob = new Blob([progress.exportJson()], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `sound-garden-backup-${today()}.json`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
		message = 'Backup downloaded. Keep the file somewhere safe.';
	}

	async function restore(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const text = await file.text();
		ask('Restoring replaces all learners and progress on this device with the backup. Continue?', () => {
			try {
				progress.importJson(text);
				message = `Restored ${progress.state.learners.length} learner(s) from ${file.name}.`;
			} catch (err) {
				message = err instanceof Error ? err.message : 'That file could not be restored.';
			}
		});
	}

	const day = (d: string) =>
		new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
	const storageText = $derived(
		progress.persistence === 'indexeddb'
			? 'Saved in this browser on this device.'
			: progress.persistence === 'localstorage'
				? 'Saved in this browser (basic storage).'
				: 'Not saving: this browser blocks storage.'
	);
</script>

<svelte:head><title>Progress · Sound Garden</title></svelte:head>

<div class="wrap">
	<h1 tabindex="-1">Progress</h1>
	<p class="muted">{storageText} Each device keeps its own records. Use a backup to move them.</p>
	<p class="msg" role="status">{message}</p>

	<section class="panel" aria-labelledby="who">
		<h2 id="who">Learners</h2>
		<ul class="learners">
			{#each progress.state.learners as l (l.id)}
				{@const active = l.id === progress.state.activeId}
				<li class:active>
					{#if renaming === l.id}
						<form
							class="inline"
							onsubmit={(e) => {
								e.preventDefault();
								progress.renameLearner(l.id, renameText);
								renaming = null;
							}}
						>
							<label class="sr-only" for="rn-{l.id}">New name</label>
							<input id="rn-{l.id}" bind:value={renameText} maxlength="40" />
							<button class="btn primary" type="submit">Save</button>
							<button class="btn ghost" type="button" onclick={() => (renaming = null)}>Cancel</button>
						</form>
					{:else}
						<span class="lname">{l.name}{#if active}<span class="pill">Active</span>{/if}</span>
						<span class="lbtns">
							{#if !active}
								<button class="btn primary" type="button" onclick={() => progress.switchLearner(l.id)}>
									Switch to<span class="sr-only"> {l.name}</span>
								</button>
							{/if}
							<button
								class="btn ghost"
								type="button"
								onclick={() => {
									renaming = l.id;
									renameText = l.name;
								}}>Rename<span class="sr-only"> {l.name}</span></button
							>
							{#if progress.state.learners.length > 1}
								<button
									class="btn ghost"
									type="button"
									onclick={() => ask(`Remove ${l.name} and all of their progress?`, () => progress.removeLearner(l.id))}
									>Remove<span class="sr-only"> {l.name}</span></button
								>
							{/if}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
		<form class="inline" onsubmit={add}>
			<label for="newname">Add a learner</label>
			<input id="newname" bind:value={newName} maxlength="40" placeholder="First name or nickname" />
			<button class="btn" type="submit">Add</button>
		</form>
	</section>

	<section class="panel" aria-labelledby="sum">
		<h2 id="sum">{progress.learner.name}'s garden</h2>
		<div class="cats">
			{#each byCat as g (g.cat)}
				<div class="cat">
					<h3>{g.label}</h3>
					<p><strong>{g.tried}</strong> of {g.total} tried · <strong>{g.secure}</strong> secure</p>
					<div class="bar" aria-hidden="true">
						<span class="t" style:width="{(g.tried / g.total) * 100}%"></span>
						<span class="s" style:width="{(g.secure / g.total) * 100}%"></span>
					</div>
				</div>
			{/each}
		</div>

		<h3>Last two weeks</h3>
		<ol class="days" aria-label="Cards tried per day, last 14 days">
			{#each activity as a (a.day)}
				<li title="{day(a.day)}: {a.count}">
					<span class="col" style:height="{(a.count / maxDay) * 100}%"></span>
					<span class="sr-only">{day(a.day)}: {a.count} {a.count === 1 ? 'card' : 'cards'}</span>
				</li>
			{/each}
		</ol>

		<div class="lists">
			<div>
				<h3>🌱 Needs practice ({needs.length})</h3>
				{#if needs.length}
					<ul class="links">
						{#each needs as c (c.id)}<li><a href={to(`/sounds/all/${c.id}`)}>{c.spelling} · {c.picture.word}</a></li>{/each}
					</ul>
				{:else}<p class="muted">None marked. Rate cards in the “For grown-ups” panel on each card.</p>{/if}
			</div>
			<div>
				<h3>🌻 Secure ({secure.length})</h3>
				{#if secure.length}
					<ul class="links">
						{#each secure as c (c.id)}<li><a href={to(`/sounds/all/${c.id}`)}>{c.spelling} · {c.picture.word}</a></li>{/each}
					</ul>
				{:else}<p class="muted">None yet.</p>{/if}
			</div>
		</div>
	</section>

	<section class="panel" id="backup" aria-labelledby="bk">
		<h2 id="bk">Backup</h2>
		<p>Download a backup file to keep progress safe, or to move it to another device or browser.</p>
		<div class="row">
			<button class="btn primary" type="button" onclick={download}>⬇ Download backup</button>
			<label class="btn file">
				⬆ Restore from backup
				<input type="file" accept="application/json,.json" onchange={restore} />
			</label>
		</div>
		<h3>Start over</h3>
		<button
			class="btn ghost"
			type="button"
			onclick={() =>
				ask(`Clear all stars and ratings for ${progress.learner.name}? This cannot be undone.`, () =>
					progress.resetLearner(progress.learner.id)
				)}>Reset {progress.learner.name}'s progress</button
		>
	</section>
</div>

<dialog bind:this={confirmDialog} aria-labelledby="cf-h" onclose={() => (confirmAction = null)}>
	<form method="dialog">
		<h2 id="cf-h">Are you sure?</h2>
		<p>{confirmText}</p>
		<div class="row">
			<button class="btn ghost" value="cancel">Cancel</button>
			<button
				class="btn accent"
				value="ok"
				onclick={() => {
					confirmAction?.();
				}}>Yes, continue</button
			>
		</div>
	</form>
</dialog>

<style>
	section {
		margin-top: 16px;
	}
	.msg {
		min-height: 1.5em;
		font-weight: 700;
		color: var(--leaf);
	}
	.learners {
		list-style: none;
		margin: 0 0 16px;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.learners li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 14px;
		border-radius: 16px;
		background: var(--surface-2);
	}
	.learners li.active {
		background: var(--leaf-soft);
	}
	.lname {
		font-weight: 700;
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.lbtns,
	.row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.inline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
	.inline label {
		font-weight: 700;
	}
	input:not([type='file']) {
		min-height: var(--tap);
		padding: 8px 14px;
		border-radius: 12px;
		border: 1.5px solid var(--line);
		background: var(--surface);
	}
	.cats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 20px;
	}
	.cat p {
		margin: 0 0 6px;
	}
	.bar {
		position: relative;
		height: 12px;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 999px;
	}
	.bar .t {
		background: var(--honey);
	}
	.bar .s {
		background: var(--leaf);
	}
	.days {
		list-style: none;
		padding: 0;
		margin: 0 0 20px;
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		gap: 4px;
		height: 72px;
		align-items: end;
	}
	.days li {
		height: 100%;
		display: flex;
		align-items: flex-end;
		background: var(--surface-2);
		border-radius: 6px;
		overflow: hidden;
	}
	.col {
		width: 100%;
		background: var(--leaf);
		border-radius: 6px;
	}
	.lists {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.links {
		padding-left: 1.1em;
		margin: 0;
	}
	.links li {
		padding: 4px 0;
	}
	.file {
		position: relative;
		overflow: hidden;
	}
	.file input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	.file:focus-within {
		outline: 3px solid var(--focus);
		outline-offset: 3px;
	}
	dialog {
		max-width: min(480px, calc(100vw - 32px));
		border: 0;
		border-radius: var(--radius-lg);
		padding: 24px;
		background: var(--surface-opaque);
		color: var(--ink);
		box-shadow: 0 20px 60px #0006;
	}
	dialog::backdrop {
		background: rgb(28 22 18 / 0.45);
		-webkit-backdrop-filter: blur(6px);
		backdrop-filter: blur(6px);
	}
	@media (max-width: 600px) {
		.lists {
			grid-template-columns: 1fr;
		}
	}
</style>
