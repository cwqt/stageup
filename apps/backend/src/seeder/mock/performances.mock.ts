import { sample, timestamp, to } from '@core/helpers';
import {
  CurrencyCode,
  DtoCreatePerformance,
  DtoCreateTicket,
  Genre,
  PerformanceType,
  TicketType
} from '@core/interfaces';
import faker from 'faker';
import { SeederHostName } from './hosts.mock';
import moment from 'moment';

export type SeedMockPerformance = DtoCreatePerformance & { hostusername: SeederHostName; thumbnail?: string };


const ticketFactory = (): DtoCreateTicket => ({
  name: sample(['My Cool Ticket', 'Early Access', 'VIP Special', 'Super Star', 'Patron ticket']),
  type: TicketType.Paid,
  quantity: faker.datatype.number(),
  is_quantity_visible: faker.datatype.boolean(),
  currency: CurrencyCode.GBP,
  amount: 1000,
  start_datetime: timestamp(),
  end_datetime: moment().add(7, 'days').unix(),
  // fees: TicketFees.Absorb,
  is_visible: true,
  // dono_pegs: []
});

export const allTickets: DtoCreateTicket[] = [];
for (let i = 0; i < 20; i++) {
  allTickets.push(ticketFactory());
}

export default to<Array<SeedMockPerformance>>([
  {
    name: 'Coriolanus directed by Angus Jackson',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description:
      'Sope Dirisu took on the title role in this hard-hitting modern-dress production of Coriolanus.',
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail:
      'https://cdn2.rsc.org.uk/sitefinity/images/productions/2017-shows/coriolanus/production-photos/coriolanus-production-photos_-2017_2017_photo-by-helen-maybanks-_c_-rsc_231890.tmb-gal-670.jpg?sfvrsn=8d873521_1'
  },
  {
    name: 'Julius Caesar directed by Angus Jackson',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description:
      'Andrew Woodall took the title role in this production of Julius Caesar from the 2017 Rome Season.',
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail:
      'https://cdn2.rsc.org.uk/sitefinity/images/productions/2017-shows/julius-caesar/production-photos/julius-caesar-production-images_-2017_2017_photo-by-helen-maybanks-_c_-rsc_214262.tmb-img-1824.jpg?sfvrsn=b7532a21_1'
  },
  {
    name: 'Titus Andronicus directed by Blanche McIntyre',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description:
      'David Troughton took on the title role in this gruesome and bloody performance of Titus Andronicus.',
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail:
      'https://cdn2.rsc.org.uk/sitefinity/images/productions/2017-shows/Titus-Andronicus/production-photos/titus-andronicus-production-photos_-2017_2017_photo-by-helen-maybanks-(c)rsc_222092.tmb-img-1824.jpg?sfvrsn=91a63121_1'
  },
  {
    name: 'Twelfth Night directed by Christopher Luscombe',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description:
      'This sumptuous production of Twelfth Night featured Adrian Edmondson as the hapless Malvolio and Kara Tointon as his love interest Olivia.',
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail:
      'https://cdn2.rsc.org.uk/sitefinity/images/productions/2017-shows/twelfth-night/Production-photos/twelfth-night-production-photos_-2017_2017_photo-by-manuel-harlan-_c_-rsc_234093.tmb-img-1824.jpg?sfvrsn=4db53721_1'
  },
  {
    name: 'Troilus and Cressida directed by Gregory Doran',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description:
      'Virtuoso percussionist Evelyn Glennie collaborated with Gregory Doran to create a futuristic vision of a world resounding with the rhythm of battle.',
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail:
      'https://cdn2.rsc.org.uk/sitefinity/images/productions/2018-shows/troilus-and-cressida/production-photos/troilus-and-cressida-production-photographs_-2018_2018_photo-by-helen-maybanks-_c_-rsc-_265340.tmb-img-1824.jpg?sfvrsn=b4610921_1'
  },
  {
    name: 'The Merry Wives of Windsor directed by Fiona Laird',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description:
      "'The Only Way is Windsor' in Fiona Laird's modern take on this much-loved comedy.",
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail:
      'https://cdn2.rsc.org.uk/sitefinity/images/productions/2018-shows/the-merry-wives-of-windsor/production-photos/the-merry-wives-of-windsor-production-photos_-2018_2018_photo-by-manuel-harlan-_c_-rsc_258185.tmb-img-1824.jpg?sfvrsn=39600421_1'
  },
  {
    name: 'Macbeth directed by Polly Findlay',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description:
      "This production marked Christopher Eccleston's RSC debut and the return of Niamh Cusack to the Company.",
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail:
      'https://cdn2.rsc.org.uk/sitefinity/images/productions/2018-shows/macbeth/Macbeth-production-photos/macbeth_production_photos__2018_2018_photo_by_richard_davenport__c__rsc_245632-1.tmb-img-1824.jpg?sfvrsn=3bbb3c21_1'
  },
  {
    name: "2018 - Timon of Athens directed by Simon Godwin",
    description: "Kathryn Hunter took the title role of Timon in this production, switching the gender of the central character.",
    thumbnail: "https://cdn2.rsc.org.uk/sitefinity/images/productions/2018-shows/timon-of-athens/production-photos/timon-of-athens-production-photographs_-2018_2018_photo-by-simon-annand-_c_-rsc_269082.tmb-img-1824.jpg?sfvrsn=89bd0a21_1",
    publicity_period: { start: 1667260800, end: 1668538800 },
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany'
  },
  {
    name: "2018 - Romeo and Juliet directed by Erica Whyman",
    description: "This contemporary production played in the Royal Shakespeare Theatre, the Barbican in London, and on a 2019 national tour. The show featured Bally Gill and Karen Fishwick in the title roles, and used young people from the different regions visited to perform as the Chorus alongside the professional cast. In 2019, the tour visited Norwich, Newcastle, Bradford, Nottingham, Blackpool, Cardiff and Glasgow.",
    thumbnail: "https://cdn2.rsc.org.uk/sitefinity/images/productions/2018-shows/romeo-and-juliet/romeo-and-juliet-production-photos/romeo-and-juliet-production-photos_-2018-_2018_photo-by-topher-mcgrillis-_c_-rsc_249070.tmb-img-1824.jpg?sfvrsn=cc1a0121_1",
    publicity_period: { start: 1667260800, end: 1668538800 },
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany'
  },
  {
    name: "2019 - King John directed by Eleanor Rhode",
    description: "A MAD WORLD OF MAD KINGS, TEETERING ON THE BRINK OF DISASTER. Richard the Lionheart is dead. His brother John is King of England. Threatened from all sides by Europe, the English noblemen and even his own family, King John will stop at nothing to keep hold of his crown. Shakespeare�s rarely performed tale of a nation in turmoil vibrates with modern resonance in this vivid new production by Director Eleanor Rhode in her debut at the RSC.",
    thumbnail: "https://cdn2.rsc.org.uk/sitefinity/images/productions/2019-shows/king-john/king-john-production-photos/king-john-production-photos_2019_295207.tmb-img-1824.jpg?sfvrsn=1466ec21_1",
    publicity_period: { start: 1667260800, end: 1668538800 },
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany'
  },
  {
    name: "2019 - As You Like It directed by Kimberley Sykes",
    description: "This playful production combined the worlds of theatre and nature to create the Forest of Arden.",
    thumbnail: "https://cdn2.rsc.org.uk/sitefinity/images/productions/2019-shows/as-you-like-it/production-photos/_as-you-like-it-production-photos_-2019_2019_photo-by-topher-mcgrillis-_c_-rsc_273366.tmb-img-1824.jpg?sfvrsn=7dd31021_1",
    publicity_period: { start: 1667260800, end: 1668538800 },
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany'
  },
  {
    name: "2019 - Measure for Measure directed by Gregory Doran",
    description: "Our Artistic Director, Gregory Doran found contemporary resonance in this 'problem play' through its links with the #MeToo movement.",
    thumbnail: "https://cdn2.rsc.org.uk/sitefinity/images/productions/2019-shows/measure-for-measure/production-photos/measure-for-measure-production-photos_-2019_2019_photo-by-helen-maybanks-_c_-rsc_286064.tmb-img-1824.jpg?sfvrsn=f561e021_1",
    publicity_period: { start: 1667260800, end: 1668538800 },
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany'
  },
  {
    name: "2019 - The Taming of the Shrew directed by Justin Audibert",
    description: "This gender-swapped production turned Shakespeare's fierce, energetic comedy on its head to offer a fresh perspective on its portrayal of hierarchy and power.",
    thumbnail: "https://cdn2.rsc.org.uk/sitefinity/images/productions/2019-shows/the-taming-of-the-shrew/production-photos/the-taming-of-the-shew_-productions-photos_-2019_2019_photo-by-ikin-yum-_c_-rsc_274860.tmb-img-1824.jpg?sfvrsn=f6821221_1",
    publicity_period: { start: 1667260800, end: 1668538800 },
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany'
  },
  {
    name: 'Chicago (1996 revival)',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Chicago is an American musical with music by John Kander, lyrics by Fred Ebb, and book by Ebb and Bob Fosse. Set in Chicago in the jazz age, the musical is based on a 1926 play of the same name by reporter Maurine Dallas Watkins, about actual criminals and the crimes on which she reported. The story is a satire on corruption in the administration of criminal justice and the concept of the "celebrity criminal".`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'RSCompany',
    thumbnail: 'https://absolutely.london/wp-content/uploads/2018/07/CHICAGO-REVIEW-1068x712.jpg'
  },
  {
    name: 'The Lion King',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `The Lion King is a musical based on the 1994 Walt Disney Animation Studios\' animated feature film of the same name with music by Elton John, lyrics by Tim Rice, and book by Roger Allers and Irene Mecchi, along with additional music and lyrics by Lebo M, Mark Mancina, Jay Rifkin, Julie Taymor, and Hans Zimmer.[1] Directed by Taymor, the musical features actors in animal costumes as well as giant, hollow puppets. The show is produced by Disney Theatrical Productions`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'https://res.cloudinary.com/solt/image/upload/q_80:420,fl_progressive,w_600,f_auto/v1542394010/TLK_London_-_Andile_Gumbi_as_Simba_Photo_by_Johan_Persson_s_zjpk9c.jpg'
  },
  {
    name: 'Cats',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Cats is a sung-through musical composed by Andrew Lloyd Webber, based on the 1939 poetry collection Old Possum's Book of Practical Cats by T. S. Eliot. It tells the story of a tribe of cats called the Jellicles and the night they make the "Jellicle choice," deciding which cat will ascend to the Heaviside Layer and come back to a new life. The musical includes the well-known song "Memory" as sung by Grizabella. As of 2019, Cats remains the fourth-longest-running Broadway show and the sixth-longest-running West End show.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'https://assets.teenvogue.com/photos/5d34abc9d4f0850008e33d4f/16:9/w_2560%2Cc_limit/GettyImages-584925310.jpg'
  },
  {
    name: 'Wicked',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Wicked is a Broadway musical, with music and lyrics by Stephen Schwartz and book by Winnie Holzman. It is based on the 1995 Gregory Maguire novel Wicked: The Life and Times of the Wicked Witch of the West, itself a retelling of the classic 1900 novel, The Wonderful Wizard of Oz by L. Frank Baum and the 1939 Metro-Goldwyn-Mayer film The Wizard of Oz.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'https://bsp-static.playbill.com/dims4/default/1a96422/2147483647/crop/4064x2288%2B0%2B221/resize/970x546/quality/90/?url=http%3A%2F%2Fpb-asset-replication.s3.amazonaws.com%2Fbb%2F5c%2F2f3a712f4adf95e351f6fe35c63f%2Fwickedmenzwitch.jpg'
  },
  {
    name: 'Les Misérables',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Les Misérables (/leɪ ˌmɪzəˈrɑːb(lə)/; French pronunciation: ​[le mizeʁabl(ə)]), colloquially known as Les Mis or Les Miz (/leɪ ˈmɪz/), is a sung-through musical adaptation of Victor Hugo's 1862 novel of the same name, by Claude-Michel Schönberg (music), Alain Boublil and Jean-Marc Natel (original French lyrics), and Herbert Kretzmer (English lyrics). The original French musical premiered in Paris in 1980 with direction by Robert Hossein. Its English-language adaptation by producer Cameron Mackintosh has been running in London since October 1985, making it the longest-running musical in the West End and the second longest-running musical in the world after the original Off-Broadway run of The Fantasticks.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://media.tacdn.com/media/attractions-splice-spp-674x446/0a/b2/b3/67.jpg'
  },
  {
    name: 'A Chorus Line',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `A Chorus Line is a musical with music by Marvin Hamlisch, lyrics by Edward Kleban, and a book by James Kirkwood Jr. and Nicholas Dante. Set on the bare stage of a Broadway theater, the musical is centered on seventeen Broadway dancers auditioning for spots on a chorus line. A Chorus Line provides a glimpse into the personalities of the performers and the choreographer, as they describe the events that have shaped their lives and their decisions to become dancers.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'data:image/jpeg;base64,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'
  },
  {
    name: 'Oh! Calcutta! (1976 revival)',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Oh! Calcutta! is an avant-garde theatrical revue created by British drama critic Kenneth Tynan. The show, consisting of sketches on sex-related topics, debuted Off-Broadway in 1969 and then in the West End in 1970. It ran in London for over 3,900 performances, and in New York initially for 1,314. Revivals enjoyed even longer runs, including a Broadway revival that ran for 5,959 performances, making the show the longest-running revue in Broadway history at the time.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://images.mubicdn.net/images/film/62323/cache-226527-1496209367/image-w1280.jpg'
  },
  {
    name: 'Mamma Mia!',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Mamma Mia! (promoted as Benny Andersson & Björn Ulvaeus' Mamma Mia!) is a jukebox musical written by British playwright Catherine Johnson, based on the songs of ABBA composed by Benny Andersson and Björn Ulvaeus, former members of the band. The title of the musical is taken from the group's 1975 chart-topper "Mamma Mia". Ulvaeus and Andersson, who composed the original music for ABBA, were involved in the development of the show from the beginning. Singer Anni-Frid Lyngstad was involved financially in the production and she was also present at many of the premieres around the world.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'https://res.cloudinary.com/dwzhqvxaz/f_auto,q_auto,fl_progressive/v1587486649/Titles/Mamma%20Mia/MammaMia_Prod_2560x1440.jpg'
  },
  {
    name: 'Beauty and the Beast',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Beauty and the Beast is a musical with music by Alan Menken, lyrics by Howard Ashman and Tim Rice, and book by Linda Woolverton. Adapted from Walt Disney Pictures' Academy Award-winning 1991 animated musical film of the same name – which in turn had been based on the classic French fairy tale by Jeanne-Marie Leprince de Beaumont –[1] Beauty and the Beast tells the story of a cold-blooded prince who has been magically transformed into an unsightly creature as punishment for his selfish ways. To revert into his true human form, the Beast must first learn to love a bright, beautiful young woman whom he has imprisoned in his enchanted castle before it is too late.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://www.mtishows.com/sites/default/files/show/hero/000262_hero.jpg'
  },
  {
    name: 'Rent',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Rent (stylized as RENT) is a rock musical with music, lyrics, and book by Jonathan Larson,[1] loosely based on Giacomo Puccini's 1896 opera La Bohème. It tells the story of a group of impoverished young artists struggling to survive and create a life in Lower Manhattan's East Village in the thriving days of bohemian Alphabet City, under the shadow of HIV/AIDS.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/redux-h-15171880-1548351136.jpg'
  },
  {
    name: 'Jersey Boys',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Jersey Boys is a 2005 jukebox musical with music by Bob Gaudio, lyrics by Bob Crewe, and book by Marshall Brickman and Rick Elice. It is presented in a documentary-style format that dramatizes the formation, success and eventual break-up of the 1960s rock 'n' roll group The Four Seasons. The musical is structured as four "seasons", each narrated by a different member of the band who gives his own perspective on its history and music. Songs include "Big Girls Don't Cry", "Sherry", "December 1963 (Oh, What A Night)", "My Eyes Adored You", "Stay", "Can't Take My Eyes Off You", "Who Loves You", "Working My Way Back to You" and "Rag Doll", among others.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'https://broadway.showtickets.com/cdn/img/articles/broadway/5-things-we-love-about-the-new-jersey-boys/jersey-boys-600.jpg'
  },
  {
    name: 'Miss Saigon',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Miss Saigon is a musical by Claude-Michel Schönberg and Alain Boublil, with lyrics by Boublil and Richard Maltby Jr. It is based on Giacomo Puccini's 1904 opera Madame Butterfly, and similarly tells the tragic tale of a doomed romance involving an Asian woman abandoned by her American lover. The setting of the plot is relocated to 1970s Saigon during the Vietnam War, and Madame Butterfly's story of marriage between an American lieutenant and a geisha is replaced by a romance between a United States Marine and a seventeen-year-old South Vietnamese bargirl.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'https://www.thetimes.co.uk/imageserver/image/%2Fmethode%2Fsundaytimes%2Fprod%2Fweb%2Fbin%2Fb8919b62-b99c-11e7-a88a-7ceda98474bd.jpg?crop=2667%2C1500%2C0%2C0&resize=1180'
  },
  {
    name: 'The Book of Mormon',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `The Book of Mormon is a musical comedy with music, lyrics, and book by Trey Parker, Robert Lopez, and Matt Stone. First staged in 2011, the play is a satirical examination of the beliefs and practices of The Church of Jesus Christ of Latter-day Saints. The musical ultimately endorses the positive power of love and service.[1] Parker and Stone were best known for creating the animated comedy South Park; Lopez had co-written the music for the musical Avenue Q.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://qcitymetro.com/wp-content/uploads/2018/07/BookOfMormon2.jpg'
  },
  {
    name: '42nd Street',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `42nd Street is a musical with a book by Michael Stewart and Mark Bramble, lyrics by Al Dubin and Johnny Mercer and music by Harry Warren. The 1980 Broadway production won the Tony Award for Best Musical and became a long-running hit. The show was produced in London in 1984 (winning the Olivier Award for Best Musical) and its 2001 Broadway revival won the Tony for Best Revival.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'https://www.londontheatre.co.uk/sites/default/files/styles/w697/public/42nd-Street---Clare-Halse-%26-company-3---cBrinkhoff-%26-Moegenburg.jpg?itok=cm-0HLV7'
  },
  {
    name: 'Grease',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Grease is a 1971 musical by Jim Jacobs and Warren Casey with additional songs written by John Farrar. Named after the 1950s United States working-class youth subculture known as greasers, the musical is set in 1959 at fictional Rydell High School[1] (based on William Howard Taft School in Chicago, Illinois[2] and named after Bobby Rydell) and follows ten working-class teenagers as they navigate the complexities of peer pressure, politics, personal core values, and love. The score borrows heavily from the sounds of early rock and roll. In its original production in Chicago, Grease was a raunchy, raw, aggressive, vulgar show. Subsequent productions sanitized it and toned it down.[3] The show mentions social issues such as teenage pregnancy, peer pressure and gang violence; its themes include love, friendship, teenage rebellion, sexual exploration during adolescence, and, to some extent, class consciousness and class conflict. Jacobs described the show's basic plot as a subversion of common tropes of 1950s cinema, since the female lead, who in many 1950s films transformed the alpha male into a more sensitive and sympathetic character, is instead drawn into the man's influence and transforms into his fantasy.[4]`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://theedinburghreporter.co.uk/wp-content/uploads/2017/09/Grease-03.jpg'
  },
  {
    name: 'Fiddler on the Roof',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Fiddler on the Roof is a musical with music by Jerry Bock, lyrics by Sheldon Harnick, and book by Joseph Stein, set in the Pale of Settlement of Imperial Russia in or around 1905. It is based on Tevye and his Daughters (or Tevye the Dairyman) and other tales by Sholem Aleichem. The story centers on Tevye, a milkman in the village of Anatevka, who attempts to maintain his Jewish religious and cultural traditions as outside influences encroach upon his family's lives. He must cope with the strong-willed actions of his three older daughters who wish to marry for love; their choices of husbands are successively less palatable for Tevye. An edict of the Tsar eventually evicts the Jews from their village.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://s3.amazonaws.com/ingeveb/images/download_190415_205621.jpg'
  },
  {
    name: 'Life With Father',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Life with Father is a 1939 play by Howard Lindsay and Russel Crouse, adapted from a humorous autobiographical book of stories compiled in 1935 by Clarence Day. The Broadway production ran for 3,224 performances over 401 weeks to become the longest-running non-musical play on Broadway, a record that it still holds.[1] The play was adapted into a 1947 feature film and a television series.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://i.ytimg.com/vi/Udyx4pbeZA8/maxresdefault.jpg'
  },
  {
    name: 'Tobacco Road',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Tobacco Road is a play by Jack Kirkland first performed in 1933, based on the 1932 novel of the same name by Erskine Caldwell. The play ran on Broadway for a total of 3,182 performances, surpassing Abie's Irish Rose to become the longest-running play in history at the time.[1][2] As of 2018, it was still the 19th longest-running Broadway show in history, as well as being the second-longest running non-musical ever on Broadway.[3]`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail: 'https://www.londontheatre1.com/wp-content/uploads/2019/02/tobacco-road1-1200.jpg'
  },
  {
    name: 'Hello, Dolly!',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Hello, Dolly! is a 1964 musical with lyrics and music by Jerry Herman and a book by Michael Stewart, based on Thornton Wilder's 1938 farce The Merchant of Yonkers, which Wilder revised and retitled The Matchmaker in 1955. The musical follows the story of Dolly Gallagher Levi, a strong-willed matchmaker, as she travels to Yonkers, New York, to find a match for the miserly "well-known unmarried half-a-millionaire" Horace Vandergelder.`,
    genre: Genre.Theatre,
    type: PerformanceType.Vod,
    hostusername: 'NationalTheatre',
    thumbnail:
      'data:image/jpeg;base64,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'
  },
  // {
  //   name: 'The Wood',
  //   publicity_period: { start: 11/11/2021, end: 21/11/2021 }0,
  //   description: `"Written by Owen Thomas • Directed By Peter Doran based on an idea by Ifan Huw Dafydd

  //   “A tale of friendship, love and sacrifice set against the backdrop of a world in flames...”

  //   From acclaimed Welsh playwright Owen Thomas, writer of the award winning Grav, comes a digitally streamed version of the stage play originally written to commemorate the centenary of the end of World War I. Inspired by a true story.

  //   Originally toured to packed out theatres across Wales in 2018, The Wood is a powerful, moving piece of theatre that lends itself beautifully to the screen. The streamed version reunites the original cast that toured in 2018; Ifan Huw Dafydd as Dan and Gwydion Rhys as Billy, alongside the original creative team; Director Peter Doran and Designer Sean Crowley.

  //   The Wood was recorded on stage as live at the Torch Theatre, Milford Haven, under Covid-19 guidelines during lockdown 2021."`,
  //   genre: Genre.Theatre,
  //   type: PerformanceType.Live,
  //   hostusername: 'AberAC',
  //   thumbnail:
  //     'https://www.aberystwythartscentre.co.uk/sites/aberarts/files/styles/large/public/thumbnails/wood%20thumbnail_0.jpg?itok=wLABPZu4'
  // },
  {
    name: 'The Killer Question',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `The Silence Of The Lambs meets Last Of The Summer Wine in dark comedy thriller THE KILLER QUESTION...

    Former game show champion Walter Crump lives for murder (it was even his specialist subject on the nerve shredding, general knowledge quiz show The Chair). But did his obsession with death ultimately lead to his own? That’s certainly what Inspector Black believes, and now it is Crump’s dopey widow Margaret who finds herself in the chair – accused of her husband’s murder. But as shocking details emerge about the events leading up to Walter’s final head to head, it quickly transpires that what started out as an open and shut case has turned into another game altogether: the cat and mouse variety, with more than one deadly twist in the tale.

    Will Inspector Black solve the mystery? Will Margaret be home in time for Country File? Who will prove to be the ultimate victim of The Chair? And, just as important, which actor will play which character…the audience decides!
    `,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'AberAC',
    thumbnail:
      'https://www.aberystwythartscentre.co.uk/sites/aberarts/files/styles/large/public/thumbnails/Killer%20Question%20thumbnail.jpg?itok=ZCstzck7'
  },
  {
    name: 'CreativeConversations',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Creative Conversations are 4 quarterly events (Inspired by Creative Cardiff’s Show & Tell Events), hosted by Artis Community. We started the events in 2019, and will continue throughout 2020, at Clwb Y Bont.

    The aim of these events is to give the Creative Community of Pontypridd the opportunity to:

    - Hear from 3 Artists/ Organisations to have 10 -15 minutes to share and talk about their work, ambitions, and to hear about their current & future projects
    - Meet other artists, network and make connections
    - Have an informal creative space to meet
    - To Facilitate Conversations to highlight what we as a Creative Community need, and want to make happen in the community."`,
    genre: Genre.Networking,
    type: PerformanceType.Live,
    hostusername: 'ArtisCC',
    thumbnail: 'https://artiscommunity.org.uk/wp-content/uploads/2020/03/IMG-4792.jpg'
  },
  {
    name: 'Giselle',
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Brand new touring production for 2020.

    Critics’ Circle Award winning company, Ballet Cymru, present an extraordinary new ballet based on the eternal story of Giselle, the young girl who falls in love with the wrong person and pays a terrible price.

    Ballet Cymru have put their own unique stamp on this tale of love and loss, bringing relevance, poignancy and grittiness to this most romantic of ballets.

    Featuring a new score by acclaimed composer and harpist Catrin Finch whose spellbinding music is interwoven with mesmerizing movement by Ballet Cymru Artistic Director Darius James OBE and Assistant Artistic Director Amy Doughty.

    Don’t miss this once only opportunity to relish some of the best dance in Wales, made in Wales.

    Ballet Cymru is an international touring ballet company for Wales, committed to inclusion and innovation in dance and classical ballet, and to the highest standard of collaboration. The company produce original professional dance performances based in the ballet technique which tour nationally and internationally. Its extensive Access and Outreach programme is committed to breaking down barriers to accessing the arts."`,
    genre: Genre.Ballet,
    type: PerformanceType.Live,
    hostusername: 'BalletCymru',
    thumbnail: 'https://www.courtyard.org.uk/wp-content/uploads/2020/03/Giselle-1024x600.jpg'
  },
  {
    name: `A Midsummer Night's Dream`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Nominated Best Dance Production 2013 at the Theatre Critics of Wales Awards.

    An outstanding adaptation of Shakespeare’s timeless play that features breathtaking choreography danced by some of the finest dancers around. This vibrant and dramatic production features Mendelssohn’s joyous music, choreography by the company’s Artistic Director Darius James and critically acclaimed costumes by Welsh Designer Yvonne Greenleaf.

    The Queen of the Fairies Titania, and Puck the mischievous messenger, inhabit the supernatural fairy kingdom. Bottom and his boot wearing “Rude Mechanicals” present their famous play Pyramus and Thisbe. And finally the lovers, caught in a thrilling web of mistaken identity and confusion finally find their way through the Athenian forest to an unforgettable and joyous reconciliation.
    "`,
    genre: Genre.Classical,
    type: PerformanceType.Live,
    hostusername: 'BalletCymru',
    thumbnail: 'https://welshballet.co.uk/content/uploads/2014/10/midsummer-header1-600x400.jpg'
  },
  {
    name: `Digital Concerts: Mozart`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Matthew Featherstone and Catrin Finch perform Mozart's Concerto for Flute and Harp with BBC NOW and conductor Chloé van Soeterstède.`,
    genre: Genre.Classical,
    type: PerformanceType.Live,
    hostusername: 'BBCNOW',
    thumbnail: 'https://ichef.bbci.co.uk/images/ic/416x234/p09js0mn.jpg'
  },
  {
    name: `"Digital Concerts: Matthew Taylor"`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"BBC NOW perform the world premiere of Matthew Taylor's Symphony No."`,
    genre: Genre.Classical,
    type: PerformanceType.Live,
    hostusername: 'BBCNOW',
    thumbnail: 'https://ichef.bbci.co.uk/images/ic/496x279/p09l37xz.jpg'
  },
  {
    name: `Island in the Stream`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"The Music of Dolly Parton & Kenny Rogers

    Enjoy the songs of the Queen and King of country music - Dolly Parton and Kenny Rogers.

    Leave your 9 to 5 worries at the door and get ready for a night in the company of Country Music Royalty!

    This thigh-slapping stage show brings together the beloved glamour and personality of Dolly, along with Kenny’s charisma and energy with hit after hit including: Jolene, Ruby, 9 to 5, Lucille, Here You Come Again, The Gambler, I Will Always Love You, Coward of the County, plus the smash hit Islands in the Stream.

    Enjoy a superb score and supreme musicianship as we bring the house down with the ultimate tribute to two country music legends.

    This is a tribute show and is no way affiliated with any original artists/estates/management companies or similar shows."`,
    genre: Genre.Country,
    type: PerformanceType.Live,
    hostusername: 'BlackwoodMI',
    thumbnail:
      'https://blackwoodminersinstitute.com/sites/default/files/styles/landscape/public/2020-04/portrait-with-photo-ISLANDS-IN-THE-STREAM.jpg?h=9b95f836&itok=nJodB8Qs'
  },
  {
    name: `Dead Ringer for Love - Meatloaf & Cher`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"This high energy tribute to two of music’s most formidable stars is sure to make your ‘Rock ‘N’ Roll Dreams Come Through’ as we ‘Turn Back Time’ to bring you a celebration of the work of Meatloaf and Cher.

    Let a full live band take you on a journey spanning the careers of two of the eras most globally renowned stars. Combining the epic, operatic goth anthems of Meatloaf and the iconic show-stopping dance hits from the Goddess of Pop, Dead Ringer for Love will have you revelling in power ballads such as I’d Do Anything For Love (But I Won’t Do That) and Two Out of Three Ain’t Bad and dancing to feel-good sensations including If I Could Turn Back Time, Strong Enough and Bat Out of Hell."`,
    genre: Genre.Music,
    type: PerformanceType.Live,
    hostusername: 'BlackwoodMI',
    thumbnail:
      'https://blackwoodminersinstitute.com/sites/default/files/styles/landscape/public/2020-03/Dead-Ringer---Portrait.jpg?h=f1eec285&itok=JrpmGdxv'
  },
  {
    name: `Jonas Kaufmann: My Vienna`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Jonas Kaufmann My Vienna is a deeply personal tribute by the star tenor to the world-famous melodies from the birthplace of waltz and operetta. Filmed live in the magical setting of the Wiener Konzerthaus, the concert features popular Viennese music from Die Fledermaus and Wienerblut by Johann Strauss and Franz Lehår's the Merry Widow, plus many of the classic songs inspired by the city of Vienna. Jonas Kaufmann performs with the Prague Philharmonia orchestra under the baton of Maestro Jochen Rieder and is joined by the internationally acclaimed soprano Rachel Willis-Sørensen.`,
    genre: Genre.Orchestra,
    type: PerformanceType.Live,
    hostusername: 'CUC',
    thumbnail: 'http://www.ucheldre.org/upload/jkaufmannwiencopy.jpg'
  },
  {
    name: `Tempted`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Tempted is a forum theatre production that discusses sexual exploitation of young people – reflecting young people’s concerns and status. Produced in collaboration with Dyfed-Powys Police and crime commissioner. Tempted is currently nominated for two Arts & Business Cymru awards.

    “…fast paced, energetic and thoroughly engaging. A sensitive performance, based a very serious and current issue with teenagers… Our pupils (and staff) talked about this performance for the rest of the day! Please come back next year!” – Athro / Teacher"`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'CwmniTheatr',
    thumbnail: 'https://pbs.twimg.com/media/EEkoEWOWkAA29nI?format=jpg&name=4096x4096'
  },
  {
    name: `Faust + Greta`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Greta is out with friends when she meets the chancer Faust. But with darker forces at play, a bit of harmless flirting leads to an irreversible journey of destruction.

    Faust + Greta is a tragic and twisted love story that sees the original German tale re-imagined in an amped-up, contemporary Wales. Devised and performed by an ensemble of young people coming out of lockdown, this digital theatrical experience is about the human obsession with wanting more, seizing power and pushing boundaries to extremes.

    Inspired by T. Gwynn Jones’s Welsh translation of Goethe’s classic, Faust + Greta will embrace social distancing limitations to offer a completely new, experimental, and unexpected theatrical experience.

    Staged in an empty theatre, a dark and devious world, and new experiences beckon. How far can we tempt you?"`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'CFW',
    thumbnail: 'http://www.franwen.com/wp-content/uploads/2020/08/DelweddYnUnig.jpg'
  },
  {
    name: `"The Rheingans Sisters"`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"The Rheingans Sisters make playful, powerful and richly connecting music that is wholly contemporary while deeply anchored in folk traditions. The award-winning multi-instrumentalists, composers and folk scholars are nominated for 'Best Duo/Group' at 2019 BBC Radio 2 Folk Awards.

    Over the last five years, three critically acclaimed albums and a BBC Radio 2 Folk Award win for 'Best Original Track' in 2016, audiences across the UK, Europe and Australia have been utterly captivated by their very special live performances. Drawing on their pan-European musical scholarship and their spirited mission to make connections between the music of different geographical roots, they have developed a rich artistic approach to the deconstruction and reimagining of traditional music alongside their own beguiling compositions.

    Performing live, the sisters are inimitable; full-hearted performers and spontaneous, on-stage improvisors, with the adventurous use of fiddles, voices, banjo, bansitar, tambourin à cordes, spoken word, dancing feet and percussion.

    A unique and unmissable act on the folk and world music stage today, Rowan and Anna play a plethora of instruments in their live shows, many of them handmade by their luthier father Helmut Rheingans who is based in their native Peak District home.

    The Rheingans Sisters released their much anticipated fourth album 'Receiver' in 2020 on the Bendigedig Label. "`,
    genre: Genre.Music,
    type: PerformanceType.Live,
    hostusername: 'GCC',
    thumbnail:
      'https://d235gwso45fsgz.cloudfront.net/as-assets/variants/o76dxtqn1deb716maxylmaim5pz4/d82b4c5034021c15162868846a860fc142237fb62f146ef228d6181ef8a17941'
  },
  {
    name: `Calan`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `They breathe fire into the old traditions with their evocative rhythms and lively routines before slowing down with some of the most beautiful songs as they explore the magic and myths of Wales. They have successfully introduced traditional Welsh music to a new wave of music lovers, in Wales, Europe, North America and beyond.`,
    genre: Genre.Music,
    type: PerformanceType.Live,
    hostusername: 'GCC',
    thumbnail:
      'https://d235gwso45fsgz.cloudfront.net/as-assets/variants/t7n9XzriKZRmXKWVG56nv6JU/d82b4c5034021c15162868846a860fc142237fb62f146ef228d6181ef8a17941'
  },
  {
    name: `Meet Fred`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Meet Fred, the two foot tall cloth puppet that fights prejudice every day.

    He just wants to be a regular guy, part of the real world, to get a job and meet a girl, but when threatened with losing his PLA (Puppetry Living Allowance), Fred’s life begins to spiral out of his control. Contains strong language and puppet nudity."`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'HijinxTheatre',
    thumbnail:
      'https://images.squarespace-cdn.com/content/v1/5321daaae4b0740a41873481/1536915320470-P67OJ2OD34H6BTFY00BC/ke17ZwdGBToddI8pDm48kDdnEN61tOLS9SG2TKMzcSpZw-zPPgdn4jUwVcJE1ZvWQUxwkmyExglNqGp0IvTJZamWLI2zvYWH8K3-s_4yszcp2ryTI0HqTOaaUohrI8PIQIeWurnuV3SleL-V7wOOKtkVkwN6WiQ6GXNm2XliR9kKMshLAGzx4R3EDFOm1kBS/FredBanner.jpg'
  },
  {
    name: `Sounds of Summer`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `An eclectic mix of joyful, entertaining and uplifting musical treats, from the world of song, opera and cabaret, and much else besides!`,
    genre: Genre.Opera,
    type: PerformanceType.Live,
    hostusername: 'MidWalesOpera',
    thumbnail: 'https://www.midwalesopera.co.uk/files/assets/uploads/2021/05/sounds-of-summer-logo.jpg'
  },
  {
    name: `Y Tŵr`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"In our new creative collaboration with Theatr Genedlaethol Cymru, composer Guto Puw and singer-songwriter-playwright Gwyneth Glyn breathe new life into Gwenlyn Parry’s disturbing and provocative play.

    The result is an intense and intimate story of love and life based on the work of one of Wales’ most important playwrights, reimagined in new form as a touching and lyrical Welsh language chamber opera."`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'MusicTheatreWales',
    thumbnail: 'https://www.musictheatre.wales/assets/images/productions/y-twr/YTwr_1200x800.jpg'
  },
  {
    name: `A Mighty Wind`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `NDCWales presents A Mighty Wind, by Jeroen Verbruggen, one of Europe’s most exciting choreographers. This high energy, vibrant piece captures the intensity of nature’s elements during a storm, set against the power generated by an alternative rock music concert.`,
    genre: Genre.Dance,
    type: PerformanceType.Live,
    hostusername: 'NDCW',
    thumbnail:
      'https://ndcwales.co.uk/sites/default/files/styles/banner/public/2018-07/Untitled-design-%2851%29.jpg?h=e7856751&itok=b6IMtGqj'
  },
  {
    name: `Afterimage`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Afterimage is a dance of fleeting images; that uses mirrors to create a unique and beautiful experience of appearance and disappearance. Afterimage shows the audience a series of scenes to evoke a personal response from each person without providing a single narrative.`,
    genre: Genre.Dance,
    type: PerformanceType.Live,
    hostusername: 'NDCW',
    thumbnail:
      'https://ndcwales.co.uk/sites/default/files/styles/banner/public/2018-11/Untitled%20design%20%2846%29.jpg?itok=-KR29oQW'
  },
  {
    name: `Possible`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Shôn’s new show was going to be all about love. But what do you do when you’re writing a show all about love, and everything goes dark? You find a new story. A story with scones after midnight, estate agents, Gandhi-inspired motivational texts, mothers, fathers, families, and Grandmaster Flash.

    Possible is a playful and profound piece of storytelling that blurs reality with live music and surreal, cinematic visuals. Funny and endearingly honest, it’s a show about love, resilience and finding the courage to explore the past, in order to shape the future."`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'NationalTheatreWales',
    thumbnail: 'https://cdn.nationaltheatrewales.org/wp-content/uploads/2021/05/possible-licketco-crop-1024x576.jpg'
  },
  {
    name: `Alice's Adventures in Wonderland`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"The classic tale of Alice’s Adventures in Wonderland comes to life in this quirky and delightful family opera. Follow Alice down the rabbit hole on her adventures where she encounters a whole host of peculiar characters including a relaxed caterpillar, happy cat, depressive hare, mad hatter and sleepy dormouse. Find out why all is not well in Wonderland and why the Queen of Hearts is so cross.

    Will Todd’s score, performed by a small orchestra, is an eclectic mix of jazz, musical and opera and perfectly accompanies the witty libretto to create a fun and engaging story that remains true to the original book."`,
    genre: Genre.Opera,
    type: PerformanceType.Live,
    hostusername: 'WNO',
    thumbnail: 'https://www.visitcardiff.com/app/uploads/2021/06/alice-in-wonderland-1.jpg'
  },
  {
    name: `Madam Butterfly Puccini`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"On the surface a dream-like wedding for a groom and his young, beautiful bride - but behind the façade is a cruel reality. Abandoned and betrayed, Butterfly finds her world crashing around her as her one chance for freedom becomes her prison.  Her desperation and pain escalate as she fights for survival with devastating consequences.

    Madam Butterfly is a powerful story of unrequited love, human pain and suffering which is magnificently intensified by Puccini’s glorious music, promising a night of drama and emotion. Inspired by Puccini’s fantasy landscape of exotic pleasures, Lindy Hume’s new production interprets Butterfly’s famous story through a dystopian prism."`,
    genre: Genre.Opera,
    type: PerformanceType.Live,
    hostusername: 'WNO',
    thumbnail: 'https://i.ytimg.com/vi/1QNXjSyWbQI/maxresdefault.jpg'
  },
  {
    name: `Would you sing it out loud?`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"with Simon Armitage, Taylor Edmonds & Owen Sheers.

    Join us for Everything Change’s closing event, in which the current Poet Laureate of the United Kingdom, Simon Armitage, will be joined by Taylor Edmonds, the recently appointed Poet in Residence for the Future Generations Commissioner for Wales. Simon will read from his climate-related work and discuss the response of poets to the climate crisis, as well as his creation of The Laurel Prize for eco-poetry. He will then hand over to Taylor to introduce her new role — the first of its kind anywhere in the world — and close Everything Change with readings of her own poems, which imagine some tools to make our planet’s future a brighter one for all.

    This event will be introduced and moderated by Owen Sheers, Professor in Creativity at Swansea University."`,
    genre: Genre.Poetry,
    type: PerformanceType.Live,
    hostusername: 'TaliesinAC',
    thumbnail:
      'https://www.taliesinartscentre.co.uk/getfile/NewWebsiteSept2020/Events/2021/EVERYTHING%20CHANGE%20BANNERS%20AND%20THUMBNAILS/everthing-change-outtro.jpg'
  },
  {
    name: `Gair o Gariad`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Theatr Bara Caws are thrilled to invite you to a virtual performance of Gair o Gariad.

    Gair o Gariad is a Welsh language adaptation of Uninvited Guests’ Love Letters Straight From Your Heart, and each time Bara Caws have presented the stage version our audiences have been enthralled. In these challenging times we’d like to give you the opportunity to meet in a unique way when meeting face-to-face is impossible.

    Actors: Carwyn Jones and Lleuwen Steffan"`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'TheatreBaraCaws',
    thumbnail: 'https://arts.wales/system/files/user_img/DSC_9202.jpg'
  },
  {
    name: `Blindness`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Juliet Stevenson voices the Storyteller/Doctor’s wife in this gripping story of the rise and, ultimately, profoundly hopeful end of an unimaginable global pandemic.

    As the lights change at a major crossroads in a city in the heart of Europe a car grinds to a halt. Its driver can drive no more. Suddenly, without warning or cause, he has gone blind. Within hours it is clear that this is a blindness like no other. This blindness is infectious. Within days an epidemic of blindness has spread through the city. The government tries to quarantine the contagion by herding the newly blind people into an empty asylum. But their attempts are futile. The city is in panic.

    Award-winning playwright Simon Stephens has adapted Nobel Prize-winner José Saramago’s dystopian novel Blindness as a sound installation, directed by Walter Meierjohann with immersive binaural sound design by Ben and Max Ringham.
    "`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'TheatrClwyd',
    thumbnail:
      'https://d236ott6dc2ku1.cloudfront.net/_imager/files/Events/2021/860559/Blindness-at-the-Donmar-Warehouse.-Photo-by-Helen-Maybanks-02_71cf85432501894f00c5c4081aaf6408.jpg'
  },
  {
    name: `Fausta + Greta`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"One night out. One chance meeting. A love story doomed from the start.

    Greta is out with friends when she meets the chancer Faust. But with darker forces at play, a bit of harmless flirting leads to an irreversible journey of destruction.

    Faust + Greta is a tragic and twisted love story that sees the original German tale re-imagined in an amped-up, contemporary Wales. Devised and performed by an ensemble of young people coming out of lockdown, this digital theatrical experience is about the human obsession with wanting more, seizing power and pushing boundaries to extremes.

    Inspired by T. Gwynn Jones’s Welsh translation of Goethe’s classic, Faust + Greta will embrace social distancing limitations to offer a completely new, experimental, and unexpected theatrical experience. Staged in an empty theatre, a dark and devious world, and new experiences beckon. How far can we tempt you?"`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'TGC',
    thumbnail:
      'https://lh3.googleusercontent.com/proxy/2IG016hUBLeSLDgg6w7OzNmle1mHybVugE702fAbXA9sCpGrOzXox9Ya7DBFhI2oyOVQM0rHZ0_xZaJZ5SCughdGIiLPavcEmsBy8Z88wKbFk8vy-eLLJLv-r4coWt8'
  },
  {
    name: `Llygoden yr Eira`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Winter has arrived and the woods are covered white. A child wraps up warm and runs outside to play in a sparkling new world.

    But what’s hiding under the snow? A little mouse, fast asleep. Sliding, tumbling and laughing, the two new friends explore the winter wonderland together.

    Filled with play, puppetry and music, the enchanting and mischievous Llygoden yr Eira returns to venues across Wales this winter.  So come and keep warm in the winter freeze and join us on an adventure in a magical forest.
    "`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'TheatrIoio',
    thumbnail:
      'https://images.squarespace-cdn.com/content/5704e2440442621c34c21a87/1571922597688-T6QQOS24V9USEAEJZIBW/llygodenyreiraRehearsalskirstenmcternan211.jpg?format=1500w&content-type=image%2Fjpeg'
  },
  {
    name: `The Snow Queen`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `Join Ballet Theatre UK in their beautiful re-telling of Hans Christian Andersen’s classic fairy tale ballet, The Snow Queen. This spectacular production follows the story of Gerda and her quest to find her friend Kay, whom the Snow Queen has placed under an evil spell. Gerda’s fantastic adventure takes her on a journey across the frozen north where she encounters a band of gypsys, enchanted reindeer, and a mysterious and reclusive Lapland woman. Gerda is told by the mysterious woman to continue travelling north, where she will find Kay and the Snow Queen’s Palace of Ice. Only Gerda’s love for Kay can release him from the spell and break the Snow Queen’s curse of eternal winter. Ballet Theatre UK's renowned company of international dancers, beautiful costumes and glittering stage sets combine to create a magnificent spectacle, all set to a glorious and magical score.    `,
    genre: Genre.Ballet,
    type: PerformanceType.Live,
    hostusername: 'TheatrMlwdan',
    thumbnail:
      'https://ents24.imgix.net/image/000/398/826/a4ae8f7355ad364f53934a2802270e365a50eb04.jpg?auto=format&fit=crop&crop=faces&w=800&h=600'
  },
  {
    name: `Arandora Star`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"By Mali Tudno Jones and Geinor Styles

    In partnership with Swansea Museum, National Waterfront Museum and Technocamps

    Lina dreams of singing at La Scala.
    Then Italy enters the war in the summer of 1940, Italian families, living in Wales, are torn apart as men taken from their homes are branded, enemy aliens.

    Lina watches in horror as her father dragged from their little cafe in Swansea and imprisoned.
    Forced out of their home, by people they knew as friends, Lina and her mother face an uncertain and lonely future.

    Then news arrives that on the 2nd of July 1940 mistaken for a troopship, The Arandora Star it's torpedoed by a German U-boat off the coast of Ireland and sinks with 446 Italian men's lives lost.

    There is no news of Lina's father, whether he survived or drowned.
    In her new home, far away from Swansea, Lina clings to the dream of her family's reunion one day.

    Our play tells the emotional story of Lina as she struggles with the loss of her father, Guido. How, she and her mother, Carmela survive in a time of war and prejudice.

    The Arandora Star is a true story and will explore the life of Italians living and working in Wales during World War 2 and follows Lina's quest for her father and the truth.

    This play highlights the issues of immigration and integration. "`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'TheatrNaNÓg',
    thumbnail:
      'http://www.theatr-nanog.co.uk/sites/default/files/styles/banner/public/banners/a%20star%20mailchimp%20image_0_0.png?itok=wLfiKs-S'
  },
  {
    name: `The Ghost Stories of E R Benson`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Directed by Gareth Armstrong
    Music by Simon Slater

    This is a spine-tingling evening of three tales of the supernatural from E.F. Benson’s brilliant collection of ghost stories, Night Terrors. With masterful storytelling  the award-winning actor Gerard Logan, Night Terrors will transport you to a darker, more sinister world of the unexpected and the unexplainable.

    The three stories ('The Dance', 'In The Tube' and 'The Confession of Charles Linkworth'), are dramatic, haunting and hugely memorable.

    Gerard Logan won The Stage Best Solo Performer of the 2011 Edinburgh Festival Award for his acclaimed performance in Gareth Armstrong’s production of Shakespeare’s The Rape of Lucrece. He won the Best Actor award at the 2014 Buxton Fringe Festival, and was nominated for the Michael MacLiammoir Award for Best Male Performance at the 2016 International Dublin Gay Theatre Festival for his performance in Wilde Without the Boy.

    Gareth Armstrong has developed and directed many successful solo shows, including his own award-winning Shylock.

    Night Terrors is also underscored by a beautiful, original and specially-commissioned score by the award-winning RSC composer, Simon Slater."`,
    genre: Genre.Theatre,
    type: PerformanceType.Live,
    hostusername: 'TorchTheatre',
    thumbnail: 'https://www.everymantheatre.org.uk/media/fjtnyakc/nightterrorsgraph.jpg'
  },
  {
    name: `Past the Stars`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Featuring pieces by Sir Harrison Birtwistle and Param Vir, Birmingham Contemporary Music Group is delighted to return to Town Hall, Birmingham, for a full-scale 15-piece performance, Past the Stars.

    Past the Stars is a collection of pieces that encompasses everything contemporary music should be: expressive, unexpected, and thought provoking. From Birtwistle’s powerful play on rhythm within Cantus Iambeus,, through Param Vir’s poetic Wheeling Past the Stars, and to the dramatic storytelling piece Hayagriva, each composition takes you on a new emotive journey. Past the Stars is inspired by language and spirituality and elevated by the skill and passion of BCMG’s 15-piece ensemble.

    This thought-provoking evening of contemporary music will also feature performances by musicians from BCMG’s NEXT programme. These early-career musicians have been coached by BCMG players in some of the most inspiring and challenging works written in the last 70 years. Past the Stars will be their first public performance of 2021.

    After preparing through multiple lockdowns for the opportunity to perform music as a full ensemble, Birmingham Contemporary Music Group’s patience and efforts have been rewarded.

    There will be no interval during this performance."`,
    genre: Genre.Music,
    type: PerformanceType.Live,
    hostusername: 'BCG',
    thumbnail:
      'https://www.bcmg.org.uk/handlers/getimage.ashx?idmf=3b7fa01d-cc85-457f-a886-4da1b292152e&w=1440&h=575&f=1'
  },
  {
    name: `Southbank Sinfonia`,
    publicity_period: { start: 1667260800, end: 1668538800 },
    description: `"Joined by the fabulous Chloé van Soeterstède, our fellowship will take you on a musical journey of devotion through the guise of three powerful pieces of classical music.

    Laden with rich hymn melodies, Elfrida Andrée's Overture in D is powerful in all the right places. From big swooping themes, to the Mendelssohn-like orchestration and melodic development, this overture was a triumph for the 19th century organist.

    Modlitwa ('Song') has received a number of different orchestrations between father-daughter super team Andrzej and Roxanna Panufnik. The original, a vocal piece with piano accompaniment, turned into a chamber work for strings after Roxanna was asked to take the piece on again some years after her father's death. The music is based on a prayer, and this can be heard through the intricate orchestration and subtle dissonances throughout.

    Felix Mendelssohn's mighty Fifth Symphony, also known as 'The Reformation', was composed for the 300th anniversary of the Presentation of the Augsburg Confession. A key document in the Protestant Reformation, Mendelssohn channels this theme within the music by using popular hymn structures and traditional Church harmonies. The symphony was not published until 1868, 21 years after Mendelssohn's death. His devoted sister, Fanny, chose to subtitle it 'The Reformation Symphony'.

    Described as ""intuitive"", ""expressive"", and bearing a ""positive presence"", we are absolutely thrilled to be welcome Chloé van Soeterstède back to conduct Southbank Sinfonia.
    "`,
    genre: Genre.Music,
    type: PerformanceType.Live,
    hostusername: 'SJSS',
    thumbnail:
      'https://www.sjss.org.uk/sites/www.sjss.org.uk/files/styles/imager_js_scale_1280/public/25.06.21_-_southbank_sinfonia_rush_hour_7_bradley.marcus-1320x900_-_web_3.jpg'
  }
]);
