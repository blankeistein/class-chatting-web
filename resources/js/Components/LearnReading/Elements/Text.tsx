import { useLearnReading } from "@/Stores/LearnReading/learn";
import { useEffect, useMemo, useRef } from "react";

function playAudio(text: string) {
    let name = text.replace(".", "");
    console.log(name);
    const audio = new Audio(`http://localhost:8000/audio/sample/${name}.mp3`);
    audio.onloadedmetadata = () => {
        audio.play();
    };
}

interface TextProps {
    value: string;
    props: {
        fontSize?: number;
        [key: string]: any;
    };
}

export default function Text({ value, props }: TextProps) {
    const { textProps } = useLearnReading();

    const activeWord = useRef<HTMLElement | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const syllableText = useMemo(() => {
        return splitWordsBySyllable(value);
    }, [value]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleInteractive = (event: Event) => {
            let clientX: number;
            let clientY: number;

            // Handle both touch and mouse events via type narrowing or casting
            if ('touches' in event) {
                const touchEvent = event as TouchEvent;
                clientX = touchEvent.touches[0].clientX;
                clientY = touchEvent.touches[0].clientY;
            } else {
                const mouseEvent = event as MouseEvent;
                clientX = mouseEvent.clientX;
                clientY = mouseEvent.clientY;
            }

            const targetElement = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
            if (
                targetElement &&
                targetElement.classList.contains("words") &&
                targetElement !== activeWord.current
            ) {
                targetElement.classList.add(
                    "scale-125",
                    "text-blue-600",
                    "z-10"
                );

                if (activeWord.current) {
                    activeWord.current.classList.remove(
                        "scale-125",
                        "text-blue-600",
                        "z-10"
                    );
                }
                activeWord.current = targetElement;
                console.log(targetElement.innerText);
                playAudio(targetElement.innerText);
            } else if (targetElement && !targetElement.classList.contains("words")) {
                if (activeWord.current) {
                    activeWord.current.classList.remove(
                        "scale-125",
                        "text-blue-600",
                        "z-10"
                    );
                }
                activeWord.current = null;
            }
        };

        const handleTouchEnd = () => {
            if (activeWord.current) {
                activeWord.current.classList.remove(
                    "scale-125",
                    "text-blue-600",
                    "z-10"
                );
                activeWord.current = null;
            }
        };

        element.addEventListener("mousedown", handleInteractive);
        element.addEventListener("touchstart", handleInteractive);
        element.addEventListener("touchmove", handleInteractive);
        element.addEventListener("touchend", handleTouchEnd);

        return () => {
            element.removeEventListener("mousedown", handleInteractive);
            element.removeEventListener("touchstart", handleInteractive);
            element.removeEventListener("touchmove", handleInteractive);
            element.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    return (
        <>
            <div
                ref={ref}
                className="flex items-start font-bold justify-center gap-y-2 gap-x-5 flex-wrap select-none"
            >
                {syllableText.map((word) =>
                    Array.isArray(word) ? (
                        <div className="flex flex-wrap" key={word.join('')}>
                            {word.map((char, index) => (
                                <div key={index + char} className="contents">
                                    <span
                                        className="words text-xl pb-5 transition-all px-2"
                                        style={{
                                            fontSize: textProps.fontSize || 12,
                                            paddingBottom:
                                                textProps.fontSize || 20,
                                        }}
                                    >
                                        {char}
                                    </span>
                                    {index !== word.length - 1 && (
                                        <span
                                            className="text-xl pb-5"
                                            style={{
                                                fontSize:
                                                    textProps.fontSize || 12,
                                                paddingBottom:
                                                    textProps.fontSize || 20,
                                            }}
                                        >
                                            -
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span
                            key={word}
                            className="words text-xl pb-5 transition-all py-2"
                            style={{
                                fontSize: props?.fontSize || 12,
                                paddingBottom: textProps.fontSize || 20,
                            }}
                        >
                            {word}
                        </span>
                    )
                )}
            </div>
        </>
    );
}

const VOWELS = new Set(["a", "i", "u", "e", "o"]);
const DIGRAPHS = ["ng", "ny", "sy", "kh"];
const DIPHTHONGS = ["ai", "au", "oi"];

function isVowel(ch: string) {
    return VOWELS.has(ch);
}
function startsWithDigraph(s: string) {
    return DIGRAPHS.some((d) => s.startsWith(d));
}

function syllabifyWord(word: string) {
    const w = word.toLowerCase();
    const chars = [...w];
    const out: string[] = [];
    let i = 0;

    while (i < chars.length) {
        // onset: kumpulkan konsonan sebelum vokal
        let onset = "";
        while (i < chars.length && !isVowel(chars[i])) {
            onset += chars[i++];
        }

        // nucleus: ambil 1 vokal atau diftong
        let nucleus = "";
        if (i < chars.length && isVowel(chars[i])) {
            if (i + 1 < chars.length) {
                const two = chars[i] + chars[i + 1];
                if (DIPHTHONGS.includes(two)) {
                    nucleus = two;
                    i += 2;
                } else {
                    nucleus = chars[i++];
                }
            } else {
                nucleus = chars[i++];
            }
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
            out.push(onset + nucleus + cluster);
            break;
        }

        if (cluster.length === 0) {
            out.push(onset + nucleus);
        } else if (cluster.length === 1) {
            out.push(onset + nucleus);
            i = consStart;
        } else {
            if (startsWithDigraph(cluster)) {
                out.push(onset + nucleus);
                i = consStart;
            } else {
                out.push(onset + nucleus + cluster[0]);
                i = consStart + 1;
            }
        }
    }
    return out;
}

export function splitWordsBySyllable(sentence: string) {
    const words = sentence.split(" ");

    const result = words.map((word) => {
        // const syllableRegex = /[bcdfghjklmnpqrstvwxyz]*[aiueo]+/gi;
        return syllabifyWord(word);
    });

    return result;
}
