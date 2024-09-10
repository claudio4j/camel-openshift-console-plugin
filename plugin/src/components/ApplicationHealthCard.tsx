import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
} from '@patternfly/react-core';
import { Application } from '../types';
import ApplicationVolumeHealthCard from './ApplicationVolumeHealthCard';
import ApplicationJobHealthCard from './ApplicationJobHealthCard';
import ApplicationInitContainerHealthCard from './ApplicationInitContainerHealthCard';
import ApplicationProbeHealthCard from './ApplicationProbeHealthCard';

const ApplicationHealthCard: React.FC<{ application: Application }> = ({ application }) => {


  return (
    <Card>
      <CardTitle>Health</CardTitle>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* First Row */}
          <div style={{ display: 'flex', flexDirection: 'row', flex: '1', height: '50%' }}>
            <div style={{ flex: '1', padding: '8px' }}>
              <ApplicationProbeHealthCard application={application} />
            </div>
            <div style={{ flex: '1', padding: '8px' }}>
              <ApplicationVolumeHealthCard application={application} />
            </div>
          </div>
          {/* Second Row */}
          <div style={{ display: 'flex', flexDirection: 'row', flex: '1', height: '50%' }}>
            <div style={{ flex: '1', padding: '8px', height: '100%' }}>
              <ApplicationInitContainerHealthCard application={application} />
            </div>
            <div style={{ flex: '1', padding: '8px' }}>
              <ApplicationJobHealthCard application={application} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ApplicationHealthCard;
