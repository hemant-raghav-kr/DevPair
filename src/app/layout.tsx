import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/common/Navbar";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevPair | Find Teammates for Projects & Hackathons",
  description:
    "A platform where college students find teammates for projects and hackathons based on skills, interests, and availability.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('devpair-theme');var t=s==='light'?'light':'dark';var r=document.documentElement;if(t==='dark'){r.classList.add('dark');r.classList.remove('light');}else{r.classList.remove('dark');r.classList.add('light');}r.setAttribute('data-theme',t);r.style.colorScheme=t;}catch(e){var r=document.documentElement;r.classList.add('dark');r.setAttribute('data-theme','dark');r.style.colorScheme='dark';}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <ThemeProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}

