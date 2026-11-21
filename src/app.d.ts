// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}

	// Safari 16.4+: lets Web Audio play while the iPhone ringer switch is on silent.
	interface Navigator {
		audioSession?: { type: 'auto' | 'playback' | 'ambient' | 'transient' | 'transient-solo' | 'play-and-record' };
	}
}

export {};
