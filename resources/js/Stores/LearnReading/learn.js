import { create } from "zustand";

export const useLearnReading = create((set, get) => ({
    textProps: {
        fontSize: 20,
    },

    changeTextProps: (props) => {
        set((state) => {
            if (props.fontSize && props.fontSize < 16) {
                props.fontSize = 16;
            }

            if (props.fontSize && props.fontSize > 50) {
                props.fontSize = 50;
            }

            return {
                ...state,
                textProps: { ...state.textProps, ...props },
            };
        });
    },
}));
