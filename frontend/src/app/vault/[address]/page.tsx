"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
	useAccount,
	useReadContracts,
	useWriteContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, isAddress } from "viem";
import { SYNDICATE_VAULT_ABI } from "@/utils/contractABI";

export default function VaultPage() {
	const params = useParams();
	const vaultAddress = params.address as string;
	const { address: userAddress, isConnected } = useAccount();
	const [depositAmount] = useState("0.05"); // Hard-coded as requested

	const { writeContract, data: hash, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
		{
			hash,
		}
	);

	// Validate vault address
	if (!vaultAddress || !isAddress(vaultAddress)) {
		return (
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-md mx-auto text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">
						Invalid Vault Address
					</h1>
					<p className="text-gray-600">
						The provided vault address is not valid.
					</p>
				</div>
			</div>
		);
	}

	// Read vault data - only include isMember check if user is connected
	const contracts = [
		{
			address: vaultAddress as `0x${string}`,
			abi: SYNDICATE_VAULT_ABI,
			functionName: "getBalance",
		},
		{
			address: vaultAddress as `0x${string}`,
			abi: SYNDICATE_VAULT_ABI,
			functionName: "getMembers",
		},
		{
			address: vaultAddress as `0x${string}`,
			abi: SYNDICATE_VAULT_ABI,
			functionName: "threshold",
		},
	];

	// Only add isMember check if user is connected
	if (isConnected && userAddress) {
		contracts.push({
			address: vaultAddress as `0x${string}`,
			abi: SYNDICATE_VAULT_ABI,
			functionName: "isMember",
			args: [userAddress],
		} as any);
	}

	const {
		data: vaultData,
		isLoading,
		refetch,
	} = useReadContracts({
		contracts,
	});

	const [balance, members, threshold, isUserMember] = vaultData || [];

	const handleDeposit = async () => {
		if (!isConnected || !userAddress) {
			alert("Please connect your wallet");
			return;
		}

		if (!isUserMember?.result) {
			alert("Only vault members can deposit");
			return;
		}

		try {
			writeContract({
				address: vaultAddress as `0x${string}`,
				abi: SYNDICATE_VAULT_ABI,
				functionName: "deposit",
				value: parseEther(depositAmount),
			});
		} catch (err: any) {
			console.error("Deposit failed:", err);
			alert("Deposit failed: " + (err.message || "Unknown error"));
		}
	};

	// Refetch data after successful transaction
	if (isSuccess) {
		refetch();
	}

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-2xl font-bold mb-4">
						Loading Vault...
					</h1>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-12">
			<div className="max-w-4xl mx-auto">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Vault Details
					</h1>
					<p className="text-gray-600 font-mono text-sm bg-gray-100 p-2 rounded">
						{vaultAddress}
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Vault Stats */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h2 className="text-xl font-semibold mb-4">
							Vault Information
						</h2>

						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-gray-600">
									ETH Balance:
								</span>
								<span className="font-mono font-semibold">
									{balance?.result
										? formatEther(balance.result as bigint)
										: "0"}{" "}
									ETH
								</span>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600">
									Vote Threshold:
								</span>
								<span className="font-semibold">
									{threshold?.result?.toString() || "0"} votes
								</span>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600">
									Total Members:
								</span>
								<span className="font-semibold">
									{members?.result
										? (members.result as string[]).length
										: 0}
								</span>
							</div>

							<div className="flex justify-between">
								<span className="text-gray-600">
									Your Status:
								</span>
								<span
									className={`font-semibold ${
										isUserMember?.result
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{isConnected
										? isUserMember?.result
											? "Member"
											: "Non-member"
										: "Not connected"}
								</span>
							</div>
						</div>
					</div>

					{/* Deposit Section */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h2 className="text-xl font-semibold mb-4">
							Deposit ETH
						</h2>

						{isConnected && userAddress && isUserMember?.result ? (
							<div>
								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Amount to Deposit
									</label>
									<div className="flex items-center space-x-2">
										<input
											type="text"
											value={depositAmount}
											readOnly
											className="flex-1 p-3 border border-gray-300 rounded-md bg-gray-50 font-mono"
										/>
										<span className="text-gray-600">
											ETH
										</span>
									</div>
									<p className="text-sm text-gray-600 mt-1">
										Amount is fixed at 0.05 ETH for this
										demo
									</p>
								</div>

								<button
									onClick={handleDeposit}
									disabled={isConfirming}
									className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isConfirming
										? "Depositing..."
										: `Deposit ${depositAmount} ETH`}
								</button>

								{error && (
									<div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
										Error: {error.message}
									</div>
								)}

								{isSuccess && hash && (
									<div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
										Deposit successful!
										<br />
										<span className="font-mono text-xs">
											Tx: {hash}
										</span>
									</div>
								)}
							</div>
						) : !isConnected ? (
							<p className="text-gray-600">
								Please connect your wallet to deposit
							</p>
						) : (
							<p className="text-red-600">
								Only vault members can deposit ETH
							</p>
						)}
					</div>
				</div>

				{/* Members List */}
				<div className="mt-6 bg-white rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold mb-4">
						Vault Members
					</h2>
					{members?.result &&
					(members.result as string[]).length > 0 ? (
						<div className="space-y-2">
							{(members.result as string[]).map(
								(member, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 bg-gray-50 rounded border"
									>
										<span className="font-mono text-sm">
											{member}
										</span>
										{member.toLowerCase() ===
											userAddress?.toLowerCase() && (
											<span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
												You
											</span>
										)}
									</div>
								)
							)}
						</div>
					) : (
						<p className="text-gray-600">No members found</p>
					)}
				</div>
			</div>
		</div>
	);
}
