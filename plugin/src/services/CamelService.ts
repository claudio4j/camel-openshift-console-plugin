import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';
import { ConfigMapKind, CronJobKind, DeploymentConfigKind, DeploymentKind, JobKind, PersistentVolumeClaimKind, PodKind, SecretKind } from '../k8s-types';
import { Application, cronjobToApplication as cronJobToApplication, deploymentConfigToApplication, deploymentToApplication } from '../types';
import { sprintf } from 'sprintf-js';
import { camelApplicationStore } from '../state';
import { METADATA_LABEL_SELECTOR_CAMEL_APP } from '../const';

const PROMETHEUS_API_QUERY_PATH = '/api/prometheus/api/v1/query';
const PROMETHEUS_API_QUERYRANGE_PATH = '/api/prometheus/api/v1/query_range';

export async function fetchDeployments(ns: string): Promise<Application[]> {
    let deploymentsUri = ns ? '/api/kubernetes/apis/apps/v1/namespaces/' + ns + '/deployments' : '/api/kubernetes/apis/apps/v1/deployments';
    deploymentsUri += '?labelSelector=' + METADATA_LABEL_SELECTOR_CAMEL_APP
    console.log(">> fetchDeploymentSSS url: " + deploymentsUri);
    return consoleFetchJSON(deploymentsUri).then(res => {
        return res.items
            .map((d: DeploymentKind) => deploymentToApplication(d));
    });
}

export async function fetchCronJobs(ns: string): Promise<Application[]> {
    let deploymentsUri = ns ? '/api/kubernetes/apis/batch/v1/namespaces/' + ns + '/cronjobs' : '/api/kubernetes/apis/batch/v1/cronjobs';
    deploymentsUri += '?labelSelector=' + METADATA_LABEL_SELECTOR_CAMEL_APP
    console.log(">> fetchCronJobSSS url: " + deploymentsUri);
    return consoleFetchJSON(deploymentsUri).then(res => {
        return res.items
            .map((c: CronJobKind) => cronJobToApplication(c));
    });
}

async function fetchDeployment(ns: string, name: string): Promise<Application> {
    const url = '/api/kubernetes/apis/apps/v1/namespaces/' + ns + '/deployments/' + name
    console.log(">> fetchDeployment url: " + url);
    return consoleFetchJSON(url).then(res => {
        return deploymentToApplication(res);
    }).catch(_ => {
        return null;
    });
}

export async function fetchDeploymentConfigs(ns: string): Promise<Application[]> {
    let deploymentConfigUri = ns ? '/api/kubernetes/apis/apps.openshift.io/v1/namespaces/' + ns + '/deploymentconfigs' : '/api/kubernetes/apis/apps.openshift.io/v1/deploymentconfigs';
    deploymentConfigUri += '?labelSelector=' + METADATA_LABEL_SELECTOR_CAMEL_APP
    console.log(">> fetchDeploymentConfigSSS url: " + deploymentConfigUri);
    return consoleFetchJSON(deploymentConfigUri).then(res => {
        return res.items
            .map((d: DeploymentConfigKind) => deploymentConfigToApplication(d));
    }).catch(_ => {
        return null;
    });
}

async function fetchDeploymentConfig(ns: string, name: string): Promise<Application> {
    const url = '/api/kubernetes/apis/apps.openshift.io/v1/namespaces/' + ns + '/deploymentconfigs/' + name;
    console.log(">> fetchDeploymentConfig url: " + url);
    return consoleFetchJSON(url).then(res => {
        return deploymentConfigToApplication(res);
    });
}

async function fetchCronJob(ns: string, name: string): Promise<Application> {
    return consoleFetchJSON('/api/kubernetes/apis/batch/v1/namespaces/' + ns + '/cronjobs/' + name).then(res => {
        return cronJobToApplication(res);
    });
}

export async function fetchSecret(ns: string, name: string): Promise<SecretKind> {
    return consoleFetchJSON('/api/kubernetes/api/v1/namespaces/' + ns + '/secrets/' + name).then(res => {
        return res.data;
    }).catch(_ => {
        return null;
    });
}

export async function fetchConfigMap(ns: string, name: string): Promise<ConfigMapKind> {
    return consoleFetchJSON('/api/kubernetes/api/v1/namespaces/' + ns + '/configmaps/' + name).then(res => {
        return res.data;
    }).catch(_ => {
        return null;
    });
}

