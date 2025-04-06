import re

# Read the file
with open('sales.html', 'r') as file:
    content = file.read()

if matches:
    # Replace the duplicate content with the proper structure
    fixed_content = re.sub(pattern, r'\1', content, flags=re.DOTALL)

    # Write back to the file
    with open('sales.html', 'w') as file:
        file.write(fixed_content)
    print("Successfully fixed the sales.html file!")
else:
    print("Could not find the duplication pattern in the file.")
