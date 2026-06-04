import React, { useEffect, useMemo, useState } from "react";
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
import { ArchiveIcon, BellIcon, BookIcon, Building2Icon, ChevronDownIcon, GithubIcon, Grid3X3, Grip, LayoutDashboardIcon, LayoutGrid, LogOutIcon, MailIcon, MapPinnedIcon, MenuIcon, MoonIcon, PiIcon, PinIcon, ScrollTextIcon, Settings2Icon, SettingsIcon, SunIcon, TicketIcon, Trash2Icon, UserCircle2Icon, UserRoundCog, VideoIcon, XIcon } from "lucide-react";
import { useTheme } from "../Contexts/ThemeContext";
import { Link, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { AuthProps } from "@/types/global";
import { NotificationMenu } from "../Components/NotificationMenu";
import { getFirebaseAuth, signOutFirebase, syncFirebaseAuth } from "../lib/firebase";
import toast from "react-hot-toast";
import { User } from "firebase/auth";
import ErrorHandlerProvider from "@/Components/ErrorHandlerProvider";
import { NotificationError } from "@/utils";
import NavList, { LinkType } from "@/Components/Navigation/NavList";
import Sidebar from "@/Components/Navigation/Sidebar";
import MobileNavbar from "@/Components/Navigation/MobileNavbar";
import Footer from "./Footer";

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
    title: "Sekolah",
    icon: Building2Icon,
    routeName: "admin.schools.index",
  },
  {
    icon: MapPinnedIcon,
    title: "Daerah",
    children: [
      {
        title: "Provinsi",
        icon: MapPinnedIcon,
        routeName: "admin.regions.provinces.index",
      },
      {
        title: "Kota/Kabupaten",
        icon: MapPinnedIcon,
        routeName: "admin.regions.regencies.index",
      },
      {
        title: "Kecamatan",
        icon: MapPinnedIcon,
        routeName: "admin.regions.districts.index",
      },
      {
        title: "Desa/Kelurahan",
        icon: MapPinnedIcon,
        routeName: "admin.regions.villages.index",
      },
    ]
  },
  {
    icon: UserCircle2Icon,
    title: "Pengguna",
    routeName: "admin.users.index",
  },
  {
    icon: SettingsIcon,
    title: "Pengaturan",
    children: [
      {
        title: "Email",
        icon: MapPinnedIcon,
        routeName: "admin.email-config.index",
      },
    ],
  },

];

type AppLinkType = {
  icon: string;
  title: string;
  routeName: string;
};

export const AppsLinks: AppLinkType[] = [
  {
    icon: "/assets/images/icons/class-chatting.webp",
    title: "Class Chatting",
    routeName: "admin.apps.class-chatting.index",
  },
  {
    icon: "/assets/images/icons/class-chatting-ulangan-online.webp",
    title: "Ulangan Online",
    routeName: "admin.dashboard",
  },
  {
    icon: "/assets/images/icons/anak-indonesia-menghafal.webp",
    title: "Anak Indonesia Menghafal",
    routeName: "admin.apps.anak-indonesia-menghafal.index",
  },
  {
    icon: "/assets/images/icons/class-chatting-for-kids.webp",
    title: "For Kids",
    routeName: "admin.apps.class-chatting-for-kids.index",
  },
  {
    icon: "/assets/images/icons/class-chatting-layar-lebar.webp",
    title: "Layar Lebar",
    routeName: "admin.apps.class-chatting-layar-lebar.index",
  }
]

function ProfileMenu({ user }: { user: User | null }) {
  const [isReAuthenticating, setIsReAuthenticating] = useState(false);
  const props = usePage<AuthProps>().props;

  const handleLogout = async (): Promise<void> => {
    await signOutFirebase();

    router.delete(route('logout'));
  };

  const handleReAuthentication = async (): Promise<void> => {
    setIsReAuthenticating(true);
    router.get(route('admin.authenticate-firebase-user'), undefined, {
      onSuccess: async (page) => {
        const firebaseAuth = (page.props as {
          auth?: {
            firebase?: {
              uid: string;
              custom_token: string;
            } | null;
          };
        }).auth?.firebase ?? null;

        await syncFirebaseAuth(firebaseAuth);
        setIsReAuthenticating(false);
      },
      onError: (errors) => {
        setIsReAuthenticating(false);
        throw new NotificationError(errors);
      }
    })
  }

  useEffect(() => {
    if (!isReAuthenticating) return;

    let toasId = toast.loading("Sedang authentication akun firebase")

    return () => toast.dismiss(toasId);
  }, [isReAuthenticating])

  return (
    <Menu placement="bottom-end">
      <Menu.Trigger
        as={Avatar}
        src={props.auth.user?.image}
        alt="profile-picture"
        size="sm"
        className={`border ${user ? "border-success" : "border-error"} p-0.5 cursor-pointer`}
      />
      <Menu.Content className="z-20">
        <Menu.Item as={Link} href={route('admin.profile.edit')}>
          <UserCircle2Icon className="mr-2 h-[18px] w-[18px]" /> Profil
        </Menu.Item>
        <Menu.Item onClick={handleReAuthentication} disabled={user !== null}>
          <UserRoundCog className="h-4 w-4 mr-2" />
          Re Authentication
        </Menu.Item>
        <Menu.Item as="a" href="/docs/api" target="_blank" rel="noopener">
          <ScrollTextIcon className="mr-2 h-[18px] w-[18px]" /> Dokumentasi API
        </Menu.Item>
        <hr className="!my-1 -mx-1 border-surface" />
        <Menu.Item className="text-error hover:bg-error/10 hover:text-error focus:bg-error/10 focus:text-error" onClick={() => void handleLogout()}>
          <LogOutIcon className="mr-2 h-[18px] w-[18px]" />
          Logout
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [openNav, setOpenNav] = useState(false);
  const [user, setUser] = useState<User | null>(auth?.currentUser || null);

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

  useEffect(() => {
    auth?.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, [auth])

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

            <div className="flex gap-2 items-center ml-auto">
              <NotificationMenu />
              <IconButton variant="ghost" onClick={toggleTheme}>
                {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              </IconButton>
              <Menu placement="bottom-end">
                <Menu.Trigger as={IconButton} variant="ghost">
                  <Grip className="h-4 w-4" />
                </Menu.Trigger>
                <Menu.Content className="z-20 !p-3 min-w-[240px] max-w-[280px]">
                  <Typography as="p" type="small" className="px-2 pb-2 font-semibold text-surface-foreground/70 mb-1">
                    Daftar Aplikasi
                  </Typography>
                  <div className="grid grid-cols-2 gap-2">
                    {AppsLinks.map((item) => (
                      <Link
                        key={item.title}
                        href={route(item.routeName)}
                        className="group flex flex-col items-center gap-2 rounded-xl border border-surface/30 bg-surface/5 p-3 text-sm transition hover:border-primary hover:bg-primary/10"
                      >
                        <img src={item.icon} alt={`${item.title}-icon`} className="h-12 w-12 rounded-lg" />
                        <span className="text-xs">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </Menu.Content>
              </Menu>
              <ProfileMenu user={user} />
            </div>
          </div>
        </Navbar>
      </div>
      <MobileNavbar links={Links} open={openNav} onOpenChange={() => setOpenNav(!openNav)} />
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
    <ErrorHandlerProvider>
      <div className="h-screen bg-background flex overflow-hidden">
        <Sidebar links={Links} isCollapsed={isCollapsed} />
        <div ref={contentRef} className="flex-1 overflow-auto">
          <TopNavbar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
          {children}
          <Footer />
        </div>
      </div>
    </ErrorHandlerProvider>
  );
}
