export interface Product {
  id: string;
  title: string;
  location: string;
  price: string;
  type: 'Sale' | 'Rent';
  rating: number;
  image: string;
  category: string;
  sellerId: string;
  createdAt: string;
}
