package internal

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"pm-copilot-backend/generated"
)

// Make sure we conform to the generated interface
var _ generated.ServerInterface = (*PrdServer)(nil)

type PrdServer struct {
	DB *sql.DB
}

func (p *PrdServer) GetPrds(w http.ResponseWriter, r *http.Request) {
	rows, err := p.DB.Query("SELECT id, title, content, createdAt, updatedAt FROM prds")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var prds []generated.PRD
	for rows.Next() {
		var prd generated.PRD
		if err := rows.Scan(&prd.Id, &prd.Title, &prd.Content, &prd.CreatedAt, &prd.UpdatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		prds = append(prds, prd)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prds)
}

func (p *PrdServer) PostPrds(w http.ResponseWriter, r *http.Request) {
	var prd generated.PRD
	if err := json.NewDecoder(r.Body).Decode(&prd); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id := uuid.New().String()
	now := time.Now()

	prd.Id = &id
	prd.CreatedAt = &now
	prd.UpdatedAt = &now

	_, err := p.DB.Exec("INSERT INTO prds (id, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)", prd.Id, prd.Title, prd.Content, prd.CreatedAt, prd.UpdatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(prd)
}

func (p *PrdServer) GetPrdsId(w http.ResponseWriter, r *http.Request, id string) {
	var prd generated.PRD
	err := p.DB.QueryRow("SELECT id, title, content, createdAt, updatedAt FROM prds WHERE id = ?", id).Scan(&prd.Id, &prd.Title, &prd.Content, &prd.CreatedAt, &prd.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "PRD not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prd)
}

func (p *PrdServer) PutPrdsId(w http.ResponseWriter, r *http.Request, id string) {
	var prd generated.PRD
	if err := json.NewDecoder(r.Body).Decode(&prd); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	now := time.Now()
	prd.UpdatedAt = &now

	_, err := p.DB.Exec("UPDATE prds SET title = ?, content = ?, updatedAt = ? WHERE id = ?", prd.Title, prd.Content, prd.UpdatedAt, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	prd.Id = &id

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prd)
}

func (p *PrdServer) DeletePrdsId(w http.ResponseWriter, r *http.Request, id string) {
	_, err := p.DB.Exec("DELETE FROM prds WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
