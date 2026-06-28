import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import useUser from '@/stores/user';
import { Separator } from '../ui/separator';
import LoopIcon from '../icons/loop-icon';

const AppSidebar = () => {
  const user = useUser((state) => state.user);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-1 overflow-hidden whitespace-nowrap">
          <img src="/tf.png" alt="Twitch Toolbox Logo" className="w-6" />
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-xs">Toolbox</h1>
            <h3 className="text-xs text-muted-foreground">A collection of tools for trolling.</h3>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="bg-purple-900 cursor-pointer">
                <SidebarTrigger />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="overflow-hidden whitespace-nowrap">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Tools
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <LoopIcon /> Loop writer
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <div
          className="py-2 px-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer rounded-md
        group-data-[collapsible=icon]:px-0 overflow-hidden whitespace-nowrap
        "
        >
          <div className="flex items-center gap-2">
            <Avatar className="group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:mx-auto">
              <AvatarImage src={user?.profile_image_url} />
              <AvatarFallback>{user?.display_name?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium">{user?.display_name ?? 'User'}</p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
