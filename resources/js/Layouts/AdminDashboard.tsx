import React, { useEffect, useState } from "react";
import {
  Avatar,
  Card,
  Chip,
  Collapse,
  Drawer,
  IconButton,
  List,
  Menu,
  Navbar,
  Typography,
} from "@material-tailwind/react";
import { ArchiveIcon, BookIcon, LayoutDashboardIcon, LogOutIcon, MailIcon, MenuIcon, MoonIcon, PiIcon, PinIcon, SunIcon, TicketIcon, Trash2Icon, UserCircle2Icon, VideoIcon, XIcon } from "lucide-react";
import { useTheme } from "../Contexts/ThemeContext";
import { Link, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";

type LinkType = {
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  title: string;
  href: string;
  badge?: number;
}

const Links: LinkType[] = [
  {
    icon: LayoutDashboardIcon,
    title: "Dashboard",
    href: route('admin.dashboard'),
  },
  {
    icon: TicketIcon,
    title: "Kode Aktivasi",
    href: route('admin.activation-code'),
  },
  {
    icon: BookIcon,
    title: "Buku",
    href: route('admin.books'),
  },
  {
    icon: VideoIcon,
    title: "Video",
    href: "#",
  },
];

const NavList = () => {
  const page = usePage();

  return (
    <List>
      {Links.map(({ icon: Icon, title, href, badge }) => (
        <List.Item key={title} as={Link} href={href} selected={href.includes(page.url)}>
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
        </List.Item>
      ))}
    </List>
  )
}

function Sidebar() {

  return (
    <div className="p-2 max-w-[280px] hidden lg:block">
      <Card className="h-full max-h-screen">
        <Card.Header className="flex items-center gap-4 mx-4 mb-0 mt-3 h-max">
          <img src="/assets/images/icons/lestari-ilmu.webp" alt="logo" className="h-8 w-8" />

          <Typography
            type="h1"
            className="block py-1 font-bold !text-lg text-surface-foreground"
          >
            App Lestari Ilmu
          </Typography>
        </Card.Header>
        {/* <hr className="mt-4 border-surface" /> */}
        <Card.Body className="p-4 mt-2">
          <NavList />
        </Card.Body>
      </Card>
    </div>
  );
}

function ProfileMenu() {
  return (
    <Menu>
      <Menu.Trigger
        as={Avatar}
        src="https://raw.githubusercontent.com/creativetimofficial/public-assets/master/ct-assets/team-4.jpg"
        alt="profile-picture"
        size="sm"
        className="border border-primary p-0.5 cursor-pointer"
      />
      <Menu.Content>
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

function TopNavbar() {
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
      <div className="p-2 mx-auto w-full sticky top-0">
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

            <div className="flex gap-4 items-center ml-auto">
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
            <NavList />
          </Drawer.Panel>
        </Drawer.Overlay>
      </Drawer>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <TopNavbar />
        {children}
      </div>
    </div>
  );
}