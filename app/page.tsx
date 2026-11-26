"use client";

import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3001/api/recipes";

const emptyForm = {
  title: "",
  description: "",
  servings: "",
  time: "",
  ingredients: "",
  steps: "",
  notes: "",
};

const toLines = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null); // null = not editing
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const selected = recipes.find((r) => r.id === selectedId);

  async function loadRecipes() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      setRecipes(await res.json());
      setError("");
    } catch {
      setError("Can't reach the recipe server. Start it with: node server.mjs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedId(null);
  }

  function startEdit(recipe) {
    setEditingId(recipe.id);
    setForm({
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      time: recipe.time,
      ingredients: recipe.ingredients.join("\n"),
      steps: recipe.steps.join("\n"),
      notes: recipe.notes,
    });
  }

  function cancelForm() {
    setForm(null);
    setEditingId(null);
  }

  async function saveRecipe(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give your recipe a title before saving.");
      return;
    }
    const body = {
      ...form,
      ingredients: toLines(form.ingredients),
      steps: toLines(form.steps),
    };
    try {
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      await loadRecipes();
      setSelectedId(saved.id);
      cancelForm();
      setError("");
    } catch {
      setError("Couldn't save the recipe. Check that the server is running.");
    }
  }

  async function deleteRecipe(id) {
    if (!window.confirm("Delete this recipe? This can't be undone.")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSelectedId(null);
      await loadRecipes();
    } catch {
      setError("Couldn't delete the recipe.");
    }
  }

  const setField = (name) => (e) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Recipe Box</h1>
        <button className="btn primary" onClick={startNew}>
          New recipe
        </button>
        <ul className="recipe-list">
          {recipes.map((r) => (
            <li key={r.id}>
              <button
                className={r.id === selectedId && !form ? "active" : ""}
                onClick={() => {
                  setSelectedId(r.id);
                  cancelForm();
                }}
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>
        {!loading && recipes.length === 0 && !error && (
          <p className="muted">No recipes yet. Add your first one.</p>
        )}
      </aside>

      <main className="main">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {form ? (
          <form className="form" onSubmit={saveRecipe}>
            <h2>{editingId ? "Edit recipe" : "New recipe"}</h2>

            <label>
              Title
              <input value={form.title} onChange={setField("title")} />
            </label>

            <label>
              Description
              <input
                value={form.description}
                onChange={setField("description")}
              />
            </label>

            <div className="row">
              <label>
                Servings
                <input
                  value={form.servings}
                  onChange={setField("servings")}
                  placeholder="4"
                />
              </label>
              <label>
                Total time
                <input
                  value={form.time}
                  onChange={setField("time")}
                  placeholder="45 minutes"
                />
              </label>
            </div>

            <label>
              Ingredients (one per line)
              <textarea
                rows={8}
                value={form.ingredients}
                onChange={setField("ingredients")}
              />
            </label>

            <label>
              Steps (one per line)
              <textarea
                rows={8}
                value={form.steps}
                onChange={setField("steps")}
              />
            </label>

            <label>
              Notes
              <textarea
                rows={4}
                value={form.notes}
                onChange={setField("notes")}
              />
            </label>

            <div className="actions">
              <button type="submit" className="btn primary">
                Save recipe
              </button>
              <button type="button" className="btn" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        ) : selected ? (
          <article className="recipe">
            <h2>{selected.title}</h2>
            {selected.description && (
              <p className="lede">{selected.description}</p>
            )}
            <p className="meta">
              {selected.servings && <span>Serves {selected.servings}</span>}
              {selected.time && <span>{selected.time}</span>}
            </p>

            <h3>Ingredients</h3>
            <ul className="ingredients">
              {selected.ingredients.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3>Method</h3>
            <ol className="steps">
              {selected.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>

            {selected.notes && (
              <>
                <h3>Notes</h3>
                <p className="lede">{selected.notes}</p>
              </>
            )}

            <div className="actions">
              <button className="btn" onClick={() => startEdit(selected)}>
                Edit
              </button>
              <button
                className="btn danger"
                onClick={() => deleteRecipe(selected.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ) : (
          <div className="empty">
            <h2>Pick a recipe or add a new one</h2>
            <p>Your recipes are saved as files in the app's recipes folder.</p>
          </div>
        )}
      </main>
    </div>
  );
}
