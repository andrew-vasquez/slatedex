import { useDraggable } from "@dnd-kit/core";
import { TYPE_COLORS } from "../../constants/pokemon";

const TYPE_BORDER_COLORS = {
  normal: "border-stone-400",
  fire: "border-red-500",
  water: "border-blue-500",
  electric: "border-yellow-400",
  grass: "border-green-500",
  ice: "border-cyan-300",
  fighting: "border-red-700",
  poison: "border-purple-500",
  ground: "border-yellow-600",
  flying: "border-sky-400",
  psychic: "border-pink-500",
  bug: "border-lime-500",
  rock: "border-yellow-700",
  ghost: "border-indigo-600",
  dragon: "border-purple-600",
  dark: "border-gray-700",
  steel: "border-slate-500",
  fairy: "border-rose-400",
};

const TYPE_ICONS = {
  normal: "⚪",
  fire: "🔥",
  water: "💧",
  electric: "⚡",
  grass: "🌿",
  ice: "❄️",
  fighting: "👊",
  poison: "☠️",
  ground: "🌍",
  flying: "🪶",
  psychic: "🔮",
  bug: "🐛",
  rock: "🪨",
  ghost: "👻",
  dragon: "🐉",
  dark: "🌙",
  steel: "⚔️",
  fairy: "✨",
};

const StatBar = ({ label, value, maxValue = 255, color }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-gray-600 font-medium w-8">{label}</span>
    <span className="text-gray-800 font-bold w-8 text-right">{value}</span>
    <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full bg-gradient-to-r ${color}`}
        style={{ width: `${(value / maxValue) * 100}%` }}
      />
    </div>
  </div>
);

const PokemonCard = ({
  pokemon,
  isDraggable = true,
  isCompact = false,
  dragId = null,
  onTap = null,
  canAddToTeam = false,
}) => {
  const uniqueId =
    dragId || `pokemon-${isDraggable ? "available" : "team"}-${pokemon.id}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: uniqueId,
      data: { pokemon },
      disabled: !isDraggable,
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const cardBaseClasses = `
    relative bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden 
    border-2 border-gray-700 transition-all duration-300 group
  `;

  const handleTap = () => {
    if (onTap && canAddToTeam && !isDragging) {
      onTap(pokemon);
    }
  };

  const draggableClasses = `
    ${
      isDraggable && !isDragging
        ? " hover:shadow-2xl hover:border-red-500 cursor-grab active:cursor-grabbing"
        : ""
    }
    ${isDragging ? "rotate-2 shadow-2xl border-red-500" : ""}
    ${onTap && canAddToTeam ? "cursor-pointer" : ""}
  `;

  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(isDraggable ? listeners : {})}
        {...(isDraggable ? attributes : {})}
        onClick={handleTap}
        className={`${cardBaseClasses} ${draggableClasses} w-full h-full`}
      >
        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-gray-900/50 text-white text-xs px-1.5 py-0.5 sm:px-2 rounded-full font-mono z-10">
          #{pokemon.id.toString().padStart(3, "0")}
        </div>
        {onTap && canAddToTeam && (
          <div className="absolute top-0.5 left-0.5 bg-green-600 hover:bg-green-700 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold z-10 transition-colors">
            +
          </div>
        )}
        <div className="p-2 sm:p-3 h-full flex flex-col justify-center items-center text-white">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-1 sm:mb-2">
            <img
              src={pokemon.sprite}
              alt={pokemon.name}
              className="relative w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <h3 className="font-bold text-gray-100 text-center mb-1 sm:mb-2 text-xs sm:text-sm leading-tight">
            {pokemon.name}
          </h3>
          <div className="flex justify-center gap-0.5 sm:gap-1 flex-wrap">
            {pokemon.types.map((type) => (
              <span
                key={type}
                className={`px-1 sm:px-2 py-0.5 rounded-full text-white text-xs font-semibold ${TYPE_COLORS[type]}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? listeners : {})}
      {...(isDraggable ? attributes : {})}
      onClick={handleTap}
      className={`${cardBaseClasses} ${draggableClasses}`}
    >
      <div
        className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-gray-900/50 text-white text-xs px-2 py-1 rounded-full font-mono`}
      >
        #{pokemon.id.toString().padStart(3, "0")}
      </div>
      {onTap && canAddToTeam && (
        <div className="absolute top-1.5 left-1.5 bg-green-600 hover:bg-green-700 text-white text-sm w-6 h-6 flex items-center justify-center rounded-full font-bold z-10 transition-colors">
          +
        </div>
      )}

      <div className="relative pt-3 sm:pt-4 pb-3 sm:pb-4 px-3 sm:px-4 text-white">
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-2">
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            className="relative w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        <h3 className="font-bold text-gray-100 text-center mb-2 text-sm sm:text-base group-hover:text-white leading-tight">
          {pokemon.name}
        </h3>

        <div className="flex justify-center gap-1 mb-3 flex-wrap">
          {pokemon.types.map((type) => (
            <span
              key={type}
              className={`px-2 py-0.5 rounded-full text-white text-xs font-semibold shadow-md ${TYPE_COLORS[type]}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
          <div className="bg-gray-700/50 rounded-lg p-1.5">
            <div className="text-xs text-gray-400 font-medium">HP</div>
            <div className="font-bold text-green-400 text-sm">{pokemon.hp}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-1.5">
            <div className="text-xs text-gray-400 font-medium">ATK</div>
            <div className="font-bold text-red-400 text-sm">
              {pokemon.attack}
            </div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-1.5">
            <div className="text-xs text-gray-400 font-medium">DEF</div>
            <div className="font-bold text-blue-400 text-sm">
              {pokemon.defense}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;
