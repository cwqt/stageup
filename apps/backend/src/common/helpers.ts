import { NUUID } from '@core/interfaces';
import { nanoid } from 'nanoid'

/**
 * @description Returns the UNIX timestamp of date in seconds
 * @param date
 */
export const timestamp = (date?: Date): number => Math.floor((date || new Date()).getTime() / 1000);

/**
 * @description Generate a unique identifier which is as long as a YouTube ID
 */
export const uuid = () => nanoid(11) as NUUID;

