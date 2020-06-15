import { allServers } from '../helpers/servers';
import {
    logColorCommand,
    logColorError,
    logColorHoster,
    logColorServer,
    logColorSuccess,
    logHint,
    logHoster,
} from '../helpers/log';
import Table from 'cli-table';
import { Server } from '../classes/Server';
import { allHosters } from '../helpers/hosters';

const list = async () => {
    const hosters = allHosters();
    const servers = allServers();

    if (hosters.length === 0) {
        console.log('No hosters found.');
        console.log(
            `Run ${logColorCommand('clocker provider register')} to configure a new hoster.`
        );
        return;
    }

    for (let i = 0; i < hosters.length; i++) {
        const hoster = hosters[i];
        const serversForHoster: Server[] = servers.filter((s) => s.hosterId === hoster.getId());

        console.log(`${logColorHoster(hoster.getId())} (${hoster.provider.name()})`);

        if (serversForHoster.length === 0) {
            logHint('- No servers -');
            continue;
        }

        const table = new Table({
            head: ['ID', 'State', 'IP Address', 'Deployments', 'Deployed at'],
            style: {
                head: ['grey'],
            },
        });

        for (let i = 0; i < serversForHoster.length; i++) {
            const server: Server = serversForHoster[i];
            const ready = await server.isReady();

            const deployments = server.getDeployments();

            table.push([
                logColorServer(server.getId()),
                ready ? logColorSuccess('online') : logColorError('offline'),
                server.getIpAddress() || '-',
                deployments.length === 0 ? '-' : deployments.map((d) => d.composePath).join('\n'),
                deployments.length === 0
                    ? '-'
                    : deployments
                          .map((d) => (d.lastDeployment !== null ? d.lastDeployment : ''))
                          .join('\n'),
            ]);
        }
        console.log(table.toString());
    }
};

export default list;
