import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, "normalized_phone_data.json");
const outputFile = path.join(__dirname, "slugs.json");

try {
  const phones = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  console.log("Is array:", Array.isArray(phones));

  if (!Array.isArray(phones)) {
    console.error("Expected the JSON root to be an array.");
    console.log(phones);
    process.exit(1);
  }

  const slugs = phones.map((phone) => phone.identity?.slug).filter(Boolean);

  fs.writeFileSync(outputFile, JSON.stringify(slugs, null, 2), "utf8");

  console.log(`Extracted ${slugs.length} slugs.`);
  console.log(`Saved to ${outputFile}`);
} catch (err) {
  console.error(err);
}
