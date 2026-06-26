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

const Login = () => {
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
        </CardContent>
        <CardFooter>
          <CardAction className="w-full">
            <Button variant="outline" className="w-full cursor-pointer">
              <TwitchIcon /> Login via Twitch
            </Button>
          </CardAction>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
