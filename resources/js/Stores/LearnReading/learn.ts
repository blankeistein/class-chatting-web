import { create } from "zustand";

interface TextProps {
    fontSize: number;
}

interface LearnReadingState {
    textProps: TextProps;
    changeTextProps: (props: Partial<TextProps>) => void;
}

export const useLearnReading = create<LearnReadingState>((set) => ({
    textProps: {
        fontSize: 20,
    },

    changeTextProps: (props) => {
        set((state) => {
            const newProps = { ...props };

            if (newProps.fontSize !== undefined) {
                if (newProps.fontSize < 16) {
                    newProps.fontSize = 16;
                } else if (newProps.fontSize > 50) {
                    newProps.fontSize = 50;
                }
            }

            return {
                textProps: { ...state.textProps, ...newProps },
            };
        });
    },
}));