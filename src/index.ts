import FS from "fs";
import Path from "path";
import { ChainBaseScheme, CW20TokenScheme } from "./scheme";
import { CW20Token } from "./types";
import { ChainIdHelper } from "@keplr-wallet/cosmos";
import Koa from "koa";
import Router from "koa-router";

const baseDir = Path.join(__dirname, "..", "cosmos");
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
  })
  .filter((chain) => {
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
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  });

const chainTokensMap: Record<string, CW20Token[] | undefined> = {};
for (const chain of chains) {
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

app.use(router.routes()).use(router.allowedMethods());

app.listen(4000, () => {
  console.log("Server started on port 4000");
});
