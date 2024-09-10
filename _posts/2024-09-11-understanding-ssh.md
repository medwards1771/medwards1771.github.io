---
layout: post
title:  "Understanding SSH"
date:   2024-09-11
---

## Some SSH history

SSH (secure shell protocol) first appeared in 1995, designed by Finn Tatu Ylönen as a secure alternative to Telnet and various Unix shell protocols. SSH's selling point was that it introduced encryption as part of remote server authentication.

The first time you encountered SSH may have been while trying to clone a GitHub repository and seeing an error like:

```bash
git@github.com: Permission denied (publickey)
fatal: Could not read from remote repository
```

One way to resolve this error is to use SSH public-private key pairs. The command line tools you use to do that -- `ssh`, `ssh-keygen`, and `ssh-agent` -- are developed by the [OpenBSD Project](https://www.openbsd.org/) as part of the [OpenSSH](https://www.openssh.com/) tool suite. Almost every modern operating system (including MacOS and Windows) ships with OpenSSH. But in spite of the potential to make millions (billions?) on licensing fees, OpenBSD keeps OpenSSH open-source.

## How OpenSSH works

SSH itself is just a protocol. Software suites like OpenSSH, built to comply with the SSH protocol, contain the tools you actually interact with to make SSH connections.

A common use case for SSH is granting yourself access (authenticating) to a remote server. There are two major components to this configuration: the `ssh-agent` on your local machine needs to have loaded the private key and the `ssh-agent` on the remote server needs to have authorized the public key.

### How to create an SSH key pair

To begin, you need a public-private key pair, which you can create with `ssh-keygen`. I like to use ED25519 as my secure key algorithm. The `-t` flag with `ssh-keygen` allows you to specify the encryption algorithm type:

```bash
ssh-keygen -t ed25519 -f "/Users/<username>/.ssh/ubuntu-ec2-instance"
```

This will generate a new key pair as two separate files: `ubuntu-ec2-instance.pub` (public key) and `ubuntu-ec2-instance` (private key).

### How to activate the public key

In order for the OpenSSH authentication agent (`ssh-agent`) on the remote server to authorize your requests to connect via `ssh`, you need to supply the agent with a copy of your public key. To do this, connect to your remote server (if your remote server is an EC2 instance you can use the "EC2 Instance Connect" option, which uses TCP) and paste the public key value in `.ssh/authorized_keys`.

Tip: should you ever lose your public key, you can always extract the public key from the private key with `ssh-keygen -y -f <private-key-filename>`.

### How to activate the private key

In order for the `ssh-agent` on your local machine to know to use your new private key, you have to add the key identity to the agent. You could do this manually using `ssh-add`, but since `ssh-add` state is ephemeral and resets every time you restart your machine, I recommend automating key adds with `ssh_config` instead. Create a new host entry in the `~/.ssh/config` file and include the `AddKeysToAgent` option:

```yml
Host <remote-server-address>
  AddKeysToAgent yes
  IdentityFile ~/.ssh/<private-key-filename>
```

Next, make a connection request to the remote server:

```bash
ssh <user>@<remote-server-address>
```

This request prompts your local `ssh-agent` to add `<remote-server-address>` to its list of known hosts:

```bash
The authenticity of host '<remote-server-address>' can't be established.

Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Finally, responding "yes" adds the remote server address to your local `ssh-agent`'s list of known hosts and should connect you to the remote server. Once you exit and go back to a shell on your local machine, you can verify the remote server address is one of your local `ssh-agent`'s known hosts by looking at the content of `~/.ssh/known_hosts` or running `ssh-add -L`.
