import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/ui/runner.js', import.meta.url), 'utf8');

function fixture() {
  let ms = 0, frame, media;
  const cues = [];
  let ended = 0;
  const context = vm.createContext({
    Audio: class {
      currentTime = 0; ended = false; paused = true; muted = false;
      events = {};
      constructor() { media = this; }
      play() { this.paused = false; return Promise.resolve(); }
      pause() { this.paused = true; }
      addEventListener(name, fn) { this.events[name] = fn; }
    },
    performance: { now: () => ms },
    requestAnimationFrame: fn => { frame = fn; return 1; },
    cancelAnimationFrame: () => { frame = null; },
    setTimeout: () => 1,
    clearTimeout: () => {},
  });
  vm.runInContext(source.replaceAll('export ', ''), context);
  const runner = context.createRunner({
    src: 'test.mp3', cues: [{ t: 1, act: 'first' }, { t: 3.3, act: 'last' }],
    onCue: act => cues.push(act), onSub: () => {}, onEnd: () => ended++,
  });
  return { runner, get media() { return media; }, cues, get ended() { return ended; },
    tick(wall, audioTime = media.currentTime) {
      ms = wall * 1000; media.currentTime = audioTime;
      const fn = frame; frame = null; fn?.();
    } };
}

test('finishes cues beyond the end of a recording without repeating earlier cues', () => {
  const f = fixture(); f.runner.start(); f.tick(1, 1); f.tick(3, 3);
  f.media.ended = true; f.tick(3.1, 3.01); f.tick(3.5, 3.01);
  assert.deepEqual(f.cues, ['first', 'last']); assert.equal(f.ended, 1);
});

test('continues from the audio position after a playback error', () => {
  const f = fixture(); f.runner.start(); f.tick(1, 1); f.media.events.error();
  f.tick(3.5, 1); assert.deepEqual(f.cues, ['first', 'last']);
  assert.equal(f.media.paused, true);
});

test('detects a frozen audio clock even when no error event arrives', () => {
  const f = fixture(); f.runner.start(); f.tick(1, 1); f.tick(2, 1);
  assert.deepEqual(f.cues, ['first']); f.tick(3.5, 1);
  assert.deepEqual(f.cues, ['first', 'last']);
});

test('falls back when audio never starts', () => {
  const f = fixture(); f.runner.start(); f.tick(.5, 0);
  assert.deepEqual(f.cues, []); f.tick(3.5, 0);
  assert.deepEqual(f.cues, ['first', 'last']);
});

test('rewind resets the clock and stop cancels remaining work', () => {
  const f = fixture(); f.runner.start(); f.tick(1, 1);
  f.runner.rewind(); f.runner.start(); f.tick(1.5, .5);
  assert.deepEqual(f.cues, ['first']); f.tick(2.1, 1.1);
  assert.deepEqual(f.cues, ['first', 'first']);
  f.runner.stop(); f.tick(10, 10);
  assert.equal(f.ended, 0); assert.equal(f.media.paused, true);
});
