export type Recipe = {
  id: string;
  title: string;
  description: string;
  servings: string;
  time: string;
  ingredients: string[];
  steps: string[];
  notes: string;
};

export type RecipeForm = {
  title: string;
  description: string;
  servings: string;
  time: string;
  ingredients: string;
  steps: string;
  notes: string;
};
