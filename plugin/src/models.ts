import { K8sModel as K8sKind }  from '@openshift-console/dynamic-plugin-sdk';

export const DeploymentModel: K8sKind = {
  label: 'Deployment',
  // t('public~Deployment')
  labelKey: 'public~Deployment',
  apiVersion: 'v1',
  apiGroup: 'apps',
  plural: 'deployments',
  abbr: 'D',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Deployment',
  id: 'deployment',
  labelPlural: 'Deployments',
  // t('public~Deployments')
  labelPluralKey: 'public~Deployments',
};
