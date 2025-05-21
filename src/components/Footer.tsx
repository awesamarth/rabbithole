import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t py-6 md:py-8">
            <div className="container flex flex-col items-center justify-between gap-4 px-4 md:px-6 md:flex-row">
                <div className="flex flex-col items-center gap-4 px-4 md:flex-row md:gap-6">
                    <Link href="/" className="flex items-center">
                        <span className="font-[family-name:var(--font-newsreader)] text-lg pt-1 font-medium leading-none flex items-center">Rabbithole</span>
                    </Link>
                    <p className="text-center text-sm text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} Rabbithole. All rights reserved.
                    </p>
                </div>
                <div className="flex space-x-4">
                    <Link
                        href="https://github.com/awesamarth/rabbithole"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        GitHub
                    </Link>
                    <Link
                        href="https://x.com/awesamarth_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        X (Twitter)
                    </Link>
                    <Link
                        href="https://exa.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        Powered by Exa
                    </Link>
                </div>
            </div>
        </footer>
    );
}