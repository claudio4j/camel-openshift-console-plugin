import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardTitle,
    Spinner,
    TextContent,
} from '@patternfly/react-core';

import { Application } from '../types';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { consoleFetch, consoleFetchJSON, ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

const ApplicationDetailsCard: React.FC<{ application: Application }> = ({ application }) => {

    const [name, setName] = useState<string>();
    const [namespace, setNamespace] = useState<string>();
    const [kind, setKind] = useState<string>();
    const [version, setVersion] = useState<string>();
    const [buildTimestamp, setBuildTimestamp] = useState<string>();
    const [healthEndpoint, setHealthEndpoint] = useState<string>();
    const [healthEndpointStatus, setHealthEndpointStatus] = useState<string>('Pending');
    const [metricsEndpoint, setMetricsEndpoint] = useState<string>();
    const [metricsEndpointStatus, setMetricsEndpointStatus] = useState<string>('Pending');
    const [infoEndpoint, setInfoEndpoint] = useState<string>();
    const [infoEndpointStatus, setInfoEndpointStatus] = useState<string>('Pending');
    const [produiEndpoint, setProduiEndpoint] = useState<string>();
    const [produiEndpointStatus, setProduiEndpointStatus] = useState<string>('Pending');

    function getHealthCheckEndpoint(application: Application): string | null {
        if (application && application.spec && application.spec.containers) {
            for (const container of application.spec.containers) {
                if (container.readinessProbe?.httpGet?.path) {
                    return container.readinessProbe.httpGet.path;
                }
            }
        }
        return null;
    }

    function getBuildTimestamp(application: Application): string | null {
        if (application && application.metadata) {
            return application.metadata.annotations["app.quarkus.io/build-timestamp"];
        }
        return null;
    }

    function getApplicationVersion(application: Application): string | null {
        if (application && application.metadata) {
            return application.metadata.annotations["app.kubernetes.io/version"];
        }
        return null;
    }

    function getHealthStatus(application: Application): string | null {
        return application.status.replicas === application.status.availableReplicas ? "Succeeded" : "Failed";
    }

    function checkMetricsEndpointStatus(application: Application) {
        const metricsProxyUrl = (app) => `/api/proxy/plugin/camel-openshift-console-plugin/service-proxy/metrics/${app.metadata.namespace}/${app.metadata.name}/`
        consoleFetch(metricsProxyUrl(application)).then((res) => {
            setMetricsEndpointStatus('Succeeded');
        }).catch((err) => {
            setMetricsEndpointStatus('Failed');
        });
    }

    function checkInfoEndpointStatus(application: Application) {
        const infoEndpoint = (app) => `/api/proxy/plugin/camel-openshift-console-plugin/service-proxy/info/${app.metadata.namespace}/${app.metadata.name}/`
        consoleFetchJSON(infoEndpoint(application)).then((res) => {
            setInfoEndpointStatus('Succeeded');
        }).catch((err) => {
            setInfoEndpointStatus('Failed');
        });
    }

    function checkProduiEndpointStatus(application: Application) {
        const produiProxyUrl = (app) => `/api/proxy/plugin/camel-openshift-console-plugin/service-proxy/produi/${app.metadata.namespace}/${app.metadata.name}/`
        consoleFetchJSON(produiProxyUrl(application)).then((res) => {
            setProduiEndpointStatus('Succeeded');
        }).catch((err) => {
            setProduiEndpointStatus('Failed');
        });
    }



    useEffect(() => {
        if (application) {
            setKind(application.kind);
            setName(application.metadata.name);
            setNamespace(application.metadata.namespace);
            setVersion(getApplicationVersion(application));
            setBuildTimestamp(getBuildTimestamp(application));
            setHealthEndpoint(getHealthCheckEndpoint(application));
            setHealthEndpointStatus(getHealthStatus(application));
            setMetricsEndpoint("/q/metrics");
            checkMetricsEndpointStatus(application);
            setInfoEndpoint("/q/info");
            checkInfoEndpointStatus(application);
            setProduiEndpoint("/q/dev");
            checkProduiEndpointStatus(application);
        }
    }, [application]);

    return (
        <Card>
            <CardTitle>Application</CardTitle>
            <CardBody>
                {application ? (
                    <div>
                        <Card>
                            <CardTitle>Details</CardTitle>
                            <CardBody>
                                <ResourceLink
                                    key={name}
                                    kind={kind}
                                    name={name}
                                    namespace={namespace}
                                    linkTo={true} />
                                {version && <TextContent><strong>Version:</strong> {version}</TextContent>}
                                {buildTimestamp && <TextContent><strong>Build Timestamp:</strong> {buildTimestamp}</TextContent>}
                            </CardBody>
                        </Card>

                        <Card>
                            <CardTitle>Endpoints</CardTitle>
                            <CardBody>
                                <TextContent><strong>Health Endpoint:</strong> <Status title={healthEndpoint} status={healthEndpointStatus} /></TextContent>
                                <TextContent><strong>Metrics Endpoint:</strong> <Status title={metricsEndpoint} status={metricsEndpointStatus} /></TextContent>
                                <TextContent><strong>Info Endpoint:</strong> <Status title={infoEndpoint} status={infoEndpointStatus} /></TextContent>
                                <TextContent><strong>Prod UI Endpoint:</strong> <Status title={produiEndpoint} status={produiEndpointStatus} /></TextContent>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardTitle>Frameworks</CardTitle>
                            <CardBody>
                                {application.metadata.annotations['camel/camel-core-version'] && <TextContent><strong>Camel: </strong> {application.metadata.annotations['camel/camel-core-version']}</TextContent>}
                                {application.metadata.annotations['camel/quarkus-platform'] && <TextContent><strong>Quarkus Platform: </strong> {application.metadata.annotations['camel/quarkus-platform']}</TextContent>}
                                {application.metadata.annotations['camel/camel-quarkus'] && <TextContent><strong>Camel Quarkus: </strong> {application.metadata.annotations['camel/camel-quarkus']}</TextContent>}

                                {application.metadata.annotations['camel/camel-spring-boot-version'] && <TextContent><strong>Camel Spring Boot: </strong> {application.metadata.annotations['camel/camel-spring-boot-version']}</TextContent>}
                                {application.metadata.annotations['camel/spring-boot-version'] && <TextContent><strong>Spring Boot: </strong> {application.metadata.annotations['camel/spring-boot-version']}</TextContent>}
                            </CardBody>
                        </Card>
                    </div>
                ) : <Spinner aria-label="Loading applicaton details" />}
            </CardBody>
        </Card>
    );
};

export default ApplicationDetailsCard;
