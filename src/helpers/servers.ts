import { SERVERS_PATH } from '../variables';
import fs from 'fs';
import { Server } from '../classes/Server';
import { logError } from './log';

export const allServers = (): Server[] => {
    const files = fs.readdirSync(SERVERS_PATH);
    const serverDirs = files.filter((file) =>
        fs.lstatSync(`${SERVERS_PATH}/${file}`).isDirectory()
    );

    const servers = serverDirs.map((id) => {
        try {
            return Server.buildFromId(id);
        } catch (e) {
            logError(`Cannot find server configuration for "${id}"`);
            return null;
        }
    });

    return servers.filter((s) => s instanceof Server) as Server[];
};
