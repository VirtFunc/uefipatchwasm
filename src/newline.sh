#!/bin/bash

# Check if an input file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <input-file>"
    exit 1
fi

input_file="$1"
# Remove extension and append _newline.txt
base_name="${input_file%.*}"
output_file="${base_name}_newline.txt"

# Replace line breaks with \n and save to new file
sed ':a;N;$!ba;s/\n/\\n/g' "$input_file" > "$output_file"

echo "Processed file saved to $output_file"
