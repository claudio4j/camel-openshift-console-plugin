import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk';
import { FLAG_OPENSHIFT_CAMEL } from './const';


export const enableCamelPlugin = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_OPENSHIFT_CAMEL, true);
};
