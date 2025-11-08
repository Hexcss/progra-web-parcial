import { lazy, type LazyExoticComponent, type ComponentType } from "react";
import type { ModalPropsMap } from "../utils/types/modal.type";

type LazyComp<P> = LazyExoticComponent<ComponentType<P>>;

export const modalRegistry: {
  [K in keyof ModalPropsMap]: LazyComp<ModalPropsMap[K]>;
} = {
  shoppingCart: lazy(() => import("../components/Modals/Cart/ShoppingCartModal")),
  profile: lazy(() => import("../components/Modals/Profile/ProfileModal")),
  product: lazy(() => import("../components/Modals/Product/ProductModal")),
  deleteProduct: lazy(() => import("../components/Modals/Product/DeleteProductModal")),
  category: lazy(() => import("../components/Modals/Category/CategoryModal")),
  deleteCategory: lazy(() => import("../components/Modals/Category/DeleteCategoryModal")),
  user: lazy(() => import("../components/Modals/User/UserModal")),
  deleteUser: lazy(() => import("../components/Modals/User/DeleteUserModal")),
  productDiscounts: lazy(() => import("../components/Modals/Product/ProductDiscountsModal")),
  productReviews: lazy(() => import("../components/Modals/Product/ProductReviewsModal")),
  orderStatus: lazy(() => import("../components/Modals/Order/OrderModal")),
};
