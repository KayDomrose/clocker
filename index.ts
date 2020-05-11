#!/usr/bin/env node

import minimist from 'minimist';
import add from './src/actions/add';
import init from './src/actions/init';
import { VERSION } from './src/variables';
import { logColorCommand, logColorSuccess, logError } from './src/helpers/log';
import list from './src/actions/list';
import start from './src/actions/start';
import stop from './src/actions/stop';
import deploy from './src/actions/deploy';

interface Action {
    name: string;
    args?: string[];
    action: { (args: minimist.ParsedArgs): void };
}

const actions: Action[] = [
    {
        name: 'init',
        action: init,
    },
    {
        name: 'list',
        action: list,
    },
    {
        name: 'add',
        action: add,
    },
    {
        name: 'start',
        args: ['ID'],
        action: start,
    },
    {
        name: 'stop',
        args: ['ID'],
        action: stop,
    },
    {
        name: 'deploy',
        args: ['ID', 'DOCKER-COMPOSE-FILE'],
        action: deploy,
    },
];

const checkArgs = (args: minimist.ParsedArgs, action: Action): boolean => {
    if (!action.args) {
        return true;
    }

    for (let i = 0; i < action.args.length; i++) {
        if (args._.length <= i + 1) {
            logError(`Missing argument ${action.args[i]}`);
            console.log(logColorCommand(`clocker ${action.name} ${action.args.join(' ')}`));
            return false;
        }
    }

    return true;
};

const run = (args: minimist.ParsedArgs) => {
    global.verbose = args?.verbose || args?.v;

    if (args?.version) {
        console.log(VERSION);
        return;
    }

    if (args._.length === 0 || !actions.map((a) => a.name).includes(args._[0]) || args?.help) {
        console.log(`${logColorSuccess('clocker - CLoud doCKER')} 
v${VERSION}

Usage ${logColorCommand('clocker ACTION OPTION')}

Actions
    ${logColorCommand('init')}                              Initialize clocker
    ${logColorCommand('list')}                              List all servers with state
    ${logColorCommand('add')}                               Configure a new remote cloud server
    ${logColorCommand('start ID')}                          Start a server
    ${logColorCommand('stop ID')}                           Stop a server
    ${logColorCommand('deploy ID DOCKER-COMPOSE-FILE')}     Deploy a docker-compose file to a server
    
Options
    ${logColorCommand('--version')}                         Show clocker version
    ${logColorCommand('--help')}                            Show this documentation
`);
        return;
    }

    if (global.verbose) {
        console.log('>> Verbose mode');
    }

    const action: Action = actions.find((a) => a.name === args._[0])!;
    if (checkArgs(args, action)) {
        action.action(args);
    }
};

const argv = minimist(process.argv.slice(2));
run(argv);
