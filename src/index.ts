#!/usr/bin/env node

import minimist from 'minimist';
import init from './actions/init';
import { VERSION } from './variables';
import { logColorCommand, logColorSuccess, logError } from './helpers/log';
import list from './actions/list';
import Exception from './exceptions/Exception';
import checkInit from './helpers/check-init';
import IncompleteInitializationException from './exceptions/IncompleteInitializationException';
import { getActionArgBag, findAction } from './helpers/actions';

const run = async (args: minimist.ParsedArgs) => {
    global.verbose = args?.verbose || args?.v;

    if (global.verbose) {
        console.log('>> Verbose mode');
    }

    if (args?.version) {
        console.log(VERSION);
        return;
    }

    const action = findAction(args._);

    if (args?.help || action === null) {
        // prettier-ignore
        console.log(`${logColorSuccess('clocker - CLoud doCKER')} 
v${VERSION}

Usage ${logColorCommand('clocker ARGS FLAGS')}

General
    ${logColorCommand('init')}                                      Initialize clocker
    ${logColorCommand('list')}                                      List all servers with state
    
Provider ${logColorCommand('clocker provider ...')}  
    ${logColorCommand('add')}                                       Configure a new provider       
    
Server ${logColorCommand('clocker server ...')}    
    ${logColorCommand('add')}                                       Configure a new remote cloud server
    ${logColorCommand('start SERVER-ID')}                           Start a server
    ${logColorCommand('stop SERVER-ID')}                            Stop a server
    ${logColorCommand('eject SERVER-ID TARGET-PATH')}               Move all server configuration to target
    ${logColorCommand('deploy SERVER-ID DOCKER-COMPOSE-FILE')}      Deploy a docker-compose file to a server
    ${logColorCommand('remove SERVER-ID')}                          Remove a server completely
    
Flags
    ${logColorCommand('--version')}                                 Show clocker version
    ${logColorCommand('--help')}                                    Show this documentation

Verbose mode
    Add ${logColorCommand('--verbose')} to any command to see in detail what clocker is doing.
`);
        return;
    }

    try {
        if (action.name !== 'init' && !checkInit()) {
            throw new IncompleteInitializationException();
        }
    } catch (e) {
        if (e instanceof Exception) {
            console.log('\n');
            e.printErrors();
            return;
        }
        logError(e);
    }

    const argBag = getActionArgBag(args._, action);
    if (argBag === null) {
        return;
    }

    try {
        await action.action(argBag);
    } catch (e) {
        if (e instanceof Exception) {
            console.log('\n');
            e.printErrors();
            return;
        }
        logError(e);
    }
};

const argv = minimist(process.argv.slice(2));
run(argv);
