"use client";

import { useState, useEffect } from "react";
import {
	useAccount,
	useDeployContract,
	useWaitForTransactionReceipt,
	useChainId,
} from "wagmi";
import { getAddress, isAddress } from "viem";
import { useRouter } from "next/navigation";
import { SYNDICATE_VAULT_ABI } from "@/utils/contractABI";
import { SYNDICATE_VAULT_BYTECODE } from "@/utils/contractBytecode";

// Base Goerli chain ID and router address
const BASE_GOERLI_CHAIN_ID = 84531;
const SWAP_ROUTER_ADDRESS = "0x2626664c2603336E57B271c5C0b26F421741e481";

export default function CreateVault() {
	const { address, isConnected } = useAccount();
	const chainId = useChainId();
	const router = useRouter();

	// Dynamic member management
	const [members, setMembers] = useState<string[]>([""]);
	const [threshold, setThreshold] = useState<number>(1);
	const [isDeploying, setIsDeploying] = useState(false);
	const [deploymentError, setDeploymentError] = useState<string>("");

	// Contract deployment hooks
	const { deployContract, data: hash, error } = useDeployContract();
	const {
		isLoading: isConfirming,
		isSuccess,
		data: receipt,
	} = useWaitForTransactionReceipt({
		hash,
	});

	// Auto-add user's address as first member
	useEffect(() => {
		if (address && members.length === 1 && !members[0]) {
			setMembers([address]);
		}
	}, [address, members]);

	// Handle successful deployment
	useEffect(() => {
		if (isSuccess && receipt?.contractAddress) {
			setIsDeploying(false);
			// Navigate to the deployed vault page
			router.push(`/vault/${receipt.contractAddress}`);
		}
	}, [isSuccess, receipt, router]);

	const addMember = () => {
		setMembers([...members, ""]);
		// Auto-adjust threshold if needed
		if (threshold > members.length + 1) {
			setThreshold(members.length + 1);
		}
	};

	const removeMember = (index: number) => {
		if (members.length > 1) {
			const newMembers = members.filter((_, i) => i !== index);
			setMembers(newMembers);
			// Adjust threshold if it's now too high
			if (threshold > newMembers.length) {
				setThreshold(newMembers.length);
			}
		}
	};

	const handleMemberChange = (index: number, value: string) => {
		const newMembers = [...members];
		newMembers[index] = value;
		setMembers(newMembers);
	};

	const validateForm = () => {
		try {
			// Filter out empty addresses
			const filledMembers = members.filter((member) => member.trim());

			if (filledMembers.length === 0) {
				throw new Error("At least one member address is required");
			}

			// Validate all member addresses
			const validMembers = filledMembers.map((member) => {
				if (!isAddress(member.trim())) {
					throw new Error(`Invalid address: ${member}`);
				}
				return getAddress(member.trim());
			});

			// Check for duplicates
			const uniqueMembers = new Set(validMembers);
			if (uniqueMembers.size !== validMembers.length) {
				throw new Error("Duplicate member addresses not allowed");
			}

			// Validate threshold
			if (threshold < 1 || threshold > validMembers.length) {
				throw new Error(
					`Threshold must be between 1 and ${validMembers.length}`
				);
			}

			return validMembers;
		} catch (err) {
			throw err;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setDeploymentError("");

		if (!isConnected) {
			setDeploymentError("Please connect your wallet");
			return;
		}

		if (chainId !== BASE_GOERLI_CHAIN_ID) {
			setDeploymentError("Please switch to Base Goerli network");
			return;
		}

		if (SYNDICATE_VAULT_BYTECODE === "0x") {
			setDeploymentError(
				"Contract bytecode not available. Run 'npm run prepare-frontend' to compile contracts."
			);
			return;
		}

		try {
			setIsDeploying(true);
			const validatedMembers = validateForm();

			// Deploy vault contract
			deployContract({
				abi: SYNDICATE_VAULT_ABI,
				bytecode: SYNDICATE_VAULT_BYTECODE,
				args: [
					validatedMembers,
					BigInt(threshold),
					SWAP_ROUTER_ADDRESS,
				],
			});
		} catch (err: any) {
			setDeploymentError(err.message || "Failed to deploy vault");
			setIsDeploying(false);
		}
	};

	// Handle deployment errors
	useEffect(() => {
		if (error) {
			setIsDeploying(false);
			setDeploymentError(error.message || "Deployment failed");
		}
	}, [error]);

	if (!isConnected) {
		return (
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-md mx-auto text-center">
					<h1 className="text-2xl font-bold mb-4">
						Create New Vault
					</h1>
					<p className="text-gray-600 mb-6">
						Please connect your wallet to create a vault
					</p>
				</div>
			</div>
		);
	}

	if (chainId !== BASE_GOERLI_CHAIN_ID) {
		return (
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-md mx-auto text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">
						Wrong Network
					</h1>
					<p className="text-gray-600 mb-6">
						Please switch to Base Goerli network to deploy vaults
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-12">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">
					Create New Vault
				</h1>

				<form
					onSubmit={handleSubmit}
					className="bg-white rounded-lg shadow-md p-6"
				>
					{/* Member Management */}
					<div className="mb-6">
						<div className="flex justify-between items-center mb-4">
							<label className="block text-sm font-medium text-gray-700">
								Member Addresses (
								{members.filter((m) => m.trim()).length} total)
							</label>
							<button
								type="button"
								onClick={addMember}
								className="text-blue-600 hover:text-blue-800 text-sm font-medium"
							>
								+ Add Member
							</button>
						</div>

						{members.map((member, index) => (
							<div key={index} className="flex gap-2 mb-2">
								<input
									type="text"
									placeholder={`Member ${
										index + 1
									} address (0x...)`}
									value={member}
									onChange={(e) =>
										handleMemberChange(
											index,
											e.target.value
										)
									}
									className="flex-1 p-3 border border-gray-300 rounded-md font-mono text-sm"
								/>
								{members.length > 1 && (
									<button
										type="button"
										onClick={() => removeMember(index)}
										className="px-3 py-2 text-red-600 hover:text-red-800"
									>
										×
									</button>
								)}
							</div>
						))}

						<p className="text-xs text-gray-500 mt-2">
							💡 For testing: Add your own address with threshold
							= 1
						</p>
					</div>

					{/* Threshold Selection */}
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Voting Threshold
						</label>
						<select
							value={threshold}
							onChange={(e) =>
								setThreshold(Number(e.target.value))
							}
							className="w-full p-3 border border-gray-300 rounded-md"
						>
							{Array.from(
								{
									length: Math.max(
										1,
										members.filter((m) => m.trim()).length
									),
								},
								(_, i) => i + 1
							).map((num) => (
								<option key={num} value={num}>
									{num} vote{num > 1 ? "s" : ""} required
								</option>
							))}
						</select>
						<p className="text-sm text-gray-600 mt-1">
							Number of votes needed to execute proposals
						</p>
					</div>

					{/* Network Info */}
					<div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
						<p className="text-sm text-blue-800">
							<strong>Network:</strong> Base Goerli Testnet
							<br />
							<strong>Router:</strong> Uniswap V3 (
							{SWAP_ROUTER_ADDRESS.slice(0, 10)}...)
						</p>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isDeploying || isConfirming}
						className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
					>
						{isDeploying || isConfirming
							? isConfirming
								? "Confirming Transaction..."
								: "Deploying Vault..."
							: "Deploy Vault"}
					</button>

					{/* Error Display */}
					{deploymentError && (
						<div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							<strong>Error:</strong> {deploymentError}
						</div>
					)}

					{/* Transaction Hash */}
					{hash && (
						<div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
							<strong>Transaction submitted!</strong>
							<br />
							<span className="font-mono text-xs break-all">
								{hash}
							</span>
						</div>
					)}

					{/* Success Message */}
					{isSuccess && receipt?.contractAddress && (
						<div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
							<strong>✅ Vault deployed successfully!</strong>
							<br />
							Redirecting to vault page...
						</div>
					)}
				</form>

				{/* Instructions */}
				<div className="mt-8 bg-gray-50 rounded-lg p-6">
					<h3 className="font-semibold text-lg mb-3">
						Quick Start Guide
					</h3>
					<div className="space-y-2 text-sm text-gray-700">
						<p>
							<strong>Single Wallet Testing:</strong> Add just
							your address with threshold = 1
						</p>
						<p>
							<strong>Multi-Member Vault:</strong> Add 2+
							addresses with threshold = 2+
						</p>
						<p>
							<strong>After Deployment:</strong> Send ETH to
							vault, create proposals, vote & execute
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
