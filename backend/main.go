package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"pm-copilot-backend/generated"
	"pm-copilot-backend/internal"
)

func main() {
	db, err := internal.InitDB("todos.db")
	if err != nil {
		log.Fatal(err)
	}

	todoServer := &internal.TodoServer{
		DB: db,
	}

	r := chi.NewRouter()

	// Use the generated chi server handler
	generated.HandlerFromMux(todoServer, r)

	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
