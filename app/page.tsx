import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/server/security"

export default async function RootPage() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/landing")
  }

  redirect("/inicio")
}