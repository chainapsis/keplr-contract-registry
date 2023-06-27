import { ChainBase } from "./types";
import { EnigmaUtils } from "./enigma-utils";
import Axios from "axios";

export const fetchTokenMetadata = async (
  chainBase: ChainBase,
  contractAddress: string
): Promise<
  | {
      name: string;
      symbol: string;
      decimals: number;
    }
  | undefined
> => {
  if (chainBase.features && chainBase.features.includes("secretwasm")) {
    const enigmaUtils = new EnigmaUtils(
      chainBase.rest,
      new Uint8Array(32),
      chainBase.chainId
    );

    const queryCodeHash = await Axios.get(
      `/compute/v1beta1/code_hash/by_contract_address/${contractAddress}`,
      {
        baseURL: chainBase.rest,
      }
    );
    const contractCodeHash = queryCodeHash.data.code_hash;

    const encrypted = await enigmaUtils.encrypt(contractCodeHash, {
      token_info: {},
    });
    const nonce = encrypted.slice(0, 32);

    const encoded = Buffer.from(encrypted).toString("base64");

    const queryParam = new URLSearchParams({ query: encoded });
    const queryContractInfo = await Axios.get(
      `/compute/v1beta1/query/${contractAddress}?${queryParam.toString()}`,
      {
        baseURL: chainBase.rest,
      }
    );

    const decrypted = await enigmaUtils.decrypt(
      Buffer.from(queryContractInfo.data.data, "base64"),
      nonce
    );
    const tokenInfo = JSON.parse(
      Buffer.from(Buffer.from(decrypted).toString(), "base64").toString()
    );
    return {
      name: tokenInfo.token_info.name,
      symbol: tokenInfo.token_info.symbol,
      decimals: tokenInfo.token_info.decimals,
    };
  }

  const msg = {
    token_info: {},
  };
  const query = Buffer.from(JSON.stringify(msg)).toString("base64");
  let url = `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`;
  if (chainBase.features && chainBase.features.includes("legacy-query")) {
    url = `/wasm/v1/contract/${contractAddress}/smart/${query}`;
  }

  const queryContractInfo = await Axios.get(url, {
    baseURL: chainBase.rest,
  });
  return {
    name: queryContractInfo.data.data.name,
    symbol: queryContractInfo.data.data.symbol,
    decimals: queryContractInfo.data.data.decimals,
  };
};
