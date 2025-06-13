/**
 * Pokemon Game and Species Data
 * 
 * This file contains the core Pokemon data including game information
 * and Pokemon species data with their stats and sprites.
 */

// Pokemon game generations with their associated starter and legendary Pokemon
export const MAINLINE_GAMES = [
  { 
    id: 1, 
    name: 'Red/Blue/Yellow', 
    generation: 1, 
    region: 'Kanto',
    starters: ['bulbasaur', 'charmander', 'squirtle'],
    legendaries: ['mewtwo']
  },
  { 
    id: 2, 
    name: 'Gold/Silver/Crystal', 
    generation: 2, 
    region: 'Johto',
    starters: ['chikorita', 'cyndaquil', 'totodile'],
    legendaries: ['lugia', 'ho-oh']
  },
  { 
    id: 3, 
    name: 'Ruby/Sapphire/Emerald', 
    generation: 3, 
    region: 'Hoenn',
    starters: ['treecko', 'torchic', 'mudkip'],
    legendaries: ['rayquaza']
  },
  { 
    id: 4, 
    name: 'Diamond/Pearl/Platinum', 
    generation: 4, 
    region: 'Sinnoh',
    starters: ['turtwig', 'chimchar', 'piplup'],
    legendaries: ['arceus']
  },
  { 
    id: 5, 
    name: 'Black/White/Black 2/White 2', 
    generation: 5, 
    region: 'Unova',
    starters: ['snivy', 'tepig', 'oshawott'],
    legendaries: ['reshiram']
  },
  { 
    id: 6, 
    name: 'X/Y', 
    generation: 6, 
    region: 'Kalos',
    starters: ['chespin', 'fennekin', 'froakie'],
    legendaries: ['yveltal']
  },
  { 
    id: 7, 
    name: 'Sun/Moon/Ultra Sun/Ultra Moon', 
    generation: 7, 
    region: 'Alola',
    starters: ['rowlet', 'litten', 'popplio'],
    legendaries: ['cosmog']
  },
  { 
    id: 8, 
    name: 'Sword/Shield', 
    generation: 8, 
    region: 'Galar',
    starters: ['grookey', 'scorbunny', 'sobble'],
    legendaries: ['eternatus']
  },
  { 
    id: 9, 
    name: 'Scarlet/Violet', 
    generation: 9, 
    region: 'Paldea',
    starters: ['sprigatito', 'fuecoco', 'quaxly'],
    legendaries: ['koraidon', 'miraidon']
  }
];

