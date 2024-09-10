import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  List,
  ListItem,
  TextContent,
} from '@patternfly/react-core';
import { Application } from '../types';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import { fetchJobs } from '../services/CamelService';
import { JobKind } from 'k8s-types';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

const ApplicationJobHealthCard: React.FC<{ application: Application }> = ({ application }) => {

  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const newJobs = [];
    if (application && application.metadata) {
      fetchJobs(application.metadata.namespace).then((jobs) => {
        if (jobs) {
          jobs.forEach((job) => {
            if (job.metadata.name.startsWith(application.metadata.name) && job.metadata.name.endsWith('-init')) {
              newJobs.push(job);
            }
          });
        }
        setJobs(newJobs);

      })
    }
  }, [application]);

  return (
    <Card>
      <CardTitle>Jobs</CardTitle>
      <CardBody>
        <List isPlain isBordered>
          {jobs &&  jobs.map((job, index) => (
            <ListItem key={index}>  
                  <ResourceLink
                    key={job.metadata.name}
                    kind="Job"
                    name={job.metadata.name}
                    namespace={application.metadata.namespace}
                    linkTo={true}/>
              {job.spec.template.spec.containers.map((container) => (
                <>
                  <TextContent><strong>Name:</strong> {container.name}</TextContent>
                  <TextContent><strong>Image:</strong> {trimImage(container.image)}</TextContent>
                  <TextContent><strong>Command:</strong> {container.command}</TextContent>
                  <TextContent><strong>Args:</strong> {container.args}</TextContent>
                </>
              ))}
              <TextContent>
                Status:
                <Status
                  title={jobStatus(job)}
                  status={jobStatus(job)}/>
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

const jobStatus = (job: JobKind) => {
  if (job.status.succeeded) {
    return "Succeeded";
  }
  if (job.status.failed) {
    return "Failed";
  }
  if (job.status.active) {
    return "Running";
  }
  return "Unknown";
};

export default ApplicationJobHealthCard;
