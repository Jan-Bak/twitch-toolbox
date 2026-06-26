import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TwitchIcon from '@/components/icons/twitch-icon';
import { loginWithTwitch } from '@/lib/twitchAuth';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import Auth from '../auth/auth';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleLogin = () => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await loginWithTwitch();
        setToken(token);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  };

  if (token) {
    return <Auth />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Hello</CardTitle>
        </CardHeader>
        <CardContent className="max-w-sm">
          <CardDescription>
            Login to app is provided by Twitch authentication, this app does not store any sensitive
            user data.
          </CardDescription>
          {error ? (
            <Alert variant="destructive" className="mt-3">
              {error}
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter>
          <CardAction className="w-full">
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              onClick={handleLogin}
              disabled={loading}
            >
              <TwitchIcon /> {loading ? 'Logging in...' : 'Login via Twitch'}
            </Button>
          </CardAction>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
