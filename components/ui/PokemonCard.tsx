"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { TYPE_COLORS } from "@/lib/constants";
import type { Pokemon } from "@/lib/types";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDraggable?: boolean;
  isCompact?: boolean;
  dragId?: string | null;
  onTap?: ((pokemon: Pokemon) => void) | null;
  canAddToTeam?: boolean;
}

const PokemonCard = ({
  pokemon,
  isDraggable: isDraggableProp = true,
  isCompact = false,
  dragId = null,
  onTap = null,
  canAddToTeam = false,
}: PokemonCardProps) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        ((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        window.innerWidth <= 768;
      setIsTouchDevice(hasTouch);
    };

    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);
    return () => window.removeEventListener("resize", checkTouchDevice);
  }, []);

  const uniqueId =
    dragId || `pokemon-${isDraggableProp ? "available" : "team"}-${pokemon.id}`;

  const shouldEnableDrag = isDraggableProp && !isTouchDevice;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: uniqueId,
      data: { pokemon },
      disabled: !shouldEnableDrag,
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : ("auto" as const),
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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isTouchDevice && isDraggableProp) {
      e.preventDefault();
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isTouchDevice) {
      e.preventDefault();
      return false;
    }
  };

  const draggableClasses = `
    ${
      shouldEnableDrag && !isDragging
        ? " hover:shadow-2xl hover:border-red-500 cursor-grab active:cursor-grabbing"
        : ""
    }
    ${isDragging ? "rotate-2 shadow-2xl border-red-500" : ""}
    ${onTap && canAddToTeam ? "cursor-pointer" : ""}
    ${isTouchDevice && onTap && canAddToTeam ? " active:scale-95 transition-transform" : ""}
    ${isTouchDevice ? "select-none" : ""}
  `;

  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(shouldEnableDrag ? listeners : {})}
        {...(shouldEnableDrag ? attributes : {})}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onDragStart={handleDragStart}
        draggable={shouldEnableDrag}
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
            <Image
              src={pokemon.sprite}
              alt={pokemon.name}
              width={64}
              height={64}
              className="relative w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <h3 className="font-bold text-gray-100 text-center mb-1 sm:mb-2 text-xs sm:text-sm leading-tight">
            {pokemon.name}
          </h3>
          <div className="flex justify-center gap-0.5 sm:gap-1 flex-wrap">
            {pokemon.types.map((type: string) => (
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
      {...(shouldEnableDrag ? listeners : {})}
      {...(shouldEnableDrag ? attributes : {})}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onDragStart={handleDragStart}
      draggable={shouldEnableDrag}
      className={`${cardBaseClasses} ${draggableClasses} min-h-[280px] sm:min-h-[320px]`}
    >
      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-gray-900/50 text-white text-xs px-2 py-1 rounded-full font-mono">
        #{pokemon.id.toString().padStart(3, "0")}
      </div>
      {onTap && canAddToTeam && (
        <div className="absolute top-1.5 left-1.5 bg-green-600 hover:bg-green-700 text-white text-sm w-6 h-6 flex items-center justify-center rounded-full font-bold z-10 transition-colors">
          +
        </div>
      )}

      <div className="relative pt-4 sm:pt-5 pb-4 sm:pb-5 px-3 sm:px-4 text-white flex flex-col h-full">
        <div className="flex-shrink-0 relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-3">
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            width={96}
            height={96}
            className="relative w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        <div className="flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-100 text-center mb-2 text-sm sm:text-base group-hover:text-white leading-tight">
              {pokemon.name}
            </h3>

            <div className="flex justify-center gap-1 mb-3 flex-wrap">
              {pokemon.types.map((type: string) => (
                <span
                  key={type}
                  className={`px-2 py-0.5 rounded-full text-white text-xs font-semibold shadow-md ${TYPE_COLORS[type]}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-xs mt-auto">
            <div className="bg-gray-700/50 rounded-lg p-1.5">
              <div className="text-xs text-gray-400 font-medium">HP</div>
              <div className="font-bold text-green-400 text-sm">
                {pokemon.hp}
              </div>
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
    </div>
  );
};

export default PokemonCard;
