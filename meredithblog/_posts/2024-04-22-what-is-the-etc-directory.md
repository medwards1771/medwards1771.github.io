---
layout: post
title:  "FIRSTPOST"
date:   2024-04-22 02:12:00 -0000
---

## Intro
Hi hi hello! First post of new blog. To overcome my "first post has to be great" anxiety, I'm shipping this good enough post on `etc` directories. 

## What is the `etc` directory?
Generally speaking, `etc` directories are home to configuration files. The [Filesystem Hierarchy Standard (FHS)](https://www.pathname.com/fhs/pub/fhs-2.3.html#ETCHOSTSPECIFICSYSTEMCONFIGURATION), a doc written for UNIX-like operating systems, declares:

    The /etc hierarchy contains configuration files. A "configuration file" is a local file used to control the operation of a program; it must be static and cannot be an executable binary.


## `etc` on Mac OS
On Mac OS, there are two `etc` directories (that I know about), both in "hidden" directories: one at the top-level `/` directory and the other nested in `/usr/local/`. You can confirm this by opening a terminal and entering the commands:

    ls /etc/
    ls /usr/local/etc/


### Top-level `/etc` directory
The top-level `/etc` directory contains configuration files used exclusively by your OS (operation system). Take the `/etc/ssh` directory, for example. If you attempt to make a change to the `/etc/ssh/ssh_config` file, you should see an error like:

    Failed to save 'ssh_config': Insufficient permissions. Select 'Retry as Sudo' to retry as superuser."

While you could use `sudo` to get past this error, the error is there to gently reinforce the file standard. Rather than editing `/etc/ssh/ssh_config` directly, you'll want to configure your ssh setup in the `.ssh/` directory at `Users/<your-username>/.ssh`.

### Nested `usr/local/etc` directory 
The second `/etc` directory, the one nested under `/usr/local`, contains configuration files used by 3rd party tools. For example, the `buildkite-agent` Homebrew installation puts a configuration file at `/usr/local/etc/buildkite-agent/buildkite-agent.cfg`. The `openssl@3` homebrew installation also uses the `usr/local/etc` directory. To add new certs, you place them inside `/usr/local/etc/openssl@3/certs`.