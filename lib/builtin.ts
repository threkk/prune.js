type Builtin = Readonly<{ [key: string]: boolean }>

export const JS_BUILTINS: Builtin = {
  // Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
  // Values
  Infinity: false,
  NaN: false,
  undefined: false,
  globalThis: false,

  // Function properties
  eval: false,
  isFinite: false,
  isNan: false,
  parseFloat: false,
  parseInt: false,
  decodeURI: false,
  decodeURIComponent: false,
  encodeURI: false,
  encodeURIComponent: false,

  // Fundamental objects
  Object: false,
  Function: false,
  Boolean: false,
  Symbol: false,

  // Error objects
  Error: false,
  AggregateError: false,
  EvalError: false,
  InternalError: false,
  RangeError: false,
  ReferenceError: false,
  SyntaxError: false,
  TypeError: false,
  URIError: false,

  // Numbers and dates
  Number: false,
  BigInt: false,
  Math: false,
  Date: false,

  // Text processing
  String: false,
  RegExp: false,

  // Indexed collections
  Array: false,
  Int8Array: false,
  Uint8Array: false,
  Uint8ClampedArray: false,
  Int16Array: false,
  Uint16Array: false,
  Int32Array: false,
  Uint32Array: false,
  Float32Array: false,
  Float64Array: false,
  BigInt64Array: false,
  BigUint64Array: false,

  // Keyed collection: falses
  Map: false,
  Set: false,
  WeakMap: false,
  WeakSet: false,

  // Structured dat: falsea
  ArrayBuffer: false,
  SharedArrayBuffer: false,
  Atomics: false,
  DataView: false,
  JSON: false,

  // Control abstraction
  Promise: false,
  Generator: false,
  GeneratorFunction: false,
  AsyncFunction: false,

  // Reflection
  Reflect: false,
  Proxy: false,

  // Internationalization
  Intl: false,
  // 'Intl.Collator',
  // 'Intl.DateTimeFormat',
  // 'Intl.ListFormat',
  // 'Intl.NumberFormat',
  // 'Intl.PluralRules',
  // 'Intl.RelativeTimeFormat',
  // 'Intl.Locale',

  // WebAssembly
  WebAssembly: true,
  // 'WebAssembly.Module',
  // 'WebAssembly.Instance',
  // 'WebAssembly.Memory',
  // 'WebAssembly.Table',
  // 'WebAssembly.CompileError',
  // 'WebAssembly.LinkError',
  // 'WebAssembly.RuntimeError',

  // DOM
  window: true,
  document: true,
  navigator: true,
  Worker: true,
  Node: true,
  URL: true,
  Event: true,
  EventTarget: true,
  MutationObserver: true,
  TimeRanges: true,

  // Web APIs https://developer.mozilla.org/en-US/docs/Web/API
  BroadcastChannel: false,
  MessageChannel: false,
  console: true,
  TextDecoder: false,
  TextEncoder: false,
  MediaKeys: true,
  fetch: true,
  Headers: false,
  Request: false,
  Response: false,
  PerformanceEntry: true,
  Geolocation: true,
  Performance: true,
  ImageCapture: true,
  PerformanceObserver: false,
  ResizeObserver: false,
  EventSource: true,
  TouchEvent: true,
  Touch: false,
  Animation: false,
  AnimationEvent: true,
  KeyframeEffect: false,
  Notification: true,
  SharedWorker: false,
  WebSocket: true,
  MessageEvent: false,

  // Node
  process: true,
}
