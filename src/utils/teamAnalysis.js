/**
 * Team Analysis Utilities
 * 
 * This file contains utility functions for analyzing Pokemon teams,
 * specifically defensive coverage calculations.
 */

import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES, ALL_TYPES } from '../constants/pokemon.js';

/**
 * Get detailed team defensive coverage with Pokemon details
 * @param {Array} team - Array of Pokemon objects
 * @returns {Object} Coverage analysis for each attacking type
 */
export const getTeamDefensiveCoverage = (team) => {
  const coverage = {};
  
  ALL_TYPES.forEach(attackingType => {
    const weakPokemon = [];
    const resistPokemon = [];
    
    team.forEach(pokemon => {
      let effectiveness = 1;
      
      // Check each of the Pokemon's types
      pokemon.types.forEach(defenderType => {
        // Check if this defender type is weak to the attacking type
        const weaknesses = TYPE_EFFECTIVENESS[defenderType] || [];
        if (weaknesses.includes(attackingType)) {
          effectiveness *= 2;
        }
        
        // Check if this defender type resists the attacking type
        const resistances = TYPE_RESISTANCES[defenderType] || [];
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