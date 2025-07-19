# More detailed extraction of URLs and structure
import re

with open('paste.txt', 'r', encoding='utf-8') as file:
    html_content = file.read()

# Extract all image URLs
img_pattern = r'src="(https://i\.ibb\.co/[^"]*)"'
img_urls = re.findall(img_pattern, html_content)

print("All Image URLs found:")
for i, url in enumerate(img_urls, 1):
    print(f"{i}. {url}")

# Extract API configuration
api_pattern = r"const API_BASE = '([^']+)'"
api_matches = re.findall(api_pattern, html_content)
print(f"\nAPI Base URL: {api_matches[0] if api_matches else 'Not found'}")

# Extract WhatsApp number
whatsapp_pattern = r'const yourNumber = "(\d+)"'
whatsapp_matches = re.findall(whatsapp_pattern, html_content)
print(f"WhatsApp Number: {whatsapp_matches[0] if whatsapp_matches else 'Not found'}")

# Create a comprehensive data structure
website_data = {
    "payment_info": {
        "upi_id": "BHARATPE.8R0E0I8U2N09755@fbpe",
        "whatsapp_number": whatsapp_matches[0] if whatsapp_matches else "9362584929"
    },
    "images": {
        "logo": None,
        "qr_code": None,
        "verification_sample": None
    },
    "diamond_packages": []
}

# Identify specific images
for url in img_urls:
    if "Screenshot-2025-07-02-093146" in url:
        website_data["images"]["logo"] = url
        print(f"\nLogo identified: {url}")
    elif "Whats-App-Image-2025-07-02-at-09-13-44" in url:
        website_data["images"]["qr_code"] = url
        print(f"QR Code identified: {url}")
    elif "Whats-App-Image-2025-07-02-at-09-17-02" in url:
        website_data["images"]["verification_sample"] = url
        print(f"Verification sample identified: {url}")

# Store diamond packages from previous extraction
diamond_packages = [
    {"type": "double_bonus", "diamonds": "50+50", "price": 80},
    {"type": "double_bonus", "diamonds": "150+150", "price": 260},
    {"type": "double_bonus", "diamonds": "250+250", "price": 370},
    {"type": "double_bonus", "diamonds": "500+500", "price": 680},
    {"type": "regular", "diamonds": "11", "price": 25},
    {"type": "regular", "diamonds": "86", "price": 115},
    {"type": "regular", "diamonds": "172", "price": 230},
    {"type": "regular", "diamonds": "257", "price": 340},
    {"type": "regular", "diamonds": "344", "price": 460},
    {"type": "regular", "diamonds": "429", "price": 570},
    {"type": "regular", "diamonds": "514", "price": 680},
    {"type": "regular", "diamonds": "706", "price": 940},
    {"type": "regular", "diamonds": "1412", "price": 1880},
    {"type": "regular", "diamonds": "2195", "price": 2900},
    {"type": "weekly_pass", "diamonds": "Weekly Pass", "price": 130}
]

website_data["diamond_packages"] = diamond_packages

print(f"\nWebsite data structure created with {len(diamond_packages)} packages")

# Save data as JSON for later use
import json
with open('current_website_data.json', 'w') as f:
    json.dump(website_data, f, indent=2)
    
print("Website data saved to current_website_data.json")