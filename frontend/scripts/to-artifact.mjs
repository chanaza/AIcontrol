// Turns the single-file build into a page fragment: the artifact host supplies <html>/<head>/<body>.
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist-artifact/index.html", "utf8");
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join("\n");
const title = pick(/<title>[\s\S]*?<\/title>/g);
const links = pick(/<link[^>]+fonts\.googleapis[^>]*>/g);
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g).replace(/type="module" crossorigin/g, 'type="module"');
const fragment = `${title}\n${links}\n${styles}\n<div id="root" dir="rtl" lang="he"></div>\n${scripts}\n`;
writeFileSync("dist-artifact/ai-control-plane.html", fragment);
console.log(`artifact fragment: ${(fragment.length / 1024).toFixed(0)} KB`);
