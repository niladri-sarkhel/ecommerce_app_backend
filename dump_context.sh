#!/usr/bin/env bash

OUTPUT_FILE="llm_codebase_context.txt"

# 1. Clear out any previous dump files
rm -f "$OUTPUT_FILE"

echo "=========================================================================" >> "$OUTPUT_FILE"
echo "PROJECT CONTEXT SUMMARY" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "=========================================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 2. Append the visual directory tree structure using standard 'find' commands
echo "## PROJECT TREE STRUCTURE" >> "$OUTPUT_FILE"
echo "\`\`\`text" >> "$OUTPUT_FILE"
if command -v eza &> /dev/null; then
    eza --tree --ignore-glob 'node_modules|.git' >> "$OUTPUT_FILE"
else
    find . -not -path '*/.*' -not -path './node_modules*' -not -path './architecture*' | sort | sed 's/[^background\/]*\//|--/g' >> "$OUTPUT_FILE"
fi
echo "\`\`\`" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "## SOURCE CODES AND FILES" >> "$OUTPUT_FILE"
echo "=========================================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 3. Find and loop through target source files
# This skips node_modules, git assets, binary architecture assets, and heavy raw .json / data structures
find . -type f \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -not -path '*/architecture/*' \
    -not -path '*/scripts/seed/data/*' \
    -not -path '*/scripts/*' \
    -not -path '*/src/routes/test-router.js' \
    -not -name "$OUTPUT_FILE" \
    -not -name "package-lock.json" \
    -not -name "dump-context.sh" | while read -r file; do

    # Determine the file extension for markdown formatting syntax highlighting
    ext="${file##*.}"
    if [ "$ext" = "js" ] || [ "$ext" = "json" ] || [ "$ext" = "yml" ] || [ "$ext" = "md" ]; then
        lang="$ext"
    else
        lang="text"
    fi

    echo "### FILE: $file" >> "$OUTPUT_FILE"
    echo "\`\`\`$lang" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

echo "Context extraction complete! File generated: $OUTPUT_FILE"