// Pokemon species data with stats and sprites
// In a real application, this would come from an API like PokeAPI
export const POKEMON_DATA = [
  // Generation 1
  { id: 1, name: 'Bulbasaur', types: ['grass', 'poison'], generation: 1, hp: 45, attack: 49, defense: 49, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
  { id: 2, name: 'Ivysaur', types: ['grass', 'poison'], generation: 1, hp: 60, attack: 62, defense: 63, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png' },
  { id: 3, name: 'Venusaur', types: ['grass', 'poison'], generation: 1, hp: 80, attack: 82, defense: 83, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png' },
  { id: 4, name: 'Charmander', types: ['fire'], generation: 1, hp: 39, attack: 52, defense: 43, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
  { id: 5, name: 'Charmeleon', types: ['fire'], generation: 1, hp: 58, attack: 64, defense: 58, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png' },
  { id: 6, name: 'Charizard', types: ['fire', 'flying'], generation: 1, hp: 78, attack: 84, defense: 78, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png' },
  { id: 7, name: 'Squirtle', types: ['water'], generation: 1, hp: 44, attack: 48, defense: 65, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
  { id: 8, name: 'Wartortle', types: ['water'], generation: 1, hp: 59, attack: 63, defense: 80, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png' },
  { id: 9, name: 'Blastoise', types: ['water'], generation: 1, hp: 79, attack: 83, defense: 100, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png' },
  { id: 25, name: 'Pikachu', types: ['electric'], generation: 1, hp: 35, attack: 55, defense: 40, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  { id: 26, name: 'Raichu', types: ['electric'], generation: 1, hp: 60, attack: 90, defense: 55, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png' },
  { id: 150, name: 'Mewtwo', types: ['psychic'], generation: 1, hp: 106, attack: 110, defense: 90, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png' },
  { id: 151, name: 'Mew', types: ['psychic'], generation: 1, hp: 100, attack: 100, defense: 100, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png' },
  
  // Generation 2
  { id: 152, name: 'Chikorita', types: ['grass'], generation: 2, hp: 45, attack: 49, defense: 65, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/152.png' },
  { id: 155, name: 'Cyndaquil', types: ['fire'], generation: 2, hp: 39, attack: 52, defense: 43, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/155.png' },
  { id: 158, name: 'Totodile', types: ['water'], generation: 2, hp: 50, attack: 65, defense: 64, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/158.png' },
  { id: 249, name: 'Lugia', types: ['psychic', 'flying'], generation: 2, hp: 106, attack: 90, defense: 130, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png' },
  { id: 250, name: 'Ho-Oh', types: ['fire', 'flying'], generation: 2, hp: 106, attack: 130, defense: 90, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png' },
  
  // Generation 3
  { id: 252, name: 'Treecko', types: ['grass'], generation: 3, hp: 40, attack: 45, defense: 35, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/252.png' },
  { id: 255, name: 'Torchic', types: ['fire'], generation: 3, hp: 45, attack: 60, defense: 40, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/255.png' },
  { id: 258, name: 'Mudkip', types: ['water'], generation: 3, hp: 50, attack: 70, defense: 50, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/258.png' },
  { id: 384, name: 'Rayquaza', types: ['dragon', 'flying'], generation: 3, hp: 105, attack: 150, defense: 90, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png' },
  
  // Generation 4
  { id: 387, name: 'Turtwig', types: ['grass'], generation: 4, hp: 55, attack: 68, defense: 64, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/387.png' },
  { id: 390, name: 'Chimchar', types: ['fire'], generation: 4, hp: 44, attack: 58, defense: 44, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/390.png' },
  { id: 393, name: 'Piplup', types: ['water'], generation: 4, hp: 53, attack: 51, defense: 53, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/393.png' },
  { id: 493, name: 'Arceus', types: ['normal'], generation: 4, hp: 120, attack: 120, defense: 120, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/493.png' },
  
  // Generation 5
  { id: 495, name: 'Snivy', types: ['grass'], generation: 5, hp: 45, attack: 45, defense: 55, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/495.png' },
  { id: 498, name: 'Tepig', types: ['fire'], generation: 5, hp: 65, attack: 63, defense: 45, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/498.png' },
  { id: 501, name: 'Oshawott', types: ['water'], generation: 5, hp: 55, attack: 55, defense: 45, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/501.png' },
  { id: 643, name: 'Reshiram', types: ['dragon', 'fire'], generation: 5, hp: 100, attack: 120, defense: 100, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/643.png' },
  
  // Generation 6
  { id: 650, name: 'Chespin', types: ['grass'], generation: 6, hp: 56, attack: 61, defense: 65, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/650.png' },
  { id: 653, name: 'Fennekin', types: ['fire'], generation: 6, hp: 40, attack: 45, defense: 40, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/653.png' },
  { id: 656, name: 'Froakie', types: ['water'], generation: 6, hp: 41, attack: 56, defense: 40, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/656.png' },
  { id: 717, name: 'Yveltal', types: ['dark', 'flying'], generation: 6, hp: 126, attack: 131, defense: 95, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/717.png' },
  
  // Generation 7
  { id: 722, name: 'Rowlet', types: ['grass', 'flying'], generation: 7, hp: 68, attack: 55, defense: 55, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/722.png' },
  { id: 725, name: 'Litten', types: ['fire'], generation: 7, hp: 45, attack: 65, defense: 40, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/725.png' },
  { id: 728, name: 'Popplio', types: ['water'], generation: 7, hp: 50, attack: 54, defense: 54, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/728.png' },
  { id: 789, name: 'Cosmog', types: ['psychic'], generation: 7, hp: 43, attack: 29, defense: 31, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/789.png' },
  
  // Generation 8
  { id: 810, name: 'Grookey', types: ['grass'], generation: 8, hp: 50, attack: 65, defense: 50, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/810.png' },
  { id: 813, name: 'Scorbunny', types: ['fire'], generation: 8, hp: 50, attack: 71, defense: 40, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/813.png' },
  { id: 816, name: 'Sobble', types: ['water'], generation: 8, hp: 50, attack: 40, defense: 40, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/816.png' },
  { id: 890, name: 'Eternatus', types: ['poison', 'dragon'], generation: 8, hp: 140, attack: 85, defense: 95, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/890.png' },
  
  // Generation 9
  { id: 906, name: 'Sprigatito', types: ['grass'], generation: 9, hp: 40, attack: 61, defense: 54, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/906.png' },
  { id: 909, name: 'Fuecoco', types: ['fire'], generation: 9, hp: 67, attack: 45, defense: 59, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/909.png' },
  { id: 912, name: 'Quaxly', types: ['water'], generation: 9, hp: 55, attack: 65, defense: 45, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/912.png' },
  { id: 1007, name: 'Koraidon', types: ['fighting', 'dragon'], generation: 9, hp: 100, attack: 135, defense: 115, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1007.png' },
  { id: 1008, name: 'Miraidon', types: ['electric', 'dragon'], generation: 9, hp: 100, attack: 85, defense: 100, sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1008.png' }
];

/**
 */
export const getPokemonByGeneration = (generation) => {
  return POKEMON_DATA.filter(pokemon => pokemon.generation <= generation);
};

// Re-export team analysis functions for backward compatibility
export { getTeamDefensiveCoverage, getTeamWeaknesses, calculateTeamStats } from '../utils/teamAnalysis.js';
