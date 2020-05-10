import { SERVERS_PATH } from '../variables';
import fs from 'fs';
import { Server } from '../classes/Server';

export const allServers = (): Server[] => {
    return fs.readdirSync(SERVERS_PATH).map((id) => Server.buildFromId(id));
};
