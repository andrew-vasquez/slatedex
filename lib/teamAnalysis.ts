/**
 * Team Analysis Utilities
 *
 * This file contains utility functions for analyzing Pokemon teams,
 * specifically defensive coverage calculations.
 */

import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES, ALL_TYPES } from '@/lib/constants';
import type { Pokemon, PokemonWithEffectiveness, CoverageMap } from '@/lib/types';

/**
 * Get detailed team defensive coverage with Pokemon details
 */
export const getTeamDefensiveCoverage = (team: Pokemon[]): CoverageMap => {
  const coverage: CoverageMap = {};

  ALL_TYPES.forEach((attackingType: string) => {
    const weakPokemon: PokemonWithEffectiveness[] = [];
    const resistPokemon: PokemonWithEffectiveness[] = [];

    team.forEach((pokemon: Pokemon) => {
      let effectiveness = 1;

      // Check each of the Pokemon's types
      pokemon.types.forEach((defenderType: string) => {
        // Check if this defender type is weak to the attacking type
        const weaknesses: string[] = TYPE_EFFECTIVENESS[defenderType] || [];
        if (weaknesses.includes(attackingType)) {
          effectiveness *= 2;
        }

        // Check if this defender type resists the attacking type
        const resistances: string[] = TYPE_RESISTANCES[defenderType] || [];
        if (resistances.includes(attackingType)) {
          effectiveness *= 0.5;
        }
      });

      // Only track Pokemon that are weak or resistant (not neutral)
      if (effectiveness > 1) {
        weakPokemon.push({ ...pokemon, effectiveness });
      } else if (effectiveness < 1) {
        resistPokemon.push({ ...pokemon, effectiveness });
      }
    });

    coverage[attackingType] = {
      weak: weakPokemon.length,
      resist: resistPokemon.length,
      weakPokemon,
      resistPokemon
    };
  });

  return coverage;
};
