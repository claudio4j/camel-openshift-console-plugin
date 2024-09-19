import { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";
import { DeploymentCondition, DeploymentKind, DeploymentConfigKind, PodSpec  } from "k8s-types";

export type Snapshot = {
 name: string;
 x: string;
 y: number;
}

export type Metrics = {
  cpu?: Snapshot[];
  memory?: Snapshot[];
  gcPause?: Snapshot[];
  gcOverhead?: Snapshot[];
};


export type Application = {
  kind? : string;
  cpu?: string;
  memory?: string;
  url?: string;
  metrics?: Metrics;
  spec: PodSpec;
  status?: {
    availableReplicas?: number;
    collisionCount?: number;
    conditions?: DeploymentCondition[];
    observedGeneration?: number;
    readyReplicas?: number;
    replicas?: number;
    unavailableReplicas?: number;
    updatedReplicas?: number;
  };
} & K8sResourceCommon;

export function deploymentToApplication(deployment: DeploymentKind): Application {
  return {
    kind: 'Deployment',
    metadata: {
      ...deployment.metadata,
    },
    spec: {
      ...deployment.spec.template.spec,
    },
    metrics: {
      cpu: [],
      memory: [],
      gcPause: [],
      gcOverhead: [],
    },
    status: {
      ...deployment.status,
    },
  };
};

export function deploymentConfigToApplication(deployment: DeploymentConfigKind): Application {
  return {
    kind: 'DeploymentConfig',
    metadata: {
      ...deployment.metadata,
    },
    spec: {
      ...deployment.spec.template.spec,
    },
    metrics: {
      cpu: [],
      memory: [],
      gcPause: [],
      gcOverhead: [],
    },
    status: {
      ...deployment.status,
    },
  };
};

/* export function cronjobToApplication(cronjob: CronJobKind): Application {
    return {
      kind: 'CronJob',
      metadata: {
        ...cronjob.metadata,
      },
      spec: {
        ...cronjob.spec.jobTemplate.spec,
      },
      metrics: {
        cpu: [],
        memory: [],
        gcPause: [],
        gcOverhead: [],
      },
      status: {
        ...cronjob.status,
      },
    };
  };
   */