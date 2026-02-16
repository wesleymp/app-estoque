export interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  imageUri?: string;
  updatedAt: string;
  createdAt: string;
}

export interface CreateProductData {
  name: string;
  quantity: number;
  price: number;
  imageUri?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: number;
}