/**
 * Team Management Hook
 * 
 * Custom hook that encapsulates all team management logic including
 * adding, removing, shuffling Pokemon and localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing Pokemon team state and operations
 * @param {Object} selectedGame - The currently selected game
 * @returns {Object} Team state and management functions
 */
export const useTeamManagement = (selectedGame) => {
  const [team, setTeam] = useState(Array(6).fill(null));

  // Load saved team from localStorage when game changes
  useEffect(() => {
    const savedTeam = localStorage.getItem(`team_gen_${selectedGame.generation}`);
    if (savedTeam) {
      try {
        setTeam(JSON.parse(savedTeam));
      } catch (error) {
        console.error('Error loading saved team:', error);
        setTeam(Array(6).fill(null));
      }
    } else {
      setTeam(Array(6).fill(null));
    }
  }, [selectedGame.generation]);

  // Save team to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`team_gen_${selectedGame.generation}`, JSON.stringify(team));
  }, [team, selectedGame.generation]);

  /**
   * Add a Pokemon to the first available team slot
   * @param {Object} pokemon - Pokemon to add to team
   */
  const addPokemonToTeam = useCallback((pokemon) => {
    const firstEmptySlot = team.findIndex(slot => slot === null);
    if (firstEmptySlot !== -1) {
      const newTeam = [...team];
      newTeam[firstEmptySlot] = pokemon;
      setTeam(newTeam);
    }
  }, [team]);

  /**
   * Remove a Pokemon from a specific team slot
   * @param {number} index - Index of the slot to clear
   */
  const removeFromTeam = useCallback((index) => {
    const newTeam = [...team];
    newTeam[index] = null;
    setTeam(newTeam);
  }, [team]);

  /**
   * Clear all Pokemon from the team
   */
  const clearTeam = useCallback(() => {
    setTeam(Array(6).fill(null));
  }, []);

  /**
   * Shuffle the current team members randomly
   */
  const shuffleTeam = useCallback(() => {
    const currentTeam = team.filter(p => p !== null);
    for (let i = currentTeam.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentTeam[i], currentTeam[j]] = [currentTeam[j], currentTeam[i]];
    }
    setTeam([...currentTeam, ...Array(6 - currentTeam.length).fill(null)]);
  }, [team]);

  /**
   * Add Pokemon to a specific team slot (for drag & drop)
   * @param {Object} pokemon - Pokemon to add
   * @param {number} slotIndex - Target slot index
   */
  const addToSlot = useCallback((pokemon, slotIndex) => {
    if (slotIndex >= 0 && slotIndex < 6) {
      const newTeam = [...team];
      newTeam[slotIndex] = pokemon;
      setTeam(newTeam);
    }
  }, [team]);

  // Derived state
  const currentTeam = team.filter(p => p !== null);
  const teamPokemonIds = currentTeam.map(p => p.id);

  return {
    team,
    currentTeam,
    teamPokemonIds,
    addPokemonToTeam,
    removeFromTeam,
    clearTeam,
    shuffleTeam,
    addToSlot
  };
}; 