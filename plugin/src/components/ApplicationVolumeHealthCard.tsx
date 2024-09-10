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
import { fetchConfigMap, fetchPvc, fetchSecret } from '../services/CamelService';
import { ConfigMapKind, PersistentVolumeClaimKind, SecretKind, Volume } from 'k8s-types';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

const ApplicationHealthCard: React.FC<{ application: Application }> = ({ application }) => {

  const [volumes, setVolumes] = useState(application && application.spec ? application.spec.volumes : []);
  const [volumeStatus, setVolumeStatus] = useState({});

  useEffect(() => {
    setVolumes(application && application.spec && application.spec.volumes ? application.spec.volumes : []);
  }, [application]);

  useEffect(() => {
    if (application && application.metadata) {
      volumes.forEach(volume => {
        const kind = volumeKind(volume);
        switch (kind) {
          case 'ConfigMap':
            fetchConfigMap(application.metadata.namespace, volume.name).then((configMap: ConfigMapKind) => {
              updateVolumeStatus(volume.name, configMap ?  "Succeeded" : "Pending");
            });
            break;
          case 'Secret':
            fetchSecret(application.metadata.namespace, volume.name).then((secret: SecretKind) => {
              updateVolumeStatus(volume.name, secret ?  "Succeeded" : "Pending");
            });
            break;
          case 'PersistentVolumeClaim':
            fetchPvc(application.metadata.namespace, volume.name).then((pvc: PersistentVolumeClaimKind) => {
              updateVolumeStatus(volume.name, pvc ?  "Succeeded" : "Pending");
            });
            break;
          default:
          console.log('Unknown volume kind: ' + kind);
        }
      });
    }
  }, [volumes]);

  const updateVolumeStatus = (name: string, status: string) => {
    setVolumeStatus(prevStatus => ({
      ...prevStatus,
      [name]: status,
    }));
  } 

  useEffect(() => {
    //just for refresh 
  }, [volumeStatus]);


  return (
    <Card>
      <CardTitle>Volumes</CardTitle>
      <CardBody>
        <List isPlain isBordered>
          {application && application.spec && application.spec.volumes && application.spec.volumes.map(volume => (
            <ListItem key={volume.name}>  
              <ResourceLink
                key={volume.name}
                kind={volumeKind(volume)}
                name={volume.name}
                namespace={application.metadata.namespace}
                linkTo={true}/>
              <TextContent>
                <Text component="p">Kind: {volumeKind(volume)} </Text>
              </TextContent>
              <TextContent>
                {application.spec.containers.filter((container) => container.volumeMounts.filter((volumeMount) => volumeMount.name === volume.name).length > 0).map((container) => (
                  <li key={container.name}>
                    <TextContent>
                      Container: {container.name}
                      {container.volumeMounts.filter((volumeMount) => volumeMount.name === volume.name).map((volumeMount) => (
                        <TextContent>
                          Path: {volumeMount.mountPath}
                        </TextContent>
                      ))}
                    </TextContent>
                  </li>
                ))}
              </TextContent>
              <TextContent>
                Status:
                <Status
                  title={volumeStatus[volume.name] ? volumeStatus[volume.name] : "Pending"}
                  status={volumeStatus[volume.name] ? volumeStatus[volume.name] : "Pending"} />
              </TextContent>
            </ListItem>
          ))}
        </List>
      </CardBody>
    </Card>
  );
};

const volumeKind = (volume: Volume) => {
  //check if volume has property configMap and return `ConfigMap` or `Secret` otherwise
  if (volume.configMap) {
    return 'ConfigMap';
  }
  if (volume.secret) {
    return 'Secret';
  }
  if (volume.emptyDir) {
    return 'EmptyDir';
  }
  if (volume.persistentVolumeClaim) {
    return 'PersistentVolumeClaim';
  }
  if (volume.hostPath) {
    return 'HostPath';
  }
  if (volume.awsElasticBlockStore) {
    return 'AWS Elastic Block Store';
  }
  if (volume.azureDisk) {
    return 'Azure Disk';
  }
  if (volume.azureFile) {
    return 'Azure File';
  }
  if (volume.cinder) {
    return 'Cinder';
  }
  if (volume.downwardAPI) {
    return 'Downward API';
  }
  if (volume.fc) {
    return 'FC';
  }
  if (volume.flexVolume) {
    return 'Flex Volume';
  }
  return 'Unknown';
};

export default ApplicationHealthCard;
