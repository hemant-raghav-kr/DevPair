import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          <Image
            src="/brand/devpair-icon.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 object-contain rounded-xs"
            priority
          />
          <span>DevPair Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Find the right teammates for your next project & hackathon
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Connect with college peers based on complementary skills, interests, and availability.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold text-sm shadow-sm transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold text-sm shadow-sm transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-5 py-2.5 font-semibold text-sm transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
