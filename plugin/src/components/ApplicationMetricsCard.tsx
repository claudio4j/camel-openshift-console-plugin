import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
} from '@patternfly/react-core';
import { Application } from '../types';
import ApplicationsCPUGraph from './ApplicationsCPUGraph';
import ApplicationsMemoryGraph from './ApplicationsMemoryGraph';
import ApplicationsGcPauseGraph from './ApplicationsGcPauseGraph';
import ApplicationsGcOverheadGraph from './ApplicationsGcOverheadGraph';

const ApplicationMetricsCard: React.FC<{application: Application }> = ({ application }) => {

  const [applications, setApplications] = useState<Application[]>([]);
  useEffect(() => {
    const newApplications: Application[] = [application]; 
    setApplications(newApplications);
  }, [application]);

  return (
    <Card>
      <CardTitle>Metrics</CardTitle>
      {applications &&
        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
            {/* First Row */}
            <div style={{ flex: 1 }}>
              <ApplicationsCPUGraph applications={applications} />
            </div>
            <div style={{ flex: 1 }}>
              <ApplicationsMemoryGraph applications={applications} />
            </div>
          </div>

          {/* Second Row */}
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <ApplicationsGcPauseGraph applications={applications} />
            </div>
            <div style={{ flex: 1 }}>
              <ApplicationsGcOverheadGraph applications={applications} />
            </div>
          </div>
        </CardBody>
    }
    </Card>
  );
};

export default ApplicationMetricsCard;
