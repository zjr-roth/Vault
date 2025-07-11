"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
	const { address, isConnected } = useAccount();

	return (
		<div className="container mx-auto px-4 py-12">
			<div className="max-w-4xl mx-auto text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-6">
					Syndicate Toy
				</h1>
				<p className="text-xl text-gray-600 mb-8">
					Pool funds → vote → on‑chain trade
				</p>

				<div className="bg-white rounded-lg shadow-md p-8 mb-8">
					{!isConnected ? (
						<div>
							<h2 className="text-2xl font-semibold mb-4">
								Connect Your Wallet
							</h2>
							<p className="text-gray-600 mb-6">
								Connect your wallet to create vaults, deposit
								funds, and participate in trading decisions.
							</p>
							<ConnectButton />
						</div>
					) : (
						<div>
							<h2 className="text-2xl font-semibold mb-4">
								Welcome!
							</h2>
							<p className="text-gray-600 mb-4">
								Connected as:{" "}
								<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
									{address}
								</span>
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<a
									href="/create"
									className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
								>
									Create New Vault
								</a>
								<a
									href="/propose"
									className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
								>
									Propose Trade
								</a>
							</div>
						</div>
					)}
				</div>

				<div className="grid md:grid-cols-3 gap-6 text-left">
					<div className="bg-white p-6 rounded-lg shadow-sm">
						<h3 className="font-semibold text-lg mb-3">
							1. Create Vault
						</h3>
						<p className="text-gray-600">
							Set up a multi-signature vault with your team
							members and voting threshold.
						</p>
					</div>
					<div className="bg-white p-6 rounded-lg shadow-sm">
						<h3 className="font-semibold text-lg mb-3">
							2. Propose Trades
						</h3>
						<p className="text-gray-600">
							Submit trading proposals for the group to vote on
							using Uniswap V3.
						</p>
					</div>
					<div className="bg-white p-6 rounded-lg shadow-sm">
						<h3 className="font-semibold text-lg mb-3">
							3. Execute Together
						</h3>
						<p className="text-gray-600">
							Once threshold is reached, anyone can execute the
							approved trade.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
