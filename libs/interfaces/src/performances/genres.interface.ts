export enum Genre {
  Dance = 'dance',
  Classical = 'classical',
  Contemporary = 'contemporary',
  Family = 'family',
  Theatre = 'theatre'
}

export const GenreMap: { [index in Genre]: string } = {
  [Genre.Dance]: 'Dance',
  [Genre.Classical]: 'Classical',
  [Genre.Contemporary]: 'Contemporary',
  [Genre.Family]: 'Family',
  [Genre.Theatre]: 'Theatre'
};
