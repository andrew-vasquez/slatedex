package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/andrew-vasquez/pokeproxy/cache"
)

type readinessResponse struct {
	OK      bool   `json:"ok"`
	Redis   string `json:"redis"`
	PokeAPI string `json:"pokeapi"`
}

func Readiness(w http.ResponseWriter, r *http.Request) {
	status := http.StatusOK
	response := readinessResponse{
		OK:      true,
		Redis:   "ok",
		PokeAPI: "ok",
	}

	if err := cache.Ping(); err != nil {
		status = http.StatusServiceUnavailable
		response.OK = false
		response.Redis = err.Error()
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("https://pokeapi.co/api/v2/pokemon/pikachu")
	if err != nil {
		status = http.StatusServiceUnavailable
		response.OK = false
		response.PokeAPI = err.Error()
		writeReadinessResponse(w, status, response)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		status = http.StatusServiceUnavailable
		response.OK = false
		response.PokeAPI = resp.Status
	}

	writeReadinessResponse(w, status, response)
}

func writeReadinessResponse(w http.ResponseWriter, status int, response readinessResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}
