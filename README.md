# Camel OpenShift Console Plugin

This project provides a [console plugin](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk) for [Camel](https://camel.apache.org).
The project is created using [openshift console plugin template](https://github.com/openshift/console-plugin-template)

# Local Development

For development you can login to an existing [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) and run the console with the plugin included locally.
**Note**: Works well with [OpenShift Sandbox](https://developers.redhat.com/developer-sandbox).

In one terminal window, run:

```sh
cd plugin
yarn install
yarn run start
```

In another terminal window, run:

After running `oc login` (requires [oc](https://console.redhat.com/openshift/downloads) and an [OpenShift cluster](https://console.redhat.com/openshift/create))

```sh
cd plugin
yarn run start-console
```
(requires [podman 3.2.0+](https://podman.io) or [Docker](https://www.docker.com))


This will run the OpenShift console in a container connected to the cluster
you've logged into. The plugin HTTP server runs on port 9001 with CORS enabled.
Navigate to <http://localhost:9000/example> to see the running plugin.

# Deployment to OpenShift

To deploy the console plugin to an actual [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) cluster the following are needed:

- [oc](https://console.redhat.com/openshift/downloads)
- [helm](https://helm.sh)

### Building the images locally

```sh
podman build -t quay.io/cmiranda/camel-openshift-console-plugin:latest .
podman push quay.io/cmiranda/camel-openshift-console-plugin:latest
```

**Note**: The image `quay.io/cmiranda/camel-openshift-console-plguin:latest` is published so it can be pulled instead.

### Deploying the plugin using Helm

```sh
oc new-project plugin-camel-openshift-console-plugin
helm upgrade -i camel-openshift-console-plugin charts/openshift-console-plugin --namespace plugin-camel-openshift-console-plugin --set plugin.image=quay.io/cmiranda/camel-openshift-console-plugin:latest
```

# The Camel Tab

In the developer perpective the Camel section is now shown:
[![The Camel Plugin Home](screenshots/home.png)](screenshots/home.png)


# Development notes

The frontend is able to retrieve information from the console using the following APIs:

## Kubernetes API /api/kubernetes
**Examples**:
  - /api/kubernetes/apis/apps/v1/namespaces/<namespace>/deployments
  - /api/kubernetes/apis/apps.openshift.io/v1/namespaces/<namespace>/deploymentconfigs

## Prometheus API /api/prometheus

**Examples**:
- /api/prometheus/api/v1/query_range
