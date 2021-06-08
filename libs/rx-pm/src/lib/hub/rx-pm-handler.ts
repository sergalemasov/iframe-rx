import 'reflect-metadata';

export const rxPmHandlersMetaKey = Symbol();

export function RxPmHandler() {
    return function(target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
        let handlers = Reflect.getMetadata(rxPmHandlersMetaKey, target);

        if (!handlers) {
            Reflect.defineMetadata(rxPmHandlersMetaKey, handlers = [], target);
        }

        handlers.push({
            name: propertyKey
        });
    }
}
