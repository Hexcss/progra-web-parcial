// src/views/portal/products/index.tsx
import { useMemo } from "react";
import { Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ReviewsIcon from "@mui/icons-material/Reviews";
import PortalLayout from "../../../../layouts/Wrappers/PortalLayout";
import { TableLayout } from "../../../../layouts/Wrappers/TableLayout";
import PaginatedTable from "../../../../components/Tables/PaginatedTable/Table";
import type { ITableColumn } from "../../../../utils/types/table.type";
import { openModal } from "../../../../signals/modal.signal";
import { useProductsQuery } from "../../../../queries/products.queries";
import type { ProductEnriched } from "../../../../schemas/market.schemas";
import type { Action } from "../../../../components/Tables/PaginatedTable/helpers";

export default function ProductsPage() {
  const { data, isLoading } = useProductsQuery();
  const rows: ProductEnriched[] = useMemo(() => data?.items ?? [], [data?.items]);

  const columns: ITableColumn<ProductEnriched>[] = useMemo(
    () =>
      [
        { id: "name", label: "Nombre" },
        { id: "price", label: "Precio" },
        { id: "stock", label: "Stock" },
        { id: "category", label: "Categoría" },
        { id: "updatedAt", label: "Actualizado" },
      ] as ITableColumn<ProductEnriched>[],
    []
  );

  const actions = (row: ProductEnriched): Action[] => [
    {
      id: "edit",
      name: "Editar",
      icon: <EditIcon fontSize="small" />,
      onClick: () => openModal("product", { id: row._id }),
      outsideMenu: true,
    },
    {
      id: "discounts",
      name: "Descuentos",
      icon: <LocalOfferIcon fontSize="small" />,
      onClick: () => openModal("productDiscounts", { productId: row._id, productName: row.name }),
      outsideMenu: true,
    },
    {
      id: "reviews",
      name: "Reseñas",
      icon: <ReviewsIcon fontSize="small" />,
      onClick: () => openModal("productReviews", { productId: row._id, productName: row.name }),
      outsideMenu: true,
    },
    {
      id: "delete",
      name: "Eliminar",
      icon: <DeleteIcon fontSize="small" />,
      onClick: () => openModal("deleteProduct", { id: row._id, name: row.name }),
      outsideMenu: true,
    },
  ];

  return (
    <PortalLayout>
      <TableLayout
        title="Productos"
        addButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => openModal("product", {})}
            sx={{ textTransform: "none" }}
          >
            Nuevo producto
          </Button>
        }
      >
        <PaginatedTable<ProductEnriched>
          data={rows}
          columns={columns}
          actions={(r) => actions(r)}
          isLoading={isLoading}
          tableName="portal-products"
          wrap
        />
      </TableLayout>
    </PortalLayout>
  );
}
