---
layout: post
title:  "Who needs Docker anyway?"
date:   2024-06-xx
---

In [How to build a website from scratch](/_posts/2024-05-10-bts-creating-a-basic-website.md), I went through the steps for creating *the most basic website ever*: a static site that serves `nginx`'s out-of-the-box "Welcome to nginx!" `index.html` page:

![Welcome to nginx!](/assets/images/welcome-to-nginx.png)

It's unlikely Docker would have ever been conceived :baby-bottle: if every website stayed this simple.

Who needs containerization when xyzfillmeinnpleeazzzzz ?

Now it's time to give that website an upgrade -- take it from a single page static content site to a multi file multi folder multi server multi media web appl$c@ti0n !

Let's do that with flask :smile:

Why Docker?

- Docker creates images
- images are easier to work with than files?
- running an image means you have a single container that handles every dependency needed for that one "server" connection ("server" == web server, database server)

## Questions

- why did `scp bin/flaskr.service ubuntu@ec2-18-117-132-196.us-east-2.compute.amazonaws.com:flaskr.service` fail with error "scp: /flaskr.service: Permission denied" but I could ssh onto the server, then create a new file called `butt` ?
- why use `apt` instead of `mise` on the ubuntu instance? seems like i'd want to mirror my local environment

## What i learned (about writing)

- you don't have to write in the final order the post will be read
