import socket

for port in [465, 587]:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(10)
    result = s.connect_ex(('smtp.gmail.com', port))
    if result == 0:
        print(f"Port {port}: OPEN")
    else:
        print(f"Port {port}: BLOCKED (error code {result})")
    s.close()
