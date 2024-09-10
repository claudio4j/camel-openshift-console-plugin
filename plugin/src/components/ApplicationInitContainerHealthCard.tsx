import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  List,
  ListItem,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { Application } from '../types';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { fetchApplicationPods } from '../services/CamelService';
import { ContainerSpec, ContainerState, PodKind } from 'k8s-types';

const ApplicationJobsHealthCard: React.FC<{ application: Application }> = ({ application }) => {

  const [pods, setPods] = useState<PodKind[]>([]);

  useEffect(() => {
    const newPods: PodKind[] = [];
    if (application && application.metadata) {
      fetchApplicationPods(application.metadata.namespace, application.metadata.name).then((pods: PodKind[]) => {
        if (pods) {
          pods.forEach((pod) => {
            newPods.push(pod);
          });
        }
      })
      setPods(newPods);
    }
  }, [application]);

  return (
    <Card>
      <CardTitle>Init Containers</CardTitle>
      <CardBody>
        <List isPlain isBordered>
          {application && application.spec && application.spec.initContainers &&  application.spec.initContainers.map((container: ContainerSpec, index) => (
            <ListItem key={index}>  
              <Text component="h3" >{container.name}</Text>
                <>
                  <TextContent><strong>Name:</strong> {container.name}</TextContent>
                  <TextContent><strong>Image:</strong> {trimImage(container.image)}</TextContent>
                  <TextContent><strong>Command:</strong> {container.command}</TextContent>
                  <TextContent><strong>Args:</strong> {container.args}</TextContent>
                </>
              <TextContent>
                Status:
                <Status
                  title={initContainerStatus(pods, container.name)}
                  status={initContainerStatus(pods, container.name)}/>
              </TextContent>
            </ListItem>
          ))}
        </List>
      </CardBody>
    </Card>
  );
};

const trimImage = (image: string) => {
  if (image.includes('@sha256')) {
    const parts = image.split('@sha256:');
    return parts[0] + "@sha256:" + parts[1].substring(0, 7);
  }
  return image;
}

const initContainerStatus = (pods: PodKind[], initContainerName: string) => {
 const states: ContainerState[] = pods.flatMap(p => p.status.initContainerStatuses.filter(s => s.name === initContainerName).map(s => s.state));
 if (states.map(s => s.running ? true : false).reduce((a, b) => a || b, false)) {
    return "Pending";
 }
 if (states.map(s => s.terminated.reason === "Completed").reduce((a, b) => a && b, true)) {
    return "Succeeded";
 }
 if (states.map(s => s.terminated.reason === "Failed").reduce((a, b) => a || b, false)) {
    return "Failed";
 }
  return "Unknown";
};

export default ApplicationJobsHealthCard;
