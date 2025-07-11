"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/utils/wagmiConfig";
import Navbar from "@/components/Navbar";

const geistSans = Inter({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Inter({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const queryClient = new QueryClient();

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<QueryClientProvider client={queryClient}>
					<WagmiProvider config={config}>
						<RainbowKitProvider>
							<Navbar />
							<main className="min-h-screen bg-gray-50">
								{children}
							</main>
						</RainbowKitProvider>
					</WagmiProvider>
				</QueryClientProvider>
			</body>
		</html>
	);
}
