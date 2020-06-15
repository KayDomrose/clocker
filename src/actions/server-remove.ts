import { Server } from '../classes/Server';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import { PromptObject } from 'prompts';
import ask from '../helpers/ask';
import { ServerArgBag } from '../clocker';

const serverRemove = async (args: ServerArgBag) => {
    const serverId: string = args.serverId;
    let server: Server | null = null;
    try {
        server = Server.buildFromId(serverId);
    } catch (e) {
        logError(`Can't find server with id ${serverId}`);
        console.log(`Run ${logColorCommand('clocker list')} to get all servers.`);
        return;
    }

    if (await server.isReady()) {
        logError('Server is still running');
        console.log(
            `Stop server first by running ${logColorCommand(
                `clocker stop ${server.getId()}`
            )}, then try again.`
        );
        return;
    }

    const config: PromptObject = {
        type: 'confirm',
        message: `Do you really want to completely and irreversible remove server ${logColorServer(
            server.getId()
        )}?`,
        name: 'confirm',
    };

    const a = await ask<{ confirm: boolean }>(config);
    if (!a.confirm) {
        console.log('Keeping server');
        return;
    }

    console.log('\n');
    console.log(`Removing ${logColorServer(serverId)} ...`);
    if (!server.remove()) {
        logError('Error');
        return;
    }
    logSuccess('Server deleted');
};

export default serverRemove;
