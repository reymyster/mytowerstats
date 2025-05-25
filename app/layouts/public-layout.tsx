import { Outlet } from "react-router";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/react-router";

export default function Layout() {
  return (
    <div className="h-svh max-h-screen bg-red-200">
      <header className="h-16 border-b border-amber-600 flex items-center justify-end px-4">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
