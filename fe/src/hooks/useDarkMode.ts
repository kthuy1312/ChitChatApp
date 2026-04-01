import { useEffect, useState } from "react";

export const useDarkMode = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {

        const hasDark = document.documentElement.classList.contains("dark");
        setIsDark(hasDark);

        // Listen for changes
        const observer = new MutationObserver(() => {
            const hasDark = document.documentElement.classList.contains("dark");
            setIsDark(hasDark);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"]
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
};
