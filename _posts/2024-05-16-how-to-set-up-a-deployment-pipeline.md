---
layout: post
title:  "Behind the scenes of automated deployment"
date:   2024-05-16
---

## Purpose + motivation

- Challenge myself to set up an automated deployment pipeline from scratch
- Weigh the pros and cons of different deployment solutions given developer count
- Document the process to cement my own learnings and make instructions easily accessible in the future

## All developers are able to deploy to production

In the two scenarios I describe, developer count changes in order to demonstrate the viability of different deployment solutions. One thing that stays the same is that every developer is able to deploy to production, monitor the deploy process, and debug any failing step during deploy. Limiting the number of people allowed to deploy to production is one strategy for managing application security and reliability. In my experience, though, managing security and reliability through infrastructure design is more effective and, added bonus!, better for the culture.

## Stripped-to-the-bone deployment

To set some context for what is going on behind the scenes of automated deployments, I want to start by describing what deployment would look like for a simple website without automation or advanced tooling. Imagine, in this scenario, that all website code lives in an `index.html` file. Deployment consists of making changes to the `index.html` file on a web server. Without automation or advanced tooling, you could upload the version of `index.html` from your local machine to the web server using a command like:

```bash
# /usr/share/nginx/html/ is the default path for `nginx` to serve HTTP(S) requests

$ scp <path-to-local-index.html> <user>@<nginx-web-server-public-ip>:/usr/share/nginx/html/index.html
```

*Note: the web server running `nginx` is the one I set up in [this post](/2024/05/10/bts-creating-a-basic-website.html) about building a website from scratch*

### Pros and cons with this approach

#### Security

In order to `ssh` into the web server from your local machine, you need a copy of the private key that `ssh` uses to authenticate identities. If you are the sole developer for the application in question, this is a small vulnerability. As team size increases, however, granting all developers access to the production web server becomes a gaping security hole.

#### Reliability

As the sole developer, you don't have to worry about version control collisions, like another developer uploading an `index.html` with out-of-date code. But when you're  uploading the `index.html` from your local machine, there are no protective blockers to keep you from inadvertently deploying the wrong changes. Whatever is in your local copy of `index.html` at the time you run `scp` will be shipped, regardless of what git branch you're on or what changes have been `git commit`-ed or `git push`-ed.

#### Speed

Typing and executing a `scp` command from your local machine takes less than 5 seconds.

### Conclusion

A single developer is about all this solution is tenable for. With each new developer that joins and gains access to the web server, security is compromised. Also, making sure the right changes get deployed when developers deploy from their local machines becomes slow and frustrating pretty quickly.

### What Comes Next?

