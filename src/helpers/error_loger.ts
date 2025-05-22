import { log } from '@clack/prompts';

/**
 * Унифицированный логгер для ошибок
 * @param context Описание контекста, в котором произошла ошибка
 * @param error Объект ошибки
 */
export function logError(context: string, error: unknown) {
	if (error instanceof Error) {
		log.error(`${context}: ${error.message}`);
	} else if (typeof error === 'string') {
		log.error(`${context}: ${error}`);
	} else {
		log.error(`${context}: Произошла неизвестная ошибка ${error}`);
	}
}
