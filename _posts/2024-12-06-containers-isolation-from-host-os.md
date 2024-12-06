---
layout: post
title:  "Containerization key concepts: isolation from host OS"
date:   2024-12-06
---

## Purpose

In this post I'll show you a couple differences in running a containerized vs non-containerized web application, then use what is revealed in those comparisons to explain a fundamental concept of containerization: isolation from the host OS.

## Context

To illustrate what I'm talking about, I use the example of a Flask web application run with `gunicorn` in production.

## Configuring dependencies

### Without images or containers

Without the use of images or containers, I think of dependencies as either "system-level" or "app-level." In the case of a Flask app, binaries like `python` become system-level dependencies -- executables installed at the system level and run by system users like `root` or `ubuntu`. App-level dependencies are things like `werkzeug` or `JMESPath` -- pip-installed Python libraries run by your Flask app.

There are several ways to install system- and app-level dependencies on a production server. My recommendation is to have dependency installs and updates scripted as steps on your CI pipeline since the script acts as documentation and running anything regularly on your pipeline protects against it becoming outdated.

Without images or containers, though, you'll need to install `python` on the server's filesystem and add it as an executable on the system's $PATH  because your system needs `pip` in order to install app-level requirements. You can observe the impact of this by connecting to your server and successfully running `python` and `pip` commands.

### With images and containers

With images, rather than installing `python` directly on your server, you install a container development tool (eg Docker) on your server, then install dependencies onto an isolated image. Let me explain:

Docker acts as an intermediary between your server's operating system and the executable running your web application. When writing a Dockerfile (the template for your image), you specify which app-level dependencies you want installed on top of base images that have "system-level" dependencies already built in. Look at this example Dockerfile:

```Dockerfile
FROM python:3.12.4-alpine3.20

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./flaskr flaskr

WORKDIR /flaskr
ENTRYPOINT ["gunicorn", "--workers", "3", "--timeout", "120", "--bind", "0.0.0.0:8000", "hello:app"]
```

This uses an official Python-alpine image as its base image, then installs app requirements on top of that.

Notice that unlike before, connecting to your server and running `python` or `pip` from your server's terminal now returns an error. You have to attach to the running container's terminal with `docker exec -it <container-name> sh` to get access to these executables. **This is a great straightforward look into how Docker isolates dependencies from the host server's OS.**

## Keeping the app up and running

### Without container management

Without a container management tool, you'll need to configure your own system-level process using a tool like [systemd](https://systemd.io/).

You tell `systemd` how and when to run your web app by adding a new `.service` file to the `/etc/systemd/system/` directory. Here's an example `.service` file for a Flask web app:

```service
[Unit]
Description=Gunicorn instance to serve flaskr
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/projects/flaskr
Environment="PATH=/home/ubuntu/projects/.venv/bin"
ExecStart=/home/ubuntu/projects/.venv/bin/gunicorn --workers 3 --bind unix:flaskr.sock -m 007 --timeout 120 --reload hello:app

[Install]
WantedBy=multi-user.target
```

### With container management (and Docker, specifically)

Before, I said that "Docker acts as an intermediary between your server's operating system and the executable running your web application." What that looks like practically speaking is that Docker operates between `systemd` (server's OS) and `gunicorn` (web server executable). Docker uses `systemd` under the hood; you can verify this by looking inside the `/etc/systemd/system/` directory for the `docker.service` file or running `systemctl list-units --type=service` and searching for "docker."

Still, Docker grants you process-level isolation in the sense that the container running the Flask app is only concerned with running the Flask app. From your host OS, you can run `ps aux` to view system processes. Filtering by `gunicorn` shows you the host OS is running `gunicorn` processes, yes, but it's also running dozens of other processes from `/sbin/init` to `/opt/venv/bin/python3` to `sshd: ubuntu@pts/0`. Running `ps aux` on your Docker container returns only process lines for `/opt/venv/bin/python3` and `sh` (because you attached to the container with `sh`). **This is great straightforward look into how Docker isolates processes from the host OS.**
