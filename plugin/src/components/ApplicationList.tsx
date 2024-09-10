import * as React from "react";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
import { Application } from "../types";
import Status from "@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status";
import { Button, Select, SelectOption, Spinner, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, ToolbarToggleGroup } from "@patternfly/react-core";
import { Dropdown, DropdownItem, DropdownToggle } from "@patternfly/react-core/deprecated";
import { EllipsisVIcon, FilterIcon, SearchIcon, TimesIcon } from "@patternfly/react-icons";
import { deleteApplication, deleteApplicationPods } from "../services/CamelService";
interface ApplicationListProps {
  apps: Application[];
}

export const ApplicationList: React.FC<ApplicationListProps> = ({ apps }) => {
  const columnNames = {
    name: 'Name',
    kind: 'Kind',
    namespace: 'Namespace',
    status: 'Status',
    created: 'Created',
    cpu: 'CPU',
    memory: 'Memory',
  };

  const applicationUrl = (app) => `/camel/application/${app.metadata.namespace}/${app.kind}/${app.metadata.name}`

  const [sortedApplications, setSortedApplications] = useState([]);
  const [sortColumn, setSortColumn] = useState("name"); // Default sorting column
  const [sortDirection, setSortDirection] = useState("asc"); // Default sorting direction (ascending)
  const [selectedCategory, setSelectedCategory] = useState("Name");

  const toggleSort = (columnName) => {
    if (sortColumn === columnName) {
      // If the same column is clicked again, reverse the sorting direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If a different column is clicked, update the sort column and set the direction to ascending
      setSortColumn(columnName);
      setSortDirection("asc");
    }
  };

  //
  // Filtering
  //
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState('');
  const showClearButton = !!categoryValue;
  const showUtilities = showClearButton;
  const clearInput = () => {
    setCategoryValue('');
  };

  const onDelete = () => {
  }

  const handleCategoryValueChange = (event, value) => {
    setCategoryValue(value);
  };

  const onCategoryToggle = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  }

  const onCategorySelect = (event, selection) => {
    setSelectedCategory(selection);
    setIsCategoryDropdownOpen(false);
  }

  const filterWithSelection = (app: Application) => {
    if (!(categoryValue && setSelectedCategory)) {
      return true;
    }

    if (selectedCategory === "Name") {
      return app.metadata.name.includes(categoryValue);
    }
    if (selectedCategory === "Namespace") {
      return app.metadata.namespace.includes(categoryValue);
    }
    if (selectedCategory === "Kind") {
      return app.kind.includes(categoryValue);
    }
    return true;
  }

  const buildCategoryDropdown = () => {
    const categoryMenuItems = [
      <SelectOption key="name" value="Name">Name</SelectOption>,
      <SelectOption key="namespace" value="Namespace">Namespace</SelectOption>,
      <SelectOption key="kind" value="Kind">Kind</SelectOption>
    ];

    return (
      <ToolbarItem>
        <Select
          selections={selectedCategory}
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
        <TextInputGroupMain icon={<SearchIcon />} value={categoryValue} onChange={handleCategoryValueChange} />
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


  //
  // Actions dropdown
  //
  const actions = ["Undeploy", "Restart", "Restart in Debug mode"];
  const [openStates, setOpenStates] = useState<boolean[]>(Array(apps.length).fill(false));
  const [selectedActions, setSelectedActions] = useState<string[]>(Array(apps.length).fill("")); // Store selected actions for each row

  // Functions to handle actions menu
  const onToggleActions = (index: number) => {
    const updatedOpenStates = [...openStates];
    updatedOpenStates[index] = !updatedOpenStates[index];
    setOpenStates(updatedOpenStates);
  };


  const onSelectAction = (action: string, index: number) => {
    const updatedSelectedActions = [...selectedActions];
    updatedSelectedActions[index] = action;
    setSelectedActions(updatedSelectedActions);
    setOpenStates(Array(apps.length).fill(false)); // Close all other rows
    const app = apps[index];
    switch (action) {
      case "Undeploy":
        console.log("Undeploying: " + app.metadata.name);
        deleteApplication(app.kind, app.metadata.namespace, app.metadata.name);
        break;
      case "Restart":
        console.log("Restarting: " + app.metadata.name);
        deleteApplicationPods(app.metadata.namespace, app.metadata.name);
        break;
    }
  };


  useEffect(() => {
    const sorted = [...apps].filter(filterWithSelection).sort((a, b) => {
    if (sortColumn === "name") {
      return sortDirection === "asc"
        ? a.metadata.name.localeCompare(b.metadata.name)
        : b.metadata.name.localeCompare(a.metadata.name);
    } else if (sortColumn === "kind") {
      return sortDirection === "asc"
        ? a.kind.localeCompare(b.kind)
        : b.kind.localeCompare(a.kind);
    } else if (sortColumn === "namespace") {
      return sortDirection === "asc"
        ? a.metadata.namespace.localeCompare(b.metadata.namespace)
        : b.metadata.namespace.localeCompare(a.metadata.namespace);
    } else if (sortColumn === "status") {
      const missingReplicasA = a.status.replicas - a.status.readyReplicas;
      const missingReplicasB = b.status.replicas - b.status.readyReplicas;
      return sortDirection === "asc" ? missingReplicasA - missingReplicasB : missingReplicasB - missingReplicasA;
    } else if (sortColumn === "cpu") {
      const cpuA = parseFloat(a.cpu);
      const cpuB = parseFloat(b.cpu);
      return sortDirection === "asc" ? cpuA - cpuB : cpuB - cpuA;
    } else if (sortColumn === "memory") {
      const memoryA = parseFloat(a.memory);
      const memoryB = parseFloat(b.memory);
      return sortDirection === "asc" ? memoryA - memoryB : memoryB - memoryA;
    } else if (sortColumn === "created") {
      const timestampA = new Date(a.metadata.creationTimestamp).getTime();
      const timestampB = new Date(b.metadata.creationTimestamp).getTime();
      return sortDirection === "asc" ? timestampA - timestampB : timestampB - timestampA;
    }
    return 0;
  });
  setSortedApplications(sorted);
  },[apps, sortColumn, sortDirection, setSelectedCategory, categoryValue]);


  return (
    <>
      {apps ? (<>
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

        <Table aria-label="Camel Application List">
          <Thead>
            <Tr>
              <Th
                onClick={() => toggleSort("name")}
                className={sortColumn === "name" ? `sorted ${sortDirection}` : ""}
              >
                {columnNames.name}

                <span className="pf-c-table__sort-indicator"/>
                {sortColumn === "name" && (
                  <span className="sort-icon">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </Th>
              <Th
                onClick={() => toggleSort("kind")}
                className={sortColumn === "kind" ? `sorted ${sortDirection}` : ""}
              >
                {columnNames.kind}

                <span className="pf-c-table__sort-indicator"/>
                {sortColumn === "kind" && (
                  <span className="sort-icon">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </Th>
              <Th
                onClick={() => toggleSort("namespace")}
                className={sortColumn === "namespace" ? `sorted ${sortDirection}` : ""}
              >
                {columnNames.namespace}
                {sortColumn === "namespace" && (
                  <span className="sort-icon">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </Th>
              <Th
                onClick={() => toggleSort("status")}
                className={sortColumn === "status" ? `sorted ${sortDirection}` : ""}
              >
                {columnNames.status}
                {sortColumn === "status" && (
                  <span className="sort-icon">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </Th>
              <Th
                onClick={() => toggleSort("cpu")}
                className={sortColumn === "cpu" ? `sorted ${sortDirection}` : ""}
              >
                {columnNames.cpu}
                {sortColumn === "cpu" && (
                  <span className="sort-icon">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </Th>
              <Th
                onClick={() => toggleSort("memory")}
                className={sortColumn === "memory" ? `sorted ${sortDirection}` : ""}
              >
                {columnNames.memory}
                {sortColumn === "memory" && (
                  <span className="sort-icon">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </Th>
              <Th
                onClick={() => toggleSort("created")}
                className={sortColumn === "created" ? `sorted ${sortDirection}` : ""}
              >
                {columnNames.created}
                {sortColumn === "created" && (
                  <span className="sort-icon">{sortDirection === "asc" ? "▲" : "▼"}</span>
                )}
              </Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedApplications && sortedApplications.filter(app => app.metadata && app.metadata.name && app.metadata.namespace).map((app, index) => (
              <Tr key={app.metadata.name}>
                <Td dataLabel={columnNames.name}>
                  <Link to={applicationUrl(app)}>
                    {app.metadata.name}
                  </Link>
                </Td>
                <Td dataLabel={columnNames.kind}>{app.kind}</Td>
                <Td dataLabel={columnNames.namespace}>{app.metadata.namespace}</Td>
                <Td dataLabel={columnNames.status}><Status title={`${app.status.availableReplicas} of ${app.status.replicas} pods`} status={app.status.availableReplicas === app.status.replicas ? "Succeeded" : "Failed"}/></Td>
                <Td dataLabel={columnNames.cpu}>{app.cpu}</Td>
                <Td dataLabel={columnNames.memory}>{app.memory}</Td>
                <Td dataLabel={columnNames.created}>{calculateTimeDifference(app.metadata.creationTimestamp)} ago</Td>
                <Td dataLabel="Action">
                  <div className="dropdown">
                    <Dropdown
                      onSelect={() => onSelectAction(selectedActions[index], index)}
                      isOpen={openStates[index]}
                      toggle={
                        <DropdownToggle onToggle={() => onToggleActions(index)} aria-label="Action Menu">
                            <EllipsisVIcon />
                        </DropdownToggle>
                      }
                      dropdownItems={actions.map((action) => (
                        <DropdownItem key={action} className="mock">{action}</DropdownItem>
                      ))}
                      />
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        </>)
        : <Spinner aria-label="Loading Camel Applications" />}
      </>
  );
};

function calculateTimeDifference(timestamp: string): string {
  const currentTime = new Date();
  const targetTime = new Date(timestamp);

  // Calculate the time difference in milliseconds
  const timeDifference = currentTime.getTime() - targetTime.getTime();

  // Convert milliseconds to seconds, minutes, hours, and days
  const seconds = Math.floor(timeDifference / 1000) % 60;
  const minutes = Math.floor(timeDifference / (1000 * 60)) % 60;
  const hours = Math.floor(timeDifference / (1000 * 60 * 60)) % 24;
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  // Create a human-readable string
  const durationString = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;

  return durationString;
}

export default ApplicationList;
