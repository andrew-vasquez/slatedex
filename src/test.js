import Pokedex from "pokedex-promise-v2";

const P = new Pokedex();

P.getGenerationByName("generation-i").then(response => {
    console.log(response);
});