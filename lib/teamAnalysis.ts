/**
 * Team Analysis Utilities
 *
 * This file contains utility functions for analyzing Pokemon teams,
 * specifically defensive coverage calculations.
 */

import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES, ALL_TYPES, TYPE_INTRO_GENERATION } from '@/lib/constants';
import type { Pokemon, PokemonWithEffectiveness, CoverageMap } from '@/lib/types';

/**
 * Get detailed team defensive coverage with Pokemon details.
 * When a generation is provided, types introduced after that generation
 * are marked as locked in the returned map.
 */
export const getTeamDefensiveCoverage = (team: Pokemon[], generation?: number): CoverageMap => {
  const coverage: CoverageMap = {};

  ALL_TYPES.forEach((attackingType: string) => {
    const introGen = TYPE_INTRO_GENERATION[attackingType] ?? 1;
    if (generation !== undefined && introGen > generation) {
      coverage[attackingType] = {
        weak: 0,
        resist: 0,
        weakPokemon: [],
        resistPokemon: [],
        locked: true,
      };
      return;
    }

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
