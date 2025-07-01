import { Request, Response } from "express";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import { PRD } from "./generated";

export const getPrds =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    db.all("SELECT * FROM prds", [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  };

export const createPrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const prd: PRD = req.body;
    const now = new Date();
    const newPrd: PRD = {
      ...prd,
      id: uuidv4(),
      createdAt: now.toUTCString(),
      updatedAt: now.toUTCString(),
    };

    db.run(
      "INSERT INTO prds (id, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [
        newPrd.id,
        newPrd.title,
        newPrd.content,
        newPrd.createdAt,
        newPrd.updatedAt,
      ],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(newPrd);
      }
    );
  };

export const getPrdById =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;
    db.get("SELECT * FROM prds WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "PRD not found" });
        return;
      }
      res.json(row);
    });
  };

export const updatePrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;
    const prd: PRD = req.body;
    const now = new Date();
    const updatedPrd: PRD = {
      ...prd,
      id,
      updatedAt: now.toUTCString(),
    };

    db.run(
      "UPDATE prds SET title = ?, content = ?, updatedAt = ? WHERE id = ?",
      [updatedPrd.title, updatedPrd.content, updatedPrd.updatedAt, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(updatedPrd);
      }
    );
  };

export const deletePrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;
    db.run("DELETE FROM prds WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(204).send();
    });
  };
