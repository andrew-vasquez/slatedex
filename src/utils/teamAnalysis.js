/**
 * Team Analysis Utilities
 * 
 * This file contains utility functions for analyzing Pokemon teams,
 * including type effectiveness calculations and team statistics.
 */

import { TYPE_EFFECTIVENESS, TYPE_RESISTANCES, ALL_TYPES } from '../constants/pokemon.js';

/**
 * Get team weaknesses by analyzing all Pokemon types in the team
 * @param {Array} team - Array of Pokemon objects
 * @returns {Array} Array of weakness objects sorted by count
 */
export const getTeamWeaknesses = (team) => {
  const weaknesses = {};
  
  team.forEach(pokemon => {
    pokemon.types.forEach(type => {
      const typeWeaknesses = TYPE_EFFECTIVENESS[type] || [];
      typeWeaknesses.forEach(weakness => {
        weaknesses[weakness] = (weaknesses[weakness] || 0) + 1;
      });
    });
  });
  
  return Object.entries(weaknesses)
    .sort(([,a], [,b]) => b - a)
    .map(([type, count]) => ({ type, count }));
};

/**
 * Calculate team statistics (average HP, Attack, Defense)
 * @param {Array} team - Array of Pokemon objects
 * @returns {Object} Object with avgHp, avgAttack, avgDefense
 */
export const calculateTeamStats = (team) => {
  if (team.length === 0) {
    return { avgHp: 0, avgAttack: 0, avgDefense: 0 };
  }
  
  const totalHp = team.reduce((sum, pokemon) => sum + pokemon.hp, 0);
  const totalAttack = team.reduce((sum, pokemon) => sum + pokemon.attack, 0);
  const totalDefense = team.reduce((sum, pokemon) => sum + pokemon.defense, 0);
  
  return {
    avgHp: Math.round(totalHp / team.length),
    avgAttack: Math.round(totalAttack / team.length),
    avgDefense: Math.round(totalDefense / team.length)
  };
};

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