---
layout: post
title:  "Working with nginx: from index.html to Flask app"
date:   2024-06-12
---

## Table of Contents

[Background and motivation](#background-and-motivation)<br>
[End goal](#end-goal)<br>
[Context on tooling](#context-on-tooling)<br>
[Reproduce locally: nginx web server grabs content from local file](#reproduce-locally-nginx-web-server-grabs-content-from-local-file)<br>
[Reproduce locally: nginx web server grabs content from Flask app](#reproduce-locally-nginx-web-server-grabs-content-from-flask-app)<br>
[Conclusion](#conclusion)<br>
[Note on tools](#note-on-tools)<br>

## Background and motivation

We often only ever encounter web servers like `nginx` in a remote setting. I wanted to write a tutorial based on working with `nginx` locally to help readers get more comfortable working with the service. Being able to tinker with tools this way helps make debugging fast and fun. IMO, it's also gratifying to get tools to work locally that are often reserved for staging and production environments.

## End goal

My goal is to give you a solid understanding of what's happening behind the scenes when a web server loads response data from a local file vs. what's happening when a web server loads response data from a web application.

## Context on tooling

- The instructions here are written for MacOS and VSCode. Adjust to your local setup as needed.
- I try to be mindful about the tools I choose to work with. For explanations of why I chose the tools I did, see [Note on Tools](#note-on-tools)

## Reproduce locally: nginx web server grabs content from local file

First things first: you need to download a copy of `nginx` to your local machine. Here's how I download `nginx` and use git to ensure the `nginx` configuration files are version-controlled.

```bash
» brew install nginx

# I like to add version control to the nginx directory so I can easily revert to the default 
# configuration if I make a breaking change.
» cd /usr/local/etc/nginx
» git init
» git add .
» git commit -m "Initial commit: homebrew nginx install"
```

Verify `nginx` is configured properly with `nginx -t`:

```bash
» nginx -t
nginx: the configuration file /usr/local/etc/nginx/nginx.conf syntax is ok
nginx: configuration file /usr/local/etc/nginx/nginx.conf test is successful
```

Huzzah! You've successfully downloaded `nginx`. Now let's take a closer look at `nginx`'s default server configuration. View `nginx`'s server config file by running `cat /usr/local/etc/nginx/nginx.conf`. Inside, you should see an un-commented server block that looks like:

```conf
server {
    listen 8080;
    server_name localhost;

    location / {
        root   html;
        index  index.html index.htm;
    }
}
```

Bingo bongo bango. This code tells `nginx` to return the content of the `/usr/local/var/www/index.html` file when processing requests to the server's homepage (`/`) at localhost:8080.

Let me explain how that works; it's not obvious. Nested within the location block, you'll find the line `root html;`. `root` is an `nginx` directive used to set a given path (here, `html`) as docroot. This begs the question: well where is the `html` directory? It's not in `/usr/local/etc/nginx`.

To figure out where the `html` directory lives, you need to see if `nginx` has any prefixes configured. Run `nginx -V` to view nginx's configure arguments. You'll see there that the value of the `--prefix` flag is `/usr/local/Cellar/nginx/<version-number>`. This tells you to look for the `html` directory at `/usr/local/Cellar/nginx/<version-number>/html`. It's there! Confusingly, though, that directory is symlinked to `../../../var/www`, or `/usr/local/var/www`. This means that `nginx`'s docroot is actually set to `usr/local/var/www`. If you look in that directory, you'll see a couple html files, including `index.html`.

If you look at the contents of `usr/local/var/www/index.html`, you'll a block of HTML, inside which is the header, "Welcome to nginx!"

Start `nginx` by running `brew services start nginx`. Visit localhost:8080 in a browser. You should see the "Welcome to nginx!" message. Woo!

You can change the content that `nginx` serves at localhost:8080/ by modifying the `index.html` file in `/usr/local/var/www/` directly, or by creating a new `.html` file in the same directory and changing the index directive within the server location block (in `/usr/local/etc/nginx/nginx.conf`) to point to your new file instead: `index   <new-file-name>.html`.

Congrats! If you've come this far, you have successfully replicated the first of our two local setups: how to get a web server to serve content coming from an `.html` file already loaded to its local filesystem.

## Reproduce locally: nginx web server grabs content from Flask app

By this point, you've got a copy of `nginx` running on your local machine and you know how to customize responses to requests made to localhost:8080. It's time to take things to the next level -- configure `nginx` to serve content produced by a Flask web application.

### Step 1: get a flask web app running locally

Let's put `nginx` aside for now and focus on the singular task of getting a Flask web app running on your local machine.

You can create a super simple Flask app by following Flask's [Quickstart doc](https://flask.palletsprojects.com/en/3.0.x/quickstart/#a-minimal-application). You should end up with a `hello.py` file like this:

```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, world!</p>"
```

Run this app locally with the command `flask --app hello run`. Your terminal output will look like:

```bash
* Serving Flask app 'hello'
* Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
* Running on http://127.0.0.1:5000
```

Visit `http://localhost:5000/` in a browser and verify you see the "Hello, world!" response.

This is a victory; you've used Flask to run a local server and respond to HTTP requests. Pause here to let it soak in.

### Step 2: get the flask web app to run locally using a production-ready server

Since we're developing locally, swapping out Flask's default WSGI[^1] server for a production-appropriate one is not strictly necessary. However, I still want to show you how to do it because it's fairly straightforward and it's a good learning opportunity.

Running `flask --app hello run` returns the message: "WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead." But how to find a production WSGI server?

Flask's [Deploying to Production](https://flask.palletsprojects.com/en/3.0.x/deploying/) doc gives you several self-hosted options. This tutorial uses `gunicorn`. All that's required to make this change is for you to install `gunicorn` and update the command you're using to run the Flask app. Make sure to install `gunicorn` and run `gunicorn` commands from your Flask app's virtual environment.

```bash
# I like to use the --reload flag so that gunicorn will restart workers alongside 
# any code changes. Note this flag is meant for development use only.
gunicorn --workers=4 --reload hello:app

# If you see an error in your terminal output about worker timeout, 
# "[CRITICAL] WORKER TIMEOUT", add a timeout flag to your gunicorn command:
gunicorn --workers=4 --reload --timeout=120 hello:app
```

Your terminal output will look like:

```bash
[<timestamp>] [<pid>] [INFO] Starting gunicorn 22.0.0
[<timestamp>] [<pid>] [INFO] Listening at: http://127.0.0.1:8000
[<timestamp>] [<pid>] [INFO] Using worker: sync
[<timestamp>] [<pid>] [INFO] Booting worker with pid: 
```

Visit `http://localhost:8000/` -- note the port has changed from 5000 to 8000 -- in a browser and verify you see the "Hello, world!" response.

By this point, you should have two different processes running locally: a production-ready WSGI server (`gunicorn`) serving Flask web app content, and a web server (`nginx`) serving `index.html` content. The final step to getting `nginx` to serve content from your Flask app is telling `nginx` how to act as a proxy.

### Step 3: configure nginx as a proxy

In order for `nginx` to respond with content originating from your Flask web app when you make requests to localhost:8080, `nginx` needs to be able to forward requests to Flask, process Flask's response data, then pass that response data on to the HTTP client at localhost:8080. It sounds like that could be a headache to configure, but `nginx` has a directive specifically designed to do this: `proxy_pass`! Read more about the command [here](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/#passing-a-request-to-a-proxied-server).

Remember in [this section](#reproduce-locally-nginx-web-server-grabs-content-from-local-file) when you told `nginx` to use whatever was in the `/usr/local/var/www/index.html` file as its response to homepage requests? Go back to that same section of code inside the `/usr/local/etc/nginx/nginx.conf` file and update the location block to instead proxy requests to where `gunicorn` is running: localhost:8000:

```conf
    location / {
        proxy_pass http://localhost:8000;
    }
```

This single line of code configures `nginx` to pass requests to the proxied server at localhost:8000 (`gunicorn` in our case), fetch the response, and send the response back to the HTTP client.

### Step 4: watch nginx return a response generated from your Flask web app

In the [nginx web server grabs content from local file section](#reproduce-locally-nginx-web-server-grabs-content-from-local-file), you started `nginx` as a background service, then visited localhost:8080 in a browser to see the response "Welcome to nginx!".

Go back to localhost:8080 in a browser and refresh the page. You should now see "Hello, world!", which means that you've successfully configured `nginx` to process and return responses from the Flask web app. Cowabunga!

## Conclusion

In this tutorial, we configured `nginx` to proxy requests between an HTTP client and a Flask web application, all through local development. While the `nginx` configuration and Flask app are much simpler than versions you'll encounter in workplace settings, having a local reproduction of production-like architecture gives you a sandbox for tinkering with `nginx` without the risk of production downtime.

## Note on tools

- I chose `nginx` because I find its documentation easier to navigate than `httpd`'s, and because of the service's expressed commitment to the [open source community](https://www.nginx.com/blog/meetup-recap-nginxs-commitments-to-the-open-source-community/).
- I chose to work with Python because I want to practice coding in my non-dominant language.
- I chose to work with Flask because it's a lightweight web framework I've used before.
- I chose AWS because it's the cloud provider I assume the majority of readers will be familiar with.

------------------
<br>

[^1]: WSGI is the calling convention for web servers like `nginx` to forward HTTP requests to Python web apps. The WSGI protocol is necessary because `nginx` does not know how to interpret Python on its own. Read more about WSGI [here](https://www.fullstackpython.com/wsgi-servers.html) and [here](https://en.wikipedia.org/wiki/Web_Server_Gateway_Interface).
