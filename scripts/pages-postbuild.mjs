import { writeFileSync, existsSync } from "fs";
if (existsSync("out")) {
  writeFileSync("out/.nojekyll", "");
  console.log("wrote out/.nojekyll");
}
