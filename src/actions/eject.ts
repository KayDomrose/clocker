import minimist from 'minimist';
import { Server } from '../classes/Server';
import { logColorCommand, logColorServer, logError, logSuccess } from '../helpers/log';
import * as fs from 'fs';
import ask from '../helpers/ask';

const checkTargetDir = (path: string): boolean => {
    if (!fs.existsSync(path)) {
        logError('Target directory does not exists');
        return false;
    }

    const x = fs.readdirSync(path);
    if (x.length > 0) {
        logError('Target directory is not empty');
        return false;
    }

    return true;
};

const eject = async (args: minimist.ParsedArgs) => {
    const serverId: string = args._[1];
    const path: string = args._[2];
    let server: Server | null = null;
    try {
        server = Server.buildFromId(serverId);
    } catch (e) {
        logError(`Can't find server with id ${serverId}`);
        console.log(`Run ${logColorCommand('clocker list')} to get all servers.`);
        return;
    }
    console.log(`== Eject server ${logColorServer(serverId)} ==`);

    console.log('\n');
    console.log(`Checking server state ...`);
    if (await server.isReady()) {
        logError('Server is running');
        console.log(`Run ${logColorCommand(`clocker stop ${server.getId()}`)} and try again.`);
        return;
    }
    logSuccess('Server not running');

    console.log('\n');
    console.log('Checking target directory ...');
    if (!checkTargetDir(path)) {
        return false;
    }
    logSuccess('Found and empty');

    console.log('\n');
    console.log(`clocker will now move all server related files to ${path}.`);
    console.log('You will no longer be able to manage this server via clocker.');
    // const answer = await ask<{ eject: boolean }>({
    //     type: 'confirm',
    //     message: 'Do you want to eject now?',
    //     name: 'eject',
    // });
    // if (!answer.eject) {
    //     return;
    // }

    console.log('\n');
    console.log('Moving files ...');

    const serverFiles = fs.readdirSync(server.getServerPath());
    serverFiles.forEach((file) => {
        if (file === 'config.json') {
            return;
        }

        fs.renameSync(`${server!.getServerPath()}/${file}`, `${path}/${file}`);
        logSuccess(`${path}/${file}`);
    });

    console.log('\n');
    console.log('Removing server ...');
    fs.unlinkSync(`${server.getServerPath()}/config.json`);
    fs.rmdirSync(server.getServerPath());
    logSuccess('Server removed');

    console.log('\n');
    logSuccess(`Server ejected to ${path}`);
};

export default eject;
