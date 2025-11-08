// src/utils/types/modal.type.ts
export interface ModalPropsMap {
  shoppingCart: {
    onCheckout?: () => void | Promise<void>;
  };
  profile: {};
  product: { id?: string };
  deleteProduct: { id: string; name: string };
  category: { id?: string };
  deleteCategory: { id: string; name: string };
  user: { id?: string };
  deleteUser: { id: string; email?: string; displayName?: string };
  productDiscounts: { productId: string; productName?: string };
  productReviews: { productId: string; productName?: string };
  orderStatus: { orderId: string; currentStatus: string };
}

export type ModalType = {
  [K in keyof ModalPropsMap]: { type: K; props: ModalPropsMap[K] };
}[keyof ModalPropsMap];
