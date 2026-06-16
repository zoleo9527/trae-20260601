import { Router } from 'express';
import { getAllProducts, getProductById, searchProducts } from '../services/productService';

const router = Router();

router.get('/', (req, res) => {
  const keyword = req.query.keyword as string || '';
  if (keyword) {
    const products = searchProducts(keyword);
    res.json(products);
  } else {
    const products = getAllProducts();
    res.json(products);
  }
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const product = getProductById(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

export default router;
