import FS from "fs";
import Path from "path";
import { CW20TokenScheme } from "./scheme";
import { CW20Token } from "./types";
import { Bech32Address } from "@keplr-wallet/cosmos";
import Koa from "koa";
import Router from "koa-router";
import { getChainBaseMap } from "./utils";

const baseDir = Path.join(__dirname, "..", "cosmos");
const chainBaseMap = getChainBaseMap(baseDir);
const chains = Object.keys(chainBaseMap);

const chainTokensMap: Record<string, CW20Token[] | undefined> = {};
for (const chain of chains) {
  const chainBase = chainBaseMap[chain];
  if (!chainBase) {
    console.log(`Chain base is not found for ${chain}`);
    continue;
  }

  const tokens: CW20Token[] = chainTokensMap[chain] || [];
  let files: string[];
  try {
    files = FS.readdirSync(Path.join(baseDir, chain, "tokens"))
      .filter((token) => {
        return token.endsWith(".json");
      })
      .filter((token) => {
        return FS.lstatSync(
          Path.join(baseDir, chain, "tokens", token)
        ).isFile();
      });
  } catch (e) {
    console.log(e);
    continue;
  }

  for (const file of files) {
    try {
      const buf = FS.readFileSync(
        Path.join(Path.join(__dirname, "..", "cosmos"), chain, "tokens", file)
      );
      const json = JSON.parse(buf.toString());
      const validated = CW20TokenScheme.validate(json);
      if (validated.error) {
        throw validated.error;
      }
      Bech32Address.validate(
        validated.value.contractAddress,
        chainBase.bech32PrefixAccAddr
      );
      tokens.push(validated.value);
    } catch (e) {
      console.log(e);
    }
  }

  if (tokens.length > 0) {
    chainTokensMap[chain] = tokens;
  }
}

const app = new Koa();
const router = new Router();

router.get("/tokens", (ctx) => {
  ctx.body = chainTokensMap;
});

router.get("/tokens/:chain", (ctx) => {
  const chain = ctx.params["chain"];
  if (!chain) {
    ctx.status = 400;
    ctx.body = "Invalid chain";
    return;
  }
  const tokens = chainTokensMap[chain];
  if (!tokens || tokens.length === 0) {
    ctx.status = 404;
    ctx.body = "No tokens found";
    return;
  }
  ctx.body = tokens;
});

const contractCache: Map<string, CW20Token | null> = new Map();
router.get("/tokens/:chain/:contract", (ctx) => {
  const chain = ctx.params["chain"];
  if (!chain) {
    ctx.status = 400;
    ctx.body = "Invalid chain";
    return;
  }
  const tokens = chainTokensMap[chain];
  if (!tokens || tokens.length === 0) {
    ctx.status = 404;
    ctx.body = "No tokens found";
    return;
  }
  const contract = ctx.params["contract"];
  const cached = contractCache.get(`${chain}:${contract}`);
  if (cached !== undefined) {
    if (cached === null) {
      ctx.status = 404;
      ctx.body = "No token found";
      return;
    }

    ctx.body = cached;
    return;
  }

  const token = tokens.find((token) => {
    return token.contractAddress === contract;
  });
  if (!token) {
    contractCache.set(`${chain}:${contract}`, null);
    ctx.status = 404;
    ctx.body = "No token found";
    return;
  } else {
    contractCache.set(`${chain}:${contract}`, token);
  }

  ctx.body = token;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(4000, () => {
  console.log("Server started on port 4000");
});
