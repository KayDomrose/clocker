import { allServers } from '../helpers/servers';
import { logColorCommand, logColorError, logColorServer, logColorSuccess } from '../helpers/log';
import Table from 'cli-table';
import { Server } from '../classes/Server';

const list = async () => {
    const servers = allServers();

    if (servers.length === 0) {
        console.log('No servers found.');
        console.log(`Run ${logColorCommand('clocker add')} to configure a new server.`);
        return;
    }

    const table = new Table({
        head: ['ID', 'State', 'Provider', 'IP Address', 'Server', 'Deployments', 'Deployed at'],
        style: {
            head: ['grey'],
        },
    });

    for (let i = 0; i < servers.length; i++) {
        const server: Server = servers[i];
        const ready = await server.isReady();

        const deployments = server.getDeployments();

        table.push([
            logColorServer(server.getId()),
            ready ? logColorSuccess('online') : logColorError('offline'),
            server.provider().name(),
            server.getIpAddress() || '-',
            server.provider().getServerInfo(),
            deployments.length === 0 ? '-' : deployments.map((d) => d.composePath).join('\n'),
            deployments.length === 0
                ? '-'
                : deployments
                      .map((d) => (d.lastDeployment !== null ? d.lastDeployment : ''))
                      .join('\n'),
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
