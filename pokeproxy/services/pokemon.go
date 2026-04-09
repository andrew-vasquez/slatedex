package services

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/andrew-vasquez/pokeproxy/cache"
)

func GetPokemonList() ([]byte, error) {
	cacheKey := "pokemon:list"

	cached, err := cache.Get(cacheKey)
	if err == nil {
		return []byte(cached), nil
	}
	if !cache.IsMiss(err) {
		log.Printf("cache read failed for %s: %v", cacheKey, err)
	}
	resp, err := http.Get("https://pokeapi.co/api/v2/pokemon?limit=1302&offset=0")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pokeapi returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = cache.SetWithTTL(cacheKey, string(body), 7*24*time.Hour)
	if err != nil {
		log.Printf("cache write failed for %s: %v", cacheKey, err)
	}

	return body, nil
}

func GetPokemon(name string) ([]byte, error) {
	name = strings.ToLower(strings.TrimSpace(name))
	cacheKey := "pokemon:" + name

	cached, err := cache.Get(cacheKey)
	if err == nil {
		return []byte(cached), nil
	}
	if !cache.IsMiss(err) {
		log.Printf("cache read failed for %s: %v", cacheKey, err)
	}
	resp, err := http.Get(fmt.Sprintf("https://pokeapi.co/api/v2/pokemon/%s", name))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("pokemon not found")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pokeapi returned status %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = cache.SetWithTTL(cacheKey, string(body), 24*time.Hour)
	if err != nil {
		log.Printf("cache write failed for %s: %v", cacheKey, err)
	}
	return body, nil
}
