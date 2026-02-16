import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Product } from '../types/product';

interface ProductItemProps {
  product: Product;
  onPress?: () => void;
  onDelete?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}

export const ProductItem: React.FC<ProductItemProps> = ({
  product,
  onPress,
  onDelete,
  onEdit,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja realmente excluir o produto "${product.name}"?`)) {
        onDelete?.(product);
      }
    } else {
      Alert.alert(
        'Confirmar exclusão',
        `Deseja realmente excluir o produto "${product.name}"?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => onDelete?.(product),
          },
        ]
      );
    }
  };

  const getQuantityStyle = (quantity: number) => {
    if (quantity === 0) return styles.quantityZero;
    if (quantity <= 5) return styles.quantityLow;
    return styles.quantityNormal;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {product.imageUri ? (
          <Image source={{ uri: product.imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color="#666" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit?.(product)}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.quantityContainer}>
              <Text style={styles.label}>Quantidade:</Text>
              <Text style={[styles.quantity, getQuantityStyle(product.quantity)]}>
                {product.quantity}
              </Text>
            </View>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.dateLabel}>
              Atualizado: {formatDate(product.updatedAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityNormal: {
    color: '#34C759',
  },
  quantityLow: {
    color: '#FF9500',
  },
  quantityZero: {
    color: '#FF3B30',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
  },
});