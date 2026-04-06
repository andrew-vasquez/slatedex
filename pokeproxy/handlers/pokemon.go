package handlers

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/andrew-vasquez/pokeproxy/cache"
)

func GetPokemonList(w http.ResponseWriter, r *http.Request) {
	cached, err := cache.Get("pokemon:list")
	if err == nil {
		fmt.Println("cache hit: pokemon list")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cached))
		return
	}
	fmt.Println("cache miss: pokemon list")
	resp, err := http.Get("https://pokeapi.co/api/v2/pokemon?limit=1302&offset=0")
	if err != nil {
		http.Error(w, "Failed to fetch pokemon list", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response", http.StatusInternalServerError)
		return
	}
	cache.SetWithTTL("pokemon:list", string(body), 7*24*time.Hour)

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)

}

func GetPokemon(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")

	//Tries to cache first
	cached, err := cache.Get(name)
	if err != nil {
		fmt.Println("cache hit:", name)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cached))
		return
	}

	// Cache miss - Hit PokeAPI
	fmt.Println("cache miss:", name)
	resp, err := http.Get(fmt.Sprintf("https://pokeapi.co/api/v2/pokemon/%s", name))
	if err != nil {
		http.Error(w, "Failed to fetch pokemon", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		http.Error(w, " Pokemon not found", http.StatusNotFound)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response", http.StatusInternalServerError)
		return
	}

	cache.Set(name, string(body))
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
