import LoopIcon from '../icons/loop-icon';

export type SidebarItemData = {
  title: string;
  to?: string;
  icon?: React.ReactNode;
  subItems?: SidebarItemData[];
  defaultExpanded?: boolean;
};

export type SidebarGroupData = {
  label: string;
  items: SidebarItemData[];
};

export type SidebarData = {
  groups: SidebarGroupData[];
};

const data: SidebarData = {
  groups: [
    {
      label: 'Tools',
      items: [
        {
          title: 'Loop writer',
          icon: <LoopIcon />,
          defaultExpanded: false,
          subItems: [
            {
              title: 'Create',
              to: '/loop-writer/create',
            },
            {
              title: 'Saved',
              to: '/loop-writer/saved',
            },
          ],
        },
      ],
    },
  ],
};

export default data;
