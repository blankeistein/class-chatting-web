import { Button } from "@material-tailwind/react";
import { useEffect, useRef } from "react";

const VOWELS = new Set(["a", "i", "u", "e", "o"]);
const DIGRAPHS = ["ng", "ny", "sy", "kh"];

function isVowel(ch) {
    return VOWELS.has(ch);
}
function startsWithDigraph(s) {
    return DIGRAPHS.some((d) => s.startsWith(d));
}

function syllabifyWord(word) {
    const w = word.toLowerCase();
    const chars = [...w];
    const out = [];
    let i = 0;

    while (i < chars.length) {
        // onset: 0+ konsonan sebelum vokal
        let onset = "";
        while (i < chars.length && !isVowel(chars[i])) {
            onset += chars[i++];
        }

        // nucleus: 1+ vokal (kumpulkan semua vokal berurutan)
        let nucleus = "";
        while (i < chars.length && isVowel(chars[i])) {
            nucleus += chars[i++];
        }

        if (nucleus === "") {
            if (out.length) out[out.length - 1] += onset;
            else out.push(onset);
            break;
        }

        // kumpulkan cluster konsonan hingga vokal berikutnya
        const consStart = i;
        while (i < chars.length && !isVowel(chars[i])) i++;
        const cluster = chars.slice(consStart, i).join("");

        if (i === chars.length) {
            // akhir kata: semua sisa jadi koda
            out.push(onset + nucleus + cluster);
            break;
        }

        if (cluster.length === 0) {
            out.push(onset + nucleus);
        } else if (cluster.length === 1) {
            // single C ke onset suku kata berikutnya
            out.push(onset + nucleus);
            i = consStart; // kembalikan konsonan untuk onset berikutnya
        } else {
            // 2+ konsonan
            if (startsWithDigraph(cluster)) {
                // biarkan seluruh cluster jadi onset berikutnya
                out.push(onset + nucleus);
                i = consStart;
            } else {
                // default: bagi 1/ (sisanya)
                out.push(onset + nucleus + cluster[0]);
                i = consStart + 1;
            }
        }
    }
    return out;
}

export function splitWordsBySyllable(sentence) {
    const words = sentence.split(" ");

    const result = words.map((word) => {
        // const syllableRegex = /[bcdfghjklmnpqrstvwxyz]*[aiueo]+/gi;
        return syllabifyWord(word);
    });

    return result;
}

const DUMMY_TEXT =
    "baju itu berwarna merah. rambutnya berwarna pink. tasku berwarna hitam.";
const RESULT = [
    ["ba", "ju"],
    ["i", "tu"],
    ["ber", "war", "na"],
    ["me", "rah"],
];

export default function Test2() {
    const activeWord = useRef(null);
    const ref = useRef();
    const activeRead = useRef(null);
    const isReading = useRef(false);
    const words = splitWordsBySyllable(DUMMY_TEXT);

    useEffect(() => {
        if (!ref.current) return;

        const handleInteractive = (event) => {
            const clientX = event.touches
                ? event.touches[0].clientX
                : event.clientX;
            const clientY = event.touches
                ? event.touches[0].clientY
                : event.clientY;

            const targetElement = document.elementFromPoint(clientX, clientY);
            if (
                targetElement &&
                targetElement.classList.contains("words") &&
                targetElement !== activeWord.current
            ) {
                targetElement.classList.add("text-blue-600", "z-10");

                if (activeWord.current) {
                    activeWord.current.classList.remove(
                        "text-blue-600",
                        "z-10"
                    );
                }
                activeWord.current = targetElement;
            } else if (!targetElement.classList.contains("words")) {
                if (activeWord.current) {
                    activeWord.current.classList.remove(
                        "text-blue-600",
                        "z-10"
                    );
                }
                activeWord.current = null;
            }
        };

        const handleTouchEnd = () => {
            if (activeWord.current) {
                activeWord.current.classList.remove("text-blue-600", "z-10");
                activeWord.current = null;
            }
        };

        const element = ref.current;
        element.addEventListener("mouseover", handleInteractive);
        element.addEventListener("touchstart", handleInteractive);
        element.addEventListener("touchmove", handleInteractive);
        element.addEventListener("touchend", handleTouchEnd);

        return () => {
            element.removeEventListener("mouseover", handleInteractive);
            element.removeEventListener("touchstart", handleInteractive);
            element.removeEventListener("touchmove", handleInteractive);
            element.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    const simulateBaca = () => {
        if (activeRead.current) {
            isReading.current = false;
            clearTimeout(activeRead.current);
        }

        isReading.current = true;
        activeRead.current = setTimeout(async () => {
            const words = ref.current.querySelectorAll(".words");
            for (let i = 0; i < words.length; i++) {
                if (!isReading.current) {
                    break;
                }
                let word = words[i];
                word.classList.add("scale-125", "text-blue-600", "z-10");
                await new Promise((res) => setTimeout(res, 1000));
                word.classList.remove("scale-125", "text-blue-600", "z-10");
            }
            isReading.current = false;
        });
    };

    return (
        <div className="mx-auto max-w-lg w-full bg-[#F0F7FF] min-h-screen">
            <div className="grid grid-cols-2">
                <div
                    ref={ref}
                    className="flex items-start font-bold justify-center gap-y-2 gap-x-1 flex-wrap select-none p-5 px-10"
                >
                    {words.map((word) =>
                        Array.isArray(word) ? (
                            <div className="flex flex-wrap">
                                {word.map((char, index) => (
                                    <span
                                        key={index + char}
                                        className="words text-2xl pb-8 transition-all"
                                    >
                                        {char}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="words text-2xl pb-8 transition-all p-1">
                                {word}
                            </span>
                        )
                    )}
                </div>
                <div
                    ref={ref}
                    className="flex items-start font-bold justify-center gap-y-2 gap-x-1 flex-wrap select-none p-5 px-10"
                >
                    {words.map((word) =>
                        Array.isArray(word) ? (
                            <div className="flex flex-wrap">
                                {word.map((char, index) => (
                                    <span
                                        key={index + char}
                                        className="words text-2xl pb-8 transition-all"
                                    >
                                        {char}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="words text-2xl pb-8 transition-all p-1">
                                {word}
                            </span>
                        )
                    )}
                </div>
            </div>
            <Button className="!fixed bottom-1 left-1" onClick={simulateBaca}>
                Baca
            </Button>
        </div>
    );
}
