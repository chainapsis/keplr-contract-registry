export type ChainBase = {
  chainId: string;
  rest: string;
  bech32PrefixAccAddr: string;
  features: ("secretwasm" | "wasmd_0.24+")[];
};

export type CW20Token = {
  contractAddress: string;
  imageUrl: string;
  metadata: {
    name: string;
    symbol: string;
    decimals: number;
  };
  coinGeckoId?: string;
};
