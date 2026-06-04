<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Class Chatting Web - Aplikasi Belajar Bahasa Indonesia</title>
    <meta name="description"
        content="Class Chatting Web - Aplikasi untuk belajar Bahasa Indonesia. Download aplikasi Android gratis untuk belajar membaca, menghafal, dan ulangan online.">
    <meta name="keywords"
        content="Class Chatting Web, Aplikasi, Belajar Bahasa Indonesia, Anak Indonesia Menghafal, Ulangan Online, Belajar Membaca">
    <meta name="author" content="Class Chatting Web">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:title" content="Class Chatting Web - Aplikasi Belajar Bahasa Indonesia">
    <meta property="og:description"
        content="Download aplikasi Android gratis untuk belajar membaca, menghafal, dan ulangan online.">
    <meta property="og:image" content="{{ asset('icon.png') }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url('/') }}">
    <meta property="twitter:title" content="Class Chatting Web - Aplikasi Belajar Bahasa Indonesia">
    <meta property="twitter:description"
        content="Download aplikasi Android gratis untuk belajar membaca, menghafal, dan ulangan online.">
    <meta property="twitter:image" content="{{ asset('icon.png') }}">

    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">

    @vite(['resources/css/app.css'])

    <style>
        .shadow-neo {
            box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
        }

        .shadow-neo-sm {
            box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
        }

        .shadow-neo-hover {
            box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
        }

        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</head>

