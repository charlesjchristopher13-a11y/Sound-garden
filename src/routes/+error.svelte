<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>Not found · Sound Garden</title></svelte:head>

<div class="wrap">
	<div class="panel" style="text-align:center;max-width:640px;margin-inline:auto">
		<p style="font-size:3rem;margin:0" aria-hidden="true">🌾</p>
		<h1 tabindex="-1">{page.status === 404 ? 'We could not find that page' : 'Something went wrong'}</h1>
		<p class="muted">{page.error?.message}</p>
		<a class="btn primary big" href="/">Go to today's practice</a>
	</div>
</div>
