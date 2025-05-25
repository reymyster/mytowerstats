import { SignIn } from "@clerk/react-router";

export default function SignInPage() {
  return (
    <div className="flex flex-grow flex-col items-center justify-center">
      <SignIn />
    </div>
  );
}
