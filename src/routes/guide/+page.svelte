<script lang="ts">
	import { to } from '#lib/paths.ts';
</script>

<svelte:head><title>Grown-up guide · Sound Garden</title></svelte:head>

<div class="wrap prose">
	<h1 tabindex="-1">Grown-up guide</h1>
	<p class="lead">
		Sound Garden is sound-first phonics practice for kindergarten learners. The child listens, says the sound out
		loud and plays a short listening game. You guide, listen and judge.
	</p>

	<section class="panel">
		<h2>A five-minute session</h2>
		<ol>
			<li>Open <a href={to(`/`)}>Today's practice</a>. It picks the next five sounds on the beginner path.</li>
			<li>On each card, tap <strong>Listen</strong>. For blends, tap each part, then <strong>One at a time</strong>.</li>
			<li>Your child says it out loud. Use the mirror tip under <strong>Your turn!</strong></li>
			<li>Tap <strong>I tried it!</strong> to add a star. Then <strong>Next</strong>.</li>
			<li>Finish with a round of <a href={to(`/play`)}>Sound Hunt</a>.</li>
		</ol>
	</section>

	<section class="panel">
		<h2>Stars and ratings</h2>
		<ul>
			<li><strong>★ Tried</strong>: your child had a go. It counts once a day per card.</li>
			<li>
				<strong>🌱 Needs practice</strong> and <strong>🌻 Secure</strong> are your judgement. Set them in the
				<em>For grown-ups</em> panel on each card. Secure cards leave Today's practice.
			</li>
			<li>Sound Hunt rounds are recorded too. Several misses on a sound mark it as needing practice.</li>
		</ul>
	</section>

	<section class="panel">
		<h2>Choosing content</h2>
		<p>
			Start with <a href={to(`/sounds/start`)}>Start here</a> (s, a, t, p, i, n, m, d, g, k, e, u). Ending blends, longer
			clusters and inflected endings such as <em>-rked</em> are marked <strong>Extra challenge</strong>. Save them
			until single sounds are secure.
		</p>
	</section>

	<section class="panel">
		<h2>Using it on phones, tablets and Chromebooks</h2>
		<ul>
			<li>Add Sound Garden to your home screen. After the first visit it works offline.</li>
			<li>On iPhone and iPad, sound plays even when the silent switch is on. Check the volume buttons if it is quiet.</li>
			<li>
				Keyboard: <kbd>Tab</kbd> moves between controls. On a card, <kbd>←</kbd> and <kbd>→</kbd> go to the previous
				and next card.
			</li>
			<li>Every card has its own link. Bookmark or share it to come straight back.</li>
		</ul>
	</section>

	<section class="panel">
		<h2>Privacy</h2>
		<p>
			There are no accounts, ads or tracking. Learner names and progress stay in this browser on this device. Use
			<a href={to(`/progress#backup`)}>Download backup</a> to keep a copy or move to another device.
		</p>
	</section>

	<section class="panel">
		<h2>About the sounds</h2>
		<p>
			Sound recordings are from <a href="https://phonicademy.com">Phonicademy</a>, used under its
			<a href="https://phonicademy.com/audio-license">audio license</a>. Blend audio joins single-sound clips as a
			practice model. A single recorded voice for connected blends is planned.
		</p>
		<p>
			Further reading:
			<a href="https://media.zaner-bloser.com/reading/superkids-phonemic-awareness/pdfs/TheSuperkidsPhonemicAwareness_Brochure_ZBHR1750.pdf"
				>Superkids phonemic awareness brochure (PDF)</a
			>.
		</p>
	</section>
</div>

<style>
	.prose {
		max-width: 820px;
	}
	.lead {
		font-size: 1.2rem;
	}
	section {
		margin-top: 16px;
	}
	li {
		margin-bottom: 0.4em;
	}
	kbd {
		font: inherit;
		font-weight: 700;
		padding: 0 6px;
		border-radius: 6px;
		border: 1.5px solid var(--line);
		background: var(--surface-2);
	}
</style>
