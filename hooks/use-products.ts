import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { databaseService } from '../services/database-universal';
import { CreateProductData, Product, UpdateProductData } from '../types/product';
import { populateSampleData } from '../utils/sample-data';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initializeDatabase = useCallback(async () => {
    try {
      await databaseService.init();
      await populateSampleData();
    } catch (error) {
      console.error('Error initializing database:', error);
      Alert.alert('Erro', 'Não foi possível inicializar o banco de dados.');
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const productsData = await databaseService.getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const productsData = await databaseService.getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error refreshing products:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os produtos.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: CreateProductData) => {
    try {
      const newProduct = await databaseService.createProduct(productData);
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Erro', 'Não foi possível criar o produto.');
      throw error;
    }
  }, []);

  const updateProduct = useCallback(async (productData: UpdateProductData) => {
    try {
      const updatedProduct = await databaseService.updateProduct(productData);
      setProducts(prev =>
        prev.map(product =>
          product.id === updatedProduct.id ? updatedProduct : product
        )
      );
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (id: number) => {
    try {
      const success = await databaseService.deleteProduct(id);
      if (success) {
        setProducts(prev => prev.filter(product => product.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Erro', 'Não foi possível excluir o produto.');
      throw error;
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      const searchResults = await databaseService.searchProducts(query);
      setProducts(searchResults);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Erro', 'Não foi possível realizar a pesquisa.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await initializeDatabase();
      if (mounted) {
        await loadProducts();
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [initializeDatabase, loadProducts]);

  return {
    products,
    isLoading,
    isRefreshing,
    loadProducts,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
  };
};