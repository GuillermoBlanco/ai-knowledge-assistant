"use client";

import Link from "next/link";
import { Protect, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function Home() {

  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          <h1 className="text-4xl font-bold text-center">AI Document Assistant</h1>

          <p className="text-xl text-center text-gray-600 dark:text-gray-300">
            Upload your documents and get AI-powered analysis, summaries, and answers to your questions.
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
            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
            <Link
              href="/post"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Post creation
            </Link>
          </Protect>
        </div>
      </main>
    </div>
  );
}
