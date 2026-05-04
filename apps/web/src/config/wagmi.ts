import { QueryClient } from "@tanstack/react-query";
import { base, baseSepolia } from "viem/chains";
import { createConfig, createStorage, http } from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";
import { env } from "./env";

export const chain = env.baseChain === "base" ? base : baseSepolia;

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    baseAccount({
      appName: "Based Chess"
    }),
    injected()
  ],
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http()
  }
});

export const queryClient = new QueryClient();

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
