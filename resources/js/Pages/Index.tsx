import { AuthProps } from "@/types/global";
import { Head, Link, usePage } from "@inertiajs/react";
import { FacebookIcon, GithubIcon, GlobeIcon, InstagramIcon, LayoutDashboard, LinkedinIcon, LogOutIcon, TerminalIcon, YoutubeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Index() {
  const { auth } = usePage<AuthProps>().props;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="description" content="Class Chatting Web - Aplikasi untuk belajar Bahasa Indonesia" />
        <meta name="keywords" content="Class Chatting Web, Aplikasi, Belajar Bahasa Indonesia" />
        <meta name="author" content="Class Chatting Web" />
      </Head>
      <div className="bg-neo-pinkish text-neo-dark h-screen w-screen overflow-hidden flex flex-col font-neo selection:bg-neo-lime">
        <header className="flex-none p-4 md:p-6 flex justify-between items-center border-b-4 border-black bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neo-yellow border-2 border-black flex items-center justify-center shadow-neo-sm">
              {/* <TerminalIcon className="w-6 h-6" /> */}
              <img src="/icon.png" className="h-8 w-8" alt="icon" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Class Chatting Web</h1>
          </div>
          <div className="flex gap-4 items-center">
            {
              auth.user && (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                    className="w-8 h-8 md:w-10 md:h-10 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Open profile menu"
                  >
                    <img src={auth.user?.image} className="w-6 h-6 md:w-8 md:h-8" alt="User avatar" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-12 md:top-14 z-20 w-40 border-4 border-black bg-white shadow-neo p-1">
                      <Link
                        href={route('admin.dashboard')}
                        as="button"
                        className="w-full flex items-center gap-2 font-mono text-sm font-bold border-2 border-transparent hover:border-black px-3 py-2 text-left"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dahsboard
                      </Link>
                      <Link
                        href={route('logout')}
                        method="delete"
                        as="button"
                        className="w-full flex items-center gap-2 font-mono text-sm font-bold text-red-600 hover:bg-red-100 border-2 border-transparent hover:border-black px-3 py-2 text-left"
                      >
                        <LogOutIcon className="w-4 h-4" />
                        Logout
                      </Link>
                    </div>
                  )}
                </div>
              )
            }
            <div className="hidden md:block font-mono text-xs font-bold bg-neo-yellow border-2 border-black px-2 py-1 shadow-neo-sm">
              STATUS: ONLINE
            </div>
          </div>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center p-4 w-full max-w-5xl mx-auto relative" >

          <div className="absolute top-10 left-10 w-16 h-16 bg-purple-400 rounded-full border-4 border-black -z-10 opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-blue-400 rotate-12 border-4 border-black -z-10 opacity-50"></div>

          <h2 className="text-xl md:text-2xl text-left w-full font-neo">Aplikasi Android</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full h-full md:h-auto content-center overflow-y-auto no-scrollbar p-2">
            <a href="//play.google.com/store/apps/details?id=mgt.li.classchatting" className="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
              <div className="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
              <div className="absolute inset-0 bg-white border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px] group-active:bg-gray-100">
                <div className="bg-blue-200 rounded-lg border-2 border-black overflow-hidden">
                  <img src="/assets/images/icons/class-chatting.webp" className="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting icon" />
                </div>
                <span className="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                  Class Chatting - Tanpa Kuota
                </span>
              </div>
            </a>

            <a href="//play.google.com/store/apps/details?id=mgt.li.classchattingexam" className="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
              <div className="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
              <div className="absolute inset-0 bg-neo-yellow border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]">
                <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                  <img src="/assets/images/icons/class-chatting-ulangan-online.webp" className="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting Ulangan Online icon" />
                </div>
                <span className="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                  Ulangan Online
                </span>
              </div>
            </a>

            <a href="//play.google.com/store/apps/details?id=mgt.li.classchattingmembaca" className="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer" >
              <div className="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
              <div className="absolute inset-0 bg-white border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]">
                <div className="bg-green-300 rounded-lg border-2 border-black overflow-hidden">
                  <img src="/assets/images/icons/anak-indonesia-menghafal.webp" className="w-10 h-10 md:w-16 md:h-16" alt="Anak Indonesia Menghafal icon" />
                </div>
                <span className="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                  Anak Indonesia Menghafal
                </span>
              </div>
            </a>

            <a href="//play.google.com/store/apps/details?id=mgt.li.classchattingforkids" className="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
              <div className="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
              <div className="absolute inset-0 bg-purple-300 border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]">
                <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                  <img src="/assets/images/icons/class-chatting-for-kids.webp" className="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting For Kids icon" />
                </div>
                <span className="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                  For Kids
                </span>
              </div>
            </a>

            <a href="//play.google.com/store/apps/details?id=com.lestariilmu.classchattingtv" className="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
              <div className="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
              <div className="absolute inset-0 bg-white border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px] group-active:bg-gray-100">
                <div className="bg-blue-200 rounded-lg border-2 border-black overflow-hidden">
                  <img src="/assets/images/icons/class-chatting-layar-lebar.webp" className="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting Layar Lebar icon" />
                </div>
                <span className="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                  Layar Lebar
                </span>
              </div>
            </a>
          </div>
        </main>
        <footer className="flex-none p-4 md:p-6 bg-white border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-mono font-bold text-sm md:text-base bg-black text-white px-2 py-1 rotate-1">
            &copy; {new Date().getFullYear()} Class Chatting Web
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <a href="//github.com/lestariilmu" className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all" target="_blank" rel="noreferrer" aria-label="GitHub profile">
              <GithubIcon className="text-white w-5 h-5 md:w-6 md:h-6" />
            </a>
            <a href="//www.instagram.com/lestariilmu5/" className="w-10 h-10 md:w-12 md:h-12 bg-pink-500 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all" target="_blank" rel="noreferrer" aria-label="Instagram profile">
              <InstagramIcon className="text-white w-5 h-5 md:w-6 md:h-6" />
            </a>
            <a href="//www.youtube.com/@lestariilmu" className="w-10 h-10 md:w-12 md:h-12 bg-red-600 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all" target="_blank" rel="noreferrer" aria-label="YouTube channel">
              <YoutubeIcon className="text-white w-5 h-5 md:w-6 md:h-6" />
            </a>
            <a href="//www.facebook.com/cvlestariilmu" className="w-10 h-10 md:w-12 md:h-12 bg-blue-800 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all" target="_blank" rel="noreferrer" aria-label="Facebook page">
              <FacebookIcon className="text-white w-5 h-5 md:w-6 md:h-6" />
            </a>
            <a href="//lestariilmu.id/" className="w-10 h-10 md:w-12 md:h-12 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all" target="_blank" rel="noreferrer" aria-label="Official website">
              <GlobeIcon className="text-black w-5 h-5 md:w-6 md:h-6" />
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
