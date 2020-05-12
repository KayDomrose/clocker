import Hcloud from './providers/Hcloud/Hcloud';
import { BaseProvider } from './classes/BaseProvider';

export const providers: { [key: string]: BaseProvider } = {
    hcloud: new Hcloud(),
};

export const getProvider = (key: string): BaseProvider => providers[key];