export async function fetchPvc(ns: string, name: string): Promise<PersistentVolumeClaimKind> {
    return consoleFetchJSON('/api/kubernetes/api/v1/namespaces/' + ns + '/persistentvolumeclaims/' + name).then(res => {
        return res.data;
    }).catch(_ => {
        return null;
    });
}

export async function fetchJobs(ns: string): Promise<JobKind[]> {
    return consoleFetchJSON('/api/kubernetes/apis/batch/v1/namespaces/' + ns + '/jobs/').then(res => {
        return res.items;
    }).catch(_ => {
        return null;
    });
}

export async function fetchJob(ns: string, name: string): Promise<JobKind> {
    return consoleFetchJSON('/api/kubernetes/apis/batch/v1/namespaces/' + ns + '/jobs/' + name).then(res => {
        return res.data;
    }).catch(_ => {
        return null;
    });
}

export async function populateAdddionalInfo(app: Application): Promise<Application> {
    return populateCpu(app).then(populateCpuMetrics).then(populateMem).then(populateMemMetrics).then(populateCamelExchangesTotal).then(populateCamelRouteExchanges);
}

async function populateCpu(app: Application): Promise<Application> {
    const ns = 'namespace="' + app.metadata.namespace + '"';
    console.log('>> populateCpu ns: ' + ns);
    const query = 'query=sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{' + ns + ',container="' + app.metadata.name + '"})';
    const queryUrl = PROMETHEUS_API_QUERY_PATH + '?' + query + '&' + ns;
    console.log(">> populateCpu url: " + queryUrl);
    return consoleFetchJSON(queryUrl).then((res) => {
        let newApp: Application = { ...app };
        if (res && res.data && res.data && res.data.result && res.data.result.length > 0 && res.data.result[0].value && res.data.result[0].value.length > 1) {
            newApp.cpu = sprintf('%.2f', res.data.result[0].value[1]);
        }
        return newApp;
    });
}

async function populateCpuMetrics(app: Application): Promise<Application> {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const ns = 'namespace="' + app.metadata.namespace + '"';
    const query = 'query=sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{' + ns + ',container="' + app.metadata.name + '"})';
    const timeRange = `&start=${currentTimeInSeconds - 3600}&end=${currentTimeInSeconds}&step=60`;
    const queryUrl = PROMETHEUS_API_QUERYRANGE_PATH + '?' + query + '&' + ns + timeRange;

    return consoleFetchJSON(queryUrl).then((res) => {
        let newApp: Application = { ...app };

        if (res && res.data && res.data.result && res.data.result.length > 0) {
            const sortedValues = res.data.result[0].values.sort((a, b) => a[0] - b[0]); // Sort by timestamp
            newApp.metrics = newApp.metrics || {};
            newApp.metrics.cpu = sortedValues.map((value, index) => ({
                name: newApp.metadata.name,
                x: index + 1,  // Map the index to values from 1 to 60
                y: sprintf('%.2f', value[1])
            }));
        }
        return newApp;
    }).catch(error => {
        console.error('Error fetching CPU metrics:', error);
        return app; // Return the original app object in case of error
    });
}

async function populateMem(app: Application): Promise<Application> {
    const ns = 'namespace="' + app.metadata.namespace + '"';
    const query = 'query=sum(container_memory_working_set_bytes{' + ns + ',container="' + app.metadata.name + '"}) / (1024 * 1024)';
    const queryUrl = PROMETHEUS_API_QUERY_PATH + '?' + query + '&' + ns;

    return consoleFetchJSON(queryUrl).then((res) => {
            let newApp: Application = { ...app };
            if (res && res.data && res.data && res.data.result && res.data.result.length > 0 && res.data.result[0].value && res.data.result[0].value.length > 1) {
                newApp.memory = sprintf('%.2f MB', res.data.result[0].value[1]);
            }
            return newApp;
        });
}

