import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewProjectContainer } from "@/features/projects";

export const metadata = {
  title: "Create Project | DevPair",
  description: "Create a new project or hackathon listing on DevPair.",
};

export default async function NewProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/projects/new");
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <NewProjectContainer userId={user.id} />
    </main>
  );
}
