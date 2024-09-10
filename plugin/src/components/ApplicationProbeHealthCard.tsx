import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { Application } from '../types';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';

const ApplicationProbeHealthCard: React.FC<{ application: Application }> = ({ application }) => {

  const [probes, setProbes] = useState<{
    readinessProbe: string | null;
    livenessProbe: string | null;
    startupProbe: string | null;
  }>({
    readinessProbe: null,
    livenessProbe: null,
    startupProbe: null,
  });

  useEffect(() => {
    if (application && application.spec && application.spec.containers && application.spec.containers.length > 0) {
      const container = application.spec.containers[0]; // Assuming the first container
      setProbes({
        readinessProbe: container.readinessProbe ? container.readinessProbe.httpGet?.path || null : null,
        livenessProbe: container.livenessProbe ? container.livenessProbe.httpGet?.path || null : null,
        startupProbe: container.startupProbe ? container.startupProbe.httpGet?.path || null : null,
      });
    }
  }, [application]);

  return (
    <Card>
      <CardTitle>Probes</CardTitle>
      <CardBody>
        <TextContent>
          <Text component="p"><strong>Startup Probe:</strong> <Status title={probes.startupProbe || 'N/A'} status={probes.startupProbe && application.status.availableReplicas === application.status.replicas ? "Succeeded" : "Failed"}/></Text>
          <Text component="p"><strong>Readiness Probe:</strong> <Status title={probes.readinessProbe || 'N/A'} status={probes.readinessProbe && application.status.availableReplicas === application.status.replicas ? "Succeeded" : "Failed"}/></Text>
          <Text component="p"><strong>Liveness Probe:</strong> <Status title={probes.livenessProbe || 'N/A'} status={probes.livenessProbe && application.status.availableReplicas === application.status.replicas ? "Succeeded" : "Failed"}/></Text>
        </TextContent>
      </CardBody>
    </Card>

  );
};

export default ApplicationProbeHealthCard;
