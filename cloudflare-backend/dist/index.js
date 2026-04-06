var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
var init_utils = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_performance();
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, isWorkerdProcessV2, unenvProcess, exit, features, platform, env, hrtime3, nextTick, _channel, _disconnect, _events, _eventsCount, _handleQueue, _maxListeners, _pendingMessage, _send, assert, disconnect, mainModule, _debugEnd, _debugProcess, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _linkedBinding, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, dlopen, domain, emit, emitWarning, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, initgroups, kill, listenerCount, listeners, loadEnvFile, memoryUsage, moduleLoadList, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
    unenvProcess = new Process({
      env: globalProcess.env,
      // `hrtime` is only available from workerd process v2
      hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      env: (
        // Always implemented by workerd
        env
      ),
      hrtime: (
        // Only implemented in workerd v2
        hrtime3
      ),
      nextTick: (
        // Always implemented by workerd
        nextTick
      )
    } = unenvProcess);
    ({
      _channel,
      _disconnect,
      _events,
      _eventsCount,
      _handleQueue,
      _maxListeners,
      _pendingMessage,
      _send,
      assert,
      disconnect,
      mainModule
    } = unenvProcess);
    ({
      _debugEnd: (
        // @ts-expect-error `_debugEnd` is missing typings
        _debugEnd
      ),
      _debugProcess: (
        // @ts-expect-error `_debugProcess` is missing typings
        _debugProcess
      ),
      _exiting: (
        // @ts-expect-error `_exiting` is missing typings
        _exiting
      ),
      _fatalException: (
        // @ts-expect-error `_fatalException` is missing typings
        _fatalException
      ),
      _getActiveHandles: (
        // @ts-expect-error `_getActiveHandles` is missing typings
        _getActiveHandles
      ),
      _getActiveRequests: (
        // @ts-expect-error `_getActiveRequests` is missing typings
        _getActiveRequests
      ),
      _kill: (
        // @ts-expect-error `_kill` is missing typings
        _kill
      ),
      _linkedBinding: (
        // @ts-expect-error `_linkedBinding` is missing typings
        _linkedBinding
      ),
      _preload_modules: (
        // @ts-expect-error `_preload_modules` is missing typings
        _preload_modules
      ),
      _rawDebug: (
        // @ts-expect-error `_rawDebug` is missing typings
        _rawDebug
      ),
      _startProfilerIdleNotifier: (
        // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
        _startProfilerIdleNotifier
      ),
      _stopProfilerIdleNotifier: (
        // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
        _stopProfilerIdleNotifier
      ),
      _tickCallback: (
        // @ts-expect-error `_tickCallback` is missing typings
        _tickCallback
      ),
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      availableMemory,
      binding: (
        // @ts-expect-error `binding` is missing typings
        binding
      ),
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      domain: (
        // @ts-expect-error `domain` is missing typings
        domain
      ),
      emit,
      emitWarning,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      initgroups: (
        // @ts-expect-error `initgroups` is missing typings
        initgroups
      ),
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      memoryUsage,
      moduleLoadList: (
        // @ts-expect-error `moduleLoadList` is missing typings
        moduleLoadList
      ),
      off,
      on,
      once,
      openStdin: (
        // @ts-expect-error `openStdin` is missing typings
        openStdin
      ),
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit: (
        // @ts-expect-error `reallyExit` is missing typings
        reallyExit
      ),
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = isWorkerdProcessV2 ? workerdProcess : unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "C:/Users/claud/AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// node_modules/hono/dist/compose.js
var compose;
var init_compose = __esm({
  "node_modules/hono/dist/compose.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
      return (context, next) => {
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
          if (i <= index) {
            throw new Error("next() called multiple times");
          }
          index = i;
          let res;
          let isError = false;
          let handler;
          if (middleware[i]) {
            handler = middleware[i][0][0];
            context.req.routeIndex = i;
          } else {
            handler = i === middleware.length && next || void 0;
          }
          if (handler) {
            try {
              res = await handler(context, () => dispatch(i + 1));
            } catch (err) {
              if (err instanceof Error && onError) {
                context.error = err;
                res = await onError(err, context);
                isError = true;
              } else {
                throw err;
              }
            }
          } else {
            if (context.finalized === false && onNotFound) {
              res = await onNotFound(context);
            }
          }
          if (res && (context.finalized === false || isError)) {
            context.res = res;
          }
          return context;
        }
        __name(dispatch, "dispatch");
      };
    }, "compose");
  }
});

// node_modules/hono/dist/http-exception.js
var init_http_exception = __esm({
  "node_modules/hono/dist/http-exception.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
  }
});

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT;
var init_constants = __esm({
  "node_modules/hono/dist/request/constants.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
  }
});

// node_modules/hono/dist/utils/body.js
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var parseBody, handleParsingAllValues, handleParsingNestedValues;
var init_body = __esm({
  "node_modules/hono/dist/utils/body.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_request();
    parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
      const { all = false, dot = false } = options;
      const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
      const contentType = headers.get("Content-Type");
      if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
        return parseFormData(request, { all, dot });
      }
      return {};
    }, "parseBody");
    __name(parseFormData, "parseFormData");
    __name(convertFormDataToBodyData, "convertFormDataToBodyData");
    handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
      if (form[key] !== void 0) {
        if (Array.isArray(form[key])) {
          ;
          form[key].push(value);
        } else {
          form[key] = [form[key], value];
        }
      } else {
        if (!key.endsWith("[]")) {
          form[key] = value;
        } else {
          form[key] = [value];
        }
      }
    }, "handleParsingAllValues");
    handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
      if (/(?:^|\.)__proto__\./.test(key)) {
        return;
      }
      let nestedForm = form;
      const keys = key.split(".");
      keys.forEach((key2, index) => {
        if (index === keys.length - 1) {
          nestedForm[key2] = value;
        } else {
          if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
            nestedForm[key2] = /* @__PURE__ */ Object.create(null);
          }
          nestedForm = nestedForm[key2];
        }
      });
    }, "handleParsingNestedValues");
  }
});

// node_modules/hono/dist/utils/url.js
var splitPath, splitRoutingPath, extractGroupsFromPath, replaceGroupMarks, patternCache, getPattern, tryDecode, tryDecodeURI, getPath, getPathNoStrict, mergePath, checkOptionalParameter, _decodeURI, _getQueryParam, getQueryParam, getQueryParams, decodeURIComponent_;
var init_url = __esm({
  "node_modules/hono/dist/utils/url.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    splitPath = /* @__PURE__ */ __name((path) => {
      const paths = path.split("/");
      if (paths[0] === "") {
        paths.shift();
      }
      return paths;
    }, "splitPath");
    splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
      const { groups, path } = extractGroupsFromPath(routePath);
      const paths = splitPath(path);
      return replaceGroupMarks(paths, groups);
    }, "splitRoutingPath");
    extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
      const groups = [];
      path = path.replace(/\{[^}]+\}/g, (match2, index) => {
        const mark = `@${index}`;
        groups.push([mark, match2]);
        return mark;
      });
      return { groups, path };
    }, "extractGroupsFromPath");
    replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
      for (let i = groups.length - 1; i >= 0; i--) {
        const [mark] = groups[i];
        for (let j = paths.length - 1; j >= 0; j--) {
          if (paths[j].includes(mark)) {
            paths[j] = paths[j].replace(mark, groups[i][1]);
            break;
          }
        }
      }
      return paths;
    }, "replaceGroupMarks");
    patternCache = {};
    getPattern = /* @__PURE__ */ __name((label, next) => {
      if (label === "*") {
        return "*";
      }
      const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      if (match2) {
        const cacheKey = `${label}#${next}`;
        if (!patternCache[cacheKey]) {
          if (match2[2]) {
            patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
          } else {
            patternCache[cacheKey] = [label, match2[1], true];
          }
        }
        return patternCache[cacheKey];
      }
      return null;
    }, "getPattern");
    tryDecode = /* @__PURE__ */ __name((str, decoder2) => {
      try {
        return decoder2(str);
      } catch {
        return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
          try {
            return decoder2(match2);
          } catch {
            return match2;
          }
        });
      }
    }, "tryDecode");
    tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
    getPath = /* @__PURE__ */ __name((request) => {
      const url = request.url;
      const start = url.indexOf("/", url.indexOf(":") + 4);
      let i = start;
      for (; i < url.length; i++) {
        const charCode = url.charCodeAt(i);
        if (charCode === 37) {
          const queryIndex = url.indexOf("?", i);
          const hashIndex = url.indexOf("#", i);
          const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
          const path = url.slice(start, end);
          return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
        } else if (charCode === 63 || charCode === 35) {
          break;
        }
      }
      return url.slice(start, i);
    }, "getPath");
    getPathNoStrict = /* @__PURE__ */ __name((request) => {
      const result = getPath(request);
      return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
    }, "getPathNoStrict");
    mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
      if (rest.length) {
        sub = mergePath(sub, ...rest);
      }
      return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
    }, "mergePath");
    checkOptionalParameter = /* @__PURE__ */ __name((path) => {
      if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
        return null;
      }
      const segments = path.split("/");
      const results = [];
      let basePath = "";
      segments.forEach((segment) => {
        if (segment !== "" && !/\:/.test(segment)) {
          basePath += "/" + segment;
        } else if (/\:/.test(segment)) {
          if (/\?/.test(segment)) {
            if (results.length === 0 && basePath === "") {
              results.push("/");
            } else {
              results.push(basePath);
            }
            const optionalSegment = segment.replace("?", "");
            basePath += "/" + optionalSegment;
            results.push(basePath);
          } else {
            basePath += "/" + segment;
          }
        }
      });
      return results.filter((v, i, a) => a.indexOf(v) === i);
    }, "checkOptionalParameter");
    _decodeURI = /* @__PURE__ */ __name((value) => {
      if (!/[%+]/.test(value)) {
        return value;
      }
      if (value.indexOf("+") !== -1) {
        value = value.replace(/\+/g, " ");
      }
      return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
    }, "_decodeURI");
    _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
      let encoded;
      if (!multiple && key && !/[%+]/.test(key)) {
        let keyIndex2 = url.indexOf("?", 8);
        if (keyIndex2 === -1) {
          return void 0;
        }
        if (!url.startsWith(key, keyIndex2 + 1)) {
          keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        while (keyIndex2 !== -1) {
          const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
          if (trailingKeyCode === 61) {
            const valueIndex = keyIndex2 + key.length + 2;
            const endIndex = url.indexOf("&", valueIndex);
            return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
          } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
            return "";
          }
          keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url);
        if (!encoded) {
          return void 0;
        }
      }
      const results = {};
      encoded ??= /[%+]/.test(url);
      let keyIndex = url.indexOf("?", 8);
      while (keyIndex !== -1) {
        const nextKeyIndex = url.indexOf("&", keyIndex + 1);
        let valueIndex = url.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
          valueIndex = -1;
        }
        let name = url.slice(
          keyIndex + 1,
          valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
        );
        if (encoded) {
          name = _decodeURI(name);
        }
        keyIndex = nextKeyIndex;
        if (name === "") {
          continue;
        }
        let value;
        if (valueIndex === -1) {
          value = "";
        } else {
          value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
          if (encoded) {
            value = _decodeURI(value);
          }
        }
        if (multiple) {
          if (!(results[name] && Array.isArray(results[name]))) {
            results[name] = [];
          }
          ;
          results[name].push(value);
        } else {
          results[name] ??= value;
        }
      }
      return key ? results[key] : results;
    }, "_getQueryParam");
    getQueryParam = _getQueryParam;
    getQueryParams = /* @__PURE__ */ __name((url, key) => {
      return _getQueryParam(url, key, true);
    }, "getQueryParams");
    decodeURIComponent_ = decodeURIComponent;
  }
});

// node_modules/hono/dist/request.js
var tryDecodeURIComponent, HonoRequest;
var init_request = __esm({
  "node_modules/hono/dist/request.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_http_exception();
    init_constants();
    init_body();
    init_url();
    tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
    HonoRequest = class {
      static {
        __name(this, "HonoRequest");
      }
      /**
       * `.raw` can get the raw Request object.
       *
       * @see {@link https://hono.dev/docs/api/request#raw}
       *
       * @example
       * ```ts
       * // For Cloudflare Workers
       * app.post('/', async (c) => {
       *   const metadata = c.req.raw.cf?.hostMetadata?
       *   ...
       * })
       * ```
       */
      raw;
      #validatedData;
      // Short name of validatedData
      #matchResult;
      routeIndex = 0;
      /**
       * `.path` can get the pathname of the request.
       *
       * @see {@link https://hono.dev/docs/api/request#path}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const pathname = c.req.path // `/about/me`
       * })
       * ```
       */
      path;
      bodyCache = {};
      constructor(request, path = "/", matchResult = [[]]) {
        this.raw = request;
        this.path = path;
        this.#matchResult = matchResult;
        this.#validatedData = {};
      }
      param(key) {
        return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
      }
      #getDecodedParam(key) {
        const paramKey = this.#matchResult[0][this.routeIndex][1][key];
        const param = this.#getParamValue(paramKey);
        return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
      }
      #getAllDecodedParams() {
        const decoded = {};
        const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
        for (const key of keys) {
          const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
          if (value !== void 0) {
            decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
          }
        }
        return decoded;
      }
      #getParamValue(paramKey) {
        return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
      }
      query(key) {
        return getQueryParam(this.url, key);
      }
      queries(key) {
        return getQueryParams(this.url, key);
      }
      header(name) {
        if (name) {
          return this.raw.headers.get(name) ?? void 0;
        }
        const headerData = {};
        this.raw.headers.forEach((value, key) => {
          headerData[key] = value;
        });
        return headerData;
      }
      async parseBody(options) {
        return parseBody(this, options);
      }
      #cachedBody = /* @__PURE__ */ __name((key) => {
        const { bodyCache, raw: raw2 } = this;
        const cachedBody = bodyCache[key];
        if (cachedBody) {
          return cachedBody;
        }
        const anyCachedKey = Object.keys(bodyCache)[0];
        if (anyCachedKey) {
          return bodyCache[anyCachedKey].then((body) => {
            if (anyCachedKey === "json") {
              body = JSON.stringify(body);
            }
            return new Response(body)[key]();
          });
        }
        return bodyCache[key] = raw2[key]();
      }, "#cachedBody");
      /**
       * `.json()` can parse Request body of type `application/json`
       *
       * @see {@link https://hono.dev/docs/api/request#json}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.json()
       * })
       * ```
       */
      json() {
        return this.#cachedBody("text").then((text) => JSON.parse(text));
      }
      /**
       * `.text()` can parse Request body of type `text/plain`
       *
       * @see {@link https://hono.dev/docs/api/request#text}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.text()
       * })
       * ```
       */
      text() {
        return this.#cachedBody("text");
      }
      /**
       * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
       *
       * @see {@link https://hono.dev/docs/api/request#arraybuffer}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.arrayBuffer()
       * })
       * ```
       */
      arrayBuffer() {
        return this.#cachedBody("arrayBuffer");
      }
      /**
       * Parses the request body as a `Blob`.
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.blob();
       * });
       * ```
       * @see https://hono.dev/docs/api/request#blob
       */
      blob() {
        return this.#cachedBody("blob");
      }
      /**
       * Parses the request body as `FormData`.
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.formData();
       * });
       * ```
       * @see https://hono.dev/docs/api/request#formdata
       */
      formData() {
        return this.#cachedBody("formData");
      }
      /**
       * Adds validated data to the request.
       *
       * @param target - The target of the validation.
       * @param data - The validated data to add.
       */
      addValidatedData(target, data) {
        this.#validatedData[target] = data;
      }
      valid(target) {
        return this.#validatedData[target];
      }
      /**
       * `.url()` can get the request url strings.
       *
       * @see {@link https://hono.dev/docs/api/request#url}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const url = c.req.url // `http://localhost:8787/about/me`
       *   ...
       * })
       * ```
       */
      get url() {
        return this.raw.url;
      }
      /**
       * `.method()` can get the method name of the request.
       *
       * @see {@link https://hono.dev/docs/api/request#method}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const method = c.req.method // `GET`
       * })
       * ```
       */
      get method() {
        return this.raw.method;
      }
      get [GET_MATCH_RESULT]() {
        return this.#matchResult;
      }
      /**
       * `.matchedRoutes()` can return a matched route in the handler
       *
       * @deprecated
       *
       * Use matchedRoutes helper defined in "hono/route" instead.
       *
       * @see {@link https://hono.dev/docs/api/request#matchedroutes}
       *
       * @example
       * ```ts
       * app.use('*', async function logger(c, next) {
       *   await next()
       *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
       *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
       *     console.log(
       *       method,
       *       ' ',
       *       path,
       *       ' '.repeat(Math.max(10 - path.length, 0)),
       *       name,
       *       i === c.req.routeIndex ? '<- respond from here' : ''
       *     )
       *   })
       * })
       * ```
       */
      get matchedRoutes() {
        return this.#matchResult[0].map(([[, route]]) => route);
      }
      /**
       * `routePath()` can retrieve the path registered within the handler
       *
       * @deprecated
       *
       * Use routePath helper defined in "hono/route" instead.
       *
       * @see {@link https://hono.dev/docs/api/request#routepath}
       *
       * @example
       * ```ts
       * app.get('/posts/:id', (c) => {
       *   return c.json({ path: c.req.routePath })
       * })
       * ```
       */
      get routePath() {
        return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
      }
    };
  }
});

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase, raw, resolveCallback;
var init_html = __esm({
  "node_modules/hono/dist/utils/html.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    HtmlEscapedCallbackPhase = {
      Stringify: 1,
      BeforeStream: 2,
      Stream: 3
    };
    raw = /* @__PURE__ */ __name((value, callbacks) => {
      const escapedString = new String(value);
      escapedString.isEscaped = true;
      escapedString.callbacks = callbacks;
      return escapedString;
    }, "raw");
    resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
      if (typeof str === "object" && !(str instanceof String)) {
        if (!(str instanceof Promise)) {
          str = str.toString();
        }
        if (str instanceof Promise) {
          str = await str;
        }
      }
      const callbacks = str.callbacks;
      if (!callbacks?.length) {
        return Promise.resolve(str);
      }
      if (buffer) {
        buffer[0] += str;
      } else {
        buffer = [str];
      }
      const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
        (res) => Promise.all(
          res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
        ).then(() => buffer[0])
      );
      if (preserveCallbacks) {
        return raw(await resStr, callbacks);
      } else {
        return resStr;
      }
    }, "resolveCallback");
  }
});

// node_modules/hono/dist/context.js
var TEXT_PLAIN, setDefaultContentType, createResponseInstance, Context;
var init_context = __esm({
  "node_modules/hono/dist/context.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_request();
    init_html();
    TEXT_PLAIN = "text/plain; charset=UTF-8";
    setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
      return {
        "Content-Type": contentType,
        ...headers
      };
    }, "setDefaultContentType");
    createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
    Context = class {
      static {
        __name(this, "Context");
      }
      #rawRequest;
      #req;
      /**
       * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
       *
       * @see {@link https://hono.dev/docs/api/context#env}
       *
       * @example
       * ```ts
       * // Environment object for Cloudflare Workers
       * app.get('*', async c => {
       *   const counter = c.env.COUNTER
       * })
       * ```
       */
      env = {};
      #var;
      finalized = false;
      /**
       * `.error` can get the error object from the middleware if the Handler throws an error.
       *
       * @see {@link https://hono.dev/docs/api/context#error}
       *
       * @example
       * ```ts
       * app.use('*', async (c, next) => {
       *   await next()
       *   if (c.error) {
       *     // do something...
       *   }
       * })
       * ```
       */
      error;
      #status;
      #executionCtx;
      #res;
      #layout;
      #renderer;
      #notFoundHandler;
      #preparedHeaders;
      #matchResult;
      #path;
      /**
       * Creates an instance of the Context class.
       *
       * @param req - The Request object.
       * @param options - Optional configuration options for the context.
       */
      constructor(req, options) {
        this.#rawRequest = req;
        if (options) {
          this.#executionCtx = options.executionCtx;
          this.env = options.env;
          this.#notFoundHandler = options.notFoundHandler;
          this.#path = options.path;
          this.#matchResult = options.matchResult;
        }
      }
      /**
       * `.req` is the instance of {@link HonoRequest}.
       */
      get req() {
        this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
        return this.#req;
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#event}
       * The FetchEvent associated with the current request.
       *
       * @throws Will throw an error if the context does not have a FetchEvent.
       */
      get event() {
        if (this.#executionCtx && "respondWith" in this.#executionCtx) {
          return this.#executionCtx;
        } else {
          throw Error("This context has no FetchEvent");
        }
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#executionctx}
       * The ExecutionContext associated with the current request.
       *
       * @throws Will throw an error if the context does not have an ExecutionContext.
       */
      get executionCtx() {
        if (this.#executionCtx) {
          return this.#executionCtx;
        } else {
          throw Error("This context has no ExecutionContext");
        }
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#res}
       * The Response object for the current request.
       */
      get res() {
        return this.#res ||= createResponseInstance(null, {
          headers: this.#preparedHeaders ??= new Headers()
        });
      }
      /**
       * Sets the Response object for the current request.
       *
       * @param _res - The Response object to set.
       */
      set res(_res) {
        if (this.#res && _res) {
          _res = createResponseInstance(_res.body, _res);
          for (const [k, v] of this.#res.headers.entries()) {
            if (k === "content-type") {
              continue;
            }
            if (k === "set-cookie") {
              const cookies = this.#res.headers.getSetCookie();
              _res.headers.delete("set-cookie");
              for (const cookie of cookies) {
                _res.headers.append("set-cookie", cookie);
              }
            } else {
              _res.headers.set(k, v);
            }
          }
        }
        this.#res = _res;
        this.finalized = true;
      }
      /**
       * `.render()` can create a response within a layout.
       *
       * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
       *
       * @example
       * ```ts
       * app.get('/', (c) => {
       *   return c.render('Hello!')
       * })
       * ```
       */
      render = /* @__PURE__ */ __name((...args) => {
        this.#renderer ??= (content) => this.html(content);
        return this.#renderer(...args);
      }, "render");
      /**
       * Sets the layout for the response.
       *
       * @param layout - The layout to set.
       * @returns The layout function.
       */
      setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
      /**
       * Gets the current layout for the response.
       *
       * @returns The current layout function.
       */
      getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
      /**
       * `.setRenderer()` can set the layout in the custom middleware.
       *
       * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
       *
       * @example
       * ```tsx
       * app.use('*', async (c, next) => {
       *   c.setRenderer((content) => {
       *     return c.html(
       *       <html>
       *         <body>
       *           <p>{content}</p>
       *         </body>
       *       </html>
       *     )
       *   })
       *   await next()
       * })
       * ```
       */
      setRenderer = /* @__PURE__ */ __name((renderer) => {
        this.#renderer = renderer;
      }, "setRenderer");
      /**
       * `.header()` can set headers.
       *
       * @see {@link https://hono.dev/docs/api/context#header}
       *
       * @example
       * ```ts
       * app.get('/welcome', (c) => {
       *   // Set headers
       *   c.header('X-Message', 'Hello!')
       *   c.header('Content-Type', 'text/plain')
       *
       *   return c.body('Thank you for coming')
       * })
       * ```
       */
      header = /* @__PURE__ */ __name((name, value, options) => {
        if (this.finalized) {
          this.#res = createResponseInstance(this.#res.body, this.#res);
        }
        const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
        if (value === void 0) {
          headers.delete(name);
        } else if (options?.append) {
          headers.append(name, value);
        } else {
          headers.set(name, value);
        }
      }, "header");
      status = /* @__PURE__ */ __name((status) => {
        this.#status = status;
      }, "status");
      /**
       * `.set()` can set the value specified by the key.
       *
       * @see {@link https://hono.dev/docs/api/context#set-get}
       *
       * @example
       * ```ts
       * app.use('*', async (c, next) => {
       *   c.set('message', 'Hono is hot!!')
       *   await next()
       * })
       * ```
       */
      set = /* @__PURE__ */ __name((key, value) => {
        this.#var ??= /* @__PURE__ */ new Map();
        this.#var.set(key, value);
      }, "set");
      /**
       * `.get()` can use the value specified by the key.
       *
       * @see {@link https://hono.dev/docs/api/context#set-get}
       *
       * @example
       * ```ts
       * app.get('/', (c) => {
       *   const message = c.get('message')
       *   return c.text(`The message is "${message}"`)
       * })
       * ```
       */
      get = /* @__PURE__ */ __name((key) => {
        return this.#var ? this.#var.get(key) : void 0;
      }, "get");
      /**
       * `.var` can access the value of a variable.
       *
       * @see {@link https://hono.dev/docs/api/context#var}
       *
       * @example
       * ```ts
       * const result = c.var.client.oneMethod()
       * ```
       */
      // c.var.propName is a read-only
      get var() {
        if (!this.#var) {
          return {};
        }
        return Object.fromEntries(this.#var);
      }
      #newResponse(data, arg, headers) {
        const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
        if (typeof arg === "object" && "headers" in arg) {
          const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
          for (const [key, value] of argHeaders) {
            if (key.toLowerCase() === "set-cookie") {
              responseHeaders.append(key, value);
            } else {
              responseHeaders.set(key, value);
            }
          }
        }
        if (headers) {
          for (const [k, v] of Object.entries(headers)) {
            if (typeof v === "string") {
              responseHeaders.set(k, v);
            } else {
              responseHeaders.delete(k);
              for (const v2 of v) {
                responseHeaders.append(k, v2);
              }
            }
          }
        }
        const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
        return createResponseInstance(data, { status, headers: responseHeaders });
      }
      newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
      /**
       * `.body()` can return the HTTP response.
       * You can set headers with `.header()` and set HTTP status code with `.status`.
       * This can also be set in `.text()`, `.json()` and so on.
       *
       * @see {@link https://hono.dev/docs/api/context#body}
       *
       * @example
       * ```ts
       * app.get('/welcome', (c) => {
       *   // Set headers
       *   c.header('X-Message', 'Hello!')
       *   c.header('Content-Type', 'text/plain')
       *   // Set HTTP status code
       *   c.status(201)
       *
       *   // Return the response body
       *   return c.body('Thank you for coming')
       * })
       * ```
       */
      body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
      /**
       * `.text()` can render text as `Content-Type:text/plain`.
       *
       * @see {@link https://hono.dev/docs/api/context#text}
       *
       * @example
       * ```ts
       * app.get('/say', (c) => {
       *   return c.text('Hello!')
       * })
       * ```
       */
      text = /* @__PURE__ */ __name((text, arg, headers) => {
        return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
          text,
          arg,
          setDefaultContentType(TEXT_PLAIN, headers)
        );
      }, "text");
      /**
       * `.json()` can render JSON as `Content-Type:application/json`.
       *
       * @see {@link https://hono.dev/docs/api/context#json}
       *
       * @example
       * ```ts
       * app.get('/api', (c) => {
       *   return c.json({ message: 'Hello!' })
       * })
       * ```
       */
      json = /* @__PURE__ */ __name((object, arg, headers) => {
        return this.#newResponse(
          JSON.stringify(object),
          arg,
          setDefaultContentType("application/json", headers)
        );
      }, "json");
      html = /* @__PURE__ */ __name((html, arg, headers) => {
        const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
        return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
      }, "html");
      /**
       * `.redirect()` can Redirect, default status code is 302.
       *
       * @see {@link https://hono.dev/docs/api/context#redirect}
       *
       * @example
       * ```ts
       * app.get('/redirect', (c) => {
       *   return c.redirect('/')
       * })
       * app.get('/redirect-permanently', (c) => {
       *   return c.redirect('/', 301)
       * })
       * ```
       */
      redirect = /* @__PURE__ */ __name((location, status) => {
        const locationString = String(location);
        this.header(
          "Location",
          // Multibyes should be encoded
          // eslint-disable-next-line no-control-regex
          !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
        );
        return this.newResponse(null, status ?? 302);
      }, "redirect");
      /**
       * `.notFound()` can return the Not Found Response.
       *
       * @see {@link https://hono.dev/docs/api/context#notfound}
       *
       * @example
       * ```ts
       * app.get('/notfound', (c) => {
       *   return c.notFound()
       * })
       * ```
       */
      notFound = /* @__PURE__ */ __name(() => {
        this.#notFoundHandler ??= () => createResponseInstance();
        return this.#notFoundHandler(this);
      }, "notFound");
    };
  }
});

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL, METHOD_NAME_ALL_LOWERCASE, METHODS, MESSAGE_MATCHER_IS_ALREADY_BUILT, UnsupportedPathError;
var init_router = __esm({
  "node_modules/hono/dist/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    METHOD_NAME_ALL = "ALL";
    METHOD_NAME_ALL_LOWERCASE = "all";
    METHODS = ["get", "post", "put", "delete", "options", "patch"];
    MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
    UnsupportedPathError = class extends Error {
      static {
        __name(this, "UnsupportedPathError");
      }
    };
  }
});

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER;
var init_constants2 = __esm({
  "node_modules/hono/dist/utils/constants.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    COMPOSED_HANDLER = "__COMPOSED_HANDLER";
  }
});

// node_modules/hono/dist/hono-base.js
var notFoundHandler, errorHandler, Hono;
var init_hono_base = __esm({
  "node_modules/hono/dist/hono-base.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_compose();
    init_context();
    init_router();
    init_constants2();
    init_url();
    notFoundHandler = /* @__PURE__ */ __name((c) => {
      return c.text("404 Not Found", 404);
    }, "notFoundHandler");
    errorHandler = /* @__PURE__ */ __name((err, c) => {
      if ("getResponse" in err) {
        const res = err.getResponse();
        return c.newResponse(res.body, res);
      }
      console.error(err);
      return c.text("Internal Server Error", 500);
    }, "errorHandler");
    Hono = class _Hono {
      static {
        __name(this, "_Hono");
      }
      get;
      post;
      put;
      delete;
      options;
      patch;
      all;
      on;
      use;
      /*
        This class is like an abstract class and does not have a router.
        To use it, inherit the class and implement router in the constructor.
      */
      router;
      getPath;
      // Cannot use `#` because it requires visibility at JavaScript runtime.
      _basePath = "/";
      #path = "/";
      routes = [];
      constructor(options = {}) {
        const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
        allMethods.forEach((method) => {
          this[method] = (args1, ...args) => {
            if (typeof args1 === "string") {
              this.#path = args1;
            } else {
              this.#addRoute(method, this.#path, args1);
            }
            args.forEach((handler) => {
              this.#addRoute(method, this.#path, handler);
            });
            return this;
          };
        });
        this.on = (method, path, ...handlers) => {
          for (const p of [path].flat()) {
            this.#path = p;
            for (const m of [method].flat()) {
              handlers.map((handler) => {
                this.#addRoute(m.toUpperCase(), this.#path, handler);
              });
            }
          }
          return this;
        };
        this.use = (arg1, ...handlers) => {
          if (typeof arg1 === "string") {
            this.#path = arg1;
          } else {
            this.#path = "*";
            handlers.unshift(arg1);
          }
          handlers.forEach((handler) => {
            this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
          });
          return this;
        };
        const { strict, ...optionsWithoutStrict } = options;
        Object.assign(this, optionsWithoutStrict);
        this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
      }
      #clone() {
        const clone = new _Hono({
          router: this.router,
          getPath: this.getPath
        });
        clone.errorHandler = this.errorHandler;
        clone.#notFoundHandler = this.#notFoundHandler;
        clone.routes = this.routes;
        return clone;
      }
      #notFoundHandler = notFoundHandler;
      // Cannot use `#` because it requires visibility at JavaScript runtime.
      errorHandler = errorHandler;
      /**
       * `.route()` allows grouping other Hono instance in routes.
       *
       * @see {@link https://hono.dev/docs/api/routing#grouping}
       *
       * @param {string} path - base Path
       * @param {Hono} app - other Hono instance
       * @returns {Hono} routed Hono instance
       *
       * @example
       * ```ts
       * const app = new Hono()
       * const app2 = new Hono()
       *
       * app2.get("/user", (c) => c.text("user"))
       * app.route("/api", app2) // GET /api/user
       * ```
       */
      route(path, app2) {
        const subApp = this.basePath(path);
        app2.routes.map((r) => {
          let handler;
          if (app2.errorHandler === errorHandler) {
            handler = r.handler;
          } else {
            handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
            handler[COMPOSED_HANDLER] = r.handler;
          }
          subApp.#addRoute(r.method, r.path, handler);
        });
        return this;
      }
      /**
       * `.basePath()` allows base paths to be specified.
       *
       * @see {@link https://hono.dev/docs/api/routing#base-path}
       *
       * @param {string} path - base Path
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * const api = new Hono().basePath('/api')
       * ```
       */
      basePath(path) {
        const subApp = this.#clone();
        subApp._basePath = mergePath(this._basePath, path);
        return subApp;
      }
      /**
       * `.onError()` handles an error and returns a customized Response.
       *
       * @see {@link https://hono.dev/docs/api/hono#error-handling}
       *
       * @param {ErrorHandler} handler - request Handler for error
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * app.onError((err, c) => {
       *   console.error(`${err}`)
       *   return c.text('Custom Error Message', 500)
       * })
       * ```
       */
      onError = /* @__PURE__ */ __name((handler) => {
        this.errorHandler = handler;
        return this;
      }, "onError");
      /**
       * `.notFound()` allows you to customize a Not Found Response.
       *
       * @see {@link https://hono.dev/docs/api/hono#not-found}
       *
       * @param {NotFoundHandler} handler - request handler for not-found
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * app.notFound((c) => {
       *   return c.text('Custom 404 Message', 404)
       * })
       * ```
       */
      notFound = /* @__PURE__ */ __name((handler) => {
        this.#notFoundHandler = handler;
        return this;
      }, "notFound");
      /**
       * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
       *
       * @see {@link https://hono.dev/docs/api/hono#mount}
       *
       * @param {string} path - base Path
       * @param {Function} applicationHandler - other Request Handler
       * @param {MountOptions} [options] - options of `.mount()`
       * @returns {Hono} mounted Hono instance
       *
       * @example
       * ```ts
       * import { Router as IttyRouter } from 'itty-router'
       * import { Hono } from 'hono'
       * // Create itty-router application
       * const ittyRouter = IttyRouter()
       * // GET /itty-router/hello
       * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
       *
       * const app = new Hono()
       * app.mount('/itty-router', ittyRouter.handle)
       * ```
       *
       * @example
       * ```ts
       * const app = new Hono()
       * // Send the request to another application without modification.
       * app.mount('/app', anotherApp, {
       *   replaceRequest: (req) => req,
       * })
       * ```
       */
      mount(path, applicationHandler, options) {
        let replaceRequest;
        let optionHandler;
        if (options) {
          if (typeof options === "function") {
            optionHandler = options;
          } else {
            optionHandler = options.optionHandler;
            if (options.replaceRequest === false) {
              replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
            } else {
              replaceRequest = options.replaceRequest;
            }
          }
        }
        const getOptions = optionHandler ? (c) => {
          const options2 = optionHandler(c);
          return Array.isArray(options2) ? options2 : [options2];
        } : (c) => {
          let executionContext = void 0;
          try {
            executionContext = c.executionCtx;
          } catch {
          }
          return [c.env, executionContext];
        };
        replaceRequest ||= (() => {
          const mergedPath = mergePath(this._basePath, path);
          const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
          return (request) => {
            const url = new URL(request.url);
            url.pathname = url.pathname.slice(pathPrefixLength) || "/";
            return new Request(url, request);
          };
        })();
        const handler = /* @__PURE__ */ __name(async (c, next) => {
          const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
          if (res) {
            return res;
          }
          await next();
        }, "handler");
        this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
        return this;
      }
      #addRoute(method, path, handler) {
        method = method.toUpperCase();
        path = mergePath(this._basePath, path);
        const r = { basePath: this._basePath, path, method, handler };
        this.router.add(method, path, [handler, r]);
        this.routes.push(r);
      }
      #handleError(err, c) {
        if (err instanceof Error) {
          return this.errorHandler(err, c);
        }
        throw err;
      }
      #dispatch(request, executionCtx, env2, method) {
        if (method === "HEAD") {
          return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
        }
        const path = this.getPath(request, { env: env2 });
        const matchResult = this.router.match(method, path);
        const c = new Context(request, {
          path,
          matchResult,
          env: env2,
          executionCtx,
          notFoundHandler: this.#notFoundHandler
        });
        if (matchResult[0].length === 1) {
          let res;
          try {
            res = matchResult[0][0][0][0](c, async () => {
              c.res = await this.#notFoundHandler(c);
            });
          } catch (err) {
            return this.#handleError(err, c);
          }
          return res instanceof Promise ? res.then(
            (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
          ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
        }
        const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
        return (async () => {
          try {
            const context = await composed(c);
            if (!context.finalized) {
              throw new Error(
                "Context is not finalized. Did you forget to return a Response object or `await next()`?"
              );
            }
            return context.res;
          } catch (err) {
            return this.#handleError(err, c);
          }
        })();
      }
      /**
       * `.fetch()` will be entry point of your app.
       *
       * @see {@link https://hono.dev/docs/api/hono#fetch}
       *
       * @param {Request} request - request Object of request
       * @param {Env} Env - env Object
       * @param {ExecutionContext} - context of execution
       * @returns {Response | Promise<Response>} response of request
       *
       */
      fetch = /* @__PURE__ */ __name((request, ...rest) => {
        return this.#dispatch(request, rest[1], rest[0], request.method);
      }, "fetch");
      /**
       * `.request()` is a useful method for testing.
       * You can pass a URL or pathname to send a GET request.
       * app will return a Response object.
       * ```ts
       * test('GET /hello is ok', async () => {
       *   const res = await app.request('/hello')
       *   expect(res.status).toBe(200)
       * })
       * ```
       * @see https://hono.dev/docs/api/hono#request
       */
      request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
        if (input instanceof Request) {
          return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
        }
        input = input.toString();
        return this.fetch(
          new Request(
            /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
            requestInit
          ),
          Env,
          executionCtx
        );
      }, "request");
      /**
       * `.fire()` automatically adds a global fetch event listener.
       * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
       * @deprecated
       * Use `fire` from `hono/service-worker` instead.
       * ```ts
       * import { Hono } from 'hono'
       * import { fire } from 'hono/service-worker'
       *
       * const app = new Hono()
       * // ...
       * fire(app)
       * ```
       * @see https://hono.dev/docs/api/hono#fire
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
       * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
       */
      fire = /* @__PURE__ */ __name(() => {
        addEventListener("fetch", (event) => {
          event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
        });
      }, "fire");
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/matcher.js
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
var emptyParam;
var init_matcher = __esm({
  "node_modules/hono/dist/router/reg-exp-router/matcher.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router();
    emptyParam = [];
    __name(match, "match");
  }
});

// node_modules/hono/dist/router/reg-exp-router/node.js
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var LABEL_REG_EXP_STR, ONLY_WILDCARD_REG_EXP_STR, TAIL_WILDCARD_REG_EXP_STR, PATH_ERROR, regExpMetaChars, Node;
var init_node = __esm({
  "node_modules/hono/dist/router/reg-exp-router/node.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    LABEL_REG_EXP_STR = "[^/]+";
    ONLY_WILDCARD_REG_EXP_STR = ".*";
    TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
    PATH_ERROR = /* @__PURE__ */ Symbol();
    regExpMetaChars = new Set(".\\+*[^]$()");
    __name(compareKey, "compareKey");
    Node = class _Node {
      static {
        __name(this, "_Node");
      }
      #index;
      #varIndex;
      #children = /* @__PURE__ */ Object.create(null);
      insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
        if (tokens.length === 0) {
          if (this.#index !== void 0) {
            throw PATH_ERROR;
          }
          if (pathErrorCheckOnly) {
            return;
          }
          this.#index = index;
          return;
        }
        const [token, ...restTokens] = tokens;
        const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        let node;
        if (pattern) {
          const name = pattern[1];
          let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
          if (name && pattern[2]) {
            if (regexpStr === ".*") {
              throw PATH_ERROR;
            }
            regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
            if (/\((?!\?:)/.test(regexpStr)) {
              throw PATH_ERROR;
            }
          }
          node = this.#children[regexpStr];
          if (!node) {
            if (Object.keys(this.#children).some(
              (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
            )) {
              throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
              return;
            }
            node = this.#children[regexpStr] = new _Node();
            if (name !== "") {
              node.#varIndex = context.varIndex++;
            }
          }
          if (!pathErrorCheckOnly && name !== "") {
            paramMap.push([name, node.#varIndex]);
          }
        } else {
          node = this.#children[token];
          if (!node) {
            if (Object.keys(this.#children).some(
              (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
            )) {
              throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
              return;
            }
            node = this.#children[token] = new _Node();
          }
        }
        node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
      }
      buildRegExpStr() {
        const childKeys = Object.keys(this.#children).sort(compareKey);
        const strList = childKeys.map((k) => {
          const c = this.#children[k];
          return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
        });
        if (typeof this.#index === "number") {
          strList.unshift(`#${this.#index}`);
        }
        if (strList.length === 0) {
          return "";
        }
        if (strList.length === 1) {
          return strList[0];
        }
        return "(?:" + strList.join("|") + ")";
      }
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie;
var init_trie = __esm({
  "node_modules/hono/dist/router/reg-exp-router/trie.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_node();
    Trie = class {
      static {
        __name(this, "Trie");
      }
      #context = { varIndex: 0 };
      #root = new Node();
      insert(path, index, pathErrorCheckOnly) {
        const paramAssoc = [];
        const groups = [];
        for (let i = 0; ; ) {
          let replaced = false;
          path = path.replace(/\{[^}]+\}/g, (m) => {
            const mark = `@\\${i}`;
            groups[i] = [mark, m];
            i++;
            replaced = true;
            return mark;
          });
          if (!replaced) {
            break;
          }
        }
        const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
        for (let i = groups.length - 1; i >= 0; i--) {
          const [mark] = groups[i];
          for (let j = tokens.length - 1; j >= 0; j--) {
            if (tokens[j].indexOf(mark) !== -1) {
              tokens[j] = tokens[j].replace(mark, groups[i][1]);
              break;
            }
          }
        }
        this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
        return paramAssoc;
      }
      buildRegExp() {
        let regexp = this.#root.buildRegExpStr();
        if (regexp === "") {
          return [/^$/, [], []];
        }
        let captureIndex = 0;
        const indexReplacementMap = [];
        const paramReplacementMap = [];
        regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
          if (handlerIndex !== void 0) {
            indexReplacementMap[++captureIndex] = Number(handlerIndex);
            return "$()";
          }
          if (paramIndex !== void 0) {
            paramReplacementMap[Number(paramIndex)] = ++captureIndex;
            return "";
          }
          return "";
        });
        return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
      }
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/router.js
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var nullMatcher, wildcardRegExpCache, RegExpRouter;
var init_router2 = __esm({
  "node_modules/hono/dist/router/reg-exp-router/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router();
    init_url();
    init_matcher();
    init_node();
    init_trie();
    nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
    wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
    __name(buildWildcardRegExp, "buildWildcardRegExp");
    __name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
    __name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
    __name(findMiddleware, "findMiddleware");
    RegExpRouter = class {
      static {
        __name(this, "RegExpRouter");
      }
      name = "RegExpRouter";
      #middleware;
      #routes;
      constructor() {
        this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
        this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
      }
      add(method, path, handler) {
        const middleware = this.#middleware;
        const routes = this.#routes;
        if (!middleware || !routes) {
          throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        if (!middleware[method]) {
          ;
          [middleware, routes].forEach((handlerMap) => {
            handlerMap[method] = /* @__PURE__ */ Object.create(null);
            Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
              handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
            });
          });
        }
        if (path === "/*") {
          path = "*";
        }
        const paramCount = (path.match(/\/:/g) || []).length;
        if (/\*$/.test(path)) {
          const re = buildWildcardRegExp(path);
          if (method === METHOD_NAME_ALL) {
            Object.keys(middleware).forEach((m) => {
              middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
            });
          } else {
            middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
          }
          Object.keys(middleware).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              Object.keys(middleware[m]).forEach((p) => {
                re.test(p) && middleware[m][p].push([handler, paramCount]);
              });
            }
          });
          Object.keys(routes).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              Object.keys(routes[m]).forEach(
                (p) => re.test(p) && routes[m][p].push([handler, paramCount])
              );
            }
          });
          return;
        }
        const paths = checkOptionalParameter(path) || [path];
        for (let i = 0, len = paths.length; i < len; i++) {
          const path2 = paths[i];
          Object.keys(routes).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              routes[m][path2] ||= [
                ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
              ];
              routes[m][path2].push([handler, paramCount - len + i + 1]);
            }
          });
        }
      }
      match = match;
      buildAllMatchers() {
        const matchers = /* @__PURE__ */ Object.create(null);
        Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
          matchers[method] ||= this.#buildMatcher(method);
        });
        this.#middleware = this.#routes = void 0;
        clearWildcardRegExpCache();
        return matchers;
      }
      #buildMatcher(method) {
        const routes = [];
        let hasOwnRoute = method === METHOD_NAME_ALL;
        [this.#middleware, this.#routes].forEach((r) => {
          const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
          if (ownRoute.length !== 0) {
            hasOwnRoute ||= true;
            routes.push(...ownRoute);
          } else if (method !== METHOD_NAME_ALL) {
            routes.push(
              ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
            );
          }
        });
        if (!hasOwnRoute) {
          return null;
        } else {
          return buildMatcherFromPreprocessedRoutes(routes);
        }
      }
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
var init_prepared_router = __esm({
  "node_modules/hono/dist/router/reg-exp-router/prepared-router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router();
    init_matcher();
    init_router2();
  }
});

// node_modules/hono/dist/router/reg-exp-router/index.js
var init_reg_exp_router = __esm({
  "node_modules/hono/dist/router/reg-exp-router/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router2();
    init_prepared_router();
  }
});

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter;
var init_router3 = __esm({
  "node_modules/hono/dist/router/smart-router/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router();
    SmartRouter = class {
      static {
        __name(this, "SmartRouter");
      }
      name = "SmartRouter";
      #routers = [];
      #routes = [];
      constructor(init) {
        this.#routers = init.routers;
      }
      add(method, path, handler) {
        if (!this.#routes) {
          throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        this.#routes.push([method, path, handler]);
      }
      match(method, path) {
        if (!this.#routes) {
          throw new Error("Fatal error");
        }
        const routers = this.#routers;
        const routes = this.#routes;
        const len = routers.length;
        let i = 0;
        let res;
        for (; i < len; i++) {
          const router = routers[i];
          try {
            for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
              router.add(...routes[i2]);
            }
            res = router.match(method, path);
          } catch (e) {
            if (e instanceof UnsupportedPathError) {
              continue;
            }
            throw e;
          }
          this.match = router.match.bind(router);
          this.#routers = [router];
          this.#routes = void 0;
          break;
        }
        if (i === len) {
          throw new Error("Fatal error");
        }
        this.name = `SmartRouter + ${this.activeRouter.name}`;
        return res;
      }
      get activeRouter() {
        if (this.#routes || this.#routers.length !== 1) {
          throw new Error("No active router has been determined yet.");
        }
        return this.#routers[0];
      }
    };
  }
});

// node_modules/hono/dist/router/smart-router/index.js
var init_smart_router = __esm({
  "node_modules/hono/dist/router/smart-router/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router3();
  }
});

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams, hasChildren, Node2;
var init_node2 = __esm({
  "node_modules/hono/dist/router/trie-router/node.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router();
    init_url();
    emptyParams = /* @__PURE__ */ Object.create(null);
    hasChildren = /* @__PURE__ */ __name((children) => {
      for (const _ in children) {
        return true;
      }
      return false;
    }, "hasChildren");
    Node2 = class _Node2 {
      static {
        __name(this, "_Node");
      }
      #methods;
      #children;
      #patterns;
      #order = 0;
      #params = emptyParams;
      constructor(method, handler, children) {
        this.#children = children || /* @__PURE__ */ Object.create(null);
        this.#methods = [];
        if (method && handler) {
          const m = /* @__PURE__ */ Object.create(null);
          m[method] = { handler, possibleKeys: [], score: 0 };
          this.#methods = [m];
        }
        this.#patterns = [];
      }
      insert(method, path, handler) {
        this.#order = ++this.#order;
        let curNode = this;
        const parts = splitRoutingPath(path);
        const possibleKeys = [];
        for (let i = 0, len = parts.length; i < len; i++) {
          const p = parts[i];
          const nextP = parts[i + 1];
          const pattern = getPattern(p, nextP);
          const key = Array.isArray(pattern) ? pattern[0] : p;
          if (key in curNode.#children) {
            curNode = curNode.#children[key];
            if (pattern) {
              possibleKeys.push(pattern[1]);
            }
            continue;
          }
          curNode.#children[key] = new _Node2();
          if (pattern) {
            curNode.#patterns.push(pattern);
            possibleKeys.push(pattern[1]);
          }
          curNode = curNode.#children[key];
        }
        curNode.#methods.push({
          [method]: {
            handler,
            possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
            score: this.#order
          }
        });
        return curNode;
      }
      #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
        for (let i = 0, len = node.#methods.length; i < len; i++) {
          const m = node.#methods[i];
          const handlerSet = m[method] || m[METHOD_NAME_ALL];
          const processedSet = {};
          if (handlerSet !== void 0) {
            handlerSet.params = /* @__PURE__ */ Object.create(null);
            handlerSets.push(handlerSet);
            if (nodeParams !== emptyParams || params && params !== emptyParams) {
              for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
                const key = handlerSet.possibleKeys[i2];
                const processed = processedSet[handlerSet.score];
                handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
                processedSet[handlerSet.score] = true;
              }
            }
          }
        }
      }
      search(method, path) {
        const handlerSets = [];
        this.#params = emptyParams;
        const curNode = this;
        let curNodes = [curNode];
        const parts = splitPath(path);
        const curNodesQueue = [];
        const len = parts.length;
        let partOffsets = null;
        for (let i = 0; i < len; i++) {
          const part = parts[i];
          const isLast = i === len - 1;
          const tempNodes = [];
          for (let j = 0, len2 = curNodes.length; j < len2; j++) {
            const node = curNodes[j];
            const nextNode = node.#children[part];
            if (nextNode) {
              nextNode.#params = node.#params;
              if (isLast) {
                if (nextNode.#children["*"]) {
                  this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
                }
                this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
              } else {
                tempNodes.push(nextNode);
              }
            }
            for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
              const pattern = node.#patterns[k];
              const params = node.#params === emptyParams ? {} : { ...node.#params };
              if (pattern === "*") {
                const astNode = node.#children["*"];
                if (astNode) {
                  this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
                  astNode.#params = params;
                  tempNodes.push(astNode);
                }
                continue;
              }
              const [key, name, matcher] = pattern;
              if (!part && !(matcher instanceof RegExp)) {
                continue;
              }
              const child = node.#children[key];
              if (matcher instanceof RegExp) {
                if (partOffsets === null) {
                  partOffsets = new Array(len);
                  let offset = path[0] === "/" ? 1 : 0;
                  for (let p = 0; p < len; p++) {
                    partOffsets[p] = offset;
                    offset += parts[p].length + 1;
                  }
                }
                const restPathString = path.substring(partOffsets[i]);
                const m = matcher.exec(restPathString);
                if (m) {
                  params[name] = m[0];
                  this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
                  if (hasChildren(child.#children)) {
                    child.#params = params;
                    const componentCount = m[0].match(/\//)?.length ?? 0;
                    const targetCurNodes = curNodesQueue[componentCount] ||= [];
                    targetCurNodes.push(child);
                  }
                  continue;
                }
              }
              if (matcher === true || matcher.test(part)) {
                params[name] = part;
                if (isLast) {
                  this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
                  if (child.#children["*"]) {
                    this.#pushHandlerSets(
                      handlerSets,
                      child.#children["*"],
                      method,
                      params,
                      node.#params
                    );
                  }
                } else {
                  child.#params = params;
                  tempNodes.push(child);
                }
              }
            }
          }
          const shifted = curNodesQueue.shift();
          curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
        }
        if (handlerSets.length > 1) {
          handlerSets.sort((a, b) => {
            return a.score - b.score;
          });
        }
        return [handlerSets.map(({ handler, params }) => [handler, params])];
      }
    };
  }
});

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter;
var init_router4 = __esm({
  "node_modules/hono/dist/router/trie-router/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_url();
    init_node2();
    TrieRouter = class {
      static {
        __name(this, "TrieRouter");
      }
      name = "TrieRouter";
      #node;
      constructor() {
        this.#node = new Node2();
      }
      add(method, path, handler) {
        const results = checkOptionalParameter(path);
        if (results) {
          for (let i = 0, len = results.length; i < len; i++) {
            this.#node.insert(method, results[i], handler);
          }
          return;
        }
        this.#node.insert(method, path, handler);
      }
      match(method, path) {
        return this.#node.search(method, path);
      }
    };
  }
});

// node_modules/hono/dist/router/trie-router/index.js
var init_trie_router = __esm({
  "node_modules/hono/dist/router/trie-router/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_router4();
  }
});

// node_modules/hono/dist/hono.js
var Hono2;
var init_hono = __esm({
  "node_modules/hono/dist/hono.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_hono_base();
    init_reg_exp_router();
    init_smart_router();
    init_trie_router();
    Hono2 = class extends Hono {
      static {
        __name(this, "Hono");
      }
      /**
       * Creates an instance of the Hono class.
       *
       * @param options - Optional configuration options for the Hono instance.
       */
      constructor(options = {}) {
        super(options);
        this.router = options.router ?? new SmartRouter({
          routers: [new RegExpRouter(), new TrieRouter()]
        });
      }
    };
  }
});

// node_modules/hono/dist/index.js
var init_dist = __esm({
  "node_modules/hono/dist/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_hono();
  }
});

// node-built-in-modules:events
import libDefault from "events";
var require_events = __commonJS({
  "node-built-in-modules:events"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault;
  }
});

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/postgres-array/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    exports.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      static {
        __name(this, "ArrayParser");
      }
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
    __name(identity, "identity");
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg-types/lib/arrayParser.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var array = require_postgres_array();
    module.exports = {
      create: /* @__PURE__ */ __name(function(source, transform) {
        return {
          parse: /* @__PURE__ */ __name(function() {
            return array.parse(source, transform);
          }, "parse")
        };
      }, "create")
    };
  }
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/postgres-date/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module.exports = /* @__PURE__ */ __name(function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year2 = parseInt(matches[1], 10);
      if (isBC) {
        year2 = bcYearToNegativeYear(year2);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day2 = matches[3];
      var hour2 = parseInt(matches[4], 10);
      var minute2 = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year2, month, day2, hour2, minute2, second, ms));
        if (is0To99(year2)) {
          date.setUTCFullYear(year2);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year2, month, day2, hour2, minute2, second, ms);
        if (is0To99(year2)) {
          date.setFullYear(year2);
        }
      }
      return date;
    }, "parseDate");
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year2 = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year2 = bcYearToNegativeYear(year2);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day2 = matches[3];
      var date = new Date(year2, month, day2);
      if (is0To99(year2)) {
        date.setFullYear(year2);
      }
      return date;
    }
    __name(getDate, "getDate");
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign2 = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign2 * 1e3;
    }
    __name(timeZoneOffset, "timeZoneOffset");
    function bcYearToNegativeYear(year2) {
      return -(year2 - 1);
    }
    __name(bcYearToNegativeYear, "bcYearToNegativeYear");
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
    __name(is0To99, "is0To99");
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
    __name(extend, "extend");
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/postgres-interval/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var extend = require_mutable();
    module.exports = PostgresInterval;
    function PostgresInterval(raw2) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw2);
      }
      extend(this, parse(raw2));
    }
    __name(PostgresInterval, "PostgresInterval");
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
      __name(buildProperty, "buildProperty");
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    __name(parseMilliseconds, "parseMilliseconds");
    function parse(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
    __name(parse, "parse");
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/postgres-bytea/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var bufferFrom = Buffer.from || Buffer;
    module.exports = /* @__PURE__ */ __name(function parseBytea(input) {
      if (/^\\x/.test(input)) {
        return bufferFrom(input.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input.length) {
        if (input[i] !== "\\") {
          output += input[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input.length && input[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return bufferFrom(output, "binary");
    }, "parseBytea");
  }
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg-types/lib/textParsers.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return /* @__PURE__ */ __name(function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      }, "nullAllowed");
    }
    __name(allowNull, "allowNull");
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    __name(parseBool, "parseBool");
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    __name(parseBoolArray, "parseBoolArray");
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    __name(parseBaseTenInt, "parseBaseTenInt");
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    __name(parseIntegerArray, "parseIntegerArray");
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    __name(parseBigIntegerArray, "parseBigIntegerArray");
    var parsePointArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parsePointArray");
    var parseFloatArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseFloatArray");
    var parseStringArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    }, "parseStringArray");
    var parseDateArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseDateArray");
    var parseIntervalArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseIntervalArray");
    var parseByteAArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    }, "parseByteAArray");
    var parseInteger = /* @__PURE__ */ __name(function(value) {
      return parseInt(value, 10);
    }, "parseInteger");
    var parseBigInteger = /* @__PURE__ */ __name(function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    }, "parseBigInteger");
    var parseJsonArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    }, "parseJsonArray");
    var parsePoint = /* @__PURE__ */ __name(function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    }, "parsePoint");
    var parseCircle = /* @__PURE__ */ __name(function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    }, "parseCircle");
    var init = /* @__PURE__ */ __name(function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    }, "init");
    module.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign2 = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign2 = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign2 + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign2 + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign2 + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign2 + digits + result;
      }
    }
    __name(readInt8, "readInt8");
    module.exports = readInt8;
  }
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg-types/lib/binaryParsers.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var parseInt64 = require_pg_int8();
    var parseBits = /* @__PURE__ */ __name(function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = /* @__PURE__ */ __name(function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      }, "inv");
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    }, "parseBits");
    var parseFloatFromBits = /* @__PURE__ */ __name(function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign2 = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = /* @__PURE__ */ __name(function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      }, "parsePrecisionBits");
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign2 === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign2 === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    }, "parseFloatFromBits");
    var parseInt16 = /* @__PURE__ */ __name(function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    }, "parseInt16");
    var parseInt32 = /* @__PURE__ */ __name(function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    }, "parseInt32");
    var parseFloat32 = /* @__PURE__ */ __name(function(value) {
      return parseFloatFromBits(value, 23, 8);
    }, "parseFloat32");
    var parseFloat64 = /* @__PURE__ */ __name(function(value) {
      return parseFloatFromBits(value, 52, 11);
    }, "parseFloat64");
    var parseNumeric = /* @__PURE__ */ __name(function(value) {
      var sign2 = parseBits(value, 16, 32);
      if (sign2 == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign2 === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    }, "parseNumeric");
    var parseDate = /* @__PURE__ */ __name(function(isUTC, value) {
      var sign2 = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign2 === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    }, "parseDate");
    var parseArray = /* @__PURE__ */ __name(function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = /* @__PURE__ */ __name(function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      }, "parseElement");
      var parse = /* @__PURE__ */ __name(function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++) {
            array[i2] = parse(dimension, elementType2);
          }
          dimension.unshift(count);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      }, "parse");
      return parse(dims, elementType);
    }, "parseArray");
    var parseText = /* @__PURE__ */ __name(function(value) {
      return value.toString("utf8");
    }, "parseText");
    var parseBool = /* @__PURE__ */ __name(function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    }, "parseBool");
    var init = /* @__PURE__ */ __name(function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    }, "init");
    module.exports = {
      init
    };
  }
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg-types/lib/builtins.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg-types/index.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    exports.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    __name(noParse, "noParse");
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    __name(getTypeParser, "getTypeParser");
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    __name(setTypeParser, "setTypeParser");
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var user;
    try {
      user = process.platform === "win32" ? process.env.USERNAME : process.env.USER;
    } catch {
    }
    module.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node-built-in-modules:util
import libDefault2 from "util";
var require_util = __commonJS({
  "node-built-in-modules:util"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault2;
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var defaults2 = require_defaults();
    var util = require_util();
    var { isDate } = util.types || util;
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    __name(escapeElement, "escapeElement");
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result = result + ",";
        }
        if (val[i] === null || typeof val[i] === "undefined") {
          result = result + "NULL";
        } else if (Array.isArray(val[i])) {
          result = result + arrayString(val[i]);
        } else if (ArrayBuffer.isView(val[i])) {
          let item = val[i];
          if (!(item instanceof Buffer)) {
            const buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
            if (buf.length === item.byteLength) {
              item = buf;
            } else {
              item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
            }
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(val[i]));
        }
      }
      result = result + "}";
      return result;
    }
    __name(arrayString, "arrayString");
    var prepareValue = /* @__PURE__ */ __name(function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          const buf = Buffer.from(val.buffer, val.byteOffset, val.byteLength);
          if (buf.length === val.byteLength) {
            return buf;
          }
          return buf.slice(val.byteOffset, val.byteOffset + val.byteLength);
        }
        if (isDate(val)) {
          if (defaults2.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    }, "prepareValue");
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    __name(prepareObject, "prepareObject");
    function dateToString(date) {
      let offset = -date.getTimezoneOffset();
      let year2 = date.getFullYear();
      const isBCYear = year2 < 1;
      if (isBCYear) year2 = Math.abs(year2) + 1;
      let ret = String(year2).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret += " BC";
      return ret;
    }
    __name(dateToString, "dateToString");
    function dateToStringUTC(date) {
      let year2 = date.getUTCFullYear();
      const isBCYear = year2 < 1;
      if (isBCYear) year2 = Math.abs(year2) + 1;
      let ret = String(year2).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      ret += "+00:00";
      if (isBCYear) ret += " BC";
      return ret;
    }
    __name(dateToStringUTC, "dateToStringUTC");
    function normalizeQueryConfig(config2, values, callback) {
      config2 = typeof config2 === "string" ? { text: config2 } : config2;
      if (values) {
        if (typeof values === "function") {
          config2.callback = values;
        } else {
          config2.values = values;
        }
      }
      if (callback) {
        config2.callback = callback;
      }
      return config2;
    }
    __name(normalizeQueryConfig, "normalizeQueryConfig");
    var escapeIdentifier2 = /* @__PURE__ */ __name(function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    }, "escapeIdentifier");
    var escapeLiteral2 = /* @__PURE__ */ __name(function(str) {
      let hasBackslash = false;
      let escaped = "'";
      if (str == null) {
        return "''";
      }
      if (typeof str !== "string") {
        return "''";
      }
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    }, "escapeLiteral");
    module.exports = {
      prepareValue: /* @__PURE__ */ __name(function prepareValueWrapper(value) {
        return prepareValue(value);
      }, "prepareValueWrapper"),
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// node-built-in-modules:crypto
import libDefault3 from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault3;
  }
});

// node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = __commonJS({
  "node_modules/pg/lib/crypto/utils-legacy.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var nodeCrypto2 = require_crypto();
    function md5(string) {
      return nodeCrypto2.createHash("md5").update(string, "utf-8").digest("hex");
    }
    __name(md5, "md5");
    function postgresMd5PasswordHash(user, password, salt) {
      const inner = md5(password + user);
      const outer = md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    __name(postgresMd5PasswordHash, "postgresMd5PasswordHash");
    function sha256(text) {
      return nodeCrypto2.createHash("sha256").update(text).digest();
    }
    __name(sha256, "sha256");
    function hashByName(hashName, text) {
      hashName = hashName.replace(/(\D)-/, "$1");
      return nodeCrypto2.createHash(hashName).update(text).digest();
    }
    __name(hashByName, "hashByName");
    function hmacSha256(key, msg) {
      return nodeCrypto2.createHmac("sha256", key).update(msg).digest();
    }
    __name(hmacSha256, "hmacSha256");
    async function deriveKey(password, salt, iterations) {
      return nodeCrypto2.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    }
    __name(deriveKey, "deriveKey");
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes: nodeCrypto2.randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
  }
});

// node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = __commonJS({
  "node_modules/pg/lib/crypto/utils-webcrypto.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var nodeCrypto2 = require_crypto();
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes: randomBytes2,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto2.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes2(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    __name(randomBytes2, "randomBytes");
    async function md5(string) {
      try {
        return nodeCrypto2.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash2 = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash2)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    __name(md5, "md5");
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    __name(postgresMd5PasswordHash, "postgresMd5PasswordHash");
    async function sha256(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    __name(sha256, "sha256");
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
    }
    __name(hashByName, "hashByName");
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    __name(hmacSha256, "hmacSha256");
    async function deriveKey(password, salt, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
    __name(deriveKey, "deriveKey");
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15;
    if (useLegacyCrypto) {
      module.exports = require_utils_legacy();
    } else {
      module.exports = require_utils_webcrypto();
    }
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/pg/lib/crypto/cert-signatures.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    __name(x509Error, "x509Error");
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    __name(readASN1Length, "readASN1Length");
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    __name(readASN1OID, "readASN1OID");
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    __name(expectASN1Seq, "expectASN1Seq");
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https: return//github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    __name(signatureAlgorithmHashFromCertificate, "signatureAlgorithmHashFromCertificate");
    module.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var crypto2 = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function startSession(mechanisms, stream) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto2.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse"
      };
    }
    __name(startSession, "startSession");
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto2.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto2.deriveKey(password, saltBytes, sv.iteration);
      const clientKey = await crypto2.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto2.sha256(clientKey);
      const clientSignature = await crypto2.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto2.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto2.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    __name(continueSession, "continueSession");
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    __name(finalizeSession, "finalizeSession");
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    __name(isPrintableChars, "isPrintableChars");
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    __name(isBase64, "isBase64");
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    __name(parseAttributePairs, "parseAttributePairs");
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    __name(parseServerFirstMessage, "parseServerFirstMessage");
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const serverSignature = attrPairs.get("v");
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    __name(parseServerFinalMessage, "parseServerFinalMessage");
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    __name(xorBuffers, "xorBuffers");
    module.exports = {
      startSession,
      continueSession,
      finalizeSession
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var types2 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types2;
      this.text = {};
      this.binary = {};
    }
    __name(TypeOverrides2, "TypeOverrides");
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module.exports = TypeOverrides2;
  }
});

// node-built-in-modules:dns
import libDefault4 from "dns";
var require_dns = __commonJS({
  "node-built-in-modules:dns"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault4;
  }
});

// node-built-in-modules:fs
import libDefault5 from "fs";
var require_fs = __commonJS({
  "node-built-in-modules:fs"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault5;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    function parse(str, options = {}) {
      if (str.charAt(0) === "/") {
        const config3 = str.split(" ");
        return { host: config3[0], database: config3[1] };
      }
      const config2 = {};
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch (e) {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err) {
        err.input && (err.input = "*****REDACTED*****");
        throw err;
      }
      for (const entry of result.searchParams.entries()) {
        config2[entry[0]] = entry[1];
      }
      config2.user = config2.user || decodeURIComponent(result.username);
      config2.password = config2.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config2.host = decodeURI(result.pathname);
        config2.database = result.searchParams.get("db");
        config2.client_encoding = result.searchParams.get("encoding");
        return config2;
      }
      const hostname = dummyHost ? "" : result.hostname;
      if (!config2.host) {
        config2.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config2.port) {
        config2.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config2.database = pathname ? decodeURI(pathname) : null;
      if (config2.ssl === "true" || config2.ssl === "1") {
        config2.ssl = true;
      }
      if (config2.ssl === "0") {
        config2.ssl = false;
      }
      if (config2.sslcert || config2.sslkey || config2.sslrootcert || config2.sslmode) {
        config2.ssl = {};
      }
      const fs = config2.sslcert || config2.sslkey || config2.sslrootcert ? require_fs() : null;
      if (config2.sslcert) {
        config2.ssl.cert = fs.readFileSync(config2.sslcert).toString();
      }
      if (config2.sslkey) {
        config2.ssl.key = fs.readFileSync(config2.sslkey).toString();
      }
      if (config2.sslrootcert) {
        config2.ssl.ca = fs.readFileSync(config2.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config2.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config2.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config2.sslrootcert) {
              config2.ssl.checkServerIdentity = function() {
              };
            } else {
              config2.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config2.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config2.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            if (config2.sslmode !== "verify-full") {
              deprecatedSslModeWarning(config2.sslmode);
            }
            break;
          }
          case "no-verify": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config2;
    }
    __name(parse, "parse");
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
        if (value !== void 0 && value !== null) {
          c[key] = value;
        }
        return c;
      }, {});
      return connectionOptions;
    }
    __name(toConnectionOptions, "toConnectionOptions");
    function toClientConfig(config2) {
      const poolConfig = Object.entries(config2).reduce((c, [key, value]) => {
        if (key === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key}: ${value}`);
              }
              c[key] = v;
            }
          } else {
            c[key] = value;
          }
        }
        return c;
      }, {});
      return poolConfig;
    }
    __name(toClientConfig, "toClientConfig");
    function parseIntoClientConfig(str) {
      return toClientConfig(parse(str));
    }
    __name(parseIntoClientConfig, "parseIntoClientConfig");
    function deprecatedSslModeWarning(sslmode) {
      if (!deprecatedSslModeWarning.warned && typeof process !== "undefined" && process.emitWarning) {
        deprecatedSslModeWarning.warned = true;
        process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`);
      }
    }
    __name(deprecatedSslModeWarning, "deprecatedSslModeWarning");
    module.exports = parse;
    parse.parse = parse;
    parse.toClientConfig = toClientConfig;
    parse.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var dns = require_dns();
    var defaults2 = require_defaults();
    var parse = require_pg_connection_string().parse;
    var val = /* @__PURE__ */ __name(function(key, config2, envVar) {
      if (config2[key]) {
        return config2[key];
      }
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return envVar || defaults2[key];
    }, "val");
    var readSSLConfigFromEnvironment = /* @__PURE__ */ __name(function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults2.ssl;
    }, "readSSLConfigFromEnvironment");
    var quoteParamValue = /* @__PURE__ */ __name(function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    }, "quoteParamValue");
    var add = /* @__PURE__ */ __name(function(params, config2, paramName) {
      const value = config2[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    }, "add");
    var ConnectionParameters = class {
      static {
        __name(this, "ConnectionParameters");
      }
      constructor(config2) {
        config2 = typeof config2 === "string" ? parse(config2) : config2 || {};
        if (config2.connectionString) {
          config2 = Object.assign({}, config2, parse(config2.connectionString));
        }
        this.user = val("user", config2);
        this.database = val("database", config2);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config2), 10);
        this.host = val("host", config2);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config2)
        });
        this.binary = val("binary", config2);
        this.options = val("options", config2);
        this.ssl = typeof config2.ssl === "undefined" ? readSSLConfigFromEnvironment() : config2.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.client_encoding = val("client_encoding", config2);
        this.replication = val("replication", config2);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config2, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config2, false);
        this.statement_timeout = val("statement_timeout", config2, false);
        this.lock_timeout = val("lock_timeout", config2, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config2, false);
        this.query_timeout = val("query_timeout", config2, false);
        if (config2.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config2.connectionTimeoutMillis / 1e3);
        }
        if (config2.keepAlive === false) {
          this.keepalives = 0;
        } else if (config2.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config2.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config2.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err) return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var types2 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      static {
        __name(this, "Result");
      }
      constructor(rowMode, types3) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types3;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match2;
        if (msg.text) {
          match2 = matchRegexp.exec(msg.text);
        } else {
          match2 = matchRegexp.exec(msg.command);
        }
        if (match2) {
          this.command = match2[1];
          if (match2[3]) {
            this.oid = parseInt(match2[2], 10);
            this.rowCount = parseInt(match2[3], 10);
          } else if (match2[2]) {
            this.rowCount = parseInt(match2[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = {};
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module.exports = Result2;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var { EventEmitter: EventEmitter2 } = require_events();
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter2 {
      static {
        __name(this, "Query");
      }
      constructor(config2, values, callback) {
        super();
        config2 = utils.normalizeQueryConfig(config2, values, callback);
        this.text = config2.text;
        this.values = config2.values;
        this.rows = config2.rows;
        this.types = config2.types;
        this.name = config2.name;
        this.queryMode = config2.queryMode;
        this.binary = config2.binary;
        this.portal = config2.portal || "";
        this.callback = config2.callback;
        this._rowMode = config2.rowMode;
        if (process.domain && config2.callback) {
          this.callback = process.domain.bind(config2.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && connection.parsedStatements[this.name];
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module.exports = Query2;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
    exports.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports.noData = {
      name: "noData",
      length: 5
    };
    exports.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      static {
        __name(this, "DatabaseError");
      }
      constructor(message2, length, name) {
        super(message2);
        this.length = length;
        this.name = name;
      }
    };
    exports.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      static {
        __name(this, "CopyDataMessage");
      }
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      static {
        __name(this, "CopyResponse");
      }
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports.CopyResponse = CopyResponse;
    var Field = class {
      static {
        __name(this, "Field");
      }
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports.Field = Field;
    var RowDescriptionMessage = class {
      static {
        __name(this, "RowDescriptionMessage");
      }
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      static {
        __name(this, "ParameterDescriptionMessage");
      }
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      static {
        __name(this, "ParameterStatusMessage");
      }
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      static {
        __name(this, "AuthenticationMD5Password");
      }
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      static {
        __name(this, "BackendKeyDataMessage");
      }
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      static {
        __name(this, "NotificationResponseMessage");
      }
      constructor(length, processId, channel2, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel2;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      static {
        __name(this, "ReadyForQueryMessage");
      }
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      static {
        __name(this, "CommandCompleteMessage");
      }
      constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = "commandComplete";
      }
    };
    exports.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      static {
        __name(this, "DataRowMessage");
      }
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      static {
        __name(this, "NoticeMessage");
      }
      constructor(length, message2) {
        this.length = length;
        this.message = message2;
        this.name = "notice";
      }
    };
    exports.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Writer = void 0;
    var Writer = class {
      static {
        __name(this, "Writer");
      }
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
    };
    exports.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = /* @__PURE__ */ __name((opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    }, "startup");
    var requestSsl = /* @__PURE__ */ __name(() => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    }, "requestSsl");
    var password = /* @__PURE__ */ __name((password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    }, "password");
    var sendSASLInitialResponseMessage = /* @__PURE__ */ __name(function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    }, "sendSASLInitialResponseMessage");
    var sendSCRAMClientFinalMessage = /* @__PURE__ */ __name(function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    }, "sendSCRAMClientFinalMessage");
    var query = /* @__PURE__ */ __name((text) => {
      return writer.addCString(text).flush(
        81
        /* code.query */
      );
    }, "query");
    var emptyArray = [];
    var parse = /* @__PURE__ */ __name((query2) => {
      const name = query2.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types2 = query2.types || emptyArray;
      const len = types2.length;
      const buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types2[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    }, "parse");
    var paramWriter = new buffer_writer_1.Writer();
    var writeValues = /* @__PURE__ */ __name(function(values, valueMapper) {
      for (let i = 0; i < values.length; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        if (mappedVal == null) {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          writer.addInt16(
            1
            /* ParamType.BINARY */
          );
          paramWriter.addInt32(mappedVal.length);
          paramWriter.add(mappedVal);
        } else {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(Buffer.byteLength(mappedVal));
          paramWriter.addString(mappedVal);
        }
      }
    }, "writeValues");
    var bind = /* @__PURE__ */ __name((config2 = {}) => {
      const portal = config2.portal || "";
      const statement = config2.statement || "";
      const binary = config2.binary || false;
      const values = config2.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      writeValues(values, config2.valueMapper);
      writer.addInt16(len);
      writer.add(paramWriter.flush());
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    }, "bind");
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = /* @__PURE__ */ __name((config2) => {
      if (!config2 || !config2.portal && !config2.rows) {
        return emptyExecute;
      }
      const portal = config2.portal || "";
      const rows = config2.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    }, "execute");
    var cancel = /* @__PURE__ */ __name((processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    }, "cancel");
    var cstringMessage = /* @__PURE__ */ __name((code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    }, "cstringMessage");
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = /* @__PURE__ */ __name((msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    }, "describe");
    var close = /* @__PURE__ */ __name((msg) => {
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    }, "close");
    var copyData = /* @__PURE__ */ __name((chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    }, "copyData");
    var copyFail = /* @__PURE__ */ __name((message2) => {
      return cstringMessage(102, message2);
    }, "copyFail");
    var codeOnlyBuffer = /* @__PURE__ */ __name((code) => Buffer.from([code, 0, 0, 0, 4]), "codeOnlyBuffer");
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query,
      parse,
      bind,
      execute,
      describe,
      close,
      flush: /* @__PURE__ */ __name(() => flushBuffer, "flush"),
      sync: /* @__PURE__ */ __name(() => syncBuffer, "sync"),
      end: /* @__PURE__ */ __name(() => endBuffer, "end"),
      copyData,
      copyDone: /* @__PURE__ */ __name(() => copyDoneBuffer, "copyDone"),
      copyFail,
      cancel
    };
    exports.serialize = serialize;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferReader = void 0;
    var BufferReader = class {
      static {
        __name(this, "BufferReader");
      }
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = Buffer.allocUnsafe(0);
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++] !== 0) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var LATEINIT_LENGTH = -1;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      static {
        __name(this, "Parser");
      }
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message2 = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message2);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        const { reader } = this;
        reader.setBuffer(offset, bytes);
        let message2;
        switch (code) {
          case 50:
            message2 = messages_1.bindComplete;
            break;
          case 49:
            message2 = messages_1.parseComplete;
            break;
          case 51:
            message2 = messages_1.closeComplete;
            break;
          case 110:
            message2 = messages_1.noData;
            break;
          case 115:
            message2 = messages_1.portalSuspended;
            break;
          case 99:
            message2 = messages_1.copyDone;
            break;
          case 87:
            message2 = messages_1.replicationStart;
            break;
          case 73:
            message2 = messages_1.emptyQuery;
            break;
          case 68:
            message2 = parseDataRowMessage(reader);
            break;
          case 67:
            message2 = parseCommandCompleteMessage(reader);
            break;
          case 90:
            message2 = parseReadyForQueryMessage(reader);
            break;
          case 65:
            message2 = parseNotificationMessage(reader);
            break;
          case 82:
            message2 = parseAuthenticationResponse(reader, length);
            break;
          case 83:
            message2 = parseParameterStatusMessage(reader);
            break;
          case 75:
            message2 = parseBackendKeyData(reader);
            break;
          case 69:
            message2 = parseErrorMessage(reader, "error");
            break;
          case 78:
            message2 = parseErrorMessage(reader, "notice");
            break;
          case 84:
            message2 = parseRowDescriptionMessage(reader);
            break;
          case 116:
            message2 = parseParameterDescriptionMessage(reader);
            break;
          case 71:
            message2 = parseCopyInMessage(reader);
            break;
          case 72:
            message2 = parseCopyOutMessage(reader);
            break;
          case 100:
            message2 = parseCopyData(reader, length);
            break;
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
        reader.setBuffer(0, emptyBuffer);
        message2.length = length;
        return message2;
      }
    };
    exports.Parser = Parser;
    var parseReadyForQueryMessage = /* @__PURE__ */ __name((reader) => {
      const status = reader.string(1);
      return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
    }, "parseReadyForQueryMessage");
    var parseCommandCompleteMessage = /* @__PURE__ */ __name((reader) => {
      const text = reader.cstring();
      return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
    }, "parseCommandCompleteMessage");
    var parseCopyData = /* @__PURE__ */ __name((reader, length) => {
      const chunk = reader.bytes(length - 4);
      return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
    }, "parseCopyData");
    var parseCopyInMessage = /* @__PURE__ */ __name((reader) => parseCopyMessage(reader, "copyInResponse"), "parseCopyInMessage");
    var parseCopyOutMessage = /* @__PURE__ */ __name((reader) => parseCopyMessage(reader, "copyOutResponse"), "parseCopyOutMessage");
    var parseCopyMessage = /* @__PURE__ */ __name((reader, messageName) => {
      const isBinary = reader.byte() !== 0;
      const columnCount = reader.int16();
      const message2 = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
      for (let i = 0; i < columnCount; i++) {
        message2.columnTypes[i] = reader.int16();
      }
      return message2;
    }, "parseCopyMessage");
    var parseNotificationMessage = /* @__PURE__ */ __name((reader) => {
      const processId = reader.int32();
      const channel2 = reader.cstring();
      const payload = reader.cstring();
      return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel2, payload);
    }, "parseNotificationMessage");
    var parseRowDescriptionMessage = /* @__PURE__ */ __name((reader) => {
      const fieldCount = reader.int16();
      const message2 = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        message2.fields[i] = parseField(reader);
      }
      return message2;
    }, "parseRowDescriptionMessage");
    var parseField = /* @__PURE__ */ __name((reader) => {
      const name = reader.cstring();
      const tableID = reader.uint32();
      const columnID = reader.int16();
      const dataTypeID = reader.uint32();
      const dataTypeSize = reader.int16();
      const dataTypeModifier = reader.int32();
      const mode = reader.int16() === 0 ? "text" : "binary";
      return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
    }, "parseField");
    var parseParameterDescriptionMessage = /* @__PURE__ */ __name((reader) => {
      const parameterCount = reader.int16();
      const message2 = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
      for (let i = 0; i < parameterCount; i++) {
        message2.dataTypeIDs[i] = reader.int32();
      }
      return message2;
    }, "parseParameterDescriptionMessage");
    var parseDataRowMessage = /* @__PURE__ */ __name((reader) => {
      const fieldCount = reader.int16();
      const fields = new Array(fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        const len = reader.int32();
        fields[i] = len === -1 ? null : reader.string(len);
      }
      return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
    }, "parseDataRowMessage");
    var parseParameterStatusMessage = /* @__PURE__ */ __name((reader) => {
      const name = reader.cstring();
      const value = reader.cstring();
      return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
    }, "parseParameterStatusMessage");
    var parseBackendKeyData = /* @__PURE__ */ __name((reader) => {
      const processID = reader.int32();
      const secretKey = reader.int32();
      return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
    }, "parseBackendKeyData");
    var parseAuthenticationResponse = /* @__PURE__ */ __name((reader, length) => {
      const code = reader.int32();
      const message2 = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          if (message2.length === 8) {
            message2.name = "authenticationCleartextPassword";
          }
          break;
        case 5:
          if (message2.length === 12) {
            message2.name = "authenticationMD5Password";
            const salt = reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
          }
          break;
        case 10:
          {
            message2.name = "authenticationSASL";
            message2.mechanisms = [];
            let mechanism;
            do {
              mechanism = reader.cstring();
              if (mechanism) {
                message2.mechanisms.push(mechanism);
              }
            } while (mechanism);
          }
          break;
        case 11:
          message2.name = "authenticationSASLContinue";
          message2.data = reader.string(length - 8);
          break;
        case 12:
          message2.name = "authenticationSASLFinal";
          message2.data = reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message2;
    }, "parseAuthenticationResponse");
    var parseErrorMessage = /* @__PURE__ */ __name((reader, name) => {
      const fields = {};
      let fieldType = reader.string(1);
      while (fieldType !== "\0") {
        fields[fieldType] = reader.cstring();
        fieldType = reader.string(1);
      }
      const messageValue = fields.M;
      const message2 = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
      message2.severity = fields.S;
      message2.code = fields.C;
      message2.detail = fields.D;
      message2.hint = fields.H;
      message2.position = fields.P;
      message2.internalPosition = fields.p;
      message2.internalQuery = fields.q;
      message2.where = fields.W;
      message2.schema = fields.s;
      message2.table = fields.t;
      message2.column = fields.c;
      message2.dataType = fields.d;
      message2.constraint = fields.n;
      message2.file = fields.F;
      message2.line = fields.L;
      message2.routine = fields.R;
      return message2;
    }, "parseErrorMessage");
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseError = exports.serialize = exports.parse = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return messages_1.DatabaseError;
    }, "get") });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports, "serialize", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return serializer_1.serialize;
    }, "get") });
    var parser_1 = require_parser();
    function parse(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
    __name(parse, "parse");
    exports.parse = parse;
  }
});

// node-built-in-modules:net
import libDefault6 from "net";
var require_net = __commonJS({
  "node-built-in-modules:net"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault6;
  }
});

// node-built-in-modules:tls
import libDefault7 from "tls";
var require_tls = __commonJS({
  "node-built-in-modules:tls"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault7;
  }
});

// node_modules/pg-cloudflare/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/pg-cloudflare/dist/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CloudflareSocket = void 0;
    var events_1 = require_events();
    var CloudflareSocket = class extends events_1.EventEmitter {
      static {
        __name(this, "CloudflareSocket");
      }
      constructor(ssl) {
        super();
        this.ssl = ssl;
        this.writable = false;
        this.destroyed = false;
        this._upgrading = false;
        this._upgraded = false;
        this._cfSocket = null;
        this._cfWriter = null;
        this._cfReader = null;
      }
      setNoDelay() {
        return this;
      }
      setKeepAlive() {
        return this;
      }
      ref() {
        return this;
      }
      unref() {
        return this;
      }
      async connect(port, host, connectListener) {
        try {
          log("connecting");
          if (connectListener)
            this.once("connect", connectListener);
          const options = this.ssl ? { secureTransport: "starttls" } : {};
          const mod = await import("cloudflare:sockets");
          const connect = mod.connect;
          this._cfSocket = connect(`${host}:${port}`, options);
          this._cfWriter = this._cfSocket.writable.getWriter();
          this._addClosedHandler();
          this._cfReader = this._cfSocket.readable.getReader();
          if (this.ssl) {
            this._listenOnce().catch((e) => this.emit("error", e));
          } else {
            this._listen().catch((e) => this.emit("error", e));
          }
          await this._cfWriter.ready;
          log("socket ready");
          this.writable = true;
          this.emit("connect");
          return this;
        } catch (e) {
          this.emit("error", e);
        }
      }
      async _listen() {
        while (true) {
          log("awaiting receive from CF socket");
          const { done, value } = await this._cfReader.read();
          log("CF socket received:", done, value);
          if (done) {
            log("done");
            break;
          }
          this.emit("data", Buffer.from(value));
        }
      }
      async _listenOnce() {
        log("awaiting first receive from CF socket");
        const { done, value } = await this._cfReader.read();
        log("First CF socket received:", done, value);
        this.emit("data", Buffer.from(value));
      }
      write(data, encoding = "utf8", callback = () => {
      }) {
        if (data.length === 0)
          return callback();
        if (typeof data === "string")
          data = Buffer.from(data, encoding);
        log("sending data direct:", data);
        this._cfWriter.write(data).then(() => {
          log("data sent");
          callback();
        }, (err) => {
          log("send error", err);
          callback(err);
        });
        return true;
      }
      end(data = Buffer.alloc(0), encoding = "utf8", callback = () => {
      }) {
        log("ending CF socket");
        this.write(data, encoding, (err) => {
          this._cfSocket.close();
          if (callback)
            callback(err);
        });
        return this;
      }
      destroy(reason) {
        log("destroying CF socket", reason);
        this.destroyed = true;
        return this.end();
      }
      startTls(options) {
        if (this._upgraded) {
          this.emit("error", "Cannot call `startTls()` more than once on a socket");
          return;
        }
        this._cfWriter.releaseLock();
        this._cfReader.releaseLock();
        this._upgrading = true;
        this._cfSocket = this._cfSocket.startTls(options);
        this._cfWriter = this._cfSocket.writable.getWriter();
        this._cfReader = this._cfSocket.readable.getReader();
        this._addClosedHandler();
        this._listen().catch((e) => this.emit("error", e));
      }
      _addClosedHandler() {
        this._cfSocket.closed.then(() => {
          if (!this._upgrading) {
            log("CF socket closed");
            this._cfSocket = null;
            this.emit("close");
          } else {
            this._upgrading = false;
            this._upgraded = true;
          }
        }).catch((e) => this.emit("error", e));
      }
    };
    exports.CloudflareSocket = CloudflareSocket;
    var debug = false;
    function dump(data) {
      if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
        const hex = Buffer.from(data).toString("hex");
        const str = new TextDecoder().decode(data);
        return `
>>> STR: "${str.replace(/\n/g, "\\n")}"
>>> HEX: ${hex}
`;
      } else {
        return data;
      }
    }
    __name(dump, "dump");
    function log(...args) {
      debug && console.log(...args.map(dump));
    }
    __name(log, "log");
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var { getStream, getSecureStream } = getStreamFuncs();
    module.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = require_net();
        return new net.Socket();
      }
      __name(getStream2, "getStream");
      function getSecureStream2(options) {
        const tls = require_tls();
        return tls.connect(options);
      }
      __name(getSecureStream2, "getSecureStream");
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    __name(getNodejsStreamFuncs, "getNodejsStreamFuncs");
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_dist2();
        return new CloudflareSocket(ssl);
      }
      __name(getStream2, "getStream");
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      __name(getSecureStream2, "getSecureStream");
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    __name(getCloudflareStreamFuncs, "getCloudflareStreamFuncs");
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && true) {
        return true;
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    __name(isCloudflareRuntime, "isCloudflareRuntime");
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
    __name(getStreamFuncs, "getStreamFuncs");
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var { parse, serialize } = require_dist();
    var { getStream, getSecureStream } = require_stream();
    var flushBuffer = serialize.flush();
    var syncBuffer = serialize.sync();
    var endBuffer = serialize.end();
    var Connection2 = class extends EventEmitter2 {
      static {
        __name(this, "Connection");
      }
      constructor(config2) {
        super();
        config2 = config2 || {};
        this.stream = config2.stream || getStream(config2.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config2);
        }
        this._keepAlive = config2.keepAlive;
        this._keepAliveInitialDelayMillis = config2.keepAliveInitialDelayMillis;
        this.parsedStatements = {};
        this.ssl = config2.ssl || false;
        this._ending = false;
        this._emitMessage = false;
        const self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = /* @__PURE__ */ __name(function(error) {
          if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
            return;
          }
          self.emit("error", error);
        }, "reportStreamError");
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          const options = {
            socket: self.stream
          };
          if (self.ssl !== true) {
            Object.assign(options, self.ssl);
            if ("key" in self.ssl) {
              options.key = self.ssl.key;
            }
          }
          const net = require_net();
          if (net.isIP && net.isIP(host) === 0) {
            options.servername = host;
          }
          try {
            self.stream = getSecureStream(options);
          } catch (err) {
            return self.emit("error", err);
          }
          self.attachListeners(self.stream);
          self.stream.on("error", reportStreamError);
          self.emit("sslconnect");
        });
      }
      attachListeners(stream) {
        parse(stream, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config2) {
        this.stream.write(serialize.startup(config2));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text) {
        this._send(serialize.query(text));
      }
      // send parse message
      parse(query) {
        this._send(serialize.parse(query));
      }
      // send bind message
      bind(config2) {
        this._send(serialize.bind(config2));
      }
      // send execute message
      execute(config2) {
        this._send(serialize.execute(config2));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._ending = true;
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module.exports = Connection2;
  }
});

// node-built-in-modules:path
import libDefault8 from "path";
var require_path = __commonJS({
  "node-built-in-modules:path"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault8;
  }
});

// node-built-in-modules:stream
import libDefault9 from "stream";
var require_stream2 = __commonJS({
  "node-built-in-modules:stream"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault9;
  }
});

// node-built-in-modules:string_decoder
import libDefault10 from "string_decoder";
var require_string_decoder = __commonJS({
  "node-built-in-modules:string_decoder"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = libDefault10;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var { Transform } = require_stream2();
    var { StringDecoder } = require_string_decoder();
    var kLast = Symbol("last");
    var kDecoder = Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    __name(transform, "transform");
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      }
      cb();
    }
    __name(flush, "flush");
    function push(self, val) {
      if (val !== void 0) {
        self.push(val);
      }
    }
    __name(push, "push");
    function noop(incoming) {
      return incoming;
    }
    __name(noop, "noop");
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    __name(split, "split");
    module.exports = split;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var path = require_path();
    var Stream = require_stream2().Stream;
    var split = require_split2();
    var util = require_util();
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    __name(isRegFile, "isRegFile");
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    __name(warn, "warn");
    Object.defineProperty(module.exports, "isWin", {
      get: /* @__PURE__ */ __name(function() {
        return isWin;
      }, "get"),
      set: /* @__PURE__ */ __name(function(val) {
        isWin = val;
      }, "set")
    });
    module.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module.exports.getFileName = function(rawEnv) {
      var env2 = rawEnv || process.env;
      var file = env2.PGPASSFILE || (isWin ? path.join(env2.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env2.HOME || "./", ".pgpass"));
      return file;
    };
    module.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG | S_IRWXO)) {
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      __name(onLine, "onLine");
      var onEnd = /* @__PURE__ */ __name(function() {
        stream.destroy();
        cb(pass);
      }, "onEnd");
      var onErr = /* @__PURE__ */ __name(function(err) {
        stream.destroy();
        warn("WARNING: error on reading file: %s", err);
        cb(void 0);
      }, "onErr");
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = /* @__PURE__ */ __name(function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      }, "addToObj");
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var path = require_path();
    var fs = require_fs();
    var helper = require_helper();
    module.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var utils = require_utils();
    var nodeUtils = require_util();
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var crypto2 = require_utils2();
    var activeQueryDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.activeQuery is deprecated and will be removed in pg@9.0"
    );
    var queryQueueDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.queryQueue is deprecated and will be removed in pg@9.0."
    );
    var pgPassDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "pgpass support is deprecated and will be removed in pg@9.0. You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this function you can call the pgpass module in your own code."
    );
    var byoPromiseDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in pg@9.0."
    );
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    var Client2 = class extends EventEmitter2 {
      static {
        __name(this, "Client");
      }
      constructor(config2) {
        super();
        this.connectionParameters = new ConnectionParameters(config2);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config2 || {};
        if (c.Promise) {
          byoPromiseDeprecationNotice();
        }
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this._activeQuery = null;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this._queryQueue = [];
        this.binary = c.binary || defaults2.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      get activeQuery() {
        activeQueryDeprecationNotice();
        return this._activeQuery;
      }
      set activeQuery(val) {
        activeQueryDeprecationNotice();
        this._activeQuery = val;
      }
      _getActiveQuery() {
        return this._activeQuery;
      }
      _errorAllQueries(err) {
        const enqueueError = /* @__PURE__ */ __name((query) => {
          process.nextTick(() => {
            query.handleError(err, this.connection);
          });
        }, "enqueueError");
        const activeQuery = this._getActiveQuery();
        if (activeQuery) {
          enqueueError(activeQuery);
          this._activeQuery = null;
        }
        this._queryQueue.forEach(enqueueError);
        this._queryQueue.length = 0;
      }
      _connect(callback) {
        const self = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            con.requestSsl();
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error);
              } else {
                this._handleErrorEvent(error);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(this);
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      _getPassword(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password(this.connectionParameters)).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                pgPassDeprecationNotice();
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._getPassword(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._getPassword(async () => {
          try {
            const hashedPassword = await crypto2.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._getPassword(() => {
          try {
            this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream);
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const activeQuery = this._getActiveQuery();
        this._activeQuery = null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this._getActiveQuery();
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this._activeQuery = null;
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected rowDescription message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected dataRow message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected portalSuspended message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected emptyQuery message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        if (activeQuery.name) {
          this.connection.parsedStatements[activeQuery.name] = activeQuery.text;
        }
      }
      _handleCopyInResponse(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyInResponse message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        const activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          const error = new Error("Received unexpected copyData message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query) {
        if (client.activeQuery === query) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client._queryQueue.indexOf(query) !== -1) {
          client._queryQueue.splice(client._queryQueue.indexOf(query), 1);
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.readyForQuery === true) {
          this._activeQuery = this._queryQueue.shift();
          const activeQuery = this._getActiveQuery();
          if (activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this._activeQuery = null;
            this.emit("drain");
          }
        }
      }
      query(config2, values, callback) {
        let query;
        let result;
        let readTimeout;
        let readTimeoutTimer;
        let queryCallback;
        if (config2 === null || config2 === void 0) {
          throw new TypeError("Client was passed a null or undefined query");
        } else if (typeof config2.submit === "function") {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          result = query = config2;
          if (!query.callback) {
            if (typeof values === "function") {
              query.callback = values;
            } else if (callback) {
              query.callback = callback;
            }
          }
        } else {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          query = new Query2(config2, values, callback);
          if (!query.callback) {
            result = new this._Promise((resolve, reject) => {
              query.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          }
        }
        if (readTimeout) {
          queryCallback = query.callback || (() => {
          });
          readTimeoutTimer = setTimeout(() => {
            const error = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error, this.connection);
            });
            queryCallback(error);
            query.callback = () => {
            };
            const index = this._queryQueue.indexOf(query);
            if (index > -1) {
              this._queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query.binary) {
          query.binary = true;
        }
        if (query._result && !query._result._types) {
          query._result._types = this._types;
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._queryQueue.length > 0) {
          queryQueueLengthDeprecationNotice();
        }
        this._queryQueue.push(query);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
          } else {
            return this._Promise.resolve();
          }
        }
        if (this._getActiveQuery() || !this._queryable) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
      get queryQueue() {
        queryQueueDeprecationNotice();
        return this._queryQueue;
      }
    };
    Client2.Query = Query2;
    module.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var NOOP = /* @__PURE__ */ __name(function() {
    }, "NOOP");
    var removeWhere = /* @__PURE__ */ __name((list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    }, "removeWhere");
    var IdleItem = class {
      static {
        __name(this, "IdleItem");
      }
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      static {
        __name(this, "PendingItem");
      }
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    __name(throwOnDoubleRelease, "throwOnDoubleRelease");
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = /* @__PURE__ */ __name(function(err, client) {
        err ? rej(err) : res(client);
      }, "cb");
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    __name(promisify, "promisify");
    function makeIdleListener(pool, client) {
      return /* @__PURE__ */ __name(function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool.log("additional client error after disconnection due to error", err);
        });
        pool._remove(client);
        pool.emit("error", err, client);
      }, "idleListener");
    }
    __name(makeIdleListener, "makeIdleListener");
    var Pool3 = class extends EventEmitter2 {
      static {
        __name(this, "Pool");
      }
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _promiseTry(f) {
        const Promise2 = this.Promise;
        if (typeof Promise2.try === "function") {
          return Promise2.try(f);
        }
        return new Promise2((resolve) => resolve(f()));
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context = this;
        client.end(() => {
          context.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = /* @__PURE__ */ __name((err, res, done) => {
            clearTimeout(tid);
            response.callback(err, res, done);
          }, "queueCallback");
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            if (client.connection) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.connection.stream.destroy();
            } else if (!client.isConnected()) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.end();
            }
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err = new Error("Connection terminated due to connection timeout", { cause: err });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.onConnect) {
              this._promiseTry(() => this.options.onConnect(client)).then(
                () => {
                  this._afterConnect(client, pendingItem, idleListener);
                },
                (hookErr) => {
                  this._clients = this._clients.filter((c) => c !== client);
                  client.end(() => {
                    this._pulseQueue();
                    if (!pendingItem.timedOut) {
                      pendingItem.callback(hookErr, void 0, NOOP);
                    }
                  });
                }
              );
              return;
            }
            return this._afterConnect(client, pendingItem, idleListener);
          }
        });
      }
      _afterConnect(client, pendingItem, idleListener) {
        if (this.options.maxLifetimeSeconds !== 0) {
          const maxLifetimeTimeout = setTimeout(() => {
            this.log("ending client due to expired lifetime");
            this._expired.add(client);
            const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
            if (idleIndex !== -1) {
              this._acquireClient(
                client,
                new PendingItem((err, client2, clientRelease) => clientRelease()),
                idleListener,
                false
              );
            }
          }, this.options.maxLifetimeSeconds * 1e3);
          maxLifetimeTimeout.unref();
          client.once("end", () => clearTimeout(maxLifetimeTimeout));
        }
        return this._acquireClient(client, pendingItem, idleListener, true);
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            if (this._isAboveMin()) {
              this.log("remove idle client");
              this._remove(client, this._pulseQueue.bind(this));
            }
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = /* @__PURE__ */ __name((err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          }, "onError");
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module.exports = Pool3;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var util = require_util();
    var utils = require_utils();
    var NativeQuery = module.exports = function(config2, values, callback) {
      EventEmitter2.call(this);
      config2 = utils.normalizeQueryConfig(config2, values, callback);
      this.text = config2.text;
      this.values = config2.values;
      this.name = config2.name;
      this.queryMode = config2.queryMode;
      this.callback = config2.callback;
      this.state = "new";
      this._arrayMode = config2.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter2);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      const fields = this.native.pq.resultErrorFields();
      if (fields) {
        for (const key in fields) {
          const normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = /* @__PURE__ */ __name(function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      }, "after");
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name]) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err) return after(err);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var nodeUtils = require_util();
    var Native;
    try {
      Native = __require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter2 = require_events().EventEmitter;
    var util = require_util();
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    var Client2 = module.exports = function(config2) {
      EventEmitter2.call(this);
      config2 = config2 || {};
      this._Promise = config2.Promise || global.Promise;
      this._types = new TypeOverrides2(config2.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      const cp = this.connectionParameters = new ConnectionParameters(config2);
      if (config2.nativeConnectionString) cp.nativeConnectionString = config2.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter2);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = /* @__PURE__ */ __name((query) => {
        process.nextTick(() => {
          query.native = this.native;
          query.handleError(err);
        });
      }, "enqueueError");
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
        if (err) return cb(err);
        self.native.connect(conString, function(err2) {
          if (err2) {
            self.native.end();
            return cb(err2);
          }
          self._connected = true;
          self.native.on("error", function(err3) {
            self._queryable = false;
            self._errorAllQueries(err3);
            self.emit("error", err3);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb(null, this);
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve(this);
          }
        });
      });
    };
    Client2.prototype.query = function(config2, values, callback) {
      let query;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config2 === null || config2 === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config2.submit === "function") {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        result = query = config2;
        if (typeof values === "function") {
          config2.callback = values;
        }
      } else {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        query = new NativeQuery(config2, values, callback);
        if (!query.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query.callback || (() => {
        });
        readTimeoutTimer = setTimeout(() => {
          const error = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error, this.connection);
          });
          queryCallback(error);
          query.callback = () => {
          };
          const index = this._queryQueue.indexOf(query);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      if (this._queryQueue.length > 0) {
        queryQueueLengthDeprecationNotice();
      }
      this._queryQueue.push(query);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self = this;
      this._ending = true;
      if (!this._connected) {
        this.once("connect", this.end.bind(this, cb));
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = /* @__PURE__ */ __name((err) => err ? reject(err) : resolve(), "cb");
        });
      }
      this.native.end(function() {
        self._connected = false;
        self._errorAllQueries(new Error("Connection terminated"));
        process.nextTick(() => {
          self.emit("end");
          if (cb) cb();
        });
      });
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query = this._queryQueue.shift();
      if (!query) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query;
      query.submit(this);
      const self = this;
      query.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query) {
      if (this._activeQuery === query) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
    Client2.prototype.isConnected = function() {
      return this._connected;
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    module.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    var Client2 = require_client();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool3 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = /* @__PURE__ */ __name((Client3) => {
      return class BoundPool extends Pool3 {
        static {
          __name(this, "BoundPool");
        }
        constructor(options) {
          super(options, Client3);
        }
      };
    }, "poolFactory");
    var PG = /* @__PURE__ */ __name(function(clientConstructor2) {
      this.defaults = defaults2;
      this.Client = clientConstructor2;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    }, "PG");
    var clientConstructor = Client2;
    var forceNative = false;
    try {
      forceNative = !!process.env.NODE_PG_FORCE_NATIVE;
    } catch {
    }
    if (forceNative) {
      clientConstructor = require_native();
    }
    module.exports = new PG(clientConstructor);
    Object.defineProperty(module.exports, "native", {
      configurable: true,
      enumerable: false,
      get() {
        let native = null;
        try {
          native = new PG(require_native());
        } catch (err) {
          if (err.code !== "MODULE_NOT_FOUND") {
            throw err;
          }
        }
        Object.defineProperty(module.exports, "native", {
          value: native
        });
        return native;
      }
    });
  }
});

// node_modules/pg/esm/index.mjs
var import_lib, Client, Pool, Connection, types, Query, DatabaseError, escapeIdentifier, escapeLiteral, Result, TypeOverrides, defaults, esm_default;
var init_esm = __esm({
  "node_modules/pg/esm/index.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    import_lib = __toESM(require_lib2(), 1);
    Client = import_lib.default.Client;
    Pool = import_lib.default.Pool;
    Connection = import_lib.default.Connection;
    types = import_lib.default.types;
    Query = import_lib.default.Query;
    DatabaseError = import_lib.default.DatabaseError;
    escapeIdentifier = import_lib.default.escapeIdentifier;
    escapeLiteral = import_lib.default.escapeLiteral;
    Result = import_lib.default.Result;
    TypeOverrides = import_lib.default.TypeOverrides;
    defaults = import_lib.default.defaults;
    esm_default = import_lib.default;
  }
});

// src/lib/db.ts
var db_exports = {};
__export(db_exports, {
  getDb: () => getDb
});
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryableConnectionError(error) {
  const message2 = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();
  if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ECONNREFUSED" || code === "EPIPE" || code === "DB_QUERY_TIMEOUT") return true;
  return message2.includes("server connection attempt failed") || message2.includes("connection refused") || message2.includes("timeout exceeded when trying to connect") || message2.includes("connection terminated unexpectedly") || message2.includes("connection closed") || message2.includes("connect timeout") || message2.includes("client has encountered a connection error") || message2.includes("cannot use a pool after calling end on the pool") || message2.includes("too many clients already") || message2.includes("remaining connection slots are reserved");
}
function isReadOnlyQuery(queryText) {
  if (typeof queryText !== "string") return false;
  const normalized = queryText.trim().toLowerCase();
  return normalized.startsWith("select") || normalized.startsWith("with") || normalized.startsWith("show") || normalized.startsWith("explain");
}
async function withTimeout(promise, timeoutMs) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const timeoutError = new Error(`DB_QUERY_TIMEOUT after ${timeoutMs}ms`);
      timeoutError.code = "DB_QUERY_TIMEOUT";
      reject(timeoutError);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}
function getPool(connectionString) {
  if (!poolInstance || poolConnKey !== connectionString) {
    poolConnKey = connectionString;
    poolInstance = new Pool2({
      connectionString,
      max: 10,
      min: 0,
      idleTimeoutMillis: 15e3,
      connectionTimeoutMillis: 1e4,
      maxUses: 100
    });
  }
  return poolInstance;
}
function getDb(env2) {
  if (dbInstance) return dbInstance;
  const connectionString = env2.HYPERDRIVE?.connectionString || env2.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL ou binding HYPERDRIVE nao configurado.");
  }
  dbInstance = {
    async query(text, params) {
      const isReadOnly = isReadOnlyQuery(text);
      const maxAttempts = isReadOnly ? 2 : 1;
      let lastError = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const pool = getPool(connectionString);
        try {
          if (attempt === 1 && !text.toLowerCase().includes("set search_path")) {
            try {
              await pool.query("SET search_path TO public, pg_catalog");
            } catch (pathErr) {
              console.warn("[DB] Falha ao definir search_path:", pathErr.message);
            }
          }
          const result = await withTimeout(pool.query(text, params), isReadOnly ? 2e4 : 25e3);
          return result;
        } catch (error) {
          lastError = error;
          if (!isRetryableConnectionError(error) || attempt >= maxAttempts) {
            throw error;
          }
          try {
            await pool.end();
          } catch {
          }
          poolInstance = null;
          poolConnKey = "";
          const delay = 100 + attempt * 200;
          console.warn(`[DB] Latencia/Instabilidade detectada (${attempt}/${maxAttempts}). Retentando em ${delay}ms...`);
          await wait(delay);
        }
      }
      throw lastError || new Error("Falha de banco.");
    }
  };
  return dbInstance;
}
var Pool2, dbInstance, poolInstance, poolConnKey;
var init_db = __esm({
  "src/lib/db.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_esm();
    ({ Pool: Pool2 } = esm_default);
    __name(wait, "wait");
    __name(isRetryableConnectionError, "isRetryableConnectionError");
    __name(isReadOnlyQuery, "isReadOnlyQuery");
    __name(withTimeout, "withTimeout");
    dbInstance = null;
    poolInstance = null;
    poolConnKey = "";
    __name(getPool, "getPool");
    __name(getDb, "getDb");
  }
});

// node_modules/jose/dist/webapi/lib/buffer_utils.js
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
var encoder, decoder, MAX_INT32;
var init_buffer_utils = __esm({
  "node_modules/jose/dist/webapi/lib/buffer_utils.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    MAX_INT32 = 2 ** 32;
    __name(concat, "concat");
    __name(encode, "encode");
  }
});

// node_modules/jose/dist/webapi/lib/base64.js
function encodeBase64(input) {
  if (Uint8Array.prototype.toBase64) {
    return input.toBase64();
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < input.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
var init_base64 = __esm({
  "node_modules/jose/dist/webapi/lib/base64.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    __name(encodeBase64, "encodeBase64");
    __name(decodeBase64, "decodeBase64");
  }
});

// node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
function encode2(input) {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  if (Uint8Array.prototype.toBase64) {
    return unencoded.toBase64({ alphabet: "base64url", omitPadding: true });
  }
  return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
var init_base64url = __esm({
  "node_modules/jose/dist/webapi/util/base64url.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_buffer_utils();
    init_base64();
    __name(decode, "decode");
    __name(encode2, "encode");
  }
});

// node_modules/jose/dist/webapi/lib/crypto_key.js
function getHashLength(hash2) {
  return parseInt(hash2.name.slice(4), 10);
}
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
var unusable, isAlgorithm;
var init_crypto_key = __esm({
  "node_modules/jose/dist/webapi/lib/crypto_key.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    unusable = /* @__PURE__ */ __name((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
    isAlgorithm = /* @__PURE__ */ __name((algorithm, name) => algorithm.name === name, "isAlgorithm");
    __name(getHashLength, "getHashLength");
    __name(checkHashLength, "checkHashLength");
    __name(getNamedCurve, "getNamedCurve");
    __name(checkUsage, "checkUsage");
    __name(checkSigCryptoKey, "checkSigCryptoKey");
  }
});

// node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types2) {
  types2 = types2.filter(Boolean);
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `one of type ${types2.join(", ")}, or ${last}.`;
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`;
  } else {
    msg += `of type ${types2[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
var invalidKeyInput, withAlg;
var init_invalid_key_input = __esm({
  "node_modules/jose/dist/webapi/lib/invalid_key_input.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    __name(message, "message");
    invalidKeyInput = /* @__PURE__ */ __name((actual, ...types2) => message("Key must be ", actual, ...types2), "invalidKeyInput");
    withAlg = /* @__PURE__ */ __name((alg, actual, ...types2) => message(`Key for the ${alg} algorithm must be `, actual, ...types2), "withAlg");
  }
});

// node_modules/jose/dist/webapi/util/errors.js
var JOSEError, JWTClaimValidationFailed, JWTExpired, JOSEAlgNotAllowed, JOSENotSupported, JWSInvalid, JWTInvalid, JWSSignatureVerificationFailed;
var init_errors = __esm({
  "node_modules/jose/dist/webapi/util/errors.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    JOSEError = class extends Error {
      static {
        __name(this, "JOSEError");
      }
      static code = "ERR_JOSE_GENERIC";
      code = "ERR_JOSE_GENERIC";
      constructor(message2, options) {
        super(message2, options);
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    JWTClaimValidationFailed = class extends JOSEError {
      static {
        __name(this, "JWTClaimValidationFailed");
      }
      static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JWTExpired = class extends JOSEError {
      static {
        __name(this, "JWTExpired");
      }
      static code = "ERR_JWT_EXPIRED";
      code = "ERR_JWT_EXPIRED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JOSEAlgNotAllowed = class extends JOSEError {
      static {
        __name(this, "JOSEAlgNotAllowed");
      }
      static code = "ERR_JOSE_ALG_NOT_ALLOWED";
      code = "ERR_JOSE_ALG_NOT_ALLOWED";
    };
    JOSENotSupported = class extends JOSEError {
      static {
        __name(this, "JOSENotSupported");
      }
      static code = "ERR_JOSE_NOT_SUPPORTED";
      code = "ERR_JOSE_NOT_SUPPORTED";
    };
    JWSInvalid = class extends JOSEError {
      static {
        __name(this, "JWSInvalid");
      }
      static code = "ERR_JWS_INVALID";
      code = "ERR_JWS_INVALID";
    };
    JWTInvalid = class extends JOSEError {
      static {
        __name(this, "JWTInvalid");
      }
      static code = "ERR_JWT_INVALID";
      code = "ERR_JWT_INVALID";
    };
    JWSSignatureVerificationFailed = class extends JOSEError {
      static {
        __name(this, "JWSSignatureVerificationFailed");
      }
      static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      constructor(message2 = "signature verification failed", options) {
        super(message2, options);
      }
    };
  }
});

// node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey, isKeyObject, isKeyLike;
var init_is_key_like = __esm({
  "node_modules/jose/dist/webapi/lib/is_key_like.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    isCryptoKey = /* @__PURE__ */ __name((key) => {
      if (key?.[Symbol.toStringTag] === "CryptoKey")
        return true;
      try {
        return key instanceof CryptoKey;
      } catch {
        return false;
      }
    }, "isCryptoKey");
    isKeyObject = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
    isKeyLike = /* @__PURE__ */ __name((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");
  }
});

// node_modules/jose/dist/webapi/lib/helpers.js
function assertNotSet(value, name) {
  if (value) {
    throw new TypeError(`${name} can only be called once`);
  }
}
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
var unprotected;
var init_helpers = __esm({
  "node_modules/jose/dist/webapi/lib/helpers.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_base64url();
    unprotected = Symbol();
    __name(assertNotSet, "assertNotSet");
    __name(decodeBase64url, "decodeBase64url");
  }
});

// node_modules/jose/dist/webapi/lib/type_checks.js
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
var isObjectLike, isJWK, isPrivateJWK, isPublicJWK, isSecretJWK;
var init_type_checks = __esm({
  "node_modules/jose/dist/webapi/lib/type_checks.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    isObjectLike = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null, "isObjectLike");
    __name(isObject, "isObject");
    __name(isDisjoint, "isDisjoint");
    isJWK = /* @__PURE__ */ __name((key) => isObject(key) && typeof key.kty === "string", "isJWK");
    isPrivateJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
    isPublicJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
    isSecretJWK = /* @__PURE__ */ __name((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");
  }
});

// node_modules/jose/dist/webapi/lib/signing.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
function subtleAlgorithm(alg, algorithm) {
  const hash2 = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash: hash2, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash: hash2, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash: hash2, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash: hash2, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
async function sign(alg, key, data) {
  const cryptoKey = await getSigKey(alg, key, "sign");
  checkKeyLength(alg, cryptoKey);
  const signature = await crypto.subtle.sign(subtleAlgorithm(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
var init_signing = __esm({
  "node_modules/jose/dist/webapi/lib/signing.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_errors();
    init_crypto_key();
    init_invalid_key_input();
    __name(checkKeyLength, "checkKeyLength");
    __name(subtleAlgorithm, "subtleAlgorithm");
    __name(getSigKey, "getSigKey");
    __name(sign, "sign");
    __name(verify, "verify");
  }
});

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
var unsupportedAlg;
var init_jwk_to_key = __esm({
  "node_modules/jose/dist/webapi/lib/jwk_to_key.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_errors();
    unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
    __name(subtleMapping, "subtleMapping");
    __name(jwkToKey, "jwkToKey");
  }
});

// node_modules/jose/dist/webapi/lib/normalize_key.js
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
var unusableForAlg, cache, handleJWK, handleKeyObject;
var init_normalize_key = __esm({
  "node_modules/jose/dist/webapi/lib/normalize_key.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_type_checks();
    init_base64url();
    init_jwk_to_key();
    init_is_key_like();
    unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
    handleJWK = /* @__PURE__ */ __name(async (key, jwk, alg, freeze = false) => {
      cache ||= /* @__PURE__ */ new WeakMap();
      let cached = cache.get(key);
      if (cached?.[alg]) {
        return cached[alg];
      }
      const cryptoKey = await jwkToKey({ ...jwk, alg });
      if (freeze)
        Object.freeze(key);
      if (!cached) {
        cache.set(key, { [alg]: cryptoKey });
      } else {
        cached[alg] = cryptoKey;
      }
      return cryptoKey;
    }, "handleJWK");
    handleKeyObject = /* @__PURE__ */ __name((keyObject, alg) => {
      cache ||= /* @__PURE__ */ new WeakMap();
      let cached = cache.get(keyObject);
      if (cached?.[alg]) {
        return cached[alg];
      }
      const isPublic = keyObject.type === "public";
      const extractable = isPublic ? true : false;
      let cryptoKey;
      if (keyObject.asymmetricKeyType === "x25519") {
        switch (alg) {
          case "ECDH-ES":
          case "ECDH-ES+A128KW":
          case "ECDH-ES+A192KW":
          case "ECDH-ES+A256KW":
            break;
          default:
            throw new TypeError(unusableForAlg);
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
      }
      if (keyObject.asymmetricKeyType === "ed25519") {
        if (alg !== "EdDSA" && alg !== "Ed25519") {
          throw new TypeError(unusableForAlg);
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
          isPublic ? "verify" : "sign"
        ]);
      }
      switch (keyObject.asymmetricKeyType) {
        case "ml-dsa-44":
        case "ml-dsa-65":
        case "ml-dsa-87": {
          if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
            throw new TypeError(unusableForAlg);
          }
          cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
            isPublic ? "verify" : "sign"
          ]);
        }
      }
      if (keyObject.asymmetricKeyType === "rsa") {
        let hash2;
        switch (alg) {
          case "RSA-OAEP":
            hash2 = "SHA-1";
            break;
          case "RS256":
          case "PS256":
          case "RSA-OAEP-256":
            hash2 = "SHA-256";
            break;
          case "RS384":
          case "PS384":
          case "RSA-OAEP-384":
            hash2 = "SHA-384";
            break;
          case "RS512":
          case "PS512":
          case "RSA-OAEP-512":
            hash2 = "SHA-512";
            break;
          default:
            throw new TypeError(unusableForAlg);
        }
        if (alg.startsWith("RSA-OAEP")) {
          return keyObject.toCryptoKey({
            name: "RSA-OAEP",
            hash: hash2
          }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
        }
        cryptoKey = keyObject.toCryptoKey({
          name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
          hash: hash2
        }, extractable, [isPublic ? "verify" : "sign"]);
      }
      if (keyObject.asymmetricKeyType === "ec") {
        const nist = /* @__PURE__ */ new Map([
          ["prime256v1", "P-256"],
          ["secp384r1", "P-384"],
          ["secp521r1", "P-521"]
        ]);
        const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
        if (!namedCurve) {
          throw new TypeError(unusableForAlg);
        }
        const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
        if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
          cryptoKey = keyObject.toCryptoKey({
            name: "ECDSA",
            namedCurve
          }, extractable, [isPublic ? "verify" : "sign"]);
        }
        if (alg.startsWith("ECDH-ES")) {
          cryptoKey = keyObject.toCryptoKey({
            name: "ECDH",
            namedCurve
          }, extractable, isPublic ? [] : ["deriveBits"]);
        }
      }
      if (!cryptoKey) {
        throw new TypeError(unusableForAlg);
      }
      if (!cached) {
        cache.set(keyObject, { [alg]: cryptoKey });
      } else {
        cached[alg] = cryptoKey;
      }
      return cryptoKey;
    }, "handleKeyObject");
    __name(normalizeKey, "normalizeKey");
  }
});

// node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
var init_validate_crit = __esm({
  "node_modules/jose/dist/webapi/lib/validate_crit.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_errors();
    __name(validateCrit, "validateCrit");
  }
});

// node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
var init_validate_algorithms = __esm({
  "node_modules/jose/dist/webapi/lib/validate_algorithms.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    __name(validateAlgorithms, "validateAlgorithms");
  }
});

// node_modules/jose/dist/webapi/lib/check_key_type.js
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
var tag, jwkMatchesOp, symmetricTypeCheck, asymmetricTypeCheck;
var init_check_key_type = __esm({
  "node_modules/jose/dist/webapi/lib/check_key_type.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_invalid_key_input();
    init_is_key_like();
    init_type_checks();
    tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
    jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
      if (key.use !== void 0) {
        let expected;
        switch (usage) {
          case "sign":
          case "verify":
            expected = "sig";
            break;
          case "encrypt":
          case "decrypt":
            expected = "enc";
            break;
        }
        if (key.use !== expected) {
          throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
        }
      }
      if (key.alg !== void 0 && key.alg !== alg) {
        throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
      }
      if (Array.isArray(key.key_ops)) {
        let expectedKeyOp;
        switch (true) {
          case (usage === "sign" || usage === "verify"):
          case alg === "dir":
          case alg.includes("CBC-HS"):
            expectedKeyOp = usage;
            break;
          case alg.startsWith("PBES2"):
            expectedKeyOp = "deriveBits";
            break;
          case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
            if (!alg.includes("GCM") && alg.endsWith("KW")) {
              expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
            } else {
              expectedKeyOp = usage;
            }
            break;
          case (usage === "encrypt" && alg.startsWith("RSA")):
            expectedKeyOp = "wrapKey";
            break;
          case usage === "decrypt":
            expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
            break;
        }
        if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
          throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
        }
      }
      return true;
    }, "jwkMatchesOp");
    symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
      if (key instanceof Uint8Array)
        return;
      if (isJWK(key)) {
        if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
      }
      if (!isKeyLike(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
      }
      if (key.type !== "secret") {
        throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
      }
    }, "symmetricTypeCheck");
    asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
      if (isJWK(key)) {
        switch (usage) {
          case "decrypt":
          case "sign":
            if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
          case "encrypt":
          case "verify":
            if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
        }
      }
      if (!isKeyLike(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
      }
      if (key.type === "secret") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
      }
      if (key.type === "public") {
        switch (usage) {
          case "sign":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
          case "decrypt":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
        }
      }
      if (key.type === "private") {
        switch (usage) {
          case "verify":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
          case "encrypt":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
        }
      }
    }, "asymmetricTypeCheck");
    __name(checkKeyType, "checkKeyType");
  }
});

// node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
var init_verify = __esm({
  "node_modules/jose/dist/webapi/jws/flattened/verify.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_base64url();
    init_signing();
    init_errors();
    init_buffer_utils();
    init_helpers();
    init_type_checks();
    init_type_checks();
    init_check_key_type();
    init_validate_crit();
    init_validate_algorithms();
    init_normalize_key();
    __name(flattenedVerify, "flattenedVerify");
  }
});

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
var init_verify2 = __esm({
  "node_modules/jose/dist/webapi/jws/compact/verify.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_verify();
    init_errors();
    init_buffer_utils();
    __name(compactVerify, "compactVerify");
  }
});

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
var epoch, minute, hour, day, week, year, REGEX, normalizeTyp, checkAudiencePresence, JWTClaimsBuilder;
var init_jwt_claims_set = __esm({
  "node_modules/jose/dist/webapi/lib/jwt_claims_set.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_errors();
    init_buffer_utils();
    init_type_checks();
    epoch = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch");
    minute = 60;
    hour = minute * 60;
    day = hour * 24;
    week = day * 7;
    year = day * 365.25;
    REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    __name(secs, "secs");
    __name(validateInput, "validateInput");
    normalizeTyp = /* @__PURE__ */ __name((value) => {
      if (value.includes("/")) {
        return value.toLowerCase();
      }
      return `application/${value.toLowerCase()}`;
    }, "normalizeTyp");
    checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
      if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
      }
      if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
      }
      return false;
    }, "checkAudiencePresence");
    __name(validateClaimsSet, "validateClaimsSet");
    JWTClaimsBuilder = class {
      static {
        __name(this, "JWTClaimsBuilder");
      }
      #payload;
      constructor(payload) {
        if (!isObject(payload)) {
          throw new TypeError("JWT Claims Set MUST be an object");
        }
        this.#payload = structuredClone(payload);
      }
      data() {
        return encoder.encode(JSON.stringify(this.#payload));
      }
      get iss() {
        return this.#payload.iss;
      }
      set iss(value) {
        this.#payload.iss = value;
      }
      get sub() {
        return this.#payload.sub;
      }
      set sub(value) {
        this.#payload.sub = value;
      }
      get aud() {
        return this.#payload.aud;
      }
      set aud(value) {
        this.#payload.aud = value;
      }
      set jti(value) {
        this.#payload.jti = value;
      }
      set nbf(value) {
        if (typeof value === "number") {
          this.#payload.nbf = validateInput("setNotBefore", value);
        } else if (value instanceof Date) {
          this.#payload.nbf = validateInput("setNotBefore", epoch(value));
        } else {
          this.#payload.nbf = epoch(/* @__PURE__ */ new Date()) + secs(value);
        }
      }
      set exp(value) {
        if (typeof value === "number") {
          this.#payload.exp = validateInput("setExpirationTime", value);
        } else if (value instanceof Date) {
          this.#payload.exp = validateInput("setExpirationTime", epoch(value));
        } else {
          this.#payload.exp = epoch(/* @__PURE__ */ new Date()) + secs(value);
        }
      }
      set iat(value) {
        if (value === void 0) {
          this.#payload.iat = epoch(/* @__PURE__ */ new Date());
        } else if (value instanceof Date) {
          this.#payload.iat = validateInput("setIssuedAt", epoch(value));
        } else if (typeof value === "string") {
          this.#payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value));
        } else {
          this.#payload.iat = validateInput("setIssuedAt", value);
        }
      }
    };
  }
});

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
var init_verify3 = __esm({
  "node_modules/jose/dist/webapi/jwt/verify.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_verify2();
    init_jwt_claims_set();
    init_errors();
    __name(jwtVerify, "jwtVerify");
  }
});

// node_modules/jose/dist/webapi/jws/flattened/sign.js
var FlattenedSign;
var init_sign = __esm({
  "node_modules/jose/dist/webapi/jws/flattened/sign.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_base64url();
    init_signing();
    init_type_checks();
    init_errors();
    init_buffer_utils();
    init_check_key_type();
    init_validate_crit();
    init_normalize_key();
    init_helpers();
    FlattenedSign = class {
      static {
        __name(this, "FlattenedSign");
      }
      #payload;
      #protectedHeader;
      #unprotectedHeader;
      constructor(payload) {
        if (!(payload instanceof Uint8Array)) {
          throw new TypeError("payload must be an instance of Uint8Array");
        }
        this.#payload = payload;
      }
      setProtectedHeader(protectedHeader) {
        assertNotSet(this.#protectedHeader, "setProtectedHeader");
        this.#protectedHeader = protectedHeader;
        return this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        assertNotSet(this.#unprotectedHeader, "setUnprotectedHeader");
        this.#unprotectedHeader = unprotectedHeader;
        return this;
      }
      async sign(key, options) {
        if (!this.#protectedHeader && !this.#unprotectedHeader) {
          throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
        }
        if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader)) {
          throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
        }
        const joseHeader = {
          ...this.#protectedHeader,
          ...this.#unprotectedHeader
        };
        const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
        let b64 = true;
        if (extensions.has("b64")) {
          b64 = this.#protectedHeader.b64;
          if (typeof b64 !== "boolean") {
            throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
          }
        }
        const { alg } = joseHeader;
        if (typeof alg !== "string" || !alg) {
          throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
        }
        checkKeyType(alg, key, "sign");
        let payloadS;
        let payloadB;
        if (b64) {
          payloadS = encode2(this.#payload);
          payloadB = encode(payloadS);
        } else {
          payloadB = this.#payload;
          payloadS = "";
        }
        let protectedHeaderString;
        let protectedHeaderBytes;
        if (this.#protectedHeader) {
          protectedHeaderString = encode2(JSON.stringify(this.#protectedHeader));
          protectedHeaderBytes = encode(protectedHeaderString);
        } else {
          protectedHeaderString = "";
          protectedHeaderBytes = new Uint8Array();
        }
        const data = concat(protectedHeaderBytes, encode("."), payloadB);
        const k = await normalizeKey(key, alg);
        const signature = await sign(alg, k, data);
        const jws = {
          signature: encode2(signature),
          payload: payloadS
        };
        if (this.#unprotectedHeader) {
          jws.header = this.#unprotectedHeader;
        }
        if (this.#protectedHeader) {
          jws.protected = protectedHeaderString;
        }
        return jws;
      }
    };
  }
});

// node_modules/jose/dist/webapi/jws/compact/sign.js
var CompactSign;
var init_sign2 = __esm({
  "node_modules/jose/dist/webapi/jws/compact/sign.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_sign();
    CompactSign = class {
      static {
        __name(this, "CompactSign");
      }
      #flattened;
      constructor(payload) {
        this.#flattened = new FlattenedSign(payload);
      }
      setProtectedHeader(protectedHeader) {
        this.#flattened.setProtectedHeader(protectedHeader);
        return this;
      }
      async sign(key, options) {
        const jws = await this.#flattened.sign(key, options);
        if (jws.payload === void 0) {
          throw new TypeError("use the flattened module for creating JWS with b64: false");
        }
        return `${jws.protected}.${jws.payload}.${jws.signature}`;
      }
    };
  }
});

// node_modules/jose/dist/webapi/jwt/sign.js
var SignJWT;
var init_sign3 = __esm({
  "node_modules/jose/dist/webapi/jwt/sign.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_sign2();
    init_errors();
    init_jwt_claims_set();
    SignJWT = class {
      static {
        __name(this, "SignJWT");
      }
      #protectedHeader;
      #jwt;
      constructor(payload = {}) {
        this.#jwt = new JWTClaimsBuilder(payload);
      }
      setIssuer(issuer) {
        this.#jwt.iss = issuer;
        return this;
      }
      setSubject(subject) {
        this.#jwt.sub = subject;
        return this;
      }
      setAudience(audience) {
        this.#jwt.aud = audience;
        return this;
      }
      setJti(jwtId) {
        this.#jwt.jti = jwtId;
        return this;
      }
      setNotBefore(input) {
        this.#jwt.nbf = input;
        return this;
      }
      setExpirationTime(input) {
        this.#jwt.exp = input;
        return this;
      }
      setIssuedAt(input) {
        this.#jwt.iat = input;
        return this;
      }
      setProtectedHeader(protectedHeader) {
        this.#protectedHeader = protectedHeader;
        return this;
      }
      async sign(key, options) {
        const sig = new CompactSign(this.#jwt.data());
        sig.setProtectedHeader(this.#protectedHeader);
        if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false) {
          throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
        }
        return sig.sign(key, options);
      }
    };
  }
});

// node_modules/jose/dist/webapi/index.js
var init_webapi = __esm({
  "node_modules/jose/dist/webapi/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_verify3();
    init_sign3();
  }
});

// src/lib/ddl.ts
function normalizeErrorMessage(error) {
  return String(error?.message || error || "").toLowerCase();
}
function isSchemaPermissionError(error) {
  const message2 = normalizeErrorMessage(error);
  return message2.includes("permission denied") || message2.includes("must be owner") || message2.includes("insufficient privilege");
}
function isSchemaMissingError(error) {
  const message2 = normalizeErrorMessage(error);
  return message2.includes("does not exist") || message2.includes("undefined table") || message2.includes("undefined column") || message2.includes("undefined function");
}
async function runBestEffortDdl(db, key, statements) {
  if (!ENABLE_RUNTIME_DDL) return;
  if (ensureAttempted.has(key)) return;
  ensureAttempted.add(key);
  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch (error) {
      if (isSchemaPermissionError(error)) {
        console.warn(`[DDL] Sem permissao para executar "${key}". Prosseguindo sem DDL no runtime.`);
        return;
      }
      console.warn(`[DDL] Falha ao executar passo de "${key}". Prosseguindo.`, error);
    }
  }
}
var ensureAttempted, ENABLE_RUNTIME_DDL;
var init_ddl = __esm({
  "src/lib/ddl.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    ensureAttempted = /* @__PURE__ */ new Set();
    ENABLE_RUNTIME_DDL = true;
    __name(normalizeErrorMessage, "normalizeErrorMessage");
    __name(isSchemaPermissionError, "isSchemaPermissionError");
    __name(isSchemaMissingError, "isSchemaMissingError");
    __name(runBestEffortDdl, "runBestEffortDdl");
  }
});

// src/lib/auth.ts
function getJwtSecret(env2) {
  const candidate = String(env2.JWT_SECRET || "").trim();
  if (candidate.length < 32) {
    throw new Error("JWT_SECRET nao configurado ou e muito curto (minimo 32 caracteres). Configure no Cloudflare Workers secrets.");
  }
  return new TextEncoder().encode(candidate);
}
var authenticateToken, checkAdmin;
var init_auth = __esm({
  "src/lib/auth.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_webapi();
    init_db();
    init_ddl();
    __name(getJwtSecret, "getJwtSecret");
    authenticateToken = /* @__PURE__ */ __name(async (c, next) => {
      const authHeader = c.req.header("authorization");
      const token = authHeader?.split(" ")[1];
      if (!token) {
        return c.json({ error: "Acesso negado. Token nao fornecido." }, 401);
      }
      let payload;
      try {
        const verified = await jwtVerify(token, getJwtSecret(c.env));
        payload = verified.payload;
      } catch {
        return c.json({ error: "Token invalido ou expirado." }, 403);
      }
      const db = getDb(c.env);
      let user = null;
      try {
        const result = await db.query("SELECT token_version FROM public.users WHERE id = $1 LIMIT 1", [payload.id]);
        user = result.rows[0];
      } catch (error) {
        if (isSchemaMissingError(error)) {
          const fallback = await db.query("SELECT id FROM public.users WHERE id = $1 LIMIT 1", [payload.id]);
          user = fallback.rows[0] || null;
        } else if (isSchemaPermissionError(error)) {
          return c.json({ error: "Falha de permissao no banco de dados. Tentando autorrecuperacao..." }, 503);
        } else {
          throw error;
        }
      }
      if (!user) {
        return c.json({ error: "Usuario nao encontrado." }, 401);
      }
      if (payload.tv !== void 0 && user.token_version !== void 0 && Number(payload.tv) !== Number(user.token_version)) {
        return c.json({ error: "Sessao invalidada. Faca login novamente." }, 401);
      }
      c.set("user", {
        id: String(payload.id),
        email: payload.email ? String(payload.email) : void 0,
        tv: payload.tv ? Number(payload.tv) : void 0
      });
      await next();
    }, "authenticateToken");
    checkAdmin = /* @__PURE__ */ __name(async (c, next) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ error: "Acesso negado." }, 401);
      }
      const db = getDb(c.env);
      let result;
      try {
        result = await db.query(
          `SELECT 1
         FROM public.user_profiles up
         JOIN public.user_groups ug ON ug.id = up.group_id
        WHERE up.id = $1
          AND ug.name = 'Administrador'
        LIMIT 1`,
          [user.id]
        );
      } catch (error) {
        if (isSchemaMissingError(error)) {
          return c.json({ error: "Controle de grupos/permissoes indisponivel no banco atual." }, 503);
        }
        if (isSchemaPermissionError(error)) {
          return c.json({ error: "Falha de permissao ao validar administrador. Verifique o esquema public do banco." }, 503);
        }
        throw error;
      }
      if (result.rows.length === 0) {
        return c.json({ error: "Acesso restrito a administradores." }, 403);
      }
      await next();
    }, "checkAdmin");
  }
});

// src/lib/messageUtils.ts
function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.startsWith("55") ? digits.slice(2) : digits;
}
function toEvolutionNumber(phone) {
  const local = normalizePhone(phone);
  if (!local) return null;
  return `55${local}`;
}
function wait2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryableEvolutionTransportError(error) {
  const message2 = String(error?.message || "").toLowerCase();
  return message2.includes("connection closed") || message2.includes("socket hang up") || message2.includes("econnreset") || message2.includes("etimedout") || message2.includes("fetch failed") || message2.includes("und_err_socket") || message2.includes("eai_again") || message2.includes("enotfound");
}
async function postEvolution(fetchImpl, url, apiKey, body) {
  const startedAt = Date.now();
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify(body)
  });
  const responseTimeMs = Date.now() - startedAt;
  const rawText = await response.text().catch(() => "");
  if (!response.ok) {
    throw Object.assign(new Error(rawText || `HTTP ${response.status}`), {
      status: response.status,
      responseTimeMs
    });
  }
  return { status: response.status, responseTimeMs, rawText };
}
async function postEvolutionWithRetry(fetchImpl, url, apiKey, body) {
  let lastError = null;
  for (let attempt = 1; attempt <= EVOLUTION_RETRY_ATTEMPTS; attempt++) {
    try {
      return await postEvolution(fetchImpl, url, apiKey, body);
    } catch (error) {
      lastError = error;
      const canRetry = attempt < EVOLUTION_RETRY_ATTEMPTS && isRetryableEvolutionTransportError(error);
      if (!canRetry) throw error;
      const delay = EVOLUTION_RETRY_DELAYS_MS[Math.min(attempt - 1, EVOLUTION_RETRY_DELAYS_MS.length - 1)];
      await wait2(delay);
    }
  }
  throw lastError;
}
function ensureValidMediaUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname.split("/").map((seg) => encodeURIComponent(decodeURIComponent(seg))).join("/");
    return parsed.toString();
  } catch {
    return url;
  }
}
function resolveTemplate(template, contact) {
  let result = String(template || "");
  const name = String(contact.name || "");
  const firstName = name.split(" ")[0] || name;
  const replacements = {
    "{name}": name,
    "{primeiro_nome}": firstName,
    "{phone}": String(contact.phone || ""),
    "{category}": String(contact.category || ""),
    "{city}": String(contact.city || ""),
    "{email}": String(contact.email || ""),
    "{rating}": String(contact.rating || "")
  };
  for (const [key, value] of Object.entries(replacements)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "g"), value);
  }
  return result;
}
function decodeHtmlEntities(value) {
  return String(value || "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}
function htmlToWhatsapp(html) {
  if (!html) return "";
  let text = String(html);
  text = text.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, "*$2*");
  text = text.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, "_$2_");
  text = text.replace(/<(s|del)>([\s\S]*?)<\/(s|del)>/gi, "~$2~");
  text = text.replace(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, url, label) => {
    const cleanLabel = String(label || "").replace(/<[^>]+>/g, "").trim();
    if (!cleanLabel) return String(url || "");
    return `${cleanLabel} (${String(url || "")})`;
  });
  text = text.replace(/<li[^>]*>\s*([\s\S]*?)\s*<\/li>/gi, "- $1\n");
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|div)>/gi, "\n");
  return decodeHtmlEntities(text).replace(/<[^>]+>/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function ensureAbsoluteUrl(url, baseUrl) {
  const raw2 = String(url || "").trim();
  if (!raw2) return "";
  if (raw2.startsWith("http://") || raw2.startsWith("https://")) return raw2;
  if (raw2.startsWith("/")) return `${baseUrl.replace(/\/+$/, "")}${raw2}`;
  return `${baseUrl.replace(/\/+$/, "")}/${raw2}`;
}
var EVOLUTION_RETRY_ATTEMPTS, EVOLUTION_RETRY_DELAYS_MS;
var init_messageUtils = __esm({
  "src/lib/messageUtils.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    __name(normalizePhone, "normalizePhone");
    __name(toEvolutionNumber, "toEvolutionNumber");
    EVOLUTION_RETRY_ATTEMPTS = 3;
    EVOLUTION_RETRY_DELAYS_MS = [1500, 3e3];
    __name(wait2, "wait");
    __name(isRetryableEvolutionTransportError, "isRetryableEvolutionTransportError");
    __name(postEvolution, "postEvolution");
    __name(postEvolutionWithRetry, "postEvolutionWithRetry");
    __name(ensureValidMediaUrl, "ensureValidMediaUrl");
    __name(resolveTemplate, "resolveTemplate");
    __name(decodeHtmlEntities, "decodeHtmlEntities");
    __name(htmlToWhatsapp, "htmlToWhatsapp");
    __name(ensureAbsoluteUrl, "ensureAbsoluteUrl");
  }
});

// src/lib/runtimeSchema.ts
function isSkippableRuntimeSchemaError(error) {
  const message2 = String(error?.message || error || "").toLowerCase();
  return message2.includes("permission denied") || message2.includes("insufficient privilege") || message2.includes("must be owner") || message2.includes("catalog") || message2.includes("information_schema") || message2.includes("gen_random_uuid") && message2.includes("does not exist");
}
async function runSchemaBestEffort(task, context) {
  if (!ENABLE_RUNTIME_SCHEMA_ENSURE2) return;
  try {
    await task();
  } catch (error) {
    if (isSkippableRuntimeSchemaError(error)) {
      console.warn(`[RuntimeSchema:${context}] sem permissao/funcao para DDL runtime; seguindo sem migracao automatica.`);
      return;
    }
    throw error;
  }
}
var ENABLE_RUNTIME_SCHEMA_ENSURE2;
var init_runtimeSchema = __esm({
  "src/lib/runtimeSchema.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    ENABLE_RUNTIME_SCHEMA_ENSURE2 = true;
    __name(isSkippableRuntimeSchemaError, "isSkippableRuntimeSchemaError");
    __name(runSchemaBestEffort, "runSchemaBestEffort");
  }
});

// src/routes/instanceLab.ts
var instanceLab_exports = {};
__export(instanceLab_exports, {
  handleScheduledWarming: () => handleScheduledWarming,
  instanceLabRoutes: () => instanceLabRoutes
});
function safeTrim(value) {
  return String(value || "").trim();
}
function wait3(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}
function pickTextMessage(index) {
  return LAB_TEXT_MESSAGES[index % LAB_TEXT_MESSAGES.length];
}
async function sendPresence({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  presence
}) {
  const number = toEvolutionNumber(toPhone);
  if (!number) return;
  try {
    await postEvolution(fetch, `${evolutionUrl}/chat/sendPresence/${safeTrim(instanceName)}`, apiKey, {
      number,
      presence
    });
  } catch (err) {
    console.warn(`[InstanceLab] Falha ao enviar presenca ${presence} para ${instanceName}:`, err?.message || String(err));
  }
}
async function generateLabMessage({
  db,
  userId,
  env: env2,
  fromPhone,
  toPhone,
  pairId
}) {
  try {
    const access = await resolveGeminiAccess(userId, db, env2);
    if (!access.apiKey) return pickTextMessage(Math.floor(Math.random() * 10));
    const history = await db.query(
      `SELECT from_phone, content_summary
         FROM public.warmer_logs
        WHERE warmer_id = $1
          AND message_type = 'text'
        ORDER BY sent_at DESC
        LIMIT 5`,
      [pairId]
    );
    const contextStr = history.rows.reverse().map((r) => `${r.from_phone === fromPhone ? "Eu" : "Outro"}: ${r.content_summary}`).join("\n");
    const warmerData = await db.query("SELECT ai_persona FROM public.warmer_configs WHERE id = $1", [pairId]);
    const persona = warmerData.rows[0]?.ai_persona || "participando de uma conversa informal e r\xE1pida para validar a conex\xE3o";
    const prompt = `
Voc\xEA \xE9 um usu\xE1rio de WhatsApp ${persona}. 
Hist\xF3rico recente:
${contextStr || "(Sem hist\xF3rico ainda)"}

Gere a PR\xD3XIMA mensagem curta (m\xE1ximo 15 palavras), informal, em Portugu\xEAs do Brasil. 
N\xE3o use emojis excessivos. Seja natural como um humano. Responda apenas com o texto da mensagem.
`.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${access.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 60 }
      })
    });
    if (!res.ok) throw new Error("Falha Gemini");
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || pickTextMessage(Math.floor(Math.random() * 10));
  } catch {
    return pickTextMessage(Math.floor(Math.random() * 10));
  }
}
async function resolveGeminiAccess(userId, db, env2) {
  const [profileResult, settingsResult] = await Promise.all([
    db.query("SELECT use_global_ai, ai_api_key FROM public.user_profiles WHERE id = $1 LIMIT 1", [userId]),
    db.query("SELECT global_ai_api_key FROM public.app_settings ORDER BY id DESC LIMIT 1")
  ]);
  const profile = profileResult.rows[0] || {};
  const settings = settingsResult.rows[0] || {};
  const useGlobalAi = profile.use_global_ai ?? true;
  const userAiKey = String(profile.ai_api_key || "").trim();
  const globalAiKey = String(settings.global_ai_api_key || "").trim();
  if (!useGlobalAi && userAiKey) return { apiKey: userAiKey };
  const pooled = await db.query(
    `SELECT api_key FROM public.gemini_api_keys WHERE status = 'ativa' AND requests_count < 20 ORDER BY requests_count ASC LIMIT 1`
  );
  if (pooled.rows[0]?.api_key) return { apiKey: pooled.rows[0].api_key };
  if (useGlobalAi && globalAiKey) return { apiKey: globalAiKey };
  return { apiKey: String(env2.GEMINI_API_KEY || "").trim() };
}
function normalizeEvolutionBaseUrl2(url) {
  return safeTrim(url).replace(/\/+$/, "");
}
function inferFileNameFromUrl(url, fallback) {
  try {
    const parsed = new URL(safeTrim(url));
    const value = decodeURIComponent(parsed.pathname.split("/").pop() || "").trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}
function inferMimeTypeFromUrl(url, mediaType) {
  const lower = safeTrim(url).toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (mediaType === "audio") return "audio/mpeg";
  if (mediaType === "document") return "application/octet-stream";
  return "image/jpeg";
}
function toErrorMessage(error) {
  if (!error) return "Falha desconhecida";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "Erro interno";
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
async function getTableColumns(db, tableName) {
  const cacheKey = `public.${tableName}`;
  const cached = tableColumnsCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.columns;
  }
  try {
    const result = await db.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1`,
      [tableName]
    );
    const columns = new Set(result.rows.map((row) => String(row.column_name)));
    tableColumnsCache.set(cacheKey, {
      columns,
      expiresAt: now + COLUMN_CACHE_TTL_MS
    });
    return columns;
  } catch (err) {
    console.warn(`[InstanceLab:getTableColumns] Nao foi possivel ler colunas de ${tableName}. Usando fallback vazio. Erro:`, err.message);
    return /* @__PURE__ */ new Set();
  }
}
function hasColumn(columns, columnName) {
  return columns.has(columnName);
}
async function tableExists(db, tableName) {
  try {
    const result = await db.query(`SELECT to_regclass($1) AS table_name`, [`public.${tableName}`]);
    return Boolean(result.rows[0]?.table_name);
  } catch (err) {
    console.warn(`[InstanceLab:tableExists] Nao foi possivel verificar existencia da tabela ${tableName}. Assumindo true para evitar crash. Erro:`, err.message);
    return true;
  }
}
async function ensureInstanceLabSchema(db) {
  if (instanceLabSchemaEnsured) return;
  instanceLabSchemaEnsured = true;
  const UUID_GEN = "(md5(random()::text || clock_timestamp()::text)::uuid)";
  await runSchemaBestEffort(async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_configs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID,
        name TEXT,
        instance_a_id TEXT NOT NULL,
        instance_b_id TEXT NOT NULL,
        phone_a TEXT NOT NULL,
        phone_b TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
        default_delay_seconds INTEGER DEFAULT 5,
        default_messages_per_run INTEGER DEFAULT 4,
        sample_image_url TEXT,
        sample_document_url TEXT,
        sample_audio_url TEXT,
        notes TEXT,
        last_run_status TEXT,
        last_run_error TEXT,
        last_run_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_runs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        warmer_id UUID NOT NULL REFERENCES public.warmer_configs(id) ON DELETE CASCADE,
        initiated_by UUID,
        status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
        steps_total INTEGER NOT NULL DEFAULT 1,
        steps_completed INTEGER NOT NULL DEFAULT 0,
        step_delay_seconds INTEGER NOT NULL DEFAULT 5,
        preferred_start_side TEXT CHECK (preferred_start_side IN ('a', 'b')),
        last_error TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        finished_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_logs (
        id BIGSERIAL PRIMARY KEY,
        warmer_id UUID NOT NULL REFERENCES public.warmer_configs(id) ON DELETE CASCADE,
        from_phone TEXT NOT NULL,
        to_phone TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        content_summary TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        run_id UUID REFERENCES public.warmer_runs(id) ON DELETE SET NULL,
        from_instance TEXT,
        to_instance TEXT,
        payload_type TEXT,
        ok BOOLEAN DEFAULT true,
        provider_status INTEGER,
        response_time_ms INTEGER,
        error_detail TEXT
      )
    `);
  }, "instanceLabSchemaInitial");
  await runSchemaBestEffort(async () => {
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS name TEXT`);
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS notes TEXT`);
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS ai_persona TEXT`);
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS night_mode_enabled BOOLEAN DEFAULT true`);
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS night_mode_start TEXT DEFAULT '22:00'`);
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS night_mode_end TEXT DEFAULT '07:00'`);
    await db.query(`ALTER TABLE public.warmer_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    await db.query(`ALTER TABLE public.warmer_runs ADD COLUMN IF NOT EXISTS step_delay_seconds INTEGER NOT NULL DEFAULT 5`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS from_instance TEXT`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS to_instance TEXT`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS payload_type TEXT`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.warmer_runs(id) ON DELETE SET NULL`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS ok BOOLEAN DEFAULT true`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS provider_status INTEGER`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS response_time_ms INTEGER`);
    await db.query(`ALTER TABLE public.warmer_logs ADD COLUMN IF NOT EXISTS error_detail TEXT`);
    await db.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'warmer_logs' AND column_name = 'id' AND data_type = 'uuid'
        ) THEN
          -- Se id \xE9 UUID, precisamos converter
          ALTER TABLE public.warmer_logs ADD COLUMN id_new BIGSERIAL;
          UPDATE public.warmer_logs SET id_new = row_number() OVER (ORDER BY sent_at);
          ALTER TABLE public.warmer_logs DROP COLUMN id;
          ALTER TABLE public.warmer_logs RENAME COLUMN id_new TO id;
          ALTER TABLE public.warmer_logs ALTER COLUMN id SET NOT NULL;
        END IF;
      END $$
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_configs_status ON public.warmer_configs(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_logs_warmer_id_sent_at ON public.warmer_logs(warmer_id, sent_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_warmer_created_at ON public.warmer_runs(warmer_id, created_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_warmer_runs_status_created_at ON public.warmer_runs(status, created_at DESC)`);
  }, "instanceLabUpdatesV2");
}
async function getGlobalEvolutionConfig(db) {
  const result = await db.query(
    `SELECT evolution_api_url, evolution_api_key
       FROM public.app_settings
       ORDER BY id DESC
       LIMIT 1`
  );
  const row = result.rows[0] || {};
  return {
    url: normalizeEvolutionBaseUrl2(row.evolution_api_url),
    apiKey: safeTrim(row.evolution_api_key)
  };
}
async function sendText({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  text
}) {
  const number = toEvolutionNumber(toPhone);
  if (!number) throw new Error("Telefone de destino invalido para o laboratorio.");
  return postEvolutionWithRetry(fetch, `${evolutionUrl}/message/sendText/${safeTrim(instanceName)}`, apiKey, {
    number,
    text,
    linkPreview: false
  });
}
async function sendMedia({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  mediaUrl,
  mediaType,
  caption,
  baseUrl
}) {
  const number = toEvolutionNumber(toPhone);
  if (!number) throw new Error("Telefone de destino invalido para o laboratorio.");
  const rawUrl = baseUrl ? ensureAbsoluteUrl(mediaUrl, baseUrl) : mediaUrl;
  const finalMediaUrl = ensureValidMediaUrl(rawUrl);
  console.log(`[InstanceLab] Enviando media (${mediaType}) de ${instanceName} para ${toPhone}. URL: ${finalMediaUrl.substring(0, 100)}`);
  return postEvolutionWithRetry(fetch, `${evolutionUrl}/message/sendMedia/${safeTrim(instanceName)}`, apiKey, {
    number,
    mediatype: mediaType,
    mimetype: inferMimeTypeFromUrl(finalMediaUrl, mediaType),
    fileName: inferFileNameFromUrl(finalMediaUrl, mediaType === "document" ? "documento" : "imagem"),
    caption: safeTrim(caption),
    media: finalMediaUrl
  });
}
async function sendAudio({
  evolutionUrl,
  apiKey,
  instanceName,
  toPhone,
  audioUrl,
  baseUrl
}) {
  const number = toEvolutionNumber(toPhone);
  if (!number) throw new Error("Telefone de destino invalido para o laboratorio.");
  const rawUrl = baseUrl ? ensureAbsoluteUrl(audioUrl, baseUrl) : audioUrl;
  const finalAudioUrl = ensureValidMediaUrl(rawUrl);
  console.log(`[InstanceLab] Enviando audio de ${instanceName} para ${toPhone}. URL: ${finalAudioUrl.substring(0, 100)}`);
  return postEvolutionWithRetry(fetch, `${evolutionUrl}/message/sendWhatsAppAudio/${safeTrim(instanceName)}`, apiKey, {
    number,
    audio: finalAudioUrl
  });
}
function buildStepPayloads(pair) {
  const payloads = [{ type: "text" }];
  if (safeTrim(pair.sample_image_url)) payloads.push({ type: "image", url: safeTrim(pair.sample_image_url) });
  if (safeTrim(pair.sample_document_url)) payloads.push({ type: "document", url: safeTrim(pair.sample_document_url) });
  if (safeTrim(pair.sample_audio_url)) payloads.push({ type: "audio", url: safeTrim(pair.sample_audio_url) });
  return payloads;
}
function resolveDirection(pair, preferredStartSide, stepIndex) {
  const startsWithA = preferredStartSide ? preferredStartSide === "a" : stepIndex % 2 === 0;
  const useAOnStep = stepIndex % 2 === 0 ? startsWithA : !startsWithA;
  if (useAOnStep) {
    return {
      side: "a",
      fromInstance: pair.instance_a_id,
      toInstance: pair.instance_b_id,
      fromPhone: pair.phone_a,
      toPhone: pair.phone_b
    };
  }
  return {
    side: "b",
    fromInstance: pair.instance_b_id,
    toInstance: pair.instance_a_id,
    fromPhone: pair.phone_b,
    toPhone: pair.phone_a
  };
}
async function createRunLog({
  db,
  runId,
  pairId,
  direction,
  payloadType,
  contentSummary,
  ok,
  providerStatus,
  responseTimeMs,
  errorDetail
}) {
  const columns = await getTableColumns(db, "warmer_logs");
  const values = [];
  const fields = [];
  const add = /* @__PURE__ */ __name((field, value) => {
    if (!hasColumn(columns, field)) return;
    fields.push(field);
    values.push(value);
  }, "add");
  add("warmer_id", pairId);
  add("run_id", runId);
  add("from_phone", direction.fromPhone);
  add("to_phone", direction.toPhone);
  add("from_instance", direction.fromInstance);
  add("to_instance", direction.toInstance);
  add("message_type", payloadType === "audio" ? "audio" : "text");
  add("payload_type", payloadType);
  add("content_summary", contentSummary);
  add("ok", ok);
  add("provider_status", providerStatus || null);
  add("response_time_ms", responseTimeMs || null);
  add("error_detail", errorDetail || null);
  if (fields.length === 0) {
    throw new Error("Tabela public.warmer_logs sem colunas compat\xEDveis para inser\xE7\xE3o.");
  }
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");
  await db.query(`INSERT INTO public.warmer_logs (${fields.join(", ")}) VALUES (${placeholders})`, values);
}
async function executeRunStep({
  db,
  runId,
  pair,
  evolutionUrl,
  apiKey,
  env: env2,
  stepIndex,
  stepsTotal,
  preferredStartSide,
  baseUrl
}) {
  const payloads = buildStepPayloads(pair);
  const direction = resolveDirection(pair, preferredStartSide, stepIndex);
  const payload = payloads[stepIndex % payloads.length];
  const textContent = pickTextMessage(stepIndex);
  try {
    let responseMeta = null;
    let contentSummary = "";
    if (payload.type === "text") {
      const runData = await db.query("SELECT initiated_by FROM public.warmer_runs WHERE id = $1", [runId]);
      const userId = runData.rows[0]?.initiated_by || pair.user_id || "";
      const dynamicMessage = await generateLabMessage({
        db,
        userId,
        env: env2,
        fromPhone: direction.fromPhone,
        toPhone: direction.toPhone,
        pairId: pair.id
      });
      contentSummary = dynamicMessage;
      await sendPresence({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        presence: "composing"
      });
      const typingTime = Math.min(8e3, Math.max(1500, dynamicMessage.length * 150));
      await wait3(typingTime);
      const meta = await sendText({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        text: dynamicMessage
      });
      responseMeta = { status: meta.status, responseTimeMs: meta.responseTimeMs };
    } else if (payload.type === "audio") {
      contentSummary = `Audio de teste: ${inferFileNameFromUrl(payload.url, "audio.mp3")}`;
      await sendPresence({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        presence: "recording"
      });
      await wait3(Math.random() * 3e3 + 2e3);
      const meta = await sendAudio({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        audioUrl: String(payload.url || ""),
        baseUrl
      });
      responseMeta = { status: meta.status, responseTimeMs: meta.responseTimeMs };
    } else {
      const isDocument = payload.type === "document";
      const mType = payload.type === "document" ? "document" : "image";
      contentSummary = `${isDocument ? "Documento" : "Imagem"} de teste: ${inferFileNameFromUrl(payload.url, "arquivo")}`;
      const meta = await sendMedia({
        evolutionUrl,
        apiKey,
        instanceName: direction.fromInstance,
        toPhone: direction.toPhone,
        mediaUrl: String(payload.url || ""),
        mediaType: mType,
        caption: isDocument ? "" : `Laboratorio de instancias ${stepIndex + 1}/${stepsTotal}`,
        baseUrl
      });
      responseMeta = { status: meta.status, responseTimeMs: meta.responseTimeMs };
    }
    await createRunLog({
      db,
      runId,
      pairId: pair.id,
      direction,
      payloadType: payload.type,
      contentSummary,
      ok: true,
      providerStatus: responseMeta.status,
      responseTimeMs: responseMeta.responseTimeMs
    });
  } catch (error) {
    await createRunLog({
      db,
      runId,
      pairId: pair.id,
      direction,
      payloadType: payload.type,
      contentSummary: payload.type === "text" ? textContent : `${payload.type} de teste`,
      ok: false,
      providerStatus: Number(error?.status || 0) || null,
      responseTimeMs: Number(error?.responseTimeMs || 0) || null,
      errorDetail: toErrorMessage(error)
    });
    throw error;
  }
}
async function executeLabRun(env2, runId, baseUrl) {
  if (ACTIVE_RUNS.has(runId)) return;
  ACTIVE_RUNS.add(runId);
  const db = getDb(env2);
  try {
    await ensureInstanceLabSchema(db);
    const config2 = await getGlobalEvolutionConfig(db);
    if (!config2.url || !config2.apiKey) {
      throw new Error("Evolution API global nao configurada para o laboratorio.");
    }
    const runResult = await db.query(
      `SELECT
         r.id AS run_id,
         r.warmer_id,
         r.status AS run_status,
         r.steps_total,
         r.steps_completed,
         r.step_delay_seconds,
         r.preferred_start_side,
         w.id,
         w.user_id,
         w.instance_a_id,
         w.instance_b_id,
         w.phone_a,
         w.phone_b,
         w.status,
         w.default_delay_seconds,
         w.default_messages_per_run,
         w.sample_image_url,
         w.sample_document_url,
         w.sample_audio_url
       FROM public.warmer_runs r
       JOIN public.warmer_configs w ON w.id = r.warmer_id
       WHERE r.id = $1
       LIMIT 1`,
      [runId]
    );
    const row = runResult.rows[0];
    if (!row) throw new Error("Rodada do laboratorio nao encontrada.");
    const now = /* @__PURE__ */ new Date();
    const hourBR = (now.getUTCHours() - 3 + 24) % 24;
    const isNight = hourBR >= 22 || hourBR < 7;
    const nightModeDelayMultiplier = isNight ? 2.5 : 1;
    if (isNight) {
      console.log(`[InstanceLab] Rodando em MODO NOTURNO (Hora BR: ${hourBR}h). Simulando trafego reduzido.`);
    }
    const run = {
      id: String(row.run_id),
      warmer_id: String(row.warmer_id),
      status: String(row.run_status),
      steps_total: Number(row.steps_total || 0),
      steps_completed: Number(row.steps_completed || 0),
      step_delay_seconds: Number(row.step_delay_seconds || 0),
      preferred_start_side: row.preferred_start_side === "a" || row.preferred_start_side === "b" ? row.preferred_start_side : null
    };
    const pair = {
      id: String(row.id),
      user_id: String(row.user_id || ""),
      instance_a_id: String(row.instance_a_id || ""),
      instance_b_id: String(row.instance_b_id || ""),
      phone_a: String(row.phone_a || ""),
      phone_b: String(row.phone_b || ""),
      status: row.status || "active",
      default_delay_seconds: Number(row.default_delay_seconds || 0) || null,
      default_messages_per_run: Number(row.default_messages_per_run || 0) || null,
      sample_image_url: row.sample_image_url || null,
      sample_document_url: row.sample_document_url || null,
      sample_audio_url: row.sample_audio_url || null
    };
    if (run.status === "completed" || run.status === "failed") return;
    if (pair.status === "paused") throw new Error("Par pausado. Ative-o para rodar.");
    await db.query(
      `UPDATE public.warmer_runs
          SET status = 'running',
              started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
        WHERE id = $1`,
      [run.id]
    );
    const totalSteps = clampNumber(
      run.steps_total || pair.default_messages_per_run || DEFAULT_MESSAGES_PER_RUN,
      1,
      MAX_MESSAGES_PER_RUN,
      DEFAULT_MESSAGES_PER_RUN
    );
    const baseDelay = clampNumber(
      run.step_delay_seconds || pair.default_delay_seconds || DEFAULT_DELAY_SECONDS,
      1,
      120,
      DEFAULT_DELAY_SECONDS
    );
    const delaySeconds = baseDelay * nightModeDelayMultiplier;
    for (let stepIndex = clampNumber(run.steps_completed, 0, MAX_MESSAGES_PER_RUN, 0); stepIndex < totalSteps; stepIndex++) {
      await executeRunStep({
        db,
        runId: run.id,
        pair,
        evolutionUrl: config2.url,
        apiKey: config2.apiKey,
        env: env2,
        stepIndex,
        stepsTotal: totalSteps,
        preferredStartSide: run.preferred_start_side,
        baseUrl
      });
      await db.query("UPDATE public.warmer_runs SET steps_completed = $1 WHERE id = $2", [stepIndex + 1, run.id]);
      if (stepIndex < totalSteps - 1) {
        const randomizedDelay = delaySeconds * (0.8 + Math.random() * 0.4);
        await wait3(randomizedDelay * 1e3);
      }
    }
    await db.query(
      `UPDATE public.warmer_runs
          SET status = 'completed',
              finished_at = CURRENT_TIMESTAMP,
              last_error = NULL
        WHERE id = $1`,
      [run.id]
    );
    await db.query(
      `UPDATE public.warmer_configs
          SET last_run_status = 'completed',
              last_run_error = NULL,
              last_run_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [pair.id]
    );
  } catch (error) {
    const errorMessage = toErrorMessage(error);
    const runInfo = await db.query("SELECT warmer_id FROM public.warmer_runs WHERE id = $1 LIMIT 1", [runId]);
    const pairId = String(runInfo.rows[0]?.warmer_id || "");
    await db.query(
      `UPDATE public.warmer_runs
          SET status = 'failed',
              finished_at = CURRENT_TIMESTAMP,
              last_error = $2
        WHERE id = $1`,
      [runId, errorMessage]
    );
    if (pairId) {
      await db.query(
        `UPDATE public.warmer_configs
            SET last_run_status = 'failed',
                last_run_error = $2,
                last_run_at = CURRENT_TIMESTAMP,
                status = CASE WHEN status = 'paused' THEN status ELSE 'error' END,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [pairId, errorMessage]
      );
    }
    console.error("[InstanceLab] Falha na rodada:", errorMessage);
  } finally {
    ACTIVE_RUNS.delete(runId);
  }
}
async function createRunRecord(db, pairId, initiatedBy, overrides = {}) {
  await ensureInstanceLabSchema(db);
  const pairResult = await db.query("SELECT * FROM public.warmer_configs WHERE id = $1 LIMIT 1", [pairId]);
  const pair = pairResult.rows[0];
  if (!pair) throw new Error("Par de instancias nao encontrado.");
  if (pair.status === "paused") throw new Error("Este par esta pausado. Ative-o antes de iniciar uma rodada.");
  const activeRunResult = await db.query(
    `SELECT id
       FROM public.warmer_runs
      WHERE warmer_id = $1
        AND status IN ('queued', 'running')
      ORDER BY created_at DESC
      LIMIT 1`,
    [pairId]
  );
  if (activeRunResult.rows.length > 0) {
    throw new Error("Ja existe uma rodada em execucao para este par.");
  }
  const stepsTotal = clampNumber(
    overrides.stepsTotal ?? pair.default_messages_per_run ?? DEFAULT_MESSAGES_PER_RUN,
    1,
    MAX_MESSAGES_PER_RUN,
    DEFAULT_MESSAGES_PER_RUN
  );
  const stepDelaySeconds = clampNumber(
    overrides.stepDelaySeconds ?? pair.default_delay_seconds ?? DEFAULT_DELAY_SECONDS,
    1,
    120,
    DEFAULT_DELAY_SECONDS
  );
  const preferredStartSide = overrides.preferredStartSide === "a" || overrides.preferredStartSide === "b" ? overrides.preferredStartSide : null;
  const runId = crypto.randomUUID();
  const insertResult = await db.query(
    `INSERT INTO public.warmer_runs (
      id, warmer_id, initiated_by, status, steps_total, step_delay_seconds, preferred_start_side
    ) VALUES ($1, $2, $3, 'queued', $4, $5, $6)
    RETURNING *`,
    [runId, pairId, initiatedBy || null, stepsTotal, stepDelaySeconds, preferredStartSide]
  );
  return insertResult.rows[0];
}
function runInBackground(c, promise) {
  if (c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
    c.executionCtx.waitUntil(promise);
  } else {
    void promise;
  }
}
async function handleScheduledWarming(env2) {
  const db = getDb(env2);
  await ensureInstanceLabSchema(db);
  const activePairsResult = await db.query(
    "SELECT * FROM public.warmer_configs WHERE status = 'active'"
  );
  const activePairs = activePairsResult.rows;
  if (activePairs.length === 0) return;
  const now = /* @__PURE__ */ new Date();
  const currentTimeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false });
  for (const pair of activePairs) {
    try {
      if (pair.night_mode_enabled) {
        const start = pair.night_mode_start || "22:00";
        const end = pair.night_mode_end || "07:00";
        const isNight = start <= end ? currentTimeStr >= start && currentTimeStr <= end : currentTimeStr >= start || currentTimeStr <= end;
        if (isNight) {
          continue;
        }
      }
      const activeRun = await db.query(
        "SELECT id FROM public.warmer_runs WHERE warmer_id = $1 AND status IN ('queued', 'running') LIMIT 1",
        [pair.id]
      );
      if (activeRun.rows.length > 0) continue;
      const lastRunAt = pair.last_run_at ? new Date(pair.last_run_at) : /* @__PURE__ */ new Date(0);
      const diffSeconds = (now.getTime() - lastRunAt.getTime()) / 1e3;
      const baseDelay = pair.default_delay_seconds || DEFAULT_DELAY_SECONDS;
      const randomJitter = Math.random() * (baseDelay * 0.5);
      const targetDelay = baseDelay + randomJitter;
      if (diffSeconds < targetDelay) {
        continue;
      }
      console.log(`[ScheduledWarming] Iniciando passo automatico para par: ${pair.name || pair.id}`);
      const run = await createRunRecord(db, String(pair.id), null, {
        stepsTotal: 1,
        // Delay do passo na rodada manual nao importa muito aqui pois eh so 1 passo
        stepDelaySeconds: 1
      });
      await executeLabRun(env2, String(run.id), "");
    } catch (err) {
      console.error(`[ScheduledWarming] Erro ao processar par ${pair.id}:`, err);
    }
  }
}
var DEFAULT_DELAY_SECONDS, DEFAULT_MESSAGES_PER_RUN, MAX_MESSAGES_PER_RUN, ACTIVE_RUNS, COLUMN_CACHE_TTL_MS, tableColumnsCache, LAB_TEXT_MESSAGES, instanceLabSchemaEnsured, instanceLabRoutes;
var init_instanceLab = __esm({
  "src/routes/instanceLab.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_performance2();
    init_dist();
    init_auth();
    init_db();
    init_messageUtils();
    init_runtimeSchema();
    DEFAULT_DELAY_SECONDS = 5;
    DEFAULT_MESSAGES_PER_RUN = 4;
    MAX_MESSAGES_PER_RUN = 20;
    ACTIVE_RUNS = /* @__PURE__ */ new Set();
    COLUMN_CACHE_TTL_MS = 6e4;
    tableColumnsCache = /* @__PURE__ */ new Map();
    LAB_TEXT_MESSAGES = [
      "Bom dia. Teste tecnico de conectividade entre instancias.",
      "Tudo certo por ai? Rodando validacao de entrega agora.",
      "Mensagem de teste enviada para validar latencia e entrega.",
      "Confirmando recepcao do payload de texto nesta rodada.",
      "Seguimos na validacao tecnica do laboratorio de instancias.",
      "Teste rapido: conferindo estabilidade da Evolution API."
    ];
    __name(safeTrim, "safeTrim");
    __name(wait3, "wait");
    __name(clampNumber, "clampNumber");
    __name(pickTextMessage, "pickTextMessage");
    __name(sendPresence, "sendPresence");
    __name(generateLabMessage, "generateLabMessage");
    __name(resolveGeminiAccess, "resolveGeminiAccess");
    __name(normalizeEvolutionBaseUrl2, "normalizeEvolutionBaseUrl");
    __name(inferFileNameFromUrl, "inferFileNameFromUrl");
    __name(inferMimeTypeFromUrl, "inferMimeTypeFromUrl");
    __name(toErrorMessage, "toErrorMessage");
    __name(getTableColumns, "getTableColumns");
    __name(hasColumn, "hasColumn");
    __name(tableExists, "tableExists");
    instanceLabSchemaEnsured = false;
    __name(ensureInstanceLabSchema, "ensureInstanceLabSchema");
    __name(getGlobalEvolutionConfig, "getGlobalEvolutionConfig");
    __name(sendText, "sendText");
    __name(sendMedia, "sendMedia");
    __name(sendAudio, "sendAudio");
    __name(buildStepPayloads, "buildStepPayloads");
    __name(resolveDirection, "resolveDirection");
    __name(createRunLog, "createRunLog");
    __name(executeRunStep, "executeRunStep");
    __name(executeLabRun, "executeLabRun");
    __name(createRunRecord, "createRunRecord");
    __name(runInBackground, "runInBackground");
    __name(handleScheduledWarming, "handleScheduledWarming");
    instanceLabRoutes = new Hono2();
    instanceLabRoutes.get("/admin/warmer", authenticateToken, checkAdmin, async (c) => {
      const db = getDb(c.env);
      await ensureInstanceLabSchema(db);
      const failedEventsExpr = "COUNT(*) FILTER (WHERE l.ok = false)";
      const todayJoin = `LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total_events, ${failedEventsExpr} AS failed_events
     FROM public.warmer_logs l
    WHERE l.warmer_id = w.id
      AND l.sent_at >= CURRENT_DATE
  ) today ON TRUE`;
      const recentRunJoin = `LEFT JOIN LATERAL (
    SELECT * FROM public.warmer_runs r
    WHERE r.warmer_id = w.id
      AND r.status IN ('queued', 'running')
    ORDER BY r.created_at DESC
    LIMIT 1
  ) recent_run ON TRUE`;
      const lastRunJoin = `LEFT JOIN LATERAL (
    SELECT * FROM public.warmer_runs r
    WHERE r.warmer_id = w.id
    ORDER BY r.created_at DESC
    LIMIT 1
  ) last_run ON TRUE`;
      const result = await db.query(`
    SELECT
      w.*,
      COALESCE(today.total_events, 0)::int AS sent_today,
      COALESCE(today.failed_events, 0)::int AS failed_today,
      recent_run.id AS active_run_id,
      recent_run.status AS active_run_status,
      recent_run.steps_total AS active_run_steps_total,
      recent_run.steps_completed AS active_run_steps_completed,
      last_run.status AS last_run_status_actual,
      last_run.finished_at AS last_run_finished_at,
      last_run.last_error AS last_run_error_actual
    FROM public.warmer_configs w
    ${todayJoin}
    ${recentRunJoin}
    ${lastRunJoin}
    ORDER BY w.created_at DESC
  `);
      return c.json(result.rows);
    });
    instanceLabRoutes.post("/admin/warmer", authenticateToken, checkAdmin, async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const db = getDb(c.env);
      await ensureInstanceLabSchema(db);
      const instanceA = safeTrim(body.instance_a_id);
      const instanceB = safeTrim(body.instance_b_id);
      const phoneA = safeTrim(body.phone_a);
      const phoneB = safeTrim(body.phone_b);
      if (!instanceA || !instanceB || !phoneA || !phoneB) {
        return c.json({ error: "Preencha instancias e telefones dos dois lados." }, 400);
      }
      const pairId = crypto.randomUUID();
      const result = await db.query(
        `INSERT INTO public.warmer_configs (
      id, user_id, name, instance_a_id, instance_b_id, phone_a, phone_b, status,
      default_delay_seconds, default_messages_per_run,
      sample_image_url, sample_document_url, sample_audio_url, notes,
      ai_persona, night_mode_enabled, night_mode_start, night_mode_end
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *`,
        [
          pairId,
          c.get("user")?.id,
          safeTrim(body.name) || null,
          instanceA,
          instanceB,
          phoneA,
          phoneB,
          clampNumber(body.default_delay_seconds, 1, 120, DEFAULT_DELAY_SECONDS),
          clampNumber(body.default_messages_per_run, 1, MAX_MESSAGES_PER_RUN, DEFAULT_MESSAGES_PER_RUN),
          safeTrim(body.sample_image_url) || null,
          safeTrim(body.sample_document_url) || null,
          safeTrim(body.sample_audio_url) || null,
          safeTrim(body.notes) || null,
          safeTrim(body.ai_persona) || null,
          body.night_mode_enabled ?? true,
          safeTrim(body.night_mode_start) || "22:00",
          safeTrim(body.night_mode_end) || "07:00"
        ]
      );
      return c.json(result.rows[0], 201);
    });
    instanceLabRoutes.put("/admin/warmer/:id", authenticateToken, checkAdmin, async (c) => {
      const id = safeTrim(c.req.param("id"));
      const body = await c.req.json().catch(() => ({}));
      const db = getDb(c.env);
      await ensureInstanceLabSchema(db);
      const instanceA = safeTrim(body.instance_a_id);
      const instanceB = safeTrim(body.instance_b_id);
      const phoneA = safeTrim(body.phone_a);
      const phoneB = safeTrim(body.phone_b);
      if (!id) return c.json({ error: "Par invalido." }, 400);
      if (!instanceA || !instanceB || !phoneA || !phoneB) {
        return c.json({ error: "Preencha instancias e telefones dos dois lados." }, 400);
      }
      const result = await db.query(
        `UPDATE public.warmer_configs SET
      name = $1,
      instance_a_id = $2,
      instance_b_id = $3,
      phone_a = $4,
      phone_b = $5,
      default_delay_seconds = $6,
      default_messages_per_run = $7,
      sample_image_url = $8,
      sample_document_url = $9,
      sample_audio_url = $10,
      notes = $11,
      ai_persona = $12,
      night_mode_enabled = $13,
      night_mode_start = $14,
      night_mode_end = $15,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $16
    RETURNING *`,
        [
          safeTrim(body.name) || null,
          instanceA,
          instanceB,
          phoneA,
          phoneB,
          clampNumber(body.default_delay_seconds, 1, 120, DEFAULT_DELAY_SECONDS),
          clampNumber(body.default_messages_per_run, 1, MAX_MESSAGES_PER_RUN, DEFAULT_MESSAGES_PER_RUN),
          safeTrim(body.sample_image_url) || null,
          safeTrim(body.sample_document_url) || null,
          safeTrim(body.sample_audio_url) || null,
          safeTrim(body.notes) || null,
          safeTrim(body.ai_persona) || null,
          body.night_mode_enabled ?? true,
          safeTrim(body.night_mode_start) || "22:00",
          safeTrim(body.night_mode_end) || "07:00",
          id
        ]
      );
      if (result.rows.length === 0) return c.json({ error: "Par nao encontrado." }, 404);
      return c.json(result.rows[0]);
    });
    instanceLabRoutes.put("/admin/warmer/:id/status", authenticateToken, checkAdmin, async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const status = safeTrim(body.status).toLowerCase();
      if (!["active", "paused", "error"].includes(status)) {
        return c.json({ error: "Status invalido para o laboratorio." }, 400);
      }
      const db = getDb(c.env);
      await ensureInstanceLabSchema(db);
      const result = await db.query(
        `UPDATE public.warmer_configs
        SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
        [status, c.req.param("id")]
      );
      if (!result.rows[0]) return c.json({ error: "Par nao encontrado." }, 404);
      return c.json(result.rows[0]);
    });
    instanceLabRoutes.get("/admin/warmer/:id/logs", authenticateToken, checkAdmin, async (c) => {
      const db = getDb(c.env);
      await ensureInstanceLabSchema(db);
      const hasWarmerLogs = await tableExists(db, "warmer_logs");
      if (!hasWarmerLogs) {
        return c.json([]);
      }
      const warmerLogColumns = await getTableColumns(db, "warmer_logs");
      const hasRunIdColumn = hasColumn(warmerLogColumns, "run_id");
      const query = hasRunIdColumn ? `SELECT l.*, r.status AS run_status
         FROM public.warmer_logs l
         LEFT JOIN public.warmer_runs r ON r.id = l.run_id
        WHERE l.warmer_id = $1
        ORDER BY l.sent_at DESC
        LIMIT 200` : `SELECT l.*, NULL::text AS run_status
         FROM public.warmer_logs l
        WHERE l.warmer_id = $1
        ORDER BY l.sent_at DESC
        LIMIT 200`;
      const result = await db.query(query, [c.req.param("id")]);
      return c.json(result.rows);
    });
    instanceLabRoutes.post("/admin/warmer/:id/force", authenticateToken, checkAdmin, async (c) => {
      const user = c.get("user");
      const db = getDb(c.env);
      await ensureInstanceLabSchema(db);
      const warmerId = safeTrim(c.req.param("id"));
      try {
        const check = await db.query("SELECT id FROM public.warmer_configs WHERE id = $1 LIMIT 1", [warmerId]);
        if (!check.rows[0]) {
          return c.json({ error: `Par de instancia ${warmerId} nao encontrado.` }, 404);
        }
        const run = await createRunRecord(db, warmerId, user?.id || null);
        runInBackground(c, executeLabRun(c.env, String(run.id), new URL(c.req.url).origin));
        return c.json({ success: true, run });
      } catch (error) {
        console.error(`[InstanceLab] Erro ao forcar rodada para ${warmerId}:`, error);
        return c.json({
          error: toErrorMessage(error),
          technical: String(error)
        }, 400);
      }
    });
    instanceLabRoutes.post("/admin/warmer/:id/manual", authenticateToken, checkAdmin, async (c) => {
      const user = c.get("user");
      const body = await c.req.json().catch(() => ({}));
      const side = safeTrim(body.side).toLowerCase() === "b" ? "b" : "a";
      const db = getDb(c.env);
      await ensureInstanceLabSchema(db);
      try {
        const run = await createRunRecord(db, safeTrim(c.req.param("id")), user?.id || null, {
          stepsTotal: 1,
          stepDelaySeconds: 1,
          preferredStartSide: side
        });
        runInBackground(c, executeLabRun(c.env, String(run.id), new URL(c.req.url).origin));
        return c.json({
          success: true,
          run,
          message: `Rodada manual iniciada a partir do lado ${side.toUpperCase()}.`
        });
      } catch (error) {
        return c.json({ error: toErrorMessage(error) }, 400);
      }
    });
  }
});

// src/index.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();

// node_modules/hono/dist/middleware/cors/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var cors = /* @__PURE__ */ __name((options) => {
  const defaults2 = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults2,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// src/index.ts
init_db();

// src/lib/schema.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var ENABLE_RUNTIME_SCHEMA_ENSURE = false;
var schemaEnsureAttempted = false;
function isSkippableSchemaError(error) {
  const message2 = String(error?.message || error || "").toLowerCase();
  return message2.includes("permission denied") || message2.includes("must be owner") || message2.includes("insufficient privilege") || message2.includes("gen_random_uuid") && message2.includes("does not exist");
}
__name(isSkippableSchemaError, "isSkippableSchemaError");
async function ensureCloudflareSchema(db) {
  if (!ENABLE_RUNTIME_SCHEMA_ENSURE) return;
  if (schemaEnsureAttempted) return;
  schemaEnsureAttempted = true;
  const UUID_GEN = "gen_random_uuid()";
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.active_user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        current_page TEXT,
        user_agent TEXT,
        last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_active_user_sessions_last_seen_at
      ON public.active_user_sessions(last_seen_at DESC)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_active_user_sessions_user_last_seen_at
      ON public.active_user_sessions(user_id, last_seen_at DESC)
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.user_uploaded_files (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        extension TEXT NOT NULL,
        media_type TEXT NOT NULL,
        size_bytes BIGINT NOT NULL,
        storage_path TEXT NOT NULL,
        public_token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_uploaded_files_user_created_at
      ON public.user_uploaded_files(user_id, created_at DESC)
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.active_user_sessions_cf_migration (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_configs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT,
        instance_a_id TEXT NOT NULL,
        instance_b_id TEXT NOT NULL,
        phone_a TEXT NOT NULL,
        phone_b TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
        default_delay_seconds INTEGER DEFAULT 5,
        default_messages_per_run INTEGER DEFAULT 4,
        sample_image_url TEXT,
        sample_document_url TEXT,
        sample_audio_url TEXT,
        notes TEXT,
        last_run_status TEXT,
        last_run_error TEXT,
        last_run_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_runs (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        warmer_id UUID NOT NULL REFERENCES public.warmer_configs(id) ON DELETE CASCADE,
        initiated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
        steps_total INTEGER NOT NULL DEFAULT 1,
        steps_completed INTEGER NOT NULL DEFAULT 0,
        step_delay_seconds INTEGER NOT NULL DEFAULT 5,
        preferred_start_side TEXT CHECK (preferred_start_side IN ('a', 'b')),
        last_error TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        finished_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.warmer_logs (
        id BIGSERIAL PRIMARY KEY,
        warmer_id UUID NOT NULL REFERENCES public.warmer_configs(id) ON DELETE CASCADE,
        run_id UUID REFERENCES public.warmer_runs(id) ON DELETE SET NULL,
        from_phone TEXT NOT NULL,
        to_phone TEXT NOT NULL,
        from_instance TEXT,
        to_instance TEXT,
        message_type TEXT DEFAULT 'text',
        payload_type TEXT,
        content_summary TEXT,
        ok BOOLEAN DEFAULT true,
        provider_status INTEGER,
        response_time_ms INTEGER,
        error_detail TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    if (isSkippableSchemaError(error)) {
      console.warn("[CloudflareSchema] Aviso: sem permissao para garantir schema automaticamente. Prosseguindo sem migracao no runtime.");
      return;
    }
    throw error;
  }
}
__name(ensureCloudflareSchema, "ensureCloudflareSchema");

// src/routes/health.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
var healthRoutes = new Hono2();
healthRoutes.get("/health", (c) => {
  return c.json({
    ok: true,
    runtime: "cloudflare-workers",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});

// src/routes/status.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_db();
init_auth();
var statusRoutes = new Hono2();
var CURRENT_VERSION = {
  commit: "Stabilizer-v1.1.4",
  timestamp: "2026-03-31T22:55:00-03:00",
  message: "Estabiliza\xE7\xE3o de Database: SCHEMA PRF (Hyperdrive Ready) (v1.1.4)"
};
statusRoutes.get("/version", (c) => {
  return c.json({ ...CURRENT_VERSION, status: "ONLINE", time: (/* @__PURE__ */ new Date()).toISOString() });
});
statusRoutes.get("/debug-errors", async (c) => {
  try {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = getDb2(c.env);
    if (!db) return c.json({ error: "No DB" }, 500);
    const result = await db.query("SELECT run_at, status, provider_status, error_detail, payload_raw FROM public.contact_send_history ORDER BY run_at DESC LIMIT 5");
    return c.json(result.rows);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});
statusRoutes.get("/_migration-status", (c) => {
  return c.json({
    ok: true,
    runtime: "cloudflare-workers",
    version: 2,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
statusRoutes.get("/status/evo-test", authenticateToken, async (c) => {
  const userId = c.get("user")?.id;
  if (!userId) return c.json({ error: "Auth required" }, 401);
  const db = getDb(c.env);
  const [profileResult, globalSettingsResult] = await Promise.all([
    db.query("SELECT evolution_url, evolution_apikey, evolution_instance FROM public.user_profiles WHERE id = $1 LIMIT 1", [userId]),
    db.query("SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM public.app_settings ORDER BY id DESC LIMIT 1")
  ]);
  const profile = profileResult.rows[0] || {};
  const globalSettings = globalSettingsResult.rows[0] || {};
  const url = String(profile.evolution_url || globalSettings.evolution_api_url || "").trim();
  const apiKey = String(profile.evolution_apikey || globalSettings.evolution_api_key || "").trim();
  const instance = String(profile.evolution_instance || globalSettings.evolution_shared_instance || "").trim();
  if (!url || !apiKey || !instance) {
    return c.json({ error: "Config missing", url, apiKey: !!apiKey, instance });
  }
  try {
    const start = Date.now();
    const response = await fetch(`${url.replace(/\/$/, "")}/instance/fetchInstances/${instance}`, {
      headers: { apikey: apiKey }
    });
    const duration = Date.now() - start;
    const data = await response.json().catch(() => ({ text: "failed to parse" }));
    return c.json({
      ok: response.ok,
      status: response.status,
      duration: `${duration}ms`,
      data,
      configUsed: { url, instance, apiKeyPrefix: apiKey.substring(0, 5) }
    });
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

// src/routes/auth.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();

// node_modules/bcryptjs/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
import nodeCrypto from "crypto";
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return nodeCrypto.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
__name(randomBytes, "randomBytes");
function setRandomFallback(random) {
  randomFallback = random;
}
__name(setRandomFallback, "setRandomFallback");
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
__name(genSaltSync, "genSaltSync");
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick2(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(genSalt, "genSalt");
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
__name(hashSync, "hashSync");
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick2(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(hash, "hash");
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
__name(safeStringCompare, "safeStringCompare");
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
__name(compareSync, "compareSync");
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick2(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick2(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(compare, "compare");
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
__name(getRounds, "getRounds");
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
__name(getSalt, "getSalt");
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
__name(truncates, "truncates");
var nextTick2 = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
__name(utf8Length, "utf8Length");
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
__name(utf8Array, "utf8Array");
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off2 = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off2 < len) {
    c1 = b[off2++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off2 >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off2++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off2 >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off2++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
__name(base64_encode, "base64_encode");
function base64_decode(s, len) {
  var off2 = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off2 < slen - 1 && olen < len) {
    code = s.charCodeAt(off2++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off2++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off2 >= slen) break;
    code = s.charCodeAt(off2++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off2 >= slen) break;
    code = s.charCodeAt(off2++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off2 = 0; off2 < olen; off2++) res.push(rs[off2].charCodeAt(0));
  return res;
}
__name(base64_decode, "base64_decode");
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off2, P, S) {
  var n, l = lr[off2], r = lr[off2 + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off2] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off2 + 1] = l;
  return lr;
}
__name(_encipher, "_encipher");
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
__name(_streamtoword, "_streamtoword");
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_key, "_key");
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_ekskey, "_ekskey");
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick2(next);
  }
  __name(next, "next");
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
__name(_crypt, "_crypt");
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick2(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick2(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  __name(finish, "finish");
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
__name(_hash, "_hash");
function encodeBase642(bytes, length) {
  return base64_encode(bytes, length);
}
__name(encodeBase642, "encodeBase64");
function decodeBase642(string, length) {
  return base64_decode(string, length);
}
__name(decodeBase642, "decodeBase64");
var bcryptjs_default = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare,
  getRounds,
  getSalt,
  truncates,
  encodeBase64: encodeBase642,
  decodeBase64: decodeBase642
};

// src/routes/auth.ts
init_webapi();
init_auth();
init_db();
init_messageUtils();
var authRoutes = new Hono2();
function getJwtSecret2(env2) {
  const candidate = String(env2.JWT_SECRET || "").trim();
  if (candidate.length < 32) {
    throw new Error("JWT_SECRET nao configurado ou e muito curto (minimo 32 caracteres). Configure no Cloudflare Workers secrets.");
  }
  return new TextEncoder().encode(candidate);
}
__name(getJwtSecret2, "getJwtSecret");
async function signAuthToken(env2, payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(getJwtSecret2(env2));
}
__name(signAuthToken, "signAuthToken");
function attachCorsForAllowedOrigin(c) {
  c.header("Access-Control-Allow-Origin", "*");
}
__name(attachCorsForAllowedOrigin, "attachCorsForAllowedOrigin");
function normalizeEvolutionBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}
__name(normalizeEvolutionBaseUrl, "normalizeEvolutionBaseUrl");
function generateTemporaryPassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += alphabet[values[index] % alphabet.length];
  }
  return output;
}
__name(generateTemporaryPassword, "generateTemporaryPassword");
async function sendPasswordResetViaWhatsapp(params) {
  const response = await fetch(`${params.evolutionUrl}/message/sendText/${params.evolutionInstance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: params.evolutionApiKey
    },
    body: JSON.stringify({
      number: params.phone,
      text: params.message,
      linkPreview: false
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Falha Evolution API (HTTP ${response.status})`);
  }
}
__name(sendPasswordResetViaWhatsapp, "sendPasswordResetViaWhatsapp");
authRoutes.post("/auth/signup", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const name = String(body?.name || "").trim();
  if (!email || !password) {
    return c.json({ error: "Email e senha sao obrigatorios." }, 400);
  }
  const db = getDb(c.env);
  const existing = await db.query("SELECT id FROM public.users WHERE email = $1 LIMIT 1", [email]);
  if (existing.rows.length > 0) {
    return c.json({ error: "Este e-mail ja esta cadastrado." }, 400);
  }
  const passwordHash = await bcryptjs_default.hash(password, 10);
  const inserted = await db.query(
    `INSERT INTO public.users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, token_version`,
    [email, passwordHash, name || null]
  );
  const user = inserted.rows[0];
  const userCount = await db.query("SELECT COUNT(*)::int AS total FROM public.users");
  const isFirstUser = Number(userCount.rows[0]?.total || 0) === 1;
  if (isFirstUser) {
    const adminGroup = await db.query(`SELECT id FROM public.user_groups WHERE name = 'Administrador' LIMIT 1`);
    if (adminGroup.rows[0]?.id) {
      await db.query("INSERT INTO public.user_profiles (id, group_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [user.id, adminGroup.rows[0].id]);
    } else {
      await db.query("INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [user.id]);
    }
  } else {
    await db.query("INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [user.id]);
  }
  const token = await signAuthToken(c.env, {
    id: String(user.id),
    email: String(user.email),
    tv: Number(user.token_version || 0)
  });
  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    token
  }, 201);
});
authRoutes.post("/auth/login", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) {
      attachCorsForAllowedOrigin(c);
      return c.json({ error: "Credenciais invalidas." }, 400);
    }
    const db = getDb(c.env);
    const result = await db.query("SELECT * FROM public.users WHERE email = $1 LIMIT 1", [email]);
    const user = result.rows[0];
    if (!user) {
      attachCorsForAllowedOrigin(c);
      return c.json({ error: "Credenciais invalidas." }, 400);
    }
    const passwordHash = typeof user.password_hash === "string" ? user.password_hash : "";
    if (!passwordHash) {
      attachCorsForAllowedOrigin(c);
      return c.json({ error: "Credenciais invalidas." }, 400);
    }
    const validPassword = await bcryptjs_default.compare(password, passwordHash);
    if (!validPassword) {
      attachCorsForAllowedOrigin(c);
      return c.json({ error: "Credenciais invalidas." }, 400);
    }
    const token = await signAuthToken(c.env, {
      id: String(user.id),
      email: String(user.email),
      tv: Number(user.token_version || 0)
    });
    attachCorsForAllowedOrigin(c);
    return c.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error("[Auth.login] erro interno:", error);
    attachCorsForAllowedOrigin(c);
    return c.json(
      {
        error: "Erro interno no login.",
        technical: typeof error?.message === "string" ? error.message : String(error || "erro")
      },
      500
    );
  }
});
authRoutes.post("/auth/forgot-password", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const genericMessage = "Se o e-mail estiver cadastrado, a nova senha sera enviada para o telefone da conta.";
    if (!email) {
      attachCorsForAllowedOrigin(c);
      return c.json({ ok: true, message: genericMessage });
    }
    const db = getDb(c.env);
    const result = await db.query(
      `SELECT u.id, u.email, up.phone
         FROM public.users u
         LEFT JOIN public.user_profiles up ON up.id = u.id
        WHERE u.email = $1
        LIMIT 1`,
      [email]
    );
    const user = result.rows[0];
    if (!user?.id) {
      attachCorsForAllowedOrigin(c);
      return c.json({ ok: true, message: genericMessage });
    }
    const phone = toEvolutionNumber(user.phone);
    if (!phone) {
      attachCorsForAllowedOrigin(c);
      return c.json({ ok: true, message: genericMessage });
    }
    const settingsResult = await db.query(
      `SELECT evolution_api_url, evolution_api_key, evolution_shared_instance
         FROM public.app_settings
        ORDER BY id DESC
        LIMIT 1`
    );
    const settings = settingsResult.rows[0] || {};
    const evolutionUrl = normalizeEvolutionBaseUrl(settings.evolution_api_url);
    const evolutionApiKey = String(settings.evolution_api_key || "").trim();
    const evolutionInstance = String(settings.evolution_shared_instance || "").trim();
    if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
      attachCorsForAllowedOrigin(c);
      return c.json({ ok: true, message: genericMessage });
    }
    const newPassword = generateTemporaryPassword(12);
    const passwordHash = await bcryptjs_default.hash(newPassword, 10);
    await db.query(
      `UPDATE public.users
          SET password_hash = $1,
              reset_password_token = NULL,
              reset_password_expires = NULL,
              token_version = COALESCE(token_version, 0) + 1
        WHERE id = $2`,
      [passwordHash, user.id]
    );
    const whatsappMessage = `SendMessage - Recuperacao de acesso
Sua senha temporaria: ${newPassword}
Apos entrar, altere a senha em Perfil > Seguranca.`;
    await sendPasswordResetViaWhatsapp({
      evolutionUrl,
      evolutionApiKey,
      evolutionInstance,
      phone,
      message: whatsappMessage
    });
    attachCorsForAllowedOrigin(c);
    return c.json({ ok: true, message: genericMessage });
  } catch (error) {
    console.error("[Auth.forgot-password] erro interno:", error);
    attachCorsForAllowedOrigin(c);
    return c.json(
      {
        error: "Erro interno ao processar recuperacao de senha.",
        technical: typeof error?.message === "string" ? error.message : String(error || "erro")
      },
      500
    );
  }
});
authRoutes.post("/auth/reset-password", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = String(body?.token || "").trim();
  const password = String(body?.password || "");
  if (!token || !password) {
    return c.json({ error: "Token e senha sao obrigatorios." }, 400);
  }
  const db = getDb(c.env);
  const result = await db.query(
    `SELECT id
       FROM public.users
      WHERE reset_password_token = $1
        AND reset_password_expires > NOW()
      LIMIT 1`,
    [token]
  );
  const user = result.rows[0];
  if (!user) {
    return c.json({ error: "Token invalido ou expirado." }, 400);
  }
  const passwordHash = await bcryptjs_default.hash(password, 10);
  await db.query(
    `UPDATE public.users
        SET password_hash = $1,
            reset_password_token = NULL,
            reset_password_expires = NULL,
            token_version = token_version + 1
      WHERE id = $2`,
    [passwordHash, user.id]
  );
  return c.json({ ok: true, message: "Senha alterada com sucesso." });
});
authRoutes.get("/auth/me", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) {
    return c.json({ error: "Acesso negado." }, 401);
  }
  const db = getDb(c.env);
  const result = await db.query("SELECT id, email, name FROM public.users WHERE id = $1 LIMIT 1", [user.id]);
  return c.json(result.rows[0] || null);
});

// src/routes/presence.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
var presenceRoutes = new Hono2();
presenceRoutes.post("/auth/presence", authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const sessionId = String(body?.sessionId || "").trim();
  const currentPage = String(body?.currentPage || "").trim();
  const user = c.get("user");
  if (!sessionId || !user?.id) {
    return c.json({ error: "sessionId e obrigatorio." }, 400);
  }
  try {
    const db = getDb(c.env);
    await db.query(
      `INSERT INTO public.active_user_sessions (session_id, user_id, current_page, user_agent, last_seen_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         current_page = EXCLUDED.current_page,
         user_agent = EXCLUDED.user_agent,
         last_seen_at = CURRENT_TIMESTAMP`,
      [sessionId, user.id, currentPage || null, c.req.header("user-agent") || null]
    );
    await db.query(`DELETE FROM public.active_user_sessions WHERE last_seen_at < CURRENT_TIMESTAMP - INTERVAL '1 day'`);
  } catch {
  }
  return c.json({ ok: true });
});
presenceRoutes.get("/auth/presence", authenticateToken, async (c) => {
  return c.json({ ok: true });
});
presenceRoutes.post("/auth/presence/logout", authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const sessionId = String(body?.sessionId || "").trim();
  const user = c.get("user");
  if (!sessionId || !user?.id) {
    return c.json({ error: "sessionId e obrigatorio." }, 400);
  }
  const db = getDb(c.env);
  await db.query(`DELETE FROM public.active_user_sessions WHERE session_id = $1 AND user_id = $2`, [sessionId, user.id]);
  return c.json({ ok: true });
});
presenceRoutes.get("/admin/active-users", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  const windowSeconds = Number(c.env.ACTIVE_USER_WINDOW_SECONDS || "120");
  const sessionsResult = await db.query(
    `SELECT
       s.session_id,
       s.user_id,
       s.current_page,
       s.last_seen_at,
       u.email,
       u.name
     FROM public.active_user_sessions s
     JOIN public.users u ON u.id = s.user_id
     WHERE s.last_seen_at >= CURRENT_TIMESTAMP - ($1::text || ' seconds')::interval
     ORDER BY s.last_seen_at DESC`,
    [String(windowSeconds)]
  );
  const latestByUser = /* @__PURE__ */ new Map();
  for (const row of sessionsResult.rows) {
    if (!latestByUser.has(row.user_id)) latestByUser.set(row.user_id, row);
  }
  const users = Array.from(latestByUser.values()).map((row) => ({
    userId: row.user_id,
    sessionId: row.session_id,
    email: row.email,
    name: row.name || row.email,
    currentPage: row.current_page || null,
    lastSeenAt: row.last_seen_at
  }));
  return c.json({
    totalUsers: users.length,
    totalSessions: sessionsResult.rows.length,
    windowSeconds,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    users
  });
});

// src/routes/uploads.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();

// src/lib/uploads.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
var MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
var DEFAULT_USER_UPLOAD_QUOTA_BYTES = 100 * 1024 * 1024;
var FILE_RULES = [
  { mediaType: "image", extensions: ["jpg", "jpeg", "png", "webp"], mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  { mediaType: "document", extensions: ["pdf", "ppt", "pptx"], mimeTypes: ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"] },
  { mediaType: "audio", extensions: ["wav", "mp3"], mimeTypes: ["audio/wav", "audio/mpeg", "audio/mp3"] },
  { mediaType: "document", extensions: ["mp4"], mimeTypes: ["video/mp4"] }
];
function normalizeUploadDisplayName(name) {
  return String(name || "").normalize("NFC");
}
__name(normalizeUploadDisplayName, "normalizeUploadDisplayName");
function resolveFileRule(mimeType, originalName) {
  const cleanMime = String(mimeType || "").toLowerCase();
  const ext = String(originalName || "").split(".").pop()?.toLowerCase() || "";
  return FILE_RULES.find((rule) => rule.mimeTypes.includes(cleanMime) || rule.extensions.includes(ext)) || null;
}
__name(resolveFileRule, "resolveFileRule");
async function getUploadUsageBytes(db, userId) {
  const result = await db.query(
    `SELECT COALESCE(SUM(size_bytes), 0)::bigint AS total
       FROM public.user_uploaded_files
      WHERE user_id = $1
        AND deleted_at IS NULL`,
    [userId]
  );
  return Number(result.rows[0]?.total || 0);
}
__name(getUploadUsageBytes, "getUploadUsageBytes");
function buildObjectKey(userId, storedName) {
  return `${userId}/${storedName}`;
}
__name(buildObjectKey, "buildObjectKey");
function buildPublicFileToken() {
  return crypto.randomUUID().replace(/-/g, "");
}
__name(buildPublicFileToken, "buildPublicFileToken");

// src/routes/uploads.ts
init_db();
var uploadRoutes = new Hono2();
function mapFileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    originalName: row.original_name || "Sem nome",
    storedName: row.stored_name,
    mimeType: row.mime_type || "application/octet-stream",
    extension: row.extension || "",
    mediaType: row.media_type || "document",
    sizeBytes: Number(row.size_bytes || 0),
    createdAt: row.created_at,
    publicUrl: `/api/uploads/public/${row.public_token}/${encodeURIComponent(row.stored_name)}`,
    isAvailable: true,
    canInline: ["image", "video", "document"].includes(row.media_type) && row.mime_type !== "application/pdf"
  };
}
__name(mapFileRow, "mapFileRow");
uploadRoutes.get("/files", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  try {
    await ensureCloudflareSchema(db);
    console.log("[Uploads] Listando arquivos para o usu\xE1rio:", user.id);
    const result = await db.query(
      `SELECT id, user_id, original_name, stored_name, mime_type, extension, media_type, size_bytes, public_token, created_at
         FROM public.user_uploaded_files
        WHERE user_id = $1::uuid
          AND deleted_at IS NULL
        ORDER BY created_at DESC`,
      [user.id]
    );
    console.log(`[Uploads] Encontrados ${result.rows.length} arquivos para o usu\xE1rio.`);
    const files = result.rows.map(mapFileRow);
    return c.json(files, 200, {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    });
  } catch (error) {
    console.error("[Uploads] Erro critico ao listar arquivos:", error);
    return c.json({
      error: "Erro ao listar arquivos do banco de dados.",
      message: error?.message || String(error),
      code: error?.code || "UNKNOWN",
      technical: String(error?.stack || error)
    }, 500);
  }
});
uploadRoutes.post("/files/upload", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  let form;
  try {
    form = await c.req.formData();
  } catch (formError) {
    console.error("[Uploads] Erro ao processar FormData:", formError);
    return c.json({
      error: "Formato de envio invalido ou multipart corrompido.",
      technical: formError?.message || String(formError)
    }, 400);
  }
  const allFields = [];
  try {
    form.forEach((value, key) => {
      allFields.push({
        key,
        isFile: value instanceof File,
        type: value instanceof File ? value.type : typeof value,
        size: value instanceof File ? value.size : void 0
      });
    });
  } catch (logErr) {
    console.error("[Uploads] Erro ao logar campos do FormData:", logErr);
  }
  console.log("[Uploads] Analise do FormData recebido:", allFields);
  const filesToProcess = [];
  const knownKeys = ["files", "file", "attachment", "media"];
  for (const key of knownKeys) {
    const values = form.getAll(key);
    for (const val of values) {
      if (val instanceof File && val.size > 0) {
        filesToProcess.push(val);
      }
    }
  }
  if (filesToProcess.length === 0) {
    form.forEach((value) => {
      if (value instanceof File && value.size > 0 && !filesToProcess.includes(value)) {
        filesToProcess.push(value);
      }
    });
  }
  if (filesToProcess.length === 0) {
    console.warn("[Uploads] Nenhum arquivo valido encontrado. Campos recebidos:", allFields.map((f) => f.key));
    return c.json({
      error: "Nenhum arquivo valido encontrado na requisicao multipart.",
      receivedFields: allFields.map((f) => f.key),
      technical: 'O backend esperava um campo com anexo (ex: "files"). Verifique se o arquivo foi realmente selecionado no frontend.'
    }, 400);
  }
  const db = getDb(c.env);
  await ensureCloudflareSchema(db);
  const results = [];
  for (const file of filesToProcess) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`[Uploads] Arquivo ${file.name} ignorado por tamanho excedido: ${file.size} bytes`);
      continue;
    }
    const rule = resolveFileRule(file.type, file.name);
    if (!rule) {
      console.warn(`[Uploads] Arquivo ${file.name} ignorado por tipo n\xE3o suportado: ${file.type}`);
      continue;
    }
    const fileId = crypto.randomUUID();
    const originalName = normalizeUploadDisplayName(file.name);
    const storedName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${originalName}`;
    const publicToken = buildPublicFileToken();
    const objectKey = buildObjectKey(user.id, storedName);
    try {
      await c.env.UPLOADS_BUCKET.put(objectKey, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
          contentDisposition: `inline; filename="${originalName}"`
        }
      });
      const inserted = await db.query(
        `INSERT INTO public.user_uploaded_files (
          id, user_id, original_name, stored_name, mime_type, extension, media_type, size_bytes, storage_path, public_token
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [
          fileId,
          user.id,
          originalName,
          storedName,
          file.type || "application/octet-stream",
          originalName.split(".").pop()?.toLowerCase() || "",
          rule.mediaType,
          file.size,
          objectKey,
          publicToken
        ]
      );
      results.push(inserted.rows[0]);
    } catch (err) {
      console.error(`[Uploads] Falha ao processar arquivo ${file.name}:`, err);
    }
  }
  if (results.length === 0) {
    return c.json({ error: "Falha ao processar uploads ou arquivos inv\xE1lidos." }, 500);
  }
  return c.json(results.length === 1 ? mapFileRow(results[0]) : results.map(mapFileRow), 201);
});
uploadRoutes.delete("/files/:id", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  const id = c.req.param("id");
  const db = getDb(c.env);
  const result = await db.query(
    `UPDATE public.user_uploaded_files
        SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1::uuid
        AND user_id = $2::uuid
        AND deleted_at IS NULL
    RETURNING id`,
    [id, user.id]
  );
  if (result.rows.length === 0) {
    return c.json({ error: "Arquivo nao encontrado ou ja removido." }, 404);
  }
  return c.json({ ok: true });
});
uploadRoutes.patch("/files/:id", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const newName = String(body.name || "").trim();
  if (!newName) return c.json({ error: "Nome invalido." }, 400);
  const db = getDb(c.env);
  const result = await db.query(
    `UPDATE public.user_uploaded_files
        SET original_name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2::uuid
        AND user_id = $3::uuid
        AND deleted_at IS NULL
    RETURNING *`,
    [newName, id, user.id]
  );
  if (!result.rows[0]) return c.json({ error: "Arquivo nao encontrado." }, 404);
  return c.json(mapFileRow(result.rows[0]));
});
uploadRoutes.post("/files/bulk-delete", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  const body = await c.req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return c.json({ ok: true, deleted: 0 });
  const db = getDb(c.env);
  try {
    const filesResult = await db.query(
      `SELECT id, storage_path FROM public.user_uploaded_files 
        WHERE user_id = $1::uuid AND id = ANY($2::uuid[]) AND deleted_at IS NULL`,
      [user.id, ids]
    );
    const filesToDelete = filesResult.rows;
    if (filesToDelete.length === 0) return c.json({ ok: true, deleted: 0 });
    await db.query(
      `UPDATE public.user_uploaded_files
          SET deleted_at = CURRENT_TIMESTAMP
        WHERE user_id = $1::uuid AND id = ANY($2::uuid[])`,
      [user.id, ids]
    );
    const deletePromises = filesToDelete.map((f) => c.env.UPLOADS_BUCKET.delete(f.storage_path).catch(() => {
    }));
    await Promise.allSettled(deletePromises);
    return c.json({ ok: true, deleted: filesToDelete.length });
  } catch (err) {
    console.error("[Uploads] Erro no bulk-delete:", err);
    return c.json({ error: "Falha ao processar exclusao em lote.", message: err.message }, 500);
  }
});
uploadRoutes.get("/uploads/public/:token/:storedName", async (c) => {
  const { token, storedName } = c.req.param();
  const db = getDb(c.env);
  const result = await db.query(
    `SELECT *
       FROM public.user_uploaded_files
      WHERE public_token = $1
        AND stored_name = $2
        AND deleted_at IS NULL
      LIMIT 1`,
    [token, storedName]
  );
  const file = result.rows[0];
  if (!file) {
    return c.json({ error: "Arquivo nao encontrado." }, 404);
  }
  const object = await c.env.UPLOADS_BUCKET.get(file.storage_path);
  if (!object) {
    return c.json({ error: "Arquivo nao encontrado no bucket." }, 404);
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
});

// src/index.ts
init_instanceLab();

// src/routes/profileSettings.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
init_ddl();
var DEFAULT_DAILY_MESSAGE_LIMIT = 300;
var DEFAULT_MONTHLY_MESSAGE_LIMIT = 9e3;
var DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT = 5e3;
function getAuthenticatedUserId(c) {
  const user = c.get("user");
  return user?.id ?? null;
}
__name(getAuthenticatedUserId, "getAuthenticatedUserId");
async function isAdminUser(userId, db) {
  try {
    const result = await db.query(
      `SELECT 1
         FROM public.user_profiles up
         JOIN public.user_groups ug ON ug.id = up.group_id
        WHERE up.id = $1
          AND ug.name = 'Administrador'
        LIMIT 1`,
      [userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    if (isSchemaMissingError(error)) return false;
    throw error;
  }
}
__name(isAdminUser, "isAdminUser");
async function ensureUserProfile(userId, db) {
  await runBestEffortDdl(db, "profileSettings.ensureUserProfile", [
    `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        display_name TEXT,
        phone TEXT,
        group_id UUID,
        use_global_ai BOOLEAN DEFAULT true,
        ai_api_key TEXT,
        company_info TEXT,
        evolution_url TEXT,
        evolution_apikey TEXT,
        evolution_instance TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS group_id UUID`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS use_global_ai BOOLEAN DEFAULT true`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ai_api_key TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_info TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_url TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_apikey TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_instance TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
  ]);
  await db.query("INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [userId]);
}
__name(ensureUserProfile, "ensureUserProfile");
async function ensureAppSettingsTable(db) {
  await runBestEffortDdl(db, "profileSettings.ensureAppSettingsTable", [
    `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        id SERIAL PRIMARY KEY,
        global_ai_api_key TEXT,
        evolution_api_url TEXT,
        evolution_api_key TEXT,
        evolution_shared_instance TEXT,
        google_maps_api_key TEXT,
        gemini_model TEXT,
        gemini_api_version TEXT,
        gemini_temperature NUMERIC(3,2),
        gemini_max_tokens INTEGER,
        send_interval_min INTEGER,
        send_interval_max INTEGER,
        default_daily_message_limit INTEGER DEFAULT 300,
        default_monthly_message_limit INTEGER DEFAULT 9000,
        default_upload_quota_bytes BIGINT DEFAULT 104857600,
        global_gemini_daily_limit INTEGER DEFAULT 5000,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS global_ai_api_key TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS evolution_api_url TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS evolution_api_key TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS evolution_shared_instance TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS google_maps_api_key TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_model TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_api_version TEXT`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_temperature NUMERIC(3,2)`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gemini_max_tokens INTEGER`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS send_interval_min INTEGER`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS send_interval_max INTEGER`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS default_daily_message_limit INTEGER DEFAULT 300`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS default_monthly_message_limit INTEGER DEFAULT 9000`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS default_upload_quota_bytes BIGINT DEFAULT 104857600`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS global_gemini_daily_limit INTEGER DEFAULT 5000`,
    `ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
  ]);
}
__name(ensureAppSettingsTable, "ensureAppSettingsTable");
async function getEffectiveLimitSnapshot(userId, db) {
  const [isAdmin, settingsResult, profileResult, sentTodayResult, sentMonthResult, geminiUsageResult, uploadUsageBytes] = await Promise.all([
    isAdminUser(userId, db),
    db.query(
      `SELECT
           default_daily_message_limit,
           default_monthly_message_limit,
           default_upload_quota_bytes,
           global_gemini_daily_limit
         FROM public.app_settings
         ORDER BY id DESC
         LIMIT 1`
    ),
    db.query(
      `SELECT
           use_global_ai,
           daily_message_limit,
           monthly_message_limit,
           upload_quota_bytes
         FROM public.user_profiles
         WHERE id = $1
         LIMIT 1`,
      [userId]
    ),
    db.query(
      `SELECT COUNT(*)::int AS total
         FROM public.contact_send_history
         WHERE user_id = $1
           AND channel = 'whatsapp'
           AND ok = true
           AND run_at >= CURRENT_DATE`,
      [userId]
    ),
    db.query(
      `SELECT COUNT(*)::int AS total
         FROM public.contact_send_history
         WHERE user_id = $1
           AND channel = 'whatsapp'
           AND ok = true
           AND date_trunc('month', run_at) = date_trunc('month', CURRENT_DATE)`,
      [userId]
    ),
    db.query(
      `SELECT COUNT(*)::int AS total
         FROM public.gemini_api_usage_logs
         WHERE source = 'global-pool'
           AND data_solicitacao >= CURRENT_DATE`
    ),
    getUploadUsageBytes(db, userId)
  ]);
  const settings = settingsResult.rows[0] || {};
  const profile = profileResult.rows[0] || {};
  const uploadLimit = isAdmin ? null : Number(profile.upload_quota_bytes || settings.default_upload_quota_bytes || DEFAULT_USER_UPLOAD_QUOTA_BYTES);
  return {
    isAdmin,
    dailyMessages: {
      used: Number(sentTodayResult.rows[0]?.total || 0),
      limit: Number(profile.daily_message_limit || settings.default_daily_message_limit || DEFAULT_DAILY_MESSAGE_LIMIT)
    },
    monthlyMessages: {
      used: Number(sentMonthResult.rows[0]?.total || 0),
      limit: Number(profile.monthly_message_limit || settings.default_monthly_message_limit || DEFAULT_MONTHLY_MESSAGE_LIMIT)
    },
    geminiGlobal: {
      usingGlobalPool: profile.use_global_ai ?? true,
      usedToday: Number(geminiUsageResult.rows[0]?.total || 0),
      limit: Number(settings.global_gemini_daily_limit || DEFAULT_GLOBAL_GEMINI_DAILY_LIMIT)
    },
    uploads: {
      usedBytes: Number(uploadUsageBytes || 0),
      limitBytes: uploadLimit,
      unlimited: isAdmin
    }
  };
}
__name(getEffectiveLimitSnapshot, "getEffectiveLimitSnapshot");
var profileSettingsRoutes = new Hono2();
profileSettingsRoutes.get("/profile", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureUserProfile(userId, db);
  const result = await db.query("SELECT * FROM public.user_profiles WHERE id = $1 LIMIT 1", [userId]);
  return c.json(result.rows[0] || {});
});
profileSettingsRoutes.get("/profile/full", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureUserProfile(userId, db);
  const profile = await db.query(
    `SELECT up.*, ug.name as group_name
       FROM public.user_profiles up
       LEFT JOIN public.user_groups ug ON up.group_id = ug.id
      WHERE up.id = $1
      LIMIT 1`,
    [userId]
  );
  let permissionsRows = [];
  try {
    const permissions = await db.query(
      `SELECT p.code
         FROM public.user_profiles up
         JOIN public.group_permissions gp ON up.group_id = gp.group_id
         JOIN public.permissions p ON gp.permission_id = p.id
        WHERE up.id = $1`,
      [userId]
    );
    permissionsRows = permissions.rows;
  } catch (error) {
    if (!isSchemaMissingError(error)) throw error;
  }
  return c.json({
    ...profile.rows[0] || {},
    permission_codes: permissionsRows.map((row) => row.code)
  });
});
profileSettingsRoutes.get("/profile/limits", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  const limits = await getEffectiveLimitSnapshot(userId, db);
  return c.json(limits);
});
profileSettingsRoutes.post("/profile", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  const body = await c.req.json().catch(() => ({}));
  await ensureUserProfile(userId, db);
  await db.query(
    `UPDATE public.user_profiles SET
        webhook_email_url = COALESCE($1, webhook_email_url),
        use_global_ai = COALESCE($2, use_global_ai),
        ai_api_key = COALESCE($3, ai_api_key),
        use_global_webhooks = COALESCE($4, use_global_webhooks),
        evolution_url = COALESCE($5, evolution_url),
        evolution_apikey = COALESCE($6, evolution_apikey),
        evolution_instance = COALESCE($7, evolution_instance),
        company_info = COALESCE($8, company_info)
      WHERE id = $9`,
    [
      body.webhook_email_url ?? null,
      body.use_global_ai ?? null,
      body.ai_api_key ?? null,
      body.use_global_webhooks ?? null,
      body.evolution_url ?? null,
      body.evolution_apikey ?? null,
      body.evolution_instance ?? null,
      body.company_info ?? null,
      userId
    ]
  );
  return c.json({ ok: true });
});
profileSettingsRoutes.put("/profile", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  const body = await c.req.json().catch(() => ({}));
  await ensureUserProfile(userId, db);
  if (body.display_name !== void 0) {
    await db.query("UPDATE public.users SET name = $1 WHERE id = $2", [body.display_name, userId]);
  }
  const fields = [];
  const values = [];
  let count = 1;
  const addField = /* @__PURE__ */ __name((column, value) => {
    if (value !== void 0) {
      fields.push(`${column} = $${count}`);
      values.push(value);
      count += 1;
    }
  }, "addField");
  addField("use_global_ai", body.use_global_ai);
  addField("ai_api_key", body.ai_api_key);
  addField("evolution_url", body.evolution_url);
  addField("evolution_apikey", body.evolution_apikey);
  addField("evolution_instance", body.evolution_instance);
  addField("company_info", body.company_info);
  addField("display_name", body.display_name);
  addField("phone", body.phone);
  addField("gemini_model", body.gemini_model);
  addField("gemini_api_version", body.gemini_api_version);
  addField("gemini_temperature", body.gemini_temperature);
  addField("gemini_max_tokens", body.gemini_max_tokens);
  addField("send_interval_min", body.send_interval_min);
  addField("send_interval_max", body.send_interval_max);
  if (fields.length === 0) {
    return c.json({ error: "Nenhum campo para atualizar" }, 400);
  }
  values.push(userId);
  await db.query(`UPDATE public.user_profiles SET ${fields.join(", ")} WHERE id = $${count}`, values);
  return c.json({ ok: true });
});
profileSettingsRoutes.get("/settings", authenticateToken, async (c) => {
  try {
    const db = getDb(c.env);
    await ensureAppSettingsTable(db);
    const result = await db.query("SELECT * FROM public.app_settings LIMIT 1");
    return c.json(result.rows[0] || {});
  } catch (err) {
    console.error("[Settings.get] Erro:", err.message);
    return c.json({ error: "Erro ao carregar configuracoes.", technical: err.message }, 500);
  }
});
profileSettingsRoutes.post("/settings", authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const db = getDb(c.env);
  await ensureAppSettingsTable(db);
  const check = await db.query("SELECT id FROM public.app_settings LIMIT 1");
  let result;
  if (check.rows.length > 0) {
    result = await db.query(
      `UPDATE public.app_settings SET
          global_ai_api_key = $1,
          evolution_api_url = $2,
          evolution_api_key = $3,
          evolution_shared_instance = $4,
          gemini_model = $5,
          gemini_api_version = $6,
          gemini_temperature = $7,
          gemini_max_tokens = $8,
          send_interval_min = $9,
          send_interval_max = $10,
          google_maps_api_key = $11
       RETURNING *`,
      [
        body.global_ai_api_key ?? null,
        body.evolution_api_url ?? null,
        body.evolution_api_key ?? null,
        body.evolution_shared_instance ?? null,
        body.gemini_model ?? null,
        body.gemini_api_version ?? null,
        body.gemini_temperature ?? null,
        body.gemini_max_tokens ?? null,
        body.send_interval_min ?? null,
        body.send_interval_max ?? null,
        body.google_maps_api_key ?? null
      ]
    );
  } else {
    result = await db.query(
      `INSERT INTO public.app_settings (
          global_ai_api_key,
          evolution_api_url,
          evolution_api_key,
          evolution_shared_instance,
          gemini_model,
          gemini_api_version,
          gemini_temperature,
          gemini_max_tokens,
          send_interval_min,
          send_interval_max,
          google_maps_api_key
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        body.global_ai_api_key ?? null,
        body.evolution_api_url ?? null,
        body.evolution_api_key ?? null,
        body.evolution_shared_instance ?? null,
        body.gemini_model ?? null,
        body.gemini_api_version ?? null,
        body.gemini_temperature ?? null,
        body.gemini_max_tokens ?? null,
        body.send_interval_min ?? null,
        body.send_interval_max ?? null,
        body.google_maps_api_key ?? null
      ]
    );
  }
  return c.json(result.rows[0] || {});
});

// src/routes/history.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
init_runtimeSchema();
function getAuthenticatedUserId2(c) {
  const user = c.get("user");
  return user?.id ?? null;
}
__name(getAuthenticatedUserId2, "getAuthenticatedUserId");
async function ensureHistoryTables(db) {
  const UUID_GEN = "(md5(random()::text || clock_timestamp()::text)::uuid)";
  await runSchemaBestEffort(async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.contact_send_history (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        campaign_id UUID,
        campaign_name TEXT,
        contact_name TEXT,
        phone_key TEXT,
        channel TEXT,
        ok BOOLEAN DEFAULT false,
        status INTEGER,
        webhook_ok BOOLEAN DEFAULT false,
        provider_status TEXT,
        error_detail TEXT,
        payload_raw JSONB,
        delivery_summary JSONB,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_send_history_user_run_at
        ON public.contact_send_history(user_id, run_at DESC)
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_send_history_campaign_run_at
        ON public.contact_send_history(campaign_id, run_at DESC)
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.campaign_history (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        campaign_id UUID,
        status TEXT,
        ok BOOLEAN DEFAULT false,
        total INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_campaign_history_user_run_at
        ON public.campaign_history(user_id, run_at DESC)
    `);
  }, "history");
}
__name(ensureHistoryTables, "ensureHistoryTables");
var historyRoutes = new Hono2();
historyRoutes.post("/history", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId2(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureHistoryTables(db);
  const body = await c.req.json().catch(() => ({}));
  const historyId = crypto.randomUUID();
  const result = await db.query(
    `INSERT INTO public.contact_send_history (
      id,
      user_id,
      campaign_id,
      campaign_name,
      contact_name,
      phone_key,
      channel,
      ok,
      status,
      webhook_ok,
      run_at,
      provider_status,
      error_detail,
      payload_raw,
      delivery_summary
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb)
    RETURNING *`,
    [
      historyId,
      userId,
      body.campaign_id ?? null,
      body.campaign_name ?? null,
      body.contact_name ?? null,
      body.phone_key ?? null,
      body.channel ?? null,
      body.ok ?? false,
      body.status ?? null,
      body.webhook_ok ?? false,
      body.run_at ?? (/* @__PURE__ */ new Date()).toISOString(),
      body.provider_status ?? null,
      body.error_detail ?? null,
      body.payload_raw ? JSON.stringify(body.payload_raw) : null,
      body.delivery_summary ? JSON.stringify(body.delivery_summary) : null
    ]
  );
  return c.json(result.rows[0], 201);
});
historyRoutes.get("/history", authenticateToken, async (c) => {
  try {
    const userId = getAuthenticatedUserId2(c);
    if (!userId) return c.json({ error: "Acesso negado." }, 401);
    const db = getDb(c.env);
    await ensureHistoryTables(db);
    const result = await db.query(
      "SELECT * FROM public.contact_send_history WHERE user_id = $1 ORDER BY run_at DESC",
      [userId]
    );
    return c.json(result.rows);
  } catch (error) {
    const technical = typeof error?.message === "string" ? error.message : String(error || "Erro interno");
    console.error("[history.get] Falha ao carregar historico:", technical);
    return c.json(
      {
        error: "Erro ao carregar historico de envios.",
        technical
      },
      500
    );
  }
});
historyRoutes.delete("/history", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId2(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureHistoryTables(db);
  await db.query("DELETE FROM public.contact_send_history WHERE user_id = $1", [userId]);
  return c.json({ ok: true });
});
historyRoutes.get("/campaigns/history", authenticateToken, async (c) => {
  try {
    const userId = getAuthenticatedUserId2(c);
    if (!userId) return c.json({ error: "Acesso negado." }, 401);
    const db = getDb(c.env);
    await ensureHistoryTables(db);
    const result = await db.query(
      "SELECT * FROM public.campaign_history WHERE user_id = $1 ORDER BY run_at DESC",
      [userId]
    );
    return c.json(result.rows);
  } catch (error) {
    const technical = typeof error?.message === "string" ? error.message : String(error || "Erro interno");
    console.error("[campaigns.history.get] Falha ao carregar historico de campanhas:", technical);
    return c.json(
      {
        error: "Erro ao carregar historico de campanhas.",
        technical
      },
      500
    );
  }
});
historyRoutes.post("/campaigns/history", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId2(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureHistoryTables(db);
  const body = await c.req.json().catch(() => ({}));
  const historyId = crypto.randomUUID();
  const result = await db.query(
    `INSERT INTO public.campaign_history (
      id,
      user_id,
      campaign_id,
      status,
      ok,
      total,
      error_count,
      run_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      historyId,
      userId,
      body.campaign_id ?? null,
      body.status ?? null,
      body.ok ?? false,
      body.total ?? 0,
      body.error_count ?? 0,
      body.run_at ?? (/* @__PURE__ */ new Date()).toISOString()
    ]
  );
  return c.json(result.rows[0], 201);
});
historyRoutes.delete("/campaigns/history", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId2(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureHistoryTables(db);
  await db.query("DELETE FROM public.campaign_history WHERE user_id = $1", [userId]);
  return c.json({ ok: true });
});

// src/routes/listsContacts.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
init_runtimeSchema();
function getAuthenticatedUserId3(c) {
  const user = c.get("user");
  return user?.id ?? null;
}
__name(getAuthenticatedUserId3, "getAuthenticatedUserId");
function normalizeText(value, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim();
}
__name(normalizeText, "normalizeText");
function normalizeNullableText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}
__name(normalizeNullableText, "normalizeNullableText");
async function ensureListsAndContactsTables(db) {
  await runSchemaBestEffort(async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_lists_user_name
        ON public.lists(user_id, name)
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        category TEXT DEFAULT '',
        cep TEXT DEFAULT '',
        rating TEXT DEFAULT '',
        address TEXT DEFAULT '',
        city TEXT DEFAULT '',
        state TEXT DEFAULT '',
        instagram TEXT DEFAULT '',
        facebook TEXT DEFAULT '',
        whatsapp TEXT DEFAULT '',
        website TEXT DEFAULT '',
        labels JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'`);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_user_list_name
        ON public.contacts(user_id, list_id, name)
    `);
  }, "listsContacts");
}
__name(ensureListsAndContactsTables, "ensureListsAndContactsTables");
var listsContactsRoutes = new Hono2();
listsContactsRoutes.get("/lists", authenticateToken, async (c) => {
  try {
    const userId = getAuthenticatedUserId3(c);
    if (!userId) return c.json({ error: "Acesso negado." }, 401);
    const db = getDb(c.env);
    await ensureListsAndContactsTables(db);
    const result = await db.query(
      "SELECT * FROM public.lists WHERE user_id = $1 ORDER BY name ASC",
      [userId]
    );
    return c.json(result.rows);
  } catch (error) {
    const technical = typeof error?.message === "string" ? error.message : String(error || "Erro interno");
    console.error("[lists.get] Falha ao carregar listas:", technical);
    return c.json(
      {
        error: "Erro ao carregar listas.",
        technical
      },
      500
    );
  }
});
listsContactsRoutes.post("/lists", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  const body = await c.req.json().catch(() => ({}));
  const name = normalizeText(body.name);
  if (!name) return c.json({ error: "Nome da lista \xE9 obrigat\xF3rio." }, 400);
  const result = await db.query(
    "INSERT INTO public.lists (user_id, name) VALUES ($1, $2) RETURNING *",
    [userId, name]
  );
  return c.json(result.rows[0], 201);
});
listsContactsRoutes.put("/lists/:id", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const listId = c.req.param("id");
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  const body = await c.req.json().catch(() => ({}));
  const name = normalizeText(body.name);
  if (!name) return c.json({ error: "Nome da lista \xE9 obrigat\xF3rio." }, 400);
  const result = await db.query(
    `UPDATE public.lists
        SET name = $1
      WHERE id = $2
        AND user_id = $3
    RETURNING *`,
    [name, listId, userId]
  );
  if (!result.rows[0]) return c.json({ error: "Lista nao encontrada." }, 404);
  return c.json(result.rows[0]);
});
listsContactsRoutes.delete("/lists/:id", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const listId = c.req.param("id");
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  await db.query("DELETE FROM public.lists WHERE id = $1 AND user_id = $2", [listId, userId]);
  return c.json({ ok: true });
});
listsContactsRoutes.delete("/lists", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  await db.query("DELETE FROM public.lists WHERE user_id = $1", [userId]);
  return c.json({ ok: true });
});
listsContactsRoutes.get("/contacts", authenticateToken, async (c) => {
  try {
    const userId = getAuthenticatedUserId3(c);
    if (!userId) return c.json({ error: "Acesso negado." }, 401);
    const listId = c.req.query("listId");
    const db = getDb(c.env);
    await ensureListsAndContactsTables(db);
    if (listId) {
      const result2 = await db.query(
        `SELECT *
           FROM public.contacts
          WHERE user_id = $1
            AND list_id = $2
          ORDER BY name ASC`,
        [userId, listId]
      );
      return c.json(result2.rows);
    }
    const result = await db.query(
      `SELECT *
         FROM public.contacts
        WHERE user_id = $1
        ORDER BY name ASC`,
      [userId]
    );
    return c.json(result.rows);
  } catch (error) {
    const technical = typeof error?.message === "string" ? error.message : String(error || "Erro interno");
    console.error("[contacts.get] Falha ao carregar contatos:", technical);
    return c.json(
      {
        error: "Erro ao carregar contatos.",
        technical
      },
      500
    );
  }
});
listsContactsRoutes.post("/contacts", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  const body = await c.req.json().catch(() => ({}));
  const listId = normalizeText(body.list_id);
  const name = normalizeText(body.name);
  const phone = normalizeText(body.phone);
  if (!listId) return c.json({ error: "list_id \xE9 obrigat\xF3rio." }, 400);
  if (!name) return c.json({ error: "name \xE9 obrigat\xF3rio." }, 400);
  const duplicate = await db.query(
    `SELECT id
       FROM public.contacts
      WHERE user_id = $1
        AND list_id = $2
        AND (name = $3 OR (phone = $4 AND phone <> ''))
      LIMIT 1`,
    [userId, listId, name, phone || ""]
  );
  if (duplicate.rows.length > 0) {
    return c.json({ error: "Contato ja existe nesta lista." }, 409);
  }
  const result = await db.query(
    `INSERT INTO public.contacts (
      user_id, list_id, name, phone, email, category, cep, rating,
      address, city, state, instagram, facebook, whatsapp, website, labels
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *`,
    [
      userId,
      listId,
      name,
      phone || "",
      normalizeText(body.email),
      normalizeText(body.category),
      normalizeText(body.cep),
      normalizeText(body.rating),
      normalizeText(body.address),
      normalizeText(body.city),
      normalizeText(body.state),
      normalizeText(body.instagram),
      normalizeText(body.facebook),
      normalizeText(body.whatsapp),
      normalizeText(body.website),
      JSON.stringify(body.labels || [])
    ]
  );
  return c.json(result.rows[0], 201);
});
listsContactsRoutes.put("/contacts/:id", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const contactId = c.req.param("id");
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  const body = await c.req.json().catch(() => ({}));
  const result = await db.query(
    `UPDATE public.contacts SET
      name = COALESCE($1, name),
      phone = COALESCE($2, phone),
      email = COALESCE($3, email),
      category = COALESCE($4, category),
      cep = COALESCE($5, cep),
      rating = COALESCE($6, rating),
      address = COALESCE($7, address),
      city = COALESCE($8, city),
      state = COALESCE($9, state),
      instagram = COALESCE($10, instagram),
      facebook = COALESCE($11, facebook),
      whatsapp = COALESCE($12, whatsapp),
      website = COALESCE($13, website),
      labels = COALESCE($14, labels)
    WHERE id = $15 AND user_id = $16
    RETURNING *`,
    [
      normalizeNullableText(body.name),
      normalizeNullableText(body.phone),
      normalizeNullableText(body.email),
      normalizeNullableText(body.category),
      normalizeNullableText(body.cep),
      normalizeNullableText(body.rating),
      normalizeNullableText(body.address),
      normalizeNullableText(body.city),
      normalizeNullableText(body.state),
      normalizeNullableText(body.instagram),
      normalizeNullableText(body.facebook),
      normalizeNullableText(body.whatsapp),
      normalizeNullableText(body.website),
      body.labels ? JSON.stringify(body.labels) : null,
      contactId,
      userId
    ]
  );
  if (!result.rows[0]) return c.json({ error: "Contato nao encontrado." }, 404);
  return c.json(result.rows[0]);
});
listsContactsRoutes.delete("/contacts/:id", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const contactId = c.req.param("id");
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  await db.query("DELETE FROM public.contacts WHERE id = $1 AND user_id = $2", [contactId, userId]);
  return c.json({ ok: true });
});
listsContactsRoutes.delete("/contacts", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId3(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureListsAndContactsTables(db);
  await db.query("DELETE FROM public.contacts WHERE user_id = $1", [userId]);
  return c.json({ ok: true });
});

// src/routes/campaigns.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();

// src/lib/campaignDelivery.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_messageUtils();

// src/lib/mediaResolver.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
function isObsoleteLocalPath(storagePath) {
  return storagePath.startsWith("/app/storage/");
}
__name(isObsoleteLocalPath, "isObsoleteLocalPath");
function extractPublicTokenFromUrl(url) {
  const match2 = url.match(/\/uploads\/public\/([^/?#]+)\/([^/?#]+)/);
  if (!match2) return null;
  return {
    token: decodeURIComponent(match2[1]),
    storedName: decodeURIComponent(match2[2])
  };
}
__name(extractPublicTokenFromUrl, "extractPublicTokenFromUrl");
async function resolveMediaUrl(opts) {
  const { mediaId, url, sourceType, mimeType, env: env2 } = opts;
  const trimmedUrl = (url || "").trim();
  if (!trimmedUrl) {
    return { url: "", source: "error", error: "URL vazia", mediaId };
  }
  const isInternal = trimmedUrl.includes("sendmessage-backend") || sourceType === "asset";
  if (isInternal && env2?.UPLOADS_BUCKET && env2?.db) {
    const parsed = extractPublicTokenFromUrl(trimmedUrl);
    if (!parsed) {
      console.log(`[MediaResolver] ${mediaId}: Regex falhou para URL: ${trimmedUrl.substring(0, 100)}`);
      return { url: "", source: "error", error: `URL interna n\xE3o reconhecida: ${trimmedUrl}`, mediaId };
    }
    console.log(`[MediaResolver] ${mediaId}: token=${parsed.token.substring(0, 12)}... storedName=${parsed.storedName.substring(0, 40)}`);
    try {
      const fileResult = await env2.db.query(
        `SELECT storage_path FROM public.user_uploaded_files WHERE public_token = $1 AND stored_name = $2 AND deleted_at IS NULL LIMIT 1`,
        [parsed.token, parsed.storedName]
      );
      const storagePath = fileResult.rows[0]?.storage_path;
      if (!storagePath) {
        console.log(`[MediaResolver] ${mediaId}: NAO encontrado no banco. token=${parsed.token} stored_name=${parsed.storedName}`);
        return { url: "", source: "error", error: `Arquivo '${parsed.storedName}' n\xE3o encontrado no banco (pode ter sido exclu\xEDdo).`, mediaId };
      }
      if (isObsoleteLocalPath(storagePath)) {
        return {
          url: "",
          source: "error",
          error: `Arquivo obsoleto: '${parsed.storedName}' pertence a uma vers\xE3o anterior do sistema. Remova-o da campanha e refa\xE7a o upload.`,
          mediaId
        };
      }
      const head = await env2.UPLOADS_BUCKET.head(storagePath);
      if (!head) {
        console.log(`[MediaResolver] ${mediaId}: Encontrado no DB (path=${storagePath}) mas NAO no R2`);
        return { url: "", source: "error", error: `Arquivo '${parsed.storedName}' existe no banco mas n\xE3o foi encontrado no storage R2.`, mediaId };
      }
      console.log(`[MediaResolver] ${mediaId}: OK (R2 validado, path=${storagePath})`);
      return { url: trimmedUrl, source: "r2", mediaId };
    } catch (err) {
      console.log(`[MediaResolver] ${mediaId}: ERRO R2: ${err?.message || String(err)}`);
      return { url: "", source: "error", error: `Erro ao verificar R2: ${err?.message || String(err)}`, mediaId };
    }
  }
  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { url: "", source: "error", error: `URL com protocolo inv\xE1lido: ${parsed.protocol}`, mediaId };
    }
    return { url: trimmedUrl, source: "external", mediaId };
  } catch {
    return { url: "", source: "error", error: `URL inv\xE1lida: ${trimmedUrl}`, mediaId };
  }
}
__name(resolveMediaUrl, "resolveMediaUrl");
async function preValidateMediaItems(items, env2) {
  const results = await Promise.all(
    items.map((item) => resolveMediaUrl({
      mediaId: item.id,
      url: item.url,
      sourceType: item.sourceType,
      mimeType: item.mimeType,
      env: env2
    }))
  );
  return {
    valid: results.filter((r) => r.source !== "error"),
    invalid: results.filter((r) => r.source === "error")
  };
}
__name(preValidateMediaItems, "preValidateMediaItems");

// src/lib/campaignDelivery.ts
var MAX_MEDIA_ITEMS = 5;
var INTRA_CONTACT_DELAY_MS = 1e3;
var ALLOWED_MEDIA_TYPES = /* @__PURE__ */ new Set(["image", "document", "audio"]);
function safeTrim2(value) {
  return String(value || "").trim();
}
__name(safeTrim2, "safeTrim");
function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
__name(isValidHttpUrl, "isValidHttpUrl");
function ensureHtmlMessage(message2) {
  const raw2 = safeTrim2(message2);
  if (!raw2) return "";
  if (raw2.startsWith("<")) return raw2;
  return `<p style="margin:0; font-size:14px; line-height:1.5; color:#111827;">${raw2.split("\n").map((line) => line.trim().length === 0 ? "&nbsp;" : line).join("<br />")}</p>`;
}
__name(ensureHtmlMessage, "ensureHtmlMessage");
function inferFileNameFromUrl2(url) {
  try {
    const parsed = new URL(url);
    return safeTrim2(decodeURIComponent(parsed.pathname.split("/").pop() || ""));
  } catch {
    return "";
  }
}
__name(inferFileNameFromUrl2, "inferFileNameFromUrl");
function sanitizeFileName(fileName, fallback = "arquivo") {
  const safe = safeTrim2(fileName).replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-").replace(/\s+/g, " ").trim();
  return safe || fallback;
}
__name(sanitizeFileName, "sanitizeFileName");
function inferMimeType(media) {
  const explicit = safeTrim2(media.mimeType).toLowerCase();
  if (explicit) return explicit;
  const hint = `${safeTrim2(media.assetName)} ${inferFileNameFromUrl2(media.url)}`.toLowerCase();
  if (hint.endsWith(".pdf")) return "application/pdf";
  if (hint.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (hint.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (hint.endsWith(".mp3")) return "audio/mpeg";
  if (hint.endsWith(".wav")) return "audio/wav";
  if (hint.endsWith(".mp4")) return "video/mp4";
  if (hint.endsWith(".png")) return "image/png";
  if (hint.endsWith(".webp")) return "image/webp";
  if (hint.endsWith(".jpg") || hint.endsWith(".jpeg")) return "image/jpeg";
  if (media.mediaType === "audio") return "audio/mpeg";
  return media.mediaType === "document" ? "application/octet-stream" : "image/jpeg";
}
__name(inferMimeType, "inferMimeType");
function resolveMediaFileName(media) {
  const fromAsset = safeTrim2(media.assetName);
  if (fromAsset) return sanitizeFileName(fromAsset);
  const fromUrl = inferFileNameFromUrl2(media.url);
  if (fromUrl) return sanitizeFileName(fromUrl);
  return sanitizeFileName(
    `${media.id}${media.mediaType === "document" ? ".pdf" : media.mediaType === "audio" ? ".mp3" : ".jpg"}`
  );
}
__name(resolveMediaFileName, "resolveMediaFileName");
function normalizeMediaItem(item, index) {
  const mediaType = safeTrim2(item?.mediaType || "image").toLowerCase();
  const url = safeTrim2(item?.url);
  if (!url || !ALLOWED_MEDIA_TYPES.has(mediaType)) return null;
  return {
    id: safeTrim2(item?.id) || `media-${index + 1}`,
    sourceType: safeTrim2(item?.sourceType).toLowerCase() === "asset" ? "asset" : "url",
    mediaType,
    url,
    caption: safeTrim2(item?.caption),
    assetId: safeTrim2(item?.assetId) || void 0,
    assetName: safeTrim2(item?.assetName) || void 0,
    mimeType: safeTrim2(item?.mimeType) || void 0
  };
}
__name(normalizeMediaItem, "normalizeMediaItem");
function normalizeSharedContact(contact) {
  if (!contact || typeof contact !== "object") return null;
  const fullName = safeTrim2(contact.fullName);
  const phone = safeTrim2(contact.phone);
  const company = safeTrim2(contact.company);
  const email = safeTrim2(contact.email);
  const url = safeTrim2(contact.url);
  if (!fullName && !phone && !company && !email && !url) return null;
  return { fullName, phone, company, email, url };
}
__name(normalizeSharedContact, "normalizeSharedContact");
function parseCampaignDeliveryPayload(rawPayload) {
  if (!rawPayload) return null;
  try {
    const parsed = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
    if (!parsed || typeof parsed !== "object") return null;
    const blocks = Array.isArray(parsed?.whatsapp?.blocks) ? parsed.whatsapp.blocks : [];
    const normalizedBlocks = [];
    for (const block of blocks) {
      const type = safeTrim2(block?.type).toLowerCase();
      if (type === "text") {
        const content = String(block?.content || "");
        if (content.trim()) normalizedBlocks.push({ type: "text", content });
      } else if (type === "media") {
        const items = Array.isArray(block?.items) ? block.items.map((item, index) => normalizeMediaItem(item, index)).filter(Boolean).slice(0, MAX_MEDIA_ITEMS) : [];
        if (items.length > 0) normalizedBlocks.push({ type: "media", items });
      } else if (type === "contact") {
        const contact = normalizeSharedContact(block?.contact);
        if (contact) normalizedBlocks.push({ type: "contact", contact });
      }
    }
    if (normalizedBlocks.length === 0) return null;
    return { version: Number(parsed?.version || 1), whatsapp: { blocks: normalizedBlocks } };
  } catch {
    return null;
  }
}
__name(parseCampaignDeliveryPayload, "parseCampaignDeliveryPayload");
function validateCampaignDeliveryPayload(rawPayload, channels = []) {
  const errors = [];
  if (rawPayload == null) return { payload: null, errors };
  const payload = parseCampaignDeliveryPayload(rawPayload);
  if (!payload) return { payload: null, errors: ["O payload estruturado da campanha esta invalido."] };
  if (channels.includes("whatsapp")) {
    const mediaItems = payload.whatsapp.blocks.filter((block) => block.type === "media").flatMap((block) => block.items || []);
    if (mediaItems.length > MAX_MEDIA_ITEMS) {
      errors.push(`A campanha suporta no maximo ${MAX_MEDIA_ITEMS} midias por WhatsApp.`);
    }
    for (const media of mediaItems) {
      if (!isValidHttpUrl(media.url)) errors.push(`A midia "${media.id}" precisa usar uma URL publica valida.`);
    }
    const contactBlock = payload.whatsapp.blocks.find((block) => block.type === "contact");
    if (contactBlock?.contact) {
      if (!contactBlock.contact.fullName) errors.push("O contato compartilhado precisa ter nome.");
      if (!contactBlock.contact.phone) errors.push("O contato compartilhado precisa ter telefone.");
    }
  }
  return { payload, errors };
}
__name(validateCampaignDeliveryPayload, "validateCampaignDeliveryPayload");
function buildCampaignDeliveryPlan(campaign, messageOverride) {
  const payload = parseCampaignDeliveryPayload(campaign.delivery_payload);
  const textBlock = payload?.whatsapp?.blocks?.find((block) => block.type === "text");
  const mediaItems = payload?.whatsapp?.blocks?.filter((block) => block.type === "media").flatMap((block) => block.items || []) ?? [];
  const contactBlock = payload?.whatsapp?.blocks?.find((block) => block.type === "contact");
  return {
    payload,
    messageHtml: ensureHtmlMessage(messageOverride || textBlock?.content || campaign.message || ""),
    mediaItems,
    sharedContact: contactBlock?.contact || null
  };
}
__name(buildCampaignDeliveryPlan, "buildCampaignDeliveryPlan");
function buildMediaCaption(messageText, mediaCaption, attachMessage) {
  const parts = [];
  if (attachMessage && safeTrim2(messageText)) parts.push(safeTrim2(messageText));
  if (safeTrim2(mediaCaption)) parts.push(safeTrim2(mediaCaption));
  return parts.join("\n\n").trim();
}
__name(buildMediaCaption, "buildMediaCaption");
async function sendEvolutionMedia({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  media,
  mediaUrl,
  caption
}) {
  const fileName = resolveMediaFileName(media);
  const mimeType = inferMimeType(media);
  const payload = {
    number,
    mediatype: media.mediaType,
    mimetype: mimeType,
    fileName,
    caption,
    media: mediaUrl
  };
  await postEvolutionWithRetry(fetchImpl, `${evolutionUrl}/message/sendMedia/${evolutionInstance}`, evolutionApiKey, payload);
}
__name(sendEvolutionMedia, "sendEvolutionMedia");
async function sendEvolutionAudio({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  mediaUrl
}) {
  await postEvolutionWithRetry(fetchImpl, `${evolutionUrl}/message/sendWhatsAppAudio/${evolutionInstance}`, evolutionApiKey, {
    number,
    audio: mediaUrl
  });
}
__name(sendEvolutionAudio, "sendEvolutionAudio");
function resolveSharedContact(sharedContact, contact) {
  if (!sharedContact) return null;
  const fullName = safeTrim2(resolveTemplate(sharedContact.fullName, contact));
  const phone = safeTrim2(resolveTemplate(sharedContact.phone, contact));
  const company = safeTrim2(resolveTemplate(sharedContact.company || "", contact));
  const email = safeTrim2(resolveTemplate(sharedContact.email || "", contact));
  const url = safeTrim2(resolveTemplate(sharedContact.url || "", contact));
  if (!fullName || !phone) return null;
  return { fullName, phone, company, email, url };
}
__name(resolveSharedContact, "resolveSharedContact");
async function sendEvolutionContact({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  sharedContact
}) {
  const contactNumber = toEvolutionNumber(sharedContact.phone);
  if (!contactNumber) throw new Error("Telefone do contato compartilhado esta invalido.");
  const payload = {
    wuid: `${contactNumber}@s.whatsapp.net`,
    phoneNumber: contactNumber,
    fullName: sharedContact.fullName,
    organization: sharedContact.company || void 0,
    email: sharedContact.email || void 0,
    url: sharedContact.url || void 0
  };
  await postEvolution(fetchImpl, `${evolutionUrl}/message/sendContact/${evolutionInstance}`, evolutionApiKey, {
    number,
    contact: [payload]
  });
}
__name(sendEvolutionContact, "sendEvolutionContact");
async function sendEvolutionPoll({
  fetchImpl,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  number,
  poll
}) {
  const payload = {
    number,
    name: poll.name,
    options: poll.options.filter((o) => o.trim().length > 0),
    selectableCount: poll.selectableCount || 1
  };
  await postEvolution(fetchImpl, `${evolutionUrl}/message/sendPoll/${evolutionInstance}`, evolutionApiKey, payload);
}
__name(sendEvolutionPoll, "sendEvolutionPoll");
async function executeWhatsappCampaignDelivery({
  fetchImpl = fetch,
  evolutionUrl,
  evolutionApiKey,
  evolutionInstance,
  campaign,
  contact,
  messageOverride,
  baseUrl,
  env: env2
}) {
  const evolutionNumber = toEvolutionNumber(contact.phone);
  if (!evolutionNumber) throw new Error("Contato sem telefone valido para envio no formato Evolution.");
  const plan = buildCampaignDeliveryPlan(campaign, messageOverride);
  const resolvedHtml = resolveTemplate(plan.messageHtml, contact);
  const messageText = htmlToWhatsapp(resolvedHtml);
  const result = {
    sentText: false,
    mediaSent: 0,
    mediaFailed: 0,
    contactSent: false,
    contactFailed: false,
    pollSent: false,
    pollFailed: false,
    errors: [],
    mediaDetails: []
  };
  const mediaItems = Array.isArray(plan.mediaItems) ? plan.mediaItems : [];
  const preValidationItems = mediaItems.map((m) => ({
    id: m.id,
    url: safeTrim2(resolveTemplate(m.url, contact)),
    sourceType: m.sourceType,
    mimeType: inferMimeType(m)
  }));
  console.log(`[Delivery] Pre-validando ${preValidationItems.length} midia(s):`, preValidationItems.map((p) => ({
    id: p.id,
    url: p.url.substring(0, 80),
    sourceType: p.sourceType
  })));
  console.log(`[Delivery] env.UPLOADS_BUCKET disponivel: ${!!env2?.UPLOADS_BUCKET}, env.db disponivel: ${!!env2?.db}`);
  const { valid: validMedia, invalid: invalidMedia } = await preValidateMediaItems(preValidationItems, env2);
  console.log(`[Delivery] Resultado: ${validMedia.length} valida(s), ${invalidMedia.length} invalida(s)`);
  if (invalidMedia.length > 0) {
    console.log(`[Delivery] Midias invalidas:`, invalidMedia.map((inv) => ({ id: inv.mediaId, error: inv.error })));
  }
  const resolvedUrlMap = /* @__PURE__ */ new Map();
  for (const v of validMedia) resolvedUrlMap.set(v.mediaId, v);
  for (const inv of invalidMedia) {
    result.mediaFailed += 1;
    result.errors.push(`M\xEDdia ${inv.mediaId}: ${inv.error}`);
    result.mediaDetails.push({ id: inv.mediaId, type: "media", status: "skipped", error: inv.error });
  }
  const sendableMedia = mediaItems.filter((m) => resolvedUrlMap.has(m.id));
  const [firstMedia, ...remainingMedia] = sendableMedia;
  const useMessageAsFirstMediaCaption = Boolean(messageText && firstMedia && firstMedia.mediaType === "image");
  const sendMediaItem = /* @__PURE__ */ __name(async (media, attachMessage) => {
    const resolved = resolvedUrlMap.get(media.id);
    if (!resolved) return;
    const originalUrl = ensureValidMediaUrl(safeTrim2(resolveTemplate(media.url, contact)));
    try {
      if (media.mediaType === "audio") {
        await sendEvolutionAudio({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          mediaUrl: originalUrl
        });
      } else {
        await sendEvolutionMedia({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          media,
          mediaUrl: originalUrl,
          caption: buildMediaCaption(
            messageText,
            safeTrim2(resolveTemplate(media.caption || "", contact)),
            attachMessage
          )
        });
      }
      result.mediaSent += 1;
      result.mediaDetails.push({ id: media.id, type: media.mediaType, status: "sent" });
      if (attachMessage) result.sentText = true;
    } catch (error) {
      result.mediaFailed += 1;
      const errMsg = String(error?.message || error);
      result.errors.push(`Falha ao enviar m\xEDdia ${media.id}: ${errMsg}`);
      result.mediaDetails.push({ id: media.id, type: media.mediaType, status: "failed", error: errMsg });
      if (attachMessage && messageText) {
        try {
          await postEvolution(fetchImpl, `${evolutionUrl}/message/sendText/${evolutionInstance}`, evolutionApiKey, {
            number: evolutionNumber,
            text: messageText,
            linkPreview: true
          });
          result.sentText = true;
        } catch (textErr) {
          result.errors.push(`Falha no fallback de texto: ${String(textErr?.message || textErr)}`);
        }
      }
    }
  }, "sendMediaItem");
  if (firstMedia) {
    await sendMediaItem(firstMedia, useMessageAsFirstMediaCaption);
    if (remainingMedia.length > 0 || messageText && !useMessageAsFirstMediaCaption || plan.sharedContact) {
      await wait2(INTRA_CONTACT_DELAY_MS);
    }
  }
  if (messageText && !useMessageAsFirstMediaCaption) {
    try {
      await postEvolution(fetchImpl, `${evolutionUrl}/message/sendText/${evolutionInstance}`, evolutionApiKey, {
        number: evolutionNumber,
        text: messageText,
        linkPreview: true
      });
      result.sentText = true;
    } catch (textErr) {
      result.errors.push(`Falha ao enviar texto: ${String(textErr?.message || textErr)}`);
    }
    if (remainingMedia.length > 0 || plan.sharedContact) await wait2(INTRA_CONTACT_DELAY_MS);
  }
  for (let i = 0; i < remainingMedia.length; i++) {
    await sendMediaItem(remainingMedia[i], false);
    if (i < remainingMedia.length - 1 || plan.sharedContact) await wait2(INTRA_CONTACT_DELAY_MS);
  }
  if (plan.sharedContact) {
    const resolvedShared = resolveSharedContact(plan.sharedContact, contact);
    if (!resolvedShared) {
      result.contactFailed = true;
      result.errors.push("Contato compartilhado invalido ou incompleto.");
    } else {
      try {
        await sendEvolutionContact({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          sharedContact: resolvedShared
        });
        result.contactSent = true;
      } catch (error) {
        result.contactFailed = true;
        result.errors.push(`Falha ao enviar contato compartilhado: ${String(error?.message || error)}`);
      }
    }
  }
  if (campaign.poll) {
    const poll = campaign.poll;
    if (poll.name && Array.isArray(poll.options)) {
      try {
        await sendEvolutionPoll({
          fetchImpl,
          evolutionUrl,
          evolutionApiKey,
          evolutionInstance,
          number: evolutionNumber,
          poll: {
            name: resolveTemplate(poll.name, contact),
            options: poll.options.map((opt) => resolveTemplate(opt, contact)),
            selectableCount: poll.selectableCount || 1
          }
        });
        result.pollSent = true;
      } catch (error) {
        result.pollFailed = true;
        result.errors.push(`Falha ao enviar enquete: ${String(error?.message || error)}`);
      }
    }
  }
  return result;
}
__name(executeWhatsappCampaignDelivery, "executeWhatsappCampaignDelivery");

// src/lib/sendHistory.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
function safeJsonClone(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}
__name(safeJsonClone, "safeJsonClone");
function normalizeHistoryPhoneKey(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.startsWith("55") ? digits.slice(2) : digits;
}
__name(normalizeHistoryPhoneKey, "normalizeHistoryPhoneKey");
function buildDeliverySummary(deliveryResult) {
  return {
    sentText: Boolean(deliveryResult?.sentText),
    mediaSent: Number(deliveryResult?.mediaSent || 0),
    mediaFailed: Number(deliveryResult?.mediaFailed || 0),
    contactSent: Boolean(deliveryResult?.contactSent),
    contactFailed: Boolean(deliveryResult?.contactFailed),
    errors: Array.isArray(deliveryResult?.errors) ? deliveryResult.errors.map((item) => String(item)) : []
  };
}
__name(buildDeliverySummary, "buildDeliverySummary");
function buildContactSendHistoryEntry({
  userId,
  campaign,
  contact,
  channel: channel2 = "whatsapp",
  deliveryResult = null,
  error = null,
  runAt = (/* @__PURE__ */ new Date()).toISOString()
}) {
  const deliverySummary = buildDeliverySummary(deliveryResult);
  const sentSomething = deliverySummary.sentText || deliverySummary.mediaSent > 0 || deliverySummary.contactSent;
  const errors = [...deliverySummary.errors];
  if (error) errors.unshift(String(error?.message || error));
  const hasIssues = errors.length > 0 || deliverySummary.mediaFailed > 0 || deliverySummary.contactFailed;
  let status = 500;
  let ok = false;
  let providerStatus = "error";
  if (sentSomething && hasIssues) {
    status = 207;
    ok = true;
    providerStatus = "partial";
  } else if (sentSomething) {
    status = 200;
    ok = true;
    providerStatus = "sent";
  }
  return {
    userId,
    campaignId: campaign?.id || null,
    campaignName: campaign?.name || null,
    contactName: contact?.name || "",
    phoneKey: normalizeHistoryPhoneKey(contact?.phone || ""),
    channel: channel2,
    ok,
    status,
    webhookOk: ok,
    runAt,
    providerStatus,
    errorDetail: errors.length > 0 ? errors.join(" | ") : null,
    payloadRaw: safeJsonClone({
      deliverySummary,
      error: error ? String(error?.message || error) : null
    }),
    deliverySummary
  };
}
__name(buildContactSendHistoryEntry, "buildContactSendHistoryEntry");
async function insertContactSendHistory(queryImpl, entry) {
  return queryImpl(
    `INSERT INTO contact_send_history (
      user_id,
      campaign_id,
      campaign_name,
      contact_name,
      phone_key,
      channel,
      ok,
      status,
      webhook_ok,
      run_at,
      provider_status,
      error_detail,
      payload_raw,
      delivery_summary
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb)
    RETURNING *`,
    [
      entry.userId,
      entry.campaignId,
      entry.campaignName,
      entry.contactName,
      entry.phoneKey,
      entry.channel,
      entry.ok,
      entry.status,
      entry.webhookOk,
      entry.runAt,
      entry.providerStatus,
      entry.errorDetail,
      safeJsonClone(entry.payloadRaw) ? JSON.stringify(entry.payloadRaw) : null,
      safeJsonClone(entry.deliverySummary) ? JSON.stringify(entry.deliverySummary) : null
    ]
  );
}
__name(insertContactSendHistory, "insertContactSendHistory");

// src/routes/campaigns.ts
init_messageUtils();
init_runtimeSchema();
var ALLOWED_CHANNELS = /* @__PURE__ */ new Set(["whatsapp", "email"]);
function getAuthenticatedUserId4(c) {
  const user = c.get("user");
  return user?.id ?? null;
}
__name(getAuthenticatedUserId4, "getAuthenticatedUserId");
function normalizeText2(value, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim();
}
__name(normalizeText2, "normalizeText");
function parseCampaignChannels(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim().toLowerCase()).filter((channel2) => ALLOWED_CHANNELS.has(channel2));
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parseCampaignChannels(parsed);
    } catch {
      const parts = input.split(",").map((item) => item.trim().toLowerCase());
      return parts.filter((channel2) => ALLOWED_CHANNELS.has(channel2));
    }
  }
  return [];
}
__name(parseCampaignChannels, "parseCampaignChannels");
function normalizeDeliveryPayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input;
}
__name(normalizeDeliveryPayload, "normalizeDeliveryPayload");
var campaignsSchemaChecked = false;
async function ensureCampaignsTable(db) {
  if (campaignsSchemaChecked) return;
  campaignsSchemaChecked = true;
  await runSchemaBestEffort(async () => {
    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {
    });
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'rascunho',
        channels JSONB NOT NULL DEFAULT '["whatsapp"]'::jsonb,
        list_name TEXT NOT NULL,
        message TEXT NOT NULL,
        variations JSONB NOT NULL DEFAULT '[]'::jsonb,
        interval_min_seconds INTEGER NOT NULL DEFAULT 30,
        interval_max_seconds INTEGER NOT NULL DEFAULT 90,
        delivery_payload JSONB,
        poll JSONB,
        buttons JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS variations JSONB NOT NULL DEFAULT '[]'::jsonb`).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS delivery_payload JSONB`).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS poll JSONB`).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS buttons JSONB`).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS interval_min_seconds INTEGER NOT NULL DEFAULT 30`).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS interval_max_seconds INTEGER NOT NULL DEFAULT 90`).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`).catch(() => {
    });
    await db.query(`ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`).catch(() => {
    });
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_user_created_at
        ON public.campaigns(user_id, created_at DESC)
    `).catch(() => {
    });
  }, "campaigns_v3");
}
__name(ensureCampaignsTable, "ensureCampaignsTable");
var historyTableCreated = false;
async function ensureContactHistoryTable(db) {
  if (historyTableCreated) return;
  const UUID_GEN = "gen_random_uuid()";
  await runSchemaBestEffort(async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.contact_send_history (
        id UUID PRIMARY KEY DEFAULT ${UUID_GEN},
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        campaign_id UUID,
        campaign_name TEXT,
        contact_name TEXT,
        phone_key TEXT,
        channel TEXT,
        ok BOOLEAN DEFAULT false,
        status INTEGER,
        webhook_ok BOOLEAN DEFAULT false,
        provider_status TEXT,
        error_detail TEXT,
        payload_raw JSONB,
        delivery_summary JSONB,
        run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }, "campaigns-history");
  historyTableCreated = true;
}
__name(ensureContactHistoryTable, "ensureContactHistoryTable");
async function resolveEvolutionConfigForUser(userId, db) {
  const [profileResult, globalSettingsResult] = await Promise.all([
    db.query(
      "SELECT evolution_url, evolution_apikey, evolution_instance FROM public.user_profiles WHERE id = $1 LIMIT 1",
      [userId]
    ),
    db.query(
      "SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM public.app_settings ORDER BY id DESC LIMIT 1"
    )
  ]);
  const profile = profileResult.rows[0] || {};
  const globalSettings = globalSettingsResult.rows[0] || {};
  return {
    evolutionUrl: String(profile.evolution_url || globalSettings.evolution_api_url || "").trim(),
    evolutionApiKey: String(profile.evolution_apikey || globalSettings.evolution_api_key || "").trim(),
    evolutionInstance: String(profile.evolution_instance || globalSettings.evolution_shared_instance || "").trim()
  };
}
__name(resolveEvolutionConfigForUser, "resolveEvolutionConfigForUser");
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
__name(sleep, "sleep");
var campaignRoutes = new Hono2();
campaignRoutes.get("/campaigns", authenticateToken, async (c) => {
  try {
    const userId = getAuthenticatedUserId4(c);
    if (!userId) return c.json({ error: "Acesso negado." }, 401);
    const db = getDb(c.env);
    await ensureCampaignsTable(db);
    const result = await db.query(
      "SELECT * FROM public.campaigns WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return c.json(result.rows);
  } catch (err) {
    console.error("[Campaigns.get] Erro:", err.message);
    return c.json({ error: "Erro ao carregar campanhas.", technical: err.message }, 500);
  }
});
campaignRoutes.post("/campaigns", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId4(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureCampaignsTable(db);
  const body = await c.req.json().catch(() => ({}));
  const name = normalizeText2(body.name);
  const listName = normalizeText2(body.list_name);
  const message2 = normalizeText2(body.message);
  const status = normalizeText2(body.status, "rascunho");
  const channels = parseCampaignChannels(body.channels);
  const normalizedChannels = channels.length > 0 ? channels : ["whatsapp"];
  const variations = Array.isArray(body.variations) ? body.variations : [];
  const deliveryPayload = normalizeDeliveryPayload(body.delivery_payload);
  const intervalMin = Number(body.interval_min_seconds || 30);
  const intervalMax = Number(body.interval_max_seconds || 90);
  if (!name) return c.json({ error: "Nome da campanha \xE9 obrigat\xF3rio." }, 400);
  if (!listName) return c.json({ error: "Lista da campanha \xE9 obrigat\xF3ria." }, 400);
  if (!message2) return c.json({ error: "Mensagem da campanha \xE9 obrigat\xF3ria." }, 400);
  const campaignId = crypto.randomUUID();
  const result = await db.query(
    `INSERT INTO public.campaigns (
      id, user_id, name, status, channels, list_name, message,
      variations, delivery_payload, interval_min_seconds, interval_max_seconds
    ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8::jsonb,$9::jsonb,$10,$11)
    RETURNING *`,
    [
      campaignId,
      userId,
      name,
      status || "rascunho",
      JSON.stringify(normalizedChannels),
      listName,
      message2,
      JSON.stringify(variations),
      deliveryPayload ? JSON.stringify(deliveryPayload) : null,
      Number.isFinite(intervalMin) ? intervalMin : 30,
      Number.isFinite(intervalMax) ? intervalMax : 90
    ]
  );
  return c.json(result.rows[0], 201);
});
campaignRoutes.get("/campaigns/:id", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId4(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const campaignId = c.req.param("id");
  const db = getDb(c.env);
  await ensureCampaignsTable(db);
  const result = await db.query(
    "SELECT id, name, status, list_name, channels, poll, buttons, delivery_payload, interval_min_seconds, interval_max_seconds, created_at FROM public.campaigns WHERE id = $1 AND user_id = $2 LIMIT 1",
    [campaignId, userId]
  );
  const campaign = result.rows[0];
  if (!campaign) return c.json({ error: "Campanha n\xE3o encontrada." }, 404);
  return c.json({
    data: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      listName: campaign.list_name,
      channels: campaign.channels,
      poll: campaign.poll,
      buttons: campaign.buttons
    }
  });
});
campaignRoutes.put("/campaigns/:id", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId4(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const campaignId = c.req.param("id");
  const db = getDb(c.env);
  await ensureCampaignsTable(db);
  const body = await c.req.json().catch(() => ({}));
  const name = normalizeText2(body.name);
  const listName = normalizeText2(body.list_name);
  const message2 = normalizeText2(body.message);
  const status = normalizeText2(body.status, "rascunho");
  const channels = parseCampaignChannels(body.channels);
  const normalizedChannels = channels.length > 0 ? channels : ["whatsapp"];
  const variations = Array.isArray(body.variations) ? body.variations : [];
  const deliveryPayload = normalizeDeliveryPayload(body.delivery_payload);
  const intervalMin = Number(body.interval_min_seconds || 30);
  const intervalMax = Number(body.interval_max_seconds || 90);
  const result = await db.query(
    `UPDATE public.campaigns SET
      name = $1, status = $2, channels = $3::jsonb, list_name = $4, message = $5,
      variations = $6::jsonb, delivery_payload = $7::jsonb,
      interval_min_seconds = $8, interval_max_seconds = $9,
      poll = $10::jsonb, buttons = $11::jsonb,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $12 AND user_id = $13
    RETURNING *`,
    [
      name,
      status || "rascunho",
      JSON.stringify(normalizedChannels),
      listName,
      message2,
      JSON.stringify(variations),
      deliveryPayload ? JSON.stringify(deliveryPayload) : null,
      Number.isFinite(intervalMin) ? intervalMin : 30,
      Number.isFinite(intervalMax) ? intervalMax : 90,
      body.poll ? JSON.stringify(body.poll) : null,
      body.buttons ? JSON.stringify(body.buttons) : null,
      campaignId,
      userId
    ]
  );
  if (result.rows.length === 0) return c.json({ error: "Campanha n\xE3o encontrada ou acesso negado." }, 404);
  return c.json(result.rows[0]);
});
campaignRoutes.delete("/campaigns/:id", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId4(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const campaignId = c.req.param("id");
  const db = getDb(c.env);
  await ensureCampaignsTable(db);
  await db.query("DELETE FROM public.campaigns WHERE id = $1 AND user_id = $2", [campaignId, userId]);
  return c.json({ ok: true });
});
campaignRoutes.delete("/campaigns", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId4(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureCampaignsTable(db);
  await db.query("DELETE FROM public.campaigns WHERE user_id = $1", [userId]);
  return c.json({ ok: true });
});
campaignRoutes.post("/campaigns/:id/send", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId4(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const campaignId = c.req.param("id");
  const db = getDb(c.env);
  await ensureCampaignsTable(db);
  await ensureContactHistoryTable(db);
  const campaignResult = await db.query("SELECT * FROM public.campaigns WHERE id = $1 AND user_id = $2 LIMIT 1", [campaignId, userId]);
  const campaign = campaignResult.rows[0];
  if (!campaign) return c.json({ error: "Campanha n\xE3o encontrada." }, 404);
  const listResult = await db.query(
    "SELECT id, name FROM public.lists WHERE user_id = $1 AND name = $2 LIMIT 1",
    [userId, campaign.list_name]
  );
  const list = listResult.rows[0];
  if (!list) return c.json({ error: "Lista da campanha n\xE3o encontrada." }, 400);
  const contactsResult = await db.query(
    `SELECT id, name, phone, email, category, cep, address, city, rating
       FROM public.contacts
      WHERE user_id = $1
        AND list_id = $2`,
    [userId, list.id]
  );
  const contacts = contactsResult.rows;
  if (!contacts.length) return c.json({ error: "Lista n\xE3o possui contatos para envio." }, 400);
  const channels = parseCampaignChannels(campaign.channels);
  const payloadValidation = validateCampaignDeliveryPayload(campaign.delivery_payload, channels);
  if (payloadValidation.errors.length > 0) {
    return c.json({ error: payloadValidation.errors[0] }, 400);
  }
  const evolution = await resolveEvolutionConfigForUser(userId, db);
  const canWhatsapp = channels.includes("whatsapp") && evolution.evolutionUrl && evolution.evolutionApiKey && evolution.evolutionInstance;
  if (!canWhatsapp) {
    return c.json({
      error: "Nenhum servi\xE7o de envio configurado. Verifique as configura\xE7\xF5es da Evolution API para WhatsApp."
    }, 400);
  }
  if (contacts.length > 120) {
    return c.json({
      error: "Esta campanha possui muitos contatos para envio direto. Use o agendamento em fila."
    }, 400);
  }
  await db.query("UPDATE public.campaigns SET status = $1 WHERE id = $2", ["enviando", campaignId]);
  const baseUrl = new URL(c.req.url).origin;
  const workerEnv = c.env;
  const env2 = { UPLOADS_BUCKET: workerEnv.UPLOADS_BUCKET, db };
  const backgroundTask = (async () => {
    let errors = 0;
    let sent = 0;
    for (let index = 0; index < contacts.length; index += 1) {
      const contact = contacts[index];
      const evolutionNumber = toEvolutionNumber(contact.phone);
      if (!evolutionNumber) {
        const invalidEntry = buildContactSendHistoryEntry({
          userId,
          campaign,
          contact,
          channel: "whatsapp",
          error: new Error("Contato sem telefone v\xE1lido para envio no formato Evolution.")
        });
        await insertContactSendHistory((sql, params) => db.query(sql, params), invalidEntry);
        errors += 1;
        continue;
      }
      try {
        const deliveryResult = await executeWhatsappCampaignDelivery({
          evolutionUrl: evolution.evolutionUrl,
          evolutionApiKey: evolution.evolutionApiKey,
          evolutionInstance: evolution.evolutionInstance,
          campaign,
          contact,
          baseUrl,
          env: env2
        });
        const historyEntry = buildContactSendHistoryEntry({
          userId,
          campaign,
          contact,
          channel: "whatsapp",
          deliveryResult
        });
        await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry);
        if (historyEntry.status !== 200) errors += 1;
        else sent += 1;
      } catch (sendError) {
        const historyEntry = buildContactSendHistoryEntry({
          userId,
          campaign,
          contact,
          channel: "whatsapp",
          error: sendError
        });
        await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry);
        errors += 1;
      }
      if (index < contacts.length - 1) {
        const intervalMin = Math.max(Number(campaign.interval_min_seconds || 3), 2);
        const intervalMax = Math.max(Number(campaign.interval_max_seconds || 5), intervalMin);
        const randomDelay = intervalMin + Math.floor(Math.random() * Math.max(1, intervalMax - intervalMin + 1));
        await sleep(randomDelay * 1e3);
      }
    }
    const finalStatus = errors > 0 ? "enviada_com_erros" : "enviada";
    await db.query("UPDATE public.campaigns SET status = $1 WHERE id = $2", [finalStatus, campaignId]);
    console.log(`[Campaigns] Disparo concluido: ${campaignId} | Enviados: ${sent} | Erros: ${errors}`);
  })();
  c.executionCtx.waitUntil(backgroundTask);
  return c.json({
    ok: true,
    accepted: true,
    campaignId,
    contactsCount: contacts.length,
    estimatedSeconds: contacts.length * 6,
    message: `Disparo iniciado. ${contacts.length} contato(s) ser\xE3o processados em segundo plano.`
  }, 202);
});

// src/routes/extension.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
var extensionRoutes = new Hono2();
extensionRoutes.get("/extension/info", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
    const db = getDb(c.env);
    const listsResult = await db.query(
      "SELECT id, name FROM public.lists WHERE user_id = $1 ORDER BY name ASC",
      [user.id]
    );
    return c.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email || null
      },
      lists: listsResult.rows
    });
  } catch (error) {
    console.error("[ExtensionAPI] Erro em /extension/info:", error);
    return c.json({ error: "Falha interna ao buscar informa\xE7\xF5es do usu\xE1rio." }, 500);
  }
});

// src/routes/schedules.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
init_ddl();
init_messageUtils();
var ACTIVE_SCHEDULE_STATUSES = ["agendado", "preparando", "em_execucao", "pausado"];
var HISTORY_SCHEDULE_STATUSES = ["concluido", "cancelado", "erro"];
function getAuthenticatedUserId5(c) {
  const user = c.get("user");
  return user?.id ?? null;
}
__name(getAuthenticatedUserId5, "getAuthenticatedUserId");
function getSystemTimezone(env2) {
  return String(env2.SYSTEM_TIMEZONE || "America/Sao_Paulo").trim() || "America/Sao_Paulo";
}
__name(getSystemTimezone, "getSystemTimezone");
function getSystemTimezoneLabel(env2) {
  return String(env2.SYSTEM_TIMEZONE_LABEL || "GMT-3 (America/Sao_Paulo)").trim() || "GMT-3 (America/Sao_Paulo)";
}
__name(getSystemTimezoneLabel, "getSystemTimezoneLabel");
function formatInTimezone(date, timezone, options) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour12: false,
    ...options
  });
  return formatter.format(date);
}
__name(formatInTimezone, "formatInTimezone");
function getSystemDateTimeParts(env2) {
  const timezone = getSystemTimezone(env2);
  const now = /* @__PURE__ */ new Date();
  const date = formatInTimezone(now, timezone, { year: "numeric", month: "2-digit", day: "2-digit" });
  const time = formatInTimezone(now, timezone, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return {
    date,
    time,
    timeShort: time.slice(0, 5)
  };
}
__name(getSystemDateTimeParts, "getSystemDateTimeParts");
function parseCampaignChannels2(channels) {
  if (Array.isArray(channels)) return channels.map((item) => String(item).trim().toLowerCase());
  if (typeof channels === "string") {
    try {
      const parsed = JSON.parse(channels);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim().toLowerCase());
    } catch {
      return channels.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [];
}
__name(parseCampaignChannels2, "parseCampaignChannels");
async function isAdminUser2(userId, db) {
  try {
    const result = await db.query(
      `SELECT 1
         FROM public.user_profiles up
         JOIN public.user_groups ug ON ug.id = up.group_id
        WHERE up.id = $1
          AND ug.name = 'Administrador'
        LIMIT 1`,
      [userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    if (isSchemaMissingError(error)) {
      console.warn("[Schedules] Estrutura de permissao administrativa nao encontrada. Assumindo usuario nao-admin.");
      return false;
    }
    throw error;
  }
}
__name(isAdminUser2, "isAdminUser");
async function getServerClock(env2) {
  const timezone = getSystemTimezone(env2);
  const now = /* @__PURE__ */ new Date();
  return {
    server_time: now.toISOString(),
    server_date: formatInTimezone(now, timezone, { year: "numeric", month: "2-digit", day: "2-digit" }),
    server_time_only: formatInTimezone(now, timezone, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timezone: getSystemTimezoneLabel(env2)
  };
}
__name(getServerClock, "getServerClock");
async function resolveEvolutionConfigForUser2(userId, db) {
  const [profileResult, globalSettingsResult] = await Promise.all([
    db.query(
      "SELECT evolution_url, evolution_apikey, evolution_instance FROM public.user_profiles WHERE id = $1 LIMIT 1",
      [userId]
    ),
    db.query(
      "SELECT evolution_api_url, evolution_api_key, evolution_shared_instance FROM public.app_settings ORDER BY id DESC LIMIT 1"
    )
  ]);
  const profile = profileResult.rows[0] || {};
  const globalSettings = globalSettingsResult.rows[0] || {};
  return {
    evolutionUrl: String(profile.evolution_url || globalSettings.evolution_api_url || "").trim(),
    evolutionApiKey: String(profile.evolution_apikey || globalSettings.evolution_api_key || "").trim(),
    evolutionInstance: String(profile.evolution_instance || globalSettings.evolution_shared_instance || "").trim()
  };
}
__name(resolveEvolutionConfigForUser2, "resolveEvolutionConfigForUser");
async function ensureScheduleTables(db) {
  await runBestEffortDdl(db, "schedules.ensureScheduleTables", [
    `
      CREATE TABLE IF NOT EXISTS public.campaign_schedule (
        id SERIAL PRIMARY KEY,
        campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        data_inicio DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        limite_diario INTEGER DEFAULT 300,
        intervalo_minimo INTEGER DEFAULT 30,
        intervalo_maximo INTEGER DEFAULT 90,
        mensagens_por_lote INTEGER DEFAULT 45,
        tempo_pausa_lote INTEGER DEFAULT 15,
        status TEXT DEFAULT 'agendado',
        scheduler_claimed_at TIMESTAMP WITH TIME ZONE,
        pause_reason TEXT,
        pause_details TEXT,
        paused_at TIMESTAMP WITH TIME ZONE,
        resumed_at TIMESTAMP WITH TIME ZONE,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.message_queue (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES public.campaign_schedule(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        contact_id TEXT,
        telefone TEXT NOT NULL,
        nome TEXT,
        mensagem TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        tentativas INTEGER DEFAULT 0,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_envio TIMESTAMP WITH TIME ZONE,
        processing_started_at TIMESTAMP WITH TIME ZONE,
        recovered_at TIMESTAMP WITH TIME ZONE,
        erro TEXT
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.scheduler_logs (
        id SERIAL PRIMARY KEY,
        event TEXT NOT NULL,
        details TEXT,
        data_evento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS scheduler_claimed_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS pause_reason TEXT`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS pause_details TEXT`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.campaign_schedule ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS contact_id TEXT`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS erro TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_mq_user_status ON public.message_queue(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_mq_schedule_status ON public.message_queue(schedule_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_schedule_user_status ON public.campaign_schedule(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduler_logs_event_date ON public.scheduler_logs(event, data_evento DESC)`,
    `ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS last_scheduled_at TIMESTAMP WITH TIME ZONE`
  ]);
}
__name(ensureScheduleTables, "ensureScheduleTables");
async function writeSchedulerLog(db, event, details) {
  await db.query("INSERT INTO public.scheduler_logs (event, details) VALUES ($1, $2)", [
    event,
    JSON.stringify(details)
  ]);
}
__name(writeSchedulerLog, "writeSchedulerLog");
async function setCampaignStatusFromQueue(db, campaignId) {
  const summaryResult = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'pendente')::int AS pendente,
      COUNT(*) FILTER (WHERE status = 'processando')::int AS processando,
      COUNT(*) FILTER (WHERE status = 'enviado')::int AS enviado,
      COUNT(*) FILTER (WHERE status = 'falhou')::int AS falhou
     FROM public.message_queue
     WHERE campaign_id = $1`,
    [campaignId]
  );
  const summary = summaryResult.rows[0] || {};
  const pending = Number(summary.pendente || 0);
  const processing = Number(summary.processando || 0);
  const sent = Number(summary.enviado || 0);
  const failed = Number(summary.falhou || 0);
  let nextStatus = "rascunho";
  if (pending > 0 || processing > 0) nextStatus = "agendada";
  else if (failed > 0) nextStatus = sent > 0 ? "enviada_com_erros" : "rascunho";
  else if (sent > 0) nextStatus = "enviada";
  await db.query("UPDATE public.campaigns SET status = $1 WHERE id = $2", [nextStatus, campaignId]);
}
__name(setCampaignStatusFromQueue, "setCampaignStatusFromQueue");
function renderQueuedMessage(campaignMessage, contact) {
  const resolved = resolveTemplate(String(campaignMessage || ""), contact);
  const parsed = htmlToWhatsapp(resolved);
  return parsed || String(resolved || "").trim();
}
__name(renderQueuedMessage, "renderQueuedMessage");
async function prepareQueueForSchedule(db, schedule) {
  const existing = await db.query("SELECT COUNT(*)::int AS total FROM public.message_queue WHERE schedule_id = $1", [schedule.id]);
  if (Number(existing.rows[0]?.total || 0) > 0) return Number(existing.rows[0]?.total || 0);
  const campaignResult = await db.query(
    "SELECT id, user_id, name, list_name, message, channels, delivery_payload FROM public.campaigns WHERE id = $1 LIMIT 1",
    [schedule.campaign_id]
  );
  const campaign = campaignResult.rows[0];
  if (!campaign) throw new Error("Campanha do agendamento n\xE3o encontrada.");
  const channels = parseCampaignChannels2(campaign.channels);
  if (!channels.includes("whatsapp")) {
    throw new Error("Agendamento exige canal WhatsApp ativo na campanha.");
  }
  const payloadValidation = validateCampaignDeliveryPayload(campaign.delivery_payload, channels);
  if (payloadValidation.errors.length > 0) {
    throw new Error(payloadValidation.errors[0]);
  }
  const listResult = await db.query(
    "SELECT id FROM public.lists WHERE user_id = $1 AND name = $2 LIMIT 1",
    [campaign.user_id, campaign.list_name]
  );
  const list = listResult.rows[0];
  if (!list) throw new Error("Lista vinculada \xE0 campanha n\xE3o foi encontrada.");
  const contactsResult = await db.query(
    `SELECT id, name, phone, email, category, city, rating, address, cep
       FROM public.contacts
      WHERE user_id = $1
        AND list_id = $2
        AND COALESCE(TRIM(phone), '') <> ''
      ORDER BY name ASC`,
    [campaign.user_id, list.id]
  );
  const contacts = contactsResult.rows;
  if (!contacts.length) {
    throw new Error("N\xE3o h\xE1 contatos com telefone v\xE1lido para montar a fila.");
  }
  for (const contact of contacts) {
    const message2 = renderQueuedMessage(campaign.message, contact);
    await db.query(
      `INSERT INTO public.message_queue (
        schedule_id, campaign_id, user_id, contact_id, telefone, nome, mensagem, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pendente')`,
      [
        schedule.id,
        campaign.id,
        campaign.user_id,
        String(contact.id),
        String(contact.phone || ""),
        String(contact.name || ""),
        message2
      ]
    );
  }
  await db.query(
    `UPDATE public.campaigns
        SET status = 'agendada',
            last_scheduled_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [campaign.id]
  );
  return contacts.length;
}
__name(prepareQueueForSchedule, "prepareQueueForSchedule");
async function runScheduler(db, env2) {
  const nowParts = getSystemDateTimeParts(env2);
  await db.query(
    `UPDATE public.campaign_schedule
        SET status = 'agendado',
            scheduler_claimed_at = NULL
      WHERE status = 'preparando'
        AND scheduler_claimed_at IS NOT NULL
        AND scheduler_claimed_at < NOW() - INTERVAL '2 minutes'`
  );
  const dueResult = await db.query(
    `SELECT *
       FROM public.campaign_schedule
      WHERE status = 'agendado'
        AND (
          data_inicio < $1::date
          OR (data_inicio = $1::date AND hora_inicio <= $2::time)
        )
      ORDER BY data_criacao ASC
      LIMIT 20`,
    [nowParts.date, `${nowParts.timeShort}:00`]
  );
  for (const schedule of dueResult.rows) {
    const claimed = await db.query(
      `UPDATE public.campaign_schedule
          SET status = 'preparando',
              scheduler_claimed_at = NOW(),
              pause_reason = NULL,
              pause_details = NULL
        WHERE id = $1
          AND status = 'agendado'
      RETURNING *`,
      [schedule.id]
    );
    if (!claimed.rows[0]) continue;
    try {
      const count = await prepareQueueForSchedule(db, schedule);
      await db.query(
        `UPDATE public.campaign_schedule
            SET status = 'em_execucao',
                scheduler_claimed_at = NULL
          WHERE id = $1`,
        [schedule.id]
      );
      await writeSchedulerLog(db, "schedule_started", {
        schedule_id: schedule.id,
        campaign_id: schedule.campaign_id,
        queued_contacts: count
      });
    } catch (error) {
      const reason = String(error?.message || error || "Erro ao preparar fila");
      await db.query(
        `UPDATE public.campaign_schedule
            SET status = 'erro',
                pause_details = $1,
                scheduler_claimed_at = NULL
          WHERE id = $2`,
        [reason, schedule.id]
      );
      await setCampaignStatusFromQueue(db, schedule.campaign_id);
      await writeSchedulerLog(db, "schedule_error", {
        schedule_id: schedule.id,
        campaign_id: schedule.campaign_id,
        motivo: reason
      });
    }
  }
}
__name(runScheduler, "runScheduler");
async function processQueueItem(db, queueItem) {
  const campaignResult = await db.query("SELECT * FROM public.campaigns WHERE id = $1 LIMIT 1", [queueItem.campaign_id]);
  const campaign = campaignResult.rows[0];
  if (!campaign) throw new Error("Campanha n\xE3o encontrada para item da fila.");
  const contactResult = await db.query(
    "SELECT * FROM public.contacts WHERE id::text = $1 AND user_id = $2 LIMIT 1",
    [String(queueItem.contact_id || ""), queueItem.user_id]
  );
  const contact = contactResult.rows[0] || {
    id: queueItem.contact_id,
    name: queueItem.nome || "Contato",
    phone: queueItem.telefone || "",
    email: "",
    category: "",
    city: "",
    rating: "",
    address: "",
    cep: ""
  };
  const evolution = await resolveEvolutionConfigForUser2(queueItem.user_id, db);
  if (!evolution.evolutionUrl || !evolution.evolutionApiKey || !evolution.evolutionInstance) {
    throw new Error("Evolution API n\xE3o configurada para este usu\xE1rio.");
  }
  const deliveryResult = await executeWhatsappCampaignDelivery({
    evolutionUrl: evolution.evolutionUrl,
    evolutionApiKey: evolution.evolutionApiKey,
    evolutionInstance: evolution.evolutionInstance,
    campaign,
    contact,
    messageOverride: queueItem.mensagem
  });
  const historyEntry = buildContactSendHistoryEntry({
    userId: queueItem.user_id,
    campaign,
    contact,
    channel: "whatsapp",
    deliveryResult
  });
  await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry);
  const queueStatus = historyEntry.ok ? "enviado" : "falhou";
  await db.query(
    `UPDATE public.message_queue
        SET status = $1,
            data_envio = NOW(),
            erro = $2
      WHERE id = $3`,
    [queueStatus, historyEntry.errorDetail, queueItem.id]
  );
  await writeSchedulerLog(db, queueStatus === "enviado" ? "queue_sent" : "queue_failed", {
    schedule_id: queueItem.schedule_id,
    campaign_id: queueItem.campaign_id,
    message_id: queueItem.id,
    error: historyEntry.errorDetail
  });
}
__name(processQueueItem, "processQueueItem");
async function runWorker(db) {
  const claimed = await db.query(
    `UPDATE public.message_queue
        SET status = 'processando',
            processing_started_at = NOW(),
            tentativas = COALESCE(tentativas, 0) + 1
      WHERE id IN (
        SELECT mq.id
        FROM public.message_queue mq
        JOIN public.campaign_schedule cs ON cs.id = mq.schedule_id
        WHERE mq.status = 'pendente'
          AND cs.status IN ('preparando', 'em_execucao')
        ORDER BY mq.data_criacao ASC
        LIMIT 8
      )
    RETURNING *`
  );
  for (const queueItem of claimed.rows) {
    try {
      await processQueueItem(db, queueItem);
    } catch (error) {
      const reason = String(error?.message || error || "Erro ao enviar item da fila");
      await db.query(
        `UPDATE public.message_queue
            SET status = 'falhou',
                data_envio = NOW(),
                erro = $1
          WHERE id = $2`,
        [reason, queueItem.id]
      );
      const campaignResult = await db.query("SELECT * FROM public.campaigns WHERE id = $1 LIMIT 1", [queueItem.campaign_id]);
      const campaign = campaignResult.rows[0] || { id: queueItem.campaign_id, name: "Campanha" };
      const contact = {
        id: queueItem.contact_id,
        name: queueItem.nome || "Contato",
        phone: queueItem.telefone || ""
      };
      const historyEntry = buildContactSendHistoryEntry({
        userId: queueItem.user_id,
        campaign,
        contact,
        channel: "whatsapp",
        error: new Error(reason)
      });
      await insertContactSendHistory((sql, params) => db.query(sql, params), historyEntry);
      await writeSchedulerLog(db, "queue_failed", {
        schedule_id: queueItem.schedule_id,
        campaign_id: queueItem.campaign_id,
        message_id: queueItem.id,
        error: reason
      });
    }
  }
}
__name(runWorker, "runWorker");
async function runCleanup(db) {
  const stale = await db.query(
    `UPDATE public.message_queue
        SET status = 'falhou',
            data_envio = NOW(),
            erro = COALESCE(erro, 'Timeout de processamento no worker')
      WHERE status = 'processando'
        AND processing_started_at IS NOT NULL
        AND processing_started_at < NOW() - INTERVAL '10 minutes'
    RETURNING id, schedule_id, campaign_id, erro`
  );
  for (const row of stale.rows) {
    await writeSchedulerLog(db, "zombie_failed", {
      schedule_id: row.schedule_id,
      campaign_id: row.campaign_id,
      message_id: row.id,
      motivo: row.erro
    });
  }
}
__name(runCleanup, "runCleanup");
async function finalizeSchedules(db) {
  const schedules = await db.query(
    `SELECT id, campaign_id, status
       FROM public.campaign_schedule
      WHERE status IN ('preparando', 'em_execucao', 'agendado')`
  );
  for (const schedule of schedules.rows) {
    const summaryResult = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pendente')::int AS pending_count,
        COUNT(*) FILTER (WHERE status = 'processando')::int AS processing_count,
        COUNT(*) FILTER (WHERE status = 'enviado')::int AS sent_count,
        COUNT(*) FILTER (WHERE status = 'falhou')::int AS failed_count
       FROM public.message_queue
       WHERE schedule_id = $1`,
      [schedule.id]
    );
    const summary = summaryResult.rows[0] || {};
    const pending = Number(summary.pending_count || 0);
    const processing = Number(summary.processing_count || 0);
    const sent = Number(summary.sent_count || 0);
    const failed = Number(summary.failed_count || 0);
    let nextStatus = null;
    if (pending > 0 || processing > 0) nextStatus = "em_execucao";
    else if (sent > 0 && failed === 0) nextStatus = "concluido";
    else if (sent > 0 || failed > 0) nextStatus = "erro";
    if (nextStatus && nextStatus !== schedule.status) {
      await db.query(
        `UPDATE public.campaign_schedule
            SET status = $1,
                scheduler_claimed_at = NULL,
                pause_reason = CASE WHEN $1 IN ('concluido', 'erro') THEN pause_reason ELSE NULL END,
                pause_details = CASE WHEN $1 = 'erro' THEN COALESCE(pause_details, 'Envio conclu\xEDdo com falhas.') ELSE pause_details END
          WHERE id = $2`,
        [nextStatus, schedule.id]
      );
      await writeSchedulerLog(db, "schedule_status_changed", {
        schedule_id: schedule.id,
        campaign_id: schedule.campaign_id,
        next_status: nextStatus
      });
    }
    await setCampaignStatusFromQueue(db, schedule.campaign_id);
  }
}
__name(finalizeSchedules, "finalizeSchedules");
async function runSchedulingCycle(db, env2) {
  await runScheduler(db, env2);
  await runWorker(db);
  await runCleanup(db);
  await finalizeSchedules(db);
}
__name(runSchedulingCycle, "runSchedulingCycle");
async function listSchedulesWithStats(db, statusFilter, userId, admin, limit) {
  const params = [statusFilter];
  let whereClause = "WHERE s.status = ANY($1)";
  if (!admin) {
    params.push(userId);
    whereClause += ` AND s.user_id = $${params.length}`;
  }
  if (typeof limit === "number") {
    params.push(limit);
  }
  const limitClause = typeof limit === "number" ? `LIMIT $${params.length}` : "";
  return db.query(
    `SELECT
        s.*,
        c.name as campaign_name,
        COALESCE(q.pending_count, 0) AS pending_count,
        COALESCE(q.processing_count, 0) AS processing_count,
        COALESCE(q.sent_count, 0) AS sent_count,
        COALESCE(q.failed_count, 0) AS failed_count,
        q.last_error,
        q.last_queue_activity_at,
        NULL::text AS last_event,
        NULL::timestamp with time zone AS last_event_at
     FROM public.campaign_schedule s
     LEFT JOIN public.campaigns c ON s.campaign_id = c.id
     LEFT JOIN (
       SELECT
         mq.schedule_id,
         COUNT(*) FILTER (WHERE mq.status = 'pendente')::int AS pending_count,
         COUNT(*) FILTER (WHERE mq.status = 'processando')::int AS processing_count,
         COUNT(*) FILTER (WHERE mq.status = 'enviado')::int AS sent_count,
         COUNT(*) FILTER (WHERE mq.status = 'falhou')::int AS failed_count,
         MAX(COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao)) AS last_queue_activity_at,
         (ARRAY_REMOVE(ARRAY_AGG(mq.erro ORDER BY COALESCE(mq.data_envio, mq.processing_started_at, mq.data_criacao) DESC), NULL))[1] AS last_error
       FROM public.message_queue mq
       GROUP BY mq.schedule_id
     ) q ON q.schedule_id = s.id
     ${whereClause}
     ORDER BY COALESCE(s.resumed_at, s.paused_at, s.data_criacao) DESC
     ${limitClause}`,
    params
  );
}
__name(listSchedulesWithStats, "listSchedulesWithStats");
var scheduleRoutes = new Hono2();
scheduleRoutes.post("/campaigns/:id/schedule", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId5(c);
  if (!userId) return c.json({ error: "Acesso negado." }, 401);
  const campaignId = c.req.param("id");
  const db = getDb(c.env);
  await ensureScheduleTables(db);
  const body = await c.req.json().catch(() => ({}));
  const nowParts = getSystemDateTimeParts(c.env);
  const campaignResult = await db.query(
    "SELECT id, user_id, name, list_name, channels, delivery_payload FROM public.campaigns WHERE id = $1 LIMIT 1",
    [campaignId]
  );
  const campaign = campaignResult.rows[0];
  if (!campaign || campaign.user_id !== userId) {
    return c.json({ error: "Campanha n\xE3o encontrada para este usu\xE1rio." }, 404);
  }
  const channels = parseCampaignChannels2(campaign.channels);
  if (!channels.includes("whatsapp")) {
    return c.json({ error: "O agendamento profissional exige o canal WhatsApp ativo nesta campanha." }, 400);
  }
  const payloadValidation = validateCampaignDeliveryPayload(campaign.delivery_payload, channels);
  if (payloadValidation.errors.length > 0) {
    return c.json({ error: payloadValidation.errors[0] }, 400);
  }
  const evolution = await resolveEvolutionConfigForUser2(userId, db);
  if (!evolution.evolutionUrl || !evolution.evolutionApiKey || !evolution.evolutionInstance) {
    return c.json({
      error: "A Evolution API n\xE3o est\xE1 configurada para este usu\xE1rio. Ajuste em Meu perfil ou em Configura\xE7\xF5es globais antes de agendar."
    }, 400);
  }
  const listResult = await db.query(
    "SELECT id FROM public.lists WHERE user_id = $1 AND name = $2 LIMIT 1",
    [userId, campaign.list_name]
  );
  const list = listResult.rows[0];
  if (!list) return c.json({ error: "A lista vinculada a esta campanha n\xE3o foi encontrada." }, 400);
  const contactsCheck = await db.query(
    `SELECT COUNT(*)::int AS total
       FROM public.contacts
      WHERE user_id = $1
        AND list_id = $2
        AND COALESCE(TRIM(phone), '') <> ''`,
    [userId, list.id]
  );
  if (!Number(contactsCheck.rows[0]?.total || 0)) {
    return c.json({
      error: "N\xE3o h\xE1 contatos ativos com telefone v\xE1lido na lista desta campanha para agendar o envio."
    }, 400);
  }
  const dataInicio = String(body.data_inicio || nowParts.date).slice(0, 10);
  const horaInicio = String(body.hora_inicio || nowParts.timeShort).slice(0, 5);
  const parsedDateTime = /* @__PURE__ */ new Date(`${dataInicio}T${horaInicio}:00`);
  if (Number.isNaN(parsedDateTime.getTime())) {
    return c.json({ error: "Data ou hora de in\xEDcio inv\xE1lida." }, 400);
  }
  const intervaloMinimo = Number(body.intervalo_minimo ?? 30);
  const intervaloMaximo = Number(body.intervalo_maximo ?? 90);
  const mensagensPorLote = Number(body.mensagens_por_lote ?? 45);
  const tempoPausaLote = Number(body.tempo_pausa_lote ?? 15);
  const limiteDiario = Number(body.limite_diario ?? 300);
  if (intervaloMinimo <= 0 || intervaloMaximo <= 0) {
    return c.json({ error: "Os intervalos m\xEDnimo e m\xE1ximo devem ser maiores que zero." }, 400);
  }
  if (intervaloMinimo > intervaloMaximo) {
    return c.json({ error: "O intervalo m\xEDnimo n\xE3o pode ser maior que o m\xE1ximo." }, 400);
  }
  if (mensagensPorLote <= 0 || tempoPausaLote < 0 || limiteDiario <= 0) {
    return c.json({ error: "Revise lote, pausa e limite di\xE1rio antes de agendar." }, 400);
  }
  await db.query(
    `UPDATE public.campaign_schedule
        SET status = 'cancelado',
            pause_reason = 'manual_cancel',
            pause_details = 'Agendamento substitu\xEDdo por um novo agendamento.',
            paused_at = COALESCE(paused_at, NOW())
      WHERE campaign_id = $1
        AND status = ANY($2)`,
    [campaignId, ACTIVE_SCHEDULE_STATUSES]
  );
  await db.query("DELETE FROM public.message_queue WHERE campaign_id = $1 AND status = $2", [campaignId, "pendente"]);
  const inserted = await db.query(
    `INSERT INTO public.campaign_schedule (
      campaign_id, user_id, data_inicio, hora_inicio, limite_diario,
      intervalo_minimo, intervalo_maximo, mensagens_por_lote, tempo_pausa_lote
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      campaignId,
      userId,
      dataInicio,
      `${horaInicio}:00`,
      limiteDiario,
      intervaloMinimo,
      intervaloMaximo,
      mensagensPorLote,
      tempoPausaLote
    ]
  );
  await db.query(
    `UPDATE public.campaigns
        SET status = 'agendada',
            last_scheduled_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
    [campaignId]
  );
  await writeSchedulerLog(db, "schedule_created", {
    schedule_id: inserted.rows[0]?.id,
    campaign_id: campaignId,
    user_id: userId
  });
  return c.json(inserted.rows[0], 201);
});
scheduleRoutes.delete("/campaigns/:id/schedule", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId5(c);
  if (!userId) return c.json({ success: false, error: "Acesso negado." }, 401);
  const campaignId = c.req.param("id");
  const db = getDb(c.env);
  await ensureScheduleTables(db);
  const campaignResult = await db.query("SELECT id, user_id FROM public.campaigns WHERE id = $1 LIMIT 1", [campaignId]);
  const campaign = campaignResult.rows[0];
  if (!campaign || campaign.user_id !== userId) {
    return c.json({ success: false, error: "Campanha n\xE3o encontrada para este usu\xE1rio." }, 404);
  }
  await db.query("DELETE FROM public.message_queue WHERE campaign_id = $1 AND status = $2", [campaignId, "pendente"]);
  await db.query(
    `UPDATE public.message_queue
        SET status = 'falhou',
            erro = 'Envio cancelado pelo usu\xE1rio antes da conclus\xE3o.',
            processing_started_at = NULL,
            data_envio = NOW()
      WHERE campaign_id = $1
        AND status = 'processando'`,
    [campaignId]
  );
  await db.query(
    `UPDATE public.campaign_schedule
        SET status = 'cancelado',
            pause_reason = 'manual_cancel',
            pause_details = 'Agendamento cancelado manualmente pelo usu\xE1rio.',
            paused_at = COALESCE(paused_at, NOW())
      WHERE campaign_id = $1
        AND status = ANY($2)`,
    [campaignId, ACTIVE_SCHEDULE_STATUSES]
  );
  await setCampaignStatusFromQueue(db, campaignId);
  await writeSchedulerLog(db, "schedule_cancelled", {
    campaign_id: campaignId,
    user_id: userId
  });
  return c.json({ success: true });
});
scheduleRoutes.get("/schedules/professional", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId5(c);
  if (!userId) return c.json({ success: false, error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureScheduleTables(db);
  try {
    await runSchedulingCycle(db, c.env);
  } catch (error) {
    console.error("[CloudflareSchedules] ciclo autom\xE1tico falhou:", error);
  }
  const admin = await isAdminUser2(userId, db);
  const result = await listSchedulesWithStats(db, ACTIVE_SCHEDULE_STATUSES, userId, admin);
  const server = await getServerClock(c.env);
  return c.json({ success: true, data: result.rows, server });
});
scheduleRoutes.post("/schedules/professional/refresh", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId5(c);
  if (!userId) return c.json({ success: false, error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureScheduleTables(db);
  await runSchedulingCycle(db, c.env);
  const server = await getServerClock(c.env);
  return c.json({ success: true, server });
});
scheduleRoutes.get("/schedules/history", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId5(c);
  if (!userId) return c.json({ success: false, error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureScheduleTables(db);
  const requestedStatus = String(c.req.query("status") || "all").trim().toLowerCase();
  const filteredStatuses = requestedStatus === "all" ? HISTORY_SCHEDULE_STATUSES : HISTORY_SCHEDULE_STATUSES.filter((status) => status === requestedStatus);
  if (filteredStatuses.length === 0) {
    return c.json({ success: false, error: "Filtro de hist\xF3rico inv\xE1lido." }, 400);
  }
  const admin = await isAdminUser2(userId, db);
  const result = await listSchedulesWithStats(db, filteredStatuses, userId, admin, 100);
  const server = await getServerClock(c.env);
  return c.json({ success: true, data: result.rows, server });
});
scheduleRoutes.get("/queue/professional", authenticateToken, async (c) => {
  const userId = getAuthenticatedUserId5(c);
  if (!userId) return c.json({ success: false, error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureScheduleTables(db);
  const admin = await isAdminUser2(userId, db);
  const params = [];
  let whereClause = "";
  if (!admin) {
    params.push(userId);
    whereClause = `WHERE q.user_id = $${params.length}`;
  }
  const queueResult = await db.query(
    `SELECT
        q.id,
        q.schedule_id,
        q.campaign_id,
        q.user_id,
        q.contact_id,
        q.telefone,
        q.nome,
        q.status,
        q.tentativas,
        q.data_criacao,
        q.data_envio,
        q.processing_started_at,
        q.recovered_at,
        q.erro,
        c.name as campaign_name
       FROM public.message_queue q
       LEFT JOIN public.campaigns c ON q.campaign_id = c.id
       ${whereClause}
       ORDER BY q.id DESC
       LIMIT 100`,
    params
  );
  const server = await getServerClock(c.env);
  return c.json({ success: true, data: queueResult.rows, server });
});

// src/routes/ai.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
async function callGeminiWithKey(apiKey, model, apiVersion, body) {
  const baseUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify(body)
  });
  const raw2 = await res.text();
  let data;
  try {
    data = JSON.parse(raw2);
  } catch {
    data = { error: raw2 };
  }
  return { response: res, data };
}
__name(callGeminiWithKey, "callGeminiWithKey");
function safeString(value) {
  return String(value || "").trim();
}
__name(safeString, "safeString");
async function ensureGeminiTables(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      api_key TEXT NOT NULL,
      status TEXT DEFAULT 'ativa',
      ultimo_uso TIMESTAMP WITH TIME ZONE,
      requests_count INTEGER DEFAULT 0,
      data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      observacoes TEXT
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.gemini_api_usage_logs (
      id SERIAL PRIMARY KEY,
      key_id INTEGER,
      user_id UUID,
      module TEXT,
      resultado TEXT,
      erro TEXT,
      source TEXT DEFAULT 'global-pool',
      key_label TEXT,
      data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
__name(ensureGeminiTables, "ensureGeminiTables");
async function logGeminiUsage(db, {
  keyId = null,
  userId = null,
  module = null,
  resultText = "",
  error = null,
  source = "global-pool",
  keyLabel = null
}) {
  await db.query(
    "INSERT INTO public.gemini_api_usage_logs (key_id, user_id, module, resultado, erro, source, key_label) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [
      keyId,
      userId,
      module,
      String(resultText || "").slice(0, 100),
      error ? String(error) : null,
      source,
      keyLabel
    ]
  );
}
__name(logGeminiUsage, "logGeminiUsage");
async function incrementPoolKeyUsage(db, keyId, module, resultText, error, userId, source, keyLabel) {
  await db.query("UPDATE public.gemini_api_keys SET requests_count = requests_count + 1, ultimo_uso = NOW() WHERE id = $1", [keyId]);
  const keyCheck = await db.query("SELECT requests_count FROM public.gemini_api_keys WHERE id = $1", [keyId]);
  if (Number(keyCheck.rows[0]?.requests_count || 0) >= 20) {
    await db.query("UPDATE public.gemini_api_keys SET status = $1 WHERE id = $2", ["limite_atingido", keyId]);
  }
  await logGeminiUsage(db, { keyId, userId, module, resultText, error, source, keyLabel: keyLabel || null });
}
__name(incrementPoolKeyUsage, "incrementPoolKeyUsage");
async function resolveGeminiAccessForUser(userId, db, env2) {
  const [profileResult, settingsResult] = await Promise.all([
    db.query("SELECT use_global_ai, ai_api_key FROM public.user_profiles WHERE id = $1 LIMIT 1", [userId]),
    db.query("SELECT global_ai_api_key FROM public.app_settings ORDER BY id DESC LIMIT 1")
  ]);
  const profile = profileResult.rows[0] || {};
  const settings = settingsResult.rows[0] || {};
  const useGlobalAi = profile.use_global_ai ?? true;
  const userAiKey = safeString(profile.ai_api_key);
  const globalAiKey = safeString(settings.global_ai_api_key);
  if (!useGlobalAi && userAiKey) {
    return { apiKey: userAiKey, source: "user-profile", keyData: null };
  }
  const pooled = await db.query(
    `SELECT *
       FROM public.gemini_api_keys
      WHERE status = 'ativa'
        AND requests_count < 20
      ORDER BY requests_count ASC, ultimo_uso ASC
      LIMIT 1`
  );
  if (pooled.rows[0]?.api_key) {
    return { apiKey: pooled.rows[0].api_key, source: "global-pool", keyData: pooled.rows[0] };
  }
  if (useGlobalAi && globalAiKey) {
    return { apiKey: globalAiKey, source: "legacy-global-settings", keyData: null };
  }
  const envKey = safeString(env2.GEMINI_API_KEY);
  if (envKey) {
    return { apiKey: envKey, source: "environment", keyData: null };
  }
  return { apiKey: null, source: "none", keyData: null };
}
__name(resolveGeminiAccessForUser, "resolveGeminiAccessForUser");
function normalizeGeminiModel(model) {
  const requested = safeString(model);
  if (!requested) return "gemini-2.5-flash";
  const legacyMap = {
    "gemini-1.5-flash-latest": "gemini-2.5-flash",
    "gemini-1.5-pro-latest": "gemini-2.5-pro",
    "gemini-1.0-pro": "gemini-2.5-flash",
    "gemini-2.0-flash": "gemini-2.5-flash",
    "gemini-2.0-flash-001": "gemini-2.5-flash",
    "gemini-2.0-flash-lite": "gemini-2.5-flash-lite"
  };
  return legacyMap[requested] || requested;
}
__name(normalizeGeminiModel, "normalizeGeminiModel");
function resolveGeminiApiVersion(model, requestedVersion) {
  const normalizedRequested = requestedVersion === "v1beta" ? "v1beta" : "v1";
  if (/^gemini-2\.5-/i.test(model)) {
    return "v1beta";
  }
  return normalizedRequested;
}
__name(resolveGeminiApiVersion, "resolveGeminiApiVersion");
function parseExtractedContactText(raw2) {
  const cleaned = raw2.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match2 = cleaned.match(/\{[\s\S]*\}/);
    if (!match2) return null;
    try {
      return JSON.parse(match2[0]);
    } catch {
      return null;
    }
  }
}
__name(parseExtractedContactText, "parseExtractedContactText");
var aiRoutes = new Hono2();
aiRoutes.post("/ai/proxy", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureGeminiTables(db);
  const body = await c.req.json().catch(() => ({}));
  const access = await resolveGeminiAccessForUser(user.id, db, c.env);
  if (!access.apiKey) {
    return c.json({
      error: "Nenhuma chave Gemini dispon\xEDvel para este usu\xE1rio. Configure uma chave global, uma chave pessoal no perfil ou uma chave ativa no painel administrativo."
    }, 503);
  }
  const model = normalizeGeminiModel(body.model);
  const apiVersion = resolveGeminiApiVersion(model, body.apiVersion);
  const prompt = safeString(body.prompt);
  const systemInstruction = safeString(body.systemInstruction);
  const temperature = Number(body.temperature ?? 0.7);
  const maxTokens = Number(body.maxTokens ?? 2048);
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: Number.isFinite(temperature) ? temperature : 0.7,
      maxOutputTokens: Number.isFinite(maxTokens) ? maxTokens : 2048
    }
  };
  if (systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  const { response: aiRes, data } = await callGeminiWithKey(access.apiKey, model, apiVersion, requestBody);
  if (access.keyData?.id) {
    await incrementPoolKeyUsage(
      db,
      Number(access.keyData.id),
      "proxy",
      "AI Response",
      aiRes.ok ? null : data,
      user.id,
      access.source,
      access.keyData.nome || null
    );
  } else {
    const sourceLabel = access.source === "legacy-global-settings" ? "legacy_global_ai_api_key" : access.source === "user-profile" ? "user_ai_api_key" : access.source === "environment" ? "env_gemini_api_key" : null;
    await logGeminiUsage(db, {
      userId: user.id,
      module: "proxy",
      resultText: "AI Response",
      error: aiRes.ok ? null : data,
      source: access.source,
      keyLabel: sourceLabel
    });
  }
  if (!aiRes.ok) {
    return c.json(data, aiRes.status);
  }
  return c.json(data);
});
aiRoutes.post("/ai/address-from-cep", authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const cep = safeString(body.cep).replace(/\D/g, "");
  if (cep.length !== 8) {
    return c.json({ error: "CEP inv\xE1lido. Use formato 00000000 ou 00000-000." }, 400);
  }
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    return c.json({ error: "Falha ao consultar ViaCEP." }, 500);
  }
  if (data.erro) {
    return c.json({ error: "CEP n\xE3o encontrado no ViaCEP.", cep }, 404);
  }
  const logradouro = safeString(data.logradouro);
  const bairro = safeString(data.bairro);
  const address = [logradouro, bairro].filter(Boolean).join(" - ");
  return c.json({
    ok: true,
    cep,
    address,
    city: safeString(data.localidade),
    state: safeString(data.uf)
  });
});
aiRoutes.post("/ai/extract-contact", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ ok: false, error: "Acesso negado." }, 401);
  const body = await c.req.json().catch(() => ({}));
  const imageBase64 = safeString(body.imageBase64);
  const providedApiKey = safeString(body.geminiApiKey);
  if (!imageBase64) return c.json({ ok: false, error: "imageBase64 \xE9 obrigat\xF3rio." }, 400);
  const apiKey = providedApiKey || safeString(c.env.GEMINI_API_KEY);
  if (!apiKey) return c.json({ ok: false, error: "geminiApiKey \xE9 obrigat\xF3rio." }, 400);
  const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  const mimeType = imageBase64.includes("data:image/png") ? "image/png" : "image/jpeg";
  const prompt = `
Extraia os dados de contato da imagem e retorne SOMENTE JSON v\xE1lido no formato:
{
  "name": "",
  "phone": "",
  "email": "",
  "category": "",
  "address": "",
  "city": ""
}
Se algum campo n\xE3o existir, retorne string vazia.
`.trim();
  const { response: aiRes, data } = await callGeminiWithKey(apiKey, "gemini-2.5-flash", "v1beta", {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 600
    }
  });
  if (!aiRes.ok) return c.json({ ok: false, error: data }, aiRes.status);
  const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || "");
  const extracted = parseExtractedContactText(text);
  if (!extracted || typeof extracted !== "object") {
    return c.json({ ok: false, error: "N\xE3o foi poss\xEDvel extrair os dados da imagem." }, 422);
  }
  return c.json({
    ok: true,
    contact: {
      name: safeString(extracted.name),
      phone: safeString(extracted.phone),
      email: safeString(extracted.email),
      category: safeString(extracted.category),
      address: safeString(extracted.address),
      city: safeString(extracted.city)
    }
  });
});

// src/routes/adminOps.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
init_ddl();
async function ensureAdminOpsTables(db) {
  await runBestEffortDdl(db, "adminOps.ensureAdminOpsTables", [
    `
      CREATE TABLE IF NOT EXISTS public.campaign_schedule (
        id SERIAL PRIMARY KEY,
        campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        data_inicio DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        limite_diario INTEGER DEFAULT 300,
        intervalo_minimo INTEGER DEFAULT 30,
        intervalo_maximo INTEGER DEFAULT 90,
        mensagens_por_lote INTEGER DEFAULT 45,
        tempo_pausa_lote INTEGER DEFAULT 15,
        status TEXT DEFAULT 'agendado',
        scheduler_claimed_at TIMESTAMP WITH TIME ZONE,
        pause_reason TEXT,
        pause_details TEXT,
        paused_at TIMESTAMP WITH TIME ZONE,
        resumed_at TIMESTAMP WITH TIME ZONE,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.message_queue (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER REFERENCES public.campaign_schedule(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        contact_id TEXT,
        telefone TEXT NOT NULL,
        nome TEXT,
        mensagem TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        tentativas INTEGER DEFAULT 0,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_envio TIMESTAMP WITH TIME ZONE,
        processing_started_at TIMESTAMP WITH TIME ZONE,
        recovered_at TIMESTAMP WITH TIME ZONE,
        erro TEXT
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        api_key TEXT NOT NULL,
        status TEXT DEFAULT 'ativa',
        ultimo_uso TIMESTAMP WITH TIME ZONE,
        requests_count INTEGER DEFAULT 0,
        data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        observacoes TEXT
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.gemini_api_usage_logs (
        id SERIAL PRIMARY KEY,
        key_id INTEGER,
        user_id UUID,
        module TEXT,
        resultado TEXT,
        erro TEXT,
        source TEXT DEFAULT 'global-pool',
        key_label TEXT,
        data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE public.message_queue ADD COLUMN IF NOT EXISTS erro TEXT`,
    `ALTER TABLE public.gemini_api_usage_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'global-pool'`,
    `ALTER TABLE public.gemini_api_usage_logs ADD COLUMN IF NOT EXISTS key_label TEXT`
  ]);
}
__name(ensureAdminOpsTables, "ensureAdminOpsTables");
var adminOpsRoutes = new Hono2();
adminOpsRoutes.get("/admin/gemini-keys", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminOpsTables(db);
  const result = await db.query(
    `SELECT id, nome, status, ultimo_uso, requests_count, data_cadastro, observacoes
       FROM public.gemini_api_keys
      ORDER BY data_cadastro DESC`
  );
  return c.json({ success: true, data: result.rows });
});
adminOpsRoutes.post("/admin/gemini-keys", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminOpsTables(db);
  const body = await c.req.json().catch(() => ({}));
  const nome = String(body.nome || "").trim();
  const apiKey = String(body.api_key || "").trim();
  const status = String(body.status || "ativa").trim() || "ativa";
  const observacoes = body.observacoes == null ? null : String(body.observacoes);
  if (!nome || !apiKey) {
    return c.json({ success: false, error: "Nome e chave de API s\xE3o obrigat\xF3rios" }, 400);
  }
  const result = await db.query(
    `INSERT INTO public.gemini_api_keys (nome, api_key, status, observacoes)
     VALUES ($1,$2,$3,$4)
     RETURNING id, nome, status, ultimo_uso, requests_count, data_cadastro, observacoes`,
    [nome, apiKey, status, observacoes]
  );
  return c.json({ success: true, data: result.rows[0] }, 201);
});
adminOpsRoutes.delete("/admin/gemini-keys/:id", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminOpsTables(db);
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ success: false, error: "ID inv\xE1lido." }, 400);
  await db.query("DELETE FROM public.gemini_api_keys WHERE id = $1", [id]);
  return c.json({ success: true });
});
adminOpsRoutes.post("/admin/gemini-keys/reset", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminOpsTables(db);
  await db.query("UPDATE public.gemini_api_keys SET requests_count = 0, status = CASE WHEN status = 'limite_atingido' THEN 'ativa' ELSE status END");
  return c.json({ success: true });
});
adminOpsRoutes.get("/admin/operational-stats", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminOpsTables(db);
  const [sentToday, sentLastHour, pendingQueue, failedToday, runningSchedules, activeKeys, aiUsage] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS total FROM public.message_queue WHERE status = 'enviado' AND data_envio >= CURRENT_DATE"),
    db.query("SELECT COUNT(*)::int AS total FROM public.message_queue WHERE status = 'enviado' AND data_envio >= (NOW() - INTERVAL '1 hour')"),
    db.query("SELECT COUNT(*)::int AS total FROM public.message_queue WHERE status = 'pendente'"),
    db.query("SELECT COUNT(*)::int AS total FROM public.message_queue WHERE status = 'falhou' AND data_criacao >= CURRENT_DATE"),
    db.query("SELECT COUNT(*)::int AS total FROM public.campaign_schedule WHERE status = 'em_execucao'"),
    db.query("SELECT COUNT(*)::int AS total FROM public.gemini_api_keys WHERE status = 'ativa'"),
    db.query(
      `SELECT
         COUNT(*)::int AS requests_today,
         COUNT(*) FILTER (WHERE source IN ('admin-pool', 'global-pool'))::int AS global_pool_requests_today,
         COUNT(*) FILTER (WHERE source = 'legacy-global-settings')::int AS legacy_global_requests_today,
         COUNT(*) FILTER (WHERE source = 'user-profile')::int AS user_requests_today,
         COUNT(*) FILTER (WHERE source = 'environment')::int AS environment_requests_today
       FROM public.gemini_api_usage_logs
       WHERE data_solicitacao >= CURRENT_DATE`
    )
  ]);
  const usageRow = aiUsage.rows[0] || {};
  return c.json({
    enviadas_hoje: Number(sentToday.rows[0]?.total || 0),
    enviadas_ultima_hora: Number(sentLastHour.rows[0]?.total || 0),
    fila_pendente: Number(pendingQueue.rows[0]?.total || 0),
    falhas_hoje: Number(failedToday.rows[0]?.total || 0),
    campanhas_em_execucao: Number(runningSchedules.rows[0]?.total || 0),
    ai: {
      activeKeys: Number(activeKeys.rows[0]?.total || 0),
      requestsToday: Number(usageRow.requests_today || 0),
      poolRequestsToday: Number(usageRow.global_pool_requests_today || 0),
      globalRequestsToday: Number(usageRow.global_pool_requests_today || 0),
      legacyGlobalRequestsToday: Number(usageRow.legacy_global_requests_today || 0),
      userRequestsToday: Number(usageRow.user_requests_today || 0),
      environmentRequestsToday: Number(usageRow.environment_requests_today || 0)
    }
  });
});
adminOpsRoutes.get("/admin/queue", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminOpsTables(db);
  const result = await db.query(
    `SELECT
        q.id,
        q.schedule_id,
        q.campaign_id,
        q.user_id,
        q.contact_id,
        q.telefone,
        q.nome,
        q.status,
        q.tentativas,
        q.data_criacao,
        q.data_envio,
        q.processing_started_at,
        q.recovered_at,
        q.erro,
        c.name as campaign_name
       FROM public.message_queue q
       LEFT JOIN public.campaigns c ON q.campaign_id = c.id
      ORDER BY q.id DESC
      LIMIT 100`
  );
  return c.json({ success: true, data: result.rows });
});
adminOpsRoutes.post("/admin/cleanup-legacy-files", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  const result = await db.query(
    `UPDATE public.user_uploaded_files
        SET deleted_at = CURRENT_TIMESTAMP
      WHERE deleted_at IS NULL
        AND storage_path LIKE '/app/storage/%'
    RETURNING id, user_id, original_name, storage_path`
  );
  const cleaned = result.rows || [];
  return c.json({
    success: true,
    message: `${cleaned.length} arquivo(s) legado(s) removidos.`,
    cleaned: cleaned.map((r) => ({
      id: r.id,
      originalName: r.original_name,
      storagePath: r.storage_path
    }))
  });
});

// src/routes/adminUsers.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
init_ddl();
init_messageUtils();
var DEFAULT_GROUPS = ["Administrador", "Gerente", "Operador", "Visualizador"];
var DEFAULT_PERMISSIONS = [
  { code: "dashboard.view", name: "Dashboard", description: "Visualizar dashboard" },
  { code: "contacts.view", name: "Contatos", description: "Visualizar contatos" },
  { code: "contacts.create", name: "Contatos (Criar)", description: "Criar contatos" },
  { code: "contacts.edit", name: "Contatos (Editar)", description: "Editar contatos e listas" },
  { code: "contacts.delete", name: "Contatos (Excluir)", description: "Excluir contatos" },
  { code: "contacts.import", name: "Contatos (Importar)", description: "Importar contatos via CSV" },
  { code: "contacts.export", name: "Contatos (Exportar)", description: "Exportar contatos" },
  { code: "campaigns.view", name: "Campanhas", description: "Visualizar campanhas" },
  { code: "campaigns.create", name: "Campanhas (Criar)", description: "Criar campanhas" },
  { code: "campaigns.edit", name: "Campanhas (Editar)", description: "Editar campanhas" },
  { code: "campaigns.delete", name: "Campanhas (Excluir)", description: "Excluir campanhas" },
  { code: "campaigns.send", name: "Campanhas (Enviar)", description: "Enviar campanhas" },
  { code: "settings.view", name: "Configuracoes", description: "Visualizar configuracoes" },
  { code: "settings.edit", name: "Configuracoes (Editar)", description: "Editar configuracoes" },
  { code: "admin.users", name: "Admin (Usuarios)", description: "Gerenciar usuarios" },
  { code: "admin.groups", name: "Admin (Grupos)", description: "Gerenciar grupos e permissoes" },
  { code: "admin.audit", name: "Admin (Auditoria)", description: "Auditoria e seguranca" },
  { code: "backup.export", name: "Backup (Exportar)", description: "Exportar backup" },
  { code: "backup.import", name: "Backup (Importar)", description: "Importar backup" }
];
var ROLE_PERMISSION_MATRIX = {
  Administrador: DEFAULT_PERMISSIONS.map((item) => item.code),
  Gerente: [
    "dashboard.view",
    "contacts.view",
    "contacts.create",
    "contacts.edit",
    "contacts.import",
    "contacts.export",
    "campaigns.view",
    "campaigns.create",
    "campaigns.edit",
    "campaigns.send",
    "settings.view",
    "settings.edit"
  ],
  Operador: [
    "dashboard.view",
    "contacts.view",
    "contacts.create",
    "contacts.edit",
    "contacts.import",
    "campaigns.view",
    "campaigns.create",
    "campaigns.edit",
    "campaigns.send",
    "settings.view"
  ],
  Visualizador: [
    "dashboard.view",
    "contacts.view",
    "campaigns.view",
    "settings.view"
  ]
};
async function ensureAdminUsersTables(db) {
  await runBestEffortDdl(db, "adminUsers.ensureAdminUsersTables", [
    `
      CREATE TABLE IF NOT EXISTS public.user_groups (
        id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)::uuid),
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.permissions (
        id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)::uuid),
        code TEXT UNIQUE NOT NULL,
        name TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.group_permissions (
        group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (group_id, permission_id)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        display_name TEXT,
        phone TEXT,
        group_id UUID REFERENCES public.user_groups(id) ON DELETE SET NULL,
        use_global_ai BOOLEAN DEFAULT true,
        ai_api_key TEXT,
        company_info TEXT,
        evolution_url TEXT,
        evolution_apikey TEXT,
        evolution_instance TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        id SERIAL PRIMARY KEY,
        global_ai_api_key TEXT,
        evolution_api_url TEXT,
        evolution_api_key TEXT,
        evolution_shared_instance TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.user_groups(id) ON DELETE SET NULL`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS use_global_ai BOOLEAN DEFAULT true`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ai_api_key TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_info TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_url TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_apikey TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS evolution_instance TEXT`,
    `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS description TEXT`
  ]);
}
__name(ensureAdminUsersTables, "ensureAdminUsersTables");
async function ensureAdminSeeds(db) {
  const groupsCount = await db.query("SELECT COUNT(*)::int AS total FROM public.user_groups");
  if (Number(groupsCount.rows[0]?.total || 0) === 0) {
    for (const groupName of DEFAULT_GROUPS) {
      await db.query("INSERT INTO public.user_groups (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [groupName]);
    }
  }
  const permissionsCount = await db.query("SELECT COUNT(*)::int AS total FROM public.permissions");
  if (Number(permissionsCount.rows[0]?.total || 0) === 0) {
    for (const permission2 of DEFAULT_PERMISSIONS) {
      await db.query(
        `INSERT INTO public.permissions (code, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [permission2.code, permission2.name, permission2.description]
      );
    }
  }
  const groupPermissionCount = await db.query("SELECT COUNT(*)::int AS total FROM public.group_permissions");
  if (Number(groupPermissionCount.rows[0]?.total || 0) > 0) return;
  const [groupRows, permissionRows] = await Promise.all([
    db.query("SELECT id, name FROM public.user_groups"),
    db.query("SELECT id, code FROM public.permissions")
  ]);
  const groupIdByName = /* @__PURE__ */ new Map();
  for (const row of groupRows.rows) {
    groupIdByName.set(String(row.name), String(row.id));
  }
  const permissionIdByCode = /* @__PURE__ */ new Map();
  for (const row of permissionRows.rows) {
    permissionIdByCode.set(String(row.code), String(row.id));
  }
  for (const [groupName, permissionCodes] of Object.entries(ROLE_PERMISSION_MATRIX)) {
    const groupId = groupIdByName.get(groupName);
    if (!groupId) continue;
    for (const code of permissionCodes) {
      const permissionId = permissionIdByCode.get(code);
      if (!permissionId) continue;
      await db.query(
        `INSERT INTO public.group_permissions (group_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (group_id, permission_id) DO NOTHING`,
        [groupId, permissionId]
      );
    }
  }
}
__name(ensureAdminSeeds, "ensureAdminSeeds");
function normalizeEvolutionBaseUrl3(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}
__name(normalizeEvolutionBaseUrl3, "normalizeEvolutionBaseUrl");
function normalizeNullableText2(value) {
  if (value === void 0) return void 0;
  const normalized = String(value ?? "").trim();
  return normalized || null;
}
__name(normalizeNullableText2, "normalizeNullableText");
var adminUsersRoutes = new Hono2();
adminUsersRoutes.get("/permissions/me", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const result = await db.query(
    `SELECT p.code
       FROM public.user_profiles up
       JOIN public.group_permissions gp ON gp.group_id = up.group_id
       JOIN public.permissions p ON p.id = gp.permission_id
      WHERE up.id = $1`,
    [user.id]
  );
  return c.json(result.rows.map((row) => row.code));
});
adminUsersRoutes.get("/admin/users", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const result = await db.query(
    `SELECT
       u.id,
       up.display_name,
       up.phone,
       up.group_id,
       up.use_global_ai,
       ug.name AS group_name,
       u.name AS user_name,
       u.email
     FROM public.users u
     LEFT JOIN public.user_profiles up ON up.id = u.id
     LEFT JOIN public.user_groups ug ON ug.id = up.group_id
     ORDER BY COALESCE(up.display_name, u.name, u.email, u.id::text) ASC`
  );
  return c.json(result.rows);
});
adminUsersRoutes.put("/admin/users/:id/profile", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const id = String(c.req.param("id") || "").trim();
  const body = await c.req.json().catch(() => ({}));
  if (!id) return c.json({ error: "Usuario invalido." }, 400);
  const displayName = normalizeNullableText2(body.display_name);
  const phone = normalizeNullableText2(body.phone);
  const email = normalizeNullableText2(body.email);
  try {
    await db.query("BEGIN");
    await db.query(
      `INSERT INTO public.user_profiles (id, display_name, phone)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         phone = EXCLUDED.phone`,
      [id, displayName ?? null, phone ?? null]
    );
    if (displayName !== void 0) {
      await db.query("UPDATE public.users SET name = $1 WHERE id = $2", [displayName, id]);
    }
    if (email !== void 0) {
      await db.query("UPDATE public.users SET email = $1 WHERE id = $2", [email, id]);
    }
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    const message2 = String(error?.message || "");
    if (message2.toLowerCase().includes("duplicate key") && message2.toLowerCase().includes("users_email_key")) {
      return c.json({ error: "Ja existe um usuario com esse e-mail." }, 409);
    }
    throw error;
  }
  const result = await db.query(
    `SELECT
       u.id,
       up.display_name,
       up.phone,
       up.group_id,
       up.use_global_ai,
       ug.name AS group_name,
       u.name AS user_name,
       u.email
     FROM public.users u
     LEFT JOIN public.user_profiles up ON up.id = u.id
     LEFT JOIN public.user_groups ug ON ug.id = up.group_id
     WHERE u.id = $1
     LIMIT 1`,
    [id]
  );
  return c.json(result.rows[0] || { ok: true });
});
adminUsersRoutes.get("/admin/groups", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const result = await db.query("SELECT * FROM public.user_groups ORDER BY name ASC");
  return c.json(result.rows);
});
adminUsersRoutes.get("/admin/permissions", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const result = await db.query("SELECT * FROM public.permissions ORDER BY code ASC");
  return c.json(result.rows);
});
adminUsersRoutes.get("/admin/group-permissions", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const result = await db.query("SELECT * FROM public.group_permissions");
  return c.json(result.rows);
});
adminUsersRoutes.post("/admin/group-permissions", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const body = await c.req.json().catch(() => ({}));
  const groupId = String(body.group_id || "").trim();
  const permissionId = String(body.permission_id || "").trim();
  if (!groupId || !permissionId) {
    return c.json({ error: "group_id e permission_id sao obrigatorios." }, 400);
  }
  await db.query(
    `INSERT INTO public.group_permissions (group_id, permission_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, permission_id) DO NOTHING`,
    [groupId, permissionId]
  );
  return c.json({ ok: true });
});
adminUsersRoutes.delete("/admin/group-permissions", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const body = await c.req.json().catch(() => ({}));
  const groupId = String(body.group_id || "").trim();
  const permissionId = String(body.permission_id || "").trim();
  if (!groupId || !permissionId) {
    return c.json({ error: "group_id e permission_id sao obrigatorios." }, 400);
  }
  await db.query("DELETE FROM public.group_permissions WHERE group_id = $1 AND permission_id = $2", [groupId, permissionId]);
  return c.json({ ok: true });
});
adminUsersRoutes.put("/admin/users/:id/group", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const id = String(c.req.param("id") || "").trim();
  const body = await c.req.json().catch(() => ({}));
  const groupIdRaw = body.group_id;
  const groupId = groupIdRaw == null || String(groupIdRaw).trim() === "" ? null : String(groupIdRaw).trim();
  if (!id) return c.json({ error: "Usuario invalido." }, 400);
  await db.query("INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [id]);
  await db.query("UPDATE public.user_profiles SET group_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [groupId, id]);
  return c.json({ ok: true });
});
adminUsersRoutes.put("/admin/users/:id/settings", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  await ensureAdminSeeds(db);
  const id = String(c.req.param("id") || "").trim();
  const body = await c.req.json().catch(() => ({}));
  if (!id) return c.json({ error: "Usuario invalido." }, 400);
  const updates = [];
  const pushUpdate = /* @__PURE__ */ __name((column, bodyKey) => {
    if (body[bodyKey] !== void 0) {
      updates.push({ column, value: body[bodyKey] });
    }
  }, "pushUpdate");
  pushUpdate("use_global_ai", "use_global_ai");
  pushUpdate("display_name", "display_name");
  pushUpdate("evolution_url", "evolution_url");
  pushUpdate("evolution_apikey", "evolution_apikey");
  pushUpdate("evolution_instance", "evolution_instance");
  pushUpdate("company_info", "company_info");
  if (body.evolution_api_key !== void 0 && body.evolution_apikey === void 0) {
    updates.push({ column: "evolution_apikey", value: body.evolution_api_key });
  }
  if (updates.length === 0) {
    return c.json({ error: "Nenhum campo valido fornecido." }, 400);
  }
  await db.query("INSERT INTO public.user_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [id]);
  const assignments = updates.map((entry, index) => `${entry.column} = $${index + 1}`);
  const values = updates.map((entry) => entry.value);
  assignments.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  await db.query(`UPDATE public.user_profiles SET ${assignments.join(", ")} WHERE id = $${values.length}`, values);
  return c.json({ ok: true });
});
adminUsersRoutes.post("/admin/users/:id/reset-password", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  const id = String(c.req.param("id") || "").trim();
  if (!id) return c.json({ success: false, error: "Usuario invalido." }, 400);
  const defaultPassword = "123456";
  const passwordHash = await bcryptjs_default.hash(defaultPassword, 10);
  const result = await db.query(
    `UPDATE public.users
        SET password_hash = $1,
            reset_password_token = NULL,
            reset_password_expires = NULL,
            token_version = COALESCE(token_version, 0) + 1
      WHERE id = $2
      RETURNING id`,
    [passwordHash, id]
  );
  if (result.rows.length === 0) {
    return c.json({ success: false, error: "Usuario nao encontrado." }, 404);
  }
  return c.json({
    success: true,
    message: `Senha do usuario resetada para "${defaultPassword}" e sessoes invalidadas.`
  });
});
adminUsersRoutes.post("/admin/users/:id/invalidate-sessions", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  const id = String(c.req.param("id") || "").trim();
  if (!id) return c.json({ success: false, error: "Usuario invalido." }, 400);
  const result = await db.query(
    `UPDATE public.users
        SET token_version = COALESCE(token_version, 0) + 1
      WHERE id = $1
      RETURNING id`,
    [id]
  );
  if (result.rows.length === 0) {
    return c.json({ success: false, error: "Usuario nao encontrado." }, 404);
  }
  return c.json({ success: true, message: "Sessoes do usuario invalidadas com sucesso." });
});
adminUsersRoutes.post("/admin/invalidate-all-sessions", authenticateToken, checkAdmin, async (c) => {
  const db = getDb(c.env);
  await db.query("UPDATE public.users SET token_version = COALESCE(token_version, 0) + 1");
  return c.json({ success: true, message: "Sessoes de todos os usuarios invalidadas com sucesso." });
});
adminUsersRoutes.post("/admin/users/:id/notify", authenticateToken, checkAdmin, async (c) => {
  const authUser = c.get("user");
  if (!authUser?.id) return c.json({ error: "Acesso negado." }, 401);
  const db = getDb(c.env);
  await ensureAdminUsersTables(db);
  const id = String(c.req.param("id") || "").trim();
  const body = await c.req.json().catch(() => ({}));
  const message2 = String(body.message || "").trim();
  if (!id) return c.json({ error: "Usuario invalido." }, 400);
  if (!message2) return c.json({ error: "Mensagem e obrigatoria." }, 400);
  const [targetUserResult, adminProfileResult, globalSettingsResult] = await Promise.all([
    db.query(
      `SELECT
         up.phone,
         COALESCE(up.display_name, u.name, u.email, u.id::text) AS user_label
       FROM public.users u
       LEFT JOIN public.user_profiles up ON up.id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [id]
    ),
    db.query(
      `SELECT
         evolution_url,
         evolution_apikey,
         evolution_instance
       FROM public.user_profiles
       WHERE id = $1
       LIMIT 1`,
      [authUser.id]
    ),
    db.query(
      `SELECT
         evolution_api_url,
         evolution_api_key,
         evolution_shared_instance
       FROM public.app_settings
       ORDER BY id DESC
       LIMIT 1`
    )
  ]);
  const targetUser = targetUserResult.rows[0];
  if (!targetUser?.phone) {
    return c.json({ error: "Usuario alvo nao possui telefone cadastrado." }, 400);
  }
  const adminProfile = adminProfileResult.rows[0] || {};
  const globalSettings = globalSettingsResult.rows[0] || {};
  const evolutionUrl = normalizeEvolutionBaseUrl3(adminProfile.evolution_url || globalSettings.evolution_api_url || "");
  const evolutionApiKey = String(adminProfile.evolution_apikey || globalSettings.evolution_api_key || "").trim();
  const evolutionInstance = String(adminProfile.evolution_instance || globalSettings.evolution_shared_instance || "").trim();
  if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
    return c.json({ error: "Evolution API nao configurada para notificacoes administrativas." }, 400);
  }
  const evolutionNumber = toEvolutionNumber(targetUser.phone);
  if (!evolutionNumber) {
    return c.json({ error: "Telefone do usuario esta em formato invalido." }, 400);
  }
  const response = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: evolutionApiKey
    },
    body: JSON.stringify({
      number: evolutionNumber,
      text: message2,
      linkPreview: false
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return c.json({ error: `Falha ao enviar pela Evolution API: ${errorText || `HTTP ${response.status}`}` }, 502);
  }
  return c.json({ ok: true, target: targetUser.user_label || id });
});

// src/routes/extractMaps.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
function mapPlace(place) {
  return {
    place_id: place.place_id || "",
    name: place.name || "",
    address: place.formatted_address || place.vicinity || "",
    rating: place.rating ?? null,
    total_ratings: place.user_ratings_total || 0,
    category: place.types?.[0]?.replace(/_/g, " ") || "Estabelecimento",
    location: place.geometry?.location || null,
    phone: null,
    website: null
  };
}
__name(mapPlace, "mapPlace");
async function getMapsApiKey(db, env2) {
  try {
    const settingsResult = await db.query("SELECT google_maps_api_key FROM public.app_settings ORDER BY id DESC LIMIT 1");
    const settingsKey = String(settingsResult.rows[0]?.google_maps_api_key || "").trim();
    const envKey = String(env2.GOOGLE_MAPS_API_KEY || "").trim();
    return settingsKey || envKey || null;
  } catch (err) {
    console.error("[getMapsApiKey] Erro ao buscar chave da API:", err);
    return String(env2.GOOGLE_MAPS_API_KEY || "").trim() || null;
  }
}
__name(getMapsApiKey, "getMapsApiKey");
var extractMapsRoutes = new Hono2();
extractMapsRoutes.post("/extract/maps/search", authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const searchTerm = String(body.query || "").trim();
  const location = String(body.location || "").trim();
  if (!searchTerm || !location) {
    return c.json({ error: "query e location sao obrigatorios." }, 400);
  }
  const db = getDb(c.env);
  const apiKey = await getMapsApiKey(db, c.env);
  if (!apiKey) {
    return c.json({ error: "Chave da Google Maps API nao configurada. Acesse Configuracoes para adicionar." }, 400);
  }
  const searchQuery = encodeURIComponent(`${searchTerm} em ${location}`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&language=pt-BR&region=br&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  const status = String(data.status || "");
  if (status && status !== "OK" && status !== "ZERO_RESULTS") {
    return c.json(
      {
        error: `Erro na API do Google Maps: ${status}`,
        details: data.error_message || null
      },
      400
    );
  }
  const places = Array.isArray(data.results) ? data.results.map((item) => mapPlace(item)) : [];
  return c.json({
    places,
    nextPageToken: data.next_page_token || null
  });
});
extractMapsRoutes.post("/extract/maps/next-page", authenticateToken, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const pageToken = String(body.pageToken || "").trim();
  if (!pageToken) return c.json({ error: "pageToken e obrigatorio." }, 400);
  const db = getDb(c.env);
  const apiKey = await getMapsApiKey(db, c.env);
  if (!apiKey) {
    return c.json({ error: "Chave da Google Maps API nao configurada." }, 400);
  }
  await new Promise((resolve) => setTimeout(resolve, 2100));
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(pageToken)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  const status = String(data.status || "");
  if (status && status !== "OK" && status !== "ZERO_RESULTS") {
    return c.json(
      {
        error: `Erro na API do Google Maps: ${status}`,
        details: data.error_message || null
      },
      400
    );
  }
  const places = Array.isArray(data.results) ? data.results.map((item) => mapPlace(item)) : [];
  return c.json({
    places,
    nextPageToken: data.next_page_token || null
  });
});
extractMapsRoutes.get("/extract/maps/details/:placeId", authenticateToken, async (c) => {
  const placeId = String(c.req.param("placeId") || "").trim();
  if (!placeId) return c.json({ error: "placeId e obrigatorio." }, 400);
  const db = getDb(c.env);
  const apiKey = await getMapsApiKey(db, c.env);
  if (!apiKey) {
    return c.json({ error: "Chave da Google Maps API nao configurada." }, 400);
  }
  const fields = "name,formatted_phone_number,international_phone_number,website,formatted_address,rating,types";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${encodeURIComponent(fields)}&language=pt-BR&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  const status = String(data.status || "");
  if (status !== "OK") {
    return c.json({ error: `Erro ao buscar detalhes: ${status || "UNKNOWN_ERROR"}` }, 400);
  }
  const result = data.result || {};
  return c.json({
    place_id: placeId,
    name: result.name || "",
    phone: result.international_phone_number || result.formatted_phone_number || null,
    phone_local: result.formatted_phone_number || null,
    website: result.website || null,
    address: result.formatted_address || null,
    rating: result.rating ?? null,
    category: result.types?.[0]?.replace(/_/g, " ") || "Estabelecimento"
  });
});

// src/routes/emailWebhook.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
function safeTrim3(value) {
  return String(value || "").trim();
}
__name(safeTrim3, "safeTrim");
async function ensureWebhookSchema(db) {
  await db.query("ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS webhook_email_url TEXT");
  await db.query("ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS use_global_webhooks BOOLEAN DEFAULT true");
  await db.query("ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS global_webhook_email_url TEXT");
}
__name(ensureWebhookSchema, "ensureWebhookSchema");
async function resolveEmailWebhookUrl(db, userId, env2) {
  const [profileResult, appSettingsResult] = await Promise.all([
    db.query(
      `SELECT webhook_email_url
         FROM public.user_profiles
        WHERE id = $1
        LIMIT 1`,
      [userId]
    ),
    db.query(
      `SELECT global_webhook_email_url
         FROM public.app_settings
        ORDER BY id DESC
        LIMIT 1`
    )
  ]);
  const profile = profileResult.rows[0] || {};
  const settings = appSettingsResult.rows[0] || {};
  return safeTrim3(profile.webhook_email_url) || safeTrim3(settings.global_webhook_email_url) || safeTrim3(env2.WEBHOOK_EMAIL) || null;
}
__name(resolveEmailWebhookUrl, "resolveEmailWebhookUrl");
var emailWebhookRoutes = new Hono2();
emailWebhookRoutes.post("/n8n/trigger", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Acesso negado." }, 401);
  const payload = await c.req.json().catch(() => ({}));
  const db = getDb(c.env);
  await ensureWebhookSchema(db);
  const webhookUrl = await resolveEmailWebhookUrl(db, user.id, c.env);
  if (!webhookUrl) {
    return c.json({ error: "Webhook de email nao configurado." }, 400);
  }
  let response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return c.json({ error: `Falha ao acionar webhook de email: ${String(error?.message || error)}` }, 502);
  }
  const contentType = response.headers.get("content-type") || "";
  let body = null;
  if (contentType.includes("application/json")) {
    body = await response.json().catch(() => null);
  } else {
    body = await response.text().catch(() => "");
  }
  return c.json({
    ok: response.ok,
    status: response.status,
    data: body
  });
});

// src/routes/chat.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_auth();
init_db();
var chatRoutes = new Hono2();
chatRoutes.get("/labels/:instance", authenticateToken, async (c) => {
  const instance = c.req.param("instance");
  const db = getDb(c.env);
  const settings = await db.query("SELECT evolution_url, evolution_key FROM public.settings LIMIT 1");
  if (settings.rows.length === 0) {
    return c.json({ error: "Configure a Evolution API nas definicoes primeiro." }, 400);
  }
  const { evolution_url, evolution_key } = settings.rows[0];
  if (!evolution_url || !evolution_key) {
    return c.json({ error: "Evolution URL ou Key nao configurada." }, 400);
  }
  const url = `${evolution_url.replace(/\/$/, "")}/chat/findLabels/${instance}`;
  try {
    const response = await fetch(url, {
      headers: {
        "apikey": evolution_key,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return c.json({ error: "Erro ao buscar labels na Evolution.", details: errBody }, response.status);
    }
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: "Falha na comunicacao com a Evolution.", technical: error.message }, 500);
  }
});
chatRoutes.get("/groups/:instance", authenticateToken, async (c) => {
  const instance = c.req.param("instance");
  const db = getDb(c.env);
  const settings = await db.query("SELECT evolution_url, evolution_key FROM public.settings LIMIT 1");
  if (settings.rows.length === 0) return c.json({ error: "Configuracao ausente." }, 400);
  const { evolution_url, evolution_key } = settings.rows[0];
  const url = `${evolution_url.replace(/\/$/, "")}/group/fetchAllGroups/${instance}?getParticipants=false`;
  try {
    const response = await fetch(url, {
      headers: { "apikey": evolution_key }
    });
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});
chatRoutes.post("/webhook-setup/:instance", authenticateToken, async (c) => {
  const instance = c.req.param("instance");
  const db = getDb(c.env);
  const settings = await db.query("SELECT evolution_url, evolution_key FROM public.settings LIMIT 1");
  if (settings.rows.length === 0) return c.json({ error: "Configuracao ausente." }, 400);
  const { evolution_url, evolution_key } = settings.rows[0];
  const baseURL = evolution_url.replace(/\/$/, "");
  const url = `${baseURL}/webhook/set/${instance}`;
  const myBackendUrl = new URL(c.req.url).origin;
  const webhookUrl = `${myBackendUrl}/api/webhooks/evolution`;
  const payload = {
    enabled: true,
    url: webhookUrl,
    webhook_by_events: false,
    events: ["MESSAGES_UPSERT", "POLL_VOTE", "MESSAGES_UPDATE"],
    webhook_base64: false
  };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": evolution_key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return c.json({
      ok: true,
      message: "Webhook configurado com sucesso na Evolution API.",
      evolution_response: data,
      webhook_target: webhookUrl
    });
  } catch (error) {
    return c.json({ error: `Erro no setup do webhook: ${error.message}` }, 500);
  }
});
chatRoutes.post("/status-send/:instance", authenticateToken, async (c) => {
  const instance = c.req.param("instance");
  const db = getDb(c.env);
  const body = await c.req.json().catch(() => ({}));
  const settings = await db.query("SELECT evolution_url, evolution_key FROM public.settings LIMIT 1");
  if (settings.rows.length === 0) return c.json({ error: "Configuracao ausente." }, 400);
  const { evolution_url, evolution_key } = settings.rows[0];
  const baseURL = evolution_url.replace(/\/$/, "");
  const text = body.text || "";
  const mediaUrl = body.mediaUrl;
  const mediaType = body.mediaType || "image";
  const endpoint = mediaUrl ? "/message/sendMedia" : "/message/sendText";
  const url = `${baseURL}${endpoint}/${instance}`;
  const payload = {
    number: "status@broadcast"
  };
  if (mediaUrl) {
    payload.media = mediaUrl;
    payload.mediatype = mediaType;
    payload.caption = text;
    payload.mimetype = mediaType === "image" ? "image/jpeg" : "video/mp4";
  } else {
    payload.text = text;
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": evolution_key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return c.json({
      ok: response.ok,
      message: "Status processado pela Evolution.",
      evolution_response: data
    });
  } catch (error) {
    return c.json({ error: `Erro ao enviar status: ${error.message}` }, 500);
  }
});

// src/routes/webhooks.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_performance2();
init_dist();
init_db();
var webhookRoutes = new Hono2();
function authenticateWebhookSecret(c) {
  const querySecret = c.req.query("secret") || c.req.query("apikey");
  const env2 = c.env;
  const expected = String(env2.WEBHOOK_SECRET || "").trim();
  if (!expected) return null;
  if (querySecret !== expected) {
    return c.json({ error: "Webhook secret invalid ou ausente." }, 401);
  }
  return null;
}
__name(authenticateWebhookSecret, "authenticateWebhookSecret");
webhookRoutes.post("/evolution", async (c) => {
  const authError = authenticateWebhookSecret(c);
  if (authError) return authError;
  const body = await c.req.json().catch(() => ({}));
  const db = getDb(c.env);
  const event = body.event || body.type;
  const instance = body.instance;
  const data = body.data || {};
  const remoteJid = data.key?.remoteJid;
  const fromMe = data.key?.fromMe;
  const isGroup = remoteJid?.includes("@g.us");
  console.log(`[Webhook] Evento: ${event} | Instance: ${instance} | RemoteJid: ${remoteJid}`);
  if (event === "messages.upsert" && !fromMe && !isGroup && data.message) {
    const text = data.message.conversation || data.message.extendedTextMessage?.text;
    if (text && text.length > 0) {
      console.log(`[Webhook] Mensagem de texto recebida: ${text}`);
      await handleAiResponse(c, db, instance, remoteJid, text);
    }
  }
  if (event === "messages.upsert" && data.message?.pollUpdateMessage) {
    const pollVote = data.message.pollUpdateMessage;
    const remoteJid2 = data.key?.remoteJid;
    const sender = tokensToNumber(remoteJid2);
    if (sender) {
      console.log(`[Webhook] Voto em enquete detectado de ${sender}`);
    }
  }
  if (event === "messages.upsert" && (data.message?.buttonsResponseMessage || data.message?.listResponseMessage)) {
    const response = data.message?.buttonsResponseMessage || data.message?.listResponseMessage;
    const remoteJid2 = data.key?.remoteJid;
    const sender = tokensToNumber(remoteJid2);
    if (sender) {
      const selectedId = response.selectedButtonId || response.singleSelectReply?.selectedRowId;
      console.log(`[Webhook] Resposta interativa de ${sender}: ${selectedId}`);
      if (selectedId?.toLowerCase().includes("interesse")) {
        await markLeadAsHot(db, sender);
      }
    }
  }
  return c.json({ ok: true });
});
function tokensToNumber(jid) {
  if (!jid) return null;
  return jid.split("@")[0];
}
__name(tokensToNumber, "tokensToNumber");
async function markLeadAsHot(db, phone) {
  try {
    const searchPhone = `%${phone}`;
    await db.query(`
            UPDATE public.contacts 
            SET labels = COALESCE(labels, '[]'::jsonb) || '["HOT_LEAD"]'::jsonb
            WHERE phone LIKE $1
        `, [searchPhone]);
    console.log(`[CRM] Lead ${phone} marcado como HOT_LEAD via Automa\xE7\xE3o de Feedback.`);
  } catch (err) {
    console.error(`[CRM] Erro ao marcar lead ${phone}:`, err);
  }
}
__name(markLeadAsHot, "markLeadAsHot");
async function handleAiResponse(c, db, instance, remoteJid, userText) {
  try {
    const settings = await db.query("SELECT evolution_url, evolution_key, gemini_api_key, gemini_prompt FROM public.settings LIMIT 1");
    if (settings.rows.length === 0) return;
    const { evolution_url, evolution_key, gemini_api_key, gemini_prompt } = settings.rows[0];
    if (!gemini_api_key) return;
    const evolutionUrl = evolution_url.replace(/\/$/, "");
    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": gemini_api_key
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userText }] }],
        systemInstruction: gemini_prompt ? { parts: [{ text: gemini_prompt }] } : void 0,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1e3 }
      })
    });
    if (!aiRes.ok) {
      console.error("[IA] Falha ao chamar Gemini no Webhook");
      return;
    }
    const aiData = await aiRes.json();
    const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (aiText) {
      console.log(`[IA] Gerada resposta: ${aiText.slice(0, 50)}...`);
      await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
        method: "POST",
        headers: {
          "apikey": evolution_key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          number: remoteJid,
          text: aiText,
          delay: 1200
          // Simula digitação curta
        })
      });
    }
  } catch (err) {
    console.error("[IA] Erro no processamento do Chatbot:", err);
  }
}
__name(handleAiResponse, "handleAiResponse");

// src/index.ts
var app = new Hono2();
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With,Accept,Origin"
};
app.use("*", async (c, next) => {
  console.log(`[REQUEST] ${c.req.method} ${c.req.url} ${c.req.header("content-type") || ""}`);
  await next();
});
app.use("*", cors({ origin: "*" }));
app.use("*", async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error("[CloudflareBackend] Erro capturado no guard global:", error);
    const message2 = error instanceof Error ? error.message : String(error);
    return c.json(
      {
        error: "Erro interno no backend Cloudflare.",
        technical: message2
      },
      500,
      CORS_HEADERS
    );
  }
});
app.options("*", (c) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => c.header(key, value));
  return c.body(null, 204);
});
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }
  let db;
  try {
    db = getDb(c.env);
    c.set("db", db);
  } catch (dbError) {
    console.error("[DBInit] Falha ao obter pool do banco:", dbError.message);
    return c.json(
      { error: "Servidor temporariamente indisponivel. Tente novamente.", technical: dbError.message },
      503,
      CORS_HEADERS
    );
  }
  if (c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
    c.executionCtx.waitUntil(
      ensureCloudflareSchema(db).catch(() => {
      })
    );
  }
  await next();
});
app.get("/api/rescue-migration", async (c) => {
  const secret = c.req.query("secret");
  const expected = String(c.env.MIGRATION_SECRET || "").trim();
  if (!expected || secret !== expected) {
    return c.json({ error: "Acesso negado." }, 401);
  }
  const db = getDb(c.env);
  try {
    await db.query(`
      ALTER TABLE campaigns ALTER COLUMN channels TYPE JSONB USING to_jsonb(channels);
    `);
    return c.json({ ok: true, message: "Schema migrado para JSONB com sucesso!" });
  } catch (err) {
    return c.json({ ok: false, error: "Falha na migracao." }, 500);
  }
});
app.get("/api/version-check", (c) => {
  return c.json({
    status: "ONLINE",
    version: "1.1.0",
    marker: "RANDOM-V9-XYZ",
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.route("/api", healthRoutes);
app.route("/api", statusRoutes);
app.route("/api", authRoutes);
app.route("/api", profileSettingsRoutes);
app.route("/api", presenceRoutes);
app.route("/api", uploadRoutes);
app.route("/api", instanceLabRoutes);
app.route("/api", historyRoutes);
app.route("/api", listsContactsRoutes);
app.route("/api", campaignRoutes);
app.route("/api", extensionRoutes);
app.route("/api", scheduleRoutes);
app.route("/api", aiRoutes);
app.route("/api", adminOpsRoutes);
app.route("/api", adminUsersRoutes);
app.route("/api", extractMapsRoutes);
app.route("/api/email-webhook", emailWebhookRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/webhooks", webhookRoutes);
app.notFound((c) => c.json({ error: "Rota nao encontrada no backend Cloudflare." }, 404));
app.onError((err, c) => {
  console.error("[GlobalError]", err);
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("timeout") || msg.includes("DB_QUERY_TIMEOUT")) {
    return c.json({ error: "Erro de timeout no banco de dados. Tente novamente em instantes.", details: msg }, 504);
  }
  if (msg.includes("HYPERDRIVE") || msg.includes("DATABASE_URL") || msg.includes("ECONN") || msg.includes("ETIMEDOUT")) {
    return c.json({ error: "Banco de dados temporariamente indisponivel. Tente novamente.", details: msg }, 503);
  }
  return c.json({
    error: "Erro interno no servidor",
    message: msg
  }, 500);
});
var index_default = {
  fetch: app.fetch,
  async scheduled(event, env2, ctx) {
    if (String(env2.WARMER_CRON_ENABLED || "").trim().toLowerCase() !== "true") {
      console.log("[ScheduledTrigger] Warmer cron desabilitado por configuracao.");
      return;
    }
    console.log(`[ScheduledTrigger] Executing at ${(/* @__PURE__ */ new Date()).toISOString()}. Event: ${event.cron || "manual"}`);
    const { handleScheduledWarming: handleScheduledWarming2 } = await Promise.resolve().then(() => (init_instanceLab(), instanceLab_exports));
    ctx.waitUntil(handleScheduledWarming2(env2));
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
