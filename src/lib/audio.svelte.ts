import { asset } from '$app/paths';

/**
 * Low-latency sound player.
 *
 * Clips are fetched and decoded once into Web Audio buffers, so a tap plays
 * immediately and repeats are gap-free. Only one sound plays at a time: any
 * new request, or a navigation, stops the current one.
 *
 * Browsers block audio until the first tap. `unlock()` is called from a
 * document-level pointerdown listener, so the first tap anywhere enables sound.
 */

type Status = {
	playing: boolean;
	/** Short text for the visible status line and the screen-reader live region. */
	message: string;
};

const PAUSE_MS = 450;

const url = (path: string) => asset(`audio/${path}` as Parameters<typeof asset>[0]);

class SoundPlayer {
	status = $state<Status>({ playing: false, message: '' });

	#ctx: AudioContext | null = null;
	#buffers = new Map<string, Promise<AudioBuffer>>();
	#source: AudioBufferSourceNode | null = null;
	#element: HTMLAudioElement | null = null;
	#run = 0;
	#timer: ReturnType<typeof setTimeout> | null = null;

	get #supported() {
		return typeof window !== 'undefined' && 'AudioContext' in window;
	}

	#context(): AudioContext | null {
		if (!this.#supported) return null;
		this.#ctx ??= new AudioContext({ latencyHint: 'interactive' });
		return this.#ctx;
	}

	/** True once the browser will play sound without another tap. */
	get ready(): boolean {
		if (!this.#supported) return navigator.userActivation?.hasBeenActive ?? false;
		return this.#ctx?.state === 'running';
	}

	unlock() {
		// Play through the iPhone silent switch, like a media app.
		if (navigator.audioSession) navigator.audioSession.type = 'playback';
		const ctx = this.#context();
		if (ctx && ctx.state !== 'running') void ctx.resume();
	}

	load(path: string): Promise<AudioBuffer> {
		let p = this.#buffers.get(path);
		if (!p) {
			const ctx = this.#context();
			if (!ctx) return Promise.reject(new Error('Web Audio unavailable'));
			p = fetch(url(path))
				.then((r) => {
					if (!r.ok) throw new Error(`${r.status} for ${path}`);
					return r.arrayBuffer();
				})
				.then((b) => ctx.decodeAudioData(b));
			p.catch(() => this.#buffers.delete(path));
			this.#buffers.set(path, p);
		}
		return p;
	}

	/** Warm the cache for clips the child is likely to tap next. */
	preload(paths: (string | undefined)[]) {
		if (!this.#supported) return;
		for (const p of paths) if (p) this.load(p).catch(() => {});
	}

	stop() {
		this.#run++;
		if (this.#timer) clearTimeout(this.#timer);
		this.#timer = null;
		try {
			this.#source?.stop();
		} catch {
			/* already stopped */
		}
		this.#source = null;
		this.#element?.pause();
		this.#element = null;
		if (this.status.playing) this.status = { playing: false, message: '' };
	}

	/**
	 * Play a clip `times` times with a short pause between.
	 * `label` is announced, e.g. "/bl/".
	 */
	async play(path: string, label: string, times = 1) {
		this.stop();
		const run = this.#run;
		this.unlock();
		this.status = { playing: true, message: `Listen: ${label}` };
		try {
			for (let i = 0; i < times; i++) {
				if (run !== this.#run) return;
				await this.#playOnce(path, run);
				if (i < times - 1) await this.#wait(PAUSE_MS, run);
			}
			if (run === this.#run) this.status = { playing: false, message: 'Your turn!' };
		} catch {
			if (run === this.#run)
				this.status = {
					playing: false,
					message: 'The sound did not play. Tap Listen again, and check the volume.'
				};
		}
	}

	#wait(ms: number, run: number) {
		return new Promise<void>((resolve) => {
			this.#timer = setTimeout(() => resolve(), ms);
			if (run !== this.#run) resolve();
		});
	}

	async #playOnce(path: string, run: number) {
		const ctx = this.#context();
		if (!ctx) return this.#playElement(path, run);
		const buffer = await this.load(path);
		if (run !== this.#run) return;
		if (ctx.state !== 'running') await ctx.resume();
		await new Promise<void>((resolve) => {
			const src = ctx.createBufferSource();
			src.buffer = buffer;
			src.connect(ctx.destination);
			src.onended = () => resolve();
			this.#source = src;
			src.start();
		});
	}

	/** Fallback for browsers without Web Audio. */
	#playElement(path: string, run: number) {
		return new Promise<void>((resolve, reject) => {
			if (run !== this.#run) return resolve();
			const el = new Audio(url(path));
			this.#element = el;
			el.onended = () => resolve();
			el.onerror = () => reject(new Error('audio error'));
			el.play().catch(reject);
		});
	}

	/** Shown when a card opens before the first tap, so autoplay was blocked. */
	needTap() {
		this.status = { playing: false, message: 'Tap the 🔊 button to hear it.' };
	}
}

export const player = new SoundPlayer();
