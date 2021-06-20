export enum Genre {
  Dance = 'dance',
  Ballet = 'Ballet',
  Classical = 'classical',
  Contemporary = 'contemporary',
  Family = 'family',
  Theatre = 'theatre',
  Networking = 'networking',
  Country = 'country',
  Music = 'music',
  Orchestra = 'orchestra',
  Opera = 'opera',
  Poetry = 'poetry'
}

export const GenreMap: { [index in Genre]: string } = {
  [Genre.Dance]: 'Dance',
  [Genre.Classical]: 'Classical',
  [Genre.Contemporary]: 'Contemporary',
  [Genre.Family]: 'Family',
  [Genre.Theatre]: 'Theatre',
  [Genre.Networking]: 'Networking',
  [Genre.Ballet]: 'Ballet',
  [Genre.Country]: 'Country Music',
  [Genre.Music]: 'Music',
  [Genre.Orchestra]: 'Orchestral',
  [Genre.Opera]: 'Opera',
  [Genre.Poetry]: 'Poetry'
};
