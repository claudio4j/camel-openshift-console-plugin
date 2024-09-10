import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Text,
  TextContent,
  Tooltip
} from '@patternfly/react-core';
import { Application } from '../types';
import { extractEnvironmentVariables, extractMountedConfigMaps, extractMountedSecrets } from '../utils';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

const ApplicationConfigurationCard: React.FC<{application: Application }> = ({ application }) => {

  type Description = {
    [key: string]: string
  };

  const [envVars, setEnvVars] = useState({});
  const [secrets, setSecrets] = useState<string[]>([]);
  const [configMaps, setConfigMaps] = useState<string[]>([]);

  const [descriptions, setDescriptions] = useState<Description>({});

  useEffect(() => {
    Object.entries(envVars).forEach(([key, _]) => {
      fetchCamelConfigInfo(envVarToProperty(key)).then((description) => {
        setDescriptions(prevDescriptions => ({
          ...prevDescriptions,
          [key]: description
        }));
      });
    });
  }, [envVars]);

  useEffect(() => {
    if (application && application.spec) {
      setEnvVars(extractEnvironmentVariables(application));
      setSecrets(extractMountedSecrets(application));
      setConfigMaps(extractMountedConfigMaps(application));
    }
  }, [application]);


  function descriptionSafe(key: string): string {
    return descriptions && descriptions[key] ? descriptions[key] : key;
  }

  function envVarToProperty(envVar: string): string {
    return envVar.toLowerCase().replace(/_/g, '.');
  }

  /*
  function propertyToEnvVar(property: string): string {
    return property.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  }
  */


  async function fetchCamelConfigInfo(propertyName: string): Promise<string> {
    // Split the property to find the last segment which is usually the actual property name
   // const envVarName = propertyToEnvVar(propertyName);

    // Fetch the Camel configuration guide page
    const response = await fetch('https://quarkus.io/guides/all-config');
    const html = await response.text();

    // Use DOMParser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the table element - adjust the selector as needed
    const tables = doc.querySelectorAll('table');

    let info = null;

    // Iterate through all tables (if there are multiple tables for config properties)
    tables.forEach((table) => {
      // Iterate through each row in the table
      table.querySelectorAll('tbody tr').forEach((row) => {
        // Get the first cell (config key) and second cell (description)
        const keyCell = row.querySelector('td:first-child');
        const descriptionCell = row.querySelector('td:nth-child(1)');
        const typeCell = row.querySelector('td:nth-child(2)');
        const defaultCell = row.querySelector('td:nth-child(3)');

        if (keyCell && descriptionCell && keyCell.textContent.includes(propertyName)) {
          // If the config key matches the property name, get the description
          info = descriptionCell.textContent.split('\n')
              .filter((line) => !line.startsWith(propertyName))
              .filter((line) => !line.startsWith('Environment Variable'))
              .filter((line) => !line.startsWith('Show more'))
              .join('\n') + ' \n'
              'Defaults to (' + typeCell.textContent.trim() + '): ' + defaultCell.textContent.trim();

        }
      });
    });
    return info;
  }

  return (
    <Card>
      <CardTitle>Configuration</CardTitle>
      <CardBody>
        {application &&
          <TextContent>
            <Text component="p">Name: {application.metadata.name}</Text>
            <Text component="p">Environment Variables:</Text>
            <ul>
              {Object.entries(envVars).map(
                ([key, value]) => (
                  <li key={key}>
                    <Tooltip content={descriptionSafe(key)}>
                      <>
                      <strong>{key}:</strong> {value}
                      </>
                    </Tooltip>
                  </li>
                )
              )}
            </ul>
            <Text component="p">Secrets:</Text>
            <ul>
              {secrets.map((secret) => (
                <li key={secret}>
                  <ResourceLink
                    key={secret}
                    kind="Secret"
                    name={secret}
                    namespace={application.metadata.namespace}
                    linkTo={true}/>
                </li>
              ))}
            </ul>
            <Text component="p">Config Maps:</Text>
            <ul>
              {configMaps.map((configMap) => (
                <li key={configMap}>
                  <ResourceLink
                    key={configMap}
                    kind="ConfigMap"
                    name={configMap}
                    namespace={application.metadata.namespace}
                    linkTo={true}/>
                </li>
              ))}
            </ul>
          </TextContent>
      }
      </CardBody>
    </Card>
  );
};

export default ApplicationConfigurationCard;

