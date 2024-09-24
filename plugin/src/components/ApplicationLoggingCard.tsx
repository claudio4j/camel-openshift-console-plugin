import {
  CardTitle,
  CardBody,
  Card,
  ToggleGroupItem,
  ToggleGroup,
  Toolbar,
  ToolbarContent,
  ToolbarToggleGroup,
  ToolbarGroup,
  ToolbarItem,
  Select,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
  Tabs,
  Tab,
  TabContent,
  PageSection,
  TabTitleText,
} from '@patternfly/react-core';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { Table, Tbody, Td, Thead, Tr, Th } from '@patternfly/react-table';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Application } from '../types';
import ApplicationLogViewer from './ApplicationLogViewer';

const ApplicationLoggingCard: React.FC<{application: Application, active?: boolean }> = ({ application, active }) => {

  interface Logger {
    name: string;
    level: string;
  }
  const logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
  const [selected, setSelected] = useState('INFO');
  const [loggers, _] = useState<Logger[]>([{name: 'root', level: 'INFO'}]);

  const [activeTabKey, setActiveTabKey] = useState(0);

  const handleTabClick = (event, tabIndex) => {
    setActiveTabKey(tabIndex);
  };

  useEffect(() => {
  }, [application]);

  //
  // Filtering
  //
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const showClearButton = !!inputValue;
  const showUtilities = showClearButton;
  const clearInput = () => {
    setInputValue('');
  };

  const handleInputChange = (value: string, event: React.FormEvent<HTMLInputElement>) => {
    //get text from event and set it to inputValue
    if (event && event.currentTarget && event.currentTarget.value) {
      setInputValue(event.currentTarget.value);
    } else {
      setInputValue(value);
    }
  };

  const onDelete = () => {

  }

  const onCategoryToggle = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  }

  const onCategorySelect = () => {

  }

  const buildCategoryDropdown = () => {
    const categoryMenuItems = [
      <SelectOption key="name" value="Name">Name</SelectOption>,
      <SelectOption key="level" value="Level">Level</SelectOption>
    ];

    return (
      <ToolbarItem>
        <Select
          onSelect={onCategorySelect}
          onToggle={onCategoryToggle}
          isOpen={isCategoryDropdownOpen}>
          {categoryMenuItems}
        </Select>
      </ToolbarItem>
    );
  }

  const buildFilterDropdown = () => {
    return (
      <TextInputGroup>
        <TextInputGroupMain icon={<SearchIcon />} value={inputValue} onChange={handleInputChange} />
        {showUtilities && (
          <TextInputGroupUtilities>
            {showClearButton && (
              <Button variant="plain" onClick={clearInput} aria-label="Clear button and input">
                <TimesIcon />
              </Button>
            )}
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
    );
  }

  return (
    <Card>
      <CardTitle>Logging</CardTitle>
      <CardBody>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          <Tab eventKey={0} title={<TabTitleText>Logs</TabTitleText>}>
            <TabContent id="0" title="Logs">
              <PageSection variant="light">
                {application && application.metadata &&
                <ApplicationLogViewer application={application} containerName={application.metadata.name} active={active && activeTabKey === 0} /> }
              </PageSection>
            </TabContent>
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>Loggers</TabTitleText>}>
            <TabContent id="1" title="Loggers">
              <Toolbar id="toolbar-with-chip-groups" clearAllFilters={onDelete} collapseListedFiltersBreakpoint="xl">
                <ToolbarContent>
                  <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
                    <ToolbarGroup
                      variant="filter-group"
                      style={{ lineHeight: '22px', alignItems: 'center' } as React.CSSProperties}>
                      {buildCategoryDropdown()}
                      {buildFilterDropdown()}
                    </ToolbarGroup>
                  </ToolbarToggleGroup>
                </ToolbarContent>
              </Toolbar>
              <Table aria-label="Log Level">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Level</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {loggers.map((logger) => (
                    <Tr>
                      <Td>{logger.name}</Td>
                      <Td>
                        <ToggleGroup aria-label="Log levels">
                          {logLevels.map((level) => (
                            <ToggleGroupItem
                              text={level}
                              buttonId={level}
                              isSelected={selected === level}
                              onChange={() => setSelected(level)} />
                          ))}
                        </ToggleGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

            </TabContent>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default ApplicationLoggingCard;
