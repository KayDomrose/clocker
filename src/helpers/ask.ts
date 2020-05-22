import prompts, { Options, PromptObject } from 'prompts';
import UserPromptAboardException from '../exceptions/UserPromptAboardException';

const ask = async <T>(questions: PromptObject | PromptObject[]): Promise<T> => {
    const options: Options = {
        onCancel: () => {
            throw new UserPromptAboardException();
        },
    };

    return (await prompts(questions, options)) as T;
};

export default ask;
