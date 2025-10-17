"use client";

import Link from "next/link";
import { Protect, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function Home() {

  const { isSignedIn } = useUser();

  return (
    <div className="h-full flex flex-col">

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          <h1 className="text-4xl font-bold text-center">AI Knowledge Assistant</h1>

          <p className="text-xl text-center text-gray-600 dark:text-gray-300">
            Unlock insights from your documents with AI—analyze, summarize, ask questions, and instantly create posts to share.
          </p>

          {!isSignedIn && (
            <div className="flex justify-center gap-4">
              <SignUpButton mode="modal">
                <Button >Sign Up</Button>
              </SignUpButton>

              <SignInButton mode="modal">
                <Button variant="outline">Sign In</Button>
              </SignInButton>
            </div>
          )}

          <Protect>
            <div className="flex justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/post"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Post creation
              </Link>
            </div>
          </Protect>
        </div>
      </main>
    </div>
  );
}
