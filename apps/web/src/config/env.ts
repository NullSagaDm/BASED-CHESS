export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787",
  baseChain: (import.meta.env.VITE_BASE_CHAIN ?? "baseSepolia") as "base" | "baseSepolia",
  resultNftContractAddress:
    import.meta.env.VITE_RESULT_NFT_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000",
  enableDevAuth: import.meta.env.VITE_ENABLE_DEV_AUTH === "true"
};
