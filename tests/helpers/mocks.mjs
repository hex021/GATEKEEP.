/**
 * VibeSync Test Mocks & Simulators
 * Provides comprehensive simulation for Web APIs used in VibeSync:
 * HTML5 Audio, Web Audio API, WebGL context, Document PiP, Web Crypto PKCE, and LocalStorage.
 */

import { createHash, randomBytes } from 'node:crypto';

/**
 * Creates a mock HTML5 Audio Element
 */
export function createMockAudioElement(options = {}) {
  const listeners = new Map();
  let currentTime = 0;
  let duration = options.duration || 142; // seconds
  let paused = true;
  let volume = 1.0;
  let muted = false;
  let src = options.src || '';
  let rejectAutoplay = options.rejectAutoplay || false;

  const audio = {
    get currentTime() { return currentTime; },
    set currentTime(val) {
      currentTime = Math.max(0, Math.min(duration, val));
      audio.dispatchEvent('timeupdate');
    },
    get duration() { return duration; },
    set duration(val) { duration = val; },
    get paused() { return paused; },
    get volume() { return volume; },
    set volume(val) { volume = Math.max(0, Math.min(1, val)); },
    get muted() { return muted; },
    set muted(val) { muted = !!val; },
    get src() { return src; },
    set src(val) {
      src = val;
      audio.dispatchEvent('loadstart');
    },
    addEventListener(event, callback) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    removeEventListener(event, callback) {
      if (!listeners.has(event)) return;
      const list = listeners.get(event).filter(cb => cb !== callback);
      listeners.set(event, list);
    },
    dispatchEvent(event, data = {}) {
      if (listeners.has(event)) {
        for (const cb of listeners.get(event)) {
          cb({ type: event, target: audio, ...data });
        }
      }
    },
    async play() {
      if (rejectAutoplay) {
        const err = new Error('play() failed because the user didn\'t interact with the document first.');
        err.name = 'NotAllowedError';
        throw err;
      }
      paused = false;
      audio.dispatchEvent('play');
      return Promise.resolve();
    },
    pause() {
      paused = true;
      audio.dispatchEvent('pause');
    },
    setAutoplayPolicy(shouldReject) {
      rejectAutoplay = shouldReject;
    },
  };

  return audio;
}

/**
 * Creates a mock Web Audio API AudioContext
 */
export function createMockAudioContext() {
  let state = 'running';
  let currentTime = 0;
  const nodes = [];

  class MockAudioNode {
    constructor(type) {
      this.type = type;
      this.connectedTo = [];
      nodes.push(this);
    }
    connect(target) {
      this.connectedTo.push(target);
      return target;
    }
    disconnect() {
      this.connectedTo = [];
    }
  }

  class MockGainNode extends MockAudioNode {
    constructor() {
      super('gain');
      this.gain = {
        value: 1.0,
        setValueAtTime(val) { this.value = val; },
        linearRampToValueAtTime(val) { this.value = val; },
      };
    }
  }

  class MockBiquadFilterNode extends MockAudioNode {
    constructor() {
      super('biquad-filter');
      this.type = 'lowpass';
      this.frequency = {
        value: 1000,
        setValueAtTime(val) { this.value = val; },
      };
      this.Q = { value: 1 };
    }
  }

  class MockAudioBufferSourceNode extends MockAudioNode {
    constructor() {
      super('buffer-source');
      this.buffer = null;
      this.loop = false;
      this.isPlaying = false;
    }
    start() { this.isPlaying = true; }
    stop() { this.isPlaying = false; }
  }

  return {
    get state() { return state; },
    get currentTime() { return currentTime; },
    destination: new MockAudioNode('destination'),
    createGain() { return new MockGainNode(); },
    createBiquadFilter() { return new MockBiquadFilterNode(); },
    createBufferSource() { return new MockAudioBufferSourceNode(); },
    createBuffer(channels, length, sampleRate) {
      const channelData = new Array(channels).fill(0).map(() => new Float32Array(length));
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData: (ch) => channelData[ch] || new Float32Array(length),
      };
    },
    async suspend() {
      state = 'suspended';
      return Promise.resolve();
    },
    async resume() {
      state = 'running';
      return Promise.resolve();
    },
    async close() {
      state = 'closed';
      return Promise.resolve();
    },
    getCreatedNodes() { return nodes; },
  };
}

