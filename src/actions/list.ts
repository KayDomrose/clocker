import {checkInitOrFail} from "../helpers/check-init";
import {getServers, isServerReady} from "../helpers/servers";
import {logColorCommand, logColorError, logColorServer, logColorSuccess, logSuccess} from "../helpers/log";
import Table from 'cli-table';

const list = async () => {
    if (!checkInitOrFail()) {
        return;
    }

    const servers = getServers();

    if (servers.length === 0) {
        console.log('No servers configured.');
        console.log(`Run ${logColorCommand('clocker add')} to configure a new server.`);
        return;
    }

    const table = new Table({
        head: ['ID', 'Provider', 'IP Address', 'State'],
        style: {
            head: ['grey'],
        }
    });

    for (let i = 0; i < servers.length; i++) {
        const server = servers[i];

        let ready = false;
        if (server.ip) {
            ready = await isServerReady(server.ip);
        }

        table.push([
            logColorServer(server.id),
            server.provider,
            server.ip || '',
            ready ? logColorSuccess('online') : logColorError('offline')
        ])
    }

    console.log(table.toString());
}

export default list;
