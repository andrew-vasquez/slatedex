import Pokedex from "pokedex-promise-v2";

const P = new Pokedex();


export const gen1 = P.getPokemonsList("Generation-I").then(response => {
    return response;
}).catch(error => {
    console.log(error)
});

export const gen2 = P.getPokemonsList("Generation-II").then(response => {
    return response;
}).catch(error => {
    console.log(error);
});

export const gen3 = P.getPokemonsList("Generation-III").then(response => {
    return response;
}).catch(error => {
    console.log(error);
    });

export const gen4 = P.getPokemonsList("Generation-IV").then(response => {
    return response;
}).catch(error => {
    console.log(error);
});


console.log(gen2);