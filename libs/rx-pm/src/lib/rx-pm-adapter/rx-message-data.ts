import { RxCallback } from './rx-callback';

export interface RxMessageData<T> {
    channel: string;
    publisher: string;
    callback: RxCallback;
    payload?: T;
}
