import socket
import urllib.request

print("=== Network Connectivity Test ===\n")

# Test 1: DNS resolution
try:
    ip = socket.gethostbyname("smtp.gmail.com")
    print(f"1. DNS Resolution: OK (smtp.gmail.com -> {ip})")
except Exception as e:
    print(f"1. DNS Resolution: FAILED ({e})")

# Test 2: HTTPS to Google (port 443)
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(10)
    result = s.connect_ex(("google.com", 443))
    s.close()
    print(f"2. HTTPS (port 443): {'OPEN' if result == 0 else 'BLOCKED'}")
except Exception as e:
    print(f"2. HTTPS (port 443): FAILED ({e})")

# Test 3: HTTP request
try:
    resp = urllib.request.urlopen("https://www.google.com", timeout=10)
    print(f"3. HTTP Request: OK (status {resp.status})")
except Exception as e:
    print(f"3. HTTP Request: FAILED ({e})")

# Test 4: SMTP ports
for port in [465, 587, 25]:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(10)
        result = s.connect_ex(("smtp.gmail.com", port))
        s.close()
        status = "OPEN" if result == 0 else f"BLOCKED (error {result})"
        print(f"4. SMTP port {port}: {status}")
    except Exception as e:
        print(f"4. SMTP port {port}: FAILED ({e})")

print("\n=== Summary ===")
print("If tests 1-3 pass but SMTP ports are blocked,")
print("your network/firewall is blocking SMTP traffic.")
print("Solution: Use Gmail API (HTTPS) instead of SMTP.")
