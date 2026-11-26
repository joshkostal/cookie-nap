// Local recipe server. Saves each recipe as a JSON file in ./recipes
// Run with: node server.mjs
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = path.join(__dirname, "recipes");
const PORT = 3001;

await fs.mkdir(RECIPES_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());

const isValidId = (id) => /^[a-z0-9-]+$/.test(id);
const fileFor = (id) => path.join(RECIPES_DIR, `${id}.json`);
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "recipe";

const readRecipe = async (id) => JSON.parse(await fs.readFile(fileFor(id), "utf8"));

// List all recipes (newest first)
app.get("/api/recipes", async (_req, res) => {
  try {
    const files = (await fs.readdir(RECIPES_DIR)).filter((f) => f.endsWith(".json"));
    const recipes = await Promise.all(
      files.map((f) => readRecipe(f.replace(".json", "")))
    );
    recipes.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not read recipes." });
  }
});

// Create a recipe
app.post("/api/recipes", async (req, res) => {
  const { title, description, servings, time, ingredients, steps, notes } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "A title is required." });
  }
  const id = `${slugify(title)}-${Date.now().toString(36)}`;
  const recipe = {
    id,
    title: title.trim(),
    description: description || "",
    servings: servings || "",
    time: time || "",
    ingredients: ingredients || [],
    steps: steps || [],
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };
  try {
    await fs.writeFile(fileFor(id), JSON.stringify(recipe, null, 2));
    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save the recipe." });
  }
});

// Update a recipe
app.put("/api/recipes/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const existing = await readRecipe(id);
    const updated = { ...existing, ...req.body, id, createdAt: existing.createdAt };
    await fs.writeFile(fileFor(id), JSON.stringify(updated, null, 2));
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "Recipe not found." });
  }
});

// Delete a recipe
app.delete("/api/recipes/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    await fs.unlink(fileFor(id));
    res.json({ deleted: id });
  } catch (err) {
    res.status(404).json({ error: "Recipe not found." });
  }
});

app.listen(PORT, () => {
  console.log(`Recipe server running at http://localhost:${PORT}`);
  console.log(`Recipes are saved in ${RECIPES_DIR}`);
});