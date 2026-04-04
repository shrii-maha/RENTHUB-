export interface Product {
  id: string;
  title: string;
  location: string;
  price: string;
  type: 'Sale' | 'Rent';
  rating: number;
  image: string;
  images?: string[];
  category: string;
  sellerId: string;
  status?: 'pending' | 'approved' | 'rejected' | 'sold' | 'rented';
  createdAt: string;
}
