import { ChainBase } from "./types";
import FS from "fs";
import Path from "path";
import { ChainBaseScheme } from "./scheme";
import { ChainIdHelper } from "@keplr-wallet/cosmos";

export const getChainBaseMap = (
  baseDir: string
): Record<string, ChainBase | undefined> => {
  const chains = FS.readdirSync(baseDir)
    .filter((file) => {
      return FS.lstatSync(
        Path.join(Path.join(__dirname, "..", "cosmos"), file)
      ).isDirectory();
    })
    .filter((chain) => {
      try {
        return FS.lstatSync(
          Path.join(Path.join(__dirname, "..", "cosmos"), chain, "base.json")
        ).isFile();
      } catch (e) {
        console.log(e);
        return false;
      }
    });

  const map: Record<string, ChainBase> = {};
  for (const chain of chains) {
    try {
      const buf = FS.readFileSync(
        Path.join(Path.join(__dirname, "..", "cosmos"), chain, "base.json")
      );
      const json = JSON.parse(buf.toString());
      const validated = ChainBaseScheme.validate(json);
      if (validated.error) {
        throw validated.error;
      }
      const chainIdentifier = ChainIdHelper.parse(validated.value.chainId);
      if (chainIdentifier.identifier !== chain) {
        throw new Error(
          `Chain identifier is not matched: ${chainIdentifier.identifier} vs ${chain}`
        );
      }
      map[chain] = validated.value;
    } catch (e) {
      console.log(e);
    }
  }

  return map;
};

export const validateImageUrl = (
  chainIdentifier: string,
  url: string
): string => {
  const baseURL = `https://raw.githubusercontent.com/chainapsis/keplr-contract-registry/main/images/${chainIdentifier}/`;

  if (!url.startsWith(baseURL)) {
    throw new Error(`Invalid image url: ${url}`);
  }
  if (!(url.endsWith(".png") || url.endsWith(".svg"))) {
    throw new Error(`Image formats can only be PNG and SVG.`);
  }

  return url.replace(baseURL, "");
};
