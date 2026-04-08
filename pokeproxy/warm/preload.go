package warm

import (
	"log"
	"sync"

	"github.com/andrew-vasquez/pokeproxy/services"
)

func Preload() {
	log.Println("warming cache...")

	// 1. warm pokemon list
	_, err := services.GetPokemonList()
	if err != nil {
		log.Println("failed to warm pokemon list:", err)
	} else {
		log.Println("warmed pokemon list")
	}

	var wg sync.WaitGroup

	// 2. warm all types
	for _, typeName := range PokemonTypes {
		wg.Add(1)

		go func(typeName string) {
			defer wg.Done()

			_, err := services.GetType(typeName)
			if err != nil {
				log.Println("failed to warm type:", typeName, err)
				return
			}

			log.Println("warmed type:", typeName)
		}(typeName)
	}

	// 3. warm popular pokemon
	for _, name := range PopularPokemon {
		wg.Add(1)

		go func(name string) {
			defer wg.Done()

			_, err := services.GetPokemon(name)
			if err != nil {
				log.Println("failed to warm pokemon:", name, err)
				return
			}

			log.Println("warmed pokemon:", name)
		}(name)
	}

	wg.Wait()
	log.Println("warm cache complete")
}
