# Debugging 5XX Server Errors

all my thoughts all my thoughts all my thoughts right here right now!

paint a rough picture of your architecture:
A record for server name points to what domain name?

meredith-deploy-playground.co -> $load-balancer-domain-name

IF browser response says something like "can't connect to server", OR
IF the curl response looks like:

Host was resolved
IPv6: (none)
IPv4: 3.140.241.180
Trying 3.140.241.180:80...
curl: (7) Failed to connect... Couldn't connect to server

THEN there's nothing behind the domain-name. It could be there is no load balancer, or that there is a load balancer but the domain is not set up to direct traffic to the load balancer.

Solution: point A record for domain at load balancer

IF browser response shows "502 bad gateway"
IF curl response looks like:

Host was resolved
IPv6: (none)
IPv4: 3.18.143.182, 13.59.33.154
Trying 3.18.143.182:80...
Connected to ... port 80
> GET / HTTP/1.1
> Host: meredith-deploy-playground.co
> User-Agent: curl/8.7.1
> Accept: */*
...
< HTTP/1.1 502 Bad Gateway
< Server: awselb/2.0

THEN the load balancer received an invalid response from where it sent the HTTP request. This means your EC2 instance doesn't yet know how to handle HTTP requests.

Solution: Install a web server on your instance
Verify your server is not set up to LISTEN to HTTP (port :80) requests:
-ssh onto server, then run `ss -tuln`
-look at the `Local Address:Port` column and see if anything is listening on port :80
If you don't see anything listening on port :80, you need to install a web server (apache, nginx)