<body
    class="bg-neo-pinkish text-neo-dark min-h-screen w-full overflow-x-hidden flex flex-col font-neo selection:bg-neo-lime">
    <header class="flex-none p-4 md:p-6 flex justify-between items-center border-b-4 border-black bg-white">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-neo-yellow border-2 border-black flex items-center justify-center shadow-neo-sm">
                <img src="{{ asset('icon.png') }}" class="h-8 w-8" alt="Class Chatting Web icon">
            </div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tighter uppercase">Class Chatting Web</h1>
        </div>
        <div class="flex gap-4 items-center">
            @auth
                <div class="relative" id="profileMenu">
                    <button type="button" onclick="toggleProfileMenu()"
                        class="w-8 h-8 md:w-10 md:h-10 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden"
                        aria-expanded="false" aria-haspopup="menu" aria-label="Open profile menu">
                        <img src="{{ auth()->user()->image }}" class="w-6 h-6 md:w-8 md:h-8" alt="User avatar">
                    </button>

                    <div id="profileMenuDropdown"
                        class="hidden absolute right-0 top-12 md:top-14 z-20 w-40 border-4 border-black bg-white shadow-neo p-1">

                        <a href="{{ $dashboard_link }}"
                            class="w-full flex items-center gap-2 font-mono text-sm font-bold border-2 border-transparent hover:border-black px-3 py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <rect width="7" height="9" x="3" y="3" rx="1" />
                                <rect width="7" height="5" x="14" y="3" rx="1" />
                                <rect width="7" height="9" x="14" y="12" rx="1" />
                                <rect width="7" height="5" x="3" y="16" rx="1" />
                            </svg>
                            Dashboard
                        </a>
                        <form action="{{ route('logout') }}" method="POST" class="w-full">
                            @csrf
                            @method('DELETE')
                            <button type="submit"
                                class="w-full flex items-center gap-2 font-mono text-sm font-bold text-red-600 hover:bg-red-100 border-2 border-transparent hover:border-black px-3 py-2 text-left">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" x2="9" y1="12" y2="12" />
                                </svg>
                                Logout
                            </button>
                        </form>
                    </div>
                </div>
            @endauth
            <div
                class="hidden md:block font-mono text-xs font-bold bg-neo-yellow border-2 border-black px-2 py-1 shadow-neo-sm">
                STATUS: ONLINE
            </div>
        </div>
    </header>

    <main
        class="flex-grow flex flex-col items-center justify-center p-4 w-full max-w-5xl mx-auto relative overflow-hidden">
        <div
            class="absolute top-10 left-10 w-16 h-16 bg-purple-400 rounded-full border-4 border-black -z-10 opacity-50 hidden md:block">
        </div>
        <div
            class="absolute bottom-10 right-10 w-20 h-20 bg-blue-400 rotate-12 border-4 border-black -z-10 opacity-50 hidden md:block">
        </div>

        <h2 class="text-xl md:text-2xl text-left w-full font-neo font-bold mb-4">Aplikasi Android</h2>
        <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full h-full md:h-auto content-center overflow-y-auto no-scrollbar p-2">
            <a href="https://play.google.com/store/apps/details?id=mgt.li.classchatting"
                class="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
                <div class="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
                <div
                    class="absolute inset-0 bg-white border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px] group-active:bg-gray-100">
                    <div class="bg-blue-200 rounded-lg border-2 border-black overflow-hidden">
                        <img src="{{ asset('assets/images/icons/class-chatting.webp') }}"
                            class="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting icon" loading="lazy">
                    </div>
                    <span class="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                        Class Chatting - Tanpa Kuota
                    </span>
                </div>
            </a>

            <a href="https://play.google.com/store/apps/details?id=mgt.li.classchattingexam"
                class="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
                <div class="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
                <div
                    class="absolute inset-0 bg-neo-yellow border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]">
                    <div class="bg-white rounded-lg border-2 border-black overflow-hidden">
                        <img src="{{ asset('assets/images/icons/class-chatting-ulangan-online.webp') }}"
                            class="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting Ulangan Online icon"
                            loading="lazy">
                    </div>
                    <span class="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                        Ulangan Online
                    </span>
                </div>
            </a>

            <a href="https://play.google.com/store/apps/details?id=mgt.li.classchattingmembaca"
                class="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
                <div class="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
                <div
                    class="absolute inset-0 bg-white border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]">
                    <div class="bg-green-300 rounded-lg border-2 border-black overflow-hidden">
                        <img src="{{ asset('assets/images/icons/anak-indonesia-menghafal.webp') }}"
                            class="w-10 h-10 md:w-16 md:h-16" alt="Anak Indonesia Menghafal icon" loading="lazy">
                    </div>
                    <span class="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                        Anak Indonesia Menghafal
                    </span>
                </div>
            </a>

            <a href="https://play.google.com/store/apps/details?id=mgt.li.classchattingforkids"
                class="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
                <div class="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
                <div
                    class="absolute inset-0 bg-purple-300 border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]">
                    <div class="bg-white rounded-lg border-2 border-black overflow-hidden">
                        <img src="{{ asset('assets/images/icons/class-chatting-for-kids.webp') }}"
                            class="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting For Kids icon" loading="lazy">
                    </div>
                    <span class="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                        For Kids
                    </span>
                </div>
            </a>

            <a href="https://play.google.com/store/apps/details?id=com.lestariilmu.classchattingtv"
                class="group relative block h-32 md:h-40 w-full" target="_blank" rel="noopener noreferrer">
                <div class="absolute inset-0 bg-black translate-x-[6px] translate-y-[6px] rounded-xl"></div>
                <div
                    class="absolute inset-0 bg-white border-4 border-black rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-transform transform group-hover:translate-x-[6px] group-hover:translate-y-[6px] group-active:bg-gray-100">
                    <div class="bg-blue-200 rounded-lg border-2 border-black overflow-hidden">
                        <img src="{{ asset('assets/images/icons/class-chatting-layar-lebar.webp') }}"
                            class="w-10 h-10 md:w-16 md:h-16" alt="Class Chatting Layar Lebar icon" loading="lazy">
                    </div>
                    <span class="font-bold font-mono text-sm md:text-base truncate w-full text-center">
                        Layar Lebar
                    </span>
                </div>
            </a>
        </div>
    </main>

    <footer
        class="flex-none p-4 md:p-6 bg-white border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="font-mono font-bold text-sm md:text-base bg-black text-white px-2 py-1 rotate-1">
            &copy; {{ date('Y') }} Class Chatting Web
        </div>

        <div class="flex gap-3 flex-wrap justify-center">
            <a href="https://github.com/lestariilmu"
                class="w-10 h-10 md:w-12 md:h-12 bg-gray-800 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                target="_blank" rel="noreferrer" aria-label="GitHub profile">
                <svg xmlns="http://www.w3.org/2000/svg" class="text-white w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24"
                    fill="currentColor">
                    <path
                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
            </a>
            <a href="https://www.instagram.com/lestariilmu5/"
                class="w-10 h-10 md:w-12 md:h-12 bg-pink-500 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                target="_blank" rel="noreferrer" aria-label="Instagram profile">
                <svg xmlns="http://www.w3.org/2000/svg" class="text-white w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
            </a>
            <a href="https://www.youtube.com/@lestariilmu"
                class="w-10 h-10 md:w-12 md:h-12 bg-red-600 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                target="_blank" rel="noreferrer" aria-label="YouTube channel">
                <svg xmlns="http://www.w3.org/2000/svg" class="text-white w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path
                        d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                    <path d="m10 15 5-3-5-3z" />
                </svg>
            </a>
            <a href="https://www.facebook.com/cvlestariilmu"
                class="w-10 h-10 md:w-12 md:h-12 bg-blue-800 border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                target="_blank" rel="noreferrer" aria-label="Facebook page">
                <svg xmlns="http://www.w3.org/2000/svg" class="text-white w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
            </a>
            <a href="https://lestariilmu.id/"
                class="w-10 h-10 md:w-12 md:h-12 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-neo hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                target="_blank" rel="noreferrer" aria-label="Official website">
                <svg xmlns="http://www.w3.org/2000/svg" class="text-black w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                </svg>
            </a>
        </div>
    </footer>

    <script>
        function toggleProfileMenu() {
            const dropdown = document.getElementById('profileMenuDropdown');
            const button = document.querySelector('[aria-expanded]');
            const isOpen = dropdown.classList.contains('hidden');

            if (isOpen) {
                dropdown.classList.remove('hidden');
                button.setAttribute('aria-expanded', 'true');
            } else {
                dropdown.classList.add('hidden');
                button.setAttribute('aria-expanded', 'false');
            }
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const profileMenu = document.getElementById('profileMenu');
            const dropdown = document.getElementById('profileMenuDropdown');

            if (profileMenu && !profileMenu.contains(event.target)) {
                dropdown.classList.add('hidden');
                document.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false');
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                const dropdown = document.getElementById('profileMenuDropdown');
                dropdown.classList.add('hidden');
                document.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false');
            }
        });
    </script>
</body>

</html>
