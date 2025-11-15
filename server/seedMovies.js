import mongoose from "mongoose";
import dotenv from "dotenv";
import Movie from "./model/Movie.js";

dotenv.config();

const sampleMovies = [
  {
    title: "The Dark Knight",
    description: "When the menace known as The Joker emerges, Batman must confront one of the greatest psychological tests of his ability to fight injustice.",
    genre: ["Action", "Crime", "Drama"],
    year: 2008,
    rating: 9.0,
    duration: 152,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Inception",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
    genre: ["Action", "Sci-Fi", "Thriller"],
    year: 2010,
    rating: 8.8,
    duration: 148,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Interstellar",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    genre: ["Adventure", "Drama", "Sci-Fi"],
    year: 2014,
    rating: 8.6,
    duration: 169,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    uploadedBy: "admin"
  },
  {
    title: "The Matrix",
    description: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
    genre: ["Action", "Sci-Fi"],
    year: 1999,
    rating: 8.7,
    duration: 136,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Pulp Fiction",
    description: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
    genre: ["Crime", "Drama"],
    year: 1994,
    rating: 8.9,
    duration: 154,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    uploadedBy: "admin"
  },
  {
    title: "The Godfather",
    description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    genre: ["Crime", "Drama"],
    year: 1972,
    rating: 9.2,
    duration: 175,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Fight Club",
    description: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club.",
    genre: ["Drama"],
    year: 1999,
    rating: 8.8,
    duration: 139,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Forrest Gump",
    description: "The presidencies of Kennedy and Johnson, through the eyes of an Alabama man with an IQ of 75.",
    genre: ["Drama", "Romance"],
    year: 1994,
    rating: 8.8,
    duration: 142,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Goodfellas",
    description: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill.",
    genre: ["Biography", "Crime", "Drama"],
    year: 1990,
    rating: 8.7,
    duration: 146,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    uploadedBy: "admin"
  },
  {
    title: "The Shawshank Redemption",
    description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    genre: ["Drama"],
    year: 1994,
    rating: 9.3,
    duration: 142,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Avengers: Endgame",
    description: "After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos' actions.",
    genre: ["Action", "Adventure", "Drama"],
    year: 2019,
    rating: 8.4,
    duration: 181,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Spider-Man: Into the Spider-Verse",
    description: "Teen Miles Morales becomes Spider-Man of his reality and crosses paths with his counterparts from other dimensions.",
    genre: ["Animation", "Action", "Adventure"],
    year: 2018,
    rating: 8.4,
    duration: 117,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Parasite",
    description: "A poor family schemes to become employed by a wealthy family by infiltrating their household.",
    genre: ["Comedy", "Drama", "Thriller"],
    year: 2019,
    rating: 8.6,
    duration: 132,
    language: "Korean",
    poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Mad Max: Fury Road",
    description: "In a post-apocalyptic wasteland, Max teams up with a mysterious woman to flee from a tyrannical warlord.",
    genre: ["Action", "Adventure", "Sci-Fi"],
    year: 2015,
    rating: 8.1,
    duration: 120,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Blade Runner 2049",
    description: "A young blade runner discovers a secret that leads him to track down former blade runner Rick Deckard.",
    genre: ["Drama", "Mystery", "Sci-Fi"],
    year: 2017,
    rating: 8.0,
    duration: 164,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    uploadedBy: "admin"
  },
  // Marvel Movies
  {
    title: "Iron Man",
    description: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil.",
    genre: ["Action", "Adventure", "Sci-Fi"],
    year: 2008,
    rating: 7.9,
    duration: 126,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg",
    uploadedBy: "admin"
  },
  {
    title: "The Avengers",
    description: "Earth's mightiest heroes must come together and learn to fight as a team to stop the mischievous Loki and his alien army from enslaving humanity.",
    genre: ["Action", "Adventure", "Sci-Fi"],
    year: 2012,
    rating: 8.0,
    duration: 143,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Black Panther",
    description: "T'Challa, heir to the hidden but advanced kingdom of Wakanda, must step forward to lead his people into a new future.",
    genre: ["Action", "Adventure", "Sci-Fi"],
    year: 2018,
    rating: 7.3,
    duration: 134,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Guardians of the Galaxy",
    description: "A group of intergalactic criminals must pull together to stop a fanatical warrior with plans to purge the universe.",
    genre: ["Action", "Adventure", "Comedy"],
    year: 2014,
    rating: 8.0,
    duration: 121,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Doctor Strange",
    description: "While on a journey of physical and spiritual healing, a brilliant neurosurgeon is drawn into the world of the mystic arts.",
    genre: ["Action", "Adventure", "Fantasy"],
    year: 2016,
    rating: 7.5,
    duration: 115,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/4PiiNGXj1KENTmCBHeN6Mskj2Fq.jpg",
    uploadedBy: "admin"
  },
  // Horror Movies
  {
    title: "The Shining",
    description: "A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.",
    genre: ["Drama", "Horror"],
    year: 1980,
    rating: 8.4,
    duration: 146,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/b6ko0IKC8MdYBBPkkA1aBPLe2yz.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Get Out",
    description: "A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness becomes a nightmare.",
    genre: ["Horror", "Mystery", "Thriller"],
    year: 2017,
    rating: 7.7,
    duration: 104,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
    uploadedBy: "admin"
  },
  {
    title: "A Quiet Place",
    description: "In a post-apocalyptic world, a family is forced to live in silence while hiding from monsters with ultra-sensitive hearing.",
    genre: ["Drama", "Horror", "Sci-Fi"],
    year: 2018,
    rating: 7.5,
    duration: 90,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4n.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Hereditary",
    description: "A grieving family is haunted by tragedy and disturbing secrets.",
    genre: ["Drama", "Horror", "Mystery"],
    year: 2018,
    rating: 7.3,
    duration: 127,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/p81a0kSuRQ8jpYzZdGTUt1cO7yd.jpg",
    uploadedBy: "admin"
  },
  // Comedy Movies
  {
    title: "Superbad",
    description: "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.",
    genre: ["Comedy"],
    year: 2007,
    rating: 7.6,
    duration: 113,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg",
    uploadedBy: "admin"
  },
  {
    title: "The Grand Budapest Hotel",
    description: "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.",
    genre: ["Adventure", "Comedy", "Crime"],
    year: 2014,
    rating: 8.1,
    duration: 99,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Knives Out",
    description: "A detective investigates the death of a patriarch of an eccentric, combative family.",
    genre: ["Comedy", "Crime", "Drama"],
    year: 2019,
    rating: 7.9,
    duration: 130,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Jojo Rabbit",
    description: "A young boy in Hitler's army finds out his mother is hiding a Jewish girl in their home.",
    genre: ["Comedy", "Drama", "War"],
    year: 2019,
    rating: 7.9,
    duration: 108,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/7GsM4mtM0worCtIVeiQt28HieeN.jpg",
    uploadedBy: "admin"
  },
  // Animated Movies
  {
    title: "Toy Story",
    description: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room.",
    genre: ["Animation", "Adventure", "Comedy"],
    year: 1995,
    rating: 8.3,
    duration: 81,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Inside Out",
    description: "After young Riley is uprooted from her Midwest life and moved to San Francisco, her emotions conflict on how best to navigate a new city, house, and school.",
    genre: ["Animation", "Adventure", "Comedy"],
    year: 2015,
    rating: 8.1,
    duration: 95,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Coco",
    description: "Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather.",
    genre: ["Animation", "Adventure", "Comedy"],
    year: 2017,
    rating: 8.4,
    duration: 105,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Finding Nemo",
    description: "After his son is captured in the Great Barrier Reef and taken to Sydney, a timid clownfish sets out on a journey to bring him home.",
    genre: ["Animation", "Adventure", "Comedy"],
    year: 2003,
    rating: 8.2,
    duration: 100,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Spirited Away",
    description: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.",
    genre: ["Animation", "Adventure", "Family"],
    year: 2001,
    rating: 9.2,
    duration: 125,
    language: "Japanese",
    poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    uploadedBy: "admin"
  },
  // Sci-Fi Movies
  {
    title: "Dune",
    description: "Paul Atreides leads nomadic tribes in a revolt against the galactic emperor and his father's enemy, the Harkonnens.",
    genre: ["Adventure", "Drama", "Sci-Fi"],
    year: 2021,
    rating: 8.0,
    duration: 155,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Arrival",
    description: "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
    genre: ["Drama", "Mystery", "Sci-Fi"],
    year: 2016,
    rating: 7.9,
    duration: 116,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/yImmxRokQ5nXaHksr2ioPMook5h.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Ex Machina",
    description: "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence.",
    genre: ["Drama", "Sci-Fi", "Thriller"],
    year: 2014,
    rating: 7.7,
    duration: 108,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/btTdmkgIvOi0FFip1sPuZI2oQG6.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Her",
    description: "In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need.",
    genre: ["Drama", "Romance", "Sci-Fi"],
    year: 2013,
    rating: 8.0,
    duration: 126,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/lEIaL12hSkqqe83kgADkbUqEnvk.jpg",
    uploadedBy: "admin"
  },
  // Classic Movies
  {
    title: "Casablanca",
    description: "A cynical expatriate American cafe owner struggles to decide whether or not to help his former lover and her fugitive husband escape the Nazis.",
    genre: ["Drama", "Romance", "War"],
    year: 1942,
    rating: 8.5,
    duration: 102,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Citizen Kane",
    description: "Following the death of publishing tycoon Charles Foster Kane, reporters scramble to uncover the meaning of his final utterance.",
    genre: ["Drama", "Mystery"],
    year: 1941,
    rating: 8.3,
    duration: 119,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/sav0jxhqiH0Ra9x94OkLNQgajuU.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Psycho",
    description: "A Phoenix secretary embezzles $40,000 from her employer's client and flees to a remote motel run by a young man under his mother's domination.",
    genre: ["Horror", "Mystery", "Thriller"],
    year: 1960,
    rating: 8.5,
    duration: 109,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/yz4QVqPx3h1hD1DfqqQkCq3rmxW.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Vertigo",
    description: "A former police detective investigates an acquaintance's wife but becomes obsessed with her.",
    genre: ["Mystery", "Romance", "Thriller"],
    year: 1958,
    rating: 8.3,
    duration: 128,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/15uOEfqBNTVtDUT7hGBVCka0aJd.jpg",
    uploadedBy: "admin"
  },
  // Thrillers
  {
    title: "Se7en",
    description: "Two detectives hunt a serial killer who uses the seven deadly sins as his motives.",
    genre: ["Crime", "Drama", "Mystery"],
    year: 1995,
    rating: 8.6,
    duration: 127,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Zodiac",
    description: "Between 1968 and 1983, a San Francisco cartoonist becomes an amateur detective obsessed with tracking down the Zodiac Killer.",
    genre: ["Crime", "Drama", "History"],
    year: 2007,
    rating: 7.7,
    duration: 157,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/6YmeO4pOcNzxs6FCFyRMaWTcffl.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Gone Girl",
    description: "With his wife's disappearance having become the focus of an intense media circus, a man sees the spotlight turned on him.",
    genre: ["Drama", "Mystery", "Thriller"],
    year: 2014,
    rating: 8.1,
    duration: 149,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/gdiLTof3rbPDAmPaCf4g6op46b2.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Shutter Island",
    description: "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.",
    genre: ["Mystery", "Thriller"],
    year: 2010,
    rating: 8.2,
    duration: 138,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/52d7CABzWS3NqjhZg7yFIZW5cW5.jpg",
    uploadedBy: "admin"
  },
  // War Movies
  {
    title: "Saving Private Ryan",
    description: "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.",
    genre: ["Drama", "War"],
    year: 1998,
    rating: 8.6,
    duration: 169,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg",
    uploadedBy: "admin"
  },
  {
    title: "1917",
    description: "April 6th, 1917. As a regiment assembles to wage war deep in enemy territory, two soldiers are assigned to race against time and deliver a message.",
    genre: ["Drama", "War"],
    year: 2019,
    rating: 8.2,
    duration: 119,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/iZf0KyrE25z1sage4SYFLCCrMi9.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Dunkirk",
    description: "Allied soldiers from Belgium, the British Commonwealth and Empire, and France are surrounded by the German Army during WWII.",
    genre: ["Action", "Drama", "History"],
    year: 2017,
    rating: 7.8,
    duration: 106,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/f7GJSjp6c16ccNPjVLhcdzhQ7bZ.jpg",
    uploadedBy: "admin"
  },
  // Recent Popular Movies
  {
    title: "Top Gun: Maverick",
    description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, training a detachment of graduates for a specialized mission.",
    genre: ["Action", "Drama"],
    year: 2022,
    rating: 8.3,
    duration: 130,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Everything Everywhere All at Once",
    description: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes.",
    genre: ["Action", "Adventure", "Comedy"],
    year: 2022,
    rating: 7.8,
    duration: 139,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    uploadedBy: "admin"
  },
  {
    title: "The Batman",
    description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption.",
    genre: ["Action", "Crime", "Drama"],
    year: 2022,
    rating: 7.8,
    duration: 176,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    uploadedBy: "admin"
  },
  {
    title: "No Time to Die",
    description: "James Bond has left active service. His peace is short-lived when Felix Leiter, an old friend from the CIA, turns up asking for help.",
    genre: ["Action", "Adventure", "Thriller"],
    year: 2021,
    rating: 7.3,
    duration: 163,
    language: "English",
    poster: "https://image.tmdb.org/t/p/w500/iUgygt3fscRoKWCV1d0C7FbM9TP.jpg",
    uploadedBy: "admin"
  },
  // International Cinema
  {
    title: "Amélie",
    description: "Amélie is an innocent and naive girl in Paris with her own sense of justice. She decides to help those around her.",
    genre: ["Comedy", "Romance"],
    year: 2001,
    rating: 8.3,
    duration: 122,
    language: "French",
    poster: "https://image.tmdb.org/t/p/w500/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg",
    uploadedBy: "admin"
  },
  {
    title: "City of God",
    description: "In the slums of Rio, two kids' paths diverge as one struggles to become a photographer and the other a kingpin.",
    genre: ["Crime", "Drama"],
    year: 2002,
    rating: 8.6,
    duration: 130,
    language: "Portuguese",
    poster: "https://image.tmdb.org/t/p/w500/k7eYdcdYEZhKTK9uARjp32j9xKf.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Life is Beautiful",
    description: "When an open-minded Jewish librarian and his son become victims of the Holocaust, he uses a perfect mixture of will, humor and imagination to protect his son.",
    genre: ["Comedy", "Drama", "Romance"],
    year: 1997,
    rating: 8.6,
    duration: 116,
    language: "Italian",
    poster: "https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg",
    uploadedBy: "admin"
  },
  {
    title: "Your Name",
    description: "Two teenagers share a profound, magical connection upon discovering they are swapping bodies.",
    genre: ["Animation", "Drama", "Fantasy"],
    year: 2016,
    rating: 8.2,
    duration: 106,
    language: "Japanese",
    poster: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg",
    uploadedBy: "admin"
  }
];

export async function seedMovies(clearExisting = false) {
  try {
    const movieCount = await Movie.countDocuments();
    
    if (movieCount > 0 && !clearExisting) {
      console.log(`Database already has ${movieCount} movies. Skipping seed.`);
      return;
    }

    if (clearExisting) {
      await Movie.deleteMany({});
      console.log("Cleared existing movies");
    }

    const insertedMovies = await Movie.insertMany(sampleMovies);
    console.log(`Seeded ${insertedMovies.length} movies successfully`);
    
    return insertedMovies;
  } catch (error) {
    console.error("Error seeding movies:", error);
    throw error;
  }
}

// If this file is run directly, execute seeding with clear option
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("Connected to MongoDB");
      await seedMovies(true); // Clear existing when run manually
      mongoose.connection.close();
    } catch (error) {
      console.error("Manual seed failed:", error);
      process.exit(1);
    }
  })();
}