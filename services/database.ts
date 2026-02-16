import * as SQLite from 'expo-sqlite';
import { CreateProductData, Product, UpdateProductData } from '../types/product';

const DB_NAME = 'estoque.db';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async init(): Promise<void> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
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

export const databaseService = DatabaseService.getInstance();