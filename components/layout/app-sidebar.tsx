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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import useUser from '@/stores/user';
import { Separator } from '../ui/separator';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import sidebarData from './sidebar-data';
import type { SidebarItemData } from './sidebar-data';

type SidebarItemRendererProps = {
  item: SidebarItemData;
  isExpanded: boolean;
  onToggle: (title: string) => void;
};

const SidebarItemRenderer = ({ item, isExpanded, onToggle }: SidebarItemRendererProps) => {
  const hasSubItems = Boolean(item.subItems?.length);

  const handleToggle = (event: React.MouseEvent) => {
    if (!hasSubItems) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onToggle(item.title);
  };

  return (
    <SidebarMenuItem key={item.title}>
      <div className="flex items-center">
        <SidebarMenuButton asChild className="flex-1">
          {item.to ? (
            <Link to={item.to} className="flex items-center gap-2" onClick={handleToggle}>
              {item?.icon}
              <span>{item.title}</span>
            </Link>
          ) : (
            <button type="button" className="flex w-full items-center gap-2" onClick={handleToggle}>
              {item?.icon}
              <span>{item.title}</span>
            </button>
          )}
        </SidebarMenuButton>
        {hasSubItems ? (
          <button
            type="button"
            onClick={handleToggle}
            className="mr-1 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={isExpanded ? `Hide ${item.title} submenu` : `Show ${item.title} submenu`}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : null}
      </div>
      {hasSubItems && isExpanded ? (
        <SidebarMenuSub>
          {item.subItems?.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton asChild>
                {subItem.to ? (
                  <Link to={subItem.to} className="flex items-center gap-2">
                    {subItem?.icon}
                    <span>{subItem.title}</span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-2">
                    {subItem?.icon}
                    <span>{subItem.title}</span>
                  </span>
                )}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
};

const AppSidebar = () => {
  const user = useUser((state) => state.user);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    return Object.fromEntries(
      sidebarData.groups.flatMap((group) =>
        group.items.map((item) => [item.title, item.defaultExpanded ?? false])
      )
    );
  });

  const toggleItem = (title: string) => {
    setExpandedItems((current) => ({ ...current, [title]: !current[title] }));
  };

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
        {sidebarData.groups.map((group) => (
          <SidebarGroup key={group.label} className="overflow-hidden whitespace-nowrap">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarItemRenderer
                  key={item.title}
                  item={item}
                  isExpanded={Boolean(expandedItems[item.title])}
                  onToggle={toggleItem}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
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
