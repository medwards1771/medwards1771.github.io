---
layout: post
title:  "Create a Kubernetes cluster from scratch"
date:   2025-02-14
---

## Purpose

Demonstrate how to create a single node Kubernetes cluster from scratch

## Installing Kubernetes

### Step 1: Install K8s Prerequisites

Document reference: [Before you begin](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#before-you-begin)

Before you start downloading Kubernetes packages, you need to have a couple things already in place:

- Admin access to a machine running a compatible Linux host with at least 2 vCPUs of processing power and 2 GiB of RAM
  - Having at least 2 vCPUs guarantees your machine is multi-threaded and is able to handle the load of running multiple K8s components simultaneously.
  - Having at least 2 GiB of RAM (memory) ensures that after installing Kubernetes your machine still has space left to install additional apps.
- A container runtime
  - Kubernetes doesn't ship with its own container runtime. Instead, it ships with the Container Runtime Interface (CRI). The CRI provides a common API for Kubernetes to interact with runtimes and enables K8s to manage containers without relying on a specific runtime implementation (like Docker).
  - I use `containerd` as my runtime because it [plays nicely with Docker](https://www.docker.com/blog/containerd-vs-docker/)

Check out these two files to help you install K8s prerequisites:

- [main.tf](https://github.com/medwards1771/meredith-deploy-playground/blob/main/infra/main.tf#L1-L27) -- a Terraform representation of an AWS server instance able to handle K8s load
- [install_docker.sh](https://github.com/medwards1771/meredith-deploy-playground/blob/main/bin/local/system-dependencies/install_docker.sh)

### Step 2: Install K8s apt packages

Document reference: [Installing kubeadm, kubelet and kubectl](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl)

This part is relatively straightforward: you need to install the three core packages that make up Kubernetes: `kubeadm`, `kubelet`, and `kubectl`. Per the K8s docs:

- `kubeadm` is the command you use to create a new cluster
- `kubelet` is the component responsible for starting pods and containers
- `kubectl` (my favorite!) is the command line tool you use to talk to your cluster

Check out this script to help you install kube packages:

- [install_kube_packages.sh](https://github.com/medwards1771/meredith-deploy-playground/blob/main/bin/local/kubernetes-and-friends/install_kube_packages.sh)

### Step 3: Prepare containerd, kubelet, and cluster for cluster initialization

#### Configure containerd cgroup driver

Document reference: [Configuring the containerd cgroup driver](https://kubernetes.io/docs/setup/production-environment/container-runtimes/#containerd-systemd)

Remember how we had to install a container runtime? Well, before you can initialize a new cluster in Kubernetes you have to make sure that the container runtime's cgroup (control group) driver matches the kubelet's cgroup driver. This is because cgroup drivers determine how `kubelet` and `containerd` manage resources. In order to avoid inconsistencies or issues with resource management, the two need to match. Kubernetes recommends using `systemd` as the cgroup driver when `systemd` has already been chosen as the init system for a Linux distribution (which is true for ubuntu, the distro we're running).

To change `containerd`'s cgroup driver to `systemd`, you need to set `SystemdCgroup = true` inside the `[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]` block.

Check out this script to help you set `systemd` as containerd's cgroup driver:

- [configure_containerd_cgroup.sh](https://github.com/medwards1771/meredith-deploy-playground/blob/main/bin/local/kubernetes-and-friends/configure_containerd_cgroup.sh)

#### Configure kubelet cgroup driver

Document reference: [Configuring the kubelet cgroup driver](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/configure-cgroup-driver/#configuring-the-kubelet-cgroup-driver)

The kubelet's default cgroup driver is `cgroupfs`, so you'll need to change that to use `systemd` as well. You need to do this when initializing your cluster since modifying kubelet settings must happen at initialization. I like using a config file then passing that file to `kubeadm init` to accomplish this:

```yaml
# kubeadm-config.yaml

kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
cgroupDriver: systemd
```

#### Tell kubelet to tolerate swap

Document reference: [Swap configuration](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#swap-configuration)

Because the kubelet will fail to start if swamp memory is detected on a node, you need to tell the kubelet to tolerate swap. To do this, add `failSwapOn: false` to your kubeadm config file. If you're interested in experimenting with swap, you can enable it only for pods with a Burstable QoS (Qualify of Service) classification, i.e. BestEffort or Guaranteed QoS, by setting `swapBehavior` to `LimitedSwap`:

```yaml
# kubeadm-config.yaml

kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
cgroupDriver: systemd
failSwapOn: false
memorySwap:
  swapBehavior: LimitedSwap
```

#### Assign pod network CIDR

Document reference:

- [Installing a Pod network add-on](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/#pod-network)
- [Quickstart for calico on K8s](https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart)

Lastly, before initializing the control plane, you'll need to assign a specific pod network CIDR to the cluster. Later you'll install [calico](https://docs.tigera.io/calico/latest/about/) as a pod network add-on to ensure your pods can talk to each other. Calico uses `192.168.0.0/16` as its pod network CIDR.

This configuration happens in the `kubeadm-config.yaml` file, which with the new networking.podSubnet code will now look like:

```yaml
# kubeadm-config.yaml

kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
cgroupDriver: systemd
failSwapOn: false
memorySwap:
  swapBehavior: LimitedSwap
---
kind: ClusterConfiguration
apiVersion: kubeadm.k8s.io/v1beta4
networking:
  podSubnet: "192.168.0.0/16"
kubernetesVersion: <latest-version>
```

### Step 6: Initialize control plane

Document reference: [Initializing your control-plane node](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/#initializing-your-control-plane-node)

To initialize your control plane, run `sudo kubeadm init --config kubeadm-config.yaml`. Notice that you're passing the `kubeadm-config.yaml` file to `kubeadm` on initialization. Without that, your kubelet and cluster won't function properly.

The `kubeadm init` command will log a lot to STDOUT. Make sure you grab the code you need to run in order to grant your OS user admin access to cluster resources. That code will look like:

```sh
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Check out this script to help you initialize your control plane: [initialize_control_plane.sh](https://github.com/medwards1771/meredith-deploy-playground/blob/main/bin/local/kubernetes-and-friends/initialize_control_plane.sh)

### Step 7: Deploy calico as your pod network

Documentation reference: [Install calico](https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart#install-calico)

By this point, your control plane is up and running. The control plane runs components like etcd (the cluster database) and the API Server (what `kubectl` talks to).

The last remaining step is deploying a pod network add-on. Without this plugin, your pods will not be able to talk to each other. I recommend using `calico` because it has an open source version and its documentation is clear and easy to follow.

The "[Install Calico](https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart#install-calico)" section of Calico's quickstart guide walks you through the steps for installation. You can also check out this script for help: [install_pod_network_plugin.sh](https://github.com/medwards1771/meredith-deploy-playground/blob/main/bin/local/kubernetes-and-friends/install_pod_network_plugin.sh)

### Step 8: Admire what you've built

You have now successfully created a single-node Kubernetes cluster -- no small feat. Take time to bask in your victory! Bootstrapping a K8s cluster is not easy.

## A look ahead

My next post will show you how to deploy a web application to your new cluster. You'll learn about [NodePort services](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport) and how to set up networking between a Docker service running outside K8s and pods running inside the K8s network.
