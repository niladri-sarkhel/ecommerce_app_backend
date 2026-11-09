// count.js
import fs from "fs";
import path from "path";

const checkArrayLength = () => {
  try {
    // Resolve the path to your normalized JSON file
    const filePath = path.resolve(
      "./scripts/seed/data/normalized_phone_data.json",
    );

    // Read and parse the file
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Ensure it is actually an array before checking length
    if (Array.isArray(data)) {
      console.log(`📊 Total documents inside the JSON array: ${data.length}`);
    } else {
      console.log(
        "⚠️ The file parsed successfully, but the root element is not an array!",
      );
    }
  } catch (error) {
    console.error("💥 Failed to read or parse the JSON file:", error.message);
  }
};

checkArrayLength();
