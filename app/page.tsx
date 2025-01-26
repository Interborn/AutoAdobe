"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Wand2Icon, FileTextIcon, ImagePlusIcon } from 'lucide-react';

export default function Home() {
  const { status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">AI-Powered Stock Photo Platform</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Transform your creative workflow with AI-powered tools for stock photography
          </p>
          <div className="flex justify-center gap-4">
            {status === "unauthenticated" && (
              <>
                <Button size="lg" asChild>
                  <Link href="/dashboard">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
              </>
            )}
            {status === "authenticated" && (
              <Button size="lg" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <FeatureCard
            icon={<ImageIcon className="w-10 h-10" />}
            title="Prompt from Images"
            description="Generate accurate prompts from your photos for AI image generation"
          />
          <FeatureCard
            icon={<Wand2Icon className="w-10 h-10" />}
            title="AI Image Generation"
            description="Create stunning images from text prompts using advanced AI"
          />
          <FeatureCard
            icon={<ImagePlusIcon className="w-10 h-10" />}
            title="Image Enhancement"
            description="Enhance, remove backgrounds, and optimize your photos"
          />
          <FeatureCard
            icon={<FileTextIcon className="w-10 h-10" />}
            title="Metadata Management"
            description="Generate and manage metadata for stock photo platforms"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}