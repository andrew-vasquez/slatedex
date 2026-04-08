package handlers

import (
	"net/http"

	"github.com/andrew-vasquez/pokeproxy/services"
)

func GetPokemonList(w http.ResponseWriter, r *http.Request) {
	body, err := services.GetPokemonList()
	if err != nil {
		http.Error(w, "Failed to fetch pokemon list", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func GetPokemon(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")

	body, err := services.GetPokemon(name)
	if err != nil {
		if err.Error() == "pokemon not found" {
			http.Error(w, "Pokemon not found", http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to fetch pokemon", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