/**
 * Creates a mock WebGLRenderingContext
 */
export function createMockWebGLContext(options = {}) {
  let contextLost = false;
  const lostListeners = [];
  const restoredListeners = [];

  return {
    preserveDrawingBuffer: options.preserveDrawingBuffer !== false,
    viewport(x, y, w, h) {},
    clearColor(r, g, b, a) {},
    clear(mask) {},
    createShader(type) { return { id: Math.random(), type, source: '' }; },
    shaderSource(shader, source) { shader.source = source; },
    compileShader(shader) { shader.compiled = true; },
    getShaderParameter(shader, pname) { return true; },
    createProgram() { return { id: Math.random(), shaders: [] }; },
    attachShader(program, shader) { program.shaders.push(shader); },
    linkProgram(program) { program.linked = true; },
    getProgramParameter(program, pname) { return true; },
    useProgram(program) {},
    createBuffer() { return { id: Math.random() }; },
    bindBuffer(target, buffer) {},
    bufferData(target, data, usage) {},
    getAttribLocation(program, name) { return 0; },
    enableVertexAttribArray(index) {},
    vertexAttribPointer() {},
    getUniformLocation(program, name) { return { name }; },
    uniform1f(loc, v) {},
    uniform2f(loc, x, y) {},
    uniform3f(loc, x, y, z) {},
    drawArrays(mode, first, count) {},
    isContextLost() { return contextLost; },
    simulateContextLoss() {
      contextLost = true;
      lostListeners.forEach(cb => cb({ preventDefault: () => {} }));
    },
    simulateContextRestored() {
      contextLost = false;
      restoredListeners.forEach(cb => cb());
    },
    canvas: {
      toDataURL(type = 'image/png') {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      },
    },
  };
}

/**
 * Creates a mock Document Picture-in-Picture window
 */
export function createMockDocumentPipEnvironment(options = {}) {
  const supported = options.isSupported !== false;
  let activeWindow = null;

  class MockPipWindow {
    constructor(w = 420, h = 520) {
      this.width = w;
      this.height = h;
      this.listeners = new Map();
      this.document = {
        head: {
          nodes: [],
          appendChild(node) {
            this.nodes.push(node);
            return node;
          },
          querySelectorAll(selector) {
            return this.nodes.filter(n => n.nodeName === selector);
          },
        },
        body: {
          nodes: [],
          style: {},
          appendChild(node) {
            this.nodes.push(node);
            return node;
          },
        },
      };
    }
    addEventListener(event, cb) {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event).push(cb);
    }
    removeEventListener(event, cb) {
      if (!this.listeners.has(event)) return;
      this.listeners.set(event, this.listeners.get(event).filter(c => c !== cb));
    }
    close() {
      if (this.listeners.has('pagehide')) {
        for (const cb of this.listeners.get('pagehide')) cb({ type: 'pagehide' });
      }
      activeWindow = null;
    }
  }

  const pipApi = supported ? {
    async requestWindow(opts = {}) {
      activeWindow = new MockPipWindow(opts.width || 420, opts.height || 520);
      return activeWindow;
    },
    get window() { return activeWindow; },
  } : undefined;

  return {
    supported,
    api: pipApi,
    getActiveWindow: () => activeWindow,
  };
}

/**
 * In-memory LocalStorage mock
 */
export function createMockLocalStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
    get length() { return store.size; },
    key(i) { return Array.from(store.keys())[i] || null; },
  };
}

/**
 * Pure RFC 7636 PKCE Helpers for testing and oracle comparison
 */
export function generateTestPkceVerifier(length = 64) {
  const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomBytesArr = randomBytes(length);
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += validChars[randomBytesArr[i] % validChars.length];
  }
  return verifier;
}

export function generateTestPkceChallenge(verifier) {
  return createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
