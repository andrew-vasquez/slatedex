package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"

	"github.com/andrew-vasquez/pokeproxy/cache"
)

type BatchRequest struct {
	Names []string `json:"names"`
}

type BatchResponse struct {
	Results map[string]json.RawMessage `json:"results"`
	Errors  map[string]string          `json:"errors"`
}

func BatchPokemon(w http.ResponseWriter, r *http.Request) {
	var req BatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Names) == 0 {
		http.Error(w, "No names provided", http.StatusBadRequest)
		return
	}

	if len(req.Names) > 6 {
		http.Error(w, "Max 6 pokemon per request", http.StatusBadRequest)
		return
	}

	response := BatchResponse{
		Results: make(map[string]json.RawMessage),
		Errors:  make(map[string]string),
	}

	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, name := range req.Names {
		wg.Add(1)
		go func(name string) {
			defer wg.Done()

			// try cache first
			cached, err := cache.Get("pokemon:" + name)
			if err == nil {
				fmt.Println("cache hit - batch:", name)
				mu.Lock()
				response.Results[name] = json.RawMessage(cached)
				mu.Unlock()
				return
			}

			// cache miss — hit PokeAPI
			fmt.Println("cache miss - batch:", name)
			resp, err := http.Get(fmt.Sprintf("https://pokeapi.co/api/v2/pokemon/%s", name))
			if err != nil {
				mu.Lock()
				response.Errors[name] = "Failed to fetch"
				mu.Unlock()
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode == 404 {
				mu.Lock()
				response.Errors[name] = "Not found"
				mu.Unlock()
				return
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				mu.Lock()
				response.Errors[name] = "Failed to read response"
				mu.Unlock()
				return
			}

			cache.Set("pokemon:"+name, string(body))

			mu.Lock()
			response.Results[name] = json.RawMessage(body)
			mu.Unlock()
		}(name)
	}

	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
