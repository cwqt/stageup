/**
 * @description Returns the UNIX timestamp of date in seconds
 * @param date
 */
export const unixTimestamp = (date?: Date): number => Math.floor((date || new Date()).getTime() / 1000);
