'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<{
    credentials: boolean;
    google: boolean;
  }>({
    credentials: false,
    google: false,
  });

  // Check for error parameter in URL
  const error = searchParams?.get('error');
  if (error) {
    const errorMessage = error === 'OAuthAccountNotLinked'
      ? 'Email already exists with different provider'
      : error === 'OAuthSignin'
        ? 'Error signing in with Google'
        : 'An error occurred during registration';

    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, credentials: true }));

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      toast({
        title: 'Success',
        description: 'Account created successfully',
      });

      // Sign in the user after successful registration
      const signInResult = await signIn('credentials', {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error('Failed to sign in after registration');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(prev => ({ ...prev, credentials: false }));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(prev => ({ ...prev, google: true }));
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
        variant: 'destructive',
      });
      setIsLoading(prev => ({ ...prev, google: false }));
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              type="text"
              autoCapitalize="none"
              autoComplete="name"
              autoCorrect="off"
              disabled={isLoading.credentials}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading.credentials}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              placeholder="Create a password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading.credentials}
              required
            />
          </div>
        </div>
        <Button disabled={isLoading.credentials}>
          {isLoading.credentials && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Account
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        disabled={isLoading.google}
        onClick={handleGoogleSignIn}
        className="bg-white hover:bg-gray-50 text-black"
      >
        {isLoading.google ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
    </div>
  );
} 