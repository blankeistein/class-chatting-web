import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Collapse,
  Drawer,
  IconButton,
  List,
  Menu,
  Navbar,
  Tooltip,
  Typography,
} from "@material-tailwind/react";
import { ArchiveIcon, BellIcon, BookIcon, ChevronDownIcon, GithubIcon, LayoutDashboardIcon, LogOutIcon, MailIcon, MapPinnedIcon, MenuIcon, MoonIcon, PiIcon, PinIcon, SunIcon, TicketIcon, Trash2Icon, UserCircle2Icon, VideoIcon, XIcon } from "lucide-react";
import { useTheme } from "../Contexts/ThemeContext";
import { Link, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { AuthProps } from "@/types/global";
import { NotificationMenu } from "../Components/NotificationMenu";

type ChildLinkType = {
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  title: string;
  routeName: string;
  badge?: number;
};

type LinkType = {
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  title: string;
  href?: string;
  routeName?: string;
  badge?: number;
  children?: ChildLinkType[];
};

const Links: LinkType[] = [
  {
    icon: LayoutDashboardIcon,
    title: "Dashboard",
    routeName: "admin.dashboard",
  },
  {
    icon: TicketIcon,
    title: "Kode Aktivasi",
    routeName: "admin.activation-code.index",
  },
  {
    icon: ArchiveIcon,
    title: "Konten",
    children: [
      {
        title: "Buku",
        icon: BookIcon,
        routeName: "admin.books.index",
      },
      {
        title: "Video",
        icon: VideoIcon,
        routeName: "admin.videos.index",
      },
    ],
  },
  {
    icon: MapPinnedIcon,
    title: "Daerah",
    routeName: "admin.regions.index",
  },
  
  {
    icon: UserCircle2Icon,
    title: "User",
    routeName: "admin.users.index",
  },
];

const NavList = ({ isCollapsed = false }: { isCollapsed?: boolean }) => {
  const { url } = usePage();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Links.reduce<Record<string, boolean>>((groups, link) => {
      if (link.children) {
        groups[link.title] = link.children.some(({ routeName }) => route().current(`${routeName}*`));
      }

      return groups;
    }, {}),
  );

  useEffect(() => {
    setOpenGroups((currentGroups) =>
      Links.reduce<Record<string, boolean>>((groups, link) => {
        if (link.children) {
          const hasActiveChild = link.children.some(({ routeName }) => route().current(`${routeName}*`));
          groups[link.title] = currentGroups[link.title] || hasActiveChild;
        }

        return groups;
      }, {}),
    );
  }, [url]);

  const toggleGroup = (title: string): void => {
    setOpenGroups((currentGroups) => ({
      ...currentGroups,
      [title]: !currentGroups[title],
    }));
  };

  return (
    <List>
      {Links.map(({ icon: Icon, title, href, routeName, badge, children }) => {
        const isSelected = routeName ? route().current(routeName + '*') : false;
        const hasChildren = Boolean(children?.length);
        const hasActiveChild = children?.some((child) => route().current(`${child.routeName}*`)) ?? false;
        const isGroupOpen = openGroups[title] ?? false;

        if (hasChildren && children) {
          if (isCollapsed) {
            return (
              <Menu key={title} placement="right-start">
                <Menu.Trigger as="div" className="aspect-square w-10 h-10">
                  <List.Item
                    selected={hasActiveChild}
                    className="aspect-square w-10 h-10 justify-center p-0 flex shrink-0"
                  >
                    <Icon className="h-[20px] w-[20px]" />
                  </List.Item>
                </Menu.Trigger>
                <Menu.Content className="z-20 min-w-52">
                  <Typography type="small" className="px-3 pt-1 pb-2 font-semibold text-surface-foreground/70">
                    {title}
                  </Typography>
                  {children.map((child) => {
                    const isChildSelected = route().current(`${child.routeName}*`);

                    return (
                      <Menu.Item
                        key={child.title}
                        as={Link}
                        href={route(child.routeName)}
                        className={isChildSelected ? "bg-primary/10 text-primary" : ""}
                      >
                        {child.title}
                      </Menu.Item>
                    );
                  })}
                </Menu.Content>
              </Menu>
            );
          }

          return (
            <div key={title}>
              <List.Item selected={hasActiveChild} onClick={() => toggleGroup(title)}>
                <List.ItemStart>
                  <Icon className="h-[18px] w-[18px]" />
                </List.ItemStart>
                {title}
                <List.ItemEnd>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                </List.ItemEnd>
              </List.Item>
              <Collapse open={isGroupOpen}>
                <div className="mt-1 flex flex-col gap-1 pl-3">
                  {children.map((child) => {
                    const isChildSelected = route().current(`${child.routeName}*`);

                    return (
                      <List.Item
                        key={child.title}
                        as={Link}
                        href={route(child.routeName)}
                        selected={isChildSelected}
                        className="pl-10"
                      >
                        <List.ItemStart>
                          {child.icon && <child.icon className="h-[18px] w-[18px]" />}
                        </List.ItemStart>
                        {child.title}
                        {child.badge && (
                          <List.ItemEnd>
                            <Chip size="sm" variant="ghost">
                              <Chip.Label>{child.badge}</Chip.Label>
                            </Chip>
                          </List.ItemEnd>
                        )}
                      </List.Item>
                    );
                  })}
                </div>
              </Collapse>
            </div>
          );
        }

        const listItem = (
          <List.Item
            key={title}
            as={Link}
            href={routeName ? route(routeName) : href || '#'}
            selected={isSelected}
            className={isCollapsed ? "aspect-square w-10 h-10 justify-center p-0 flex shrink-0" : ""}
          >
            {isCollapsed ? (
              <Icon className="h-[20px] w-[20px]" />
            ) : (
              <>
                <List.ItemStart>
                  <Icon className="h-[18px] w-[18px]" />
                </List.ItemStart>
                {title}
                {badge && (
                  <List.ItemEnd>
                    <Chip size="sm" variant="ghost">
                      <Chip.Label>{badge}</Chip.Label>
                    </Chip>
                  </List.ItemEnd>
                )}
              </>
            )}
          </List.Item>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={title} placement="right">
              <Tooltip.Trigger as="div" className="aspect-square w-10 h-10 ">
                {listItem}
              </Tooltip.Trigger>
              <Tooltip.Content>
                {title}
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip>
          );
        }

        return listItem;
      })}
    </List>
  )
}

