import FS from "fs";
import { CW20TokenScheme } from "../scheme";
import { getChainBaseMap } from "../utils";
import Path from "path";
import { Bech32Address } from "@keplr-wallet/cosmos";
import { fetchTokenMetadata } from "../query";
import { sortedJsonByKeyStringify } from "@keplr-wallet/common";

(async () => {
  try {
    const baseMap = getChainBaseMap(Path.join(__dirname, "..", "..", "cosmos"));

    // get file names
    const args = process.argv.slice(2);

    for (const arg of args) {
      const path = arg;

      if (/cosmos\/.+\/tokens/.test(path)) {
        const buf = FS.readFileSync(path);
        const json = JSON.parse(buf.toString());
        const validated = CW20TokenScheme.validate(json);
        if (validated.error) {
          throw validated.error;
        }

        const chain = (() => {
          const i = path.indexOf("cosmos/");
          const j = path.indexOf("/tokens");
          return path.slice(i + 7, j);
        })();

        const base = baseMap[chain];
        if (!base) {
          throw new Error(`Base is not found for ${chain}`);
        }

        if (!path.endsWith(`${validated.value.contractAddress}.json`)) {
          throw new Error("File path and contract address is not matched");
        }

        Bech32Address.validate(
          validated.value.contractAddress,
          base.bech32PrefixAccAddr
        );

        const fetchedMetadata = await fetchTokenMetadata(
          base,
          validated.value.contractAddress
        );
        console.log("Fetched metadata:", fetchedMetadata);
        if (!fetchedMetadata) {
          throw new Error(
            `Fetched metadata is not found (${validated.value.contractAddress})`
          );
        }

        if (
          sortedJsonByKeyStringify(fetchedMetadata) !==
          sortedJsonByKeyStringify(validated.value.metadata)
        ) {
          throw new Error(
            `Fetched metadata is not same with the token metadata: (expected: ${JSON.stringify(
              fetchedMetadata
            )}, actual: ${JSON.stringify(
              validated.value.metadata
            )}), contract: ${validated.value.contractAddress}, chain: ${chain})`
          );
        }
      } else {
        throw new Error(`Invalid path: ${path}`);
      }
    }
  } catch (error) {
    console.log(error?.message || error);

    process.exit(1);
  }
})();
