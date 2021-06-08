export interface RxPmClientRegister {
    registerInit: (initFn: () => void) => void;
    registerDestroy: (destroyFn: () => void) => void;
}
