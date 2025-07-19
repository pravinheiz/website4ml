# Read the HTML file content to extract key information
try:
    with open('paste.txt', 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    print("File read successfully")
    print(f"File length: {len(html_content)} characters")
    
    # Extract key information using string parsing
    import re
    
    # Extract UPI ID
    upi_pattern = r'BHARATPE\.8R0E0I8U2N09755@fbpe'
    upi_matches = re.findall(upi_pattern, html_content)
    print(f"UPI ID found: {upi_matches[0] if upi_matches else 'Not found'}")
    
    # Extract QR code URL
    qr_pattern = r'src="(https://i\.ibb\.co/[^"]*)" alt="Scan to Pay'
    qr_matches = re.findall(qr_pattern, html_content)
    print(f"QR Code URL: {qr_matches[0] if qr_matches else 'Not found'}")
    
    # Extract logo URL
    logo_pattern = r'src="(https://i\.ibb\.co/TxRTR7gK/[^"]*)" alt="P&K Store Logo"'
    logo_matches = re.findall(logo_pattern, html_content)
    print(f"Logo URL: {logo_matches[0] if logo_matches else 'Not found'}")
    
    # Extract diamond packages with prices
    diamond_packages = []
    
    # Regular bonus packages
    bonus_pattern = r'<div class="diamond-count bonus-diamond-count">([^<]+)</div>\s*<div class="price bonus-price">₹ (\d+)</div>'
    bonus_matches = re.findall(bonus_pattern, html_content)
    print(f"\nDouble Bonus Packages:")
    for diamonds, price in bonus_matches:
        print(f"  {diamonds.strip()} - ₹{price}")
        diamond_packages.append({"type": "double_bonus", "diamonds": diamonds.strip(), "price": int(price)})
    
    # Regular diamond packages
    regular_pattern = r'<div class="diamond-count">(\d+)</div>\s*<div class="price">₹ (\d+)</div>'
    regular_matches = re.findall(regular_pattern, html_content)
    print(f"\nRegular Diamond Packages:")
    for diamonds, price in regular_matches:
        print(f"  {diamonds} Diamonds - ₹{price}")
        diamond_packages.append({"type": "regular", "diamonds": f"{diamonds} Diamonds", "price": int(price)})
    
    # Weekly pass
    weekly_pattern = r'Weekly Pass.*?₹ (\d+)'
    weekly_matches = re.findall(weekly_pattern, html_content)
    if weekly_matches:
        print(f"\nWeekly Pass: ₹{weekly_matches[0]} each (Max 10 per order)")
        diamond_packages.append({"type": "weekly_pass", "diamonds": "Weekly Pass", "price": int(weekly_matches[0])})
    
    print(f"\nTotal packages found: {len(diamond_packages)}")
    
except Exception as e:
    print(f"Error reading file: {e}")