package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/andrew-vasquez/pokeproxy/cache"
	"github.com/andrew-vasquez/pokeproxy/handlers"
	"github.com/andrew-vasquez/pokeproxy/warm"
	"github.com/joho/godotenv"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigins := strings.Split(os.Getenv("ALLOWED_ORIGIN"), ",")
		for _, allowedOrigin := range allowedOrigins {
			normalized := strings.TrimSpace(allowedOrigin)
			if normalized != "" && origin == normalized {
				w.Header().Set("Access-Control-Allow-Origin", normalized)
				w.Header().Set("Vary", "Origin")
				break
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func main() {
	godotenv.Load()
	cache.Init()

	go warm.Preload()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"

	}

	http.HandleFunc("/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}))
	http.HandleFunc("/pokemon", corsMiddleware(handlers.GetPokemonList))

	http.HandleFunc("/pokemon/{name}", corsMiddleware(handlers.GetPokemon))

	http.HandleFunc("/type/{name}", corsMiddleware(handlers.GetType))

	http.HandleFunc("/pokemon/batch", corsMiddleware(handlers.BatchPokemon))

	fmt.Printf("Server running on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
