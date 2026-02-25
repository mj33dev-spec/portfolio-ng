import {
  createOnMessage as __wasmCreateOnMessageForFsProxy,
  getDefaultContext as __emnapiGetDefaultContext,
  instantiateNapiModuleSync as __emnapiInstantiateNapiModuleSync,
  WASI as __WASI,
} from 'https://esm.sh/@napi-rs/wasm-runtime@1.1.1'



const __wasmUrl = '/assets/hwp/hwpjs.wasm32-wasi.wasm'

export default async function init() {
  const instanceId = Math.random().toString(36).substring(7);
  console.log(`[HWP Engine] Initializing instance: ${instanceId}`);

  const __wasi = new __WASI({
    version: 'preview1',
  })
  const __emnapiContext = __emnapiGetDefaultContext()
  
  // 초기 메모리를 줄여 자원 확보 및 충돌 완화
  const __sharedMemory = new WebAssembly.Memory({
    initial: 2000, // 256MB -> 128MB로 축소
    maximum: 65536,
    shared: true,
  })

  const __wasmFile = await fetch(__wasmUrl).then((res) => res.arrayBuffer())

  const {
    napiModule: __napiModule,
  } = __emnapiInstantiateNapiModuleSync(__wasmFile, {
    context: __emnapiContext,
    asyncWorkPoolSize: 4,
    wasi: __wasi,
    onCreateWorker() {
      // 고유 쿼리 스트링을 추가하여 브라우저 수준에서 워커 쓰레드 물리적 격리
      const workerUrl = `/assets/hwp/wasi-worker-browser.mjs?inst=${instanceId}&t=${Date.now()}`;
      const workerInstance = new Worker(workerUrl, {
        type: 'module',
      })

      return workerInstance
    },
    overwriteImports(importObject) {
      importObject.env = {
        ...importObject.env,
        ...importObject.napi,
        ...importObject.emnapi,
        memory: __sharedMemory,
      }
      return importObject
    },
    beforeInit({ instance }) {
      for (const name of Object.keys(instance.exports)) {
        if (name.startsWith('__napi_register__')) {
          instance.exports[name]()
        }
      }
    },
  })
  
  console.log(`[HWP Engine] Instance ${instanceId} initialized. Exports:`, Object.keys(__napiModule.exports));
  
  return __napiModule.exports
}
