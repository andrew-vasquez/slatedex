import { MAINLINE_GAMES, POKEMON_DATA } from "../../data/pokemon";

const GameSelector = ({ onGameSelect }) => {
  const getPokemonSprite = (name) => {
    const pokemon = POKEMON_DATA.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    return pokemon ? pokemon.sprite : "";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25px 25px, #ef4444 2%, transparent 0%),
            radial-gradient(circle at 75px 75px, #3b82f6 2%, transparent 0%)`,
          backgroundSize: "100px 100px",
        }}
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header
          className="text-center mb-8 sm:mb-12 lg:mb-16 pt-8 sm:pt-12 lg:pt-16"
          role="banner"
        >
          <div className="inline-block relative mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-wider">
              POKÉMON
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-red-500 tracking-wide -mt-2">
              TEAM BUILDER
            </h2>
            <div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-full"
              aria-hidden="true"
            />
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto px-4 leading-relaxed">
            Choose your adventure and build the ultimate team
          </p>
        </header>

        <main
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 pb-12"
          role="main"
        >
          <h2 className="sr-only">Select a Pokémon Game Generation</h2>
          {MAINLINE_GAMES.map((game) => (
            <article
              key={game.id}
              onClick={() => onGameSelect(game)}
              className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm 
                         border-2 border-gray-600 rounded-2xl overflow-hidden cursor-pointer
                         transition-all duration-500 hover:border-red-500 hover:scale-105 
                         hover:shadow-2xl hover:shadow-red-500/25 hover:from-gray-700/90 hover:to-gray-800/90
                         active:scale-95 transform-gpu"
              role="button"
              tabIndex={0}
              aria-label={`Select ${game.name} from Generation ${game.generation} set in the ${game.region} region`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onGameSelect(game);
                }
              }}
            >
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                aria-hidden="true"
              />

              {/* Pokemon Images */}
              <div
                className="absolute inset-0 z-0 overflow-hidden rounded-2xl"
                aria-hidden="true"
              >
                <img
                  src={getPokemonSprite(game.legendaries[0])}
                  alt=""
                  className="absolute -top-4 -right-4 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 object-contain
                             opacity-20 group-hover:opacity-40 transition-opacity duration-500 
                             transform group-hover:scale-110 group-hover:rotate-6"
                  loading="lazy"
                />
                <div className="absolute bottom-2 left-2 flex space-x-1">
                  {game.starters.map((starter) => (
                    <img
                      key={starter}
                      src={getPokemonSprite(starter)}
                      alt=""
                      className="w-8 h-8 sm:w-10 sm:h-10 object-contain
                                 opacity-40 group-hover:opacity-80 transition-all duration-300
                                 transform group-hover:scale-110"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>

              {/* Generation badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  <span className="sr-only">Generation</span>
                  Gen {game.generation}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 h-full flex flex-col justify-between min-h-[200px]">
                <div className="flex-1">
                  <h3
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-white group-hover:text-red-100 
                                 transition-colors duration-300 leading-tight mb-3 pt-6 "
                  >
                    {game.name}
                  </h3>
                  <p className="text-base sm:text-lg text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                    {game.region} Region
                  </p>
                </div>

                {/* Bottom accent */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    Click to start building
                  </div>
                  <div
                    className="w-8 h-8 rounded-full bg-red-600/20 group-hover:bg-red-600/40 
                                  flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-4 h-4 text-red-400 group-hover:text-red-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom border accent */}
              <div
                className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 
                              transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"
                aria-hidden="true"
              />

              {/* Structured Data for each game */}
            </article>
          ))}
        </main>
      </div>
    </div>
  );
};

export default GameSelector;
