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
import {
  BookIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  Grip,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  ScrollText,
  SunIcon,
  UserCircle2Icon,
  UserRoundCog,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { useTheme } from "../Contexts/ThemeContext";
import { Link, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { AuthProps } from "@/types/global";
import { NotificationMenu } from "../Components/NotificationMenu";
import { getFirebaseAuth, signOutFirebase, syncFirebaseAuth } from "../lib/firebase";
import ErrorHandlerProvider from "@/Components/ErrorHandlerProvider";
import { User } from "firebase/auth";
import { NotificationError } from "@/utils";
import toast from "react-hot-toast";
import Footer from "./Footer";
import MobileNavbar from "@/Components/Navigation/MobileNavbar";
import Sidebar from "@/Components/Navigation/Sidebar";
import { LinkType } from "@/Components/Navigation/NavList";

const Links: LinkType[] = [
  {
    icon: HomeIcon,
    title: "Dashboard",
    routeName: "user.dashboard",
  },
  {
    icon: BookIcon,
    title: "Buku Saya",
    routeName: "user.book",
  },
];

function ProfileMenu({ user }: { user: User | null }) {
  const [isReAuthenticating, setIsReAuthenticating] = useState(false);
  const props = usePage<AuthProps>().props;

  const handleLogout = async (): Promise<void> => {
    await signOutFirebase();

    router.delete(route('logout'));
  };

  const handleReAuthentication = async (): Promise<void> => {
    setIsReAuthenticating(true);
    router.get(route('user.authenticate-firebase-user'), undefined, {
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
        <Menu.Item as={Link} href="#">
          <UserCircle2Icon className="mr-2 h-[18px] w-[18px]" /> Profil
        </Menu.Item>
        <Menu.Item onClick={handleReAuthentication} disabled={user !== null}>
          <UserRoundCog className="h-4 w-4 mr-2" />
          Re Authentication
        </Menu.Item>
        <Menu.Item as="a" href="/docs/api" target="_blank" rel="noopener">
          <ScrollText className="mr-2 h-[18px] w-[18px]" /> Dokumentasi API
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
              <ProfileMenu user={user} />
            </div>
          </div>
        </Navbar>
      </div>
      <MobileNavbar links={Links} open={openNav} onOpenChange={() => setOpenNav(!openNav)} />
    </>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
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
