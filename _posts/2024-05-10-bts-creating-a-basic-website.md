---
layout: post
title:  "How to build a website from scratch"
date:   2024-05-10
---

## Purpose

- Show readers how I created a website from scratch
- Document steps taken in order to cement learnings for myself + make them easily available for future reference

## Motivation and Context

The evolution of cloud services and software in the last 10+ years has made it fairly simple for the average internet user to spin up their own website. That's a good thing, IMO. But as someone who:

- works with a lot of abstractions to create web services
- is naturally curious
- is scared I forgot how the internet works

I wanted to see if I could create a basic website using as few out-of-the-box tools as possible / reasonable. And after several hours of creating and re-creating EC2 instances, configuring and re-configuring DNS records, experimenting with both the open source Apache (`httpd`) and `nginx` web servers, and paying GoDaddy $11.99, I am proud to say I made it happen! See steps below:

## How to Build a Website From Scratch

Check out my [Note on Tools](#note-on-tools) if you're interested in learning more about why I chose the tools I did.

### Step 1: Register a domain name

1. Sign up for / log in to GoDaddy account
1. Register your domain name.
    - I registered my domain for 1 year. I did not get any add-ons. The cost was $11.99 for the first year. Unless cancelled, the domain registration will auto-renew in a year at the cost of $47.99/yr.

### Step 1: Verify

Visit your domain in a browser or `curl` the domain name from your local machine. If you used GoDaddy, you should see a message like: "This domain has been registered with GoDaddy."

### Step 2: Create Infrastructure to Serve HTTP Web Traffic

Now you own a domain that no one else can develop on for x amount of time. But in order for you to be able to add content to that domain, you need to create some web infrastructure behind it.

*Note on security: The infra created below is wide open to internet traffic. You wouldn't want to replicate these security policies on a real web application. I plan to write a follow-up post explaining how to lock down these resources, but for now this setup facilitates debugging and doesn't expose anything of much hackable value.*

1. Sign up for / log in to AWS account
1. Create an EC2 instance with these specs
    - AMI (Amazon machine image): Use an ubuntu x86 image supported by open source nginx. I used the `ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20240411` image.
    - Instance type: `t2.micro` (or whatever is free tier eligible)
    - Key pair: Create a new RSA key pair + download to your local machine
    - Firewall (security groups): allow SSH traffic from anywhere (0.0.0.0/0), allow  HTTP traffic from anywhere (0.0.0.0/0)
    - Storage: 8 GB of General Purpose SSD storage (or whatever is free tier eligible)
    - Step-wise verify
        - `ssh -i "<path-to-rsa-key-pair>" ec2user@<instance-dns-name>`
            - expected result: successfully connect to instance
        - `curl  <public-IP-address-on-ec2-instance>`
            - expected result: `curl` responds with a timeout error (without a web server like `httpd` or `nginx` installed on the instance, it doesn't know how to respond to `curl` requests)
1. Create an application load balancer with these specs
    - Internet-facing with IPv4 IP address type
    - VPC (auto-assigned)
    - Availability zone(s) that overlap with the your EC2 instance availability zone(s)
    - You will be prompted to create listeners, target groups, health checks, and security groups while creating the load balancer:
        - A listener for protocol HTTP:80
        - A target group for HTTP traffic with your EC2 instance as its registered target
        - A health check on the HTTP target group
        - A security group that allows inbound HTTP traffic from anywhere (0.0.0.0/0)
        - A security group that allows outbound traffic on all ports
    - Step-wise verify
        - At this point, your HTTP health check will be failing since you don't have a web server on your instance. You can `curl` the LB (load balancer) DNS name. This should return the same timeout error you saw before. If you run `dig` on the load balancer's DNS name, you should see the same number of results in the response's answer section as the load balancer has availability zones.  My load balancer has 2 availability zones, so I see 2 results -- both A records.
1. Connect to the EC2 instance with `ssh` and install a web server
    - I used the steps at [Installing NGINX Software](https://docs.nginx.com/nginx/deployment-guides/amazon-web-services/ec2-instances-for-nginx/#installing-nginx-software) as a rough guide, but needed to make several modifications to the recommended commands to account for updates in Python + ansible:

    ```bash
    ssh -i "<path-to-rsa-key-pair>" ubuntu@<public-dns-on-ec2-instance>
        ubuntu@<internal-ip>:~$ sudo su
        ubuntu@<internal-ip>:~$ apt update
        ubuntu@<internal-ip>:~$ apt install pipx
        ubuntu@<internal-ip>:~$ pipx install ansible-core
        ubuntu@<internal-ip>:~$ pipx ensurepath
        <exit shell>

    ssh -i "<path-to-rsa-key-pair>" ubuntu@<public-dns-on-ec2-instance>
        ubuntu@<internal-ip>:~$ sudo su
        ubuntu@<internal-ip>:~$ ansible-galaxy install nginxinc.nginx
        ubuntu@<internal-ip>:~$ ansible-galaxy collection install community.general
        ubuntu@<internal-ip>:~$ vi playbook.yml
            (in vi): add content:
                ```
                ---
                - hosts: localhost
                become: true
                roles:
                    - role: nginxinc.nginx
                ```
            (exit vi)
        ubuntu@<internal-ip>:~$ ansible-playbook playbook.yml
        <exit shell>
    ```

### Step 2: Verify

Run `curl` on the IP address of your EC2 instance and on the DNS name of your load balancer. Both should return some boilerplate HTML from nginx that includes the text "Welcome to nginx!" Your HTTP health check should also now be healthy. This is huge! Your infrastructure is now able to respond successfully to HTTP requests send directly to your backend. Pat yourself on the back.

### Step 3: Configure DNS to Route Requests to Your New Infrastructure

The last step in getting your new domain to successfully respond to HTTP web requests is to map your DNS record to the cloud infrastructure you just created.

1. In AWS, create a new hosted zone with the same name as your domain. Do not include the `www`. You'll configure that in the next step since it's a subdomain.
    - Step-wise verify
        - You should see 2 DNS records automatically created as a result -- a NS (name server) record with 4 values, and a SOA (start of authority) record with 1 value.
2. To ensure `www` requests will be served by your domain, add an A record to your hosted zone for the `www` subdomain. The record name should be `www.<your-domain-name>`, and the value should be `<your-domain-name>`.
3. Back in GoDaddy, update the name servers on your domain, see [doc](https://www.godaddy.com/help/edit-my-domain-nameservers-664).
    - Replace the existing name servers with 2 of the 4 name server values on the NS record that was created when you made your Route53 hosted zone.
4. In AWS, create an A record that directs traffic sent to your domain to your load balancer.
    - You should be able to toggle the `alias` option and enter the DNS name of your load balancer. Better to add the DNS name than a bare IP address since the IP address may change.

### Step 3: Verify

Your domain should now successfully respond to HTTP requests! Wow wow wee wow. This is huge.

Send a `curl` request to your domain or open a browser and visit your domain. You should see the boilerplate response from `nginx`. If visiting from a browser, you'll also see a "not secure" warning somewhere near the URL bar since you haven't added SSL certs to your domain yet.

### Note on Tools

#### GoDaddy

There are many domain registrars out there. Search the web for "best domain registrars" and you'll see dozens of options. For this project, I chose GoDaddy because it's well-known and I wanted the extra complication (for learning's sake) of having separate providers for domain registration and domain hosting.

#### Amazon Web Services (AWS)

I chose AWS because it's the cloud provider I assume the majority of readers will be familiar with.

#### nginx

I chose `nginx` because I find its documentation easier to navigate than `httpd`'s, and because of the service's expressed commitment to the [open source community](https://www.nginx.com/blog/meetup-recap-nginxs-commitments-to-the-open-source-community/).
