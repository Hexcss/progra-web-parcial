import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import GroupIcon from "@mui/icons-material/Group";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import type { DrawerSection } from "../types/route.type";

export function createDrawerSections(): DrawerSection[] {
  return [
    {
      title: "Inicio",
      showTitle: true,
      items: [
        {
          text: "Panel",
          icon: DashboardCustomizeIcon,
          path: "/portal",
          selectedPaths: ["/portal"],
        },
      ],
    },
    {
      title: "Catálogo",
      showTitle: true,
      items: [
        {
          text: "Productos",
          icon: Inventory2Icon,
          path: "/portal/products",
          selectedPaths: ["/portal/products"],
        },
        {
          text: "Categorías",
          icon: CategoryIcon,
          path: "/portal/categories",
          selectedPaths: ["/portal/categories"],
        },
      ],
    },
    {
      title: "Ventas",
      showTitle: true,
      items: [
        {
          text: "Pedidos",
          icon: ReceiptLongIcon,
          path: "/portal/orders",
          selectedPaths: ["/portal/orders"],
        },
      ],
    },
    {
      title: "Soporte",
      showTitle: true,
      items: [
        {
          text: "Soporte",
          icon: SupportAgentIcon,
          path: "/portal/support",
          selectedPaths: ["/portal/support"],
        },
      ],
    },
    {
      title: "Personas",
      showTitle: true,
      items: [
        {
          text: "Usuarios",
          icon: GroupIcon,
          path: "/portal/users",
          selectedPaths: ["/portal/users"],
        },
      ],
    },
  ];
}
