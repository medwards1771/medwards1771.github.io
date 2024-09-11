---
layout: post
title:  "Understanding SSH"
date:   2024-09-11
---

## Some history

SSH (secure shell protocol) first appeared in 1995, designed by Finn Tatu Ylönen as a secure alternative to Telnet and various Unix shell protocols. SSH's selling point was that it introduced encryption as part of remote server authentication.

The most profilic implementation of SSH is [OpenSSH](https://www.openssh.com/). OpenSSH is a derivative of Tatu Ylönen's original ssh 1.2.12 release. The OpenSSH suite of tools includes command line utilities like `ssh`, `ssh-keygen`, and `ssh-agent`. The [OpenBSD Project](https://www.openbsd.org/) builds and maintains OpenSSH as open-source software, despite its potential to make millions (or billions) through licensing fees.

## Some context

SSH itself is just a protocol. Software suites like OpenSSH, built to comply with the protocol, contain the binaries you actually run to make SSH connections.

A common use case for SSH is authenticating to a remote server using private-public key pairs. In order for this to work, the `ssh-agent` on your local machine needs to have loaded an encrypted, private key and the `ssh-agent` on the remote server needs to have authorized its matching public key.

### How to create a key pair

You can create a key pair with `ssh-keygen`. You'll need to specify a key alogorithm type with the `-t` flag and a filepath with the `-f` flag:

```bash
ssh-keygen -t ed25519 -f "/Users/<username>/.ssh/ubuntu-ec2-instance"
```

This generates a new key pair as two separate files: `ubuntu-ec2-instance.pub` (public key) and `ubuntu-ec2-instance` (private key).

### How to activate the public key

In order for the OpenSSH authentication agent (`ssh-agent`) on the remote server to authorize your `ssh` connection requests, you need to supply the agent on the remote server with a copy of your public key. To do this, connect to your remote server (if your remote server is an EC2 instance you can use the "EC2 Instance Connect" option, which uses TCP) and paste the public key value in `.ssh/authorized_keys`.

Tip: should you ever lose your public key, you can always extract the public key from the private key with `ssh-keygen -y -f <private-key-filename>`.

### How to activate the private key

In order for the `ssh-agent` on your local machine to know about your private key, you have to add the key to the agent. You could do this manually using `ssh-add`, but since `ssh-add` state is ephemeral and resets every time you restart your machine, I recommend automating key addition with `ssh_config` instead.

Create a new host entry in the `~/.ssh/config` file and include the `AddKeysToAgent` option:

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

Finally, responding "yes" adds the remote server address to your local `ssh-agent`'s list of known hosts and should connect you to the remote server. Once you exit the remote server and are back on your local machine, you can verify the remote server is one of your local `ssh-agent`'s known hosts by looking at the content of `~/.ssh/known_hosts` or running `ssh-add -L`.
