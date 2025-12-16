import { Head, usePage } from "@inertiajs/react";
import { FacebookIcon, GithubIcon, GlobeIcon, InstagramIcon, LinkedinIcon, TerminalIcon, YoutubeIcon } from "lucide-react";

type AuthProps = {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        } | null;
    }
}

export default function Index() {
    const props = usePage<AuthProps>().props;

    return (
        <>
            <Head>
                <meta name="description" content="Lestari Ilmu - Aplikasi untuk belajar Bahasa Indonesia" />
                <meta name="keywords" content="Lestari Ilmu, Aplikasi, Belajar Bahasa Indonesia" />
                <meta name="author" content="Lestari Ilmu" />
            </Head>
            <div className="bg-neo-pinkish text-neo-dark h-screen w-screen overflow-hidden flex flex-col font-neo selection:bg-neo-lime">
                <header className="flex-none p-4 md:p-6 flex justify-between items-center border-b-4 border-black bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neo-yellow border-2 border-black flex items-center justify-center shadow-neo-sm">
                            {/* <TerminalIcon className="w-6 h-6" /> */}
                            <img src="/favicon.ico" className="h-8 w-8" alt="icon" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Lestari <span className="text-neo-yellow bg-black px-2">Ilmu</span></h1>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden">
                            <img src="/assets/images/avatar-placeholder.webp" className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
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
                                    Class Chatting Ulangan Online
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
                                    Class Chatting For Kids
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
                                    Class Chatting Layar Lebar
                                </span>
                            </div>
                        </a>
                    </div>
                </main>
                <footer className="flex-none p-4 md:p-6 bg-white border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="font-mono font-bold text-sm md:text-base bg-black text-white px-2 py-1 rotate-1">
                        © {new Date().getFullYear()} Lestari Ilmu
                    </div>

                    <div className="flex gap-3 flex-wrap justify-center">
                        <a href="#" className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all" target="_blank" rel="noreferrer" aria-label="GitHub profile">
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
