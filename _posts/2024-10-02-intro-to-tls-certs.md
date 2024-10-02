---
layout: post
title:  "An Intro to SSL (TLS) Certs"
date:   2024-10-02
---

## Brief Overview

- Though it's common to use the term "SSL" certificate, the SSL (Secure Sockets Layer) protocol has been deprecated since 2015. TLS (Transport Layer Security) is the current in-use cryptographic protocol for defining secure connections across computer networks.
- TLS certs are required to verify the legitimacy of a domain.
- TLS certs are validated through HTTPS requests.

## How to Get a TLS Certificate

There are several ways for obtaining a TLS Certificate:

- Get one from your cloud provider
  - Often this is the easiest and cheapest method, since you need to upload the cert to a server in your cloud infrastructure anyway.
- Generate a TLS certificate using an open source tool like `openssl` or `certbot`
  - If you want to have greater control of the cert -- full access, editing power -- this is likely your best option. It can also be fun to create a cert with one of these tools that you use for learning purposes only.
- Pay for a certificate
  - There are several business that sell TLS certificates. If you or your team aren't comfortable creating and managing your own certs, or if you don't have full access to your cloud production resources, this may be your best -- or only -- option.

Whichever cert provider you choose, opt for an auto-renewing cert. You'll save yourself time down the road and avoid any last minute scramble to replace an expired cert.

## How to Configure a TLS Certificate

- Figure out where HTTPS requests are received and where HTTPS encryption can securely terminate in your infrastructure.
- Upload the certificate to these servers; it's possible they're the same server.
  - Example: Your website's registered domain name has an A record that routes traffic to a load balancer. The load balancer and the web server(s) it routes traffic to are in the same VPC (virtual private cloud). The load balancer restricts inbound traffic to SSH requests and the web servers restrict inbound traffic to HTTP requests made on the VPC's CIDR network. In this case, you can safely terminate HTTPS at the load balancer. Since the load balancer also receives HTTPS requests, you will upload your TLS cert to the load balancer.

## How to Debug TLS / HTTPS Errors

To debug TLS / HTTPS errors, it's helpful to have an understanding of your application architecture. This knowledge will give you an idea of where you can review error logs and certificate-related files. I would want to know:

- Which server HTTPS requests hit first, who hosts this server (a CDN? GCP?), and what operating system the server runs on
- Who manages the TLS certificate (AWS? certbot? OpenSSL?)
- Whether there is a reverse proxy running, like `nginx` or `httpd`, and how it manages HTTPS requests
- Whether I can get temporary, read-only access to the server to inspect certificate-related files
  - And if not, whether there is any configuration code for the cert (like Terraform) that I can review

Certificate-related configuration files:

- File locations will depend on your server's operating system and distribution
  - Many operating systems use the `/etc/ssl/` directory, including MacOS and Ubuntu
- If your server has a reverse proxy tool like `nginx` or `httpd`, consult that service's documentation to determine the location of their configuration files and look there for code related to HTTPS:443 (protocol:port) requests.
- Search the filesystem for common cert-related files like `openssl.cnf` and common cert-related extensions like `.pem` and `.crt`.

There are also a couple command line tools that can help you.

1. `curl`
    1. You know her, you love her, `curl` is your gurl. Running `curl` with the verbose flag (`-v`) on a domain will tell you when the cert expires, which organization issued the cert, and what type of encryption algorithm the cert uses.
1. `openssl`
    1. `openssl` is robust. Running `openssl s_client -connect <your-domain-name>:443` gives you all the info you get from `curl -v`, plus the actual public (encrypted) TLS certificate . If you save the cert in a file, you can run `openssl x509 -text -noout -in <path-to-certificate-file>` to see the cert content in plain text.