function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {

  return (
    <div className={`p-2 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[280px]'} hidden lg:block overflow-hidden`}>
      <Card className="h-full max-h-screen">
        <Card.Header className={`flex items-center gap-4 mb-0 mt-3 h-max transition-all duration-300 ${isCollapsed ? 'mx-1 px-1 justify-center' : 'mx-4'}`}>
          <img src="/assets/images/icons/lestari-ilmu.webp" alt="logo" className="h-8 w-8 flex-shrink-0" />

          {!isCollapsed && (
            <Typography
              type="h1"
              className="block py-1 font-bold !text-lg text-surface-foreground whitespace-nowrap overflow-hidden"
            >
              Class Chatting Web
            </Typography>
          )}
        </Card.Header>
        <Card.Body className={`p-4 mt-2 ${isCollapsed ? 'px-2' : ''}`}>
          <NavList isCollapsed={isCollapsed} />
        </Card.Body>
      </Card>
    </div>
  );
}

function ProfileMenu() {
  const props = usePage<AuthProps>().props;

  return (
    <Menu placement="bottom-end">
      <Menu.Trigger
        as={Avatar}
        src={props.auth.user?.image}
        alt="profile-picture"
        size="sm"
        className="border border-primary p-0.5 cursor-pointer"
      />
      <Menu.Content className="z-20">
        <Menu.Item>
          <UserCircle2Icon className="mr-2 h-[18px] w-[18px]" /> My Profile
        </Menu.Item>
        <hr className="!my-1 -mx-1 border-surface" />
        <Menu.Item className="text-error hover:bg-error/10 hover:text-error focus:bg-error/10 focus:text-error" onClick={() => router.delete(route('logout'))}>
          <LogOutIcon className="mr-2 h-[18px] w-[18px]" />
          Logout
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [openNav, setOpenNav] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setOpenNav(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div className="p-2 mx-auto w-full sticky top-0 z-10">
        <Navbar className="bg-background/50 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <IconButton
              size="sm"
              variant="ghost"
              color="secondary"
              onClick={() => setOpenNav(!openNav)}
              className="grid lg:hidden"
            >
              {openNav ? (
                <XIcon className="h-4 w-4" />
              ) : (
                <MenuIcon className="h-4 w-4" />
              )}
            </IconButton>

            {/* Desktop Toggle Button */}
            <IconButton
              size="sm"
              variant="ghost"
              color="secondary"
              onClick={onToggleSidebar}
              className="hidden lg:grid"
            >
              <MenuIcon className="h-4 w-4" />
            </IconButton>

            <div className="flex gap-4 items-center ml-auto">
              <NotificationMenu />
              <IconButton variant="ghost" onClick={toggleTheme}>
                {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              </IconButton>
              <ProfileMenu />
            </div>
          </div>
        </Navbar>
      </div>
      <Drawer open={openNav} onOpenChange={() => setOpenNav(!openNav)}>
        <Drawer.Overlay>
          <Drawer.Panel placement="left">
            <div>
              <div className="flex items-center gap-4 mb-4 px-2">
                <img src="/assets/images/icons/lestari-ilmu.webp" alt="logo" className="h-8 w-8" />
                <Typography type="h1" className="font-bold text-lg text-surface-foreground">
                  Class Chatting Web
                </Typography>
              </div>
              <NavList />
            </div>
          </Drawer.Panel>
        </Drawer.Overlay>
      </Drawer>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const removeListener = router.on('navigate', () => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });
    return removeListener;
  }, []);

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} />
      <div ref={contentRef} className="flex-1 overflow-auto">
        <TopNavbar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
        {children}
        <footer className="p-2 flex items-center justify-between border-t border-surface mt-auto">
          <Typography className="text-sm text-surface-foreground/60">
            &copy; {new Date().getFullYear()} All rights reserved.
          </Typography>
          <IconButton
            variant="ghost"
            size="sm"
            as="a"
            href="https://github.com/blankeistein"
            target="_blank"
          >
            <GithubIcon className="h-4 w-4" />
          </IconButton>
        </footer>
      </div>
    </div>
  );
}

