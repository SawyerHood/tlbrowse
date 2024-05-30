import { Canvas } from "@/components/Canvas";
import { shouldUseAuth } from "@/lib/shouldUseAuth";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  if (shouldUseAuth) {
    const user = await currentUser();

    if (!user) {
      redirect("/sign-in");
    }
  }

  return <Canvas />;
}
