import Hcloud from '../providers/Hcloud/Hcloud';
import { BaseProvider } from '../classes/BaseProvider';
import DigitalOcean from '../providers/DigitalOcean/DigitalOcean';

export const providers: { [key: string]: BaseProvider } = {
    // do: new DigitalOcean(),
    hcloud: new Hcloud(),
};

export const getProvider = (key: string): BaseProvider => providers[key];
