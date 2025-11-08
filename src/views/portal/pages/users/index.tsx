// src/views/portal/pages/users/index.tsx
import { useMemo } from "react";
import { Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PortalLayout from "../../../../layouts/Wrappers/PortalLayout";
import { TableLayout } from "../../../../layouts/Wrappers/TableLayout";
import PaginatedTable from "../../../../components/Tables/PaginatedTable/Table";
import type { ITableColumn } from "../../../../utils/types/table.type";
import { openModal } from "../../../../signals/modal.signal";
import { useUsersQuery } from "../../../../queries/users.queries";
import type { User } from "../../../../schemas/auth.schemas";
import type { Action } from "../../../../components/Tables/PaginatedTable/helpers";

export default function UsersPage() {
  const { data, isLoading } = useUsersQuery();
  const rows: User[] = useMemo(() => data?.items ?? [], [data?.items]);

  const columns: ITableColumn<User>[] = useMemo(
    () =>
      [
        { id: "email", label: "Correo" },
        { id: "displayName", label: "Nombre" },
        { id: "role", label: "Rol" },
        { id: "createdAt", label: "Creado" },
        { id: "updatedAt", label: "Actualizado" },
      ] as ITableColumn<User>[],
    []
  );

  const actions = (row: User): Action[] => [
    {
      id: "edit",
      name: "Editar",
      icon: <EditIcon fontSize="small" />,
      onClick: () => openModal("user", { id: row._id }),
      outsideMenu: true,
    },
    {
      id: "delete",
      name: "Eliminar",
      icon: <DeleteIcon fontSize="small" />,
      onClick: () => openModal("deleteUser", { id: row._id, email: row.email, displayName: row.displayName }),
      outsideMenu: true,
    },
  ];

  return (
    <PortalLayout>
      <TableLayout
        title="Usuarios"
        addButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => openModal("user", {})}
            sx={{ textTransform: "none" }}
          >
            Nuevo usuario
          </Button>
        }
      >
        <PaginatedTable<User>
          data={rows}
          columns={columns}
          actions={(r) => actions(r)}
          isLoading={isLoading}
          tableName="portal-users"
          wrap
        />
      </TableLayout>
    </PortalLayout>
  );
}
