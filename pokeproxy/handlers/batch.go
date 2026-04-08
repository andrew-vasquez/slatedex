package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"

	"github.com/andrew-vasquez/pokeproxy/services"
)

type BatchRequest struct {
	Names []string `json:"names"`
}

type BatchResponse struct {
	Results map[string]json.RawMessage `json:"results"`
	Errors  map[string]string          `json:"errors"`
}

func BatchPokemon(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
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
		normalizedName := strings.ToLower(strings.TrimSpace(name))
		wg.Add(1)

		go func(name string) {
			defer wg.Done()

			body, err := services.GetPokemon(name)
			if err != nil {
				mu.Lock()
				if err.Error() == "pokemon not found" {
					response.Errors[name] = "Not found"
				} else {
					response.Errors[name] = "Failed to fetch"
				}
				mu.Unlock()
				return
			}

			mu.Lock()
			response.Results[name] = json.RawMessage(body)
			mu.Unlock()
		}(normalizedName)
	}

	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