Imagining that all application code still lives in a single HTML file (definitely an imaginary world :smile:) but the team has now grown to 10 developers, a relatively fast and cost effective solution to the above security and reliability issues is to integrate with a SaaS deployment platform. Two essential features to look for are 1) ability to create a pipeline that deploys trunk branch changes from a shared code repository to a production web server and 2) platform-managed developer authentication. [Buildkite](https://buildkite.com/) has these features and a free tier plan, so I've chosen to work with their service. See [Note on Tools](#note-on-tools) for more about why I like working with Buildkite.

## Integrating with a SaaS Deployment Platform: Buildkite

To set up automated deployment with Buildkite, follow the steps below.

Note: I'm running MacOS and using VSCode as my text editor. If you're using different tools, you'll need to modify the below commands to fit your tool requirements.

### Create a pipeline in Buildkite

1. Sign up / log in to Buildkite account
1. From your [organization dashboard](https://buildkite.com/<organization-name>), click on the `New Pipeline` button
1. Add the Git Repository URL for your application and give your pipeline a name and description. Use the provided YAML steps, then select `Create Pipeline`.
1. In your code repository, create a file at `.buildkite/pipeline.yml` and add the content:

    ```yaml
    steps:
    - label: ":rocket: Deploy"
        command: bin/deploy.sh
        key: deploy
    ```

1. In your code repository, create a file at `bin/deploy.sh` and add the content:

    ```bash
    #!/bin/bash

    # `e`           Exit script immediately if any command returns a non-zero exit status
    # `u`           Exit script immediately if an undefined variable is used
    # `x`           Expand and print each command before executing
    # `o pipefail`  Ensure Bash pipelines (for example, cmd | othercmd) return a non-zero status if any of the commands fail

    set -euxo pipefail

    # Set SSH_AUTH_SOCK so that ssh can find the buildkite-agent bind address
    export SSH_AUTH_SOCK=/var/lib/buildkite-agent/.ssh/ssh-agent.sock

    echo "Deploy changes to production"
    scp <path-to-index.thml> ubuntu@<nginx-web-server-public-dns-name>:/usr/share/nginx/html/index.html
    ```

1. From the [pipeline dashboard](https://buildkite.com/<organization-name>/<pipeline-name>), start a new build by click on the `New Build` button at top right.
1. Watch as the `buildkite-agent pipeline upload .buildkite/pipeline.yml` step looks for an agent. This step will continue until it times out or you press cancel. And don't worry; IT SHOULD FAIL at this point. You haven't set up any agents to run your build.

### Create and configure buildkite agent

Because my nginx web server is running on an EC2 instance in AWS, I'm going to install the buildkite agent on an EC2 instance to simplify networking connections and cloud provider management.

#### Create a new EC2 Instance dedicated to buildkite-agent

1. In AWS, create a new EC2 instance with these specs:
    - AMI: `ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20240423` (or latest ubuntu image)
    - Instance type: `t2.micro` (or whatever is free tier eligible)
    - Key pair: Create a new RSA key pair + download to your local machine
    - Security groups: allow inbound SSH traffic from anywhere (0.0.0.0/0), allow outbound traffic to anywhere
    - Storage: 8 GB of General Purpose SSD storage (or whatever is free tier eligible)
1. Install and start buildkite-agent on the instance:
    - Follow Buildkite's [documentation](https://buildkite.com/docs/agent/v3/ubuntu) to install the `buildkite-agent` package on your new EC2 instance.
    - Don't forget to configure your agent token on the EC2 instance! You will need to update the `/etc/buildkite-agent/buildkite-agent.cfg` file.
    - Once installed, start the agent with `sudo systemctl enable buildkite-agent && sudo systemctl start buildkite-agent`
1. Verify buildkite.com can connect to the running agent: visit your agents dashboard and look for your agent in the "Overview" tab. If you click into the ip address of the agent, you should see "Agent State: Connected" and "OS: Ubuntu 24.04" (or whatever OS you chose for your AMI). Huzzah!

#### Give buildkite-agent access to nginx web server

In order to make changes in production, the buildkite-agent needs to be able to upload files to your nginx web server. I configured this connection by allowing the instance running buildkite-agent to send `ssh` requests to the instance running the nginx web server. To replicate:

1. Change ownership on the buildkite-agent instance's `.ssh` directory to a user and group authorized to make `ssh` connections to the instance:

    ```bash
    $ ssh ubuntu@<buildkite-agent-instance-public-dns-name> # connect to the instance running buildkite-agent. you don't need to pass the -i flag to ssh if you've added the instance's RSA private key to your local ssh agent, which you can do with `ssh-add`.

    $ sudo su # switch user to root, who has privileges to run `chown`

    $ chown ubuntu:ubuntu /var/lib/buildkite-agent/.ssh/ # change ownership of the buildkite-agent's .ssh directory to group ubuntu, user ubuntu. The ubuntu user is authorized to make `ssh` connections to the instance, which you'll need in order to upload the private key file in the next step

    $ exit # disconnect from instance
    ```

1. Upload the private key that allows `ssh` connections to the EC2 instance running the nginx web server onto the instance running buildkite-agent:

    ```bash
    $ scp ~/.ssh/<web-server-private-key-filename> ubuntu@<buildkite-agent-instance-public-dns-name>:/var/lib/buildkite-agent/.ssh/<web-server-private-key-filename>
    ```

1. Change ownership on the buildkite-agent user's .ssh directory back to buildkite-agent so you can add the private key you just uploaded to the ssh agent as the buildkite-agent user. The buildkite-agent user needs access to the key since builds will run from the buildkite-agent user.

    ```bash
    $ ssh ubuntu@<buildkite-agent-instance-public-dns-name>

    $ sudo su

    $ chown buildkite-agent:buildkite-agent /var/lib/buildkite-agent/.ssh/
    ```

1. As the buildkite-agent user, add the private key to the ssh agent. This step forces ssh to look for the private key automatically. I used this [Buildkite doc on ssh key configuration with ubuntu](https://buildkite.com/docs/agent/v3/ubuntu#ssh-key-configuration) as a guide:

    *NOTE: You should still be connected to the instance while running these commands. If not, reconnect with ssh.*

    ```bash
    $ sudo su buildkite-agent # switch to buildkite-agent user

    $ ssh-agent -a ~/.ssh/ssh-agent.sock # start an ssh-agent process

    $ export SSH_AUTH_SOCK=/var/lib/buildkite-agent/.ssh/ssh-agent.sock # set SSH_AUTH_SOCK environment variable so that ssh can find the bind address on the ssh-agent for the buildkite-agent user

    $ ssh-add ~/.ssh/<web-server-private-key-filename> # add your private key to the ssh authentication agent

    $ ssh ubuntu@<instance-running-web-server-public-dns-name> # When prompted with "Are you sure you want to continue connecting", enter `yes`. This step opens a connection to the nginx web server and allows adds the instance running buildkite-agent to connect without prompting in the future.

    $ exit
    ```

At this point, you can manually trigger a new build from your [pipeline dashboard](https://buildkite.com/<organization-name>/<pipeline-name>) by clicking on the `New Build` button. Whatever code is on the `main` branch of your repo should successfuly deploy. Take a second to pause and pat yourself on the back ! Big progress.

## Configure Pipeline to Automatically Deploy on Certain Git + GitHub Actions

The last step in setting up automatic deployment is to tell Buildkite which actions should trigger the pipeline. To do this:

1. Go to your pipeline's [GitHub integration page](https://buildkite.com/<organization-name>/<pipeline-name>/settings/repository).
1. Follow Buildkite's instructions for [GitHub Webhook Setup](https://buildkite.com/<organization-name>/pipeline-name/settings/setup/github) to configure Buildkite to run automatically on changes to the `main` branch.
1. Make some trivial edits to your `index.html` on the `main` branch, commit, and push to remote. Watch Buildkite run automatically and deploy your changes to production! Victory is yours!

### Pros and cons with this approach

#### Security

Now that the buildkite-agent is authorized to deploy, developers no longer need a copy of the web server's RSA private key. Developers can no longer inadvertently or advertently do things like remove SSL certs, delete un-version-controlled code, or stop nginx.

At the resource level, there are vulnerabilities I still need to address. The instance running the nginx web server, for example, is currently open to all inbound traffic over SSH and HTTP(S). SSH connection requires users to have access to the instance's private RSA key, but inbound HTTP(S) traffic is allowed from anywhere (0.0.0.0/0), which exposes the server to DDoS attacks.

#### Reliability

Developers are less likely to accidentally deploy the wrong changes since Buildkite deploys from a shared, remote trunk branch.

There are still no automated tests in the pipeline, so any changes merge to `main` will deploy without automated quality control.

#### Speed

Deploying is a little slower than before because developers have to push their changes to remote and wait on code review before their code deploys to production. The time it takes to get code in production from when it's deemed "ready to deploy" to when it's live on production is still super fast; clicking merge on a PR and waiting for Buildkite to auto-deploy will take less than 10 seconds. I'd also argue that the extra time spent on code review makes the changes that do get deployed to production more reliable, so developers gain back time lost to debugging and fixing breaking changes.

### Conclusion

I'd describe this approach as "workable but fragile." Securing networking on the two instances is a high priority, as are introducing automated tests to the pipeline for reliability's sake. There are also complexities in real-life applications I've deliberately ignored: connecting to a database, integrating with third parties like Datadog and business domain APIs, and building an app made up of countless files and folders. That said, the second design hopefully increases your understanding of what is going on behind the scenes of automatic deployment architecture.

## Note on Tools

### Buildkite

I respect the founders' commitment to slow growth and pursuit of profitability over multiple rounds of VC funding, see [startupdaily article](https://www.startupdaily.net/advice/buildkite-story-founders-200-million-investment/). As an SRE, I also appreciate their Hybrid CI/CD architecture, which you can read more about [here](https://buildkite.com/blog/managed-self-hosted-or-hybrid-ci-cd-understand-your-options). I like being able to configure the compute resources backing pipelines (more visiblity into cost; more control over scaling) and, on the other side, being able to delegate building a platform UI and managing user auth to a service.

### Amazon Web Services (AWS)

I chose AWS because it's the cloud provider I assume the majority of readers will be familiar with.
