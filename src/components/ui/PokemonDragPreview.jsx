import { TYPE_COLORS } from "../../constants/pokemon";

const PokemonDragPreview = ({ pokemon }) => {
  return (
    <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border-2 border-red-500 transform rotate-6 scale-110 pointer-events-none">
      <div className="absolute top-1 right-1 bg-gray-900/70 text-white text-xs px-2 py-0.5 rounded-full font-mono z-10">
        #{pokemon.id.toString().padStart(3, "0")}
      </div>
      
      <div className="relative pt-3 pb-3 px-3 text-white">
        <div className="relative mx-auto w-16 h-16 mb-2">
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            className="relative w-full h-full object-contain drop-shadow-lg"
            loading="eager"
          />
        </div>

        <h3 className="font-bold text-gray-100 text-center mb-2 text-sm leading-tight">
          {pokemon.name}
        </h3>

        <div className="flex justify-center gap-1 flex-wrap">
          {pokemon.types.map((type) => (
            <span
              key={type}
              className={`px-2 py-0.5 rounded-full text-white text-xs font-semibold shadow-md ${TYPE_COLORS[type]}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PokemonDragPreview; 