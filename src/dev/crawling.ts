import * as process from "process";

type Base = {
  chain_name: string;
  assets: Asset[];
};

type Denom = {
  denom?: string;
  exponent?: number;
};

type Asset = {
  address?: string;
  name: string;
  symbol: string;
  base?: string;
  denom_units?: Denom[];
  logo_URIs?: {
    [key: string]: string;
  };
};

const crawlingCosmosRegistry = async (argv: string[]) => {
  if (argv.length >= 3) {
    const registry = await fetch(
      `https://raw.githubusercontent.com/cosmos/chain-registry/master/${argv[2]}/assetlist.json`
    );

    const assetlist: Base = await registry.json();

    const cw20 = assetlist.assets
      .filter((asset) => asset.base?.startsWith("cw20"))
      .map((asset) => {
        return {
          contractAddress: asset.address || asset.base?.split(":")[1],
          imageUrl: Object.values(asset.logo_URIs ?? {})[0],
          metadata: {
            name: asset.name,
            symbol: asset.symbol,
            decimals: asset.denom_units?.at(1)?.exponent ?? 0,
          },
        };
      });

    console.log(cw20);
  } else {
    console.error("Usage: yarn dev:crawling [chain_name]");
  }
};

crawlingCosmosRegistry(process.argv);
