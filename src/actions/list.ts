import { allServers } from '../helpers/servers';
import { logColorCommand, logColorError, logColorServer, logColorSuccess } from '../helpers/log';
import Table from 'cli-table';
import { Server } from '../classes/Server';
import { checkInitOrFail } from '../helpers/check-init';

const list = async () => {
    if (!checkInitOrFail()) {
        return;
    }
    const servers = allServers();

    if (servers.length === 0) {
        console.log('No servers found.');
        console.log(`Run ${logColorCommand('clocker add')} to configure a new server.`);
        return;
    }

    const table = new Table({
        head: ['ID', 'Provider', 'IP Address', 'State'],
        style: {
            head: ['grey'],
        },
    });

    for (let i = 0; i < servers.length; i++) {
        const server: Server = servers[i];
        const ready = await server.isReady();

        table.push([
            logColorServer(server.getId()),
            server.provider().key(),
            server.getIpAddress() || '-',
            ready ? logColorSuccess('online') : logColorError('offline'),
        ]);
    }

    console.log(table.toString());
    console.log('\n');
    console.log(`Run ${logColorCommand('clocker add')} to add a server.`);
    console.log(
        `Run ${logColorCommand(`clocker start ${logColorServer('ID')}`)} to start a server.`
    );
    console.log(`Run ${logColorCommand(`clocker stop ${logColorServer('ID')}`)} to stop a server.`);
};

export default list;
