import {
  ChevronRightIcon,
  PlusIcon,
  ListIcon,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavRuns() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Runs</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to={{ pathname: "/runs" }}>
              <ListIcon />
              <span>List</span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuButton asChild>
            <Link to={{ pathname: "/runs/new" }}>
              <PlusIcon />
              <span>New</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
