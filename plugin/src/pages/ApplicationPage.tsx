import * as React from 'react';
import Helmet from 'react-helmet';
import {
  Page,
  PageSection,
  Tab,
  TabContent,
  Tabs,
  TabTitleText,
  Title,
} from '@patternfly/react-core';

import { match as RMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Application } from '../types';
import { fetchApplicationWithMetrics } from '../services/CamelService';
import ApplicationDetailsCard from '../components/ApplicationDetailsCard';
import ApplicationHealthCard from '../components/ApplicationHealthCard';
import ApplicationMetricsCard from '../components/ApplicationMetricsCard';
import ApplicationLoggingCard from '../components/ApplicationLoggingCard';
import ApplicationConfigurationCard from '../components/ApplicationConfigurationCard';
import ApplicationProdUiCard from '../components/ApplicationProdUiCard';
import './camel.css';
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk';

export const ApplicationPage: React.FC<ApplicationPageProps> = ( {match} ) => {
  const { t } = useTranslation('plugin__console-plugin-template');
  const { ns, kind, name } = match?.params || {};
  const [selectedNamespace] = useState<string>(ns || 'all-namespaces');
  const [selectedName] = useState<string>(name || '');
  const [selectedKind] = useState<string>(kind || 'Deployment');
  const [application, setApplication] = useState<Application>();
  const [activeTabKey, setActiveTabKey] = useState(0);

  const [produiAvailable, setProduiAvailable] = useState<boolean>(false);

  const handleTabClick = (event, tabIndex) => {
    setActiveTabKey(tabIndex);
  };

  useEffect(() => {
    fetchApplicationWithMetrics(selectedKind, selectedNamespace, selectedName).then((app: Application) => {
      setApplication(app);
    })
  }, [selectedNamespace, selectedKind, selectedName]);

  useEffect(() => {
    if (application) {
      checkProdui(application);
    }
  }, [application]);

  function checkProdui(application: Application) {
    const produiProxyUrl = (app) => `/api/proxy/plugin/camel-openshift-console-plugin/service-proxy/produi/${app.metadata.namespace}/${app.metadata.name}/`
    consoleFetchJSON(produiProxyUrl(application)).then((res) => {
      setProduiAvailable(true);
    }).catch((err) => {
        setProduiAvailable(false);
      });
  }

  return (
    <>
      <Helmet>
        <title data-test="camel-page-title">{selectedNamespace} - {selectedName}</title>
      </Helmet>
      <Page>
        <PageSection variant="light">
          <Title headingLevel="h1">{t('Dashboard')}</Title>
        </PageSection>
        <PageSection variant="light">
          <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
            <Tab eventKey={0} title={<TabTitleText>Details</TabTitleText>}>
              <TabContent id="0" title="Details">
                <PageSection variant="light">
                  <ApplicationDetailsCard application={application} />
                </PageSection>
              </TabContent>
            </Tab>
            <Tab eventKey={1} title={<TabTitleText>Metrics</TabTitleText>}>
              <TabContent id="1" title="Metrics">
                <PageSection variant="light">
                  <ApplicationMetricsCard application={application} />
                </PageSection>
              </TabContent>
            </Tab>
            <Tab eventKey={2} title={<TabTitleText>Health</TabTitleText>}>
              <TabContent id="2" title="Health">
                <PageSection variant="light">
                  <ApplicationHealthCard application={application} />
                </PageSection>
              </TabContent>
            </Tab>
            <Tab eventKey={3} title={<TabTitleText>Configuration</TabTitleText>}>
              <TabContent id="3" title="Configuration">
                <PageSection variant="light">
                  <ApplicationConfigurationCard application={application} />
                </PageSection>
              </TabContent>
            </Tab>
            <Tab eventKey={4} title={<TabTitleText>Logging</TabTitleText>}>
              <TabContent id="4" title="Logging">
                <PageSection variant="light">
                  <ApplicationLoggingCard application={application} active={activeTabKey === 4} />
                </PageSection>
              </TabContent>
            </Tab>
            {application && application.url && produiAvailable &&
            <Tab eventKey={5} title={<TabTitleText>Prod UI</TabTitleText>}>
              <TabContent id="5" title="Prod UI">
                <PageSection variant="light">
                  <ApplicationProdUiCard application={application}/>
                </PageSection>
              </TabContent>
            </Tab>
            }
          </Tabs>
        </PageSection>
      </Page>
      </>
  );
}

type ApplicationPageProps = {
  match: RMatch<{
    ns?: string;
    kind?: string;
    name?: string;
  }>;
};

export default ApplicationPage;
