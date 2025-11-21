import { useLearnReading } from "@/Stores/LearnReading/learn";
import { useEffect, useMemo, useRef } from "react";

function playAudio(text) {
    let name = text.replace(".", "");
    console.log(name);
    const audio = new Audio(`http://localhost:8000/audio/sample/${name}.mp3`);
    audio.onloadedmetadata = () => {
        audio.play();
    };
}

export default function Text({ value, props }) {
    const { textProps } = useLearnReading();

    const activeWord = useRef(null);
    const ref = useRef();
    const syllableText = useMemo(() => {
        return splitWordsBySyllable(value);
    }, [value]);

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
            } else if (!targetElement.classList.contains("words")) {
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

        const element = ref.current;
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
                        <div className="flex flex-wrap">
                            {word.map((char, index) => (
                                <>
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
                                </>
                            ))}
                        </div>
                    ) : (
                        <span
                            className="words text-xl pb-5 transition-all py-2"
                            style={{
                                fontSize: props?.fontSize || 12,
                                paddingBottom: textProps.fontSize || 20,
                            }}
                        >
                            {syllableText}
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

function isVowel(ch) {
    return VOWELS.has(ch);
}
function startsWithDigraph(s) {
    return DIGRAPHS.some((d) => s.startsWith(d));
}

// function syllabifyWord(word) {
//     const w = word.toLowerCase();
//     const chars = [...w];
//     const out = [];
//     let i = 0;

//     while (i < chars.length) {
//         // onset: 0+ konsonan sebelum vokal
//         let onset = "";
//         while (i < chars.length && !isVowel(chars[i])) {
//             onset += chars[i++];
//         }

//         // nucleus: 1+ vokal (kumpulkan semua vokal berurutan)
//         let nucleus = "";
//         while (i < chars.length && isVowel(chars[i])) {
//             nucleus += chars[i++];
//         }

//         if (nucleus === "") {
//             if (out.length) out[out.length - 1] += onset;
//             else out.push(onset);
//             break;
//         }

//         // kumpulkan cluster konsonan hingga vokal berikutnya
//         const consStart = i;
//         while (i < chars.length && !isVowel(chars[i])) i++;
//         const cluster = chars.slice(consStart, i).join("");

//         if (i === chars.length) {
//             // akhir kata: semua sisa jadi koda
//             out.push(onset + nucleus + cluster);
//             break;
//         }

//         if (cluster.length === 0) {
//             out.push(onset + nucleus);
//         } else if (cluster.length === 1) {
//             // single C ke onset suku kata berikutnya
//             out.push(onset + nucleus);
//             i = consStart; // kembalikan konsonan untuk onset berikutnya
//         } else {
//             // 2+ konsonan
//             if (startsWithDigraph(cluster)) {
//                 // biarkan seluruh cluster jadi onset berikutnya
//                 out.push(onset + nucleus);
//                 i = consStart;
//             } else {
//                 // default: bagi 1/ (sisanya)
//                 out.push(onset + nucleus + cluster[0]);
//                 i = consStart + 1;
//             }
//         }
//     }
//     return out;
// }

function syllabifyWord(word) {
    const w = word.toLowerCase();
    const chars = [...w];
    const out = [];
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

export function splitWordsBySyllable(sentence) {
    const words = sentence.split(" ");

    const result = words.map((word) => {
        // const syllableRegex = /[bcdfghjklmnpqrstvwxyz]*[aiueo]+/gi;
        return syllabifyWord(word);
    });

    return result;
}
