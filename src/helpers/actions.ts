import init from '../actions/init';
import list from '../actions/list';
import serverAdd from '../actions/server-add';
import serverStart from '../actions/server-start';
import serverStop from '../actions/server-stop';
import serverRemove from '../actions/server-remove';
import deploy from '../actions/deploy';
import serverEject from '../actions/server-eject';
import { logColorCommand, logError } from './log';
import { Action, ArgBag } from '../clocker';

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
        namespace: 'server',
        name: 'add',
        action: serverAdd,
    },
    {
        namespace: 'server',
        name: 'start',
        args: ['serverId'],
        action: serverStart,
    },
    {
        namespace: 'server',
        name: 'stop',
        args: ['serverId'],
        action: serverStop,
    },
    {
        namespace: 'server',
        name: 'remove',
        args: ['serverId'],
        action: serverRemove,
    },
    {
        namespace: 'server',
        name: 'deploy',
        args: ['serverId', 'composeFile'],
        action: deploy,
    },
    {
        namespace: 'server',
        name: 'eject',
        args: ['serverId', 'targetPath'],
        action: serverEject,
    },
];

export const findAction = (args: string[]): Action | null => {
    if (args.length === 0) {
        return null;
    }

    const action = actions.find(
        (a) => a.name === args[0] || (a.namespace === args[0] && a.name === args[1])
    );

    return action || null;
};

export const getActionArgBag = (args: string[], action: Action): ArgBag | null => {
    if (!action.args) {
        return {};
    }

    const ignoreCount = action.namespace !== undefined ? 2 : 1;
    const argsWithOutAction = args.splice(ignoreCount);

    for (let i = 0; i < action.args.length; i++) {
        if (argsWithOutAction.length <= i) {
            logError(`Missing argument ${action.args[i]}`);
            console.log(logColorCommand(`clocker ${action.name} ${action.args.join(' ')}`));
            return null;
        }
    }

    const argsBag: { [key: string]: string } = {};
    action.args.forEach((argKey, index) => {
        argsBag[argKey] = argsWithOutAction[index];
    });
    return argsBag;
};
