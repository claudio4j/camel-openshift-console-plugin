import * as React from 'react';
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer';
import {
  Button,
  Tooltip,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
  Select,
  SelectOption,
  Spinner
} from '@patternfly/react-core';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import PauseIcon from '@patternfly/react-icons/dist/esm/icons/pause-icon';
import PlayIcon from '@patternfly/react-icons/dist/esm/icons/play-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import DownloadIcon from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { Application } from '../types';
import { PodKind } from '../k8s-types';
import { fetchApplicationPods, fetchPodsLogs } from '../services/CamelService';

const ApplicationLogViewer: React.FC<{ application: Application, containerName?: string, active?: boolean}> = ({ application, containerName, active }) => {

  const [pods, setPods] = React.useState<PodKind[]>([]);
  const [podNames, setPodNames] = React.useState([]);

  const [content, setContent] = React.useState([]);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isFullScreen] = React.useState(false);
  const [itemCount, setItemCount] = React.useState(1);
  const [currentItemCount, setCurrentItemCount] = React.useState(0);
  const [renderData, setRenderData] = React.useState('');
  const [timer, setTimer] = React.useState(null);
  const [buffer, setBuffer] = React.useState([]);
  const logViewerRef = React.useRef<any>();

  const [isPodDropdownOpen, setIsPodDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setItemCount(1);
      setCurrentItemCount(0);
      window.clearInterval(timer);
    }
  }, [active]);

  React.useEffect(() => {
    if (application && application.metadata) {
      fetchApplicationPods(application.metadata.namespace, application.metadata.name).then((newPods: PodKind[]) => {
        if (newPods) {
          setPods(newPods);
        }
      });
    }
  }, [application]);

  React.useEffect(() => {
    if (pods && pods.length > 0) {
      setPodNames(pods.map(pod => pod.metadata.name));
      fetchPodsLogs(application.metadata.namespace, pods[0].metadata.name, containerName).then(logs => {
        if (logs) {
          setContent(logs.split('\n'));
        }
      });
    }
  }, [pods]);


  React.useEffect(() => {
    if (content.length === 0) {
      return;
    }
    setTimer(
      window.setInterval(() => {
        setItemCount(itemCount => itemCount + 1);
      }, 10)
    );
    return () => {
      window.clearInterval(timer);
    };
  }, [active, content]);


  React.useEffect(() => {
    if (itemCount > content.length) {
      window.clearInterval(timer);
      setBuffer(content);
    } else {
      setBuffer(content.slice(0, itemCount));
    }
  }, [content, itemCount]);

  React.useEffect(() => {
    if (!isPaused && buffer.length > 0) {
      setCurrentItemCount(buffer.length);
      setRenderData(buffer.join('\n'));
      if (logViewerRef && logViewerRef.current) {
        logViewerRef.current.scrollToBottom();
      }
    }
  }, [isPaused, buffer]);


  const onPodSelect = (event) => {
    setIsPodDropdownOpen(false); 
  };

  const onPodToggle = (event) => {
    setIsPodDropdownOpen(!isPodDropdownOpen);
  };


  const onExpandClick = _event => {
  };

  const onDownloadClick = () => {
    const element = document.createElement('a');
    const file = new Blob(content, { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const ControlButton = () => (
    <Button
      variant={isPaused ? 'plain' : 'link'}
      onClick={() => {
        setIsPaused(!isPaused);
      }}
    >
      {isPaused ? <PlayIcon /> : <PauseIcon />}
      {isPaused ? ` Resume Log` : ` Pause Log`}
    </Button>
  );

  const PodSelectionDropdown = () => (
    <ToolbarItem>
      <Select
        onSelect={onPodSelect}
        onToggle={onPodToggle}
        isOpen={isPodDropdownOpen}>
        {podNames && podNames.map(name => <SelectOption key={name} value={name}>{name}</SelectOption>)}
      </Select>
    </ToolbarItem>
  )

  const leftAlignedToolbarGroup = (
    <React.Fragment>
      <ToolbarToggleGroup toggleIcon={<EllipsisVIcon />} breakpoint="md">
        {podNames && podNames.length > 1 && <PodSelectionDropdown />}
        <ToolbarItem variant="search-filter">
          <LogViewerSearch onFocus={_e => setIsPaused(true)} placeholder="Search" />
        </ToolbarItem>
      </ToolbarToggleGroup>
      <ToolbarItem>
        <ControlButton />
      </ToolbarItem>
    </React.Fragment>
  );

  const rightAlignedToolbarGroup = (
    <React.Fragment>
      <ToolbarGroup variant="icon-button-group">
        <ToolbarItem>
          <Tooltip position="top" content={<div>Download</div>}>
            <Button onClick={onDownloadClick} variant="plain" aria-label="Download current logs">
              <DownloadIcon />
            </Button>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <Tooltip position="top" content={<div>Expand</div>}>
            <Button onClick={onExpandClick} variant="plain" aria-label="View log viewer in full screen">
              <ExpandIcon />
            </Button>
          </Tooltip>
        </ToolbarItem>
      </ToolbarGroup>
    </React.Fragment>
  );

  return (
    <>
    {renderData 
        ? <LogViewer id="application-log-viewer"
      data={renderData}
      theme="dark"
      scrollToRow={currentItemCount}
      innerRef={logViewerRef}
      height={isFullScreen ? '100%' : 600}
      isTextWrapped={false}
      hasLineNumbers={true}
      toolbar={
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup>{leftAlignedToolbarGroup}</ToolbarGroup>
          <ToolbarGroup>{rightAlignedToolbarGroup}</ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
    }/>
      : <Spinner aria-label='Loading logs'/>
    }
    </>
  );
};

export default ApplicationLogViewer;
