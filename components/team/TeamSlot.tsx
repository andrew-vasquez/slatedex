"use client";

import { useDroppable } from "@dnd-kit/core";
import { FiTrash2 } from "react-icons/fi";
import type { Pokemon } from "@/lib/types";

interface TeamSlotProps {
  children?: React.ReactNode;
  id: string;
  isEmpty: boolean;
  isOver: boolean;
  pokemon: Pokemon | null;
  onRemove: (() => void) | null;
}

const TeamSlot = ({ children, id, isEmpty, isOver, pokemon, onRemove }: TeamSlotProps) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative w-full h-32 sm:h-40 lg:h-48 bg-gray-800/50 backdrop-blur-sm border-2 border-dashed rounded-xl 
        flex items-center justify-center transition-all duration-300 transform
        ${
          isOver
            ? "border-red-500 bg-red-500/10 scale-105 shadow-lg"
            : "border-gray-700"
        }
        ${isEmpty ? "hover:border-red-500/50" : ""}
      `}
      role="region"
      aria-label={
        isEmpty
          ? `Empty team slot ${id + 1}`
          : `Team slot ${id + 1} - ${pokemon?.name}`
      }
    >
      {children || (
        <div className="text-center text-gray-500 transition-all duration-300">
          <div
            className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2 opacity-60"
            aria-hidden="true"
          >
            ?
          </div>
          <div className="text-xs sm:text-sm font-medium">Empty Slot</div>
        </div>
      )}

      {pokemon && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -left-2 sm:-top-3 sm:-right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 sm:h-7 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-10 hover:cursor-pointer "
          aria-label={`Remove ${pokemon.name} from team`}
          title={`Remove ${pokemon.name} from team`}
        >
          <FiTrash2 size={10} className="sm:hidden" />
          <FiTrash2 size={12} className="hidden sm:block" />
        </button>
      )}
    </div>
  );
};

export default TeamSlot;
