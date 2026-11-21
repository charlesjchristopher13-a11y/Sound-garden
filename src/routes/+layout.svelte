<script lang="ts">
	import '../app.css';
	import { onMount, tick } from 'svelte';
	import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { asset } from '$app/paths';
	import { player } from '#lib/audio.svelte.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		progress.init();
		// The first tap anywhere enables sound for the rest of the visit.
		const unlock = () => player.unlock();
		document.addEventListener('pointerdown', unlock, { capture: true });
		document.addEventListener('keydown', unlock, { capture: true });
		return () => {
			document.removeEventListener('pointerdown', unlock, { capture: true });
			document.removeEventListener('keydown', unlock, { capture: true });
		};
	});

	// Stop the current sound whenever the view changes.
	beforeNavigate(() => player.stop());

	// Smooth cross-fade between views where the browser supports it.
	onNavigate((nav) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (nav.from?.url.pathname === nav.to?.url.pathname) return; // search typing
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});
		});
	});

	// Move focus to the new view so keyboard and screen-reader users land in
	// the right place. Returning from a card focuses that card's tile.
	afterNavigate(async ({ from, to, type }) => {
		if (!from || type === 'enter') return;
		if (from.route.id === to?.route.id) return; // same view, new card or filter
		await tick();
		const cameFromCard = from.route.id === '/sounds/[set]/[card]' && from.params?.card;
		const tile = cameFromCard ? document.getElementById(`tile-${from.params!.card}`) : null;
		if (tile) {
			tile.focus({ preventScroll: true });
			tile.scrollIntoView({ block: 'center' });
		} else {
			document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
		}
	});

	const nav = [
		{ href: '/', label: 'Today', icon: '🌤️', match: (p: string) => p === '/' },
		{ href: '/sounds', label: 'Sounds', icon: '🌿', match: (p: string) => p.startsWith('/sounds') },
		{ href: '/play', label: 'Play', icon: '🎯', match: (p: string) => p.startsWith('/play') }
	];
	const path = $derived(page.url.pathname);
</script>

<a class="skip" href="#main">Skip to content</a>

<header class="top">
	<div class="wrap bar">
		<a class="brand" href="/" aria-label="Sound Garden home">
			<img src={asset('icons/mark.png')} alt="" width="44" height="44" />
			<span>Sound Garden</span>
		</a>
		<nav class="desk" aria-label="Main">
			{#each nav as item (item.href)}
				<a href={item.href} aria-current={item.match(path) ? 'page' : undefined}>
					<span aria-hidden="true">{item.icon}</span>{item.label}
				</a>
			{/each}
		</nav>
		<a class="learner" href="/progress" aria-current={path.startsWith('/progress') ? 'page' : undefined}>
			<span class="sr-only">Progress for</span>
			<span class="name">{progress.learner.name}</span>
			<span class="stars" aria-label="{progress.practiced.size} cards practiced">★ {progress.practiced.size}</span>
		</a>
	</div>
</header>

{#if progress.saveError}
	<div class="wrap">
		<p class="save-error" role="alert">
			{progress.saveError} <a href="/progress#backup">Back up progress</a>
		</p>
	</div>
{/if}

<main id="main" tabindex="-1">
	{@render children()}
</main>

<footer class="foot">
	<div class="wrap">
		<p>
			<a href="/guide">Grown-up guide</a> · <a href="/progress">Progress &amp; backup</a>
		</p>
		<p class="muted small">
			Sound recordings from <a href="https://phonicademy.com">Phonicademy</a>
			(<a href="https://phonicademy.com/audio-license">audio license</a>). Progress is saved only on this
			device.
		</p>
	</div>
</footer>

<nav class="tabs" aria-label="Main">
	{#each nav as item (item.href)}
		<a href={item.href} aria-current={item.match(path) ? 'page' : undefined}>
			<span class="ti" aria-hidden="true">{item.icon}</span>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>

<!-- Announces what is playing, for screen-reader users. -->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{player.status.message}</div>

<style>
	.skip {
		position: absolute;
		left: 12px;
		top: -100px;
		z-index: 100;
		padding: 12px 18px;
		background: var(--ink);
		color: var(--bg);
		border-radius: 12px;
		font-weight: 700;
	}
	.skip:focus {
		top: 12px;
	}
	.top {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--line);
		padding-top: env(safe-area-inset-top);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 16px;
		min-height: 68px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--ink);
		text-decoration: none;
		font-weight: 700;
		font-size: 1.3rem;
		margin-right: auto;
	}
	.brand img {
		width: 44px;
		height: 44px;
	}
	.desk {
		display: flex;
		gap: 4px;
	}
	.desk a {
		display: inline-flex;
		gap: 0.4em;
		align-items: center;
		min-height: var(--tap);
		padding: 0 18px;
		border-radius: 999px;
		color: var(--ink);
		text-decoration: none;
		font-weight: 700;
	}
	.desk a[aria-current='page'] {
		background: var(--leaf);
		color: var(--on-leaf);
	}
	.learner {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-height: var(--tap);
		padding: 0 6px 0 16px;
		border-radius: 999px;
		background: var(--surface);
		border: 1.5px solid var(--line);
		color: var(--ink);
		text-decoration: none;
		font-weight: 700;
		max-width: 46vw;
	}
	.learner .name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.stars {
		flex: none;
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--sun-soft);
	}
	.save-error {
		margin: 12px 0 0;
		padding: 12px 16px;
		border-radius: 14px;
		background: var(--sun-soft);
		border: 1.5px solid var(--sun);
	}
	main {
		padding-block: 24px 48px;
		min-height: 60vh;
	}
	.foot {
		border-top: 1px solid var(--line);
		padding-block: 24px;
		font-size: 1rem;
	}
	.small {
		font-size: 0.95rem;
	}

	.tabs {
		display: none;
	}
	@media (max-width: 720px) {
		.desk {
			display: none;
		}
		.brand span {
			font-size: 1.15rem;
			white-space: nowrap;
		}
		.learner {
			padding-left: 6px;
		}
		/* Keep the name for screen readers; show just the star count. */
		.learner .name {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}
		.tabs {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			position: fixed;
			inset: auto 0 0 0;
			z-index: 30;
			background: color-mix(in srgb, var(--surface) 94%, transparent);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			border-top: 1px solid var(--line);
			padding-bottom: env(safe-area-inset-bottom);
		}
		.tabs a {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 64px;
			color: var(--ink-soft);
			text-decoration: none;
			font-weight: 700;
			font-size: 0.95rem;
		}
		.tabs .ti {
			font-size: 1.5rem;
			line-height: 1.1;
		}
		.tabs a[aria-current='page'] {
			color: var(--ink);
			background: var(--leaf-soft);
		}
		.foot {
			padding-bottom: calc(96px + env(safe-area-inset-bottom));
		}
	}
</style>
