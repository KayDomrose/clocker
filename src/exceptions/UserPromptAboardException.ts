import Exception from './Exception';
import { logColorError } from '../helpers/log';

export default class UserPromptAboardException extends Exception {
    constructor() {
        super([logColorError('Aboard')]);
    }
}
