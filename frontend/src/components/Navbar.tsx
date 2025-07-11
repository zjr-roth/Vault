"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
	return (
		<nav className="border-b border-gray-200 bg-white px-4 py-3">
			<div className="flex items-center justify-between max-w-7xl mx-auto">
				<div className="flex items-center space-x-4">
					<h1 className="text-xl font-bold text-gray-900">
						Syndicate Toy
					</h1>
					<div className="hidden sm:flex space-x-4">
						<a
							href="/"
							className="text-gray-600 hover:text-gray-900"
						>
							Home
						</a>
						<a
							href="/create"
							className="text-gray-600 hover:text-gray-900"
						>
							Create Vault
						</a>
						<a
							href="/propose"
							className="text-gray-600 hover:text-gray-900"
						>
							Propose Trade
						</a>
					</div>
				</div>
				<ConnectButton />
			</div>
		</nav>
	);
}
