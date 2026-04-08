package services

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/andrew-vasquez/pokeproxy/cache"
)

func GetType(name string) ([]byte, error) {
	cacheKey := "type:" + name

	cached, err := cache.Get(cacheKey)
	if err == nil {
		return []byte(cached), nil
	}
	resp, err := http.Get(fmt.Sprintf("https://pokeapi.co/api/v2/type/%s", name))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("type not found")
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = cache.SetWithTTL(cacheKey, string(body), 7*24*time.Hour)
	if err != nil {
		return nil, err
	}
	return body, nil
}
