import * as React from 'react';
import { match as RMatch } from 'react-router-dom';
import Helmet from 'react-helmet';
import {
    Card,
    CardBody,
    Page,
    PageSection,
    Title,
} from '@patternfly/react-core';
import './camel.css';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { NamespaceBar } from '@openshift-console/dynamic-plugin-sdk';
import ApplicationList from '../components/ApplicationList';
import { Application } from '../types';
import { fetchDeployments, fetchDeploymentConfigs, populateAdddionalInfo } from '../services/CamelService';
import ApplicationsCPUGraph from '../components/ApplicationsCPUGraph';
import ApplicationsMemoryGraph from '../components/ApplicationsMemoryGraph';

export const CamelPage: React.FC<CamelHomePageProps> = ({ match }) => {
    const { t } = useTranslation('plugin__console-plugin-template');
    const { ns } = match?.params || {};

    const [activeNamespace, setActiveNamespace] = useState(ns || null);
    const [applications, setApplications] = useState<Application[]>([]);

    const matching = (left: Application, right: Application): boolean => {
        return left.metadata.name === right.metadata.name && left.metadata.namespace === right.metadata.namespace && left.kind === right.kind;
    }

    useEffect(() => {
        fetchDeployments(activeNamespace).then((apps: Application[]) => {
            apps.forEach(app => {
                setApplications((existing: Application[]) => {
                    return [...existing.filter(e => !matching(e, app)), app];
                });
                populateAdddionalInfo(app).then(appWithInfo => {
                    setApplications((existing: Application[]) => {
                        return [...existing.filter(e => !matching(e, appWithInfo)), appWithInfo];
                    });
                });
            })
        });

        fetchDeploymentConfigs(activeNamespace).then((apps: Application[]) => {
            apps.forEach(app => {
                setApplications((existing: Application[]) => {
                    return [...existing.filter(e => !matching(e, app)), app];
                });
                populateAdddionalInfo(app).then(appWithInfo => {
                    setApplications((existing: Application[]) => {
                        return [...existing.filter(e => !matching(e, appWithInfo)), appWithInfo];
                    });
                });
            })
        });
    }, [activeNamespace]);

    return (
        <>
            <NamespaceBar onNamespaceChange={namespace => setActiveNamespace(namespace)} />
            <Helmet>
                <title data-test="camel-page-title">{t('Camel')}</title>
            </Helmet>

            <Page>
                <PageSection variant="light">
                    <Title headingLevel="h1">{t('Camel Applications')}</Title>
                </PageSection>
                <PageSection variant="light">
                    <Card>
                        <CardBody>
                            <ApplicationList apps={applications} />
                        </CardBody>
                    </Card>
                </PageSection>
                <PageSection variant="light">
                    <Card>
                        {applications && applications.length > 0 &&
                            <CardBody style={{ display: 'flex', flexDirection: 'row' }}>
                                <div style={{ flex: 1 }}>
                                    <ApplicationsCPUGraph applications={applications} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <ApplicationsMemoryGraph applications={applications} />
                                </div>
                            </CardBody>
                        }
                    </Card>
                </PageSection>
            </Page>
        </>
    );
}

type CamelHomePageProps = {
    match: RMatch<{
        ns?: string;
    }>;
};

export default CamelPage;
