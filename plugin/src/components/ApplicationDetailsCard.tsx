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
  const [vcsUri, setVcsUri] = useState<string>();
  const [location, setLocation] = useState<string>();
  const [healthEndpoint, setHealthEndpoint] = useState<string>();
  const [healthEndpointStatus, setHealthEndpointStatus] = useState<string>('Pending');
  const [metricsEndpoint, setMetricsEndpoint] = useState<string>();
  const [metricsEndpointStatus, setMetricsEndpointStatus] = useState<string>('Pending');
  const [infoEndpoint, setInfoEndpoint] = useState<string>();
  const [infoEndpointStatus, setInfoEndpointStatus] = useState<string>('Pending');
  const [produiEndpoint, setProduiEndpoint] = useState<string>();
  const [produiEndpointStatus, setProduiEndpointStatus] = useState<string>('Pending');
  const [framework, setFramework] = useState<string>();
  const [frameworkUrl, setFrameworkUrl] = useState<string>();
  const [frameworkVersion, setFrameworkVersion] = useState<Version>();
  const [releaseNotesUrl, setReleaseNotesUrl] = useState<string>();
  //const [buildVersion, setBuildVersion] = useState<string | null>(null);

  type Version = {
    version: string;
    major: number;
    minor: number;
    patch: number;
  };

  function parseSemanticVersion(version: string): Version | null {
    const versionParts = version ? version.replace(/[^0-9.]/g, '').split('.') : [];
    let major = 0;
    let minor = 0;
    let patch = 0;

    if (versionParts.length >= 3) {
      major = parseInt(versionParts[0]);
      minor = parseInt(versionParts[1]);
      patch = parseInt(versionParts[2]);
    } else if (versionParts.length >= 2) {
      minor = parseInt(versionParts[0]);
      patch = parseInt(versionParts[1]);
    } else if (versionParts.length >= 1) {
      patch = parseInt(versionParts[0]);
    }
    return {
      version,
      major,
      minor,
      patch,
    };
  }

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

  function getVcsUri(application: Application): string | null {
    if (application && application.metadata) {
      return application.metadata.annotations["app.openshift.io/vcs-uri"];
    }
    return null;
  }

function convertGitUrlToHttp(gitUrl: string): string {
    if (!gitUrl) {

    }
    // Regular expressions to match SSH and other non-HTTP Git URLs for GitHub and GitLab
    const githubSshRegex = /^(git@github\.com:)([^#]+)/;
    const gitlabSshRegex = /^(git@gitlab\.com:)([^#]+)/;

    // Check if the URL is a GitHub SSH URL
    if (githubSshRegex.test(gitUrl)) {
        return gitUrl.replace(githubSshRegex, 'https://github.com/$2');
    }

    // Check if the URL is a GitLab SSH URL
    if (gitlabSshRegex.test(gitUrl)) {
        return gitUrl.replace(gitlabSshRegex, 'https://gitlab.com/$2');
    }

    // If it's already an HTTP URL or another form, return as is
    return gitUrl;
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

  function getCamelVersion(application: Application): Version | null {
    if (application && application.metadata) {
      return parseSemanticVersion(application.metadata.annotations["app.quarkus.io/camel-version"]);
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
    const camelVersion = getCamelVersion(application);
    if (application) {
      setKind(application.kind);
      setName(application.metadata.name);
      setNamespace(application.metadata.namespace);
      setVersion(getApplicationVersion(application));
      setBuildTimestamp(getBuildTimestamp(application));
      setVcsUri(getVcsUri(application));
      setLocation(application.url);
      setHealthEndpoint(getHealthCheckEndpoint(application));
      setHealthEndpointStatus(getHealthStatus(application));
      setMetricsEndpoint("/q/metrics");
      checkMetricsEndpointStatus(application);
      setInfoEndpoint("/q/info");
      checkInfoEndpointStatus(application);
      setProduiEndpoint("/q/dev");
      checkProduiEndpointStatus(application);
      setFramework("camel");
      setFrameworkVersion(camelVersion);
    }
  }, [application]);

  useEffect(() => {
   switch (framework) {
      case "camel":
        setFrameworkUrl("https://camel.apache.org/");
      break;
      default:
       setFrameworkUrl("");
      break;
   }
  }, [framework])

  useEffect(() => {
    if (frameworkVersion && frameworkVersion.version) {
      const releaseUrl = `https://github.com/quarkusio/quarkus/releases/tag/${frameworkVersion.version}`;
      if (!frameworkVersion.version.endsWith('-SNAPSHOT')) {
        setReleaseNotesUrl(releaseUrl);
      }
    }
  }, [frameworkVersion]);

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
                  linkTo={true}/>
                {version && <TextContent><strong>Version:</strong> {version}</TextContent>}
                {buildTimestamp && <TextContent><strong>Build Timestamp:</strong> {buildTimestamp}</TextContent>}
                {vcsUri &&
                  <TextContent><strong>Version Control: </strong>
                    <a href={convertGitUrlToHttp(vcsUri)} target="_blank" rel="noopener noreferrer">{vcsUri}</a>
                  </TextContent>}
                <TextContent>
                  <strong>Location:</strong> <a href={location} target="_blank" rel="noopener noreferrer">
                    {location}
                  </a>
                </TextContent>
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
              <CardTitle>Framework</CardTitle>
              <CardBody>
                <TextContent><strong>Framework: </strong> {frameworkUrl
                  ? <a href={frameworkUrl} target="_blank" rel="noopener noreferrer">{framework}</a>
                  : framework}
                </TextContent>
                {frameworkVersion &&
                  <>
                    <TextContent><strong>Version: </strong> {releaseNotesUrl
                      ? <a href={releaseNotesUrl} target="_blank" rel="noopener noreferrer">{frameworkVersion.version}</a>
                      : frameworkVersion.version}</TextContent>
                    <TextContent><strong>Major Version: </strong> {frameworkVersion.major}</TextContent>
                    <TextContent><strong>Minor Version: </strong> {frameworkVersion.minor}</TextContent>
                    <TextContent><strong>Patch Version: </strong> {frameworkVersion.patch}</TextContent>
                    </>
              }
              </CardBody>
            </Card>
          </div>
        ): <Spinner aria-label="Loading applicaton details" />}
      </CardBody>
    </Card>
  );
};

export default ApplicationDetailsCard;
