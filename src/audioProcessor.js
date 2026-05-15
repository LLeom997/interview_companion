// src/audioProcessor.js

const TARGET_RATE = 24000;
const CHUNK_MS = 100;

class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputRate = sampleRate; // global from AudioWorkletGlobalScope
    this.ratio = this.inputRate / TARGET_RATE;
    this.chunkSamples = Math.floor((TARGET_RATE * CHUNK_MS) / 1000);
    this.outBuf = new Int16Array(this.chunkSamples);
    this.outIdx = 0;
    this.readPos = 0; // fractional read position into the input stream
    this.tail = new Float32Array(0); // leftover input samples from prev block
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    // Concatenate tail + new block so resampling crosses block boundaries.
    const merged = new Float32Array(this.tail.length + channel.length);
    merged.set(this.tail, 0);
    merged.set(channel, this.tail.length);

    // Linear-interpolation downsample.
    while (this.readPos + 1 < merged.length) {
      const i = Math.floor(this.readPos);
      const frac = this.readPos - i;
      const sample = merged[i] * (1 - frac) + merged[i + 1] * frac;
      const clamped = Math.max(-1, Math.min(1, sample));
      this.outBuf[this.outIdx++] = clamped < 0
        ? clamped * 0x8000
        : clamped * 0x7fff;

      if (this.outIdx === this.chunkSamples) {
        this.port.postMessage(this.outBuf.buffer.slice(0));
        this.outIdx = 0;
      }
      this.readPos += this.ratio;
    }

    // Keep the unconsumed tail; rebase readPos so it stays within `tail`.
    const consumed = Math.floor(this.readPos);
    this.tail = merged.slice(consumed);
    this.readPos -= consumed;
    return true;
  }
}

registerProcessor("pcm-worklet", PCMWorklet);
