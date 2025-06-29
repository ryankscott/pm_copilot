package internal

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"pm-copilot-backend/generated"
)

// Make sure we conform to the generated interface
var _ generated.ServerInterface = (*TodoServer)(nil)

type TodoServer struct {
	DB *sql.DB
}

func (t *TodoServer) GetTodos(w http.ResponseWriter, r *http.Request) {
	rows, err := t.DB.Query("SELECT id, title, completed FROM todos")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var todos []generated.Todo
	for rows.Next() {
		var todo generated.Todo
		if err := rows.Scan(&todo.Id, &todo.Title, &todo.Completed); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		todos = append(todos, todo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todos)
}

func (t *TodoServer) PostTodos(w http.ResponseWriter, r *http.Request) {
	var todo generated.Todo
	if err := json.NewDecoder(r.Body).Decode(&todo); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := t.DB.Exec("INSERT INTO todos (title, completed) VALUES (?, ?)", todo.Title, todo.Completed)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	idInt64 := int64(id)
	todo.Id = &idInt64

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(todo)
}

func (t *TodoServer) GetTodosId(w http.ResponseWriter, r *http.Request, id int) {
	var todo generated.Todo
	err := t.DB.QueryRow("SELECT id, title, completed FROM todos WHERE id = ?", id).Scan(&todo.Id, &todo.Title, &todo.Completed)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Todo not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todo)
}

func (t *TodoServer) PutTodosId(w http.ResponseWriter, r *http.Request, id int) {
	var todo generated.Todo
	if err := json.NewDecoder(r.Body).Decode(&todo); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := t.DB.Exec("UPDATE todos SET title = ?, completed = ? WHERE id = ?", todo.Title, todo.Completed, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	idInt64 := int64(id)
	todo.Id = &idInt64

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todo)
}

func (t *TodoServer) DeleteTodosId(w http.ResponseWriter, r *http.Request, id int) {
	_, err := t.DB.Exec("DELETE FROM todos WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
