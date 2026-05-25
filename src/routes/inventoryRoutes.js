import { Router } from 'express';
import {
  getIngredients, createIngredient, updateIngredient, addStock, deleteIngredient,
  getRecipes, upsertRecipe, deleteRecipe,
  getDishMargins,
} from '../controllers/inventoryController.js';

const router = Router();

router.get('/ingredients',              getIngredients);
router.post('/ingredients',             createIngredient);
router.patch('/ingredients/:id',        updateIngredient);
router.post('/ingredients/:id/stock',   addStock);
router.delete('/ingredients/:id',       deleteIngredient);

router.get('/recipes',                  getRecipes);
router.post('/recipes',                 upsertRecipe);
router.delete('/recipes/:id',           deleteRecipe);

router.get('/margins',                  getDishMargins);

export default router;
