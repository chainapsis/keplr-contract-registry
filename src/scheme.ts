import Joi from "joi";
import { ChainBase, CW20Token } from "./types";

export const ChainBaseScheme = Joi.object<ChainBase>({
  chainId: Joi.string().strict(true).required(),
  rest: Joi.string().uri().strict(true).required(),
  bech32PrefixAccAddr: Joi.string().strict(true).required(),
  features: Joi.array()
    .items(Joi.string().valid("secretwasm", "wasmd_0.24+").strict(true))
    .required(),
});

export const CW20TokenScheme = Joi.object<CW20Token>({
  contractAddress: Joi.string().strict(true).required(),
  imageUrl: Joi.string().strict(true).required(),
  metadata: Joi.object({
    name: Joi.string().strict(true).required(),
    symbol: Joi.string().strict(true).required(),
    decimals: Joi.number().strict(true).required(),
  }).required(),
  coinGeckoId: Joi.string().strict(true),
});
