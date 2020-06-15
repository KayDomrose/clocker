import Exception from './Exception';
import { logColorError, logError } from '../helpers/log';

export default class ServerNotFoundException extends Exception {
    constructor(serverId: string) {
        super([logColorError(`Server config not found for ${serverId}`)]);
    }
}
