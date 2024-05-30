import { Canvas } from "@/components/Canvas";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <Canvas />;
}
