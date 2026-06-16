import { Product } from '../types';
import { products } from '../data/database';

export const getAllProducts = (): Product[] => {
  return products;
};

export const getProductById = (id: number): Product | undefined => {
  return products.find(p => p.id === id);
};

export const searchProducts = (keyword: string): Product[] => {
  const lowerKeyword = keyword.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerKeyword) ||
    p.category.toLowerCase().includes(lowerKeyword) ||
    p.spec.toLowerCase().includes(lowerKeyword)
  );
};
