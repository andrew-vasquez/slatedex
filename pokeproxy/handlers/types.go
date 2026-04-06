package handlers

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/andrew-vasquez/pokeproxy/cache"
)

func GetType(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")

	cached, err := cache.Get("type:" + name)
	if err == nil {
		fmt.Println("cache hit - type:", name)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cached))
		return
	}

	fmt.Println("cache miss - type:", name)
	resp, err := http.Get(fmt.Sprintf("https://pokeapi.co/api/v2/type/%s", name))
	if err != nil {
		http.Error(w, "Failed to fetch type", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		http.Error(w, "Type not found", http.StatusNotFound)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response", http.StatusInternalServerError)
		return
	}

	cache.SetWithTTL("type:"+name, string(body), 30*24*time.Hour)

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
