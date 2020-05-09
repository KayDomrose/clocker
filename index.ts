#!/usr/bin/env node

import minimist from "minimist";
import add from "./src/actions/add";
import init from "./src/actions/init";
import {BASE_PATH, VERSION} from "./src/variables";
import {logColorCommand, logColorSuccess, logSuccess} from "./src/helpers/log";
import list from "./src/actions/list";
import start from "./src/actions/start";
import stop from "./src/actions/stop";

const actions: {[k: string]: {(args: minimist.ParsedArgs):void}} = {
    'init': init,
    'add': add,
    'list': list,
    'start': start,
    'stop': stop,
}

const run = (args: minimist.ParsedArgs) => {
    if (args?.version) {
        console.log(VERSION);
        return;
    }

    if (args._.length === 0 || !Object.keys(actions).includes(args._[0]) || args?.help) {
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
`)
        return;
    }

    actions[args._[0]](args);
};

const argv = minimist(process.argv.slice(2));
run(argv);
