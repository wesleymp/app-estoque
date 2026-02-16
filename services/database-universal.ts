import { Platform } from 'react-native';
import { CreateProductData, Product, UpdateProductData } from '../types/product';

class WebDatabaseService {
  private storageKey = 'estoque_products';

  async init(): Promise<void> {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  private getProducts(): Product[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveProducts(products: Product[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(products));
  }

  private generateId(): number {
    const products = this.getProducts();
    return products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  }

  async getAllProducts(): Promise<Product[]> {
    return this.getProducts().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getProductById(id: number): Promise<Product | null> {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    const products = this.getProducts();
    const now = new Date().toISOString();
    
    const newProduct: Product = {
      id: this.generateId(),
      ...productData,
      createdAt: now,
      updatedAt: now,
    };

    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  async updateProduct(productData: UpdateProductData): Promise<Product> {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productData.id);
    
    if (index === -1) {
      throw new Error('Product not found');
    }

    const updatedProduct = {
      ...products[index],
      ...productData,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;
    this.saveProducts(products);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const products = this.getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    
    if (filteredProducts.length === products.length) {
      return false;
    }

    this.saveProducts(filteredProducts);
    return true;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = this.getProducts();
    return products
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async close(): Promise<void> {
  }
}

class MobileDatabaseService {
  private static instance: MobileDatabaseService;
  private db: any = null;

  private constructor() {}

  static getInstance(): MobileDatabaseService {
    if (!MobileDatabaseService.instance) {
      MobileDatabaseService.instance = new MobileDatabaseService();
    }
    return MobileDatabaseService.instance;
  }

  async init(): Promise<void> {
    if (!this.db) {
      const SQLite = require('expo-sqlite');
      this.db = await SQLite.openDatabaseAsync('estoque.db');
      await this.createTables();
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        imageUri TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_products_timestamp
        AFTER UPDATE ON products
      BEGIN
        UPDATE products SET updatedAt = datetime('now') WHERE id = NEW.id;
      END;
    `);
  }

  async getAllProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync('SELECT * FROM products ORDER BY updatedAt DESC');
    return result as Product[];
  }

  async getProductById(id: number): Promise<Product | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
    return result as Product | null;
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'INSERT INTO products (name, quantity, price, imageUri) VALUES (?, ?, ?, ?)',
      [productData.name, productData.quantity, productData.price, productData.imageUri || null]
    );

    const newProduct = await this.getProductById(result.lastInsertRowId);
    if (!newProduct) {
      throw new Error('Failed to create product');
    }

    return newProduct;
  }

  async updateProduct(productData: UpdateProductData): Promise<Product> {
    if (!this.db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const values: any[] = [];

    if (productData.name !== undefined) {
      updates.push('name = ?');
      values.push(productData.name);
    }
    if (productData.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(productData.quantity);
    }
    if (productData.price !== undefined) {
      updates.push('price = ?');
      values.push(productData.price);
    }
    if (productData.imageUri !== undefined) {
      updates.push('imageUri = ?');
      values.push(productData.imageUri);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(productData.id);

    await this.db.runAsync(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedProduct = await this.getProductById(productData.id);
    if (!updatedProduct) {
      throw new Error('Product not found');
    }

    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync('DELETE FROM products WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync(
      'SELECT * FROM products WHERE name LIKE ? ORDER BY updatedAt DESC',
      [`%${query}%`]
    );
    return result as Product[];
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

function createDatabaseService() {
  if (Platform.OS === 'web') {
    return new WebDatabaseService();
  } else {
    return MobileDatabaseService.getInstance();
  }
}

export const databaseService = createDatabaseService();