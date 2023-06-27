import FS from "fs";
import { CW20TokenScheme } from "../scheme";

(async () => {
  try {
    // get file name
    const args = process.argv.slice(2);

    if (args.length > 1) {
      throw new Error("Too many args");
    }

    const path = args[0];

    if (/cosmos\/.+\/tokens/.test(path)) {
      const buf = FS.readFileSync(path);
      const json = JSON.parse(buf.toString());
      const validated = CW20TokenScheme.validate(json);
      if (validated.error) {
        throw validated.error;
      }
    }
  } catch (error) {
    console.log(error?.message || error);

    process.exit(1);
  }
})();
