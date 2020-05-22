import Exception from '../../exceptions/Exception';
import { logColorError } from '../../helpers/log';

export default class DOUniqueServerException extends Exception {
    constructor() {
        super([
            logColorError(`Can't create additional servers on DigitalOcean`),
            'Due to how DigitalOcean and clocker are handling ssh keys, its not possible to create more than one DigitalOcean server at the moment.',
            'For more information, see https://github.com/KayDomrose/clocker/issues/10.',
        ]);
    }
}
