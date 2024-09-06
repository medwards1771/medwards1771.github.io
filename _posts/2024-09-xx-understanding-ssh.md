---
layout: post
title:  "Understanding SSH"
date:   2024-09-xx
---

## a little history

SSH (secure shell protocol) first appeared in 1995, designed by Finn Tatu Ylönen as a secure alternative to Telnet and various Unix shell protocols. SSH's security selling point was that it introduced encryption as part of remote server authentication.

The first time you encountered SSH may have been while trying to clone a remote GitHub repository to your local machine and seeing an error like:

```bash
git@github.com: Permission denied (publickey)
fatal: Could not read from remote repository
```

One way to resolve this error is to use SSH keys for authentication (granting yourself permission to the remote server `@github.com`). Notably, the docs that walk you through how to configure this -- [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) -- rely on tools like `ssh-keygen` and `ssh-agent`, both of which are developed by the [OpenBSD Project](https://www.openbsd.org/)'s [OpenSSH](https://www.openssh.com/) tool suite. OpenSSH has an immense reach; MacOS ships with OpenSSH out-of-the-box. But despite the potential to make millions (billions?) on OpenSSH through licensing fees, the OpenBSD Project maintains the tools as open-source software. I learned recently that each new OpenBSD software release includes a theme song and matching artwork. See [Release Songs](https://www.openbsd.org/lyrics.html). I'm partial to ["100001 1010101"](https://www.openbsd.org/lyrics.html#42).

## how it works

meow!
