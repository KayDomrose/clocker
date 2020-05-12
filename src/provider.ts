import Hcloud from './providers/Hcloud/Hcloud';
import { Provider } from './classes/Provider';

export const providers: { [key: string]: Provider } = {
    hcloud: new Hcloud(),
};

export const getProvider = (key: string): Provider => providers[key];
