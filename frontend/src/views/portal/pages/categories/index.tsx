// src/views/portal/pages/categories/index.tsx
import { useMemo } from "react";
import { Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PortalLayout from "../../../../layouts/Wrappers/PortalLayout";
import { TableLayout } from "../../../../layouts/Wrappers/TableLayout";
import PaginatedTable from "../../../../components/Tables/PaginatedTable/Table";
import type { ITableColumn } from "../../../../utils/types/table.type";
import { openModal } from "../../../../signals/modal.signal";
import { useCategoriesQuery } from "../../../../queries/categories.queries";
import type { CategoryEnriched } from "../../../../schemas/market.schemas";
import type { Action } from "../../../../components/Tables/PaginatedTable/helpers";

export default function CategoriesPage() {
  const { data = [], isLoading } = useCategoriesQuery();
  const rows: CategoryEnriched[] = useMemo(() => data ?? [], [data]);

  const columns: ITableColumn<CategoryEnriched>[] = useMemo(
    () =>
      [
        { id: "name", label: "Nombre" },
        { id: "icon", label: "Icono" },
        { id: "productCount", label: "Productos" },
        { id: "updatedAt", label: "Actualizado" },
      ] as ITableColumn<CategoryEnriched>[],
    []
  );

  const actions = (row: CategoryEnriched): Action[] => [
    {
      id: "edit",
      name: "Editar",
      icon: <EditIcon fontSize="small" />,
      onClick: () => openModal("category", { id: row._id }),
      outsideMenu: true,
    },
    {
      id: "delete",
      name: "Eliminar",
      icon: <DeleteIcon fontSize="small" />,
      onClick: () => openModal("deleteCategory", { id: row._id, name: row.name }),
      outsideMenu: true,
    },
  ];

  return (
    <PortalLayout>
      <TableLayout
        title="Categorías"
        addButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => openModal("category", {})}
            sx={{ textTransform: "none" }}
          >
            Nueva categoría
          </Button>
        }
      >
        <PaginatedTable<CategoryEnriched>
          data={rows}
          columns={columns}
          actions={(r) => actions(r)}
          isLoading={isLoading}
          tableName="portal-categories"
          wrap
        />
      </TableLayout>
    </PortalLayout>
  );
}
