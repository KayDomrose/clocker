import minimist from 'minimist';
import { Server } from '../classes/Server';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import prompts, { PromptObject } from 'prompts';

const remove = async (args: minimist.ParsedArgs) => {
    const serverId: string = args._[1];
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
        message: `Do you really want to completely an irreversible remove server ${logColorServer(
            server.getId()
        )}?`,
        name: 'confirm',
    };

    const answer = await prompts(config);

    if (!answer.confirm) {
        console.log('Server not removed.');
        return;
    }

    console.log('\n');
    console.log(`Removing ${logColorServer(serverId)} ...`);
    if (server.remove()) {
        logSuccess('Server deleted');
    }
};

export default remove;
