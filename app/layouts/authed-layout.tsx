import { Outlet, Link, redirect, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { PlusIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavBreadcrumbs } from "~/components/nav-breadcrumbs";

export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);

  if (!userId) return redirect("/");
}

export default function Layout() {
  return (
    <SidebarProvider className="bg-[url(/background.png)] bg-cover bg-center bg-no-repeat">
      <AppSidebar className="bg-transparent backdrop-blur-lg" />
      <SidebarInset className="bg-background/60 backdrop-blur-lg">
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <NavBreadcrumbs />
          </div>
          <div className="px-4">
            <Button asChild variant="outline" size="icon">
              <Link to={{ pathname: "/runs/new" }}>
                <PlusIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
