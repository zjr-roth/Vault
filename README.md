<!-- Purpose: overview & local dev instructions. Fill in real steps later. -->

# Phalanx (Syndicate Toy)

Pool funds → vote → on‑chain trade.

## Quickstart

1. `pnpm install`
2. Copy `.env.example` → `.env` and add RPC + PRIVATE_KEY
3. `pnpm dev`
4. Deploy contracts: `pnpm hardhat run scripts/deploy.ts --network baseGoerli`
