import { databaseService } from '../services/database-universal';
import { CreateProductData } from '../types/product';

const sampleProducts: CreateProductData[] = [
  {
    name: 'Smartphone Samsung Galaxy S23',
    quantity: 15,
    price: 2599.99,
  },
  {
    name: 'Notebook Dell Inspiron 15',
    quantity: 8,
    price: 3299.90,
  },
  {
    name: 'Fone de Ouvido Sony WH-1000XM4',
    quantity: 0,
    price: 899.99,
  },
  {
    name: 'Tablet Apple iPad Air',
    quantity: 3,
    price: 4199.00,
  },
  {
    name: 'Teclado Mecânico Logitech G Pro',
    quantity: 25,
    price: 549.90,
  },
  {
    name: 'Mouse Gamer Razer DeathAdder V3',
    quantity: 12,
    price: 299.99,
  },
  {
    name: 'Monitor LG UltraWide 29"',
    quantity: 4,
    price: 1299.00,
  },
  {
    name: 'SSD Kingston NV2 1TB',
    quantity: 18,
    price: 329.90,
  },
];

export const populateSampleData = async (): Promise<void> => {
  try {
    await databaseService.init();

    const existingProducts = await databaseService.getAllProducts();
    if (existingProducts.length > 0) {
      console.log('Database already has products, skipping sample data population');
      return;
    }

    console.log('Populating database with sample data...');
    for (const productData of sampleProducts) {
      await databaseService.createProduct(productData);
    }

    console.log(`Successfully added ${sampleProducts.length} sample products`);
  } catch (error) {
    console.error('Error populating sample data:', error);
  }
};