async function populateMemMetrics(app: Application): Promise<Application> {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const ns = 'namespace="' + app.metadata.namespace + '"';
    const query = 'query=sum(container_memory_working_set_bytes{' + ns + ',container="' + app.metadata.name + '"}) / (1024 * 1024)';
    const timeRange = `&start=${currentTimeInSeconds - 3600}&end=${currentTimeInSeconds}&step=60`;
    const queryUrl = PROMETHEUS_API_QUERYRANGE_PATH + '?' + query + '&' + ns + timeRange;

    return consoleFetchJSON(queryUrl).then((res) => {
        let newApp: Application = { ...app };

        if (res && res.data && res.data.result && res.data.result.length > 0) {
            const sortedValues = res.data.result[0].values.sort((a, b) => a[0] - b[0]); // Sort by timestamp

            newApp.metrics = newApp.metrics || {};
            newApp.metrics.memory = sortedValues.map((value, index) => ({
                name: newApp.metadata.name,
                x: index + 1,  // Map the index to values from 1 to 60
                y: sprintf('%.2f', value[1])
            }));
        }

        return newApp;
    }).catch(error => {
        console.error('Error fetching memory metrics:', error);
        return app; // Return the original app object in case of error
    });
}

export async function populateGCPauseMetrics(app: Application): Promise<Application> {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const ns = 'namespace="' + app.metadata.namespace + '"';
    const query = 'query=sum(jvm_gc_pause_seconds_count{' + ns + ',container="' + app.metadata.name + '"}) / (1024 * 1024)';
    const timeRange = `&start=${currentTimeInSeconds - 3600}&end=${currentTimeInSeconds}&step=60`;
    const queryUrl = PROMETHEUS_API_QUERYRANGE_PATH + '?' + query + '&' + ns + timeRange

    return consoleFetchJSON(queryUrl).then((res) => {
        let newApp: Application = { ...app };

        if (res && res.data && res.data.result && res.data.result.length > 0) {
            const sortedValues = res.data.result[0].values.sort((a, b) => a[0] - b[0]); // Sort by timestamp

            newApp.metrics = newApp.metrics || {};
            newApp.metrics.gcPause = sortedValues.map((value, index) => ({
                name: newApp.metadata.name,
                x: index + 1,  // Map the index to values from 1 to 60
                y: sprintf('%.2f', value[1])
            }));
        }

        return newApp;
    }).catch(error => {
        console.error('Error fetching memory metrics:', error);
        return app; // Return the original app object in case of error
    });
}

export async function populateGCOverheadMetrics(app: Application): Promise<Application> {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const query = `/api/prometheus/api/v1/query_range?query=avg_over_time(jvm_gc_overhead_percent{service="${app.metadata.name}", namespace="${app.metadata.namespace}"}[1m]) * 100 / avg_over_time(system_cpu_usage[1m])&start=${currentTimeInSeconds - 3600}&end=${currentTimeInSeconds}&step=60`;
    return consoleFetchJSON(query).then((res) => {
        let newApp: Application = { ...app };

        if (res && res.data && res.data.result && res.data.result.length > 0) {
            const sortedValues = res.data.result[0].values.sort((a, b) => a[0] - b[0]); // Sort by timestamp

            newApp.metrics = newApp.metrics || {};
            newApp.metrics.gcOverhead = sortedValues.map((value, index) => ({
                name: newApp.metadata.name,
                x: index + 1,  // Map the index to values from 1 to 60
                y: sprintf('%.2f', value[1])
            }));
        }

        return newApp;
    }).catch(error => {
        console.error('Error fetching memory metrics:', error);
        return app; // Return the original app object in case of error
    });
}

// metrics generated from camel-micrometer
async function populateCamelExchangesTotal(app: Application): Promise<Application> {
    const ns = 'namespace="' + app.metadata.namespace + '"';
    const query = 'query=sum(camel_exchanges_total{' + ns + ',service="' + app.metadata.name + '"})';
    const queryUrl = PROMETHEUS_API_QUERY_PATH + '?' + query + '&' + ns;

    return consoleFetchJSON(queryUrl).then((res) => {
            let newApp: Application = { ...app };
            if (res && res.data && res.data && res.data.result && res.data.result.length > 0 && res.data.result[0].value && res.data.result[0].value.length > 1) {
                newApp.exchangesTotal = sprintf('%.0f', res.data.result[0].value[1]);
            }
            return newApp;
        });
}

