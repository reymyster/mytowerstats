import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="bg-blue-200">
      <Outlet />
    </div>
  );
}
