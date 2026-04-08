package handlers

import (
	"net/http"

	"github.com/andrew-vasquez/pokeproxy/services"
)

func GetType(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")

	body, err := services.GetType(name)
	if err != nil {
		if err.Error() == "type not found" {
			http.Error(w, "Type not found", http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to fetch type", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
