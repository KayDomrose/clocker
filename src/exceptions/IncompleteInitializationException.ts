import Exception from './Exception';
import { logColorCommand, logColorError } from '../helpers/log';

export default class IncompleteInitializationException extends Exception {
    constructor() {
        super([
            logColorError('clocker is not initialized'),
            `Run ${logColorCommand('clocker init')} to initialize.`,
        ]);
    }
}