// metrics generated from the opentelemetry-jmx instrumentation
async function populateCamelRouteExchanges(app: Application): Promise<Application> {
    const ns = 'namespace="' + app.metadata.namespace + '"';
    const query = 'query=sum(camel_route_exchange{k8s_namespace_name="' + app.metadata.namespace + '",k8s_deployment_name="' + app.metadata.name + '"})';
    const queryUrl = PROMETHEUS_API_QUERY_PATH + '?' + query + '&' + ns;

    return consoleFetchJSON(queryUrl).then((res) => {
            let newApp: Application = { ...app };
            if (res && res.data && res.data && res.data.result && res.data.result.length > 0 && res.data.result[0].value && res.data.result[0].value.length > 1) {
                newApp.exchangesTotal = sprintf('%.0f', res.data.result[0].value[1]);
            }
            return newApp;
        });
}

/* export async function populateRoute(app: Application): Promise<Application> {
    return consoleFetchJSON('/api/kubernetes/apis/route.openshift.io/v1/namespaces/' + app.metadata.namespace + '/routes/' + app.metadata.name).then((route: RouteKind) => {
        let newApp: Application = { ...app };
        const protocol = route.spec.tls ? 'https' : 'http';
        newApp.url = protocol + "://" + route.spec.host;
        return newApp;
    }).catch(_ => {
        return app;
    });
}
 */
export async function fetchApplications(ns: string): Promise<Application[]> {
    return Promise.all([fetchDeployments(ns), fetchDeploymentConfigs(ns)]).then(([deployments, deploymentConfigs]) => {
        return deployments.concat(deploymentConfigs);
    });
}


export async function fetchApplicationsWithMetrics(ns: string): Promise<Application[]> {
    // Fetch applications
    return fetchApplications(ns).then((applications) => {
        const populatePromises = applications.map((app) => populateAdddionalInfo(app));
        return Promise.all(populatePromises);
    }).then((applications) => {
        camelApplicationStore.setState({ applications });
        return applications;
    }).catch((error) => {
        console.error('Error fetching and populating metrics:', error);
        throw error;
    });
}

export async function fetchApplicationPods(ns: string, applicationName: string): Promise<PodKind[]> {
    return consoleFetchJSON('/api/kubernetes/api/v1/namespaces/' + ns + '/pods?labelSelector=app.kubernetes.io/name%3D' + applicationName).then(res => {
        return res.items;
    }).catch(_ => {
        return null;
    });
}

export async function fetchPodsLogs(ns: string, podName: string, containerName?: string): Promise<string> {
    let logUri = '/api/kubernetes/api/v1/namespaces/' + ns + '/pods/' + podName + '/log';
    if (containerName) {
        logUri += '?container=' + containerName;
    }
    return consoleFetchJSON(logUri).then(res => {
        return res;
    }).catch(_ => {
        return null;
    });
}


export async function fetchApplication(kind: string, ns: string, name: string): Promise<Application> {
    let app: Promise<Application>;
    switch (kind) {
        case 'Deployment':
            app = fetchDeployment(ns, name);
            break;
        case 'DeploymentConfig':
            app = fetchDeploymentConfig(ns, name);
            break;
        default:
            throw new Error('Invalid kind: ' + kind);
    }
    return app.then(populateCpuMetrics).then(populateMemMetrics);
}

export async function fetchApplicationWithMetrics(kind: string, ns: string, name: string): Promise<Application> {
    console.log("> fetchApplicationWithMetrics ns: " + ns + ", name: " + name);
    let app: Promise<Application>;
    switch (kind) {
        case 'Deployment':
            app = fetchDeployment(ns, name);
            break;
        case 'DeploymentConfig':
            app = fetchDeploymentConfig(ns, name);
            break;
        case 'CronJob':
            app = fetchCronJob(ns, name);
            break;
        default:
            throw new Error('Invalid kind: ' + kind);
    }
    return app.then(populateCpuMetrics).then(populateMemMetrics);
}

const CamelService = {
    fetchCronjobs: fetchCronJobs,
    fetchCronJob,
    fetchDeployments,
    fetchDeploymentConfigs,
    fetchApplications,
    fetchApplicationPods,
    fetchApplicationsWithMetrics,
    fetchPodsLogs,
    populateCpuMetrics,
    populateMemMetrics,
    populateGCOverheadMetrics,
    populateGCPauseMetrics,
    fetchSecret,
    fetchConfigMap,
    fetchPvc,
    fetchJob,
    fetchJobs,
    populateAdddionalInfo
}
export default CamelService;
